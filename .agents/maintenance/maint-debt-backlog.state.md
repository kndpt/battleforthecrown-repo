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
| combat/codecs/loot.codec.ts | open PR #103 — parse/encode loot codec spec |
| shared/world/entities.ts normalizeTier | zero tests — fuzzy string tier parsing |
| pixi/api/world-types.ts isFoggedEntity | 4-line duplicate of shared helper |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
