---
name: bftc-maint-new-commits
description: Scans new commits on main since the last cursor, fixes one bounded debt item introduced by the diff, and proposes a verified PR. Auto-triggers at session start when unreviewed commits exist.
invoke: auto
---

# Maint New Commits

Range `last_analyzed_main_sha..origin/main` via `.agents/maintenance/maint-new-commits-ledger.md`. Max 1 PR.

## Preflight

1. **Ledger only** — pas backlog/refactor state sauf overlap candidat.
2. `git fetch origin main` ; worktree clean.
3. Stop si PR ouverte `maint/new-commits/*` ou range vide.

## Contract

- SHA cursor, jamais fenêtre temps.
- 1 fix low/med introduit ou révélé par le range.
- Cursor avance **uniquement** via PR touchant le ledger.
- Range clean → PR ledger-only « reviewed, no debt ».

## Impl

≤5 fichiers ; mêmes rejects que `bftc-maint-debt`. `yarn static-check` + tests.

## Post-run

- Maj ledger dans la PR.
- Pas toucher `*.state.md` refactor/debt sauf candidat explicitement traité.

PR : `maint/new-commits/<short-sha>` | `maint(new-commits): review new main commits`
