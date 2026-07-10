# refactor-backend — état (réécrit chaque run)

last: 2026-07-10 | theme AF — single-home resource-affordability guard. Nouveau helper pur `hasSufficientResources(current, cost)` dans `shared/resources/storage.ts` (à côté de `creditResourcesCapped`). 4 guards inline 3-ressources (`wood< || stone< || iron<`) consolidés : recruit-troops, recruit-noble, upgrade-building, combat caravan (message custom conservé). village-strategy exclu (guard atomique `gte`). +4 cas spec shared. 579 back + 985 pixi + 17 smokes (caravan/recruit-noble/army-training/construction) verts. static-check ok.
full: `archive/refactor-backend/2026-07-10-full.md`

## OPEN

| ID  | Sev  | Where                                              | Note                                                                                       |
|-----|------|----------------------------------------------------|--------------------------------------------------------------------------------------------|
| R4  | High | crowns.service.ts:261                              | fractional carry — needs migration (`lastUpdateTs += production/rate`)                     |
| W1  | High | combat/combat.worker.ts (2038L)                    | 4 kinds cohabitent — split par kind, L effort                                              |
| B1  | Med  | combat.service.ts (1653L)                          | sans spec unit direct (smokes uniquement)                                                  |
| G2  | Med  | gameplay/extraction-lifecycle.service.ts (783L)    | 8 handlers dans un service — split candidat quand stabilisé (neuf run 091)                 |
| AF2 | Low  | pixi caravanLaunchState.ts:58 + VillageStyleModal  | front duplique guard affordabilité — faire consommer `hasSufficientResources` (front scope) |
| E1  | Low  | 16 fichiers, 60 callsites `createOutboxEvent`      | REQUALIFIÉ low-value : createOutboxEvent déjà typé (générique K), migration = churn        |
| L3  | Low  | rankings.service.ts:26                             | import `resolveRankingsConfig` cross-service helper inside other service file              |
| U1  | Low  | combat.worker.ts:1478+, return.worker.ts:326       | inbox.create loop ×N → `createMany skipDuplicates` (ROI bas, ≤2 recipients)               |
| L2  | Low  | strategy/village-strategy.service.ts:382+          | `getStrategyRecommendations` strings UI FR hard-codées + endpoint sans consumer front      |
| C1  | Low  | resources.service.ts:44-56                         | `getResources` récursif (cosmétique, récursion bornée 1)                                   |
| K2  | Low  | retention.service.ts:42 + DTO `backlogLimit`       | `DAILY_CARD_LIMIT = 1` magic, jamais utilisé pour limiter, exposé sans consumer front      |
| Z1  | Low  | world/join-world.use-case.ts:188                   | `process.env[key]` dynamique — `ConfigService` ferait mieux                                |
| H2  | Low  | production.worker.ts, crown-production.worker.ts   | `runResilientBatch` séquentiel (OK <10k villages/players, sinon batch parallèle)           |
| X1  | Low  | village.controller.ts:132 /village/strategy/recommendations | endpoint sans consumer front (candidat suppression, breaking surface)              |

## Skip — déjà traité

- AF1 (resource-affordability guard → `shared/resources.hasSufficientResources`) → ce run
- P5 (combat population release → `combat/population-release.releasePopulationForLosses`) → 2026-07-09 (#277)
- RC1 + RC2 (warehouse-capped resource credit → `shared/resources.creditResourcesCapped`) → 2026-07-08 (#272)
- BT1 + BT2 (resilient batch loop → `queue-worker.helper.runResilientBatch`) → 2026-07-07 (#267)
- CD1 (dedup helper carry-capacity → `combat.utils.sumCarryCapacity`) → 2026-07-06 (#262)
- PR1 (village production-rate projection consolidation) → 2026-07-05 (#256)
- O1 requalifié _latent, pas actif_ → 2026-07-05
- F1 (defender garrison loading consolidation) → 2026-07-04 (#248)
- K1 + T1 + V2 (retention helpers consolidation) → 2026-07-03 (#243)
- RS1 + RS2 + RS3 (report-service fetch guards alignment on caravan pattern) → 2026-07-02 (#239)
- P1 + P2 + P3 + P4 (WorldService `_count` include consolidation) → 2026-07-01 (#232)
- U3 + N3 + N4 + F (world-entities-query bounds & captureWindow) → 2026-06-30 (#227)
- N5–N15 (display-name dup) → 2026-06-26
- W2c (initiate{Attack,Scout,Reinforce} skeleton consolidation) → 2026-06-25
- W5 + W6 (construction post-tx correctness + structured swallow logs) → 2026-06-22 (2)
- W3 + W4 (registerQueueWorker helpers + construction emoji logs) → 2026-06-22 (1)
- Q1 (Array.isArray defensive unwrap) → absorbé par helper W3
- W2a/W2b done 2026-06-20 | S1 done 2026-06-21 | D3 PR #153 | D1 PR #144 | D4 PR #142 | OB1/OB2 PR #134
- B3/E1/U2 déjà traités | G1 intentionnel tx | U4 false-positive | A1 case-insensitive pre-check OK
- WL1 (world-lifecycle loops) = looks-bad-but-fine (tx-count, pas resilient batch)
