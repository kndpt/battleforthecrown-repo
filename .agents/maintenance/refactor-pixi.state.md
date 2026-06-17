# refactor-pixi — état (réécrit chaque run)

last: 2026-06-17 | theme ws-invalidation-consistency-sent-events | branch `claude/focused-galileo-vrhyf9`
full: `archive/refactor-pixi/2026-06-17-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C1 | High | resources.ts + crowns.ts | Dual source of truth Zustand vs TanStack Query — design decision needed |
| E1 | High | caravanLaunchState.ts | Pure state calculator, 6 validation flags, zero tests |
| E2 | High | profileViewModel.ts:413L | Large transform module, zero tests |
| E3 | High | VillageViewSectionHelpers.ts | 4 pure functions untested |
| B1 | Med | ArmyScreen.tsx:637L | 8 useState, 5+ concerns — partial extraction done (useGarrisonSelection) |
| D1 | Low | WorldMapScene.ts:759L | Background layer extraction (~200L) |
| C2 | Low | SpecializedBuildingDetailModal ~640L | organized, low risk |
| D4 | Low | queries.ts 60_000 staleTime | optimistic OK, server replaces <1s |
| F2 | Low | DailyRetentionWidget:301 | hardcoded expiresInValue="04h00"; needs backend resetAt in DTO |
| J3 | Low | villageTierFromPower | test gap — debt candidate |

## CLOSED this run

| ID | Fix |
|----|-----|
| F01 | applyBattleSent: added armyInventory + population invalidation |
| F02 | applyScoutSent: added armyInventory + population invalidation |
| F03 | Added 5 new test describe blocks: applyBattleSent, applyScoutSent, applyScoutReported, applyScoutReturned, applyExpeditionReturned |
