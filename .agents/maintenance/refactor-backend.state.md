# refactor-backend — état (réécrit chaque run)

last: 2026-06-14 | theme R3 retention-utils | PR #109 maint/refactor-backend/retention-utils
full: `archive/refactor-backend/2026-06-14-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| R4 | High | crowns.service.ts ~264 | fractional carry — needs migration |
| D4 | Med | combat.service.ts | `expedition.create` ×5 |
| G1 | Med | combat.service.ts ~986 | sequential kingdom power snapshot |
| O2 | Low | onboarding.service.ts:191 | getOnboardingProjection fn pure dans service (même pattern R3) |
| N3 | Low | world-entities-query.service.ts ~101 | radius clamp missing |
| C6 | Low | resources.service.ts:50 | recursive getResources, cosmetic |
| V3 | Low | combat.service.ts ~480 | caravan deduct order cosmetic |
| A1 | Low | auth.service.ts:36 | redundant displayName pre-check |
| F1 | Low | combat.worker.ts | garrison.findMany include ×2 cosmetic |

## skip unless theme

B3/E1 → PR #91 mergée | G1 intentionnel (tx safety) | D4 no factory value
