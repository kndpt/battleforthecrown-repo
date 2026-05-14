# 56 — Popup village possédé : afficher les troupes présentes

**Sévérité** : 🟠 Moyen
**Statut** : ✅ Résolu
**Référence UI** : [`battleforthecrown-pixi/src/features/design-system/components/MapEntityCallout.tsx`](../battleforthecrown-pixi/src/features/design-system/components/MapEntityCallout.tsx) + [`SelectedEntityPanel.tsx`](../battleforthecrown-pixi/src/features/world/SelectedEntityPanel.tsx)

## Symptôme

Quand on clique sur un village qu'on possède sur la carte du monde, le popup (`MapEntityCallout`) affiche uniquement :

- titre = nom du village ;
- sous-titre = `Mon village` ;
- coordonnées ;
- bouton `Renforcer` (uniquement si le village cliqué n'est pas le village actif).

Aucune information sur **les troupes présentes dans le village**. Le joueur doit ouvrir l'écran Armée du village concerné (changer de village courant si nécessaire) pour savoir ce qu'il a à quai.

## Comportement attendu

Le popup d'un village possédé doit afficher un récapitulatif des troupes **disponibles dans le village** au moment du clic, peu importe leur origine :

- troupes natives du village (entraînées sur place) ;
- renforts entrants déjà arrivés (`GarrisonLine.direction === 'INCOMING'` côté backend) ;
- agrégat par `UnitType` — peu importe l'origine, l'utilisateur veut savoir combien d'unités défendent ou peuvent partir d'ici.

Cas du village actif : pas de bouton `Renforcer` (déjà filtré par `SelectedEntityPanel.tsx:43-45`), mais la liste des troupes doit être affichée comme pour les autres villages possédés.

Cas où le village est vide (aucune unité) : afficher un libellé court explicite (`Aucune troupe`), pas une section vide.

## État actuel du code

### Frontend

- Composant popup : `MapEntityCallout` accepte déjà un tableau `sections: MapEntityCalloutSection[]` avec `{title, rows: [{label, value}]}`. Le popup barbare l'utilise pour la section `Capture` (cf. `SelectedEntityPanel.captureSectionsFor`).
- Sélection : `WorldMapScene.ts:455-458` → `WorldMapStore.setSelectedEntity` → `WorldMapScreen.tsx:220-236` rend `<WorldEntityTooltip><SelectedEntityPanel>`.
- Hooks data déjà existants côté front :
  - `useArmyInventoryQuery(villageId)` → `GET /army/:villageId/inventory` → `ArmyUnitDto[]` (troupes natives).
  - `useGarrisonQuery(villageId)` → `GET /combat/:villageId/garrison` → `GarrisonLine[]` avec `direction`, `unitType`, `quantity`.
- Helper d'affichage existant : `unitMetaFor(unitType)` (`features/army/unitConfig.ts`) — icône + libellé court.

### Backend

- `GET /combat/:villageId/garrison` (`combat.controller.ts:100-106` → `combat.service.ts:815-876`) renvoie déjà l'agrégat des renforts présents ou en transit.
- `GET /army/:villageId/inventory` renvoie déjà les troupes natives.
- Les deux endpoints sont gardés au propriétaire du village ; le popup ne s'affiche que sur villages possédés → pas d'enjeu d'auth supplémentaire.

### Réutilisable

- `UnitList` / `UnitCard` (`features/army/`) sont taillés pour l'écran Armée plein écran ; trop verbeux pour un callout compact.
- `MapEntityCallout` n'a pas de section "liste compacte avec icône + quantité par unité" — il faudra soit ajouter une variante de `section`, soit composer une nouvelle ligne dans le markup existant.

## Pistes à trancher

### Piste A — Agrégat troupes natives + renforts INCOMING (recommandée)

- Brancher dans `SelectedEntityPanel` les deux queries `useArmyInventoryQuery(entity.id)` + `useGarrisonQuery(entity.id)` quand `entity.kind === 'PLAYER_VILLAGE' && entity.isMine`.
- Sommer par `unitType` : `inventory.quantity + sum(garrisonLines.filter(INCOMING).quantity)`.
- Construire une nouvelle section `Troupes présentes` dans `MapEntityCallout`, avec une ligne par unité (icône + nom court + quantité).
- Vue compacte : limiter à un grid 2 colonnes ; si plus de 6 types, tronquer avec `… +N autres` ou scroll vertical contenu.

Avantages : répond exactement au besoin ("ce qu'on a à quai, peu importe l'origine"), réutilise endpoints existants, 0 changement backend.
Inconvénients : deux queries supplémentaires déclenchées au clic sur chaque village possédé (cache TanStack atténue après premier hit ; les keys sont déjà invalidées par les events WS `army.*`, `garrison.added`, `reinforcement.*`).

### Piste B — Endpoint backend dédié "snapshot village"

- Créer un endpoint `GET /village/:villageId/troops-summary` qui agrège côté serveur troupes natives + renforts présents en un seul `TroopsSummaryDto`.
- Un seul hook front, un seul fetch.

Avantages : moins de chatter REST, contrat plus clair pour d'autres écrans futurs.
Inconvénients : duplication serveur de ce que les deux endpoints existants font déjà ; sur-ingénierie pour un popup. À reconsidérer seulement si la Piste A montre un coût perf mesurable.

### Piste C — Vue détaillée natives vs renforts (sections séparées)

- Deux sections distinctes dans le callout : `Troupes du village` et `Renforts présents`.
- Garde l'info d'origine, utile si on veut un jour rappeler un renfort directement depuis le popup.

Avantages : information plus riche.
Inconvénients : plus encombré ; l'utilisateur a explicitement dit "peu importe si c'est des troupes du village ou du renfort". À garder pour une itération ultérieure si besoin remonte.

## Scope recommandé (si Piste A retenue)

### Frontend

- `SelectedEntityPanel.tsx` : ajouter une fonction `troopsSectionFor(entity)` qui appelle les deux hooks (sous garde `isOwnedPlayerVillage`) et construit un `MapEntityCalloutSection`.
- `MapEntityCallout.tsx` : si la mise en page actuelle (un `label`/`value` par ligne) ne convient pas pour l'icône + nom court + quantité, étendre `MapEntityCalloutSectionRow` ou introduire un sous-type `troopRow` avec `iconAsset`, `label`, `quantity`. Garder l'API existante pour la section `Capture` barbare.
- Gestion des états : loading court (skeleton ligne) ; vide ("Aucune troupe") ; erreur silencieuse (popup reste fonctionnel sans la section).
- Réutiliser `unitMetaFor()` pour l'icône et le nom court.

### Tests

- Test unitaire `SelectedEntityPanel` :
  - village possédé non-actif avec troupes natives + renforts INCOMING → section affichée, somme correcte par unité.
  - village possédé actif avec troupes natives seulement → section affichée, pas de bouton Renforcer.
  - village possédé vide → libellé `Aucune troupe`.
  - village barbare ou ennemi → section non affichée (pas de fetch).
- Mock TanStack via `QueryClientProvider` + données stub `ArmyUnitDto[]` / `GarrisonLine[]`.

### Docs

- Pas de spec gameplay nouvelle, pas d'ADR. Si la doc UI listant les composants (`battleforthecrown-pixi/docs/ui-library.md`) mentionne `MapEntityCallout`, ajouter un exemple de la nouvelle section troupes.

## Critères de succès

- Le popup d'un village possédé liste les troupes présentes (natives + renforts entrants déjà arrivés), agrégées par type d'unité.
- Le village actif reçoit la même liste, sans bouton `Renforcer`.
- Un village vide affiche un libellé explicite, pas une section blanche.
- Aucune régression sur popup barbare (section Capture intacte) ni popup village ennemi (Attaquer/Espionner intacts).
- Static-check + tests Vitest verts.
