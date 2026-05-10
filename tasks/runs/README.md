# Runs — fiches d'exécution semi-autonomes

Un **run** = une exécution déléguée au système d'équipe Claude (lead + sub-agents) sur un scope cadré : audit d'un module, implémentation d'une feature, fix d'un écart spec/code, etc.

Chaque run a sa fiche `<id>-<slug>.md` dans ce dossier. Source de vérité de l'état d'un run pendant et après son exécution.

Pipeline d'orchestration : `.claude/commands/run.md` (slash command `/run <id>`).

## Pipeline d'un run (étapes 1-10)

| # | Étape | Qui fait | Sortie attendue |
|---:|---|---|---|
| 0 | Préflight (git clean, fiche `PLANNED`, spec lue, rules chargées) | Lead | Go / abort |
| 1 | Clarification (≤ 4 questions, 1 aller-retour max) | Lead → User | Réponses ou skip |
| 2 | Analyse code (cartographie) | Sub-agent `code-mapper` | `=== CARTE MODULE ===` |
| 3 | Refinement (raisonnement, décomposition chirurgicale) | Lead | TaskList + maj fiche |
| 4 | Coding | Lead (< 10 lignes, 1 fichier) **ou** sub-agent `implementer` | Diff + `=== RAPPORT EXEC ===` |
| 5 | Testing (création/modif tests selon `tests.md`) | Lead (< 10 lignes) **ou** sub-agent `test-writer` | Diff + rapport |
| 6 | Review 5 axes | Sub-agent `agent-skills:code-reviewer` (plugin) | Findings |
| 7 | Fix des findings (1 finding = 1 tâche chirurgicale) | Sub-agent `implementer` | Diff + rapport |
| 8 | Re-test | Sub-agent `test-runner` | `=== RUN TESTS ===` |
| 9 | Documentation (création/maj/références croisées) | Sub-agent `doc-writer` | Diff + rapport |
| 10 | Archive + commit final | Lead | Fiche `DONE`, commit unique |

Hard gate `git diff --stat` après chaque sub-agent qui écrit, sans exception.

## Sub-agents disponibles

- [`run-planner`](../../.claude/agents/run-planner.md) — produit un draft de fiche depuis la roadmap (utilisé par `/plan-run`).
- [`code-mapper`](../../.claude/agents/code-mapper.md) — cartographie ciblée (signatures, callers, tests, écarts évidents).
- [`implementer`](../../.claude/agents/implementer.md) — applique un changement précis et bien cadré (≤ 5 fichiers).
- [`test-writer`](../../.claude/agents/test-writer.md) — écrit/modifie tests selon `tests.md` (refus anti-patterns).
- [`test-runner`](../../.claude/agents/test-runner.md) — lance suite, retourne uniquement les fails.
- [`doc-writer`](../../.claude/agents/doc-writer.md) — crée/maj docs + références croisées (refus duplication).
- `agent-skills:code-reviewer` — built-in plugin, review 5 axes.

## Slash commands

- [`/plan-run <description>`](../../.claude/commands/plan-run.md) — crée une fiche de run depuis la roadmap (validation user avant écriture).
- [`/run <id>`](../../.claude/commands/run.md) — exécute une fiche `PLANNED` selon le pipeline 1-10.

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

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

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
- [`safety-fallbacks.md`](./safety-fallbacks.md) — mitigations de secours (worktree, fork, Agent Teams) si la délégation sub-agent dérive.
- [`../../.claude/commands/run.md`](../../.claude/commands/run.md) — slash command `/run <id>` qui exécute le pipeline.
