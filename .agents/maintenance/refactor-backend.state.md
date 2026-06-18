# refactor-backend — état (réécrit chaque run)

last: 2026-06-18 | theme D4 shared findBuildingByType/getBuildingLevel | PR maint(refactor-backend): centralize buildings.find by type
full: `archive/refactor-backend/2026-06-18-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| R4 | High | crowns.service.ts ~264 | fractional carry — needs migration |
| W1 | Med | combat/combat.worker.ts | 1776 L, 4 kinds cohabitent — split par kind L effort |
| W2 | Med | combat/combat.service.ts | 1287 L, 4 initiate* partagent loadOwnedVillage→verify→timing→create — extraction possible |
| D1 | Low | strategy/village-strategy.service.ts:316–380 | getStrategyBonus switch 6 contextes → table possible |
| D2 | Low | gameplay/{upgrade-building,recruit-troops,recruit-noble}.use-case.ts | Promise.all quintette répété ×3 |
| D3 | Low | resources.service.ts:233–269 | fetchBuildingRates triple WOOD/STONE/IRON — table |
| U1 | Low | combat.worker.ts ~1488,1747 | inbox.create loop ×N — createMany possible (ROI bas) |
| U3 | Low | world-entities-query.service.ts:125,192 | fetchBarb/Player partagent bounds+capture-window |
| U4 | Low | resources.service.ts:88,205 | applyStrategyStorageBonus dupliqué ×2 |
| G1 | Med | combat.service.ts ~986 | sequential kingdom power snapshot — intentionnel tx |
| N1 | Low | combat.worker.ts:1209–1321 | applyDefenderLosses 113 L — complexité inhérente |
| N3 | Low | world-entities-query.service.ts ~101 | radius clamp missing |
| C1 | Low | resources.service.ts:50 | recursive getResources, cosmetic |
| A1 | Low | auth.service.ts:36 | redundant displayName pre-check |
| F1 | Low | combat.worker.ts ~1130,1165 | garrison.findMany include ×2 cosmetic |
| Z1 | Low | world/join-world.use-case.ts:188 | process.env[key] lecture dynamique — config service ferait mieux |

## skip unless theme

D4 ce run | OB1/OB2 traité PR #134 | B3/E1/U2 déjà traités runs précédents | G1 intentionnel (tx safety)
