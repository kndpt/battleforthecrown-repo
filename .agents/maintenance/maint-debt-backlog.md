# BFTC Maint — Debt Backlog

This backlog tracks bounded existing-debt candidates for `bftc-maint-debt`.

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

- status: proposed
  area: `battleforthecrown-backend/src/modules/event/game.gateway.ts`
  branch: claude/bftc-debt-gardener-EGUH6
  title: "fix(backend/event): type verifyAsync with JwtPayload in GameGateway"
  note: >
    `verifyAsync(token)` returned untyped `unknown`, forcing an eslint-disable for `.sub` access.
    `JwtPayload` with `sub: string` already existed in `src/common/auth`. Fix: use
    `verifyAsync<JwtPayload>(token)`, import the type, remove the eslint-disable.
  verification: yarn static-check ✓

- status: proposed
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

- status: proposed
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

- status: candidate
  area: pixi magic constants — `SECONDS_PER_HOUR` (3600) inlined in ~6 files; duplicate `formatDuration` in UnitCard.tsx + UnitDetailModal.tsx
  note: >
    3600 repeats across army/village duration formatters; could import a shared MS_PER_HOUR or define
    SECONDS_PER_HOUR in pixi lib. formatDuration is duplicated but the two copies differ in spacing
    ("1h 30m" vs "1 h 30 m") — consolidating changes rendered UI text, so needs product intent, not a
    blind dedupe. Defer.

- status: candidate
  area: `battleforthecrown-pixi/src/api/queries.ts`
  note: Prior audits flagged this as a high-value contract/API surface; reverify before editing.

- status: candidate
  area: `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts`
  note: Prior audits flagged this as a high-value Pixi scene surface; prefer small rendering/input cleanup only.

- status: fixed
  area: `battleforthecrown-backend/src/modules/world/world-entities-query.service.ts`
  branch: claude/bftc-debt-gardener-EGUH6
  title: "fix(backend/world): parse barbarian village data with Zod schema"
  note: Merged PR #4.

- status: candidate
  area: `battleforthecrown-backend/src/workers/production.worker.ts`
  note: Prior audits flagged this as a high-value worker surface; preserve Outbox/server-authoritative invariants.

- status: proposed
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
