# Run #043 — refactor-game-shell-layout

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap
- **Spec source** : [`docs/architecture/decisions.md`](../../docs/architecture/decisions.md) ADR-13 `AuthenticatedShell` au niveau Router ; ADR-07 boundary React HUD / Pixi
- **Type** : refacto
- **Modules backend** : —
- **Modules frontend** : `pixi/features/layout`, `pixi/routes/game`, `pixi/features/game`, `pixi/features/world`, `pixi/features/army`, `pixi/features/combat`
- **REVIEW_INDÉPENDANT_REQUIS** : oui

## Dépendances

- Aucune dépendance bloquante.
- Contexte à préserver :
  - [`tasks/runs/archive/039-integrate-army-view-design-system.md`](./archive/039-integrate-army-view-design-system.md) — l'intégration Armée a volontairement conservé le shell runtime existant ; ne pas régresser son contenu design-system ni ses bottom sheets.
  - [`tasks/runs/041-fix-mobile-browser-gestures-bottom-sheets.md`](./041-fix-mobile-browser-gestures-bottom-sheets.md) — éviter une exécution parallèle si ce run modifie aussi les règles viewport/app-shell.
  - [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md) — `BottomSheet` reste la primitive comportementale des sheets ; ne pas mélanger cette dette avec la bottom nav.
  - [`tasks/archive/50-kingdom-activities-bottom-sheet-integration.md`](../archive/50-kingdom-activities-bottom-sheet-integration.md) — la refonte complète de `BottomNavigationBar` y était explicitement hors scope.
  - [`docs/architecture/audit/12-pixi-transverse-components-misplaced.md`](../../docs/architecture/audit/12-pixi-transverse-components-misplaced.md) — placement transverse de `BottomNavigationBar` déjà traité, sans centralisation du rendu.
  - [`docs/architecture/audit/13-pixi-game-session-fragile-wrapper.md`](../../docs/architecture/audit/13-pixi-game-session-fragile-wrapper.md) — shell technique route-level déjà traité via ADR-13, mais sans chrome UI.

## Critère de fin (acceptance)

- [ ] `GameHeader`, `BottomNavigationBar` et `ToastStack` sont rendus par un seul layout jeu route-level, pas directement par `VillageView`, `WorldMapScreen`, `WorldLockedScreen`, `ArmyScreen` ou `MessagesScreen`. Preuve : `grep` ciblé.
- [ ] Les routes `/game`, `/game/world`, `/game/army` et `/game/messages` rendent chacune une seule topbar, une seule bottom nav, et gardent l'active tab correcte. Preuve : test layout/nav ciblé + inspection navigateur.
- [ ] Le layout centralise l'unread badge Messages via `useUnreadReportsCount()`, sans recalcul du compteur dans chaque screen. Preuve : `grep` ciblé + test si faisable.
- [ ] Le bouton `Bâtiments` suit un contrat robuste : depuis `/game`, il ouvre `BuildingManagementPanel` via un state URL borné (`/game?panel=buildings`) ; depuis les autres tabs, il ramène au village sans ouvrir de panneau fantôme. Preuve : test route/view + inspection navigateur.
- [ ] Fermer `BuildingManagementPanel` retire le paramètre `panel=buildings` sans casser les autres ouvertures internes depuis `VillageView`. Preuve : test ou inspection navigateur.
- [ ] `OnboardingGuidance` reste rendu sur les écrans concernés (`VillageView`, `WorldMapScreen`, `ArmyScreen`) et ses actions de navigation/ouverture de panneau continuent de fonctionner. Preuve : test/grep ciblé + QA visuelle.
- [ ] Les quêtes/cartes quotidiennes via `DailyRetentionWidget` restent visibles et correctement positionnées sur `/game` et `/game/world`, sans être masquées par la topbar ou la bottom nav. Preuve : QA visuelle.
- [ ] Les éléments dépendant de `--bftc-bottom-nav-height` et `--bftc-bottom-nav-gap` restent positionnés au-dessus de la nav (`OnboardingFab`, contenus Army, overlays/panels bas). Preuve : test existant si applicable + QA visuelle mobile/desktop.
- [ ] `WorldLockedScreen` et le cas `NoBarracksScreen` ont un comportement cohérent avec le layout retenu : topbar/nav présentes ou exception documentée et validée dans la fiche. Preuve : inspection navigateur.
- [ ] `rtk yarn workspace battleforthecrown-pixi type-check`, les tests ciblés layout/nav, puis `rtk yarn static-check` passent.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Frontend HUD : skill `bftc-react-hud`

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
  - [ ] Chrome jeu centralisé — `grep` ciblé → à remplir.
  - [ ] Routes `/game/*` avec une seule topbar/nav et active tab correcte — test layout/nav + inspection navigateur → à remplir.
  - [ ] Contrat URL `panel=buildings` — test route/view ou inspection navigateur → à remplir.
  - [ ] Onboarding non régressé — test/grep ciblé + inspection navigateur → à remplir.
  - [ ] Quêtes/cartes quotidiennes non régressées — inspection navigateur → à remplir.
  - [ ] Positionnement lié aux CSS vars bottom nav — test existant si applicable + inspection mobile/desktop → à remplir.
