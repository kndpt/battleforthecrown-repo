---
name: bftc-maint-debt
description: Sweeps the existing BFTC codebase for one bounded debt item, fixes it, and proposes a verified PR. Runs twice nightly via Routine. If a PR is already open, reads it and picks a different candidate not already covered.
---

# Maint Debt

1 petit PR/run. Routine 00h+04h — `trigger-strategy.md`. Pas les commits récents → `bftc-maint-new-commits`.

## Preflight

1. **Lire uniquement** `.agents/maintenance/maint-debt-backlog.state.md` (+ open PRs `maint/debt/*`).
2. `git status` clean.
3. PR ouverte même skill → autre candidat, pas déjà couvert.

## Candidat

- 1 phrase fix, fichiers/lignes concrets, ≤5 fichiers, vérif claire avant edit.
- Sources : state `candidate`, churn 3mo, `TODO`/`as any`/eslint-disable, doc drift.
- Reject : prisma destructif, balance, rewrite large, format churn.

## Impl

Skills zone : `bftc-prisma`, `bftc-workers-outbox`, `bftc-pixi-scene`, `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`.

## Post-run

1. Append détail → `archive/maint-debt/YYYY-MM-DD-full.md` si narratif long
2. **Réécrire** `maint-debt-backlog.state.md` : candidats actifs only, ≤20 rows — `harness.md`
3. `yarn static-check` + tests ciblés ; smokes si backend `src/`
4. PR `maint/debt/<topic>` ready
