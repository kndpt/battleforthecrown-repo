# refactor-pixi — état (réécrit chaque run)

last: 2026-06-15 | sha `0ae9a55` | theme ws-bindings cache invalidation | branch `claude/great-gates-vcplv1`
full: `archive/refactor-pixi/2026-06-15-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C1 | High | resources.ts + crowns.ts | Dual source of truth Zustand vs TanStack Query — design decision needed |
| E1 | High | caravanLaunchState.ts | Pure state calculator, 6 validation flags, zero tests |
| E2 | High | profileViewModel.ts:413L | Large transform module, zero tests |
| E3 | High | VillageViewSectionHelpers.ts | 4 pure functions untested |
| B1 | Med | VillageView.tsx:930L | Hero parallax + swipe extraction (~160L reduction) |
| D1 | Low | WorldMapScene.ts:759L | Background layer extraction (~200L) |
| C2 | Low | SpecializedBuildingDetailModal ~640L | organized, low risk |
| D4 | Low | queries.ts 60_000 staleTime | optimistic OK, server replaces <1s |
| F2 | Low | DailyRetentionWidget:301 | hardcoded expiresInValue="04h00"; needs backend resetAt in DTO |
