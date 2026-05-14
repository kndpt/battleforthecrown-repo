# 51 — Standardiser les bottom sheets sur le design `Activités du royaume`

**Sévérité** : 🟠 Moyenne  
**Statut** : ✅ Résolu  
**Décision UX** : le bottom sheet `Activités du royaume` devient la référence visuelle et structurelle des panneaux bas du jeu.

## Objectif

Migrer les autres bottom sheets du frontend vers une base commune inspirée du panneau `Activités du royaume`, puis imposer cette base pour tous les prochains bottom sheets.

Le but n'est pas seulement cosmétique : il faut éviter que chaque feature recrée son propre conteneur, son overlay, ses rayons, son header, ses états et son comportement mobile.

## État actuel

Le composant `BottomSheet` fournit surtout le comportement technique :

- overlay ;
- animation depuis le bas ;
- `maxHeight` ;
- fermeture.

Mais le rendu visuel est encore porté par chaque contenu. Le panneau `Activités du royaume` a maintenant une direction plus forte :

- poignée haute ;
- header typé `Panneau` + titre fort ;
- surface parchemin ;
- coins hauts arrondis ;
- séparateurs propres ;
- onglets/sections intégrés ;
- meilleure lisibilité mobile.

## Périmètre recommandé

### 1. Créer une base design-system

Extraire ou créer un composant de base dans :

```txt
battleforthecrown-pixi/src/features/design-system/components/
```

Nom indicatif :

```ts
GameBottomSheetPanel
```

Il doit gérer :

- surface parchment cohérente ;
- poignée ;
- header optionnel `eyebrow + title`;
- bouton fermer ;
- zone contenu scrollable ;
- variantes simples si nécessaire (`default`, `compact`, `tabbed`) ;
- comportement responsive sans texte qui sort ou overlay qui intercepte le contenu.

Le composant technique `BottomSheet` peut rester la couche animation/overlay, mais les contenus ne doivent plus recoder la coque visuelle.

### 2. Migrer les bottom sheets existantes

Candidates à inspecter :

- `KingdomActivitiesBottomSheet` : référence actuelle, doit consommer la base sans régression.
- `PowerBottomSheet`.
- `QueueBottomSheet`.
- `BuildingManagementPanel`.
- Bottom sheet armée/village/monde qui ouvrent `Activités du royaume`.

Migration par priorité :

1. extraire la base depuis `Activités du royaume` ;
2. rebrancher `KingdomActivitiesBottomSheet` dessus ;
3. migrer les sheets simples (`Power`, `Queue`) ;
4. migrer les sheets plus métier si le coût reste raisonnable.

## Règles

- Ne pas recréer une deuxième famille de composants.
- Ne pas faire une refonte fonctionnelle des contenus métier.
- Garder `BottomSheet` comme primitive comportementale si c'est le plus simple.
- Tout nouveau bottom sheet doit passer par la base design-system.
- Pas de card dans card : la base est la coque, le contenu peut contenir des listes/cartes métier.
- Vérifier mobile et desktop.

## Critères de succès

- `Activités du royaume` garde son rendu actuel ou l'améliore légèrement.
- Les autres bottom sheets migrées partagent la même coque visuelle.
- Les clics dans le contenu ne sont pas interceptés par l'overlay.
- Le scroll interne fonctionne quand le contenu dépasse `maxHeight`.
- Les nouveaux bottom sheets ont une API évidente et documentée par usage dans le code.
- `yarn static-check` vert.

## Tests attendus

- Tests frontend ciblés si une logique de wrapper ou d'accessibilité est ajoutée.
- Inspection navigateur mobile sur au moins :
  - `Activités du royaume` ;
  - `PowerBottomSheet` ;
  - `QueueBottomSheet` ou `BuildingManagementPanel`.
- `yarn static-check`.
