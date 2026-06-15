# refactor-pixi — état (réécrit chaque run)

last: 2026-06-14 | sha `d9ecd9a` | theme useGarrisonSelection hook | branch `claude/affectionate-ptolemy-nk2dbd`
full: `archive/refactor-pixi/2026-06-14-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C2 | Low | SpecializedBuildingDetailModal ~640L | organized, low risk |
| D4 | Low | queries.ts 60_000 staleTime | optimistic OK, server replaces <1s |
| F2 | Low | DailyRetentionWidget:301 | hardcoded expiresInValue="04h00"; no resetAt in DTO, needs backend change |
| J3 | Low | villageTierFromPower | test gap — debt candidate |
