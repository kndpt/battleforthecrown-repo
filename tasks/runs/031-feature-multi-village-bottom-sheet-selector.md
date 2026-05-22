# Run #031 — feature-multi-village-bottom-sheet-selector

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 9 — Navigation multi-village (étiquettes, capitale, sélecteur)
- **Spec source** : [`docs/gameplay/22-village-roles-and-navigation.md`](../../docs/gameplay/22-village-roles-and-navigation.md)
- **Type** : `feature`
- **Modules backend** : —
- **Modules frontend** : `pixi/layout`, `pixi/design-system`

## Dépendances

- Run 021 livré : [`tasks/runs/archive/021-feature-village-labels-navigation.md`](./archive/021-feature-village-labels-navigation.md) expose déjà `GET /village`, `label`, `isCapital`, le fallback de village actif et le sélecteur compact actuel.
- Ticket 51 livré : [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md) cadre la direction bottom sheet design-system.
- Composant design-system `MultiVillageBottomSheet` disponible dans `battleforthecrown-pixi/src/features/design-system/components/MultiVillageBottomSheet.tsx`.

## Critère de fin (acceptance)

- [ ] Cliquer sur le nom/sélecteur central du village dans le header IG ouvre le `MultiVillageBottomSheet`.
- [ ] Cliquer sur la flèche gauche ou droite continue de changer le village actif via `setVillage` et n'ouvre pas le bottom sheet.
- [ ] Cliquer sur un village dans le bottom sheet définit ce village comme actif et ferme le sheet.
- [ ] Le sheet affiche au minimum les villages possédés avec nom, coordonnées, état actif, capitale dérivée et étiquette MVP quand présents.
- [ ] Le dropdown compact inline actuel n'est plus rendu comme menu de sélection concurrent.
- [ ] Aucune donnée riche indisponible n'est inventée : pas de ressources, activités, alertes, stratégie ou puissance factices présentées comme réelles.
- [ ] Sur mobile, le sheet est lisible, scrollable, et ne masque pas de façon incohérente le header ou les contrôles.
- [ ] Les données manquantes sont listées dans le rapport final avec proposition de tickets/runs si elles nécessitent de nouveaux endpoints.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Frontend HUD : skill `bftc-react-hud`
- Design-system migration : skill `bftc-design-system-migration`

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
  - [ ] Cliquer sur le nom/sélecteur central du village ouvre le `MultiVillageBottomSheet` — automatisable + visuel.
  - [ ] Cliquer sur la flèche gauche ou droite change toujours le village actif et n'ouvre pas le bottom sheet — automatisable.
  - [ ] Cliquer sur un village dans le bottom sheet définit ce village comme actif et ferme le sheet — automatisable.
  - [ ] Le sheet affiche les villages possédés avec nom, coordonnées, état actif, capitale et étiquette MVP — visuel/gameplay.
  - [ ] Le dropdown compact inline actuel n'est plus rendu comme menu concurrent — grep + visuel.
  - [ ] Aucune donnée riche indisponible n'est inventée — grep + review.
  - [ ] Le sheet mobile est lisible et scrollable — visuel.
  - [ ] Les données manquantes sont listées avec follow-ups potentiels — doc/artefact.
- **Review indépendante** : `Déclenchée (raison: diff estimé > 100 lignes et invariant durable: ne pas afficher de données multi-village fictives)` avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : ouvrir le jeu avec plusieurs villages, vérifier ouverture du sheet depuis le nom, sélection d'un village, et non-régression des flèches.
- **Tests IG à faire par le user** :
  - [ ] Vérifier sur mobile que la transition header → bottom sheet est naturelle.
  - [ ] Vérifier que les informations volontairement absentes ne donnent pas une impression de bug ou de données à zéro.

## Notes de cadrage

### Piste retenue

Intégrer le bottom sheet en mode MVP "données réelles uniquement".

Le mapping peut utiliser les données déjà disponibles :

- `JoinedVillage.id`
- `JoinedVillage.name`
- `JoinedVillage.x` / `JoinedVillage.y`
- `JoinedVillage.label`
- `JoinedVillage.isCapital`
- `useGameStore().villageId` pour l'état actif

Toute donnée non disponible pour tous les villages doit être masquée, rendue en état sobre explicite, ou reportée en follow-up. Ne pas remplir avec des zéros ou valeurs arbitraires.

### Données riches non disponibles à traiter en follow-up si nécessaire

- Ressources courantes par village : aujourd'hui `useDisplayResources(villageId)` concerne le village actif.
- Activités bâtiments par village : les queues existantes sont orientées village actif.
- Formations de troupes par village : les données ne sont pas exposées comme synthèse multi-village.
- Seigneur / capture / activités nobles par village : pas de snapshot multi-village consolidé.
- Alertes entrantes par village : pas de payload de liste prêt pour ce sheet.
- Stratégie/style par village : `useVillageStrategyQuery(villageId)` couvre le village actif, pas toute la liste.
- Puissance par village : `useKingdomPowerQuery()` peut être utilisée seulement si elle est assez fiable et alignée par `villageId`.

### Points d'attention

- `GameHeader` est utilisé dans plusieurs écrans (`ArmyScreen`, `MessagesScreen`, `VillageView`, `WorldLockedScreen`, `WorldMapScreen`) : vérifier l'ouverture du sheet dans tous les contextes principaux.
- Le filtre `active` / `alerts` du composant design-system peut être ambigu si les alertes ne sont pas disponibles. L'implémentation doit soit l'adapter, soit le masquer proprement pour éviter une UX mensongère.
- Les flèches doivent rester des actions directes, indépendantes du sheet.
