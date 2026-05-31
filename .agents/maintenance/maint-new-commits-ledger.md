# BFTC Maint — New Commits Ledger

last_analyzed_main_sha: ad58a6ac8f65fff96cef84bac9e756dff06a35c1

## Rules

- This ledger tracks the last `origin/main` commit reviewed by `bftc-maint-new-commits`.
- The cursor is commit-based, not time-based.
- The cursor must advance only through a PR that is merged into `main`.
- If an open `bftc-maint-new-commits` PR exists, do not start another run.
- New proposed entries use branch `maint/new-commits/<short-sha>` and PR title
  `maint(new-commits): review new main commits`; older entries may keep legacy
  `claude/*` branch names.

## Runs

- 2026-05-29: initialized at `a3b76dfc4149b53bf25a09e4b9c94c70de587e62`; outcome: baseline-only.
- 2026-05-29: range `a3b76dfc4149b53bf25a09e4b9c94c70de587e62..107bf0adf6548991fb27230770593f91981bea08` (`11343e5` maintenance skills, `107bf0a` Claude web SessionStart hook).
  - candidate: the new SessionStart hook provisions Postgres **natively** (no Docker daemon), but `battleforthecrown-backend/scripts/smoke-preflight.sh` was Docker-only — so the smoke verification mandated by the maintenance skills could never run in the env the hook creates. Made the preflight auto-detect Docker container vs native `localhost:5432` backend.
  - files: `battleforthecrown-backend/scripts/smoke-preflight.sh`, `docs/architecture/db-setup.md`, this ledger.
  - verification: `yarn workspace battleforthecrown-backend test:smoke:preflight` (native mode OK), one smoke spec `worlds-public` green against native clones, `yarn static-check` green, `sh -n` syntax OK.
  - branch/title: `claude/bftc-daily-diff-maintenance-4tYyp` / `chore(maintenance): review new main commits`.
  - status: merged (PR #5 → `fae3576`).
- 2026-05-29: range `107bf0adf6548991fb27230770593f91981bea08..fae357642a6fdb02d2a6d023a64e67d84a96eaff` (`ed9bb49` Zod barbarian village parse #4, `fae3576` maintenance #5).
  - candidate: none actionable. The only source change in range (`#4`, `world-entities-query.service.ts` — added `barbarianVillageDataSchema.parse()`) is already covered end-to-end by smokes: `combat-conquest-hook.smoke.spec.ts` asserts the barbarian view-model **with** `captureWindow`, and `barbarians.smoke.spec.ts` covers the nominal `/world/:worldId/entities` shape. A dedicated smoke would duplicate (forbidden by `bftc-tests-policy`). `#5` is this skill's own already-verified PR.
  - files: `.agents/maintenance/daily-diff-ledger.md` (cursor only).
  - verification: git range confirmed (`107bf0a..fae3576`); `barbarians` + `combat-conquest-hook` smokes green (8/8) exercising the `#4` parse on native clones.
  - branch/title: `claude/bftc-daily-diff-maintenance-4tYyp` / `chore(maintenance): review new main commits`.
  - outcome: reviewed-no-action.
  - status: proposed.
- 2026-05-30: range `fae357642a6fdb02d2a6d023a64e67d84a96eaff..ad58a6ac8f65fff96cef84bac9e756dff06a35c1` (9 commits: `b51f41a` JwtPayload fix, `21d6104` new-commits ledger, `ae23945` backend eslint-disable cleanup, `c0d9c5d` CI prisma script, `5c9b77d` math/path dedup, `f6e401f` level/clamp/strategy dedup, `c38fd69` CI update, `ce5f7c2` maintenance skills consolidation, `ad58a6a` army cleanup PR #15).
  - candidate: PR #15 fixed `summaryLabel` countdown (replaced `formatArmyTrainingDuration(remainingMs/1000)` with `formatRemaining(remainingMs)`) but left `formatArmyTrainingDuration` as the formatter for per-unit `trainingTime` in `armyViewModel.ts`. The function lives in the design-system barrel — wrong abstraction level for a pure utility — with no other callers. Fix: replace with `formatRemaining(Math.floor(trainingSeconds) * 1000)` (preserves floor-rounding semantics), then delete `formatArmyTrainingDuration` from `ArmyViewDesign.utils.ts` and its re-export from `index.ts`.
  - files: `battleforthecrown-pixi/src/features/army/armyViewModel.ts`, `battleforthecrown-pixi/src/features/design-system/components/ArmyViewDesign.utils.ts`, `battleforthecrown-pixi/src/features/design-system/components/index.ts`, `.agents/maintenance/maint-new-commits-ledger.md`.
  - verification: `yarn workspace battleforthecrown-pixi test armyViewModel` 4/4 PASS; `yarn workspace battleforthecrown-pixi test` 229/229 PASS; `yarn static-check` PASS (tsc + eslint).
  - branch/title: `claude/bftc-maint-new-commits-ad58a6a` / `chore(maintenance): review new main commits`.
  - status: proposed.
