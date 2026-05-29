---
name: bftc-debt-gardener
description: Use when reducing existing BFTC debt by fixing one bounded repo-wide item and proposing a verified draft PR.
---

# BFTC Debt Gardener

Reduce existing BFTC debt one small PR at a time. This skill is not tied to recent commits; use `bftc-daily-diff-maintenance` for new-code hygiene.

## Contract

- Select exactly one debt item from the current repo.
- Prefer durable, verified improvements over broad refactors.
- Produce at most one PR.
- Stop if an open PR for this skill already exists.
- Update `.agents/maintenance/debt-gardener-backlog.md` with the candidate outcome.

## Preflight

1. Read root `AGENTS.md`, `.agents/rules/{conventions,docs,git}.md`, and:
   - `.agents/maintenance/debt-gardener-backlog.md`
2. Ensure the worktree is clean:
   - `rtk git status --short`
3. Check for an existing open PR for this skill. Prefer the GitHub app when available; otherwise use `gh pr list` and search for:
   - branch prefix `codex/bftc-debt-gardener`
   - title/body token `bftc-debt-gardener`
4. If any matching open PR exists, stop and report its URL.

## Candidate Discovery

Use a bounded scan, not a full audit. Good inputs:

- existing backlog candidates in `.agents/maintenance/debt-gardener-backlog.md`;
- high-churn files from `rtk git log --stat --since="3 months ago"`;
- large files from `rtk find` plus line counts;
- repeated `TODO`, `as any`, `eslint-disable`, duplicated helpers, skipped tests;
- stale docs around active mechanics;
- failing or weak tests on critical paths.

High-value BFTC zones to include in rotation:

- `packages/shared/` formulas and contracts;
- `battleforthecrown-backend/src/modules/` APIs, services, workers, Outbox;
- `battleforthecrown-pixi/src/api/`, stores, view-models, Pixi scenes;
- `docs/gameplay/` and `docs/architecture/` when code and docs drift.

## Candidate Rules

Choose a candidate only if:

- the issue is grounded in concrete files/lines;
- the fix can be explained in one sentence;
- the expected diff is small enough to review;
- verification is clear before editing.

Reject candidates that require:

- destructive Prisma operations;
- new gameplay rules or balance changes;
- large rewrites;
- broad formatting churn;
- speculative cleanup without a testable benefit.

If no candidate meets the bar, update the backlog with `no-safe-candidate` in a PR only if the run needs durable traceability; otherwise stop without changes.

## Implementation Limits

- Touch no more than 5 files by default.
- Keep one theme per PR.
- Add or update tests when the debt concerns behavior, contracts, formulas, workers, or UI view-models.
- Use specialized BFTC skills when the chosen area requires them:
  - `bftc-prisma`
  - `bftc-workers-outbox`
  - `bftc-pixi-scene`
  - `bftc-react-hud`
  - `bftc-tests-policy`
  - `bftc-qa`
- Prefer deleting unnecessary code over introducing abstractions, unless the abstraction removes real duplication.

## Backlog Update

Update `.agents/maintenance/debt-gardener-backlog.md`:

- add new candidates discovered but not selected;
- mark the selected candidate `proposed` with PR branch/title;
- mark rejected candidates with a short reason;
- after fixing, include verification commands.

Do not use `tasks/todo.md` as durable memory for this skill.

## Verification

- Always run targeted tests for the touched area.
- Always run `rtk yarn static-check` before finalizing a code PR.
- If backend `src/` changed, follow `bftc-run` smoke expectations unless a documented exception applies.
- Check documentation impact via `.agents/rules/docs.md` and update docs if code, gameplay, API, data model, workflow, or architecture changed.

## PR Output

Create a branch named:

```text
codex/bftc-debt-gardener-<short-topic>
```

Use an English commit message matching the actual change, for example:

```text
refactor(shared): remove duplicated travel time helper
test(backend): cover combat return report linkage
docs(gameplay): align scout report wording
```

Open a draft PR. Include:

- selected debt item and evidence;
- why this item was chosen over alternatives;
- files changed;
- verification commands and results;
- docs impact;
- backlog update summary.

If GitHub access is unavailable, leave the branch, commit, and PR body ready, then report the blocker.
