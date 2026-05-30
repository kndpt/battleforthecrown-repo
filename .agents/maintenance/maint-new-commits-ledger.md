# BFTC Maint — New Commits Ledger

last_analyzed_main_sha: fae357642a6fdb02d2a6d023a64e67d84a96eaff

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
