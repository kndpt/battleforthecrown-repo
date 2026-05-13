# Run #018 — feature-barbarian-conquest-backend-shared

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 5 — Conquête barbare
- **Spec source** : [`docs/gameplay/13-barbarian-conquest.md`](../../docs/gameplay/13-barbarian-conquest.md) + règles communes [`docs/gameplay/10-conquest.md`](../../docs/gameplay/10-conquest.md)
- **Type** : `feature`
- **Modules backend** : `combat`, `army`, `gameplay`, `world`, `event`, `prisma`
- **Modules frontend** : `—`

## Dépendances

- Phase 1 close : runs `001` à `007` archivés `DONE`.
- Phases précédentes livrées : inbox `012`/`015`, styles `013`/`014`, scouting `016`/`017`.
- Briques de conquête communes livrées par les tickets archivés `40`, `41`, `42`.
- Migrations locales appliquées, notamment `TrainingBuilding` et `PendingConquest`.
- Postgres + pg-boss disponibles pour les smokes backend.

## Critère de fin (acceptance)

- [ ] Le pipeline backend/shared existant `NOBLE` / `PendingConquest` / `conquest:finalize` est confronté aux specs `10` et `13`, et les écarts Phase 5 sont corrigés ou explicitement sortis du scope.
- [ ] Une attaque victorieuse contre un village barbare avec Seigneur survivant ouvre une fenêtre `PendingConquest` à durée spec par tier : T1 `2h`, T2 `4h`, T3 `6h`, T4 `9h`, T5 `12h`.
- [ ] Pendant la fenêtre, le Seigneur ne revient pas avec l'escorte ; l'escorte survivante et le loot reviennent normalement.
- [ ] Si le Seigneur meurt lors du combat de pré-conquête, aucune fenêtre n'est ouverte, `noble.killed` est émis, et le loot militaire reste ramené si l'escorte survit.
- [ ] À finalisation, un barbare T2 conquis devient un village joueur du conquérant avec `isBarbarian=false`, tier barbare vidé, ressources `0/0/0`, armée résidente `0`.
- [ ] Les bâtiments hérités respectent la whitelist spec et le niveau par tier ; aucune Tour de guet, Salle du Conseil ou Salle du Trône n'est matérialisée.
- [ ] Le village conquis démarre en style `BALANCED`, avec population recalculée selon le Moulin, les bâtiments matérialisés et le Seigneur installé.
- [ ] Les events Outbox/WS utiles à l'UI Phase 5 sont émis de façon cohérente : ouverture de fenêtre, interruption/mort Seigneur, conquête réussie.
- [ ] Un smoke backend réel couvre le cycle T2 complet : recrutement Seigneur → attaque → fenêtre → finalisation → transfert observable.
- [ ] `yarn static-check` est vert.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- Prisma : skill `bftc-prisma`
- Workers/outbox : skill `bftc-workers-outbox`

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
  - [ ] Cycle barbare T2 complet backend/shared — preuve : smoke réel ou script ciblé avec transfert DB observable.
  - [ ] Matérialisation du village conquis conforme spec `13` — preuve : assertions DB ou tests ciblés sur bâtiments, ressources, armée et population.
  - [ ] Seigneur survivant/mort/immobilisé conforme spec `10` — preuve : tests ou smoke couvrant les branches critiques.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : server + DB + worker/job ou `SELECT` DB avec résultat observable.
- **Tests IG à faire par le user** : `Aucun test IG nécessaire` pour ce run backend/shared, sauf si un comportement gameplay doit être arbitré visuellement.
