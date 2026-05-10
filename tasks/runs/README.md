# Runs — fiches d'exécution semi-autonomes

Un **run** = une exécution déléguée au pipeline lead + sub-agents (Claude Code ou Codex) sur un scope cadré : audit d'un module, implémentation d'une feature, fix d'un écart spec/code, etc.

Chaque run a sa fiche `<id>-<slug>.md` dans ce dossier. Source de vérité de l'état d'un run pendant et après son exécution.

Pipeline d'orchestration : skill `/run <id>`. Mêmes étapes 1-10 dans les deux harnesses, conventions de nommage des sub-agents adaptées :

- **Claude Code** : [`.claude/commands/run.md`](../../.claude/commands/run.md) (slash command natif) + sub-agents [`.claude/agents/*.md`](../../.claude/agents/) (kebab-case, ex `code-mapper`). Review = plugin `agent-skills:code-reviewer`.
- **Codex** : [`.agents/skills/run/SKILL.md`](../../.agents/skills/run/SKILL.md) (consommé via le symlink `.codex/skills/run/`) + sub-agents [`.codex/agents/*.toml`](../../.codex/agents/) (snake_case, ex `code_mapper`). Review = lead lui-même ou agent `default` Codex (pas de reviewer dédié).

## Pipeline d'un run (étapes 1-10)

| # | Étape | Qui fait | Sortie attendue |
|---:|---|---|---|
| 0 | Préflight (git clean, fiche `PLANNED`, spec lue, rules chargées) | Lead | Go / abort |
| 1 | Clarification (≤ 4 questions, 1 aller-retour max) | Lead → User | Réponses ou skip |
| 2 | Analyse code (cartographie) | Sub-agent `code-mapper` / `code_mapper` | `=== CARTE MODULE ===` |
| 3 | Refinement (raisonnement, décomposition chirurgicale) | Lead | TaskList + maj fiche |
| 4 | Coding | Lead (< 10 lignes, 1 fichier) **ou** sub-agent `implementer` | Diff + `=== RAPPORT EXEC ===` |
| 5 | Testing (création/modif tests selon `tests.md`) | Lead (< 10 lignes) **ou** sub-agent `test-writer` / `test_writer` | Diff + rapport |
| 6 | Review 5 axes | Claude : plugin `agent-skills:code-reviewer`. Codex : lead ou agent `default`. | Findings |
| 7 | Fix des findings (1 finding = 1 tâche chirurgicale) | Sub-agent `implementer` | Diff + rapport |
| 8 | Re-test | Sub-agent `test-runner` / `test_runner` | `=== RUN TESTS ===` |
| 9 | Documentation (création/maj/références croisées) | Sub-agent `doc-writer` / `doc_writer` | Diff + rapport |
| 10 | Archive + commit final | Lead | Fiche `DONE`, commit unique |

Hard gate `git diff --stat` après chaque sub-agent qui écrit, sans exception.

## Sub-agents disponibles

Définitions par harness : Claude Code → `.claude/agents/*.md` (kebab-case) ; Codex → `.codex/agents/*.toml` (snake_case, 6 agents convertis depuis Claude). Rôles identiques d'un côté à l'autre :

- `run-planner` / `run_planner` — produit un draft de fiche depuis la roadmap (utilisé par `/plan-run`).
- `code-mapper` / `code_mapper` — cartographie ciblée (signatures, callers, tests, écarts évidents).
- `implementer` — applique un changement précis et bien cadré (≤ 5 fichiers).
- `test-writer` / `test_writer` — écrit/modifie tests selon `tests.md` (refus anti-patterns).
- `test-runner` / `test_runner` — lance suite, retourne uniquement les fails.
- `doc-writer` / `doc_writer` — crée/maj docs + références croisées (refus duplication).
- Review 5 axes : `agent-skills:code-reviewer` (plugin Claude) ou lead/agent `default` (Codex).

## Slash commands

