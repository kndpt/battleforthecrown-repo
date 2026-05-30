---
name: bftc-maint-new-commits
description: Scans new commits on main since the last cursor, fixes one bounded debt item introduced by the diff, and proposes a verified PR. Auto-triggers at session start when unreviewed commits exist.
invoke: auto
---

# BFTC Maint — New Commits

Inspect only the unreviewed `main` commit range tracked in `.agents/maintenance/maint-new-commits-ledger.md`. Produce at most one bounded maintenance PR, or stop cleanly.

## When to trigger

**Automatic** — invoked at session start when `git fetch` reveals commits beyond the ledger cursor.
**Routine** — Anthropic Routine cron, see `.agents/maintenance/trigger-strategy.md` for setup.

## Contract

- Use a Git SHA cursor, never a time window.
- Stop immediately if an open PR for this skill already exists.
- If no new commits exist after the cursor, stop without changes.
- Analyze exactly `last_analyzed_main_sha..origin/main`.
- Fix at most one low-to-medium risk debt item introduced or revealed by that range.
- Advance the cursor only through a PR that changes `.agents/maintenance/maint-new-commits-ledger.md`.
- If the range has no actionable debt, open a ledger-only PR marking the range reviewed.

## Preflight

1. Read root `AGENTS.md`, `.agents/rules/{conventions,docs,git}.md`, and:
   - `.agents/maintenance/maint-new-commits-ledger.md`
2. Ensure the worktree is clean:
   - `git status --short`
3. Fetch the latest remote state:
   - `git fetch origin main`
4. Check for an existing open PR for this skill (branch prefix `claude/bftc-maint-new-commits`, body token `bftc-maint-new-commits`).
5. If any matching open PR exists, stop and report its URL.

## Range Selection

1. Read `last_analyzed_main_sha` from the ledger.
2. Verify it is an ancestor of `origin/main`:
   - `git merge-base --is-ancestor <sha> origin/main`
3. If not an ancestor, stop and report ledger drift. Do not guess a new cursor.
4. If `<sha> == origin/main`, stop: no new commits to review.
5. Otherwise inspect:
   - `git log --oneline <sha>..origin/main`
   - `git diff --stat <sha>..origin/main`
   - targeted `git diff <sha>..origin/main -- <paths>` for changed hot paths.

## Candidate Selection

Choose one candidate directly tied to the range. Good candidates:

- newly introduced `any`, unsafe cast, missing Zod/DTO validation, or weak shared contract;
- duplicated logic added or expanded by the range;
- missing test around a changed formula, worker, API shape, store, or view-model;
- stale documentation caused by the range;
- fragile error handling or observability in changed backend code;
- local cleanup in changed files that reduces future risk without broad refactor.

Reject candidates that require:

- destructive Prisma operations;
- gameplay rule changes without explicit docs/code/test evidence;
- broad architecture rewrites;
- touching backend and Pixi together unless the range changed a shared contract and the fix is still small;
- more than one coherent theme.

If several candidates exist, prefer the smallest change with the highest verification confidence.

## Implementation Limits

- Touch no more than 5 files unless the chosen issue cannot be fixed coherently otherwise.
- Keep the diff focused on one theme.
- Prefer existing BFTC patterns and skills:
  - Prisma/schema/DB: `bftc-prisma`
  - workers/Outbox/realtime: `bftc-workers-outbox`
  - Pixi scene/canvas: `bftc-pixi-scene`
  - React HUD/Zustand/TanStack/Zod: `bftc-react-hud`
  - tests policy: `bftc-tests-policy`
  - final QA choice: `bftc-qa`
- Do not update `last_analyzed_main_sha` until the implementation and verification are complete.

## Verification

Run the narrowest meaningful verification first, then the repo gate appropriate to the touched area.

- Always run `yarn static-check` before finalizing a code PR.
- If Pixi/frontend code changed, run the targeted Pixi test/type-check command relevant to the files.
- If backend `src/` changed, follow `bftc-run` smoke expectations unless the change is strictly non-runtime and the exception is documented.
- If only the ledger changes, no code tests are required; verify git range and ledger formatting.

## Ledger Update

Update `.agents/maintenance/maint-new-commits-ledger.md` in the PR:

- set `last_analyzed_main_sha` to the reviewed `origin/main` SHA;
- add one run entry with range, selected candidate, PR branch/title, verification, and status `proposed`;
- if no candidate was fixed, mark `outcome: reviewed-no-action`.

The ledger update must be part of the PR. The cursor becomes authoritative only after the PR is merged into `main`.

## PR Output

Branch: `claude/bftc-maint-new-commits-<short-sha>`

Commit in English:
```
chore(maintenance): review new main commits
```

Open a draft PR. Include:

- reviewed range and commits;
- candidate chosen and why;
- files changed;
- verification commands and results;
- docs impact;
- explicit note that no second new-commits PR should run until this PR is merged or closed.
