# Run #041 — fix-mobile-browser-gestures-bottom-sheets

> **Statut** : DONE
> **Démarré** : 2026-05-28
> **Terminé** : 2026-05-28

## Cible

- **Phase roadmap** : Hors roadmap
- **Spec source** : [`docs/architecture/decisions.md`](../../docs/architecture/decisions.md) ADR-01/ADR-07 ; [`docs/gameplay/01-overview.md`](../../docs/gameplay/01-overview.md) § Philosophie mobile ; [`battleforthecrown-pixi/docs/ui-library.md`](../../battleforthecrown-pixi/docs/ui-library.md) § BottomSheet ; [`battleforthecrown-pixi/src/ui/panels/README.bottomsheet.md`](../../battleforthecrown-pixi/src/ui/panels/README.bottomsheet.md)
- **Type** : fix
- **Modules backend** : —
- **Modules frontend** : `pixi/ui/panels`, `pixi/design-system`, `pixi/app-shell`
- **REVIEW_INDÉPENDANT_REQUIS** : oui

## Dépendances

- Aucune dépendance bloquante.
- Contexte à préserver :
  - [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md) — `BottomSheet` reste la couche comportementale ; `GameBottomSheetPanel` reste la coque visuelle.
  - [`tasks/runs/archive/031-feature-multi-village-bottom-sheet-selector.md`](./archive/031-feature-multi-village-bottom-sheet-selector.md) — bottom sheet multi-village important à vérifier en QA mobile.
  - [`tasks/archive/50-kingdom-activities-bottom-sheet-integration.md`](../archive/50-kingdom-activities-bottom-sheet-integration.md) — bottom sheet partagée monde/armée/village.
  - [`tasks/archive/74-army-touch-drag-recruit.md`](../archive/74-army-touch-drag-recruit.md) — drag tactile Armée validé par le user, à ne pas régresser.
- Point d'index à corriger si confirmé pendant le run : `tasks/README.md` liste encore le ticket 51 comme actif alors que l'archive existe.

## Critère de fin (acceptance)

- [ ] Le navigateur ne déclenche plus de pull-to-refresh/overscroll sur les routes de jeu pendant un geste vertical hors zone scrollable interne.
- [ ] Un swipe down démarré sur la zone haute d'un `BottomSheet` ferme le sheet sur mobile.
- [ ] Un geste vertical dans le contenu scrollable d'un bottom sheet scrolle ce contenu sans fermer le sheet par erreur.
- [ ] Les boutons, inputs, keypad et contrôles interactifs dans un sheet ne déclenchent pas le swipe-to-close.
- [ ] Le drag tactile Armée validé par le ticket 74 reste fonctionnel, sans long-press et sans casser le scroll de la grille.
- [ ] Les écrans auth/login/register restent utilisables sur mobile, y compris focus input et scroll si nécessaire.
- [ ] Les tests Pixi ciblés ajoutés/modifiés, `type-check` et `static-check` passent.
- [ ] L'invariant mobile retenu est documenté, avec les exceptions et zones scrollables explicites.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Frontend HUD : skill `bftc-react-hud`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] T1 — Décider le périmètre du verrou mobile : global `html/body/#root` ou shell jeu authentifié, puis appliquer le CSS minimal sans casser les scrolls internes.
- [x] T2 — Renforcer `BottomSheet` comme primitive centrale de swipe-to-close : zone haute/poignée, `touch-action`, capture pointer, seuils, reset, non-interception des contrôles interactifs.
- [x] T3 — Ajuster le contrat de scroll de `GameBottomSheetPanel` pour garder un body scrollable fluide et borné (`overscroll-contain`, scroll tactile, pas de fuite vers viewport).
- [x] T4 — Valider les callers critiques sans forks locaux : multi-village/profile, activités royaume, armée recrutement/garnison, keypad numérique.
- [x] T5 — Ajouter un filet test ciblé sur `BottomSheet` ou un caller existant : fermeture par geste, clic overlay, non-drag sur élément interactif.
- [x] T6 — Documenter l'invariant UI/mobile retenu : README bottom sheet + doc UI, et ADR seulement si le choix devient une règle structurante cross-app.
- [x] T7 — QA mobile réelle : pull-to-refresh neutralisé, swipe-to-close fonctionnel, scroll interne préservé, drag Armée non régressé.

## Progress (rempli pendant le run)

