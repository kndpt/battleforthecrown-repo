# Run #038 — fix-quarter-population-scaling-modal

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant
- **Spec source** : [`docs/gameplay/02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) § Population ; [`docs/gameplay/03-buildings.md`](../../docs/gameplay/03-buildings.md) § Quartier
- **Type** : fix
- **Modules backend** : `workers/construction`, `combat/conquest`, `world-config`
- **Modules frontend** : `pixi/features/village`, `pixi/features/design-system/components`

## Dépendances

- Aucune dépendance bloquante.
- Contexte connexe : [`029 — Migration design-system des modales bâtiment restantes`](./archive/029-migrate-building-modals-design-system.md), [`002 — Audit spec 03 : bâtiments`](./archive/002-audit-buildings.md), [`073 — Format compact ressources et villageois dans le header`](../archive/073-compact-resource-population-header-format.md), [`57 — Source canonique du lifecycle des bâtiments joueur`](../archive/57-player-village-building-lifecycle-roster.md).

## Critère de fin (acceptance)

- [ ] `getQuarterPopulationLimit(level)` retourne une valeur définie pour chaque niveau 1..10 du Quartier.
- [ ] Les niveaux Quartier 6..10 ne fallbackent plus à `250` et la progression inclut un delta non nul sur `7 -> 8`.
- [ ] Une complétion d'upgrade Quartier au-delà du niveau 5 met `population.max` à la capacité du niveau cible, pas à `250` par défaut.
- [ ] Les flows de conquête qui matérialisent une population via un niveau de Quartier continuent à recalculer `population.max` avec le helper shared corrigé.
- [ ] Le rendu Quartier en mode population n'affiche plus `/ heure` ni `/ h`.
- [ ] La modal Quartier `niv. 7 -> 8` affiche une capacité de population actuelle/prochaine cohérente avec un delta non nul.
- [ ] La jauge `Logement` reste basée sur `population.used / population.max` et ne confond pas capacité avec production passive.
- [ ] Le run indique explicitement si une correction non destructive des données existantes est nécessaire, appliquée ou justifiée comme non requise.
- [ ] Checks ciblés puis `rtk yarn static-check` passent, sauf baseline rouge documentée hors scope.

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

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] `getQuarterPopulationLimit(level)` couvre `1..10` — `test` → à remplir.
  - [ ] Quartier `7 -> 8` n'affiche plus deux fois `+250 / heure` — `visuel` → à remplir.
- **Review indépendante** : `Déclenchée (raison: back+front, invariant durable)` avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : à remplir.
- **Smokes ajoutés/modifiés** : à remplir.
- **QA fonctionnelle agent** : à remplir.
- **Tests IG à faire par le user** : à remplir.

## Notes de cadrage

- Symptôme observé : la modal Quartier `niv. 7 -> 8` affiche `+250 / heure` pour le niveau courant et le prochain, puis `+0 / h`.
- Cause probable : `QUARTER_POPULATION_LIMITS` couvre seulement les niveaux 1..5, tandis que `QUARTER` est un bâtiment 1..10. Le fallback actuel de `getQuarterPopulationLimit(6+)` retourne `250`.
- Le sujet n'est pas seulement UI : `construction.worker.ts` applique ce helper à la complétion Quartier, et `conquest.service.ts` l'utilise aussi lors de la matérialisation de population.
- La sémantique gameplay attendue est une capacité de villageois, pas un débit horaire. La modal doit donc avoir un wording spécifique population ou masquer la comparaison courante si le design retenu est "prochain niveau uniquement".
- Si des villages existants ont déjà un Quartier niveau 6+ avec `population.max=250`, prévoir une correction non destructive ciblée ou documenter pourquoi elle n'est pas nécessaire.
