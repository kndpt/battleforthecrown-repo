# maint-debt — candidats (réécrit chaque run)

last: 2026-07-10 | archive: `archive/maint-debt/2026-06-15-full.md`
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
| 11× Intl.NumberFormat('fr-FR') singleton | extract to src/lib/formatters.ts — 11 files, scope too broad for 1 PR |
| formatDate divergence ReportCard vs ReportsList | need product call on whether time is shown on non-same-day combat reports |
| live-game formatNumber separator (space vs dot) | which fr-FR grouping is canonical across shipped HUD — product call, broad |

## done (this run)

| area | PR |
|------|-----|
| travel-time.spec.ts — cover `calculateTravelTime` village-strategy `armySpeedBonus` branch (FORTRESS 0.8 / RAIDERS 1.15 / ECONOMIC+BALANCED 1.0 / compound w/ speedMultiplier / 0-guard); live prod path via world-config `getTravelTime`+`getTravelTimeForArmy`, previously 0 pure coverage | pending |

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
| ws-bindings.ts orphaned `Exhaustive map` comment → moved onto `bindings` const | #275 |
| HeaderBarSection.tsx drop useless `useState(5)` (no setter) → inline literal, drop react import | pending |
| recall-en-route.smoke.spec.ts drop dead `as any` on world `config` spread | #265 |
| army.service.ts `Object.keys(...) as UnitType[]` → typed `Object.values(UNIT_TYPES)` | #260 |
| ArmyViewDesign.tsx regex formatNumber → toLocaleString('fr-FR') | pending |
| clamp/clamp01 dup worldTerrain.ts + OnboardingFab.tsx → import @/lib/math | #246 |
| barbarian-runtime.service.ts 4× `as UnitType` → typedEntries + isUnitType guard | #241 |
| isUnitType guard duplicated 3× → shared | #221 |
| hardcoded time constants → shared/time imports | #225 |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
</content>
</invoke>
