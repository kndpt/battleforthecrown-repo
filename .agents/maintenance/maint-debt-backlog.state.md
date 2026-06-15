# maint-debt — candidats (réécrit chaque run)

last: 2026-06-14 | archive: `archive/maint-debt/2026-06-14-full.md`
branch: `maint/debt/<topic>` | title: `maint(debt): <subject>`

## candidate

| area | note |
|------|------|
| pixi magic 3600 + formatDuration dup | UI text differs — need product call before dedupe |
| VillageCanvas + VillageScene pipeline | zero importers — needs retire-canvas decision, too broad |
| pixi/WorldMapScene.ts | open PR #89 — background tap + exit cleanup |
| shared/logic/training-time.ts | open PRs #99–101 — calculateTrainingTime spec |
| shared/logic/production.ts | open PR #102 — calculateProductionRate spec |
| pixi QueueBottomSheet formatTime | clock-style mm:ss vs formatRemaining human labels — keep local until product aligns village queue display |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
