# Run #041 — fix-mobile-browser-gestures-bottom-sheets

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

- [ ] T1 — Décider le périmètre du verrou mobile : global `html/body/#root` ou shell jeu authentifié, puis appliquer le CSS minimal sans casser les scrolls internes.
- [ ] T2 — Renforcer `BottomSheet` comme primitive centrale de swipe-to-close : zone haute/poignée, `touch-action`, capture pointer, seuils, reset, non-interception des contrôles interactifs.
- [ ] T3 — Ajuster le contrat de scroll de `GameBottomSheetPanel` pour garder un body scrollable fluide et borné (`overscroll-contain`, scroll tactile, pas de fuite vers viewport).
- [ ] T4 — Valider les callers critiques sans forks locaux : multi-village/profile, activités royaume, armée recrutement/garnison, keypad numérique.
- [ ] T5 — Ajouter un filet test ciblé sur `BottomSheet` ou un caller existant : fermeture par geste, clic overlay, non-drag sur élément interactif.
- [ ] T6 — Documenter l'invariant UI/mobile retenu : README bottom sheet + doc UI, et ADR seulement si le choix devient une règle structurante cross-app.
- [ ] T7 — QA mobile réelle : pull-to-refresh neutralisé, swipe-to-close fonctionnel, scroll interne préservé, drag Armée non régressé.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] Pull-to-refresh/overscroll neutralisé sur routes de jeu — `visuel` → à vérifier sur mobile réel.
  - [ ] Swipe down sur zone haute `BottomSheet` ferme le sheet — `visuel` + test Pointer Events ciblé si possible.
  - [ ] Scroll interne des sheets préservé — `visuel` → à vérifier sur mobile réel.
  - [ ] Contrôles interactifs non interceptés — test ciblé ou `visuel` selon faisabilité.
  - [ ] Drag tactile Armée non régressé — `visuel` → à vérifier sur mobile réel.
  - [ ] Auth mobile utilisable — `visuel` → à vérifier sur mobile réel.
- **Review indépendante** : `Déclenchée (raison: diff estimé > 100 lignes possible + invariant durable UI/mobile)`.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes lancés** : Non applicable si aucun backend touché.
- **Smokes ajoutés/modifiés** : Aucun attendu, raison : scope frontend UI.
- **QA fonctionnelle agent** : inspection navigateur/mobile selon environnement disponible.
- **Tests IG à faire par le user** : checklist tactile réelle si le device mobile humain reste nécessaire.

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
