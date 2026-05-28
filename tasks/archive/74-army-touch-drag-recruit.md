# 74 — Drag tactile direct (tap + glisser) pour recruter dans la vue Armée

**Sévérité** : 🟠 Moyen
**Statut** : ✅ Résolu 2026-05-28
**Spec amont** : aucune (correctif UX). Contexte d'origine : [`runs/archive/039-integrate-army-view-design-system.md`](../runs/archive/039-integrate-army-view-design-system.md)

## Symptôme

Sur tactile mobile, dans la vue Armée, on ne peut pas glisser une troupe vers la zone de recrutement par un simple tap + glissement : il faut faire un **tap long** puis glisser. À la souris, tap + glisser fonctionne normalement.

## Cause racine

Le drag-and-drop repose sur le **HTML5 native drag-and-drop** (attribut `draggable` + `onDragStart`/`onDragEnd` + `dataTransfer`), aucune lib. Sur Android Chrome le DnD natif HTML5 exige un long-press pour démarrer le drag ; iOS Safari ne le supporte quasiment pas. Le symptôme est intrinsèque à la techno, pas un réglage.

## Comportement attendu

- Tactile mobile : un tap suivi d'un glissement immédiat (sans long-press) démarre le drag d'une tuile déverrouillée.
- Souris : comportement actuel (tap + glisser direct) inchangé, aucune régression.
- Tap simple sans déplacement significatif (< ~8px) → ouvre toujours le détail troupe (`onSelect`), pas un drag.
- Tuile verrouillée (`draggable=false`) jamais draggable.
- Le scroll vertical de la grille de troupes au doigt reste possible (le drag ne capture pas tout mouvement vertical par erreur).

## Pistes

**B — Pointer Events maison (recommandée).** Remplacer le HTML5 DnD par `onPointerDown/Move/Up` + `setPointerCapture`, seuil d'activation ~8px pour distinguer tap vs drag, overlay « ghost » suivant le pointeur, `touch-action: none` ciblé sur la tuile. Hit-test de la drop zone unique au `pointerup` (1 bounding rect). Zéro dépendance, cohérent avec le pattern pointer-capture déjà utilisé dans `WorldMiniMap.tsx` et `BottomSheet.tsx`.

**A — dnd-kit.** Ajouter `@dnd-kit/core`, `PointerSensor` avec `activationConstraint: { distance: 8 }`. Résout le tap+glisser élégamment mais introduit une dépendance pour 1 source / 1 cible → sur-dimensionné. À reconsidérer si le DnD se généralise (plusieurs drop zones, réordonnancement) — dans ce cas, basculer en run + ADR.

## Scope recommandé

### Frontend

- `src/features/design-system/components/ArmyViewDesign.tsx` — `PortraitTile` (source du drag, ~l.560-649), `RecruitSheet` (drop zone, ~l.651), props `onTroopDragStart/End`.
- `src/features/army/ArmyScreen.tsx` — état `draggedTroopId`, `handleDropTroop`, branchements. Résoudre la troupe via le state React (`draggedTroopId` déjà présent) au lieu de `dataTransfer`.
- `src/features/army/armyViewModel.ts` — inchangé (flag `draggable` reste valide).

## Points d'attention

- `dataTransfer` disparaît : résoudre la troupe en cours via `draggedTroopId` (state React déjà présent), vérifier qu'aucun autre consommateur ne lit le MIME `application/x-bftc-army-troop`.
- Conflit scroll vs drag : la grille est dans un conteneur `overflow-y-auto`. `touch-action: none` doit être ciblé sur la tuile uniquement, sinon le scroll au doigt casse.
- `PortraitTile` est un `<button>` avec `onClick` (select) ET drag : arbitrer tap vs drag via le seuil de déplacement.
- Vérifier qu'aucun autre écran ne réutilise `RecruitSheet` avec l'ancien contrat DnD HTML5.
- QA non vérifiable au clavier/souris seul : tester sur device tactile réel (Android Chrome + iOS Safari).

## Critères de succès

- [x] Tap + glisser immédiat fonctionne sur Android Chrome et iOS Safari (zéro long-press).
- [x] Le drop sur la zone de recrutement ouvre le recrutement de la troupe (comportement `handleDropTroop` préservé).
- [x] Comportement souris inchangé.
- [x] Tap simple (< ~8px) ouvre le détail troupe, pas un drag.
- [x] Tuile verrouillée non draggable.
- [x] Feedback visuel de la drop zone (`isDragging`) correct pendant le drag tactile.
- [x] Scroll vertical de la grille au doigt préservé.

## Résolution

Le DnD natif HTML5 a été remplacé dans `ArmyViewDesign` par un drag Pointer Events maison :

- seuil d'activation à 8 px ;
- ghost visuel suivant le pointeur ;
- hit-test de la zone recrutement au `pointerup` ;
- tuiles verrouillées ignorées ;
- tap simple conservé pour ouvrir le détail ;
- pan vertical tactile préservé par scroll manuel du conteneur quand le geste est vertical et que la grille peut scroller.

Vérifications :

- `rtk yarn workspace battleforthecrown-pixi type-check`
- `rtk yarn workspace battleforthecrown-pixi test`
- `rtk yarn static-check`
- review indépendante : premier verdict `BLOCK` sur le scroll tactile, correction appliquée, re-review `GO`.
