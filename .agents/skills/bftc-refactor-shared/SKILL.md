---
name: bftc-refactor-shared
description: Audit + structural refactor of packages/shared. Two phases: findings report, then scoped PR. Runs Saturday night.
---

# Refactor Shared

Audit → 1 PR. Routine sam 03h — `trigger-strategy.md`.

## Preflight

1. Root `AGENTS.md` si scope flou.
2. **Lire uniquement** `.agents/maintenance/refactor-shared.state.md`.
3. `git status` clean ; stop si PR `maint/refactor-shared/*`.

## Phase 1 — Audit (lead direct)

```bash
git log --stat --since="3 months ago" -- packages/shared/
find packages/shared/src -name "*.ts" | xargs wc -l | sort -rn | head -20
```

Dimensions : pure formulas, DTO/Zod contracts, cross-workspace duplication, forbidden imports (shared → workspace), test gaps.

## Phase 2 — Refactor

- 1 thème ; tests via consommateur si pas de runner shared dédié.
- `yarn static-check` + tests workspace impacté.

## Post-run

1. Append full → `archive/refactor-shared/YYYY-MM-DD-full.md`
2. Réécrire `refactor-shared.state.md` (≤80L)
3. PR `maint/refactor-shared/<topic>` ready.
