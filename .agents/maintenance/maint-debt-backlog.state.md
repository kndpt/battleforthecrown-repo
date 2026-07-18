# maint-debt — candidats (réécrit chaque run)

last: 2026-07-18 | archive: `archive/maint-debt/2026-06-15-full.md`
branch: `maint/debt/<topic>` | title: `maint(debt): <subject>`

## candidate

| area | note |
|------|------|
| pixi magic 3600 + formatDuration dup | UI text differs — need product call before dedupe |
| VillageCanvas + VillageScene pipeline | zero importers — needs retire-canvas decision, too broad |
| pixi QueueBottomSheet formatTime | clock-style mm:ss vs formatRemaining human labels — keep local until product aligns village queue display |
| shared/village/strategy.ts getVillageStrategyPlan | constant plan accessor — low value unless plan becomes configurable |
| conquest openCaptureWindow/interruptCaptureWindow/conquerVillage wrappers | used only in smoke tests, not prod code — public API for test convenience, low debt |
| buildRefundToastItems export | exported for test import only — valid pattern, skip |
| 11× Intl.NumberFormat('fr-FR') singleton | consolidation in-flight via PR #290 (refactor-pixi NEW-02/03) — hold until merged |
| formatDate divergence ReportCard vs ReportsList | need product call on whether time is shown on non-same-day combat reports |
| live-game formatNumber separator (space vs dot) | which fr-FR grouping is canonical across shipped HUD — product call, broad |
| shared untested pure modules | `village/population.ts` now covered (this run). `combat/loot.ts` = types-only, skip. Next: scan remaining 0-coverage shared pure fns |

## done (this run)

| area | PR |
|------|-----|
| village/population.spec.ts — cover `getQuarterPopulationLimit` (0 coverage): exact table values, floor fractional, clamp below-min/above-max, non-finite→min | pending |

## rejected (false positive — do not repick)

| area | why |
|------|-----|
| GarrisonLineDto export in combat.service.ts | export IS required — combat.controller public method infers it, dropping it breaks TS4053 declaration-emit |
| power/weights.ts `getUnitPowerWeight`+`UNIT_POWER_WEIGHTS` look dead | USED by backend `PowerService.calculateUnitPower` via barrel `@battleforthecrown/shared/power` — grep by path misses barrel imports |
| WorldEntityKind `BARBARIAN_CASTLE` literal only self-referenced | union ends `\| string` so literals are documentary only; removing one is churn, not a fix |
| map-markers/schemas.ts Zod transforms untested | already netted by `map-marker.smoke.spec.ts` (trim, empty→null, over-long 400, empty PATCH 400) — unit spec redundant |
| combat/loot.ts untested | types/interfaces only, no runtime function to cover |

## done (prev)

| area | PR |
|------|-----|
| world/tempo.spec.ts — cover `TempoService` resolve/apply/deriveProfile (0 coverage) | #312 |
| rankings/formulas.spec.ts — cover 5 live glory-scoring exports (0 coverage) | pending |
| barbarian-geometry.spec.ts — cover `getChunkBounds` + `generateBarbarianName` | pending |
| world-types.test.ts — cover fogged-entity path | #292 |
| shared/cosmetic/consts.spec.ts — cover `formatCosmeticAwardLabel` + anti-drift guards | #287 |
| shared/world/vision.spec.ts — cover `isPointInAnyVisionDisk` fog-of-war geometry | #283 |
| ws-bindings.ts orphaned `Exhaustive map` comment → moved onto `bindings` const | #275 |
| recall-en-route.smoke.spec.ts drop dead `as any` on world `config` spread | #265 |
| army.service.ts `Object.keys(...) as UnitType[]` → typed `Object.values(UNIT_TYPES)` | #260 |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
