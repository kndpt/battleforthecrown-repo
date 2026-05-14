# 58 — Vision multi-village : seuls les cercles du village sélectionné sont affichés

**Sévérité** : 🟡 Majeure  
**Statut** : ✅ Résolu

## Symptôme

Un joueur possède plusieurs villages avec Tour de Guet, mais la carte n'affiche qu'un seul disque de vision : celui du village courant/sélectionné.

Exemple observé : 2 villages joueur visibles sur la carte, mais un seul grand cercle autour de `Cursed Village`. Le premier village du royaume n'a pas son propre cercle, alors que la spec indique que la vision doit être l'union des disques de toutes les tours.

## Contrat gameplay

Docs canoniques :

- `docs/gameplay/01-overview.md` : **Vision = union des disques de toutes mes tours de guet**.
- `docs/gameplay/00-game-flow.md` : la vision large vient de plusieurs villages/tours, pas d'une tour globale.
- `docs/gameplay/03-buildings.md` : conquérir un village avancé puis y développer une Tour de Guet ouvre un nouveau disque de vision.

Comportement attendu :

- chaque village joueur avec `WATCHTOWER.level > 0` produit son propre disque ;
- la vision effective est l'union de ces disques ;
- la carte principale et la mini-carte affichent tous les disques ;
- les entités et expéditions visibles doivent correspondre à cette même union.

## Cause probable

Le backend calcule déjà une union multi-village :

- `VisionService.getVisionDisks(userId, worldId)` parcourt tous les villages du joueur et lit chaque `WATCHTOWER`.
- `WorldController.applyFogIfEnabled` applique le fog côté serveur avec ces disques.

Mais le frontend reconstruit une vision locale différente :

- `WorldMapScreen` lit `watchtowerLevel` via `useBuildingsForLockCheck()`, qui ne regarde que le village courant (`useGameStore().villageId`).
- `WorldMapCanvas` reçoit `myVillage` + `visibilityRadius`, donc un seul centre.
- `WorldMapScene.setVision(myVillage, radius)` dessine un seul trou/ring.
- `WorldMiniMap` dessine également un seul cercle autour de `myVillage`.
- `filterEntitiesByVision` tente une union de tous les `isMine`, mais avec le même rayon issu du village courant pour tous les villages. Cela peut diverger du backend si les tours ont des niveaux différents.

Résultat : le runtime est potentiellement incohérent :

- backend = union réelle par village/tour ;
- frontend overlay = cercle unique ;
- frontend filtre local = union approximative avec un niveau unique.

## Pourquoi ce n'est pas un petit fix

Il ne suffit pas de dessiner un deuxième cercle à partir de `myVillages`.

Le client doit connaître le **niveau de Watchtower de chaque village** ou recevoir directement les **vision disks autoritatifs**. Sinon on risque :

- d'afficher un cercle faux ;
- de révéler visuellement une zone que le backend ne considère pas visible ;
- ou de cacher côté client une entité que le backend a déjà révélée.

La source de vérité doit rester server-authoritative.

## Pistes

### A — Exposer les `visionDisks` autoritatifs avec la carte

- Faire retourner au backend les disques calculés par `VisionService.getVisionDisks`.
- Côté frontend, utiliser ces disques pour :
  - filtrer si un filtre client reste nécessaire ;
  - dessiner le fog/rings dans `WorldMapScene` ;
  - dessiner les cercles sur `WorldMiniMap`.
- Avantage : aucun recalcul frontend des niveaux de bâtiments.
- Point d'attention : changement de shape API (`GET /world/:worldId/entities` ou endpoint dédié).

### B — Endpoint dédié `GET /world/:worldId/vision`

- Garder `/entities` inchangé.
- Ajouter un endpoint qui expose `{ disks: VisionDisk[] }`.
- Le frontend combine `entities + vision`.
- Avantage : séparation claire.
- Point d'attention : deux requêtes à synchroniser et invalidations à gérer après upgrade Watchtower / changement de village.

### C — Recalcul frontend depuis les bâtiments de tous les villages

- Charger les bâtiments de tous les villages joueur.
- Construire les disques côté client.
- À éviter sauf justification forte : duplication d'une règle déjà server-side et risque de divergence.

## Scope recommandé

### Backend

1. Choisir la surface API qui expose la vision autoritative.
2. Réutiliser `VisionService.getVisionDisks` sans dupliquer le calcul.
3. Vérifier que la réponse ne révèle pas d'information sensible : les disques sont dérivés des villages du joueur.
4. Ajouter un test/smoke qui prouve que 2 villages avec Watchtower produisent 2 disques et que le fog utilise leur union.

### Frontend Pixi

1. Remplacer le modèle `myVillage + visibilityRadius` par `visionDisks: VisionDisk[]`.
2. Faire dessiner tous les trous/rings dans `WorldMapScene`.
3. Faire dessiner tous les cercles dans `WorldMiniMap`.
4. Retirer ou aligner `filterEntitiesByVision` pour ne plus utiliser un rayon unique du village courant.
5. Adapter le recentrage : le bouton peut rester centré sur le village courant, mais la vision affichée ne doit pas dépendre de ce choix.

### Documentation

Vérifier `docs/architecture/` et documenter la décision technique retenue :

- quelle API expose la vision autoritative ;
- pourquoi le frontend ne recalcule pas les disques depuis un seul village ;
- comment éviter les divergences backend/frontend sur le fog.

## Critères de succès

- Avec 2 villages ayant une Watchtower, la carte principale affiche 2 disques de vision.
- La mini-carte affiche aussi 2 disques.
- Les rayons reflètent le niveau de Watchtower de chaque village, pas celui du village courant.
- Les entités visibles côté frontend correspondent à l'union calculée backend.
- Les expéditions restent visibles uniquement dans la vision effective.
- Tests backend couvrent l'union multi-village.
- Tests frontend couvrent le passage de plusieurs disques jusqu'au rendu/filtre.
- Documentation architecture mise à jour si une nouvelle surface API ou convention frontend/backend est introduite.

## Résolution

- `GET /world/:worldId/entities` renvoie maintenant `{ entities, visionDisks, fogOfWarEnabled }`.
- `visionDisks` vient de `VisionService.getVisionDisks` et reste la source autoritative pour la carte Pixi, la mini-carte et le filtre client.
- Le frontend ne recalcule plus un rayon local depuis le village sélectionné.
- Smoke backend : 2 villages avec Watchtower produisent 2 disques et la fog utilise leur union.
