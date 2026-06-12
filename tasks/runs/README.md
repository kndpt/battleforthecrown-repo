# Runs

Fiches d'exécution semi-autonomes. **Pipeline = skill unique** : [`.agents/skills/bftc-run/SKILL.md`](../../.agents/skills/bftc-run/SKILL.md). Planification : [`bftc-plan`](../../.agents/skills/bftc-plan/SKILL.md).

## Commandes

- `$bftc-run tasks/runs/<id>-<slug>.md` — mode run, PR obligatoire (sauf dérogation démarrage)
- `$bftc-run tasks/<id>-<slug>.md` — mode ticket, pas de PR par défaut

Branches : `run/<id>-<slug>` | `task/<id>-<slug>`. Titres PR : `run(<id>): …` | `task(<id>): …`.

## Cycle

`PLANNED → RUNNING → DONE | ABORTED` (via `BLOCKED` si escalade)

## Nommage

`<id 3-digit>-<slug-kebab>.md`. Pilote `000-*` ; prod dès `001-*`.

## Template

[`_template.md`](./_template.md) — copier pour nouvelle fiche. Sections humaines (`Cible`, `Dépendances`, `Critère de fin`) : lead ne modifie pas.

## Archivage

`DONE`/`ABORTED` → `archive/` via `git mv` (étape 10 `bftc-run`). Fiche compactée — détail narratif = `git history`.

## Sub-agents

Définitions : `.claude/agents/*.md` (kebab) | `.codex/agents/*.toml` (snake). Rôles : `code-mapper`, `implementer`, `test-writer`, `test-runner`, `doc-writer`, `reviewer`, `run-planner`.

## Liens

- [Roadmap](../00-mvp-roadmap.md)
- [Index tasks](../README.md)
- [Concision harness](../../.agents/rules/harness.md)
