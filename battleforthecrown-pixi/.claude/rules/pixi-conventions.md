# Conventions Pixi

## Initialisation

```ts
import { Application } from 'pixi.js';

const app = new Application();
await app.init({
  resizeTo: container,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
  backgroundAlpha: 0,
  preference: 'webgl',
});
container.appendChild(app.canvas);
```

Voir `src/pixi/application.ts` qui encapsule cette initialisation.

## Scenes

Une scène est une factory typée :

```ts
export interface PixiScene {
  view: Container;
  enter?: (app: Application) => void;
  exit?: () => void;
  update?: (deltaMs: number) => void;
}
```

Elle est enregistrée auprès du `SceneManager` (`src/pixi/scenes/SceneManager.ts`) qui gère :
- Add/remove sur `app.stage`.
- Branchement de `update` au `app.ticker` quand fourni.
- Cleanup propre (destroy children + textures) au remplacement.

## Reconciliation entités

Pour les scenes qui rendent une liste d'entités (WorldMap, VillageScene) :

1. La scène expose un handle avec une méthode `reconcile(entities[])`.
2. Le handle maintient une `Map<id, Visual>` interne.
3. À chaque appel `reconcile` : ajouter les nouveaux, mettre à jour les existants (sans recréer le container), détruire les disparus.
4. **Ne pas re-créer un Container existant** — préserver listeners et state interne.
5. Si une sélection référence un id disparu, la clear automatiquement.

## Subscribe sans React re-render

Pour piper un store Zustand vers une scène Pixi sans déclencher de re-render React :

```tsx
useEffect(() => {
  return useStore.subscribe((state, prev) => {
    if (state.entities !== prev.entities) {
      handle.reconcile(Object.values(state.entities));
    }
  });
}, []);
```

Le composant React monte le canvas et installe la subscription une fois ; tout l'update se fait en dehors de React.

## Viewport (pixi-viewport)

```ts
const viewport = new Viewport({
  screenWidth: app.screen.width,
  screenHeight: app.screen.height,
  worldWidth, worldHeight,
  events: app.renderer.events,
});

viewport
  .drag()
  .pinch()
  .wheel({ smooth: 4 })
  .decelerate({ friction: 0.92 })
  .clampZoom({ minScale: 0.5, maxScale: 2.5 })
  .clamp({ direction: 'all' });
```

Toujours appeler `viewport.resize(...)` dans le handler `resize` de `app.renderer`.

## Performance

- Préférer **un Graphics par layer baked** (background, grille) à des centaines de petits Graphics.
- Pour des milliers d'entités → `ParticleContainer` (à profiler — le run autonome n'a pas pu le tester).
- Activer `sortableChildren = true` uniquement quand on a besoin de zIndex dynamique.
- Détruire les particules / sprites éphémères avec `container.destroy({ children: true })`.

## Interactivité

- `eventMode: 'static'` sur les containers cliquables.
- `cursor: 'pointer'` pour le feedback visuel.
- `pointertap` (pas `click`) pour la cohérence touch/desktop.
- `event.stopPropagation()` quand un container imbriqué doit absorber l'event.

## Tests

- Les helpers purs (`expeditionMath`, `constructionProgress`, `villageLayout`) sont testés sans Pixi (vitest jsdom).
- Les scenes elles-mêmes ne sont pas testées unitaire — le coût/valeur n'est pas là. À la place, écrire des invariants sur les helpers et data shapes.
