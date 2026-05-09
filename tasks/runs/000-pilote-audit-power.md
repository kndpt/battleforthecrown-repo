# Run #000 — Pilote : audit du module `power`

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

> 🧪 **Run pilote.** Sert à valider l'architecture du système d'équipe (`/run-phase`, teammates, hooks, memory) avant de l'utiliser sur des phases réelles. Cible volontairement petite : un seul module backend, audit de conformité spec/code, sans frontend ni QA IG.

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (sous-tâche : audit module `power`).
- **Spec source** : [`docs/gameplay/09-power-and-rankings.md` § Système de puissance](../../docs/gameplay/09-power-and-rankings.md#système-de-puissance) (sections « Calcul », « Visibilité », « Système de poids des bâtiments », « Utilisation stratégique »). **Hors scope** : la section « Classements » (post-MVP, ne pas auditer).
- **Type** : `audit` (avec `fix` autorisé si écart < 50 lignes ; au-delà → ticketer).
- **Modules backend** : `battleforthecrown-backend/src/modules/power/` (controller, service, module).
- **Modules frontend** : —
- Modules transverses à inspecter pour cohérence : `packages/shared/` (formules de poids, si centralisées).

## Dépendances

- Aucune. Run autonome, ne dépend pas d'un autre run.

## Critère de fin (acceptance)

- [ ] Code de `power.service.ts` lu et confronté ligne à ligne aux 4 sous-sections de spec citées.
- [ ] Liste des écarts spec ↔ code produite (chaque écart : citation spec + citation code + sévérité).
- [ ] Pour chaque écart < 50 lignes : fix appliqué dans la même run.
- [ ] Pour chaque écart ≥ 50 lignes : ticket créé dans `tasks/` avec analyse + pistes (pas implémenté ici).
- [ ] Tests pure-logic vérifiés : si une formule pure (poids bâtiment, somme village, somme royaume) n'a pas de spec, en ajouter une conformément à `.claude/rules/tests.md`. **Aucun test interdit** (pas de mock Prisma, pas de mock-théâtre).
- [ ] `yarn workspace battleforthecrown-backend test` passe vert.
- [ ] Si fix appliqué : doc à jour (vérifier que `09-power-and-rankings.md` reste cohérente, mettre à jour `docs/architecture/backend-modules.md` § power si endpoint changé).
- [ ] Commit final au format `<type>(<scope>): <subject>` cf. `.claude/rules/git.md`, avec section QA dans le message si pertinente.
- [ ] Rapport final écrit dans la section `## Rapport final` ci-dessous.

## Équipe

- **Lead** : session principale (orchestre, ne code pas).
- **Teammates** : `team-backend` (seul actif pour ce run — power est backend-only).
- **Sub-agents éphémères** : `agent-skills:code-reviewer` (lancé en fin de cycle pour la review 5 axes).

## Règles à respecter

- Tests : @.claude/rules/tests.md (politique pure-logic only sur les formules ; aucun mock Prisma/pg-boss)
- QA : @.claude/rules/qa.md (audit = effet backend → QA backend par l'agent, pas QA IG)
- Docs : @.claude/rules/docs.md (vérifier cohérence inter-docs si fix appliqué)
- Git : @.claude/rules/git.md (`<type>(<scope>): <subject>`, EN, pas de `--no-verify`)
- Conventions : @.claude/rules/conventions.md (TypeScript strict, server-authoritative, Outbox)

## Décomposition initiale (rempli par le lead au démarrage)

- [ ] T1 — Lire spec 09 § Système de puissance et extraire les invariants vérifiables.
- [ ] T2 — Lire `power.service.ts` et `power.controller.ts` ; cartographier les fonctions et leurs entrées/sorties.
- [ ] T3 — Confronter spec ↔ code, produire la liste des écarts avec sévérité.
- [ ] T4 — Pour chaque écart < 50 lignes : fix.
- [ ] T5 — Pour chaque écart ≥ 50 lignes : ticket.
- [ ] T6 — Vérifier les tests pure-logic existants ; ajouter les manquants sur les formules pures.
- [ ] T7 — `yarn test` vert.
- [ ] T8 — Doc à jour si fix.
- [ ] T9 — Lancer `agent-skills:code-reviewer` sur le diff complet.
- [ ] T10 — Traiter findings de la review (cycle correctif, max 3 itérations).
- [ ] T11 — Commit final + rapport.

## Progress

_(Vide au démarrage. Mis à jour à chaque transition de tâche.)_

## Décisions prises

_(Vide au démarrage. Loggue toute décision archi non triviale, avec la raison.)_

## Rapport final

_(Vide au démarrage. Rempli à la clôture.)_

## Critères de validation du système (méta — pour le pilote uniquement)

À évaluer **par toi** après la clôture :

1. Le lead a-t-il posé ≤ 4 questions au démarrage, puis arrêté de te déranger ?
2. La task list a-t-elle convergé en `done` sans intervention humaine en < 4 h temps réel ?
3. Le rapport final est-il utilisable tel quel (commit propre, QA section présente, références docs OK) ?

3 oui → on généralise à `/run-phase`. 1 non → on identifie le verrou avant de continuer.
