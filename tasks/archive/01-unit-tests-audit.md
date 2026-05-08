# 01 — Audit des tests unitaires (garder, fixer, supprimer)

**Statut** : ✅ Résolu le 2026-05-08
**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-backend`, `battleforthecrown-pixi`
**Tags** : tests, dette, signal/bruit

## Résolution

Approche **hybride asymétrique** retenue, puis durcie après lecture du ticket 02 (smoke tests). Politique cible : **logique pure uniquement** côté unit, l'orchestration / I/O passe par les smokes.

**Phase 1** — `loot.manager.spec.ts` réparé (3 tests : fixtures alignées sur `UNIT_STATS` shared, `config.units.stats` était dead code que `calculateLoot` ne lit pas — il appelle `getUnitStats()`). `production.worker.spec.ts` supprimé entier (27 tests de mock-théâtre).

**Phase 2** — 18 fichiers supplémentaires supprimés selon le critère *"si je supprime ce test, est-ce que la couverture smoke (réelle DB + WS) le remplace ?"* :

- **7 workers** (`combat.worker`, `return.worker`, `barbarian-backfill.worker`, `construction.worker`, `training.worker`, `outbox.worker`, `crown-production.worker`) — orchestration Prisma + pg-boss, smokes les couvriront end-to-end.
- **2 controllers** (`app.controller`, `world.controller`) — Nest scaffolding / fog wiring (la vraie logique fog est dans `vision.service.spec`).
- **9 services** (`auth`, `combat.service`, `conquest`, `event-outbox`, `game.gateway`, `barbarian-seeding`, `village-placement`, `world.service`, `upgrade-building.use-case`) — Prisma orchestration via `$transaction` mocks. Smokes hit la vraie DB.

**Conservés (7 fichiers)** — formules / strategies / Zod, edge-cases que les smokes ne couvrent pas :

- `combat.utils` (casualty math), `combat-strategies` (formules combat), `combat.dto` (Zod), `loot.manager` (capacity / loot factor), `barbarian-tier-templates` (tier lookup), `world-config.service` (cost / production / travel formulas), `vision.service` (fog of war geometry).

**Phase 3** — politique formalisée dans [`battleforthecrown-backend/.claude/rules/nest-conventions.md`](../battleforthecrown-backend/.claude/rules/nest-conventions.md) : interdiction explicite des patterns `*.worker.spec.ts` / `*.controller.spec.ts` / specs services qui mockent Prisma. Critère de tranchage documenté.

**Métriques** : 26 → 7 fichiers spec, 302 → 89 tests, 7 cassés → 0. Build vert.

**Contrat avec ticket 02** : les smokes futurs **doivent** couvrir les flows des fichiers supprimés (production tick, construction, training, combat resolution, return, outbox dispatch, conquest, JWT auth, fog of war wiring, upgrade building). Cf. [`02-smoke-tests-strategy.md`](./02-smoke-tests-strategy.md) pour le détail du contrat.

## Contexte

Le repo a accumulé une couverture de tests unitaires hétérogène. Pendant l'audit (résolution de plusieurs tickets), on a constaté que certains tests sont restés cassés sans que personne ne les répare — indicateur que ces tests ne sont plus consultés, ou que leur valeur n'est pas claire pour l'équipe.

Avant de pousser une stratégie de tests smoke (ticket 02) ou de CI (ticket 03), il faut faire le tri sur l'existant : qu'est-ce qu'on garde, qu'est-ce qu'on fixe, qu'est-ce qu'on supprime.

## État actuel

### Backend — Jest

```
Test Suites: 2 failed, 24 passed, 26 total
Tests:       7 failed, 295 passed, 302 total
```

**Fichiers cassés (7 tests pré-existants à l'audit)** :

- `src/modules/combat/loot/loot.manager.spec.ts` — 3 tests `calculateLoot` :
  - Les fixtures injectent un `config.units.stats` custom avec `MILITIA.carryCapacity = 50`, mais le code lit depuis `UNIT_CATALOG.stats` (shared) où `MILITIA.carryCapacity = 25`. Test obsolète depuis que `UNIT_CATALOG` est devenu source unique.
- `src/workers/production.worker.spec.ts` — 4 tests `handleProductionTick` :
  - Failures de type "Expected village1, false / Received village1" — fixtures qui ne reflètent plus la signature actuelle du worker.

**Fichiers OK (24 fichiers / 295 tests)** : `world-config.service.spec`, `combat/strategies/*.spec`, `village.service.spec`, `auth.service.spec`, etc.

### Pixi — Vitest

```
Test Files  12 passed (12)
     Tests  65 passed (65)
```

12 fichiers, 65 tests, 100 % verts. Couverture variée :
- `api/client.test.ts`, `api/ws-bindings.test.ts`
- `lib/cn.test.ts`, `lib/interpolation.test.ts`, `lib/useZodForm.test.ts`
- `pixi/entities/expeditionMath.test.ts`, `pixi/scenes/villageLayout.test.ts`, `pixi/assets/manifest.test.ts`
- `stores/expeditions.test.ts`, `stores/worldMap.test.ts`
- `features/village/constructionProgress.test.ts`, `features/world/buildMapEntities.test.ts`

## Question à trancher

**Pour les 7 tests backend cassés** : on les fixe (effort) ou on les supprime (signal honnête : "ils n'ont jamais resservi") ?

Si on les fixe :
- `loot.manager.spec.ts` : remplacer le `config.units.stats` custom par un mock direct de `UNIT_CATALOG`, ou aligner les valeurs du test sur les valeurs réelles. ~30 min.
- `production.worker.spec.ts` : refaire les fixtures pour qu'elles matchent la signature actuelle de `handleProductionTick`. ~1 h.

Si on les supprime :
- Acter qu'ils ne couvrent rien d'utile (les services qu'ils testent sont bien couverts par les autres tests verts + les E2E une fois ressuscités, cf. ticket 02).

**Pour les 295 tests qui passent** : audit qualité (mocks excessifs, tests tautologiques) ou on les laisse vivre tels quels ?

## Pistes

### A. Réparation pure (bottom-up)

- Fixer les 7 tests, garder tout, audit qualité ultérieur.
- Avantage : on perd rien ; couverture chiffrée stable.
- Risque : les tests réparés sont peut-être déjà obsolètes — on perpétue de la dette.

### B. Suppression franche + filet smoke

- Supprimer les 7 tests cassés ; garder les 295 verts ; bétonner les flows critiques via tests smoke (cf. ticket 02).
- Avantage : signal honnête, moins de bruit, focus sur le vrai filet (smoke + E2E).
- Risque : si un de ces 7 tests couvrait un edge-case rare, on le perd silencieusement.

### C. Tri par valeur

- Pour chaque test cassé : décider individuellement (lecture ~1 min par test).
- Pour les 295 verts : pareil mais plus rapide (échantillonnage par fichier).
- Avantage : précision chirurgicale.
- Risque : effort important (~3-4 h cumulé), faible ROI si on supprimera ensuite la majorité.

## Dimensions à valider en sortie

- Décision tranchée par le user : A, B, C ou hybride.
- Si suppression : journaliser dans le commit message **ce qui était couvert** (pour mémoire future).
- `yarn test` (backend + pixi) tous verts ou avec une whitelist documentée.
- Pas de tests `skip()` traînants sans justification.

## Tickets liés

- [02 — Smoke tests strategy](./02-smoke-tests-strategy.md) — la décision dépend de ce qu'on prévoit de faire en couverture E2E/smoke.
- [03 — CI strategy](./03-ci-strategy.md) — un test cassé est tolérable localement, bloquant en CI.