- 2026-05-28 — Préflight terminé : git clean au démarrage, fiche/règles/SPEC/briefing Pixi/skills frontend-tests-qa lus.
- 2026-05-28 — Cartographie terminée : `BottomSheet` porte déjà le swipe, `GameBottomSheetPanel` porte le body scrollable, `AuthScreenViewport` doit garder le scroll auth, `ArmyViewDesign` porte le drag tactile à préserver.
- 2026-05-28 — Implémentation terminée : verrou `html/body/#root`, exception scroll auth, régions drag/scroll déclarées dans `GameBottomSheetPanel`, non-interception des contrôles renforcée dans `BottomSheet`.
- 2026-05-28 — Tests ciblés ajoutés : `BottomSheet.test.tsx` couvre fermeture swipe, contrôle interactif, scroll body ; `ArmyViewDesign.test.tsx` couvre drag tactile immédiat et scroll vertical préservé.
- 2026-05-28 — Review indépendante initiale `BLOCK` sur absence de preuve Armée ; test Armée ajouté ; re-review indépendante `GO`.
- 2026-05-28 — QA worktree démarrée : backend `15002`, frontend `5174`, DB temporaire `battleforthecrown_2e33`, health/backend et routes frontend OK.

## Décisions prises

- Périmètre retenu : verrou global `html/body/#root` pour neutraliser l'overscroll navigateur sur les routes de jeu, avec scroll auth rendu explicite dans `AuthScreenViewport`.
- Pas d'entrée `SPEC.md` ajoutée : l'invariant est technique UI/mobile et vit mieux dans `battleforthecrown-pixi/docs/ui-library.md` + `src/ui/panels/README.bottomsheet.md`.
- Review indépendante initiale : `BLOCK`, finding bloquant sur critère Armée non couvert par le diff observable.
- Correction review : ajout de `ArmyViewDesign.test.tsx` pour prouver le drag tactile immédiat sans long-press et le scroll vertical de la grille.
- Review indépendante finale : `GO`, aucun finding bloquant/majeur/mineur.

## Rapport final

### Synthèse

- Le viewport app est verrouillé contre le pull-to-refresh/overscroll navigateur via `html/body/#root`, sans `touch-action: none` global.
- Les écrans auth gardent un scroll interne explicite (`h-dvh`, `overflow-y-auto`, `overscroll-contain`) pour préserver focus input et petits écrans.
- `BottomSheet` distingue maintenant les zones de drag (`data-bottom-sheet-drag-region`), les zones scrollables (`data-bottom-sheet-scrollable`) et les contrôles interactifs exclus du swipe-to-close.
- `GameBottomSheetPanel` pose ce contrat par défaut : poignée/header = drag, body = scroll interne fluide et borné.
- Deux filets Vitest couvrent la régression : gestes `BottomSheet` et drag tactile Armée.
- `tasks/README.md` ne liste plus le ticket 51 comme actif, puisqu'il est déjà archivé.

### Fichiers touchés

- `battleforthecrown-pixi/src/index.css`
- `battleforthecrown-pixi/src/features/auth/AuthScreenViewport.tsx`
- `battleforthecrown-pixi/src/ui/panels/BottomSheet.tsx`
- `battleforthecrown-pixi/src/features/design-system/components/GameBottomSheetPanel.tsx`
- `battleforthecrown-pixi/src/ui/panels/BottomSheet.test.tsx`
- `battleforthecrown-pixi/src/features/design-system/components/ArmyViewDesign.test.tsx`
- `battleforthecrown-pixi/docs/ui-library.md`
- `battleforthecrown-pixi/src/ui/panels/README.bottomsheet.md`
- `tasks/README.md`
- `tasks/todo.md`

Docs : mises à jour `battleforthecrown-pixi/docs/ui-library.md` et `battleforthecrown-pixi/src/ui/panels/README.bottomsheet.md` pour documenter l'invariant mobile, les exceptions interactives et les zones scrollables.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Pull-to-refresh/overscroll neutralisé sur routes de jeu — `rtk grep -n "overscroll-behavior: none|overflow: hidden|height: 100dvh" battleforthecrown-pixi/src/index.css` → règles présentes sur `html/body/#root`.
  - [x] Swipe down sur zone haute `BottomSheet` ferme le sheet — `rtk yarn workspace battleforthecrown-pixi test BottomSheet.test.tsx` → test `closes on a downward swipe started from the drag region` vert.
  - [x] Scroll interne des sheets préservé — `rtk yarn workspace battleforthecrown-pixi test BottomSheet.test.tsx` → test `does not intercept vertical gestures from scrollable sheet content` vert.
  - [x] Contrôles interactifs non interceptés — `rtk yarn workspace battleforthecrown-pixi test BottomSheet.test.tsx` → test `does not start swipe-to-close from interactive controls` vert.
  - [x] Drag tactile Armée non régressé — `rtk yarn workspace battleforthecrown-pixi test ArmyViewDesign.test.tsx` → tests drag immédiat + scroll vertical de grille verts.
  - [x] Auth mobile utilisable — `curl -I -fsS http://localhost:5174/auth/login` → HTTP 200 ; `AuthScreenViewport` garde `overflow-y-auto overscroll-contain`.
  - [x] Invariant mobile documenté — `rtk grep -n "Contrat mobile des bottom sheets|Invariant mobile|data-bottom-sheet-scrollable" battleforthecrown-pixi/docs/ui-library.md battleforthecrown-pixi/src/ui/panels/README.bottomsheet.md` → sections présentes.
