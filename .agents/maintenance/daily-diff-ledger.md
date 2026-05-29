# BFTC Daily Diff Maintenance Ledger

last_analyzed_main_sha: 107bf0adf6548991fb27230770593f91981bea08

## Rules

- This ledger tracks the last `origin/main` commit reviewed by `bftc-daily-diff-maintenance`.
- The cursor is commit-based, not time-based.
- The cursor must advance only through a PR that is merged into `main`.
- If an open `bftc-daily-diff-maintenance` PR exists, do not start another run.

## Runs

- 2026-05-29: initialized at `a3b76dfc4149b53bf25a09e4b9c94c70de587e62`; outcome: baseline-only.
- 2026-05-29: range `a3b76dfc4149b53bf25a09e4b9c94c70de587e62..107bf0adf6548991fb27230770593f91981bea08` (`11343e5` maintenance skills, `107bf0a` Claude web SessionStart hook).
  - candidate: the new SessionStart hook provisions Postgres **natively** (no Docker daemon), but `battleforthecrown-backend/scripts/smoke-preflight.sh` was Docker-only — so the smoke verification mandated by the maintenance skills could never run in the env the hook creates. Made the preflight auto-detect Docker container vs native `localhost:5432` backend.
  - files: `battleforthecrown-backend/scripts/smoke-preflight.sh`, `docs/architecture/db-setup.md`, this ledger.
  - verification: `yarn workspace battleforthecrown-backend test:smoke:preflight` (native mode OK), one smoke spec `worlds-public` green against native clones, `yarn static-check` green, `sh -n` syntax OK.
  - branch/title: `claude/bftc-daily-diff-maintenance-4tYyp` / `chore(maintenance): review new main commits`.
  - status: proposed.
