# 07 — Templates barbares dans `shared` référencent des types fantômes

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `packages/shared`
**Tags** : dead-code, contract, gameplay

## Symptôme

Le fichier `packages/shared/src/world/barbarian-templates.ts` définit des templates de villages barbares qui référencent des **building types et unit types qui n'existent nulle part** dans les enums maîtres du shared.

**Investigation Phase A confirmée** : ces templates sont **activement consommés** par `battleforthecrown-backend/src/modules/world/barbarian-seeding.service.ts:417, 440, 450`. Ce n'est donc pas du dead code. Les villages barbares créés en DB contiennent des bâtiments `type='HQ'` et des unités `unitType='SPEAR'` que le reste du système ne reconnaît pas (production de ressources, stats de combat, sprites Pixi, etc.).

## Localisation

- `packages/shared/src/world/barbarian-templates.ts:22-84` — templates `BARBARIAN_TIER_TEMPLATES`.

Types référencés dans les templates mais **non définis** :

**Bâtiments fantômes** (utilisés ligne 24, 43, 65) :
- `'HQ'`
- `'STABLE'`
- `'WORKSHOP'`

**Unités fantômes** (utilisés lignes 33-80) :
- `'SPEAR'`
- `'SWORD'`
- `'AXEMAN'`
- `'LIGHT_CAVALRY'`
- `'HEAVY_CAVALRY'`
- `'RAM'`

À comparer avec les enums maîtres :

- `packages/shared/src/village/buildings.ts:1-12` — `BUILDING_TYPES` = `CASTLE | WOOD | STONE | IRON | WAREHOUSE | HIDEOUT | FARM | BARRACKS | WATCHTOWER | WALL`.
- `packages/shared/src/army/types.ts:1-10` — `UNIT_TYPES` = `MILITIA | SQUIRE | ARCHER | CAVALRY | TEMPLAR | CATAPULT | SPY | NOBLE`.

Aucun chevauchement.

## Détail technique

Trois hypothèses non exclusives :

1. **Dead code** : ces templates ont été écrits tôt, le design d'unités/bâtiments a évolué, personne n'a nettoyé.
2. **Feature en attente** : un système d'unités/bâtiments "barbares" différents des joueurs était prévu, jamais implémenté.
3. **Oubli de migration** : les types ont été renommés dans les enums (par exemple `SPEAR → MILITIA`) sans propager dans les templates.

À vérifier :
- Le backend `BarbarianSeedingService` consomme-t-il réellement ces templates ? Si oui, comment il gère les types inconnus (crash ? fallback silencieux ? mapping caché ?).
- `git log` sur le fichier peut indiquer son historique.

## Impact

- **Risque crash** : si le backend instancie un village barbare à partir de ces templates et tente de créer un building `HQ`, ça plantera (Prisma reject `enum BuildingType` violation, ou mapping côté code crash).
- **Confusion** : un nouveau dev qui lit `barbarian-templates.ts` peut croire que `HQ`/`SPEAR` sont des types valides et les utiliser.
- **Tests / typage** : `Record<string, number>` pour units (cf [ticket 09](./09-backend-relaxed-typing.md)) ne détecte pas ce mismatch au compile-time.
- **Audit shared** : zone d'incertitude qui empêche d'affirmer "le shared est solide".

## Contexte

Le rapport shared note que ces templates ont l'air de "feature en attente". Le backend a probablement ses propres mappings (à confirmer en lecture du code de seeding) qui contournent ou ignorent ces templates.

## Pistes à explorer

- **Lire `BarbarianSeedingService` en détail** pour vérifier si les templates sont effectivement consommés.
- Si non consommés : supprimer le fichier (et confirmer que rien d'autre dans le repo ne l'importe).
- Si consommés via un mapping : extraire le mapping, ou aligner les types templates ↔ enums maîtres, et durcir le typage (`Record<UnitType, number>` au lieu de `Record<string, number>`).
- Si feature future : créer un ticket gameplay produit, geler le fichier avec un commentaire `@deprecated until <date / décision>`.

## Décision validée

