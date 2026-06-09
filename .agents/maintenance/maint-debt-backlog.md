# BFTC Maint — Debt Backlog

This backlog tracks bounded existing-debt candidates for `bftc-maint-debt`.

New proposed entries use branch `maint/debt/<short-topic>` and PR title
`maint(debt): <subject>`. Older entries may keep legacy `claude/*` branch names.

## Candidate States

- `candidate`: worth inspecting in a future run.
- `proposed`: selected by an open PR.
- `fixed`: merged or otherwise resolved.
- `rejected`: inspected and intentionally skipped.

## Rotation Hints

- Shared formulas/contracts.
- Backend APIs, services, workers, Outbox.
- Pixi API layer, stores, view-models, scenes.
- Gameplay and architecture documentation drift.

## Candidates

- status: fixed
  area: >
    battleforthecrown-pixi/src/api/queries.ts,
    battleforthecrown-pixi/src/features/combat/scoutReportView.ts,
    battleforthecrown-pixi/src/features/combat/scoutReportView.test.ts,
    battleforthecrown-pixi/src/features/combat/ReportsList.tsx
  branch: claude/bftc-maint-debt-scout-report-dto
  title: "refactor(pixi/combat): drop ScoutReportDto alias, use ScoutReportResponse directly"
  note: >
    ScoutReportResponse was already imported from @battleforthecrown/shared/combat in queries.ts.
    The re-exported ScoutReportDto alias was pure noise: it added a second name for the same type,
    forcing 3 consumer files to import from @/api/queries instead of the authoritative shared package.
    Removed the alias and updated all 4 files to use ScoutReportResponse directly.
  verification: yarn static-check ✓ · pixi 229 tests ✓

- status: fixed
  area: `battleforthecrown-backend/src/modules/event/game.gateway.ts`
  branch: claude/bftc-debt-gardener-EGUH6
  title: "fix(backend/event): type verifyAsync with JwtPayload in GameGateway"
  note: >
    `verifyAsync(token)` returned untyped `unknown`, forcing an eslint-disable for `.sub` access.
    `JwtPayload` with `sub: string` already existed in `src/common/auth`. Fix: use
    `verifyAsync<JwtPayload>(token)`, import the type, remove the eslint-disable.
  verification: yarn static-check ✓

- status: fixed
  area: >
    battleforthecrown-pixi/src/lib/math.ts (new),
    battleforthecrown-pixi/src/lib/pathGeometry.ts (new),
    battleforthecrown-pixi/src/pixi/entities/expeditionMath.ts,
    battleforthecrown-pixi/src/lib/expeditionRecall.ts,
    battleforthecrown-pixi/src/ui/tooltips/Tooltip.tsx,
    battleforthecrown-pixi/src/features/world/WorldMiniMap.tsx,
    packages/shared/src/world/lifecycle.ts,
    packages/shared/src/village/buildings.ts,
    battleforthecrown-backend/src/modules/combat/strategies/combat-strategy.interface.ts
  branch: claude/bftc-debt-gardener-config-gAL5a
  title: "refactor: dedupe math/path helpers and drop dead exports (multi-item)"
  note: >
    Multi-item run (user asked to fix a maximum of distinct debt in one PR). Themes:
    (1) pixi: extracted duplicated clamp01/clamp into lib/math.ts and Point2/pathControl/pathPointAt
        into lib/pathGeometry.ts; expeditionMath + expeditionRecall now share them (respects pixi→lib
        layering, not the reverse); Tooltip + WorldMiniMap reuse clamp; NumericKeypad clamp left (domain 1-arg).
    (2) shared/world/lifecycle: import MS_PER_DAY from ../time instead of redefining the same value.
    (3) shared/village/buildings: removed dead public type alias BuildingLevelCost (= BuildingLevelDefinition),
        inlined at its single internal call site.
    (4) backend/combat: collapsed duplicate CombatResolution import + re-export into one import.
  verification: yarn static-check ✓ · backend 232 tests ✓ · pixi 228 tests ✓ (incl. new lib/math.test.ts)

