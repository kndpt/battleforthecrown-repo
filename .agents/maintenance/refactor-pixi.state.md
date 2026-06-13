# refactor-pixi — état (réécrit chaque run)

last: 2026-06-13 | sha `150cb89` | theme ModalBackdrop extraction | branch `maint/refactor-pixi/modal-backdrop`
full: `archive/refactor-pixi/2026-06-13-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C2 | Low | SpecializedBuildingDetailModal ~640L | organized, low risk |
| C3 | Low | ArmyScreen ~301-430 | garrison derivations inline, extractable hook |
| D4 | Low | queries.ts 60_000 staleTime | optimistic OK, server replaces <1s |
| F2 | Low | DailyRetentionWidget:301 | hardcoded expiresInValue="04h00" |
| J3 | Low | villageTierFromPower | test gap — debt candidate |
