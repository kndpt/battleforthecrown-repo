# maint-debt — candidats (réécrit chaque run)

last: 2026-06-15 | archive: `archive/maint-debt/2026-06-15-full.md`
branch: `maint/debt/<topic>` | title: `maint(debt): <subject>`

## candidate

| area | note |
|------|------|
| pixi magic 3600 + formatDuration dup | UI text differs — need product call before dedupe |
| VillageCanvas + VillageScene pipeline | zero importers — needs retire-canvas decision, too broad |
| pixi/WorldMapScene.ts | open PR #89 — background tap + exit cleanup |
| shared/logic/training-time.ts | open PRs #99–101, #110 — calculateTrainingTime spec |
| shared/logic/production.ts | open PR #102 — calculateProductionRate spec |
| pixi console.error stubs | open PR #116 — ReportDetailModal error toasts |
| pixi formatTime variants | open PR #114 — army formatDuration dedupe; QueueBottomSheet clock-style kept |
| shared/world/entities.ts isFoggedEntity | type guard used by world map — no direct unit spec |
| shared/resources/production.ts | isResourceBuildingType + getBuildingProduction — only indirect via calculateProductionRate |
| shared/village/strategy.ts getVillageStrategyPlan | constant plan accessor — low value unless plan becomes configurable |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