Disponibles dans les deux harnesses (Claude : `.claude/commands/*.md` ; Codex : skill `.agents/skills/<name>/SKILL.md` consommé via le symlink `.codex/skills/`) :

- `/plan-run <description>` — crée une fiche de run depuis la roadmap (validation user avant écriture).
- `/run <id>` — exécute une fiche `PLANNED` selon le pipeline 1-10.

## Cycle de vie d'un run

```
PLANNED → RUNNING → (BLOCKED ↔ RUNNING) → DONE
                  ↘ ABORTED
```

- `PLANNED` — fiche écrite, pas encore lancée.
- `RUNNING` — pipeline en cours.
- `BLOCKED` — escalade utilisateur (clarification critique, 3 cycles correctifs dépassés, dérogations consécutives, token budget lead saturé).
- `DONE` — pipeline complet, commit final, fiche `Rapport final` rempli.
- `ABORTED` — arrêt explicite humain ou échec irrécupérable.

## Convention de nommage

`<id 3-digit>-<slug-en-kebab>.md`. Le pilote est `000-*` ; les vrais runs commencent à `001-*`.

## Lifecycle d'écriture

| Section | Quand | Auteur |
|---|---|---|
| `## Cible`, `## Dépendances`, `## Critère de fin` | Avant lancement | Humain (toi) |
| `## Décomposition initiale` | Étape 3 | Lead |
| `## Progress`, `## Décisions prises` | Étapes 2-9 | Lead (les sub-agents reportent au lead, qui logue) |
| `## Rapport final` | Étape 10 | Lead |

Le lead **ne réécrit jamais** les sections « avant lancement » — il les lit et travaille à partir d'elles.

## Archivage

Quand un run passe à `DONE` ou `ABORTED`, sa fiche est **déplacée** vers [`archive/`](./archive/) (cohérence avec `tasks/archive/` pour les tickets résolus). Le mouvement est fait à l'étape 10 du pipeline (`.claude/commands/run.md`) via `git mv`. **Pas de suppression** — trace décisionnelle (pourquoi ce choix, qu'est-ce qui a coincé).

Les liens depuis `tasks/README.md` et autres docs doivent être mis à jour vers `runs/archive/<id>-<slug>.md` lors de l'archivage.

## Template

```markdown
# Run #<id> — <slug>

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : <numéro + nom de phase, cf. `tasks/00-mvp-roadmap.md`>
- **Spec source** : <lien vers `docs/gameplay/...` ou `docs/architecture/...`>
- **Type** : <`audit` | `feature` | `fix`>
- **Modules backend** : <ex. `power` | `—`>
- **Modules frontend** : <ex. `pixi/scenes/village` | `—`>

## Dépendances

- <prérequis : phase précédente terminée, autre run done, etc.>

## Critère de fin (acceptance)

- [ ] <critère 1, observable et binaire>
- [ ] <critère 2>
- [ ] …

## Règles à respecter

- Tests : @.agents/rules/tests.md
- QA : @.agents/rules/qa.md
- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, QA résiduelle qui revient à toi, méta-évaluation si applicable.)_
```

## Liens

- [`../00-mvp-roadmap.md`](../00-mvp-roadmap.md) — roadmap des phases dont sont dérivés les runs.
- [`../README.md`](../README.md) — index global des tickets/runs/archives.
- [`safety-fallbacks.md`](./safety-fallbacks.md) — mitigations génériques (hard gate diff, scope chirurgical, refus sub-agent, rapport structuré).
- [`safety-fallbacks-claude.md`](./safety-fallbacks-claude.md) — mitigations avancées Claude-spécifiques (worktree, fork, Agent Teams).
- [`../../.agents/skills/run/SKILL.md`](../../.agents/skills/run/SKILL.md) — pipeline Codex (skill).
- [`../../.claude/commands/run.md`](../../.claude/commands/run.md) — pipeline Claude Code (slash command).