- status: rejected
  area: `battleforthecrown-backend/src/modules/combat/codecs/loot.codec.ts`
  note: >
    Audit flagged encodeLootResult `as unknown as` as inconsistent with encodeCombatLoot's direct cast.
    False positive: LootResult has no index signature and does not overlap Prisma.InputJsonValue, so the
    double cast is required (tsc TS2352). The asymmetry is type-driven, not debt. Leave as-is.

- status: rejected
  area: `battleforthecrown-backend/src/modules/world/world-entities-query.service.ts` (getVillagesInRadius)
  note: >
    Audit flagged missing Math.min(..., 499) clamp on maxX/maxY vs sibling getEntitiesInRadius.
    No functional effect: coordinate space is bounded and no entities exist beyond the edge, so the
    `lte` upper bound returns identical rows. Adding it is a no-op that duplicates a magic literal; skipped.

- status: fixed
  area: >
    packages/shared/src/utils/level.ts (new),
    packages/shared/src/village/buildings.ts,
    packages/shared/src/world/village-visuals.ts,
    battleforthecrown-pixi/src/api/world-types.ts,
    battleforthecrown-pixi/src/features/world/villageVisuals.test.ts,
    packages/shared/src/village/strategy.ts,
    battleforthecrown-pixi/src/features/army/UnitCard.tsx,
    battleforthecrown-pixi/src/features/design-system/components/{ProgressBar,QuestMissionCard,ArmyMovementRow,BuildQueueCard,KingdomActivitiesPanel,BuildingModal,ArmyViewDesign}.tsx
  branch: claude/bftc-debt-gardener-iteration-l9mTt
  title: "refactor: dedupe level/clamp helpers and drop strategy double-casts (multi-item)"
  note: >
    Multi-item run (user asked to fix a maximum of distinct debt in one PR). Three themes:
    (1) shared/strategy: getStrategyBonuses now returns Required<StrategyBonus> (mergeBonus already
        fully populates every field), so getStrategyBonusValue collapses to a single return with no
        `as unknown as` double-cast and no dead productionBonus/scalar fallback branches.
    (2) shared level normalization: third call site appeared (pixi world-types.normalizeCastleLevel),
        so the deferred extraction is now justified. New neutral helper clampBuildingLevel in
        shared/utils/level.ts (+ MIN/MAX_BUILDING_LEVEL); buildings.ts, village-visuals.ts and pixi
        world-types reuse it (utils home avoids world→village coupling). Added a fractional-floor
        regression case to villageVisuals.test.ts.
    (3) pixi clamp centralization: 8 inline `Math.max/Math.min` clamp idioms now route through the
        existing-but-underused lib/math `clamp` (6 progress 0–100 sites + UnitCard.clampQty +
        ArmyViewDesign.clampQuantity). NumericKeypad clamp left untouched (1-arg domain, optional max).
  verification: yarn static-check ✓ · backend 232 tests ✓ · pixi 229 tests ✓ (incl. new floor case)

- status: fixed
  area: >
    battleforthecrown-pixi/src/features/design-system/components/ArmyViewDesign.utils.ts,
    battleforthecrown-pixi/src/features/design-system/components/index.ts,
    battleforthecrown-pixi/src/features/army/armyViewModel.ts,
    battleforthecrown-pixi/src/features/army/armyViewModel.test.ts
  branch: claude/bftc-maint-debt-army-cleanup
  title: "refactor(pixi/army): drop dead parseArmyTrainingTimeSeconds and fix countdown formatter"
  note: >
    parseArmyTrainingTimeSeconds had 0 callers and 0 tests — deleted + re-export removed.
    summaryLabel countdown called formatArmyTrainingDuration(remainingMs/1000): replaced with
    formatRemaining(remainingMs) — drops the /1000 conversion and uses Math.ceil (correct for
    a countdown: never shows 0 while time remains). Added summaryLabel time assertion (was uncovered).
  verification: yarn static-check ✓ · backend 232 tests ✓ · pixi 229 tests ✓

