# Run #013 — feature-village-styles-backend

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 3 — Styles de village
- **Spec source** : [`docs/gameplay/12-village-styles.md`](../../docs/gameplay/12-village-styles.md)
- **Type** : `feature`
- **Modules backend** : `strategy` | `village` | `combat` | `resources` | `population` | `world` | `prisma`
- **Modules frontend** : `—`

## Dépendances

- Phase 1 — Consolidation de l'existant terminée.
- Phase 2 — Inbox & rapports terminée via run [`012`](./archive/012-feature-inbox-combat-reports.md).
- Respecter les specs liées : [`03-buildings`](../../docs/gameplay/03-buildings.md), [`04-combat`](../../docs/gameplay/04-combat.md), [`02-economy-and-progression`](../../docs/gameplay/02-economy-and-progression.md), [`11-scouting`](../../docs/gameplay/11-scouting.md).
- Ne pas démarrer la phase 4 scout tant que le contrat "style caché sauf scout" n'est pas stabilisé.

## Critère de fin (acceptance)

- [ ] Un village joueur nouvellement créé ou sans config explicite est traité comme `Équilibré`.
- [ ] Un village barbare n'a aucun style applicable.
- [ ] Le changement de style est impossible tant que la Salle du Conseil n'est pas construite dans le village.
- [ ] Tout changement de style, y compris le premier, consomme les ressources thématiques + couronnes prévues par la spec et scalées par niveau de Château.
- [ ] Le cooldown de 24 h bloque un second changement avant expiration et autorise un changement après expiration.
- [ ] L'API backend expose le style courant, les coûts par style cible, l'état de cooldown et permet de changer de style avec réponse persistée après reload.
- [ ] Un combat scripté montre qu'un défenseur `Forteresse` subit moins de pertes qu'un défenseur `Équilibré` avec mêmes unités et même attaquant.
- [ ] Les bonus/malus `Raiders`, `Forteresse` et `Économique` s'appliquent aux bons scopes : troupes d'origine pour combat/vitesse/loot, village local pour production/stockage/population.
- [ ] Le style n'est pas exposé dans les données publiques de carte ou de village ennemi hors scout.
- [ ] Les tests automatisés ou smokes backend couvrent au moins changement de style, coût/cooldown, et effet `Forteresse` en combat.

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

- **Critères d'acceptance vérifiés** :
  - [ ] Comportement backend styles conforme à la spec 12 — preuve : tests auto / smoke backend / curl / SELECT.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : tests bout-en-bout manuels exécutés par l'agent quand pertinent (`server + curl`, REST, WebSocket, worker/job, ou `SELECT` DB), avec résultat observable. Si non fait, `Non nécessaire` ou `Non exécuté` + raison précise.
- **Tests IG à faire par le user** : `Aucun test IG nécessaire` si le run reste strictement backend/shared ; sinon checklist observable.