- **Review indépendante** : `Déclenchée (raison: invariant durable UI/layout + diff estimé > 100 lignes probable)`.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : Aucun attendu, raison : scope frontend layout.
- **QA fonctionnelle agent** : inspection navigateur desktop/mobile des routes `/game`, `/game/world`, `/game/army`, `/game/messages`.
- **Tests IG à faire par le user** : checklist visuelle si un vrai geste mobile ou une appréciation UX reste nécessaire.

## Notes de cadrage

### Piste recommandée

Créer un `GameShellLayout` ou `GameChromeLayout` route-level sous les routes `/game/*`, distinct de `AuthenticatedShell` :

- `AuthenticatedShell` reste propriétaire de la session technique : WebSocket, bindings serveur, seeds REST vers stores, puis `<Outlet />`.
- Le nouveau layout UI devient propriétaire du chrome de jeu : `GameHeader`, `BottomNavigationBar`, `ToastStack`, active tab, unread badge, handlers de navigation et CSS vars de la bottom nav.
- Les screens métier gardent leur contenu et leurs états métier : canvas village, carte monde, armée, inbox, sheets et modales.

### Contrat recommandé pour `Bâtiments`

Le bouton `Bâtiments` est le seul cas qui n'est pas une navigation pure :

- depuis `/game`, il ouvre `BuildingManagementPanel` via l'URL bornée `/game?panel=buildings` ;
- fermer le panel retire `panel=buildings` ;
- depuis `/game/army`, `/game/world` ou `/game/messages`, il navigue vers `/game` sans ouvrir automatiquement le panel.

Ce contrat évite un registre impératif de callbacks entre child et layout, garde le back button/debug lisible, et laisse `VillageView` propriétaire du panneau métier.

### Points d'attention

- Ne pas transformer `AuthenticatedShell` en composant fourre-tout : séparer le shell technique et le shell UI.
- Ne pas déplacer la logique onboarding/quêtes dans le layout ; le layout fournit le cadre, les views restent propriétaires de leurs widgets métier.
- Ne pas corriger les bottom sheets dans ce run sauf ajustement strictement nécessaire au layout.
- Préserver les offsets liés à `--bftc-bottom-nav-height` utilisés par Army et `OnboardingFab`.
- Décider explicitement si `NoBarracksScreen` doit hériter du shell complet ou rester une exception.

## Liens détectés

- À faire avant : Aucun. Éviter toutefois une exécution parallèle avec [`tasks/runs/041-fix-mobile-browser-gestures-bottom-sheets.md`](./041-fix-mobile-browser-gestures-bottom-sheets.md) si ce run modifie aussi les règles viewport/app-shell.
- À faire après : Aucun.
- Doublon potentiel : Aucun.
- Connexe (contexte) :
  - [`tasks/runs/archive/039-integrate-army-view-design-system.md`](./archive/039-integrate-army-view-design-system.md) — préserver le shell runtime Army et le contenu design-system livré.
  - [`tasks/runs/041-fix-mobile-browser-gestures-bottom-sheets.md`](./041-fix-mobile-browser-gestures-bottom-sheets.md) — risque de conflit CSS/viewport/app-shell.
  - [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md) — contexte bottom sheets, pas doublon.
  - [`tasks/archive/50-kingdom-activities-bottom-sheet-integration.md`](../archive/50-kingdom-activities-bottom-sheet-integration.md) — refonte `BottomNavigationBar` anciennement hors scope.
- Déjà résolu (archive) :
  - [`docs/architecture/audit/12-pixi-transverse-components-misplaced.md`](../../docs/architecture/audit/12-pixi-transverse-components-misplaced.md) — placement layout déjà traité, centralisation du rendu non traitée.
  - [`docs/architecture/audit/13-pixi-game-session-fragile-wrapper.md`](../../docs/architecture/audit/13-pixi-game-session-fragile-wrapper.md) — shell technique route-level déjà traité, chrome UI non traité.
- Keywords scannés : `bottom`, `nav`, `layout`, `army`, `messages`.
