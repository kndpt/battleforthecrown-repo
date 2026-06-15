# maint-debt — candidats (réécrit chaque run)

last: 2026-06-15 | archive: `archive/maint-debt/2026-06-15-full.md`
branch: `maint/debt/<topic>` | title: `maint(debt): <subject>`

## candidate

| area | note |
|------|------|
| pixi magic 3600 + formatDuration dup | UI text differs — need product call before dedupe |
| VillageCanvas + VillageScene pipeline | zero importers — needs retire-canvas decision, too broad |
| pixi/WorldMapScene.ts | open PR #89 — background tap + exit cleanup |
| shared/logic/training-time.ts | open PRs #99–101 — calculateTrainingTime spec |
| shared/logic/production.ts | open PR #102 — calculateProductionRate spec |
| pixi formatTime variants | QueueBottomSheet + UnitCard + UnitDetailModal — 3 local formatTime/Duration, diff styles |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
