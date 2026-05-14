# 47 — Queue visuelle de formation du Noble manquante

**Sévérité** : 🟠 Moyenne  
**Statut** : ✅ Résolu  
**Décision UX** : la formation du Noble doit afficher une progression visuelle comme les troupes de Caserne.

## Symptôme

Dans la Salle du Trône, après lancement du recrutement :

- l'état `Noble déjà en formation` est bien affiché ;
- le temps total de recrutement est visible ;
- mais aucune queue/progression ne montre où on en est.

Résultat : le joueur sait que le Noble est en formation, mais pas le temps restant, la progression, ni le prochain jalon.

## Pourquoi

Le Noble utilise `UnitTraining` comme les troupes, mais avec `building = THRONE_HALL`. L'UI actuelle de la Salle du Trône ne rend pas encore cette queue, contrairement à la Caserne qui affiche une carte de formation avec progression.

Pour une formation longue et coûteuse, c'est trop opaque.

## Pistes

### A — Queue Noble intégrée dans la Salle du Trône

- Dans `BuildingDetailModal` pour `THRONE_HALL`, détecter `UnitTraining.unitType === 'NOBLE'`.
- Remplacer le simple bouton désactivé par un bloc de formation actif :
  - libellé `Noble en formation` ;
  - temps restant ;
  - heure/ETA de fin ;
  - barre de progression ;
  - quantité `0/1` ou `En cours` ;
  - bouton annuler si le backend supporte déjà l'annulation de ce training.
- Reprendre le langage visuel de `UnitCard`/Caserne autant que possible.

### B — Composant partagé `TrainingProgressCard`

- Extraire une carte générique utilisée par la Caserne et la Salle du Trône.
- Paramètres : icône, nom unité, `createdAt`, `timePerUnitMs`, `totalQty`, `completedQty`, cancel handler.

Plus propre si on veut éviter de dupliquer la logique de calcul de progression.

## Critères de succès

- Après lancement du Noble, la Salle du Trône affiche une queue/progression visible.
- La progression avance sans refresh manuel.
- Le temps restant est compréhensible.
- La fin de formation disparaît/refetch correctement quand `unit.training.completed` arrive.
- La Caserne ne réaffiche toujours pas `NOBLE`.
- Tests frontend ciblés couvrent le calcul/rendu de progression Noble ou le composant partagé.
