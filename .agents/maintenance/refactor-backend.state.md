# refactor-backend — état (réécrit chaque run)

last: 2026-06-12 | sha `0c9f43b` | theme B3 outbox batch | PR kndpt/outbox-village-batch-lookup-9d5c
full: `archive/refactor-backend/2026-06-12-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| D4 | Med | combat.service.ts ~163 | expedition.create ×4 |
| D5 | Med | combat.worker.ts | garrison loop dup |
| G1 | Med | combat.service.ts ~956 | sequential kingdom power snapshot |
| R3 | Med | retention.service.ts | class + 14 util exports |
| R4 | High | crowns.service.ts ~264 | fractional carry — needs migration |
| N3 | Low | world-entities-query.service.ts ~95 | radius clamp missing |
| C6 | Low | resources.service.ts:50 | recursive getResources, cosmetic |
| V3 | Low | combat.service.ts ~480 | caravan deduct order cosmetic |
| A1 | Low | auth.service.ts:36 | redundant displayName pre-check |
| N4 | Low | join-world.use-case.ts:177 | logger.log → debug |

## skip unless theme

deferred themes in last full report
