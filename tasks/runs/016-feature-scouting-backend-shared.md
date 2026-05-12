# Run #016 — feature-scouting-backend-shared

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 4 — Scouting
- **Spec source** : [`docs/gameplay/11-scouting.md`](../../docs/gameplay/11-scouting.md)
- **Type** : `feature`
- **Modules backend** : `combat`, `reports`, `event`, `prisma`
- **Modules frontend** : `—`

## Dépendances

- Phase 2 close : run [`015`](./archive/015-close-phase-2-inbox-reports.md), inbox combat persistante + lu/suppression + invalidation WS.
- Phase 3 close : runs [`013`](./archive/013-feature-village-styles-backend.md) et [`014`](./archive/014-feature-village-styles-frontend.md), style persisté et masqué hors scout.
- Décision produit : modèle dédié `ScoutReport`, pas d'extension opportuniste de `CombatReport`.
- Décision produit : coût mission limité à l'ESPION engagé + temps de trajet, sans coût couronnes MVP.
- Postgres + pg-boss disponibles pour les smokes backend.

## Critère de fin (acceptance)

- [ ] Un ESPION est recrutable via la Caserne niveau 3 et reste indisponible avant ce prérequis.
- [ ] Un joueur peut envoyer une mission scout composée d'ESPION(s) uniquement vers un village barbare visible.
- [ ] Un joueur peut envoyer une mission scout composée d'ESPION(s) uniquement vers un village joueur visible.
- [ ] Une cible hors vision est refusée comme pour une attaque.
- [ ] À l'arrivée, le serveur crée un `ScoutReport` persistant contenant composition d'armée, stock de ressources et style stratégique si applicable.
- [ ] Au MVP, la mission scout réussit toujours et ne tue aucun ESPION.
- [ ] Les ESPION(s) reviennent au village d'origine après le trajet retour.
- [ ] Les événements/outbox nécessaires invalident l'inbox du propriétaire du rapport scout.
- [ ] Le style d'un village joueur ennemi reste absent des endpoints publics hors rapport scout.
- [ ] Un smoke ou test d'intégration couvre le cycle complet : disponibilité SPY → envoi scout → rapport → retour.

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
  - [ ] Mission scout SPY-only vers village barbare visible — preuve : <test auto / smoke / curl / SELECT>
  - [ ] Mission scout SPY-only vers village joueur visible — preuve : <test auto / smoke / curl / SELECT>
  - [ ] Cible hors vision refusée — preuve : <test auto / smoke / curl>
  - [ ] `ScoutReport` snapshot persistant avec unités, ressources, style nullable — preuve : <test auto / SELECT>
  - [ ] Retour des ESPION(s) au village d'origine — preuve : <test auto / smoke / SELECT>
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : tests bout-en-bout manuels exécutés par l'agent quand pertinent (`server + curl`, REST, WebSocket, worker/job, ou `SELECT` DB), avec résultat observable. Si non fait, `Non nécessaire` ou `Non exécuté` + raison précise.
- **Tests IG à faire par le user** : seulement ce qui demande une appréciation gameplay/visuelle, un vrai navigateur humain, ou un scénario trop coûteux à automatiser ; checklist observable. Sinon `Aucun test IG nécessaire`, raison.
