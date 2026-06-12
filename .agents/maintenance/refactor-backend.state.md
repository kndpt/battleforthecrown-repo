# refactor-backend — état (réécrit chaque run)

last: 2026-06-12 | sha `0b03b4f` | theme C7+C8 caravan | PR maint/refactor-backend/caravan-return-race-dedup
full: `archive/refactor-backend/2026-06-12-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| B3 | Med | event-outbox.service.ts ~600 | N+1 `getUserIdByVillage`, ~22 sites |
| R4 | High | crowns.service.ts ~264 | fractional carry — needs migration |
| R3 | Med | retention.service.ts | class + 14 util exports |
| D4 | Med | combat.service.ts | `expedition.create` ×4 |
| D5 | Med | combat.worker.ts | garrison loop dup |
| G1 | Med | combat.service.ts ~986 | sequential kingdom power snapshot |
| N3 | Low | world-entities-query.service.ts ~101 | radius clamp missing |
| C6 | Low | resources.service.ts:50 | recursive getResources, cosmetic |
| V3 | Low | combat.service.ts ~480 | caravan deduct order cosmetic |
| A1 | Low | auth.service.ts:36 | redundant displayName pre-check |

## skip unless theme

N4 join-world logger.debug | deferred themes in last full report
