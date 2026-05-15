# 65 — Distinguer mes villages des villages joueurs étrangers sur la WorldMap

**Sévérité** : 🟠 Moyen
**Statut** : ✅ Résolu 2026-05-15
**Spec amont** : Aucune (pure UX/UI). Contexte : [`archive/63-foreign-players-invisible-on-world-map.md`](./archive/63-foreign-players-invisible-on-world-map.md) — a rendu les villages joueurs étrangers visibles sans différenciation visuelle. [`archive/61-active-village-map-indicator.md`](./archive/61-active-village-map-indicator.md) — halo doré pulsé sur le **village actif** uniquement.

## Symptôme

Sur la `WorldMapScene`, mes villages non-actifs et les villages des autres joueurs partagent exactement les mêmes couleurs (corps doré + ring doré clair). Seul le village **actif** (sélectionné via le sélecteur du header) est différenciable, via le halo pulsé doré posé par le ticket 61.

Conséquence sur un compte multi-village : impossible de repérer ses propres villages secondaires parmi les villages joueurs étrangers sans cliquer. Le screenshot fourni par le user montre quatre villages joueur visibles autour du centre actif, aucun moyen de distinguer le sien d'un étranger.

## Cause racine

`battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts:369-370` :

```ts
if (entity.isMine || entity.kind === 'PLAYER_VILLAGE') {
  return { color: COLOR.myVillage, ringColor: COLOR.myVillageStroke, radius: 14, zIndex: 10 };
}
```

Le `||` fusionne mes villages **et** les villages étrangers sous une seule branche stylistique (`COLOR.myVillage = 0xf2d15c`, `COLOR.myVillageStroke = 0xf6e7b1`). Aucune palette dédiée pour `PLAYER_VILLAGE && !isMine`.

La mini-carte (`WorldMiniMap.tsx:128-146`) sépare déjà correctement (`KIND_COLOR.PLAYER_VILLAGE` pour les étrangers, doré pour les `isMine`). Le flag `entity.isMine` issu de `buildMapEntities` est donc fiable — le bug est strictement scoped à `WorldMapScene.styleFor`.

## Comportement attendu

- Mes villages (`isMine === true`) sont visuellement distincts des villages joueurs étrangers (`kind === 'PLAYER_VILLAGE' && !isMine`) en un coup d'œil, sans dépendre du clic ou du label.
- Le village **actif** garde son halo doré pulsé (ticket 61), prioritaire sur tout autre marqueur d'ownership.
- Les villages barbares restent identifiables (couleur/sprite actuel préservés).
- La distinction tient à tous les niveaux de zoom.

## Pistes

### A — Couleur dédiée pour les villages étrangers (recommandée)

Conserver la palette dorée pour `isMine`, introduire `COLOR.foreignPlayer` (et `foreignPlayerStroke`) pour `PLAYER_VILLAGE && !isMine`. Brancher une seconde branche dans `styleFor`.

- ✅ Pattern Tribal Wars / Kingsage : le joueur ennemi a une couleur faction distincte.
- ✅ Lisible à tous zooms.
- ⚠️ Teintes à valider en QA (éviter rouge/vert pur, garantir contraste sur terrain clair, ne pas concurrencer le halo doré du village actif).
- Candidats : rouge sourd (`0xb45550`), violet (`0x8b6db8`), bleu acier (`0x5a7ba8`). À trancher avec le user pendant le run.

### B — Taille de sprite réduite pour les étrangers

Laisser `PLAYER_SPRITE_SIZE` pour mes villages, descendre à `SPRITE_SIZE` (taille barbare) pour les étrangers.

- ✅ Implémentation triviale (`WorldMapScene.ts:396, 432`).
- ❌ Moins explicite — un joueur peu attentif manquera la différence.
- ❌ Sémantiquement ambigu — la taille du sprite n'est pas un canal d'ownership.

### C — A + label par défaut sur mes villages

Combiner la couleur dédiée (A) avec un label « Royaume de moi » toujours visible sur mes villages. Aujourd'hui `visual.label.visible = isMine || isSelected` est déjà câblé, donc le label sort déjà sur tous mes villages. La piste consisterait plutôt à **masquer** le label des étrangers au-delà d'un certain zoom out pour réduire le bruit.

