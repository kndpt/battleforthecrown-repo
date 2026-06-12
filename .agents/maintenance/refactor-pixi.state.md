# refactor-pixi — état (réécrit chaque run)

last: 2026-06-12 | sha `d8b2fee` | theme L1 periodLabel dead export | maint debt #80 merged same window
full: `archive/refactor-pixi/2026-06-12-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| L4 | Low | ReportDetailModal | backdrop pattern ×4 — debt candidate |
| C2 | Low | SpecializedBuildingDetailModal ~643L | organized, low risk |
| C3 | Low | ArmyScreen ~301-330 | garrison derivations in JSX |
| D4 | Low | queries.ts 60_000 | optimistic OK, server replaces <1s |
| F2 | Low | DailyRetentionWidget:295 | hardcoded expiresInValue |
| J3 | Low | villageTierFromPower | test gap — debt candidate |
