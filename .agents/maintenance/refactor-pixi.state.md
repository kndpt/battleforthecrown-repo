# refactor-pixi — état (réécrit chaque run)

last: 2026-06-15 | sha `ac695bd` | theme querykeys-prefix | branch `maint/refactor-pixi/querykeys-prefix`
full: `archive/refactor-pixi/2026-06-15-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C2 | Low | SpecializedBuildingDetailModal ~640L | organized, low risk |
| C3 | Low | ArmyScreen ~301-430 | garrison derivations inline, extractable hook |
| D4 | Low | queries.ts 60_000 staleTime | optimistic OK, server replaces <1s |
| F2 | Low | DailyRetentionWidget:301 | hardcoded expiresInValue="04h00" |
| J3 | Low | villageTierFromPower | test gap — debt candidate |
