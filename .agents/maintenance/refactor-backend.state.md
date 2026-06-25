# refactor-backend — état (réécrit chaque run)

last: 2026-06-25 | theme combat.service.ts `createOutboundExpedition` helper — consolide timing + tx.expedition.create entre initiateAttack/Scout/Reinforce ; extraData typed via `Partial<Omit<ExpeditionUncheckedCreateInput, /* base */>>` ; ordre tx-local préservé (create → outbox → side-effect → schedule) ; 25 smokes combat ✅ | PR maint(refactor-backend): consolidate outbound expedition creation helper
full: `archive/refactor-backend/2026-06-25-full.md`

## OPEN

| ID  | Sev  | Where                                              | Note                                                                                       |
|-----|------|----------------------------------------------------|--------------------------------------------------------------------------------------------|
| R4  | High | crowns.service.ts:261                              | fractional carry — needs migration (`lastUpdateTs += production/rate`)                     |
| W1  | High | combat/combat.worker.ts (1869L)                    | 4 kinds cohabitent — split par kind, L effort                                              |
| B1  | Med  | combat.service.ts                                  | 1362L sans spec unit direct (smokes uniquement)                                            |
| U1  | Low  | combat.worker.ts:1489-1498, 1743-1759, return.worker.ts:326-340 | inbox.create/upsert loop ×N → `createMany skipDuplicates` (ROI bas)                |
| U3  | Low  | world-entities-query.service.ts:137-315            | fetchBarb/fetchPlayer partagent bounds + captureWindow mapping                             |
| D2  | Low  | gameplay/{upgrade-building,recruit-troops,recruit-noble}.use-case.ts | Promise.all quintette — divergence trop grande, ROI bas, garder en obs |
| N3  | Low  | world-entities-query.service.ts:113-116            | `getVillagesInRadius` ne clamp pas max=499 (asymétrique vs `getEntitiesInRadius`)          |
| N4  | Low  | world-entities-query.service.ts:117-127            | `getVillagesInRadius`/`getAllVillages` renvoient rows raw (no `kind`) — surface confuse    |
| L2  | Low  | strategy/village-strategy.service.ts:389-457       | `getStrategyRecommendations` strings UI FR hard-codées dans le service                     |
| C1  | Low  | resources.service.ts:46-56                         | `getResources` récursif (cosmétique, récursion bornée 1)                                   |
| F1  | Low  | combat.worker.ts:1130-1170                         | 2× garrison.findMany include similaire                                                     |
| T1  | Low  | retention.service.ts:401-416                       | `$transaction` qui n'enveloppe qu'un updateMany — inutile                                  |
| K1  | Low  | retention.service.ts:212-241                       | `create` + catch P2002 (vs upsert utilisé `ensureDailyCardInTransaction`) — asymétrie       |
| K2  | Low  | retention.service.ts:37                            | `DAILY_CARD_LIMIT = 1` magic, jamais utilisé pour limiter                                  |
| Z1  | Low  | world/join-world.use-case.ts:188                   | `process.env[key]` dynamique — `ConfigService` ferait mieux                                |
| P1  | Low  | world.service.ts:32-49                             | `getWorlds` 2 round-trips (worlds + groupBy memberships) au lieu d'`_count` include        |
| H2  | Low  | production.worker.ts:76, crown-production.worker.ts:76 | `for of villages` séquentiel (OK <10k, sinon batch)                                    |
| E1  | Low  | event/event.utils.ts                               | `createOutboxEvent` raw vs `OutboxPublisher.<kind>` typé — sweep progressif                |
| V2  | Low  | retention.service.ts:294-301                       | backfill currentDayKey post-midnight Paris non commenté                                    |

## Skip — déjà traité

- W2c (initiate{Attack,Scout,Reinforce} skeleton consolidation) → ce run
- W5 + W6 (construction post-tx correctness + structured swallow logs) → run 2026-06-22 (2)
- W3 + W4 (registerQueueWorker helpers + construction emoji logs) → run 2026-06-22 (1)
- Q1 (Array.isArray defensive unwrap) → absorbé par le helper W3
- W2a/W2b done run 2026-06-20 | S1 done run 2026-06-21 | D3 PR #153 | D1 PR #144 | D4 PR #142 | OB1/OB2 PR #134
- B3/E1/U2 déjà traités | G1 intentionnel tx | U4 false-positive | A1 case-insensitive pre-check OK
