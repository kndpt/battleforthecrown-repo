---
name: bftc-refactor-shared
description: Deep code quality audit + structural refactor of packages/shared — contracts, pure formulas, duplication across workspaces. Two phases: annotated findings report, then one scoped PR ready for review. Runs weekly Saturday night via Routine.
---

# BFTC Refactor — Shared Package

Deep code quality pass on `packages/shared/`. Two phases: **Audit** (annotated findings) then **Refactor** (one scoped PR, ready for review).

`packages/shared/` is read-only from the perspective of consumers. Its quality directly sets the quality ceiling of the entire codebase — bad contracts here propagate everywhere.

## When to trigger

**Routine** — weekly, Saturday night (offset by 2h from `bftc-refactor-backend`), see `.agents/maintenance/trigger-strategy.md` for setup.
**Manual** — when `bftc-maint-debt` surfaces duplication between backend and frontend that should be extracted.

---

## Contract

- Run both phases unless called with `--audit-only`.
- Produce exactly one PR per run, ready for review (not draft).
- The PR addresses one coherent refactor theme derived from the audit.
- Update `.agents/maintenance/refactor-shared-report.md` with the full findings.

---

## Preflight

1. Read root `AGENTS.md`, `.agents/rules/{conventions,docs,git}.md`.
2. Read `.agents/maintenance/refactor-shared-report.md` — mark prior findings `RESOLVED` or `STILL OPEN` before starting Phase 1.
3. Verify clean worktree: `git status --short`.
4. Check for an open PR with branch prefix `claude/bftc-refactor-shared`. If found, stop and report its URL.

---

## Phase 1 — Audit

### Orientation (do not skip)

```bash
git log --stat --since="3 months ago" -- packages/shared/
find packages/shared/src -name "*.ts" | xargs wc -l | sort -rn
```

Map the full export surface: what does `packages/shared/` expose, and what do each workspace actually import from it?

```bash
grep -r "from '@battleforthecrown/shared'" battleforthecrown-backend/src --include="*.ts" | sed "s/.*from '//;s/'.*//" | sort | uniq -c | sort -rn | head -20
grep -r "from '@battleforthecrown/shared'" battleforthecrown-pixi/src --include="*.ts" | sed "s/.*from '//;s/'.*//" | sort | uniq -c | sort -rn | head -20
```

Form a 1-paragraph mental model of the shared package's role before proceeding.

### Audit dimensions (cite `file:line` for every finding)

**1. Pure function integrity**
- Functions with side effects (I/O, Date.now(), Math.random(), console.*) that should be pure
- Formulas that depend on global mutable state
- Functions that mutate their arguments

**2. Contract quality**
- Exported types that are too loose (`string` where a union literal would be safer, `number` where a branded type would prevent mix-ups)
- Missing discriminated unions where multiple related shapes exist
- Enums exported as TypeScript `enum` (prefer `const` object + `type` for better tree-shaking and portability)
- Types that expose internal implementation details consumers shouldn't depend on

**3. Duplication with workspaces**
- Logic in `battleforthecrown-backend/src/` that duplicates a formula in `packages/shared/` (should use shared)
- Logic in `battleforthecrown-pixi/src/` that recomputes a value already in `packages/shared/`
- Conversely: logic in `packages/shared/` that belongs only in one workspace (leaked coupling)

**4. Dead exports**
- Types or functions exported but imported nowhere across the workspaces
- Re-exports of types that are no longer used
- Deprecated aliases kept "for compatibility" with nothing to be compatible with

```bash
npx knip --workspace packages/shared 2>/dev/null || grep -r "export" packages/shared/src --include="*.ts" -l
```

**5. Type debt**
- `any` in exported signatures
- Generic constraints that are too loose (`<T>` where `<T extends SomeBase>` would be correct)
- Missing `readonly` on array/object types that should not be mutated by consumers

**6. Missing formulas**
- Business rules that exist verbatim in both backend and frontend that should be extracted here
- Constants (rate limits, caps, ratios) defined in multiple places

**7. Circular dependencies**
- Imports within `packages/shared/` that form cycles
- `packages/shared/` importing from a workspace (violation of the dependency direction)

```bash
npx madge --circular packages/shared/src 2>/dev/null || echo "madge not available"
```

**8. Test coverage**
- Pure formulas with 0 tests (every formula should have at least one test)
- Edge cases not covered: zero inputs, max values, invalid combinations
- Tests asserting implementation instead of mathematical properties

**9. Naming & readability**
- Type names that don't communicate their invariants
- Function names that don't reflect what they actually compute
- Exported identifiers that shadow common JS globals or TS builtins

### Findings format

```
[ID] [Category] file:line — description — recommendation
Severity: Critical | High | Medium | Low
Effort: S (< 1h) | M (half-day) | L (1-2 days)
```

Group by theme. Aim for 10-30 concrete findings (shared is smaller than the workspaces). No padding.

Required section: **"Looks bad but is actually fine"** — patterns investigated and ruled out. If empty, the audit was shallow.

---

## Phase 2 — Refactor

### Candidate selection

Pick one theme that meets:
- Clear measurable improvement (stronger contracts, eliminated duplication, better test coverage)
- Can be fully verified: `yarn workspace @battleforthecrown/shared build` + `yarn test:backend` + `yarn test:pixi` (consumers must still compile)
- Does not break the workspace build (`tsc --noEmit` on backend and pixi after the change)

Prefer themes with:
- Duplication elimination (backend + pixi both benefit)
- Contract strengthening (catches bugs statically across the whole codebase)
- Pure formula test coverage (highest confidence-to-effort ratio)

Reject:
- Changes that require a backend migration (data shape changes)
- Pure renames that generate noise across 50+ import sites without semantic improvement
- Adding side-effectful code to the shared package

### Implementation

After changing `packages/shared/`:
1. Run `yarn workspace @battleforthecrown/shared build` — shared must compile first.
2. Run `yarn static-check` — verify no breakage in consumers.
3. Run `yarn test:backend && yarn test:pixi` — no regressions.

- Use `bftc-tests-policy` for test decisions.
- Add tests for any new or changed formula.

### Verification

```bash
yarn workspace @battleforthecrown/shared build
yarn static-check
yarn test:backend
yarn test:pixi
```

---

## Report update

Write findings to `.agents/maintenance/refactor-shared-report.md`:

- **Date** + **Commit SHA** of the scan
- Full findings table (mark prior entries `RESOLVED` / `STILL OPEN` / `NEW`)
- Selected theme + rationale
- Rejected themes + reason
- Verification results

---

## PR

Branch: `claude/bftc-refactor-shared-<short-topic>`

Commit format:
```
refactor(shared): <what changed and why>
```

PR body must include:
- Audit summary (top findings, link to full report)
- Selected theme + evidence (file:line citations)
- Consumer impact (which backend/pixi files were updated)
- Verification commands + results
- Docs impact (`.agents/rules/docs.md`)

PR status: **ready for review** (not draft).
