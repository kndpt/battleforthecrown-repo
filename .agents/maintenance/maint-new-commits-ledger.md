# BFTC Maint — New Commits Ledger

last_analyzed_main_sha: 8e0fa8ab2b5b226e22a0da8dc0607e32e3b0bc10

## Rules

- This ledger tracks the last `origin/main` commit reviewed by `bftc-maint-new-commits`.
- The cursor is commit-based, not time-based.
- The cursor must advance only through a PR that is merged into `main`.
- If an open `bftc-maint-new-commits` PR exists, do not start another run.

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
- 2026-05-30: range `fae357642a6fdb02d2a6d023a64e67d84a96eaff..8e0fa8ab2b5b226e22a0da8dc0607e32e3b0bc10` (10 commits: `b51f41a` JwtPayload fix #6, `21d6104` maintenance #7, `ae23945` eslint/any backend #9, `c0d9c5d` CI Prisma script #8, `5c9b77d` dedupe math/path helpers #10, `f6e401f` dedupe level/clamp + strategy casts #11, `c38fd69` update ci.yml, `ce5f7c2` consolidate maintenance skills #12, `ad58a6a` drop dead army formatter #15, `8e0fa8a` require lead audit in refactor skills #14).
  - candidate: stale `as number` casts in `packages/shared/src/logic/building-cost.ts` (2 casts) and `packages/shared/src/logic/travel-time.ts` (1 cast) revealed by commit `f6e401f` — that PR made `getStrategyBonusValue` return `Required<StrategyBonus>[K]` (a concrete `number` for numeric keys) so the `as number` assertions are now provably redundant and clutter the diff against the new typed API.
  - files: `packages/shared/src/logic/building-cost.ts`, `packages/shared/src/logic/travel-time.ts`, `.agents/maintenance/maint-new-commits-ledger.md`.
  - verification: `yarn static-check` green, `yarn test:backend` green.
  - branch/title: `claude/bftc-maint-new-commits-8e0fa8a` / `chore(maintenance): review new main commits`.
  - status: proposed.
