# refactor-backend — état (réécrit chaque run)

last: 2026-06-15 | theme O2 onboarding.utils | PR #125 maint(refactor-backend): extract onboarding pure utils
full: `archive/refactor-backend/2026-06-15-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| R4 | High | crowns.service.ts ~264 | fractional carry — needs migration |
| D4 | Med | combat.service.ts | `expedition.create` ×5 — no factory value (reconfirmé) |
| G1 | Med | combat.service.ts ~986 | sequential kingdom power snapshot — intentionnel tx |
| U1 | Med | combat.worker.ts ~1488,1747 | inbox.create loop ×N — `createMany` possible (~2 recipients/exp, ROI bas) |
| U2 | Low | combat.worker.ts ~1441,1700,1514 | village findUnique snapshot dupliqué ≥3× |
| U3 | Low | world-entities-query.service.ts:125,192 | fetchBarb/Player partagent bounds+capture-window |
| U4 | Low | resources.service.ts:88,205 | applyStrategyStorageBonus via strategyConfig dupliqué ×2 |
| N3 | Low | world-entities-query.service.ts ~101 | radius clamp missing (getVillagesInRadius asymétrique) |
| C6 | Low | resources.service.ts:50 | recursive getResources, cosmetic |
| V3 | Low | combat.service.ts ~480 | caravan deduct order cosmetic |
| A1 | Low | auth.service.ts:36 | redundant displayName pre-check (P2002 handler couvre) |
| F1 | Low | combat.worker.ts ~1442 | garrison.findMany include ×2 cosmetic |

## skip unless theme

B3/E1 → PR #91 mergée | G1 intentionnel (tx safety) | D4 no factory value reconfirmé
