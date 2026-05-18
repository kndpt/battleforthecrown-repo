# Balance & tempo — guide pratique d'édition

> Guide ops pour modifier les **durées, coûts et productions** du jeu. Ici on parle **fichiers, commandes, workflow**. Pour la philosophie du pivot compressed-async, la sémantique du multiplier et les garde-fous (ce qui ne doit JAMAIS être scalé), voir [`docs/gameplay/23-world-tempo-and-multipliers.md`](../gameplay/23-world-tempo-and-multipliers.md).

## TL;DR — deux niveaux

```
Niveau 1 — Valeurs absolues (code, packages/shared/)
        ↓ « ce que vaut le jeu à tempo = 1.0 »
Niveau 2 — Multipliers tempo (DB, world.config)
        ↓ « on accélère/ralentit ce monde, axis par axis »
                Valeur effective IG
```

- **Itérer pour trouver les bons ratios → Niveau 2** (un seul JSON, rollback trivial).
- **Calibrer définitivement les défauts → Niveau 1** (absorber le ratio dans les constantes, remettre tempo à 1.0).

## Niveau 1 — Constantes absolues (`packages/shared/`)

Source de vérité « à `tempo.global = 1.0` ». Ces chiffres sont **les valeurs de référence** pour la calibration MVP — la spec gameplay les documente, le code les implémente.

| Domaine | Fichier | Symbole | Spec |
|---|---|---|---|
| Production ressources / heure (niv 1-10) | `packages/shared/src/resources/production.ts` | `RESOURCE_PRODUCTION_PER_HOUR` | [`02-economy-and-progression.md`](../gameplay/02-economy-and-progression.md) |
| Coût + temps de construction par bâtiment / niveau | `packages/shared/src/village/buildings.ts` | `BUILDING_DEFINITIONS` (champ `timeSeconds`) | [`03-buildings.md`](../gameplay/03-buildings.md) |
| Bonus Château décroissant (lvl 1 → 10) | `packages/shared/src/village/buildings.ts:425` | `CASTLE_CONSTRUCTION_SPEED_BONUS` | [`03-buildings.md`](../gameplay/03-buildings.md) |
| Coût + temps de recrutement par unité | `packages/shared/src/army/unit.ts` | `UNIT_COSTS` (champ `time`) | [`08-units.md`](../gameplay/08-units.md) |
| Mobilité par unité (échelle 10-100+, haut = rapide) | `packages/shared/src/army/unit.ts` | `UNIT_STATS` (champ `speed`) | [`08-units.md`](../gameplay/08-units.md) |
| Vitesse de référence trajet (1 tuile/min à `speed = REFERENCE_SPEED`) | `packages/shared/src/logic/travel-time.ts` | `REFERENCE_SPEED` | [`04-combat.md`](../gameplay/04-combat.md) |
| Bonus stratégies de village | `packages/shared/src/village/strategy.ts` | `DEFAULT_VILLAGE_STRATEGY` | [`12-village-styles.md`](../gameplay/12-village-styles.md) |

