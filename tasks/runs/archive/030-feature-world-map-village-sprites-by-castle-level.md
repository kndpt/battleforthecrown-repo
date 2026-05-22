# Run #030 — feature-world-map-village-sprites-by-castle-level

> **Statut** : DONE
> **Démarré** : 2026-05-22 14:35 CEST
> **Terminé** : 2026-05-22 14:49 CEST

## Cible

- **Phase roadmap** : Hors roadmap — polish UX WorldMap (cf. archive [`27-barbarian-tier-sprites-redesign`](../archive/27-barbarian-tier-sprites-redesign.md) qui a posé l'équivalent côté barbares).
- **Spec source** : Pas de spec dédiée. Référence implicite : [`docs/gameplay/03-buildings.md` § Château](../../docs/gameplay/03-buildings.md) (niveaux 1..10).
- **Type** : `feature`
- **Modules backend** : `world-entities` (query qui sert `/world/:worldId/entities`) — exposer `castleLevel` brut sur le DTO village joueur. Pas de migration DB (le level Château est déjà persisté).
- **Modules shared** : `packages/shared` — nouvel helper pur `villageVisualTierFromCastleLevel(level: number): 1..6` + (selon arbitrage 2) helper de résolution d'asset `villageSpriteAssetForCastleLevel(level)`. **Le mapping vit dans shared** parce que d'autres features (HUD, inbox, panels, minimap) afficheront aussi le bon sprite de village et doivent consommer la même source de vérité.
- **Modules frontend** : `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts` (sprite resolver), `battleforthecrown-pixi/src/pixi/assets/manifest.ts` (preload des 6 sprites), `battleforthecrown-pixi/src/features/world/buildMapEntities.ts`, `battleforthecrown-pixi/src/api/world-types.ts`. Évaluer aussi `WorldMiniMap.tsx` et `SelectedEntityPanel.tsx` pour cohérence visuelle.

## Dépendances

- Aucune dépendance bloquante. Archive [`63-foreign-players-invisible-on-world-map`](../archive/63-foreign-players-invisible-on-world-map.md) a déjà migré la query entities sur la table canonique `Village` ; les niveaux de bâtiments sont accessibles via la relation Village → buildings.
- Cohabitation à respecter avec archive [`65-own-vs-foreign-villages-map-distinction`](../archive/65-own-vs-foreign-villages-map-distinction.md) (palette d'ownership) et [`61-active-village-map-indicator`](../archive/61-active-village-map-indicator.md) (halo doré pulsé sur village actif).

## Critère de fin (acceptance)

- [ ] `villageVisualTierFromCastleLevel(level: number): 1..6` existe dans `packages/shared`, exporté et testé unitairement (bornes 1, 10, hors-bornes, mapping complet).
- [ ] Le DTO `/world/:worldId/entities` expose le `castleLevel` (1..10) sur les villages joueurs, sans N+1 (vérifier via plan d'exécution ou logs Prisma).
- [ ] Sur `WorldMapScene`, un village Château 1 affiche `village-tier1.png` ; un village Château 10 affiche `village-tier6.png` ; les paliers intermédiaires suivent le mapping retenu (Piste A ou Piste B — à trancher au refinement).
- [ ] Les 6 textures `village-tier1.png` … `village-tier6.png` sont préchargées via `manifest.ts` (pas de pop visuel au premier render).
- [ ] Reconciliation Pixi : sur level-up Château (refresh ou event WS), le sprite swap **sans** recréer l'entité (zIndex, halo doré du village actif, ring d'ownership préservés).
- [ ] La distinction visuelle mes villages vs étrangers (cf. archive 65) reste lisible par-dessus le sprite tier.
- [ ] `yarn static-check` vert. Tests unit shared verts. Tests backend pertinents verts.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Arbitrages à trancher à l'étape 1 (clarification)

1. **Mapping niveau Château (1..10) → tier sprite (1..6)** : choisir entre Piste A (douce) et Piste B (early variety).

   | Niveau Château | Piste A — douce | Piste B — early variety |
   |---:|:---:|:---:|
   | 1 | T1 | T1 |
   | 2 | T1 | T2 |
   | 3 | T2 | T3 |
   | 4 | T2 | T4 |
   | 5 | T3 | T4 |
   | 6 | T3 | T5 |
   | 7 | T4 | T5 |
   | 8 | T5 | T6 |
   | 9 | T6 | T6 |
   | 10 | T6 | T6 |

   - Piste A : progression régulière, T6 réservé endgame, feedback visuel échelonné.
   - Piste B : le joueur voit son village évoluer visuellement plus tôt (récompense onboarding), plateau visuel mid/late.

2. **Backend expose `castleLevel` brut OU `visualTier` déjà mappé ?**
   Recommandation : exposer `castleLevel` brut, faire vivre le mapping dans `packages/shared` (consommé côté front Pixi + HUD + autres représentations). Un seul endroit où changer la courbe si playtest demande un rééquilibrage.

3. **Propagation temps-réel d'un level-up Château** : push WS dédié ou poll/refresh existant suffit ?
   Recommandation : si l'event `village.updated` (ou équivalent) repush déjà l'entité après upgrade, ne rien ajouter — le sprite se mettra à jour au prochain payload. Sinon, tolérer la latence du poll WorldMap (level-up Château est rare, pas critique temps-réel).

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] Shared : ajouter `villageVisualTierFromCastleLevel(level): 1..6`, l'exporter et couvrir le mapping Piste A depuis un test consommateur.
- [x] Backend : enrichir les DTO villages joueurs avec `castleLevel` depuis la relation `Village.buildings` filtrée sur `CASTLE`, sans requête par village.
- [x] Front Pixi : propager `castleLevel` dans `MapEntity`, résoudre l'alias `world.village.tN`, préserver la reconciliation existante.
- [x] Realtime/cache : invalider `myVillages` + `worldEntities` quand une construction `CASTLE` se termine.
- [x] Vérifications finales : review indépendante, smokes backend, `yarn static-check`, archive + commit.

## Progress (rempli pendant le run)

- [x] Préflight : `git status` clean, fiche run lue, règles repo + `SPEC.md` + doc Château lues.
- [x] Cartographie : `WorldEntitiesQueryService`, `VillageService`, `world-types`, `WorldMapScene`, manifest et tests existants inspectés.
- [x] Implémentation : shared/backend/frontend modifiés.
- [x] Tests ciblés : shared build, tests Pixi ciblés, preflight smoke, type-check backend, type-check Pixi après correction.
- [x] Review indépendante : premier verdict `BLOCK` (fichiers non trackés + `orderBy` CASTLE), corrections appliquées, re-review `GO`.
- [x] Hard gates finaux : `static-check` vert, smoke backend complet vert.

## Décisions prises

- Mapping retenu : Piste A (`1,1,2,2,3,3,4,5,6,6`) pour rester aligné avec la courbe Château L1-L10 et réserver T6 au late game.
- Backend : expose `castleLevel` brut uniquement ; le mapping visuel reste dans `packages/shared`.
- Propagation level-up : pas de nouvel event WS. L'event existant `building.completed` invalide les feeds carte quand `buildingType === 'CASTLE'`.
- Review : ajout d'un `orderBy` défensif sur la relation `buildings` CASTLE (`level desc`, `createdAt asc`) pour éviter une sélection arbitraire si des doublons DB existent.

## Rapport final

Livré :

- Helper shared `villageVisualTierFromCastleLevel(level): 1..6`, exporté depuis `@battleforthecrown/shared/world`, mapping Piste A.
- DTO villages joueurs enrichis avec `castleLevel` depuis la relation `Village.buildings` filtrée sur `CASTLE`, sans requête par village.
- Front Pixi : `MapEntity.castleLevel`, résolution `world.village.tN`, swap de texture par reconciliation existante.
- Cache/realtime : `building.completed` et mutation upgrade Château invalident `myVillages` + `worldEntities`.
- Tests : mapping helper, propagation `castleLevel`, invalidation Château, smoke `vision` enrichi.

Docs : aucun changement nécessaire, raison : la mécanique gameplay Château existe déjà dans `docs/gameplay/03-buildings.md`; ce run ajoute un mapping visuel d'implémentation dont la source durable est le helper shared + la fiche archivée.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Helper shared testé — `rtk yarn workspace battleforthecrown-pixi test --run src/features/world/villageVisuals.test.ts src/features/world/buildMapEntities.test.ts src/api/ws-bindings.test.ts src/pixi/assets/manifest.test.ts` → 4 fichiers, 39 tests passés.
  - [x] DTO entities expose `castleLevel` — `rtk yarn workspace battleforthecrown-backend test:smoke:run vision.smoke.spec.ts` → smoke enrichi vérifie `castleLevel: 10` sur un village joueur visible.
  - [x] `yarn static-check` vert — `rtk yarn static-check` → OK.
  - [x] Sprite correct sur WorldMapScene — `visuel` → résolution `castleLevel 10 -> world.village.t6` couverte par test helper ; rendu final à confirmer IG.
- **Review indépendante** : `Déclenchée (raison: a — back+front simultané, contrat DTO traversant shared)` — premier verdict `BLOCK`, findings résolus ; re-review `GO`.
- **Tests automatisés** :
  - `rtk yarn workspace @battleforthecrown/shared build` → OK.
  - `rtk yarn workspace battleforthecrown-pixi type-check` → OK.
  - `rtk yarn workspace battleforthecrown-backend type-check` → OK.
  - `rtk yarn workspace battleforthecrown-pixi test --run src/features/world/villageVisuals.test.ts src/features/world/buildMapEntities.test.ts src/api/ws-bindings.test.ts src/pixi/assets/manifest.test.ts` → 39 tests passés.
  - `rtk yarn static-check` → OK.
- **Smokes lancés** : `rtk yarn test:smoke` → 23 suites, 46 tests passés.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/vision.smoke.spec.ts` — scénario player village visible enrichi pour vérifier `castleLevel`.
- **QA fonctionnelle agent** : smoke REST réel via `vision.smoke.spec.ts` ; vérification SQL/log Prisma dédiée N+1 non lancée, mais la query utilise un `findMany` avec relation filtrée et le smoke confirme le payload.
- **Tests IG à faire par le user** :
  - Ouvrir la WorldMap sur un compte avec un village Château 1 → confirmer affichage `village-tier1.png`.
  - Upgrader le Château jusqu'à un palier qui change de tier (selon mapping retenu) → confirmer swap visible.
  - Repérer un village d'un joueur étranger sur la carte → confirmer que la distinction d'ownership (ticket 65) reste lisible par-dessus le sprite tier.
  - Vérifier que le halo doré du village actif (ticket 61) cohabite correctement avec le nouveau sprite.
