# maint-debt — candidats (réécrit chaque run)

last: 2026-06-29 | archive: `archive/maint-debt/2026-06-15-full.md`
branch: `maint/debt/<topic>` | title: `maint(debt): <subject>`

## candidate

| area | note |
|------|------|
| pixi magic 3600 + formatDuration dup | UI text differs — need product call before dedupe |
| VillageCanvas + VillageScene pipeline | zero importers — needs retire-canvas decision, too broad |
| pixi QueueBottomSheet formatTime | clock-style mm:ss vs formatRemaining human labels — keep local until product aligns village queue display |
| shared/world/entities.ts isFoggedEntity | type guard used by world map — no direct unit spec |
| shared/village/strategy.ts getVillageStrategyPlan | constant plan accessor — low value unless plan becomes configurable |
| conquest openCaptureWindow/interruptCaptureWindow/conquerVillage wrappers | used only in smoke tests, not prod code — public API for test convenience, low debt |
| buildRefundToastItems export | exported for test import only — valid pattern, skip |
| GarrisonLineDto export | used locally in combat.service.ts, export unnecessary but trivial |
| garrison-merge.utils.ts repeated `as UnitType` casts | 5 casts in one loop — extract local const; Prisma boundary, safe |
| HeaderBarSection console.log + unused useState | ui-test demo component — trivial cleanup |

## done (this run)

| area | PR |
|------|-----|
| isUnitType guard duplicated 3× (cancel-recruitment, recruit-troops, UnitDetailModal) → shared | #221 |

## done (prev)

| area | PR |
|------|-----|
| typedEntries consistency: 4 files still using Object.entries + `as UnitType` instead of shared typedEntries helper | #213 |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
