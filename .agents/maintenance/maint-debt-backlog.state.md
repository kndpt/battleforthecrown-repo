# maint-debt — candidats (réécrit chaque run)

last: 2026-06-14 | archive: `archive/maint-debt/2026-06-14-full.md`
branch: `maint/debt/<topic>` | title: `maint(debt): <subject>`

## candidate

| area | note |
|------|------|
| pixi magic 3600 + formatDuration dup | UI text differs — need product call before dedupe |
| VillageCanvas + VillageScene pipeline | zero importers — needs retire-canvas decision, too broad |
| pixi/WorldMapScene.ts | open PR #89 — background tap + exit cleanup |
| shared/logic/training-time.ts | open PRs #99/#100/#101 — calculateTrainingTime unit spec |
| shared/logic/production.ts | open PR #102 — calculateProductionRate unit spec |
| shared/world/entities.ts isFoggedEntity | open PR #105 — duplicate in pixi world-types.ts |
| packages/shared/src/village/population.ts | open PR #104 — getQuarterPopulationLimit unit spec |
| packages/shared/src/logic/travel-time.spec.ts | open PR #106 — orphan shared spec vs backend coverage |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
