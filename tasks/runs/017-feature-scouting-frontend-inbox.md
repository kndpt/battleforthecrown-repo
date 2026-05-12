# Run #017 — feature-scouting-frontend-inbox

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 4 — Scouting
- **Spec source** : [`docs/gameplay/11-scouting.md`](../../docs/gameplay/11-scouting.md)
- **Type** : `feature`
- **Modules backend** : `—`
- **Modules frontend** : `pixi/api`, `pixi/features/combat`, `pixi/features/reports`

## Dépendances

- Run [`016`](./016-feature-scouting-backend-shared.md) terminé : contrat `ScoutReport`, endpoint d'envoi scout, retour ESPION, invalidations inbox et smokes backend validés.
- Décision produit : bouton `Scout` dans le flow cible/attaque existant.
- Décision produit : coût mission limité à l'ESPION engagé + temps de trajet, sans coût couronnes MVP.
- Décision produit : rapport scout affiché dans l'inbox, avec état lu/non-lu et suppression comme les rapports combat.

## Critère de fin (acceptance)

- [ ] Depuis le flow cible/attaque existant, le joueur voit une action `Scout` quand la cible est valide.
- [ ] L'action `Scout` permet de choisir uniquement des ESPION(s) et bloque les autres unités.
- [ ] L'UI expose le coût réel MVP : ESPION(s) engagés + temps de trajet, aucun coût couronnes.
- [ ] Le joueur peut envoyer un scout vers un village barbare visible.
- [ ] Le joueur peut envoyer un scout vers un village joueur visible.
- [ ] Les rapports scout apparaissent dans l'inbox sans casser les rapports combat existants.
- [ ] Le rapport scout affiche composition d'armée, stock de ressources et style stratégique si applicable.
- [ ] Le style d'un village joueur ennemi n'est visible côté UI qu'à travers le rapport scout.
- [ ] Lu/non-lu et suppression fonctionnent pour les rapports scout.
- [ ] `yarn static-check` et les tests Pixi ciblés sont verts.

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
  - [ ] Bouton `Scout` disponible dans le flow cible/attaque existant — preuve : <test UI / capture / smoke manuel>
  - [ ] Sélection SPY-only et coût sans couronnes — preuve : <test auto / capture / smoke manuel>
  - [ ] Rapport scout rendu dans l'inbox — preuve : <test auto / capture / smoke manuel>
  - [ ] Lu/non-lu et suppression sur rapport scout — preuve : <test auto / smoke manuel>
  - [ ] Aucun leak du style joueur hors rapport scout — preuve : <test auto / inspection API/UI>
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : tests bout-en-bout manuels exécutés par l'agent quand pertinent (`server + curl`, REST, WebSocket, worker/job, ou `SELECT` DB), avec résultat observable. Si non fait, `Non nécessaire` ou `Non exécuté` + raison précise.
- **Tests IG à faire par le user** : seulement ce qui demande une appréciation gameplay/visuelle, un vrai navigateur humain, ou un scénario trop coûteux à automatiser ; checklist observable. Sinon `Aucun test IG nécessaire`, raison.
