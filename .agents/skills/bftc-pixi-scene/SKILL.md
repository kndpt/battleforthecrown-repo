---
name: bftc-pixi-scene
description: Use when changing Battle for the Crown Pixi canvas code: battleforthecrown-pixi/src/pixi, PixiJS Application, scenes, SceneManager, viewport, canvas interaction, entity reconciliation, map/village rendering, animation tickers, sprites, Graphics, or Pixi performance.
---

# BFTC Pixi Scene

Use this for canvas code, not regular React HUD.

## Scene contract

Scenes are factories returning:

```ts
type PixiScene = {
  view: Container;
  enter?: (app: Application) => void;
  exit?: () => void;
  update?: (deltaMs: number) => void;
};
```

`SceneManager` owns stage add/remove, ticker wiring, and cleanup.

## Reconciliation invariant

For rendered entity lists, keep a `Map<id, Visual>` and reconcile:

1. add new visuals
2. update existing visuals without recreating containers
3. destroy removed visuals
4. clear selection if its id disappeared

Do not recreate an existing container; it loses listeners and state.

## React boundary

React mounts the canvas once. Pipe Zustand to Pixi with `store.subscribe()` outside React render. Entity movement should not rerender the canvas component.

## Viewport and interaction

- Use `pixi-viewport` with renderer events.
- Resize viewport on renderer resize.
- Use `eventMode: 'static'`, `cursor: 'pointer'`, `pointertap`, and `event.stopPropagation()` for nested interactive containers.

## Performance

- Prefer baked layer `Graphics` to many tiny graphics.
- Enable `sortableChildren` only when dynamic z-index is needed.
- Destroy temporary particles/sprites with children.

## Tests/QA

Do not test full Pixi scenes. Use `bftc-tests-policy` for helpers/data shapes/layout math. Use `bftc-qa` for visible canvas behavior.
