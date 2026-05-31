# Run #043 — refactor-game-shell-layout

> **Statut** : DONE
> **Démarré** : 2026-05-31
> **Terminé** : 2026-05-31

## Cible

- **Phase roadmap** : Hors roadmap
- **Spec source** : [`docs/architecture/decisions.md`](../../../docs/architecture/decisions.md) ADR-13 `AuthenticatedShell` au niveau Router ; ADR-07 boundary React HUD / Pixi
- **Type** : refacto
- **Modules backend** : —
- **Modules frontend** : `pixi/features/layout`, `pixi/routes/game`, `pixi/features/game`, `pixi/features/world`, `pixi/features/army`, `pixi/features/combat`
- **REVIEW_INDÉPENDANT_REQUIS** : oui

## Dépendances

- Aucune dépendance bloquante.
- Contexte à préserver :
  - [`tasks/runs/archive/039-integrate-army-view-design-system.md`](./039-integrate-army-view-design-system.md) — l'intégration Armée a volontairement conservé le shell runtime existant ; ne pas régresser son contenu design-system ni ses bottom sheets.
  - [`tasks/runs/041-fix-mobile-browser-gestures-bottom-sheets.md`](./041-fix-mobile-browser-gestures-bottom-sheets.md) — éviter une exécution parallèle si ce run modifie aussi les règles viewport/app-shell.
  - [`tasks/archive/51-bottom-sheet-design-system-base.md`](../../archive/51-bottom-sheet-design-system-base.md) — `BottomSheet` reste la primitive comportementale des sheets ; ne pas mélanger cette dette avec la bottom nav.
  - [`tasks/archive/50-kingdom-activities-bottom-sheet-integration.md`](../../archive/50-kingdom-activities-bottom-sheet-integration.md) — la refonte complète de `BottomNavigationBar` y était explicitement hors scope.
  - [`docs/architecture/audit/12-pixi-transverse-components-misplaced.md`](../../../docs/architecture/audit/12-pixi-transverse-components-misplaced.md) — placement transverse de `BottomNavigationBar` déjà traité, sans centralisation du rendu.
  - [`docs/architecture/audit/13-pixi-game-session-fragile-wrapper.md`](../../../docs/architecture/audit/13-pixi-game-session-fragile-wrapper.md) — shell technique route-level déjà traité via ADR-13, mais sans chrome UI.

## Critère de fin (acceptance)

- [x] `GameHeader`, `BottomNavigationBar` et `ToastStack` sont rendus par un seul layout jeu route-level, pas directement par `VillageView`, `WorldMapScreen`, `WorldLockedScreen`, `ArmyScreen` ou `MessagesScreen`. Preuve : `grep` ciblé.
- [x] Les routes `/game`, `/game/world`, `/game/army` et `/game/messages` rendent chacune une seule topbar, une seule bottom nav, et gardent l'active tab correcte. Preuve : test layout/nav ciblé + inspection navigateur.
- [x] Le layout centralise l'unread badge Messages via `useUnreadReportsCount()`, sans recalcul du compteur dans chaque screen. Preuve : `grep` ciblé + test si faisable.
- [x] Le bouton `Bâtiments` suit un contrat robuste : depuis `/game`, il ouvre `BuildingManagementPanel` via un state URL borné (`/game?panel=buildings`) ; depuis les autres tabs, il ramène au village sans ouvrir de panneau fantôme. Preuve : test route/view + inspection navigateur.
- [x] Fermer `BuildingManagementPanel` retire le paramètre `panel=buildings` sans casser les autres ouvertures internes depuis `VillageView`. Preuve : test ou inspection navigateur.
- [x] `OnboardingGuidance` reste rendu sur les écrans concernés (`VillageView`, `WorldMapScreen`, `ArmyScreen`) et ses actions de navigation/ouverture de panneau continuent de fonctionner. Preuve : test/grep ciblé + QA visuelle.
- [x] Les quêtes/cartes quotidiennes via `DailyRetentionWidget` restent visibles et correctement positionnées sur `/game` et `/game/world`, sans être masquées par la topbar ou la bottom nav. Preuve : QA visuelle.
- [x] Les éléments dépendant de `--bftc-bottom-nav-height` et `--bftc-bottom-nav-gap` restent positionnés au-dessus de la nav (`OnboardingFab`, contenus Army, overlays/panels bas). Preuve : test existant si applicable + QA visuelle mobile/desktop.
- [x] `WorldLockedScreen` et le cas `NoBarracksScreen` ont un comportement cohérent avec le layout retenu : topbar/nav présentes ou exception documentée et validée dans la fiche. Preuve : inspection navigateur.
- [x] `rtk yarn workspace battleforthecrown-pixi type-check`, les tests ciblés layout/nav, puis `rtk yarn static-check` passent.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Frontend HUD : skill `bftc-react-hud`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] T1 — Introduire un `GameShellLayout` route-level sous `AuthenticatedShell`, propriétaire de `GameHeader`, `BottomNavigationBar`, `ToastStack`, `PowerBottomSheet`, active tab et unread badge.
  - Fichiers : `battleforthecrown-pixi/src/App.tsx`, `battleforthecrown-pixi/src/features/layout/GameShellLayout.tsx`.
  - Critère : les routes `/game/*` passent par un seul layout UI distinct du shell technique.
