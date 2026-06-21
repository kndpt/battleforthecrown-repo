# 25 — Visibilité durée capture : asymétrie barbare vs PvP

**Sévérité** : 🟢 Mineure
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Décision** : aligner — afficher la durée partout (côté barbare comme PvP). L'asymétrie était une friction UX sans valeur ludique réelle. La planification d'une conquête est une décision stratégique majeure ; cacher la durée pousse le joueur vers la doc externe ou l'essai-erreur, sans bénéfice.

**Doc mise à jour** :
- `docs/gameplay/13-barbarian-conquest.md` § Visibilité de la durée : passage de *« n'est pas affichée avant l'installation »* à *« pré-affichée sur le panneau d'info »*. Suppression de l'argument *« flou ludique »*. Référence croisée vers la spec PvP.
- `docs/gameplay/14-pvp-conquest.md` § Période de capture / Visibilité : suppression de la note d'asymétrie *« différent de la spec barbare »* — c'est désormais aligné.

**Implémentation** : livrée par le run [`060-feature-pvp-capture-duration-preview`](../runs/archive/060-feature-pvp-capture-duration-preview.md) — helper shared `getPvpCaptureDurationLabel` (source unique de la courbe), preview « Fenêtre de capture » sur `AttackDetailModal` + `SelectedEntityPanel` + rapport scout (`castleLevel` snapshot au scout). La dette UX de pré-affichage PvP est close.

## Symptôme

`docs/gameplay/13-barbarian-conquest.md:90` — durée de capture **cachée** avant installation du Seigneur (« flou volontaire »).

`docs/gameplay/14-pvp-conquest.md:87` — durée **pré-affichée** sur le panneau d'info ennemi et dans le rapport scout.

Asymétrie volontaire mais étrange UX : le joueur va se demander pourquoi un panneau a un timer pré-affiché (PvP) et l'autre non (barbare).

## Question à trancher

- Aligner les deux (afficher partout ou cacher partout).
- Garder asymétrie + ajouter une note UX visible (« Durée révélée à la conquête » sur panneau barbare) pour expliquer.

Pas urgent — à trancher pendant le passage UI panneau village.