(2026-05-06, par l'utilisateur — option B "uniformiser sur les types joueurs")

**Abandonner la différenciation barbares/joueurs au niveau des types**. Les barbares utilisent les mêmes `BUILDING_TYPES` et `UNIT_TYPES` que les joueurs ; la différenciation se fait via les **compositions** (quels bâtiments / quelles unités, en quelle quantité, à quel niveau) et non via des types distincts.

Mapping suggéré (à affiner par l'agent suivant en cohérence avec le design unités/bâtiments joueurs) :

- `HQ` → `CASTLE`
- `STABLE`, `WORKSHOP` → à statuer (probablement supprimer ces lignes de template, ou les remapper sur `BARRACKS` selon l'intention)
- `SPEAR` → `MILITIA`
- `SWORD` → `SQUIRE`
- `AXEMAN`, `LIGHT_CAVALRY`, `HEAVY_CAVALRY` → choisir parmi `ARCHER` / `CAVALRY` / `TEMPLAR` selon la difficulté souhaitée par tier
- `RAM` → `CATAPULT`

Une fois fait :
- Durcir le typage : `BuildingTemplate.type: BuildingType`, `UnitTemplate.type: UnitType`.
- Mettre à jour `barbarian-tier-templates.spec.ts`.
- Vérifier que la création des villages barbares produit désormais des entités cohérentes avec le reste du système (stats combat, sprites, prod ressources).

L'agent suivant doit **planifier l'implémentation** : finaliser le mapping, lister les fichiers impactés (templates + tests + éventuels ajustements de difficulté).

## Résolution effective (2026-05-06)

L'investigation post-décision a montré que le code path effectif diverge du diagnostic initial :

- `BarbarianSeedingService` a été refactoré (factory pattern) — les références `path:line` du ticket sont obsolètes ; c'est désormais `BarbarianVillageFactory.create()` qui consomme les templates.
- `combat.worker.ts:486` (`buildBarbarianDefender`) met `units: {}` explicitement, et `BarbarianVillageStrategy.resolve` confirme `// Barbarians have no troops`. ⇒ Les `UnitInventory` des BV ne sont **jamais lus** en combat.
- Les types fantômes côté bâtiments (`HQ/STABLE/WORKSHOP`) étaient silencieusement ignorés en aval (production de ressources, power score → fallback `?? 5`).
- **Bug latent supplémentaire identifié** : `conquest.service.ts:115` ("Buildings stay intact") laissait les bâtiments fantômes dans le village conquis. Conséquences : pas de `CASTLE` (donc bonus de vitesse de construction cassé via `upgrade-building.use-case.ts:72,97`), power score faussé.

### Divergence assumée vs option B (validée le matin)

L'option B "remapper SPEAR → MILITIA, etc." spéculait sur une feature future. Étant donné que les unités barbares sont **pure dette** (dead writes), l'option retenue à l'implémentation est :

- **Bâtiments** : remappés strictement (`HQ → CASTLE`, suppression de `STABLE/WORKSHOP` — pas d'analogue chez le joueur ; BARRACKS lvl 4-7 couvre déjà CAVALRY/TEMPLAR/CATAPULT).
- **Unités** : **suppression complète** (`UnitTemplate`, `getUnitTemplate`, `tx.unitInventory.createMany` dans la factory). Si v2 ajoute des troupes barbares, elles seront ajoutées à ce moment-là avec les types maîtres directement.
- **Typage** : `BuildingTemplate.type: BuildingType` ⇒ garde compile-time qui interdit la régression.

### Migration des données existantes

DB locale, exécutée en transaction atomique :

```sql
UPDATE building SET type='CASTLE'
  WHERE type='HQ' AND village_id IN (SELECT id FROM village WHERE is_barbarian=true);
DELETE FROM building
  WHERE type IN ('STABLE','WORKSHOP') AND village_id IN (SELECT id FROM village WHERE is_barbarian=true);
DELETE FROM unit_inventory
  WHERE village_id IN (SELECT id FROM village WHERE is_barbarian=true);
```

État avant : 32 HQ + 27 STABLE + 21 WORKSHOP + 160 unit_inventory rows (SPEAR/SWORD/AXEMAN/LIGHT_CAVALRY/HEAVY_CAVALRY/RAM) — tous sur BV, **aucun village joueur conquis avant fix** ⇒ pas de data orpheline côté joueurs. État après : 0 type fantôme, 0 unit_inventory pour BV.

### Vérifications de sortie

- ✅ Tous les types référencés dans `shared` existent dans les enums maîtres (`BUILDING_TYPES`).
- ✅ Templates typés strict (`BuildingTemplate.type: BuildingType`).
- ✅ Garde compile-time effective : `tsc -p packages/shared` rejetterait toute réintroduction d'un type hors `BUILDING_TYPES`.
- ✅ Tests `barbarian-tier-templates.spec.ts` mis à jour, incluant un test paramétré qui assert que **tous** les types des 3 tiers appartiennent à `BUILDING_TYPES`.

## Tickets liés

- [09 — Typage relâché backend](./09-backend-relaxed-typing.md) — `Record<string, number>` permet ce drift.
- [16 — Magic numbers](./16-magic-numbers-hardcoded.md) — les valeurs dans les templates pourraient être des magic numbers à externaliser.

## Dimensions à valider en sortie

- Tous les types référencés dans `shared` existent dans les enums maîtres, OU le fichier est explicitement supprimé.
- Les templates barbares (s'ils restent) sont typés strict (`Record<UnitType, number>`).
- Une garde compile-time empêche de réintroduire un type fantôme.