> ⚠️ **Garde-fous** : avant de modifier une constante, vérifie qu'elle n'est pas dans la liste des invariants intouchables ([doc 23 § 6](../gameplay/23-world-tempo-and-multipliers.md#6-garde-fous--ce-que-les-multipliers-ne-touchent-jamais)) : ratios attaque/défense, coûts pop, ratios mobilité entre unités, wall-clock humain (bouclier 48 h…).

### Workflow d'édition Niveau 1

```bash
# 1. Éditer la constante dans packages/shared/src/...
# 2. Rebuild le package shared
yarn workspace @battleforthecrown/shared build

# 3. Redémarrer le backend (il recharge shared au boot)
# 4. Côté front : Vite HMR rafraîchit automatiquement
```

> Le backend lit les constantes au runtime depuis le bundle `shared`. Sans rebuild → le runtime ment.

## Niveau 2 — Multipliers tempo (`world.config`)

Source de vérité : colonne `config` (JSONB) de la table `world` en DB. Schéma Zod strict défini dans `packages/shared/src/world/schemas.ts`. Résolution par axe : `packages/shared/src/world/tempo.ts` (`TempoService.applyDuration` × valeur · `applyRate` ÷ valeur).

**Catalogue complet des 8 axes + sémantique + bornes raisonnables** : [doc 23 § 5](../gameplay/23-world-tempo-and-multipliers.md#5-multipliers-exposés-via-worldconfigtempo).

### Workflow d'édition Niveau 2 (recommandé pour itérer)

**Option A — éditer le seed (persistant)**

1. Éditer `battleforthecrown-backend/prisma/seed-default-world-config.sql`, sections `tempo.global` ou `tempo.overrides.*`.
2. Ré-appliquer sur la DB locale :
   ```bash
   docker exec -i battleforthecrown-postgres \
     psql -U postgres -d battleforthecrown \
     < battleforthecrown-backend/prisma/seed-default-world-config.sql
   ```
3. Effet immédiat sur **toute nouvelle action** (construction lancée après le seed, expédition envoyée après…). Les jobs déjà planifiés conservent leur durée calculée à l'instant T.

**Option B — UPDATE direct (one-shot rapide)**

```sql
UPDATE world
SET config = jsonb_set(
  config,
  '{tempo,overrides,constructionSpeed}',
  '0.5'::jsonb
)
WHERE id = 'default';
```

### Rappel sémantique (lire la doc 23 pour le détail)

| Axe | Type | `0.5` =  | `2.0` = |
|---|---|---|---|
| `constructionSpeed`, `unitTrainingSpeed`, `lordTrainingSpeed`, `travelSpeed`, `captureWindow` | durée (×) | 2× plus rapide | 2× plus lent |
| `resourceProduction`, `crownsYield`, `barbarianRegen` | débit (÷) | 2× plus de prod | 2× moins de prod |

Convention unifiée : **petit = jeu plus rapide**, partout. Le code applique `×` ou `÷` selon l'axe via `TempoService`. Voir [doc 23 § 5.1.1](../gameplay/23-world-tempo-and-multipliers.md#511-sémantique-du-multiplier--règle-unique).

### Garde-fou Zod

Le schéma `TempoOverridesSchema` est `strictObject` : une clé inconnue ou une valeur ≤ 0 fait planter le backend au boot (`InternalServerErrorException: World … has an invalid config`). C'est voulu — un seed invalide ne passe jamais en silence.

## Quand toucher quoi

| Situation | Niveau à toucher |
|---|---|
| « Je teste si les constructions devraient être 30 % plus rapides » | **Niveau 2** : `tempo.overrides.constructionSpeed = 0.7`, ré-appliquer le seed. |
| « Je veux que la production de fer de niveau 5 passe de 760/h à 900/h » | **Niveau 1** : éditer `RESOURCE_PRODUCTION_PER_HOUR[5]` et rebuild shared. |
| « Tout le jeu est trop lent, divise par 2 partout » | **Niveau 2** : `tempo.global = 0.5`, virer les overrides. |
| « J'ai trouvé mes ratios après playtest, je veux les figer comme défaut » | Absorber dans **Niveau 1** (multiplier les `timeSeconds`/`time`/`PER_HOUR` par le tempo trouvé), remettre **Niveau 2** à 1.0. |
| « Je veux changer combien d'or rapporte un raid » | **Niveau 1** : invariant d'équilibrage (lootFactor dans `world.config.combat`), pas un tempo. |

## Points d'application dans le code (référence)

Pour lecteurs qui veulent comprendre où chaque axe est consommé :

| Axe | Consommé dans |
|---|---|
| `constructionSpeed` | `WorldConfigService.getCost()` — `world-config.service.ts:66-76` |
| `resourceProduction` | `WorldConfigService.getProductionRate()` — `world-config.service.ts:79-93` |
| `travelSpeed` | `WorldConfigService.getTravelTime[ForArmy]()` — `world-config.service.ts:118-174` |
| `unitTrainingSpeed` / `lordTrainingSpeed` | `RecruitTroops` / `RecruitNoble` use-cases — `gameplay/recruit-*.use-case.ts` |
| `barbarianRegen` | `BarbarianRuntimeService` — `world/barbarian-runtime.service.ts` |
| `crownsYield` | `CrownsService` — `crowns/crowns.service.ts` |
| `captureWindow` | `CombatWorker` — `combat/combat.worker.ts` |

Tous passent par `TempoService.applyDuration` ou `applyRate` (jamais l'opérateur en direct dans les use-cases — c'est la règle [doc 23 § 5.1.1](../gameplay/23-world-tempo-and-multipliers.md#511-sémantique-du-multiplier--règle-unique)).

## Liens

- [`docs/gameplay/23-world-tempo-and-multipliers.md`](../gameplay/23-world-tempo-and-multipliers.md) — spec design : philosophie, sémantique, catalogue, garde-fous.
- [`db-setup.md`](./db-setup.md) — bootstrap Postgres + Prisma, snippets SQL.
- [`decisions.md` § ADR-12](./decisions.md) — décision compressed-async + tempo world-scoped.
