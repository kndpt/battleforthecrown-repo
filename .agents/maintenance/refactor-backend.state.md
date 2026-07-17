# refactor-backend — état (réécrit chaque run)

last: 2026-07-17 | theme W1b (Med/M) — **fin décompo god-worker** `combat.worker.ts`. Extraction des 2 derniers handlers d'arrivée non-combat → collaborateurs dédiés (pattern W1a/`ScoutArrivalService`) : `combat/caravan-arrival.service.ts` (`CaravanArrivalService.handleArrival` — déps `ResourcesService`+`OutboxPublisher`) + `combat/reinforcement-arrival.service.ts` (`ReinforcementArrivalService.handleArrival` + privé `bounceReinforcementFromCaptureWindow` — **zéro dép injectée**). Type `ReturnJobToSchedule` sorti → `combat/interfaces/return-job.interface.ts`. Worker : dispatch CARAVAN/REINFORCE délègue, 3 méthodes privées suppr (−408L, 1760→1352), **dép `ResourcesService` retirée du constructeur** (OutboxPublisher gardée, encore utilisée par applyLootToDefender) + 5 imports scope-only suppr. `tx` toujours passé (même tx Serializable, zéro changement comportement/event/ordre). static-check ok, 610 back verts, smokes caravan+cross-player-reinforcement+reinforcements+combat-reports-inbox+recall-en-route 16/16 (boot Nest → DI 2 services validée, chemins extraits exercés e2e). Docs backend-modules.md maj (file-tree + flow étapes 2/6).
full: `archive/refactor-backend/2026-07-17-full.md`

## OPEN

| ID  | Sev  | Where                                              | Note                                                                                       |
|-----|------|----------------------------------------------------|--------------------------------------------------------------------------------------------|
| R4  | High | crowns.service.ts:261                              | fractional carry — needs migration (`lastUpdateTs += production/rate`). **Candidat #1 next run** (seul High restant) |
| B1  | Med  | combat.service.ts (1634L)                          | sans spec unit direct (smokes uniquement ; policy interdit mock Prisma)                    |
| TE1 | Low  | combat.service:754/978/1000, combat.worker:1269/1298, initiate-extraction:181 | `Object.entries(units)` brut vs `typedEntries` — cosmétique (retire cast, ~6 sites) |
| G2  | Med  | gameplay/extraction-lifecycle.service.ts (783L)    | looks-bad-but-fine : ADR-12 déclare explicitement « tout ici »                            |
| SU1 | Low  | combat-resolution.ts:247 + initiate-extraction:60  | `sumUnits`/`escortTotal` dup — seulement 2 sites back (reste dans shared, hors scope)      |
| BR1 | Low  | barbarian-runtime.service:63, training.worker:61   | même upsert que CU1 mais divergent (accumulation / cast string) → hors CU1                  |
| E1  | Low  | 16 fichiers, 60 callsites `createOutboxEvent`      | low-value : createOutboxEvent déjà typé (générique K), migration = churn                   |
| U1  | Low  | combat.worker.ts, return.worker.ts:326             | inbox.create loop ×N → `createMany skipDuplicates` (ROI bas, ≤2 recipients)               |
| L2  | Low  | strategy/village-strategy.service.ts:382+          | `getStrategyRecommendations` strings UI FR hard-codées + endpoint sans consumer front      |
| C1  | Low  | resources.service.ts:44-56                         | `getResources` récursif (cosmétique, récursion bornée 1)                                   |
| K2  | Low  | retention.service.ts:42 + DTO `backlogLimit`       | `DAILY_CARD_LIMIT = 1` magic, jamais utilisé pour limiter, exposé sans consumer front      |
| Z1  | Low  | world/join-world.use-case.ts:188                   | `process.env[key]` dynamique — `ConfigService` ferait mieux                                |
| H2  | Low  | production.worker.ts, crown-production.worker.ts   | `runResilientBatch` séquentiel (OK <10k villages/players, sinon batch parallèle)           |
| X1  | Low  | village.controller.ts:132 /village/strategy/recommendations | endpoint sans consumer front (candidat suppression, breaking surface)              |

## Skip — déjà traité

- W1b (extraction caravan+reinforcement arrival → `combat/caravan-arrival.service.ts` + `combat/reinforcement-arrival.service.ts` ; décompo arrival-handlers du god-worker **terminée**) → ce run
- W1a (extraction scout arrival → `combat/scout-arrival.service.ts`) → 2026-07-16
- DUP-REPORT (base abstraite `combat/inbox-report.service.ts` → fusion caravan+reinforcement inbox CRUD) → 2026-07-15
- DUP-PLANNER (fusion planners capture-window → `event-outbox-notification-planner.planCaptureWindowAttackerRouted`) → 2026-07-14 (#300)
- CU1 (credit UnitMap → UnitInventory → `combat/unit-inventory.creditUnitsToInventory`) → 2026-07-13
- L3 (rankings config resolver + Glory signals → `rankings/rankings-config.utils`) → 2026-07-12 (#289)
- UA1 (unit-availability guard → `combat/unit-availability`) → 2026-07-11 (#285)
- AF1 (resource-affordability guard → `shared/resources.hasSufficientResources`) → 2026-07-10 (#281)
- P5 (combat population release → `combat/population-release`) → 2026-07-09 (#277)
- RC1 + RC2 (warehouse-capped resource credit → `shared/resources.creditResourcesCapped`) → 2026-07-08 (#272)
- BT1 + BT2 (resilient batch loop → `queue-worker.helper.runResilientBatch`) → 2026-07-07 (#267)
- CD1 (dedup helper carry-capacity → `combat.utils.sumCarryCapacity`) → 2026-07-06 (#262)
- PR1 (village production-rate projection consolidation) → 2026-07-05 (#256)
- F1 (defender garrison loading consolidation) → 2026-07-04 (#248)
- K1 + T1 + V2 (retention helpers consolidation) → 2026-07-03 (#243)
- RS1–RS3 (report-service fetch guards) → 2026-07-02 (#239) | P1–P4 (WorldService `_count`) → 2026-07-01 (#232)
- U3 + N3 + N4 + F (world-entities-query bounds) → 2026-06-30 (#227) | N5–N15 (display-name dup) → 2026-06-26
- W2c → 2026-06-25 | W5+W6 → 2026-06-22 | W3+W4 (+Q1) → 2026-06-22 | W2a/W2b → 2026-06-20 | S1 → 2026-06-21
- D3 #153 | D1 #144 | D4 #142 | OB1/OB2 #134 | B3/E1/U2 done | G1 tx intentionnel | U4 false-positive
- O1 = latent | WL1 = looks-bad-but-fine (tx-count) | A1 case-insensitive pre-check OK
