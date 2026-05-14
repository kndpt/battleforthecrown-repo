# 61 — Indicateur visuel du village actif sur la WorldMap

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Spec amont** : Aucune (pure UX/UI). Contexte : [`runs/archive/021-feature-village-labels-navigation.md`](./runs/archive/021-feature-village-labels-navigation.md) — Phase 9 navigation multi-village.

## Symptôme

Sur la WorldMap (`WorldMapScene`), aucun marqueur clairement distinctif n'identifie le **village actif** (celui sélectionné dans le header). Le « petit rond blanc/transparent » visible sur **tous** les villages (joueur + barbares) est en fait le ring générique du sprite — il ne distingue pas le mien actif des autres.

Conséquence : sur un compte multi-village, après un changement de village actif via le sélecteur du header, l'utilisateur ne sait pas lequel des sprites sur la carte correspond à son focus courant.

## Cause racine

Le crosshair doré existant (`WorldMapScene.ts` lignes 260-323) **est déjà câblé sur le village actif** (`myVillage` calculé dans `WorldMapScreen.tsx` ligne 85-87 priorisant `currentVillageId` du store). La logique de sélection est correcte.

Mais ses paramètres visuels sont sous-dimensionnés et invisibles en pratique :

- `width: 1.5`, `alpha: 0.6`, segments 6 px.
- Couleur `myVillageStroke = 0xf6e7b1` quasi-blanche, contraste très faible sur terrain clair.
- Visuellement masqué par le ring générique du sprite qui se superpose.

C'est donc un fix UI net : remplacer le crosshair discret par un marqueur saillant.

## Solution retenue

**Halo doré pulsé** autour du sprite du village actif.

- Anneau dessiné via `Graphics`, radius `~22 px` (~ `radius * 1.6`).
- Couleur `COLOR.myVillage` (`0xf2d15c`).
- Fill alpha base `0.18`, stroke alpha base `0.7`.
- Pulse alpha sur stroke : 0.45 → 0.75 sur cycle d'environ 1.5 s via `scene.update(dt)` (fonction sinusoïdale).
- Z-index : au-dessus de la fog/vision overlay, sous le sprite du village (zIndex 9 si sprite à 10) pour ne pas le masquer.
- Le crosshair existant est supprimé (redondant avec le halo).

## Scope recommandé

### Frontend Pixi

- `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts` :
  - Ajouter un layer `Graphics` dédié + handle `setActiveVillage(coords | null)`.
  - Dessiner le halo selon les paramètres ci-dessus.
  - Brancher l'animation pulse via `scene.update(dt)` (déjà existant côté ticker).
  - Supprimer la section `// === Crosshair on my village ===` et ses appels (lignes 260-263, 301-323 ; helper `drawCrosshair` si non utilisé ailleurs).

- `battleforthecrown-pixi/src/features/world/WorldMapCanvas.tsx` :
  - Appeler `handle.setActiveVillage(myVillage)` au mount et dans le `useEffect` dépendant de `myVillage` (à côté du `setVision` existant, lignes 102-107).

### Tests

- Pas de test unitaire requis (rendu Pixi pur).
- Vérifier que les ressources Graphics et l'animation ticker sont proprement détruites au démontage de la scène (cf. cleanup existant pour les autres layers).

### Docs

- Aucun changement de doc gameplay/architecture nécessaire (purement UX).

## Critères de succès

- [ ] Un seul village porte le marqueur sur la map à tout instant : celui dont l'id matche `useGameStore.villageId`.
- [ ] Le marqueur est immédiatement repérable à zoom 1 sur fond de terrain clair (halo coloré > 20 px de diamètre, contraste visible).
- [ ] Au changement de village actif via le sélecteur du header, le marqueur se déplace sur le nouveau village **sans remount** de la scène.
- [ ] Si aucun village actif valide (pas de `villageId`, ou villageId absent des entités visibles), aucun marqueur n'est dessiné.
- [ ] Les villages barbares ne portent jamais le marqueur.
- [ ] Les ressources Pixi (`Graphics`, callback ticker du pulse) sont proprement détruites au démontage de la scène (pas de leak).
- [ ] Le crosshair doré précédent est supprimé (pas de doublon visuel).

## Points d'attention

- **Lisibilité sous la fog** : le village actif est en principe toujours dans la vision personnelle du joueur, mais vérifier qu'aucun cas en bordure de vision ne masque le halo.
- **Bruit visuel avec expéditions sortantes** : la couche `expeditionLayer` est au-dessus des entités (`WorldMapScene.ts` lignes 251-253). Le halo doit rester en-dessous pour ne pas occulter les sprites de troupes en mouvement.
- **Performance** : un seul `Graphics` + un seul tick d'animation — négligeable. La géométrie n'est redessinée que sur changement de position ; seul l'alpha est animé.
- **UX pulse** : si jugé agressif après QA IG, fallback statique (alpha constant à 0.6) sans changer le contrat.
