---
name: bftc-refactor-pixi
description: Deep code quality audit + structural refactor of battleforthecrown-pixi. Two phases: annotated findings report, then one scoped PR ready for review. Runs weekly Saturday night via Routine.
---

# Refactor Pixi

Audit → 1 PR. Routine sam 02h — `trigger-strategy.md`.

## Preflight

1. `battleforthecrown-pixi/AGENTS.md` si scope flou.
2. **Lire uniquement** `.agents/maintenance/refactor-pixi.state.md`.
3. `git status` clean ; stop si PR `maint/refactor-pixi/*`.

## Phase 1 — Audit (lead direct)

```bash
git log --stat --since="3 months ago" -- battleforthecrown-pixi/
find battleforthecrown-pixi/src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -30
```

Dimensions : server-authoritative violations, TanStack Query keys/staleTime, Zustand, WS invalidations, Pixi scenes, god components, type debt, test gaps.

Format : `ID | cat | file:line | 1 line | Sev | Effort`. Section **Looks bad but fine**.

## Phase 2 — Refactor

- 1 thème cohérent ; `bftc-react-hud` / `bftc-pixi-scene` / `bftc-tests-policy` si besoin.
- `yarn static-check` + `yarn test:pixi` ciblé.

## Post-run

1. Append full → `archive/refactor-pixi/YYYY-MM-DD-full.md`
2. Réécrire `refactor-pixi.state.md` (≤80L)
3. PR `maint/refactor-pixi/<topic>` ready ; rebase main si behind.
