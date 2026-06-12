---
name: bftc-refactor-backend
description: Deep code quality audit + structural refactor of battleforthecrown-backend. Two phases: annotated findings report, then one scoped PR ready for review. Runs weekly Saturday night via Routine.
---

# Refactor Backend

Audit → 1 PR thème cohérent. Pas de cap fichiers. Routine sam 01h — `.agents/maintenance/trigger-strategy.md`.

## Preflight

1. `battleforthecrown-backend/AGENTS.md` si scope flou.
2. **Lire uniquement** `.agents/maintenance/refactor-backend.state.md` (pas `archive/` sauf user `--deep`).
3. `git status` clean ; stop si PR ouverte `maint/refactor-backend/*`.

## Phase 1 — Audit (lead direct, pas sub-agent)

```bash
git log --stat --since="3 months ago" -- battleforthecrown-backend/
find battleforthecrown-backend/src -name "*.ts" | xargs wc -l | sort -rn | head -30
```

Dimensions (cite `file:line`) : layering, god services, Prisma/N+1/tx, Outbox, errors, type debt, config, test gaps, naming.

Format finding : `ID | cat | file:line | 1 line | Sev | Effort S/M/L`

20–50 findings. Section **Looks bad but fine** obligatoire si vide = audit shallow.

## Phase 2 — Refactor

- 1 thème : high/med impact, vérifiable `yarn static-check` + tests, pas migration destructive ni balance.
- Skills si besoin : `bftc-prisma`, `bftc-workers-outbox`, `bftc-tests-policy`.
- Smokes : règle `bftc-run` si `src/` touché.

## Post-run

1. Append rapport complet → `.agents/maintenance/archive/refactor-backend/YYYY-MM-DD-full.md`
2. **Réécrire** `refactor-backend.state.md` (OPEN + last_run, ≤80L) — `.agents/rules/harness.md`
3. PR `maint/refactor-backend/<topic>` ready ; merge `origin/main` si behind avant ready.
