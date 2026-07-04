# refactor-backend — état (réécrit chaque run)

last: 2026-07-04 | theme F1 — consolidation defender garrison loading dans `combat.worker.ts`. Ajout `loadDefenderGarrisons` + `assembleDefenderParticipants` dans `garrison-merge.utils.ts` (colocalisé avec `GarrisonWithStrategy` + `mergeGarrisonsIntoParticipants`). Supprime la duplication `buildBarbarianDefender` / `buildPlayerDefender` (15 lignes × 2). Diff +56/-34, comportement inchangé. 554 unit + 9 smokes ciblés (combat-attack + reinforcements + barbarians) verts.
full: `archive/refactor-backend/2026-07-04-full.md`

## OPEN

| ID  | Sev  | Where                                              | Note                                                                                       |
|-----|------|----------------------------------------------------|--------------------------------------------------------------------------------------------|
| R4  | High | crowns.service.ts:261                              | fractional carry — needs migration (`lastUpdateTs += production/rate`)                     |
| W1  | High | combat/combat.worker.ts (2020L)                    | 4 kinds cohabitent — split par kind, L effort                                              |
| B1  | Med  | combat.service.ts                                  | 1477L sans spec unit direct (smokes uniquement)                                            |
| E1  | Med  | 12 fichiers, ~35 callsites `createOutboxEvent`     | migration progressive vers `OutboxPublisher` typé (5 kinds couverts)                       |
| O1  | Med  | event/outbox-publisher.service.ts:43               | `resourcesChanged` lit `getProductionRates` via `this.prisma` (pas tx) → stale read possible si tx vient de muter buildings/strategy |
| L3  | Low  | rankings.service.ts:26                             | import `resolveRankingsConfig` cross-service helper inside other service file              |
| U1  | Low  | combat.worker.ts:1478-1487, 1732-1748, return.worker.ts:326-340 | inbox.create/upsert loop ×N → `createMany skipDuplicates` (ROI bas, ≤2 recipients) |
| D2  | Low  | gameplay/{upgrade-building,recruit-troops,recruit-noble}.use-case.ts | Promise.all quintette — divergence trop grande, ROI bas, garder en obs |
| L2  | Low  | strategy/village-strategy.service.ts:389-457       | `getStrategyRecommendations` strings UI FR hard-codées + endpoint sans consumer front      |
| C1  | Low  | resources.service.ts:46-56                         | `getResources` récursif (cosmétique, récursion bornée 1)                                   |
| K2  | Low  | retention.service.ts:42 + DTO `backlogLimit`       | `DAILY_CARD_LIMIT = 1` magic, jamais utilisé pour limiter, exposé sans consumer front      |
| Z1  | Low  | world/join-world.use-case.ts:188                   | `process.env[key]` dynamique — `ConfigService` ferait mieux                                |
| H2  | Low  | production.worker.ts:63, crown-production.worker.ts:76 | `for of villages` séquentiel (OK <10k, sinon batch)                                    |
| X1  | Low  | village.controller.ts:132 /village/strategy/recommendations | endpoint sans consumer front (candidat suppression, breaking surface)              |

## Skip — déjà traité

- F1 (defender garrison loading consolidation) → ce run
- K1 + T1 + V2 (retention helpers consolidation) → 2026-07-03
- RS1 + RS2 + RS3 (report-service fetch guards alignment on caravan pattern) → 2026-07-02
- P1 + P2 + P3 + P4 (WorldService `_count` include consolidation) → 2026-07-01
- U3 + N3 + N4 + F (world-entities-query bounds & captureWindow) → 2026-06-30
- N5–N15 (display-name dup) → 2026-06-26
- W2c (initiate{Attack,Scout,Reinforce} skeleton consolidation) → 2026-06-25
- W5 + W6 (construction post-tx correctness + structured swallow logs) → 2026-06-22 (2)
- W3 + W4 (registerQueueWorker helpers + construction emoji logs) → 2026-06-22 (1)
- Q1 (Array.isArray defensive unwrap) → absorbé par helper W3
- W2a/W2b done run 2026-06-20 | S1 done run 2026-06-21 | D3 PR #153 | D1 PR #144 | D4 PR #142 | OB1/OB2 PR #134
- B3/E1/U2 déjà traités | G1 intentionnel tx | U4 false-positive | A1 case-insensitive pre-check OK