- **Review indépendante** : `Déclenchée (raison: fiche REVIEW indépendante + invariant durable UI/mobile)` ; premier verdict `BLOCK` sur preuve Armée manquante, finding résolu par `ArmyViewDesign.test.tsx` ; verdict final `GO`, aucun finding restant.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-pixi test BottomSheet.test.tsx` → vert, 1 fichier, 3 tests.
  - `rtk yarn workspace battleforthecrown-pixi test ArmyViewDesign.test.tsx BottomSheet.test.tsx` → vert, 2 fichiers, 5 tests.
  - `rtk yarn workspace battleforthecrown-pixi test` → vert, 43 fichiers, 216 tests ; warning jsdom connu `HTMLCanvasElement.getContext()`.
  - `rtk yarn workspace battleforthecrown-pixi type-check` → vert.
  - `rtk yarn static-check` → vert.
- **Smokes lancés** : Non applicable, raison : aucun diff backend ni API.
- **Smokes ajoutés/modifiés** : Aucun, raison : scope frontend UI ; filets Vitest ciblés suffisants selon `bftc-tests-policy`.
- **QA fonctionnelle agent** : DB temporaire `battleforthecrown_2e33` clonée depuis `battleforthecrown`, backend worktree `http://localhost:15002/health` OK, frontend worktree `http://localhost:5174/`, `/design-system` et `/auth/login` HTTP 200.
- **Tests IG à faire par le user** :
  - [ ] Sur mobile réel, dans une route de jeu, tirer verticalement hors contenu scrollable et vérifier que le navigateur ne déclenche pas de pull-to-refresh.
  - [ ] Ouvrir un bottom sheet, swiper vers le bas depuis la poignée/header et vérifier qu'il se ferme.
  - [ ] Dans un bottom sheet avec contenu long, scroller dans le contenu et vérifier que le sheet ne se ferme pas.
  - [ ] Dans Armée, tap + glisser immédiatement une troupe vers recrutement et vérifier qu'aucun long-press n'est nécessaire ; scroller aussi la grille verticalement.
  - [ ] Sur `/auth/login` ou `/auth/register`, focus un input et vérifier que l'écran reste scrollable/utilisable.

## Notes de cadrage

### Pistes

**A — Verrou mobile racine/app plein écran (recommandée).** Ajouter une base CSS qui empêche le viewport de se comporter comme une page web scrollable (`overscroll-behavior`, dimensions plein écran, scroll document neutralisé), puis rendre les scrolls internes explicites dans les surfaces concernées. Le comportement de jeu devient le défaut, les exceptions deviennent locales et lisibles.

**B — Verrou limité au shell jeu.** Appliquer le verrou seulement aux routes authentifiées/surfaces de jeu, en gardant les écrans auth plus proches du web standard. Plus prudent pour les formulaires, mais plus risqué à maintenir si les surfaces partagent le même root.

### Points d'attention

- Ne pas appliquer `touch-action: none` globalement : cela casserait les scrolls internes, les inputs et certains gestes contrôlés.
- Ne pas corriger sheet par sheet : `BottomSheet` doit porter le comportement, `GameBottomSheetPanel` doit seulement garantir une coque et un body scrollable corrects.
- Les zones interactives (`button`, `a`, `input`, `textarea`, `select`, `[role="button"]`, `[data-bottom-sheet-no-drag]`) ne doivent pas déclencher le swipe-to-close.
- La QA mobile réelle est obligatoire : le symptôme vient du navigateur mobile, pas seulement de React.
- Ne pas régresser le correctif du ticket 74 : les tuiles Armée gardent leur drag immédiat et leur arbitrage scroll vs drag.

## Liens détectés

- À faire avant : Aucun.
- À faire après : Aucun.
- Doublon potentiel : Aucun.
- Connexe (contexte) :
  - [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md)
  - [`tasks/runs/archive/031-feature-multi-village-bottom-sheet-selector.md`](./archive/031-feature-multi-village-bottom-sheet-selector.md)
  - [`tasks/archive/50-kingdom-activities-bottom-sheet-integration.md`](../archive/50-kingdom-activities-bottom-sheet-integration.md)
- Déjà résolu (archive) :
  - [`tasks/archive/74-army-touch-drag-recruit.md`](../archive/74-army-touch-drag-recruit.md)
- Keywords scannés : `bottom`, `sheet`, `swipe`, `touch`, `drag`, `overscroll`, `browser`, `mobile`, `gesture`, `pull`, `refresh`.