- [x] T2 — Convertir `VillageView` au contrat URL `panel=buildings`, sans déplacer les widgets métier.
  - Fichiers : `battleforthecrown-pixi/src/features/game/VillageView.tsx`, helper/test URL si utile.
  - Critère : `/game?panel=buildings` ouvre le panneau, sa fermeture retire seulement ce paramètre, et les ouvertures internes restent possibles.
- [x] T3 — Retirer le chrome dupliqué des écrans `WorldMapScreen`, `WorldLockedScreen`, `ArmyScreen`, `MessagesScreen`.
  - Fichiers : écrans concernés uniquement.
  - Critère : les screens ne rendent plus `GameHeader`, `BottomNavigationBar`, `ToastStack` ni `useUnreadReportsCount()`, tout en gardant onboarding, retention, modales et contenus.
- [x] T4 — Ajouter un filet Vitest ciblé sur orchestration layout/nav/URL.
  - Fichiers : `battleforthecrown-pixi/src/features/layout/GameShellLayout.test.tsx`, helper test si créé.
  - Critère : active tab, unread badge centralisé, clic `Bâtiments` sur `/game` vs autres tabs, et nettoyage du paramètre panel sont couverts.
- [x] T5 — Vérifier visuellement desktop/mobile les routes `/game`, `/game/world`, `/game/army`, `/game/messages`, y compris cas verrouillés si accessibles.
  - Critère : une seule topbar/nav/toast host, widgets non masqués, offsets bottom nav conservés.

## Progress (rempli pendant le run)

- 2026-05-31 — Préflight : worktree principal propre côté fichiers mais bloqué par un cherry-pick en cours ; run déplacé dans worktree dédié `/Users/kelvindupont/Documents/Kelvin/games/battleforthecrown-repo-run043` sur branche `run/043-refactor-game-shell-layout`.
- 2026-05-31 — Règles et contexte chargés : `.agents/rules/{conventions,docs,git}.md`, `SPEC.md`, briefing Pixi, contexte mémoire, ADR-07/ADR-13, runs 039/041, skills `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`, `bftc-worktree-qa`.
- 2026-05-31 — Cartographie lead : chrome dupliqué dans `VillageView`, `WorldMapScreen`, `WorldLockedScreen`, `ArmyScreen`, `MessagesScreen`; `NoBarracksScreen` est une exception actuelle sans shell ; unread badge recalculé dans chaque screen.
- 2026-05-31 — Implémentation : `GameShellLayout` ajouté sous `AuthenticatedShell`; screens métier nettoyés du chrome local ; `VillageView` pilote `BuildingManagementPanel` via `panel=buildings`.
- 2026-05-31 — Tests ciblés : `rtk yarn workspace battleforthecrown-pixi test GameShellLayout.test.tsx gamePanelSearch.test.ts` vert ; `rtk yarn workspace battleforthecrown-pixi type-check` vert.
- 2026-05-31 — Vérifications complètes : `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 rtk yarn workspace battleforthecrown-pixi test` vert ; `rtk yarn static-check` vert après génération Prisma du worktree.
- 2026-05-31 — Review indépendante initiale : `BLOCK` car `static-check` non prouvé au moment de la review + coquille commentaire `The The`; preuves ajoutées et coquille corrigée.
- 2026-05-31 — Review indépendante finale : `GO`, aucun finding bloquant/majeur/mineur.
- 2026-05-31 — QA navigateur : worktree lancé avec DB temporaire `battleforthecrown_run043`, backend `15002`, frontend `5174`; inspection agent des routes `/game/*` et validation utilisateur finale OK.

