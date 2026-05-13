# Run #019 — feature-barbarian-conquest-frontend-ui

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 5 — Conquête barbare
- **Spec source** : [`docs/gameplay/13-barbarian-conquest.md`](../../docs/gameplay/13-barbarian-conquest.md) + règles communes [`docs/gameplay/10-conquest.md`](../../docs/gameplay/10-conquest.md)
- **Type** : `feature`
- **Modules backend** : `—`
- **Modules frontend** : `pixi/api`, `pixi/features/village`, `pixi/features/combat`, `pixi/stores`, `pixi/hud`

## Dépendances

- Run `018-feature-barbarian-conquest-backend-shared` `DONE`.
- Phases précédentes UI livrées : inbox `012`/`015`, styles `014`, scouting frontend `017`.
- API backend exposant recrutement Seigneur, durée de capture barbare, état de fenêtre et events Outbox/WS nécessaires.

## Critère de fin (acceptance)

- [ ] Un joueur peut recruter un Seigneur depuis la Salle du Trône côté HUD/Pixi, avec états coût, prérequis, chargement, erreur serveur et refetch après mutation.
- [ ] La Caserne ne propose pas `NOBLE` et l'UI explique implicitement le chemin Salle du Trône par le placement de l'action.
- [ ] Le panneau d'un village barbare affiche la durée de capture prévisible avant lancement, selon le tier cible.
- [ ] Depuis une cible barbare attaquable, le joueur peut lancer une conquête avec un Seigneur disponible et une escorte.
- [ ] Les états de conquête en cours sont visibles côté joueur : fenêtre ouverte, ETA/fin prévue, réussite, interruption ou mort du Seigneur.
- [ ] Les invalidations WS/store couvrent au minimum ouverture de fenêtre, `village.conquered`, `noble.killed`, et le refresh des villages/armées concernés.
- [ ] L'inbox/feedback existant reste cohérent avec les rapports combat/scout déjà livrés ; aucun mélange régressif des types de rapports.
- [ ] Les tests frontend ciblés couvrent les helpers/stores/composants modifiés sans mock-théâtre.
- [ ] `yarn static-check` est vert.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- React/HUD : skill `bftc-react-hud`

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
  - [ ] Recrutement Seigneur depuis Salle du Trône — preuve : test frontend ou QA locale avec API backend.
  - [ ] Durée de capture barbare visible avant lancement — preuve : test composant/store ou capture Playwright si écran lancé.
  - [ ] Suivi des events de conquête — preuve : test store/WS ou QA manuelle agent avec event simulé/observé.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : navigation locale ou scénario API+UI quand pertinent, avec résultat observable.
- **Tests IG à faire par le user** : seulement les vérifications de ressenti UX ou lisibilité visuelle qui ne sont pas automatisables proprement.
