# refactor-backend — état (réécrit chaque run)

last: 2026-06-20 | theme W2 attack target resolution unified onto `resolveTargetVillage` + `snapshotDefenderKingdomPowers` returns derived `primaryValue` | PR maint(refactor-backend): unify attack target resolution with scout helper
full: `archive/refactor-backend/2026-06-20-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| R4 | High | crowns.service.ts ~264 | fractional carry — needs migration |
| W1 | Med | combat/combat.worker.ts | 1776 L, 4 kinds cohabitent — split par kind L effort |
| W2c | Med | combat.service.ts | initiateScout/Reinforce share loadOwned→verify→timing→create→event→schedule; further unification possible but bodies still diverge enough (ownership rules, kind-specific payload) — needs a template-shaped helper |
| D2 | Low | gameplay/{upgrade-building,recruit-troops,recruit-noble}.use-case.ts | Promise.all quintette répété ×3 — postponed: PR #157 rewrites recruit-troops prologue |
| U1 | Low | combat.worker.ts ~1488,1747 | inbox.create loop ×N — createMany possible (ROI bas) |
| U3 | Low | world-entities-query.service.ts:125,192 | fetchBarb/Player partagent bounds+capture-window |
| G1 | Med | combat.service.ts ~986 | sequential kingdom power snapshot — intentionnel tx |
| N1 | Low | combat.worker.ts:1209–1321 | applyDefenderLosses 113 L — complexité inhérente |
| N3 | Low | world-entities-query.service.ts ~101 | radius clamp missing (max not clamped to 499) |
| C1 | Low | resources.service.ts:55 | recursive getResources, cosmetic |
| A1 | Low | auth.service.ts:36 | redundant displayName pre-check |
| F1 | Low | combat.worker.ts ~1130,1165 | garrison.findMany include ×2 cosmetic |
| Z1 | Low | world/join-world.use-case.ts:188 | process.env[key] lecture dynamique — config service ferait mieux |

## skip unless theme

W2a/W2b done this run | D3 done PR #153 | D1 PR #144 | D4 PR #142 | OB1/OB2 PR #134 | B3/E1/U2 déjà traités | G1 intentionnel (tx safety) | U4 false-positive (centralisé OK)