- ✅ Renforce A sans coût additionnel notable.
- ⚠️ À évaluer en QA après A.

**Recommandation** : commencer par A, valider les teintes en QA IG avec le user, puis décider si C est nécessaire.

## Scope recommandé

### Frontend Pixi

- `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts` :
  - Étendre la constante `COLOR` avec `foreignPlayer` + `foreignPlayerStroke`.
  - Scinder la branche `styleFor` lignes 369-370 : `entity.isMine` → palette dorée existante ; `entity.kind === 'PLAYER_VILLAGE' && !entity.isMine` → nouvelle palette.
  - Vérifier que `radius` / `zIndex` restent cohérents (ou descendre légèrement le radius des étrangers à 12).
  - Vérifier `size = isMine ? PLAYER_SPRITE_SIZE : SPRITE_SIZE` (ligne 396) — clarifier si les étrangers prennent `PLAYER_SPRITE_SIZE` ou `SPRITE_SIZE`. Aligner sur la décision design.

- `battleforthecrown-pixi/src/features/world/WorldMiniMap.tsx` :
  - Optionnel : harmoniser `KIND_COLOR.PLAYER_VILLAGE` avec la nouvelle teinte étrangère pour cohérence carte/minimap.

### Tests

- Pas de test unitaire requis (rendu Pixi pur).
- Vérifier `buildMapEntities.test.ts` reste vert (le flag `isMine` est déjà testé).

### Docs

- Aucun changement obligatoire (UX pure).
- Si la convention couleur s'étend (faction self / foreign / barbarian dans le design system), ajouter une note dans `battleforthecrown-pixi/docs/ui-design-system.md`. À évaluer au moment du run.

## Critères de succès

- [ ] Sur un compte multi-village avec au moins un village joueur étranger à portée de vision, mes villages non-actifs sont visuellement distincts en un coup d'œil (couleur du ring ou du corps).
- [ ] Le village actif garde son halo doré pulsé sans régression (ticket 61).
- [ ] Les villages barbares restent identifiables (couleur/sprite actuel préservés).
- [ ] La distinction tient à zoom min et zoom max.
- [ ] QA IG 2 comptes : compte A multi-village + compte B avec villages proches → A distingue ses villages des villages de B sans cliquer ; B fait de même.
- [ ] Aucune ressource Pixi en leak (Graphics/textures réutilisés).
- [ ] `yarn static-check` vert.

## Points d'attention

- **Cohérence palette design system** : ne pas inventer une couleur ad-hoc — proposer 2-3 candidats en QA et valider avec le user. La palette `kingdom` / `game.*` (`tailwind.config`) peut servir de base si une teinte existe déjà.
- **Daltonisme** : éviter rouge/vert pur. Combiner une différence luminance + teinte pour rester lisible.
- **Halo actif vs ring étranger** : si la couleur étrangère est saturée, vérifier qu'elle ne « bat » pas visuellement le halo doré du village actif. Le halo doit rester le marqueur dominant à l'écran.
- **Cohérence minimap** : la minimap fait déjà la différence côté data (`isMine` branche dédiée), mais utilise une couleur `KIND_COLOR.PLAYER_VILLAGE` à harmoniser éventuellement avec la nouvelle teinte de la grande carte.

## Résolution

- `WorldMapScene.styleFor` sépare les villages du joueur (`isMine`) des villages joueurs étrangers (`PLAYER_VILLAGE && !isMine`).
- Les villages joueurs étrangers utilisent une palette bleue acier dédiée (`0x5a7ba8` / `0xb8d4f0`) avec tint du sprite et ring plus visible.
- Les villages du joueur gardent la palette dorée existante ; le village actif garde le halo doré pulsé du ticket 61.
- Les villages barbares restent sur leurs couleurs/sprites existants.
- La mini-carte aligne `PLAYER_VILLAGE` sur la même teinte bleue pour garder la cohérence carte/minimap.
