# Runs — fiches d'exécution semi-autonomes

Un **run** = une exécution déléguée au pipeline lead + sub-agents (Claude Code ou Codex) sur un scope cadré : audit d'un module, implémentation d'une feature, fix d'un écart spec/code, etc.

Chaque run a sa fiche `<id>-<slug>.md` dans ce dossier. Source de vérité de l'état d'un run pendant et après son exécution.

Pipeline d'orchestration : skill `$run <path>` (path de fichier obligatoire, avec ou sans préfixe `@` — certains harnesses strip le `@` automatiquement). Le path détermine le mode :

- `tasks/runs/<id>-<slug>.md` → **mode run**, pipeline 10 étapes complet.
- `tasks/<id>-<slug>.md` → **mode ticket**, pipeline allégé (mode rapide auto, skip `code-mapper`/`test-runner`/`doc-writer` selon critères, cas A élargi à ≤ 30 lignes ≤ 2 fichiers, **review et hard gate `git diff` non-négociables**).

Même source de vérité dans les deux harnesses, conventions de nommage des sub-agents adaptées :

- **Source unique** : [`.agents/skills/run/SKILL.md`](../../.agents/skills/run/SKILL.md) et [`.agents/skills/plan-run/SKILL.md`](../../.agents/skills/plan-run/SKILL.md).
- **Claude Code** : consomme les skills via le symlink `.claude/skills/`; sub-agents [`.claude/agents/*.md`](../../.claude/agents/) en kebab-case, ex `code-mapper`.
- **Codex** : consomme les skills via le symlink `.codex/skills/`; sub-agents [`.codex/agents/*.toml`](../../.codex/agents/) en snake_case, ex `code_mapper`.

## Pipeline d'un run (étapes 1-10)

| # | Étape | Qui fait | Sortie attendue |
|---:|---|---|---|
| 0 | Préflight (git clean, fiche `PLANNED`, spec lue, rules chargées) | Lead | Go / abort |
| 1 | Clarification (≤ 4 questions, 1 aller-retour max) | Lead → User | Réponses ou skip |
| 2 | Analyse code (cartographie) | Sub-agent `code-mapper` | `=== CARTE MODULE ===` |
| 3 | Refinement (raisonnement, décomposition chirurgicale) | Lead | TaskList + maj fiche |
| 4 | Coding | Lead (< 10 lignes, 1 fichier) **ou** sub-agent `implementer` | Diff + `=== RAPPORT EXEC ===` |
| 5 | Testing (création/modif tests selon `tests.md`) | Lead (< 10 lignes) **ou** sub-agent `test-writer` | Diff + rapport |
| 6 | Review 5 axes | Lead ou agent généraliste disponible dans le harness. | Findings |
| 7 | Fix des findings (1 finding = 1 tâche chirurgicale) | Sub-agent `implementer` | Diff + rapport |
| 8 | Re-test | Sub-agent `test-runner` | `=== RUN TESTS ===` |
| 8c | Backprop SPEC (promo §V/§B si savoir transverse révélé) | Lead | Diff SPEC.md (hard gate) |
| 9 | Documentation (création/maj/références croisées) | Sub-agent `doc-writer` | Diff + rapport |
| 10 | Archive + commit final | Lead | Fiche `DONE`, commit unique |

Garde-fou unique : délégation chirurgicale, refus si scope ambigu, rapport structuré, puis `git diff --stat` après chaque écriture. Si ce filet échoue deux fois, ouvrir un ticket process au lieu d'empiler des fallbacks.

## Sub-agents disponibles

Définitions par harness : 
- Claude Code → `.claude/agents/*.md` (kebab-case)
- Codex → `.codex/agents/*.toml` (snake_case)

Rôles identiques d'un côté à l'autre :

- `run-planner` / `run_planner` — produit un draft de fiche depuis la roadmap (utilisé par `$plan-run`).
- `code-mapper` — cartographie ciblée (signatures, callers, tests, écarts évidents).
- `implementer` — applique un changement précis et bien cadré (≤ 5 fichiers).
- `test-writer` — écrit/modifie tests selon `tests.md` (refus anti-patterns).
- `test-runner` — lance suite, retourne uniquement les fails.
- `doc-writer` — crée/maj docs + références croisées (refus duplication).
- Review 5 axes : lead par défaut, ou agent généraliste disponible (`default` côté Codex).

## Skills workspace

Disponibles dans Claude Code et Codex via les symlinks `.claude/skills` et `.codex/skills` vers `.agents/skills` :

- `$plan-run <description>` — crée une fiche de run depuis la roadmap (validation user avant écriture).
- `$run <path>` — exécute une fiche `PLANNED` (mode run) ou résout un ticket actif (mode ticket). Path obligatoire, `@` optionnel.

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
| `SPEC.md` racine | Étape 8c | Lead (édition directe, gouvernance) |

Le lead **ne réécrit jamais** les sections « avant lancement » — il les lit et travaille à partir d'elles.

## Archivage

Quand un run passe à `DONE` ou `ABORTED`, sa fiche est **déplacée** vers [`archive/`](./archive/) (cohérence avec `tasks/archive/` pour les tickets résolus). Le mouvement est fait à l'étape 10 du pipeline `$run` via `git mv`. **Pas de suppression** — trace décisionnelle (pourquoi ce choix, qu'est-ce qui a coincé).

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

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

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
- [`../../.agents/skills/run/SKILL.md`](../../.agents/skills/run/SKILL.md) — pipeline `$run` source unique.
- [`../../.agents/skills/plan-run/SKILL.md`](../../.agents/skills/plan-run/SKILL.md) — pipeline `$plan-run` source unique.
