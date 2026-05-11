# Run #014 — feature-village-styles-frontend

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 3 — Styles de village
- **Spec source** : [`docs/gameplay/12-village-styles.md`](../../docs/gameplay/12-village-styles.md)
- **Type** : `feature`
- **Modules backend** : `strategy` API/WS si ajustement de contrat nécessaire
- **Modules frontend** : `battleforthecrown-pixi/src/api` | `battleforthecrown-pixi/src/features/village`

## Dépendances

- Run [`013 — feature-village-styles-backend`](./013-feature-village-styles-backend.md) terminé ou contrat API backend explicitement stable.
- Phase 2 — Inbox & rapports terminée via run [`012`](./archive/012-feature-inbox-combat-reports.md).
- Respecter le contrat de confidentialité : style non visible publiquement hors scout.

## Critère de fin (acceptance)

- [ ] Le frontend récupère et affiche le style courant du village sélectionné depuis l'API backend.
- [ ] Le frontend affiche les coûts par style cible et l'état de cooldown retournés par l'API.
- [ ] L'action de changement de style est visible uniquement quand la Salle du Conseil débloque la mécanique.
- [ ] L'action est bloquée côté UI pendant cooldown ou ressources insuffisantes, sans se substituer à la validation serveur.
- [ ] Un changement de style réussi met à jour l'état local après réponse serveur et reste correct après reload.
- [ ] Les erreurs serveur attendues sont rendues proprement : Salle du Conseil absente, cooldown actif, ressources insuffisantes.
- [ ] Aucune donnée de style ennemi n'est introduite dans les vues carte/village public hors futur scout.
- [ ] Le smoke ou test IG agent couvre consulter un style, tenter un changement bloqué, réussir un changement, reload.

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
  - [ ] Parcours frontend style consultable et modifiable — preuve : test UI / smoke IG agent / capture si pertinent.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : tests bout-en-bout manuels exécutés par l'agent quand pertinent (`server + curl`, REST, WebSocket, worker/job, ou `SELECT` DB), avec résultat observable. Si non fait, `Non nécessaire` ou `Non exécuté` + raison précise.
- **Tests IG à faire par le user** : seulement l'appréciation gameplay/visuelle du panneau si non automatisable ; sinon `Aucun test IG nécessaire`, raison.