- status: fixed
  area: >
    battleforthecrown-pixi/src/features/HelloPixiScene.tsx (deleted),
    battleforthecrown-pixi/src/pixi/scenes/BootScene.ts (deleted),
    battleforthecrown-pixi/src/features/layout/DebugOverlay.tsx (deleted),
    battleforthecrown-pixi/src/lib/useGameSocketStatus.ts (deleted),
    battleforthecrown-pixi/src/lib/unitConfig.ts (deleted)
  branch: maint/debt/remove-dead-pixi-scaffolding
  title: "maint(debt): remove dead Pixi scaffolding (demo scenes/overlay + unused unit config)"

- status: fixed
  area: >
    battleforthecrown-backend/src/modules/combat/combat-fixtures.ts (new),
    battleforthecrown-backend/src/modules/combat/combat-resolution.spec.ts,
    battleforthecrown-backend/src/modules/combat/strategies/combat-strategies.spec.ts
  branch: maint/debt/combat-test-fixtures
  title: "maint(debt): typed combat fixture factories, drop 14 as any in combat tests"
  note: >
    14 `as any` casts in two combat spec files: expedition cast because Prisma Expedition has
    10+ fields absent from test fixtures; config cast because CombatConfig extends the full
    WorldConfig (tempo, lifecycle, identity, barbarianSeeding, etc.) while tests only use
    config.combat. New combat-fixtures.ts: makeExpeditionFixture(partial?) and
    makeCombatConfigFixture(partial?) using shared DEFAULT_* constants. Also removed dead
    _lootManager variable + eslint-disable in combat-strategies.spec.ts.
  verification: yarn static-check ✓ · 240 backend tests ✓
  note: >
    5 fully-dead files (zero importers anywhere, repo-wide grep + path-import check confirmed):
    HelloPixiScene + createBootScene = leftover demo scenes; DebugOverlay (its only consumer of
    useGameSocketStatus, so the hook went with it) was never mounted; lib/unitConfig.ts exported
    UNIT_CONFIG/UnitConfig with no readers — distinct from the live features/army/unitConfig.ts
    (`unitMetaFor`, ~11 importers). VillageCanvas was a sibling dead file but is the SOLE consumer of
    the VillageScene pipeline; deleting it cascades into a render refactor — excluded as a separate
    larger candidate (see new candidate below).
  verification: yarn static-check ✓ · pixi 276 tests ✓

- status: candidate
  area: >
    battleforthecrown-pixi/src/features/village/VillageCanvas.tsx + its exclusive deps
    (pixi/scenes/VillageScene.ts, createVillageScene)
  note: >
    VillageCanvas has zero importers but is the only consumer of createVillageScene/VillageScene.
    Removing it orphans the whole VillageScene render pipeline (BuildingSprite per-frame driver, etc.).
    Too broad for a bounded debt PR — needs a deliberate "is canvas village rendering retired?" decision.

- status: candidate
  area: pixi magic constants — `SECONDS_PER_HOUR` (3600) inlined in ~7 files; duplicate `formatDuration` in UnitCard.tsx + UnitDetailModal.tsx
  note: >
    3600 repeats across army/village duration formatters; could import a shared MS_PER_HOUR or define
    SECONDS_PER_HOUR in pixi lib. formatDuration is duplicated but the two copies differ in spacing
    ("1h 30m" vs "1 h 30 m") — consolidating changes rendered UI text, so needs product intent, not a
    blind dedupe. Defer.

- status: candidate
  area: `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts`
  note: Prior audits flagged this as a high-value Pixi scene surface; prefer small rendering/input cleanup only.

- status: fixed
  area: `battleforthecrown-backend/src/modules/world/world-entities-query.service.ts`
  branch: claude/bftc-debt-gardener-EGUH6
  title: "fix(backend/world): parse barbarian village data with Zod schema"
  note: Merged PR #4.

