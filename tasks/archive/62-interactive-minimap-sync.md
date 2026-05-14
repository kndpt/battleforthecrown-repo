# 62 — Mini-carte interactive : sync bidirectionnel avec la carte principale

**Sévérité** : 🟠 Moyen
**Statut** : ✅ Résolu
**Spec amont** : Aucune (pure UX/UI). Connexe : [`61-active-village-map-indicator.md`](./61-active-village-map-indicator.md) et [`runs/archive/021-feature-village-labels-navigation.md`](./runs/archive/021-feature-village-labels-navigation.md) (Phase 9 nav multi-village).

## Symptôme

La mini-carte (panneau top-right de la WorldMap, [`WorldMiniMap.tsx`](../battleforthecrown-pixi/src/features/world/WorldMiniMap.tsx)) est **purement décorative** :

- **Aucun pointer event** branché sur son `<canvas>` — impossible de cliquer/glisser dessus pour se déplacer.
- Le **viewbox caméra** affiché est figé sur le village du joueur : [`WorldMapScreen.tsx:187-188`](../battleforthecrown-pixi/src/features/world/WorldMapScreen.tsx) passe `cameraCenter={myVillage ?? center}` et `viewportTiles={{ width: 30, height: 30 }}` en dur. Le rectangle ne suit jamais la vraie caméra du `pixi-viewport`.

Conséquences : impossible de naviguer la map principale en pointant la mini-carte, et impossible de savoir où on est sur le monde quand on déplace la vue principale.

## Comportement attendu

Sync **bidirectionnel** :

1. **Drag/tap sur mini-carte → recentre la map principale** sur le tile pointé, en temps réel (suit le doigt).
2. **Pan/zoom sur la map principale → le viewbox de la mini-carte suit** la position et la taille réelles de la vue, en temps réel.

## Cause racine

- [`WorldMapScene.ts`](../battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts) utilise `pixi-viewport` (`.drag().pinch().wheel()`) — la map principale est déjà pannable — mais **aucun callback `onCameraChange` n'est exposé** dans `WorldMapHandle`.
- [`WorldMapCanvas.tsx`](../battleforthecrown-pixi/src/features/world/WorldMapCanvas.tsx) expose `WorldMapCanvasController` avec `centerOn` + `worldToScreen`, mais pas de souscription caméra.
- [`WorldMiniMap.tsx`](../battleforthecrown-pixi/src/features/world/WorldMiniMap.tsx) ne gère aucun pointer handler ; ses props `cameraCenter` et `viewportTiles` sont nourries en dur côté `WorldMapScreen`.

## Solution retenue

Architecture évidente, frontend pur, 4 fichiers :

- `WorldMapScene` émet la position/taille réelle de la caméra via un nouveau `onCameraChange(cb)`.
- `WorldMapCanvasController` relaye ce hook et conserve `centerOn` pour le drive depuis la mini-carte.
- `WorldMapScreen` détient l'état caméra et le passe à `WorldMiniMap`.
- `WorldMiniMap` ajoute les pointer handlers et convertit position canvas → coords tile, puis appelle `onRecenter` (qui finit sur `centerOn`).

## Scope recommandé

### Frontend Pixi

- [`battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts`](../battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts)
  - Étendre `WorldMapHandle` avec `onCameraChange(cb): () => void`.
  - Implémenter en écoutant `viewport.on('moved')` (event natif `pixi-viewport`).
  - Payload émis : `{ centerX_tile, centerY_tile, viewportWidth_tiles, viewportHeight_tiles }`.
    - `viewport.center` donne le centre en world px → diviser par `tileSize`.
    - `viewport.screenWorldWidth / screenWorldHeight` donne la zone visible en world px → diviser par `tileSize`.
  - Coalescer les notifications via `requestAnimationFrame` (1 émission max par frame).

- [`battleforthecrown-pixi/src/features/world/WorldMapCanvas.tsx`](../battleforthecrown-pixi/src/features/world/WorldMapCanvas.tsx)
  - Étendre `WorldMapCanvasController` : ajouter `onCameraChange(cb): () => void`.
  - Câbler `handle.onCameraChange` dans `onReady` et le relayer via le controller.

