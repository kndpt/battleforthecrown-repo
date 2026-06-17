# refactor-pixi — état (réécrit chaque run)

last: 2026-06-17 | theme ws-invalidation-consistency-phase3 | PR #138 `claude/focused-galileo-862jvm`
full: `archive/refactor-pixi/2026-06-17-phase3-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| F05 | Low | queries.ts:191,198,210,286 | 4 queries missing explicit staleTime (worlds, publicWorlds, myMemberships, myVillages) |
| F06 | Med | VillageView.tsx:530L | 11 useState, 10 queries — still heavy after VillageHero extraction |
| F07 | Med | ArmyScreen.tsx:637L | 8 useState, 4 concerns |
| F08 | Med | WorldMapScene.ts:759L | entities+fog+expeditions+camera+input in one file |
| F09 | Low | WorldMapScene, ArmyScreen, queries.ts | High-LOC prod files without tests |
| F10 | Low | audio/, crowns/, resources/ dirs | Feature dirs with zero tests |
| C1 | Note | resources.ts + crowns.ts | Dual Zustand/TQ — intentional interpolation pattern, not a violation |
| E1 | High | caravanLaunchState.ts | Pure state calculator, zero tests |
| E2 | High | profileViewModel.ts | Large transform module, zero tests |
| B1 | Med | ArmyScreen.tsx | 8 useState, 5+ concerns |
| D4 | Low | queries.ts staleTime 60_000 | optimistic OK, server replaces <1s |

## CLOSED this run

| ID | Fix |
|----|-----|
| F01 | applyBattleSent: added activeExpeditions invalidation |
| F02 | applyScoutSent: added activeExpeditions invalidation |
| F03 | applyExpeditionRecalled: added resources + population + activeExpeditions invalidations |
| F04 | applyCaravanSent: added activeExpeditions invalidation + new test block |
| hook | pre-push: sh-compatible (no pipefail, no process substitution) |
