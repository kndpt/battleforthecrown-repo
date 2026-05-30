---
name: bftc-maint-debt
description: Sweeps the existing BFTC codebase for one bounded debt item, fixes it, and proposes a verified PR. Runs twice nightly via Routine. If a PR is already open, reads it and picks a different candidate not already covered.
---

# BFTC Maint — Existing Debt

Reduce existing BFTC debt one small PR at a time. This skill is not tied to recent commits; use `bftc-maint-new-commits` for new-code hygiene.

## When to trigger

**Routine** — twice nightly at 00:00 and 04:00 (local time), see `.agents/maintenance/trigger-strategy.md` for setup.
**Manual** — invoke any time to reduce debt on demand.

## Contract

- Select exactly one debt item from the current repo.
- Prefer durable, verified improvements over broad refactors.
- Produce at most one PR per run.
- **If an open PR for this skill already exists**: read it carefully to understand what was already analyzed and fixed. Then pick a candidate **not covered** by that open PR. If every strong candidate is already in progress, stop and report.
- Update `.agents/maintenance/maint-debt-backlog.md` with the candidate outcome.

## Preflight

1. Read root `AGENTS.md`, `.agents/rules/{conventions,docs,git}.md`, and:
   - `.agents/maintenance/maint-debt-backlog.md`
2. Ensure the worktree is clean:
   - `git status --short`
3. Check for existing open PRs for this skill (branch prefix `claude/bftc-maint-debt`, body token `bftc-maint-debt`).
4. If matching open PRs exist: read each one to extract already-covered candidates and areas. Continue the run, selecting a candidate not already addressed.

## Candidate Discovery

Use a bounded scan, not a full audit. Good inputs:

- existing backlog candidates in `.agents/maintenance/maint-debt-backlog.md`;
- high-churn files from `git log --stat --since="3 months ago"`;
- large files from `find` plus line counts;
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
- verification is clear before editing;
- the candidate is **not already addressed** by an existing open PR for this skill.

Reject candidates that require:

- destructive Prisma operations;
- new gameplay rules or balance changes;
- large rewrites;
- broad formatting churn;
- speculative cleanup without a testable benefit.

If no remaining candidate meets the bar, update the backlog with `no-safe-candidate` and stop.

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

Update `.agents/maintenance/maint-debt-backlog.md`:

- add new candidates discovered but not selected;
- mark the selected candidate `proposed` with PR branch/title;
- mark rejected candidates with a short reason;
- after fixing, include verification commands.

## Verification

- Always run targeted tests for the touched area.
- Always run `yarn static-check` before finalizing a code PR.
- If backend `src/` changed, follow `bftc-run` smoke expectations unless a documented exception applies.
- Check documentation impact via `.agents/rules/docs.md` and update docs if code, gameplay, API, data model, workflow, or architecture changed.

## PR Output

Branch: `claude/bftc-maint-debt-<short-topic>`

Commit in English:
```
refactor(shared): remove duplicated travel time helper
test(backend): cover combat return report linkage
docs(gameplay): align scout report wording
```

Open a draft PR. Include:

- selected debt item and evidence;
- why this item was chosen over alternatives (including any existing open PRs that were already covering other items);
- files changed;
- verification commands and results;
- docs impact;
- backlog update summary.
