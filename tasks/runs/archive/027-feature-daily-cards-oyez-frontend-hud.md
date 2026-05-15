# Run #027 — feature-daily-cards-oyez-frontend-hud

> **Statut** : DONE
> **Démarré** : 2026-05-15
> **Terminé** : 2026-05-15

## Cible

- **Phase roadmap** : Phase 10 — Rétention quotidienne MVP
- **Spec source** : [`docs/gameplay/05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md), [`docs/gameplay/lab/mobile-retention-modernization.md`](../../docs/gameplay/lab/mobile-retention-modernization.md) en anticipation non canonique
- **Type** : `feature`
- **Modules backend** : `—`
- **Modules frontend** : `pixi/layout`, `pixi/design-system`, `pixi/api`, `pixi/ws-bindings`

## Dépendances

- Le contrat backend/shared du run [`026-feature-daily-cards-oyez-backend-shared`](./archive/026-feature-daily-cards-oyez-backend-shared.md) doit être livré ou suffisamment stabilisé.
- Le trigger UX canonique est une icône permanente dans le HUD top avec badge si au moins une carte est réclamable.
- Les devoirs actifs ne passent pas par l'inbox, ne deviennent pas un onglet bottom nav et ne sont pas rattachés à un bâtiment.
- L'UI doit rester compacte mobile : le joueur comprend quoi faire, pourquoi maintenant, et ce qu'il gagne.

## Critère de fin (acceptance)

- [ ] Le HUD top affiche une entrée permanente "devoir royal" avec badge quand au moins une carte est réclamable.
- [ ] L'entrée ouvre une sheet ou modale plein écran compacte, adaptée mobile.
- [ ] La sheet affiche l'Oyez actif s'il existe, sans occuper l'écran quand aucun Oyez n'est actif.
- [ ] La carte quotidienne courante et le backlog sont visibles sans pression FOMO excessive.
- [ ] Les tâches affichent progression, état terminé et accès direct aux actions quand une destination UI naturelle existe.
- [ ] Le claim affiche la récompense, permet de choisir un village possédé si nécessaire et propose le dernier village récompensé par défaut.
- [ ] Après claim ou progression pertinente, les queries frontend sont invalidées ou mises à jour sans passer par inbox/notifications push.
- [ ] Le prototype existant `DailyQuestModal` est réutilisé ou migré proprement plutôt que recréé en doublon.
- [ ] Un test frontend couvre au minimum badge réclamable, ouverture de sheet et choix de village au claim.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- Frontend HUD : skill `bftc-react-hud`

## Notes de cadrage

- Ne pas créer une landing page ou une page explicative : l'écran est un outil de jeu.
- Ne pas mélanger rapports passifs et devoirs actifs ; inbox et notifications restent des infrastructures séparées.
- Garder les contrôles complets mais sobres : icône, badge, liste de tâches, CTA clair, choix de village si nécessaire.
- Le design doit s'aligner sur les composants existants du design system, notamment `DailyQuestModal` si son état réel le permet.
- Si le run 026 ne fournit pas de realtime dédié, privilégier l'invalidation TanStack ciblée après actions existantes.

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] Ajouter le contrat frontend retention dans `pixi/api` : query summary, mutation claim, invalidation ciblée.
- [x] Brancher l'entrée devoir royal en floating button de la vue village via un composant `features/retention` qui réutilise `DailyQuestModal`.
- [x] Migrer `DailyQuestModal` avec props optionnelles pour action de tâche, backlog compact et choix de village au claim.
- [x] Invalider les cartes depuis les events WS qui portent la progression métier.
- [x] Couvrir badge + ouverture + choix de village par un test Vitest.

## Progress (rempli pendant le run)

- Préflight terminé : worktree clean, règles run/docs/git/conventions chargées, dépendance run 026 livrée.
- Cartographie terminée : `GameHeader`, `DailyQuestModal`, `queries.ts`, `ws-bindings.ts` sont les points d'intégration.
- Implémentation terminée : floating button village, sheet quotidienne, claim village et invalidations branchés.
- Vérifications terminées : test ciblé, suite Pixi, `static-check`, backend `/health` et app/design-system ouverts localement.

## Décisions prises

- Réutiliser `DailyQuestModal` comme surface visuelle canonique et créer seulement un adaptateur runtime `features/retention`.
- Garder le refresh server-authoritative : pas d'optimistic reward, invalidation TanStack après claim et events métier.

## Rapport final

Livré :

- `DailyRetentionWidget` runtime dans `pixi/features/retention`, branché dans `VillageView` sous la header bar avec `RoyalSeal`, légèrement descendu pour ne pas se confondre avec les contrôles du header.
- Query `GET /retention` + mutation `POST /retention/cards/:cardId/claim` côté Pixi.
- Invalidation retention sur claim et sur events métier de progression (`unit.trained`, `building.completed`, `battle.resolved`, `scout.reported`, `reinforcement.sent`, `garrison.added`).
- `DailyQuestModal` enrichi sans doublon UI : actions par tâche, backlog affiché seulement s'il existe réellement, bloc récompense + choix village.
- Tests Vitest ajoutés/ajustés pour le widget retention et l'invalidation WS.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Floating button + badge — preuve : `DailyRetentionWidget.test.tsx` ouvre depuis `Devoir royal, 1 carte à réclamer`; QA browser confirme le `RoyalSeal` en vue village sous header.
  - [x] Sheet quotidienne + Oyez — preuve : test widget + QA browser `http://localhost:5174/design-system` avec `DailyQuestModal`, `Devoirs Royaux`, `Oyez · en cours`.
  - [x] Claim avec choix de village — preuve : test widget sélectionne `v2` puis appelle `onClaim({ cardId: 'card-1', villageId: 'v2' })`.
  - [x] Backlog sans FOMO — preuve : la section est masquée quand seule la carte courante existe ; elle devient `Cartes en attente` uniquement pour les cartes de rattrapage.
  - [x] Actions directes — preuve : mapping runtime des tâches vers `/game`, `/game/army`, `/game/world`.
  - [x] Invalidation sans inbox/push — preuve : `queries.ts` + `ws-bindings.ts`, test WS mis à jour.
- **Tests automatisés** :
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test DailyRetentionWidget` — 1 test passé.
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test` — 26 fichiers, 141 tests passés. Note jsdom existante : `HTMLCanvasElement.getContext()` non implémenté, non bloquant.
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn static-check` — vert.
- **Smokes lancés** : Non applicable, raison : aucun fichier `battleforthecrown-backend/src/` modifié.
- **Smokes ajoutés/modifiés** : Aucun, raison : scope frontend HUD/API client/WS binding, couvert par Vitest + static-check.
- **QA fonctionnelle agent** :
  - Backend lancé depuis le worktree sur `http://localhost:15002`, `/health` OK.
  - Frontend lancé depuis le worktree sur `http://localhost:5174`, HTTP 200.
  - Browser : `http://localhost:5174/game` affiche le `RoyalSeal` hors header, sous la header bar, le clic ouvre `Devoirs royaux` sans console error, et le backlog inutile est absent sur une seule carte.
  - Browser : `http://localhost:5174/design-system` expose `DailyQuestModal`, `Devoirs Royaux`, `Oyez · en cours`, sans console error.
- **Tests IG à faire par le user** :
  - [ ] Sur mobile, ouvrir `http://localhost:5174/game`, vérifier le bouton parchemin flottant sous la header bar, ouvrir la sheet et vérifier lisibilité + absence d'emprise excessive quand aucun Oyez n'est actif.
  - [ ] Avec une carte claimable, choisir un village récompensé, réclamer, vérifier que les ressources et le badge se mettent à jour sans passer par l'inbox.