- status: rejected
  area: `battleforthecrown-backend/src/workers/production.worker.ts`
  note: Audited — clean. Proper error handling, logging, batch separation. No debt found.

- status: fixed
  area: >
    battleforthecrown-backend/src/workers/world-lifecycle.worker.ts,
    battleforthecrown-backend/src/modules/world/world-lifecycle.spec.ts
  branch: maint/debt/world-lifecycle-ms-per-day
  title: "maint(debt): import MS_PER_DAY from shared/time in world-lifecycle worker and spec"
  note: >
    Both files defined `const MS_PER_DAY = 24 * 60 * 60 * 1000` locally despite
    the shared package exporting the same constant from `@battleforthecrown/shared/time`.
    Auth, crowns, resources, barbarian workers already imported from shared.
  verification: yarn static-check ✓ · world-lifecycle 13 tests ✓

- status: fixed
  area: >
    battleforthecrown-backend/src/modules/combat/capture-duration.ts,
    battleforthecrown-backend/src/modules/combat/capture-duration.spec.ts,
    battleforthecrown-pixi/src/features/world/barbarianConquest.ts
  branch: maint/debt/ms-per-hour-constants
  title: "maint(debt): import MS_PER_HOUR from shared/time in capture-duration and barbarianConquest"
  note: >
    All three files defined `const HOUR_MS = 60 * 60 * 1000` locally despite
    MS_PER_HOUR being exported from @battleforthecrown/shared/time and already used
    in crowns, strategy, barbarian-runtime, and barbarian-seeding-catchup workers.
    Same pattern as the MS_PER_DAY fix merged in #47.
  verification: yarn static-check ✓ · 252 backend tests ✓ · 314 pixi tests ✓ (merged PR #50)

- status: fixed
  area: >
    battleforthecrown-backend/src/modules/combat/travel-time.spec.ts (new),
    battleforthecrown-pixi/src/lib/combatHelpers.test.ts (new)
  branch: maint/debt/travel-time-tests
  title: "maint(debt): add missing tests for shared travel-time formulas and pixi combat helpers"
  note: >
    calculateDistance, calculateTravelTime, findSlowestUnitSpeed from shared/logic/travel-time.ts
    are used in combat.service, combat.worker, and world-config.service (critical combat path) but
    had zero test coverage. formatTravelTime and calculateExpeditionTravelTime in pixi combatHelpers.ts
    also untested. New files: travel-time.spec.ts (20 backend tests) and combatHelpers.test.ts (15 pixi tests).
  verification: yarn static-check ✓ · 272 backend tests ✓ · 337 pixi tests ✓

- status: fixed
  area: >
    battleforthecrown-backend/src/modules/combat/scout-report.presenter.spec.ts (new)
  branch: maint/debt/scout-report-presenter-spec
  title: "maint(debt): add missing spec for scout-report.presenter"
  note: >
    scout-report.presenter.ts had zero test coverage despite being the sole path that maps raw Prisma
    ScoutReport rows into ScoutReportResponse DTOs consumed by the frontend. Its two siblings
    (combat-report.presenter.spec.ts, reinforcement-report.presenter.spec.ts) were already covered.
    The reportDetails helper has ~6 branches (null, non-object, scoutLosses, scoutUnits, wallLevel,
    combined) that warranted explicit regression tests. New spec: 10 tests, no mocks required.
  verification: yarn static-check ✓ · 282 backend tests ✓ (merged 8a2d68d)

- status: proposed
  area: >
    battleforthecrown-backend/src/modules/world/building-cost.spec.ts (new)
  branch: maint/debt/building-cost-spec
  title: "maint(debt): add missing spec for calculateBuildingCost"
  note: >
    calculateBuildingCost (packages/shared/src/logic/building-cost.ts) had zero direct unit coverage
    despite being used in world-config.service.ts (construction cost list), recruit-troops/noble
    use-cases, and BuildingDetailModal.tsx. New spec: 8 tests covering base costs (WOOD, BARRACKS),
    castle-level speed bonus, speed multiplier, minimum 1000ms floor, unknown building throw, and
    out-of-range castle level fallback.
  verification: yarn static-check ✓ · 297 backend tests ✓ · 363 pixi tests ✓ (PR #63)

- status: proposed
  area: >
    battleforthecrown-pixi/src/lib/gameHelpers.ts (deleted)
  branch: maint/debt/remove-dead-game-helpers
  title: "maint(debt): delete dead gameHelpers.ts (zero importers since creation)"
  note: >
    gameHelpers.ts was created on 2026-05-31 but never imported by any consumer file (0 importers,
    confirmed repo-wide grep). Exports: getAllPlayerResources, canAffordCost (wrapping shared), 
    formatMissingResources, re-exports from @battleforthecrown/shared/resources. All live 
    affordability consumers import directly from @battleforthecrown/shared/resources. 
    85 lines of dead code.
  verification: yarn static-check ✓ · pixi 363 tests ✓

- status: candidate
  area: >
    battleforthecrown-backend/src/modules/combat/combat.worker.ts:964, 1079
  note: >
    O1/B6 from refactor-backend audit: applyDefenderLosses (line 964) and getCaptureDurationMs
    (line 1079) use inline Prisma.VillageGetPayload<{ include: { resourceStock: true; buildings: true } }>,
    identical to the DefenderVillage alias defined at line 42. Replace with DefenderVillage.
    1 file, 2 locations, trivial type consistency fix.

- status: fixed
  area: >
    battleforthecrown-backend/src/modules/combat/loot/providers/resource-loot.provider.ts,
    battleforthecrown-backend/src/common/prisma-shared-enums.ts,
    battleforthecrown-backend/src/modules/world/world.service.ts,
    battleforthecrown-backend/src/modules/combat/loot/loot.manager.spec.ts,
    battleforthecrown-backend/src/modules/army/army.service.ts
  branch: claude/bftc-debt-gardener-multi-QxoLH
  title: "refactor(backend): remove 5 eslint-disable/any debt items"
  items:
    - resource-loot.provider: drop async (no await), return Promise.resolve() — removes eslint-disable require-await
    - prisma-shared-enums: export _targetKindFromPrisma — removes eslint-disable no-unused-vars
    - world.service: Prisma select in getWorldDetails to skip config field — removes eslint-disable no-unused-vars
    - loot.manager.spec: as any → as unknown as T for Expedition and CombatConfig
    - army.service: explicit Promise<UnitTraining[]> return type on getTraining
  verification: yarn static-check ✓ · 232 backend tests ✓ · 222 pixi tests ✓

## Runs

- 2026-05-29: initialized with known high-value candidate areas; outcome: baseline-only.
- 2026-05-29: selected `world-entities-query.service.ts` — barbarian schema parse symmetry; PR on `claude/bftc-debt-gardener-EGUH6`.
- 2026-05-29: selected `game.gateway.ts` — type verifyAsync with JwtPayload; same branch.
- 2026-05-29: multi-item run (user-requested max debt in one PR) on `claude/bftc-debt-gardener-config-gAL5a` —
  deduped math/path helpers (lib/math.ts + lib/pathGeometry.ts), MS_PER_DAY import, dead BuildingLevelCost
  alias, duplicate CombatResolution import. Rejected loot.codec cast (type-required) and getVillagesInRadius
  clamp (no-op). static-check ✓ · backend 232 ✓ · pixi 228 ✓.
- 2026-05-30: multi-item run (user-requested max debt in one PR) on `claude/bftc-debt-gardener-iteration-l9mTt` —
  (1) strategy.ts: Required<StrategyBonus> return kills the `as unknown as` double-casts + dead branches;
  (2) new shared/utils/level.ts clampBuildingLevel reused by buildings.ts, village-visuals.ts, pixi
  world-types (third call site unlocked the deferred extraction) + fractional-floor test;
  (3) routed 8 inline clamp idioms through existing lib/math `clamp`. NumericKeypad clamp left (1-arg
  domain). static-check ✓ · backend 232 ✓ · pixi 229 ✓.
- 2026-05-30: selected `parseArmyTrainingTimeSeconds` dead export + summaryLabel countdown formatter on
  `claude/bftc-maint-debt-army-cleanup` — deleted dead function, replaced formatArmyTrainingDuration(ms/1000)
  with formatRemaining(ms), added summaryLabel time assertion. static-check ✓ · backend 232 ✓ · pixi 229 ✓.
- 2026-05-31: dropped redundant ScoutReportDto alias from queries.ts on `claude/bftc-maint-debt-scout-report-dto` —
  ScoutReportResponse was already imported from @battleforthecrown/shared/combat; alias caused 3 consumer files to
  import a re-exported name rather than the canonical shared type. Removed alias, updated 4 files.
  static-check ✓ · pixi 229 ✓. Also cleaned backlog: marked proposed→fixed for PRs #6, #9, #10, #11.
- 2026-06-02: dead-code sweep on `maint/debt/remove-dead-pixi-scaffolding` — deleted 5 fully-orphaned Pixi
  scaffolding files (HelloPixiScene, BootScene/createBootScene, DebugOverlay + its sole-consumer hook
  useGameSocketStatus, lib/unitConfig.ts). Excluded VillageCanvas (sole consumer of VillageScene
  pipeline → cascade, logged as candidate). static-check ✓ · pixi 276 ✓.
- 2026-06-03: typed combat fixture factories on `maint/debt/combat-test-fixtures` — new combat-fixtures.ts
  with makeExpeditionFixture + makeCombatConfigFixture eliminates 14 `as any` in combat-resolution.spec.ts
  and combat-strategies.spec.ts; also removed dead _lootManager variable + eslint-disable.
  static-check ✓ · 240 backend tests ✓.
- 2026-06-04: local MS_PER_DAY constants removed from world-lifecycle.worker.ts and world-lifecycle.spec.ts
  on `maint/debt/world-lifecycle-ms-per-day` — both imported from @battleforthecrown/shared/time
  (same pattern as auth, crowns, resources, barbarian workers).
  static-check ✓ · world-lifecycle 13 tests ✓.
- 2026-06-05: local HOUR_MS constants removed from capture-duration.ts, capture-duration.spec.ts,
  barbarianConquest.ts on `maint/debt/ms-per-hour-constants` — imported MS_PER_HOUR from
  @battleforthecrown/shared/time (same pattern, MS_PER_HOUR already used in 4+ backend modules).
  PR #50. static-check ✓ · 252 backend tests ✓ · 314 pixi tests ✓.
- 2026-06-06: missing tests for shared travel-time formulas on `maint/debt/travel-time-tests` —
  calculateDistance + calculateTravelTime + findSlowestUnitSpeed from shared/logic had zero coverage
  despite being on the critical combat path (combat.service, combat.worker, world-config.service).
  Also added pixi tests for formatTravelTime + calculateExpeditionTravelTime (combatHelpers.ts).
  2 new test files, 35 tests total. static-check ✓ · 272 backend tests ✓ · 337 pixi tests ✓.
  (Also updated travel-time-tests from proposed→fixed: branch was merged, no open PR found.)
- 2026-06-07: missing spec for scout-report.presenter on `maint/debt/scout-report-presenter-spec` —
  scout-report.presenter.ts had zero tests despite being sole mapping path from Prisma ScoutReport
  to ScoutReportResponse. Siblings combat-report and reinforcement-report presenters were already
  covered. New spec: 10 tests covering reportDetails branches (null, non-object, wallLevel,
  scoutLosses, scoutUnits, combined, invalid types) + full mapping + barbarian scout case.
  static-check ✓ · 282 backend tests ✓.
- 2026-06-09: dead gameHelpers.ts deleted on `maint/debt/remove-dead-game-helpers` — file created
  2026-05-31 but never imported by any consumer (0 importers confirmed). Affordability consumers
  already import directly from @battleforthecrown/shared/resources. 85 lines removed.
  static-check ✓ · pixi 363 tests ✓.
