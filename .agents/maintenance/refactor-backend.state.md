# refactor-backend — état (réécrit chaque run)

last: 2026-06-30 | theme consolidate world-entities-query bounds + captureWindow — extract `computeRadiusBounds(grid, …)` + `presentCaptureWindow(row)` helpers ; fix N3 (`getVillagesInRadius` maxX/maxY non clamped) + suppression magic `499` au profit de `gridWidth/gridHeight` Prisma ; -5L net service / +57L utils / +7 unit tests ; 543 unit + 22 smokes verts | PR maint(refactor-backend): consolidate world-entities-query bounds and captureWindow helpers
full: `archive/refactor-backend/2026-06-30-full.md`

## OPEN

| ID  | Sev  | Where                                              | Note                                                                                       |
|-----|------|----------------------------------------------------|--------------------------------------------------------------------------------------------|
| R4  | High | crowns.service.ts:261                              | fractional carry — needs migration (`lastUpdateTs += production/rate`)                     |
| W1  | High | combat/combat.worker.ts (1998L)                    | 4 kinds cohabitent — split par kind, L effort                                              |
| B1  | Med  | combat.service.ts                                  | 1471L sans spec unit direct (smokes uniquement)                                            |
| L3  | Low  | rankings.service.ts:26                             | import `resolveRankingsConfig` cross-service helper inside other service file              |
| U1  | Low  | combat.worker.ts:1489-1498, 1743-1759, return.worker.ts:326-340 | inbox.create/upsert loop ×N → `createMany skipDuplicates` (ROI bas)                |
| D2  | Low  | gameplay/{upgrade-building,recruit-troops,recruit-noble}.use-case.ts | Promise.all quintette — divergence trop grande, ROI bas, garder en obs |
| L2  | Low  | strategy/village-strategy.service.ts:389-457       | `getStrategyRecommendations` strings UI FR hard-codées + endpoint sans consumer front      |
| C1  | Low  | resources.service.ts:46-56                         | `getResources` récursif (cosmétique, récursion bornée 1)                                   |
| F1  | Low  | combat.worker.ts:1130-1170                         | 2× garrison.findMany include similaire                                                     |
| T1  | Low  | retention.service.ts:401-416                       | `$transaction` qui n'enveloppe qu'un updateMany — inutile                                  |
| K1  | Low  | retention.service.ts:212-241                       | `create` + catch P2002 (vs upsert utilisé `ensureDailyCardInTransaction`) — asymétrie       |
| K2  | Low  | retention.service.ts:37 + DTO `backlogLimit`       | `DAILY_CARD_LIMIT = 1` magic, jamais utilisé pour limiter, exposé sans consumer front      |
| Z1  | Low  | world/join-world.use-case.ts:188                   | `process.env[key]` dynamique — `ConfigService` ferait mieux                                |
| P1  | Low  | world.service.ts:32-49                             | `getWorlds` 2 round-trips (worlds + groupBy memberships) au lieu d'`_count` include        |
| H2  | Low  | production.worker.ts:76, crown-production.worker.ts:76 | `for of villages` séquentiel (OK <10k, sinon batch)                                    |
| E1  | Low  | event/event.utils.ts                               | `createOutboxEvent` raw vs `OutboxPublisher.<kind>` typé — sweep progressif                |
| V2  | Low  | retention.service.ts:294-301                       | backfill currentDayKey post-midnight Paris non commenté                                    |
| X1  | Low  | village.controller.ts:132 /village/strategy/recommendations | endpoint sans consumer front (candidat suppression, breaking surface)              |

## Skip — déjà traité

- U3 + N3 + N4 + F (world-entities-query bounds & captureWindow) → ce run
- N5–N15 (display-name dup) → 2026-06-26
- W2c (initiate{Attack,Scout,Reinforce} skeleton consolidation) → 2026-06-25
- W5 + W6 (construction post-tx correctness + structured swallow logs) → 2026-06-22 (2)
- W3 + W4 (registerQueueWorker helpers + construction emoji logs) → 2026-06-22 (1)
- Q1 (Array.isArray defensive unwrap) → absorbé par helper W3
- W2a/W2b done run 2026-06-20 | S1 done run 2026-06-21 | D3 PR #153 | D1 PR #144 | D4 PR #142 | OB1/OB2 PR #134
- B3/E1/U2 déjà traités | G1 intentionnel tx | U4 false-positive | A1 case-insensitive pre-check OK
