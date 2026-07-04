# maint-debt — candidats (réécrit chaque run)

last: 2026-07-04 | archive: `archive/maint-debt/2026-06-15-full.md`
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
| 11× Intl.NumberFormat('fr-FR') singleton | extract to src/lib/formatters.ts — 11 files, scope too broad for 1 PR |
| formatDate divergence ReportCard vs ReportsList | need product call on whether time is shown on non-same-day combat reports |
| ArmyViewDesign.tsx regex formatNumber | uses regex instead of Intl.NumberFormat — locale-ignorant, replace with shared helper |

## done (this run)

| area | PR |
|------|-----|
| clamp/clamp01 dup worldTerrain.ts + OnboardingFab.tsx → import @/lib/math | pending |

## done (prev)

| area | PR |
|------|-----|
| barbarian-runtime.service.ts 4× `as UnitType` → typedEntries + isUnitType guard | #241 |
| isUnitType guard duplicated 3× → shared | #221 |
| hardcoded time constants → shared/time imports | #225 |
| typedEntries consistency: Object.entries + `as UnitType` → shared typedEntries | #213 |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
