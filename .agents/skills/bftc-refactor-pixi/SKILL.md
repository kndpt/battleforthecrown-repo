---
name: bftc-refactor-pixi
description: Deep code quality audit + structural refactor of battleforthecrown-pixi (React, Zustand, TanStack Query, PixiJS). Two phases: annotated findings report, then one scoped PR ready for review. Runs weekly Saturday night via Routine.
---

# BFTC Refactor — Pixi Frontend

Deep code quality pass on `battleforthecrown-pixi/`. Two phases: **Audit** (annotated findings) then **Refactor** (one scoped PR, ready for review).

Unlike `bftc-maint-debt`, this skill tackles structural issues: server-authoritative violations, store design, component coupling, scene architecture — not just bounded quick fixes.

## When to trigger

**Routine** — weekly, Saturday night (offset by 1h from `bftc-refactor-backend`), see `.agents/maintenance/trigger-strategy.md` for setup.
**Manual** — after a large Pixi/React feature lands, or when `bftc-maint-debt` keeps surfacing the same component.

---

## Contract

- Run both phases unless called with `--audit-only`.
- Produce exactly one PR per run, ready for review (not draft).
- The PR addresses one coherent refactor theme derived from the audit.
- Update `.agents/maintenance/refactor-pixi-report.md` with the full findings.

---

## Preflight

1. Read `battleforthecrown-pixi/AGENTS.md`, `.agents/rules/{conventions,docs,git}.md`.
2. Read `.agents/maintenance/refactor-pixi-report.md` — mark prior findings `RESOLVED` or `STILL OPEN` before starting Phase 1.
3. Verify clean worktree: `git status --short`.
4. Check for an open PR with branch prefix `maint/refactor-pixi/`. If found, stop and report its URL.

---

## Phase 1 — Audit

> **L'agent lead fait l'audit lui-même.** Ne pas déléguer à un sub-agent (code-mapper, Explore, ou autre) — un modèle moins capable rate les patterns architecturaux subtils (server-authoritative violations, race conditions WS, anti-patterns Zustand). Lire les fichiers directement avec Read/Grep/Bash.

### Orientation (do not skip)

```bash
git log --stat --since="3 months ago" -- battleforthecrown-pixi/
find battleforthecrown-pixi/src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -30
```

Identify:
- Top 20 largest files (god components ≥ 300 LOC, god stores ≥ 200 LOC, god scenes ≥ 500 LOC)
- Top 20 highest-churn files
- Intersection = highest priority

Form a 1-paragraph mental model of the frontend layers (API, stores, view-models, scenes, HUD) before proceeding.

### Audit dimensions (cite `file:line` for every finding)

**1. Server-authoritative violations**
- Frontend computing authoritative state locally (resource balances, troop counts, timers treated as truth rather than interpolation)
- Mutations that update store directly without going through REST → TanStack Query invalidation cycle
- Values derived from local calculations that should come from the server
- See `.agents/rules/conventions.md` §"Architecture serveur-autoritaire"

**2. Optimistic UI misuse**
- Optimistic updates on operations that don't meet the 3 criteria (< 500ms, trivial rollback, WS re-sync)
- Missing `onError` rollback in optimistic patterns
- Stale snapshots not cleaned up after `onSettled`

**3. Store design (Zustand)**
- God stores (single store for unrelated domains)
- Derived state computed inside the store that should be a selector or view-model
- Store state mutated from outside the store (direct `.setState` calls bypassing actions)
- Duplicated state between a Zustand store and a TanStack Query cache
- Missing reset on logout/disconnect

**4. TanStack Query patterns**
- Direct `fetch`/`axios` calls outside of query functions
- Missing `staleTime` / `gcTime` on frequently-read queries (causing waterfalls)
- Mutations that don't invalidate the relevant query keys
- `useEffect` used to trigger fetches instead of query enabled conditions

**5. Component design**
- Business logic in JSX components (derivations, calculations, rule checks belong in view-models or hooks)
- Components with > 2 responsibilities
- Prop drilling > 2 levels where a store or context would be appropriate
- Missing error boundaries around Pixi canvas or async panels

**6. Pixi scene architecture**
- Scenes that mix rendering, input handling, AND game state (should be separated)
- Direct store reads inside Pixi tick loops (prefer snapshot passing)
- Asset loading inside scene `update()` instead of preload phase
- Missing cleanup in `destroy()` / scene teardown (listener leaks, ticker leaks)
- See `bftc-pixi-scene` for deeper Pixi patterns

**7. Type debt**
- `as any`, untyped event payloads, untyped WebSocket message handlers
- Missing Zod validation on API response shapes at trust boundary
- DTO types imported from backend (should be from `packages/shared/`)

**8. API layer**
- Raw `fetch` outside the API client (`src/api/`)
- Error handling inconsistencies (some callers check `.ok`, some don't)
- Missing retry / 401 refresh in non-standard call sites

**9. Naming & readability**
- Component names that don't reflect current responsibility
- Hook names without `use` prefix, or hooks that do too much
- Magic numbers in layout/positioning without named constants
- Boolean props named as negations (`isNotReady`, `disableAnimation`)

**10. Test gaps**
- View-model / formula files with 0 tests
- Zustand store actions tested by mocking internals rather than behavior
- See `bftc-tests-policy` for BFTC test conventions

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
- Clear measurable improvement (fewer responsibilities, eliminated pattern, better type safety)
- Can be fully verified with `yarn test:pixi` + `yarn static-check`
- Does not require backend API changes or new endpoints

Prefer themes with:
- Server-authoritative violations (highest systemic risk)
- Store design issues (high coupling, hard to test)
- Multiple related findings in the same module

Reject:
- Pure cosmetic renames with no behavioral impact
- New features or gameplay additions
- Changes requiring backend schema changes

### Implementation

- Use `bftc-react-hud` if the refactor touches HUD/panels/forms.
- Use `bftc-pixi-scene` if the refactor touches Pixi scenes or viewport.
- Use `bftc-tests-policy` for test decisions.
- Add or update tests for any view-model, store action, or formula touched.

No file count cap — but keep one coherent theme per PR.

### Verification

```bash
yarn static-check
yarn test:pixi --testPathPattern=<affected-modules>
```

---

## Report update

Write findings to `.agents/maintenance/refactor-pixi-report.md`:

- **Date** + **Commit SHA** of the scan
- Full findings table (mark prior entries `RESOLVED` / `STILL OPEN` / `NEW`)
- Selected theme + rationale
- Rejected themes + reason
- Verification results

---

## PR

Branch: `maint/refactor-pixi/<short-topic>`
PR title: `maint(refactor-pixi): <subject>`

Commit format:
```
refactor(pixi/<module>): <what changed and why>
```

PR body must include:
- Audit summary (top 10 findings, link to full report)
- Selected theme + evidence (file:line citations)
- Why this theme over alternatives
- Files changed
- Verification commands + results
- Docs impact (`.agents/rules/docs.md`)

PR status: **ready for review** (not draft).
