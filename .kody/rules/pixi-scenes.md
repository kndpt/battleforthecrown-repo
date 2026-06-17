---
title: "Pixi scenes — rendering architecture"
scope: "file"
path: ["battleforthecrown-pixi/src/pixi/**/*.ts"]
severity_min: "high"
languages: ["jsts"]
buckets: ["performance", "error-handling"]
enabled: true
---

@kody-sync

## Instructions

**Pixi scene architecture (HIGH — bftc-refactor-pixi dim.6 + bftc-pixi-scene)**

- Scenes must NOT mix rendering + input handling + game state. Each concern belongs in a dedicated class.
- Direct Zustand store reads inside Pixi tick loops (`app.ticker.add(...)`) are a violation.
  Pass snapshots to the tick callback.
- Asset loading inside `update()` or ticker callbacks is a violation. Load in the preload/init phase.
- Scene `destroy()` MUST clean up: remove all event listeners, stop tickers, release textures.
  Flag any `destroy()` that is empty or missing.

## Examples

### Bad example

```typescript
app.ticker.add(() => {
  const wood = useGameStore.getState().wood;
  label.text = String(wood);
  const texture = await Assets.load('icon.png');
});
```

### Good example

```typescript
app.ticker.add(() => {
  label.text = String(snapshot.wood);
});

destroy() {
  app.ticker.remove(this.onTick);
  this.removeAllListeners();
  this.label.destroy({ texture: true });
}
```
