---
title: "Task/run branch implementation contract"
scope: "pull-request"
path: ["**/*"]
severity_min: "high"
enabled: true
---

@kody-sync

## Instructions

If the PR source branch starts with `task/` or `run/`, treat the matching active
implementation ticket as the product contract:

- `task/*` branches should be checked against the corresponding active `tasks/*.md` file.
- `run/*` branches should be checked against the corresponding active `tasks/runs/*.md` file.
- Prefer the concrete active ticket/run file over `tasks/README.md`, which may be stale.
- Flag implementation gaps, scope drift, missing acceptance criteria, missing required tests,
  or missing required docs as correctness issues.
- Do not comment if no corresponding ticket/run file can be confidently identified from
  the branch name, PR title, PR body, or changed files.

## Examples

### Bad example

PR from `task/combat-balance` ships combat formula changes but the active `tasks/combat-balance.md`
acceptance criteria require unit tests and a `docs/` update — neither is present.

### Good example

PR from `task/combat-balance` implements all acceptance criteria in the active ticket,
includes the required tests, and updates the relevant gameplay documentation.
