# maint-debt — candidats (réécrit chaque run)

last: 2026-06-17 | archive: `archive/maint-debt/2026-06-15-full.md`
branch: `maint/debt/<topic>` | title: `maint(debt): <subject>`

## candidate

| area | note |
|------|------|
| pixi magic 3600 + formatDuration dup | UI text differs — need product call before dedupe |
| VillageCanvas + VillageScene pipeline | zero importers — needs retire-canvas decision, too broad |
| pixi QueueBottomSheet formatTime | clock-style mm:ss vs formatRemaining human labels — keep local until product aligns village queue display |
| shared/world/entities.ts isFoggedEntity | type guard used by world map — no direct unit spec |
| shared/village/strategy.ts getVillageStrategyPlan | constant plan accessor — low value unless plan becomes configurable |
| shared typedKeys dead export | exported but zero importers — remove |

## done (this run)

| area | PR |
|------|-----|
| pixi combatHelpers wrappers — remove 1:1 indirection over shared travel/distance fns | pending |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
