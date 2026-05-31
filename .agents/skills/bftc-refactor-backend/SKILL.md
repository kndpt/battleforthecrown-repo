---
name: bftc-refactor-backend
description: Deep code quality audit + structural refactor of battleforthecrown-backend. Two phases: annotated findings report, then one scoped PR ready for review. Runs weekly Saturday night via Routine.
---

# BFTC Refactor — Backend

Deep code quality pass on `battleforthecrown-backend/`. Two phases: **Audit** (annotated findings) then **Refactor** (one scoped PR, ready for review).

Unlike `bftc-maint-debt`, this skill embraces larger refactors and structural issues, not just bounded quick fixes. The 5-file cap does not apply.

## When to trigger

**Routine** — weekly, Saturday night, see `.agents/maintenance/trigger-strategy.md` for setup.
**Manual** — after a large backend feature lands, or when `bftc-maint-debt` keeps surfacing the same module.

---

## Contract

- Run both phases unless called with `--audit-only`.
- Produce exactly one PR per run, ready for review (not draft).
- The PR addresses one coherent refactor theme derived from the audit.
- Update `.agents/maintenance/refactor-backend-report.md` with the full findings.

---

## Preflight

1. Read `battleforthecrown-backend/AGENTS.md`, `.agents/rules/{conventions,docs,git}.md`.
2. Read `.agents/maintenance/refactor-backend-report.md` — mark prior findings `RESOLVED` or `STILL OPEN` before starting Phase 1.
3. Verify clean worktree: `git status --short`.
4. Check for an open PR with branch prefix `maint/refactor-backend/`. If found, stop and report its URL.

---

## Phase 1 — Audit

> **L'agent lead fait l'audit lui-même.** Ne pas déléguer à un sub-agent (code-mapper, Explore, ou autre) — un modèle moins capable rate les patterns architecturaux subtils (couplage modules NestJS, race conditions Outbox, dette de type). Lire les fichiers directement avec Read/Grep/Bash.

### Orientation (do not skip)

```bash
git log --stat --since="3 months ago" -- battleforthecrown-backend/
find battleforthecrown-backend/src -name "*.ts" | xargs wc -l | sort -rn | head -30
```

Identify:
- Top 20 largest files (god files ≥ 400 LOC in services, ≥ 200 LOC in controllers)
- Top 20 highest-churn files
- Intersection = highest priority

Form a 1-paragraph mental model of the backend's module structure before proceeding.

### Audit dimensions (cite `file:line` for every finding)

**1. Layering violations**
- Business logic in controllers (routing + validation only; domain rules belong in services)
- Database access outside of services (direct Prisma calls in controllers, gateways, workers)
- Circular module dependencies (`madge --circular` or manual inspection)

**2. Service design**
- God services (> 400 LOC, > 8 public methods, multiple unrelated domains)
- Services with no clear single responsibility
- Duplicated logic across 2+ services that should be a shared helper

**3. Prisma / DB patterns**
- N+1 queries (missing `include`, loops with `.findUnique`)
- Missing transactions on multi-table writes
- Raw SQL where a Prisma query would be safer
- Queries in wrong layer (controller, gateway)
- See `bftc-prisma` for deeper Prisma patterns

**4. Outbox integrity**
- Mutations that bypass the EventOutbox pattern (write without outbox in same transaction)
- Workers that directly emit Socket.IO instead of reading from Outbox
- See `bftc-workers-outbox` for deeper patterns

**5. Error handling**
- Swallowed exceptions (`catch (e) {}`, `catch (e) { console.error }` with no rethrow)
- Inconsistent HTTP error shapes (some throw `HttpException`, some return `{ error: ... }`)
- Missing validation on trust boundaries (controller inputs without class-validator DTOs)

**6. Type debt**
- `as any`, `any` parameter types, untyped return values on public service methods
- Missing DTOs (raw `req.body` access without typed DTO class)
- Unvalidated environment variables (process.env access without a config service)

**7. Configuration & secrets**
- Hardcoded magic strings (URLs, table names, event names used as literals)
- Magic numbers (timeouts, limits, ratios) without named constants
- env vars read outside the config module

**8. Test gaps on critical paths**
- Services/workers with 0 tests that touch money, combat, or resource calculations
- Tests that assert implementation (mock chains) vs. behavior
- Skipped tests (`it.skip`, `xit`) without a comment explaining why

**9. Naming & readability**
- Method names that lie (name says `get*` but method has side effects)
- Module/file names that don't reflect current responsibility
- Variables: single-letter non-loop vars, misleading booleans (`isNotReady`)

### Findings format

```
[ID] [Category] file:line — description — recommendation
Severity: Critical | High | Medium | Low
Effort: S (< 1h) | M (half-day) | L (1-2 days)
```

Group by theme. Aim for 20-50 concrete findings. No padding.

Required section: **"Looks bad but is actually fine"** — patterns investigated and ruled out. If empty, the audit was shallow.

---

## Phase 2 — Refactor

### Candidate selection

Pick one theme from Phase 1 that meets:
- Clear measurable improvement (fewer LOC, eliminated pattern, better type safety)
- Can be fully verified with existing test suite + `yarn static-check`
- Does not require gameplay rule changes or new Prisma migrations

Prefer themes with:
- High severity + Medium effort (impactful but feasible in one PR)
- Multiple related findings in the same module (coherent PR scope)

Reject:
- Themes requiring new Prisma destructive operations
- Pure rename churn with no semantic improvement
- Changes to gameplay balance or business rules

### Implementation

- Use `bftc-prisma` if the refactor touches Prisma schema or queries.
- Use `bftc-workers-outbox` if the refactor touches workers or Outbox.
- Use `bftc-tests-policy` for test decisions.
- Add or update tests when the fix concerns behavior, contracts, or critical paths.

No file count cap — but keep one coherent theme per PR.

### Verification

```bash
yarn static-check
yarn test:backend --testPathPattern=<affected-modules>
```

Run smoke expectations from `bftc-run` if any `src/` module changed.

---

## Report update

Write findings to `.agents/maintenance/refactor-backend-report.md`:

- **Date** + **Commit SHA** of the scan
- Full findings table (mark prior entries `RESOLVED` / `STILL OPEN` / `NEW`)
- Selected theme + rationale
- Rejected themes + reason
- Verification results

---

## PR

Branch: `maint/refactor-backend/<short-topic>`
PR title: `maint(refactor-backend): <subject>`

Commit format:
```
refactor(backend/<module>): <what changed and why>
```

PR body must include:
- Audit summary (top 10 findings, link to full report)
- Selected theme + evidence (file:line citations)
- Why this theme over alternatives
- Files changed
- Verification commands + results
- Docs impact (`.agents/rules/docs.md`)

PR status: **ready for review** (not draft).