- [`battleforthecrown-pixi/src/features/world/WorldMapScreen.tsx`](../battleforthecrown-pixi/src/features/world/WorldMapScreen.tsx)
  - Détenir un state `camera = { center, viewportTiles }` (option : `useSyncExternalStore` pour limiter les re-renders ; sinon `useState` + souscription dans un `useEffect`).
  - Au mount, `canvasRef.current.onCameraChange(setCamera)` ; cleanup au démontage.
  - Remplacer les valeurs hardcodées lignes 187-188 par `cameraCenter={camera.center}` et `viewportTiles={camera.viewportTiles}`.
  - Initialiser `camera` avec `myVillage ?? { x: gridWidth/2, y: gridHeight/2 }` pour l'état pré-premier-event.
  - Passer `onRecenter={(x, y) => canvasRef.current?.centerOn(x, y)}` à `WorldMiniMap`.

- [`battleforthecrown-pixi/src/features/world/WorldMiniMap.tsx`](../battleforthecrown-pixi/src/features/world/WorldMiniMap.tsx)
  - Ajouter prop `onRecenter?: (tileX: number, tileY: number) => void`.
  - Brancher `onPointerDown` + `onPointerMove` (avec `setPointerCapture`) + `onPointerUp` (release) sur le `<canvas>`.
  - Conversion : `tileX = ((clientX - rect.left) / SIZE) * gridWidth`, idem Y (clamper dans `[0, gridWidth]`).
  - Pendant un drag actif, émettre `onRecenter` à chaque `pointermove`.
  - Cursor : `cursor-grab` au repos, `cursor-grabbing` pendant le drag (classes Tailwind sur le canvas).

### Tests

- Pas de test unitaire Pixi (rendu canvas).
- Optionnel : extraire la conversion canvas-px → tile en helper pur pour un test Vitest si jugé utile.

### Docs

- Aucun changement de doc gameplay/architecture nécessaire (purement UX).

## Critères de succès

- [ ] Drag/swipe sur la mini-carte recentre la map principale **en temps réel sous le doigt** (pas seulement au release).
- [ ] Tap simple sur la mini-carte recentre la map sur le tile pointé.
- [ ] Drag, pinch ou wheel sur la map principale déplace le viewbox blanc de la mini-carte avec ≤ 1 frame de retard visible.
- [ ] La **taille** du viewbox reflète la zone visible réelle (zoom in → viewbox plus petit, zoom out → plus grand).
- [ ] Au mount, viewbox initial = vraie position de la caméra (`initialCenter`), pas la valeur statique `myVillage` actuelle.
- [ ] Pan continu sur la map principale reste **fluide à 60 fps** — pas de re-render React excessif (coalescing rAF en place).
- [ ] Cleanup : `onCameraChange` désabonné au démontage de la scène, aucun leak ticker / listener.

## Points d'attention

- **Source de vérité** : la caméra reste portée par `pixi-viewport`. Côté React, on **écoute** ; on ne pilote impérativement que via `centerOn` (déclenché par tap/drag mini-carte).
- **Boucle infinie potentielle** : `centerOn` programmatique émet `viewport.on('moved')` → re-render mini-carte → ne **pas** ré-émettre `onRecenter` depuis cette mise à jour. Le pointer handler du minimap ne réagit qu'aux events utilisateurs (`pointermove` actif), pas aux changements de props → naturellement OK.
- **Mobile/touch** : `pointerdown` + `setPointerCapture` indispensable pour que le drag survive à un doigt qui sort du canvas mini-carte.
- **Throttle** : `viewport.on('moved')` peut fire 60×/s pendant un pan. Coalescer en rAF avant `setState` React, sinon `WorldMapScreen` re-render chaque frame.
- **Compat ticket 61** : même fichiers touchés. Si exécuté après 61 (halo doré), aucun conflit attendu — le halo est dans la scène Pixi, indépendant de la mini-carte.
