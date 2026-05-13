# 48 — Design-system du panneau Activités du royaume

**Sévérité** : 🟠 Moyenne

**Statut** : ✅ Résolu

**Décision UX** : le panneau `Expéditions` et `Captures` doit partager une même bottom sheet `Activités du royaume`, avec deux onglets et le même langage visuel que la maquette `CaptureWindowTracker`.

## Contexte

Le prototype `battleforthecrown-design-system/project/capture-window-tracker.jsx` contient déjà :

- un badge HUD `Captures` ;
- une bottom sheet mobile `Activités du royaume` ;
- deux onglets voisins `Expéditions` et `Captures` ;
- une liste détaillée de captures ;
- un stub expéditions qui démontre la cohabitation.

La source observée est dans `battleforthecrown-design-system/project/`. Aucun port React/Tailwind production-ready n'existe encore dans `battleforthecrown-pixi/src/features/design-system/`.

## Objectif

Créer dans `battleforthecrown-pixi/src/features/design-system/` les composants React/Tailwind réutilisables pour :

- la bottom sheet `Activités du royaume` ;
- les tabs `Expéditions` / `Captures` avec badges ;
- la carte de capture ;
- la ligne/carte compacte d'expédition ;
- les badges HUD correspondants.

## Règles

- Utiliser le skill `bftc-design-system-migration`.
- Rebaser depuis le prototype HTML/JSX, pas depuis l'UI actuelle `ExpeditionList`.
- Le premier preview `/design-system` doit reproduire la maquette source avec fixtures équivalentes.
- Tous les textes, compteurs, états et actions doivent venir de props.
- Garder les composants présentation-only : aucune query API, aucun store Zustand, aucune logique métier serveur.
- Exposer les états visuels nécessaires :
  - capture `open`, `soon`, `completed`, `interrupted` ;
  - expédition `attack`, `reinforce`, `scout` ;
  - phase expédition `en_route`, `resolved`, `returning`.

## Hors scope

- Endpoint backend.
- TanStack Query.
- Branchement dans la carte monde ou le HUD réel.
- Mutation de rappel d'expédition.

## Critères de succès

- `/design-system` expose le panneau `Activités du royaume` avec les deux onglets.
- Les captures et les expéditions utilisent le même chrome de bottom sheet.
- Le badge HUD peut afficher séparément `Captures N` et `Expéditions N`.
- Le rendu reste lisible mobile, avec deux badges alignables quand les deux compteurs sont > 0.
- Les composants sont importables par l'app sans réécrire leur API.

## Tests attendus

- `yarn workspace battleforthecrown-pixi type-check`
- `yarn workspace battleforthecrown-pixi build` si la route `/design-system` ou des assets changent.
- Inspection navigateur de `/design-system`.

## Résultat

- Composants ajoutés dans `battleforthecrown-pixi/src/features/design-system/components/KingdomActivitiesPanel.tsx`.
- Exports ajoutés au sas React design-system.
- Preview `/design-system` ajouté avec bottom sheet `Activités du royaume`, onglets `Expéditions` / `Captures`, badges HUD alignables, cartes de captures et lignes d'expéditions.
- Vérifié sur viewport mobile 390 px : pas de scroll horizontal, onglet expéditions cliquable.

## Vérification

- `yarn workspace battleforthecrown-pixi type-check` — vert.
- `yarn workspace battleforthecrown-pixi build` — vert.
- Playwright local sur `http://127.0.0.1:5174/design-system` — section visible, onglet `Expéditions` ouvre la liste.
