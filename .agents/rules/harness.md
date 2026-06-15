---
description: Concision harness — state vs archive, pas de duplication README/skills.
alwaysApply: true
---

# Harness — concision

Style : phrases courtes. Sacrifier grammaire si ça réduit tokens.

## Où écrire

| Besoin | Fichier | Règle |
|--------|---------|-------|
| État agent (OPEN, last run) | `*.state.md` | **Réécrire** chaque run, ≤80 lignes |
| Narratif / historique | `archive/<topic>/YYYY-MM-DD-full.md` | append OK, **jamais lu en preflight** |
| Pipeline run | `bftc-run` SKILL | README = index + liens |
| Procédure maint/refactor | skill dédié | pas recopier dans README |

## Interdits

- Dupliquer un skill dans un README
- Append findings dans un fichier lu à chaque invocation
- `tasks/todo.md` comme log long — archiver hors racine active
- Relire rules `alwaysApply` + `AGENTS.md` si déjà injectés (sauf ambiguïté)

## Run archivé (`bftc-run` étape 10)

Avant `git mv` → `runs/archive/` :
- `Progress` / `Décisions prises` → supprimer ou `_(git history)_`
- `Rapport final` → garder `Acceptance & QA` + ≤3 lignes synthèse
- `Cible` / `Critère de fin` : inchangés (humain)

## Maintenance

Preflight lit **uniquement** le `.state.md` du skill. Full report → archive datée post-run.
