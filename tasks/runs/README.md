# Runs — fiches d'exécution semi-autonomes

Un **run** = une exécution déléguée à une équipe Claude (lead + teammates) sur un scope cadré : audit d'un module, implémentation d'une feature, fix d'un écart spec/code, etc.

Chaque run a sa fiche `<id>-<slug>.md` dans ce dossier. Source de vérité de l'état d'un run pendant et après son exécution.

> 🔗 Système global décrit dans `.claude/commands/run-phase.md` (à venir). Cette page documente la **convention de fiche**, pas le pipeline d'orchestration.

## Cycle de vie d'un run

```
PLANNED → RUNNING → (BLOCKED ↔ RUNNING) → DONE
                  ↘ ABORTED
```

- `PLANNED` — fiche écrite, pas encore lancée.
- `RUNNING` — équipe spawn, task list active.
- `BLOCKED` — l'équipe a escaladé une décision au humain (lead nudge ≥ 3 fois sans progression, ou ambiguïté spec).
- `DONE` — task list close, review passée, doc à jour, commit final pushé.
- `ABORTED` — arrêt explicite humain ou échec irrécupérable.

## Convention de nommage

`<id 3-digit>-<slug-en-kebab>.md`. Le pilote est `000-*` ; les vrais runs commencent à `001-*`.

## Champs obligatoires

Voir le template plus bas. Tout manquant = la fiche est invalide et le run ne démarre pas.

## Lifecycle d'écriture

| Section | Quand | Auteur |
|---|---|---|
| `## Cible`, `## Dépendances`, `## Critère de fin` | Avant lancement | Humain (toi) |
| `## Équipe`, `## Décomposition initiale` | Au démarrage du run | Lead |
| `## Progress`, `## Décisions prises` | Pendant le run | Lead + teammates |
| `## Rapport final` | À la clôture | Lead |

Le lead **ne réécrit jamais** les sections « avant lancement » — il les lit et travaille à partir d'elles.

## Archivage

Quand un run est `DONE` ou `ABORTED`, sa fiche reste dans ce dossier. **Pas de suppression.** Sert de trace décisionnelle (pourquoi ce choix, qu'est-ce qui a coincé).

## Template

```markdown
# Run #<id> — <slug>

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : <numéro + nom de phase, cf. `tasks/00-mvp-roadmap.md`>
- **Spec source** : <lien vers `docs/gameplay/...` ou `docs/architecture/...`>
- **Type** : <`audit` | `feature` | `fix` | `mix`>
- **Modules backend** : <ex. `power` | `—`>
- **Modules frontend** : <ex. `pixi/scenes/village` | `—`>

## Dépendances

- <prérequis : phase précédente terminée, autre run done, etc.>

## Critère de fin (acceptance)

- [ ] <critère 1, observable et binaire>
- [ ] <critère 2>
- [ ] …

## Équipe

- **Lead** : session principale (orchestre, ne code pas).
- **Teammates** : <`team-backend` | `team-frontend` | `team-qa` | none>
- **Sub-agents éphémères** : <`agent-skills:code-reviewer` | autre, lancés en fin de cycle>

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décomposition initiale (rempli par le lead)

- [ ] T1 — <description>
- [ ] T2 — <description>
- [ ] …

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition de tâche.)_

## Décisions prises

_(Vide au démarrage. Loggue toute décision archi non triviale, avec la raison.)_

## Rapport final

_(Vide au démarrage. Rempli à la clôture : changements appliqués, écarts résiduels, fichiers touchés, commits, QA résiduelle qui revient à toi.)_
```

## Liens

- [`../00-mvp-roadmap.md`](../00-mvp-roadmap.md) — roadmap des phases dont sont dérivés les runs.
- [`../README.md`](../README.md) — index global des tickets/runs/archives.
