# 72 — Stats joueur sur les cartes royaumes

**Sévérité** : 🟠 Moyen
**Statut** : ✅ Résolu 2026-05-25
**Spec amont** : [`docs/gameplay/19-world-lifecycle.md`](../docs/gameplay/19-world-lifecycle.md) pour l'appartenance multi-monde ; [`docs/gameplay/09-power-and-rankings.md`](../docs/gameplay/09-power-and-rankings.md) pour la puissance royaume.

## Symptôme | Problème

L'écran `/worlds` affiche les royaumes disponibles avec leurs informations publiques, mais il ne montre pas les informations personnelles du joueur sur les mondes qu'il a déjà rejoints.

Objectif : sur chaque carte royaume, afficher uniquement si le joueur est présent dans ce monde :

- le nombre de villages du joueur dans ce monde ;
- sa puissance royaume dans ce monde ;
- l'asset canonique de puissance (`/assets/army-power.png`, déjà utilisé par le HUD/profil).

Les mondes non rejoints doivent conserver le rendu actuel sans stat personnelle.

## Cause racine probable

Sans objet — feature frontend d'enrichissement de l'écran de sélection des royaumes.

## Comportement attendu

- Une carte de monde non rejoint n'affiche ni compteur de villages personnel ni puissance personnelle.
- Une carte de monde rejoint affiche le nombre de villages du joueur pour ce `worldId`.
- Une carte de monde rejoint affiche la puissance royaume du joueur pour ce `worldId`, formatée en `fr-FR`.
- L'icône de puissance réutilise `/assets/army-power.png` ou une constante canonique existante.
- Les stats personnelles ne s'affichent pas comme `0` pendant un état de chargement.
- Les données affichées ne dépendent pas du `worldId` courant du store quand la carte concerne un autre monde.

## Pistes

### A — Frontend-only, recommandée

Enrichir les view-models des cartes `WorldCardViewModel` avec une stat personnelle optionnelle par `worldId`, calculée dans `WorldSelector` pour les mondes rejoints seulement, puis rendue dans `WorldCard`.

Points techniques à vérifier pendant l'exécution :

- `useKingdomPowerQuery()` lit aujourd'hui le monde courant via `useGameStore` et ne doit pas être utilisé tel quel pour une liste multi-mondes.
- Pour la puissance, préférer l'endpoint world-scoped `GET /power/kingdom/:userId/public?worldId=...` si aucun hook privé paramétrable n'existe.
- Pour le nombre de villages, réutiliser le `villageCount` des memberships si suffisant ; sinon charger `/village?worldId=...` uniquement pour les mondes rejoints.

### B — Projection backend dédiée

Créer un endpoint qui renvoie toutes les stats personnelles par monde en une seule réponse.

Cette piste est hors scope du ticket. Si elle devient nécessaire, reclasser le sujet en fiche de run car elle touche backend + frontend.

## Scope recommandé

### Frontend

- `battleforthecrown-pixi/src/features/worlds/WorldSelector.tsx`
  - croiser mondes publics, memberships et stats personnelles par monde rejoint ;
  - éviter toute dépendance au seul `worldId` courant du store.
- `battleforthecrown-pixi/src/features/worlds/worldsViewModel.ts`
  - ajouter une stat personnelle optionnelle au `WorldCardViewModel` ;
  - formater villages et puissance en `fr-FR`.
- `battleforthecrown-pixi/src/features/design-system/worlds/WorldsSelectionDesign.tsx`
  - afficher une ligne compacte uniquement quand la stat est disponible ;
  - utiliser l'asset de puissance canonique.

### Tests

- `battleforthecrown-pixi/src/features/worlds/worldsViewModel.test.ts`
- `battleforthecrown-pixi/src/features/design-system/worlds/WorldsSelectionDesign.test.tsx`

Ajouter ou ajuster un test ciblé pour vérifier :

- monde rejoint avec stats → villages + puissance visibles ;
- monde non rejoint → aucune stat personnelle ;
- asset puissance attendu.

### Backend / Shared / Docs

Aucun changement prévu.

Si l'implémentation confirme qu'un nouveau contrat backend/shared est nécessaire, arrêter le mode ticket et créer une fiche de run.

## Liens détectés

- **À faire avant** : aucun.
- **À faire après** : aucun.
- **Doublon potentiel** : aucun.
- **Connexe** :
  - [`tasks/runs/archive/033-feature-worlds-selection-screen.md`](./runs/archive/033-feature-worlds-selection-screen.md) — écran `/worlds`, cards, onglets et `GET /worlds/public`.
  - [`tasks/runs/archive/034-fix-world-scoped-player-data.md`](./runs/archive/034-fix-world-scoped-player-data.md) — isolation multi-monde de la puissance et des query keys.
  - [`tasks/archive/29-power-public-visibility-missing.md`](./archive/29-power-public-visibility-missing.md) — endpoints publics de puissance.
- **Déjà résolu** : aucun.
- **Keywords scannés** : `worlds`, `royaumes`, `presence`, `village`, `villages`, `puissance`, `power`.

## Points d'attention

- Ne pas utiliser naïvement `useKingdomPowerQuery()` pour une liste multi-mondes : il dépend du `worldId` courant du store.
- `ApiClient` ajoute automatiquement `x-world-id` depuis le store sur les requêtes authentifiées ; si un header custom est envisagé, vérifier qu'il n'est pas écrasé.
- Ne pas afficher de valeur `0` tant que la donnée personnelle n'est pas chargée.
- Garder le rendu des mondes non rejoints inchangé.
- Ne pas toucher aux changements dirty existants hors scope.

## Critères de succès

- [x] Un monde dont `isJoined=false` ne rend aucune stat personnelle de villages ni puissance.
- [x] Un monde rejoint avec stats chargées rend le nombre de villages du joueur pour ce `worldId`.
- [x] Un monde rejoint avec stats chargées rend la puissance royaume du joueur pour ce `worldId`, formatée en `fr-FR`.
- [x] L'asset de puissance utilisé est `/assets/army-power.png` ou la constante canonique déjà utilisée par `GameHeader`.
- [x] La récupération de puissance ne dépend pas du `worldId` courant du store pour afficher une autre carte monde.
- [x] Les cartes non rejointes gardent le rendu actuel.
- [x] Les tests Pixi ciblés passent pour le view-model/rendu modifié.

## Résolution

- Les cartes monde ont désormais une stat personnelle optionnelle `personalStats`, construite uniquement pour les mondes rejoints et uniquement après chargement de la puissance.
- `WorldSelector` récupère la puissance publique par `worldId` depuis les memberships, sans dépendre du monde courant du store.
- La query key publique `publicKingdomPower` est séparée de `kingdomPower` pour ne pas polluer le cache complet utilisé par le HUD/profil.
- `WorldCard` affiche une ligne compacte villages + puissance avec `/assets/army-power.png` seulement quand `personalStats` est disponible.

## QA

- Tests Pixi ciblés : `yarn workspace battleforthecrown-pixi test src/features/worlds/GameEntryTransition.test.tsx src/features/worlds/worldsViewModel.test.ts src/features/design-system/worlds/WorldsSelectionDesign.test.tsx` → 3 fichiers / 18 tests OK.
- `yarn static-check` → OK.
- Review indépendante : `BLOCK` initial sur collision de cache `kingdomPower`, corrigé par `publicKingdomPower`, puis re-review `GO`.
- Smokes backend : non applicables, raison : aucun fichier backend touché.
