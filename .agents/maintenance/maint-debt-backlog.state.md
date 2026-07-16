# maint-debt — candidats (réécrit chaque run)

last: 2026-07-15 | archive: `archive/maint-debt/2026-06-15-full.md`
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
| shared untested pure modules | candidates: village/population.ts, combat/loot.ts, world/tempo.ts — same 0-coverage pattern as formulas.ts, one per run |

## done (this run)

| area | PR |
|------|-----|
| rankings/formulas.spec.ts — cover 5 live glory-scoring exports (0 coverage): `getBattleUnitValue` fallback, `calculateRawBattleValue` filtering, `calculateOpponentMultiplier` clamp/guards, `applyPairDiminishingReturns` tiered full/half/0.2 + cursor + floor, `splitPointsByWeights` largest-remainder + dedup + conservation. Used by combat.worker + rankings.service | pending |

## rejected (false positive — do not repick)

| area | why |
|------|-----|
| GarrisonLineDto export in combat.service.ts | export IS required — combat.controller public method infers it, dropping it breaks TS4053 declaration-emit |
| power/weights.ts `getUnitPowerWeight`+`UNIT_POWER_WEIGHTS` look dead | USED by backend `PowerService.calculateUnitPower` via barrel `@battleforthecrown/shared/power` — grep by path misses barrel imports |
| WorldEntityKind `BARBARIAN_CASTLE` literal only self-referenced | union ends `\| string` so literals are documentary only; removing one is churn, not a fix |
| map-markers/schemas.ts Zod transforms untested | already netted by `map-marker.smoke.spec.ts` (trim, empty→null, over-long 400, empty PATCH 400) — unit spec redundant |

## done (prev)

| area | PR |
|------|-----|
| barbarian-geometry.spec.ts — cover `getChunkBounds` + `generateBarbarianName` (2 of 6 shared exports had 0 coverage) | pending |
| world-types.test.ts — cover fogged-entity path (`isFoggedEntity` guard + `entityFromWorldDto` fogged dispatch) | #292 |
| shared/cosmetic/consts.spec.ts — cover `formatCosmeticAwardLabel` + anti-drift guards | #287 |
| shared/world/vision.spec.ts — cover `isPointInAnyVisionDisk` fog-of-war geometry | #283 |
| ws-bindings.ts orphaned `Exhaustive map` comment → moved onto `bindings` const | #275 |
| HeaderBarSection.tsx drop useless `useState(5)` (no setter) → inline literal, drop react import | pending |
| recall-en-route.smoke.spec.ts drop dead `as any` on world `config` spread | #265 |
| army.service.ts `Object.keys(...) as UnitType[]` → typed `Object.values(UNIT_TYPES)` | #260 |
| ArmyViewDesign.tsx regex formatNumber → toLocaleString('fr-FR') | pending |
| clamp/clamp01 dup worldTerrain.ts + OnboardingFab.tsx → import @/lib/math | #246 |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
