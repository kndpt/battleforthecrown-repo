# maint-debt — candidats (réécrit chaque run)

last: 2026-06-13 | archive: `archive/maint-debt/2026-06-13-full.md`
branch: `maint/debt/<topic>` | title: `maint(debt): <subject>`

## candidate

| area | note |
|------|------|
| pixi magic 3600 + formatDuration dup | UI text differs — need product call before dedupe |
| VillageCanvas + VillageScene pipeline | zero importers — needs retire-canvas decision, too broad |
| pixi/WorldMapScene.ts | open PR #89 — background tap + exit cleanup |
| shared/logic/training-time.ts | calculateTrainingTime has no direct unit spec (used by recruit flows) |
| shared/logic/production.ts | calculateProductionRate has no direct unit spec |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