## Décisions prises

- Dérogation d'environnement : ne pas toucher au cherry-pick en cours du worktree principal ; utiliser un worktree dédié pour préserver l'état utilisateur.
- Conserver `AuthenticatedShell` comme shell technique uniquement ; créer un layout UI enfant pour le chrome jeu conformément à ADR-13.
- Garder `BuildingManagementPanel` propriétaire de `VillageView` et le piloter par `panel=buildings` plutôt qu'un registre impératif de callbacks.
- Centraliser `PowerBottomSheet` dans le layout avec `GameHeader`; conserver seulement le clic ressource du header comme handler optionnel fourni par `VillageView`.

## Rapport final

Chrome jeu centralisé dans `GameShellLayout` sous `AuthenticatedShell` : `GameHeader`, `BottomNavigationBar`, `ToastStack`, `PowerBottomSheet`, active tab et unread badge ne sont plus dupliqués dans les screens métier. `VillageView`, `WorldMapScreen`, `ArmyScreen`, `MessagesScreen`, `WorldLockedScreen` et `NoBarracksScreen` ne gardent que leur contenu, widgets et sheets métier.

Le contrat Bâtiments est borné par URL : depuis `/game`, la nav ouvre `/game?panel=buildings`; fermer le panneau retire seulement ce paramètre avec `replace`; depuis les autres tabs, le bouton ramène au village sans panneau fantôme. Les actions onboarding/daily qui ouvrent les bâtiments réutilisent le même contrat.

Fichiers principaux touchés :
- `battleforthecrown-pixi/src/features/layout/GameShellLayout.tsx`
- `battleforthecrown-pixi/src/features/layout/GameShellLayoutContext.ts`
- `battleforthecrown-pixi/src/features/game/gamePanelSearch.ts`
- `battleforthecrown-pixi/src/App.tsx`
- `battleforthecrown-pixi/src/features/{game,world,army,combat}/...`
- tests ciblés `GameShellLayout.test.tsx` et `gamePanelSearch.test.ts`

Docs : aucun changement nécessaire, raison : ADR-13 documente déjà le shell technique route-level et ce run applique la centralisation chrome UI prévue par la fiche sans introduire de nouvelle règle durable hors code/tests.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Chrome jeu centralisé — `rtk grep "GameHeader|BottomNavigationBar|ToastStack|useUnreadReportsCount" battleforthecrown-pixi/src/features/game battleforthecrown-pixi/src/features/world battleforthecrown-pixi/src/features/army battleforthecrown-pixi/src/features/combat` → seuls le hook source et un commentaire métier restent, aucun rendu dans les screens.
  - [x] Routes `/game/*` avec une seule topbar/nav et active tab correcte — `rtk yarn workspace battleforthecrown-pixi test GameShellLayout.test.tsx gamePanelSearch.test.ts` → 2 fichiers, 8 tests verts ; inspection navigateur `/game`, `/game/world`, `/game/army`, `/game/messages` OK.
  - [x] Unread badge Messages centralisé — `rtk grep "useUnreadReportsCount" battleforthecrown-pixi/src/features/game battleforthecrown-pixi/src/features/world battleforthecrown-pixi/src/features/army battleforthecrown-pixi/src/features/combat` → plus d'usage par screen, usage layout couvert par `GameShellLayout.test.tsx`.
  - [x] Contrat URL `panel=buildings` — `rtk yarn workspace battleforthecrown-pixi test GameShellLayout.test.tsx gamePanelSearch.test.ts` → `/game` ouvre `?panel=buildings`, `/game/army` revient à `/game`, helper conserve les autres params.
  - [x] Fermeture `BuildingManagementPanel` — `rtk yarn workspace battleforthecrown-pixi test gamePanelSearch.test.ts` → `panel=buildings` retiré sans supprimer les autres params ; fermeture runtime câblée avec `replace`.
  - [x] Onboarding non régressé — `rtk grep "OnboardingGuidance" battleforthecrown-pixi/src/features/game/VillageView.tsx battleforthecrown-pixi/src/features/world/WorldMapScreen.tsx battleforthecrown-pixi/src/features/army/ArmyScreen.tsx` → rendu conservé sur les trois écrans ; QA navigateur utilisateur OK.
  - [x] Quêtes/cartes quotidiennes non régressées — `rtk grep "DailyRetentionWidget" battleforthecrown-pixi/src/features/game/VillageView.tsx battleforthecrown-pixi/src/features/world/WorldMapScreen.tsx` → rendu conservé sur `/game` et `/game/world` ; QA navigateur utilisateur OK.
  - [x] Positionnement lié aux CSS vars bottom nav — `rtk grep "--bftc-bottom-nav-height|--bftc-bottom-nav-gap" battleforthecrown-pixi/src/features/layout battleforthecrown-pixi/src/features/army battleforthecrown-pixi/src/features/onboarding battleforthecrown-pixi/src/features/design-system` → vars toujours posées par la nav unique et consommées par Army/onboarding ; QA mobile/desktop utilisateur OK.
  - [x] `WorldLockedScreen` et `NoBarracksScreen` cohérents — `rtk yarn workspace battleforthecrown-pixi test GameShellLayout.test.tsx gamePanelSearch.test.ts` + inspection navigateur → états métier rendus sous le shell partagé, pas d'exception chrome.
- **Review indépendante** : `Déclenchée (raison: fiche REVIEW_INDÉPENDANT_REQUIS + diff > 100 lignes + invariant durable UI/layout)` ; premier verdict `BLOCK` sur preuve `static-check` manquante et coquille commentaire ; findings résolus ; re-review finale `GO`.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-pixi test GameShellLayout.test.tsx gamePanelSearch.test.ts` → vert, 2 fichiers, 8 tests.
  - `rtk yarn workspace battleforthecrown-pixi type-check` → vert.
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 rtk yarn workspace battleforthecrown-pixi test` → vert, 48 fichiers, 242 tests ; warning jsdom connu `HTMLCanvasElement.getContext()`.
  - `rtk yarn workspace battleforthecrown-backend prisma generate` → Prisma client généré pour le worktree.
  - `rtk yarn static-check` → vert.
- **Smokes lancés** : Non applicable, raison : aucun diff backend ni API.
- **Smokes ajoutés/modifiés** : Aucun, raison : scope frontend layout ; filets Vitest ciblés suffisants selon `bftc-tests-policy`.
- **QA fonctionnelle agent** : DB temporaire `battleforthecrown_run043` clonée depuis `battleforthecrown`, migrations OK ; backend `http://localhost:15002/health` OK ; frontend `http://localhost:5174/` HTTP 200 ; inspection in-app browser des routes `/game`, `/game/world`, `/game/army`, `/game/messages` confirmant shell unique et contenu métier visible.
- **Tests IG à faire par le user** : Aucun test IG restant, raison : QA utilisateur effectuée sur navigateur (`tout est ok`) après checklist route/nav/panel.

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
  - [`tasks/runs/archive/039-integrate-army-view-design-system.md`](./039-integrate-army-view-design-system.md) — préserver le shell runtime Army et le contenu design-system livré.
  - [`tasks/runs/041-fix-mobile-browser-gestures-bottom-sheets.md`](./041-fix-mobile-browser-gestures-bottom-sheets.md) — risque de conflit CSS/viewport/app-shell.
  - [`tasks/archive/51-bottom-sheet-design-system-base.md`](../../archive/51-bottom-sheet-design-system-base.md) — contexte bottom sheets, pas doublon.
  - [`tasks/archive/50-kingdom-activities-bottom-sheet-integration.md`](../../archive/50-kingdom-activities-bottom-sheet-integration.md) — refonte `BottomNavigationBar` anciennement hors scope.
- Déjà résolu (archive) :
  - [`docs/architecture/audit/12-pixi-transverse-components-misplaced.md`](../../../docs/architecture/audit/12-pixi-transverse-components-misplaced.md) — placement layout déjà traité, centralisation du rendu non traitée.
  - [`docs/architecture/audit/13-pixi-game-session-fragile-wrapper.md`](../../../docs/architecture/audit/13-pixi-game-session-fragile-wrapper.md) — shell technique route-level déjà traité, chrome UI non traité.
- Keywords scannés : `bottom`, `nav`, `layout`, `army`, `messages`.
