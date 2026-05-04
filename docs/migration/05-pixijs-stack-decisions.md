# 05 — Décisions stack PixiJS

> Toutes les décisions précises dans l'écosystème Pixi. À valider avant Phase 4 (le code Pixi commence là).

## PixiJS v8 — modules à utiliser

### Imports modulaires

PixiJS v8 supporte le tree-shaking avec des sous-imports, mais le bundle global `pixi.js` reste raisonnable (~80 KB gzippé). On part sur `import { Application, Container, Sprite, ... } from 'pixi.js'` standard.

### Renderer

- **Auto-detection WebGPU → WebGL** : `new Application().init({ preference: 'webgpu' })` (fallback automatique).
- **Anti-aliasing** : `antialias: true` pour les sprites, MSAA léger.
- **Resolution** : `resolution: window.devicePixelRatio` pour Retina.
- **Resize** : `resizeTo: window` (Pixi gère le resize tout seul).
- **Background** : `backgroundAlpha: 0` (le HUD React fournit éventuellement un fond avec dégradé via Tailwind).

```ts
const app = new Application();
await app.init({
  resizeTo: window,
  preference: 'webgpu',
  antialias: true,
  resolution: window.devicePixelRatio,
  autoDensity: true,
  backgroundAlpha: 0,
});
document.querySelector('#pixi-canvas')!.appendChild(app.canvas);
```

### Ticker

- Un seul ticker `app.ticker` géré par Pixi. Les scenes s'y abonnent via `ticker.add(this.update.bind(this))`.
- Pour les animations time-based (expéditions), utiliser `Date.now()` plutôt que `delta` du ticker — l'animation doit être consistante avec le timestamp serveur.

### Devicepixelratio et perf mobile

- Sur mobile, `devicePixelRatio` peut être 3 → tripler les pixels = -50% perf. Solution : capper à 2 (`Math.min(window.devicePixelRatio, 2)`).
- Tester sur Pixel 6 (Phase 7).

---

## pixi-viewport (zoom/pan/drag)

Version **v6.x** (compatible Pixi v8). API :

```ts
import { Viewport } from 'pixi-viewport';

const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldWidth: gridWidth * tileSize,
  worldHeight: gridHeight * tileSize,
  events: app.renderer.events,
});
viewport
  .drag()
  .pinch()
  .wheel()
  .decelerate({ friction: 0.92 })
  .clamp({ direction: 'all' })
  .clampZoom({ minScale: 0.1, maxScale: 4 });

app.stage.addChild(viewport);
```

- `viewport.follow(sprite)` pour suivre une expédition (option Phase 6).
- `viewport.snap(x, y)` pour centrer sur un village au clic minimap.
- `viewport.toLocal(globalPoint)` pour les hit-tests custom.

---

## Asset pipeline : Pixi Assets API

### Manifest

```ts
// src/pixi/assets/manifest.ts
import type { AssetsManifest } from 'pixi.js';

export const manifest: AssetsManifest = {
  bundles: [
    {
      name: 'boot',
      assets: [
        { alias: 'logo', src: '/assets/ui/logo.webp' },
        { alias: 'spinner', src: '/assets/ui/spinner.webp' },
      ],
    },
    {
      name: 'world-map',
      assets: [
        { alias: 'tiles-atlas', src: '/assets/tiles/atlas.json' },
        { alias: 'villages-atlas', src: '/assets/villages/atlas.json' },
        { alias: 'tile-grass', src: '/assets/tiles/grass.webp' },
        { alias: 'tile-forest', src: '/assets/tiles/forest.webp' },
        { alias: 'village-player', src: '/assets/villages/player.webp' },
        { alias: 'village-barbarian', src: '/assets/villages/barbarian.webp' },
      ],
    },
    {
      name: 'village',
      assets: [
        { alias: 'building-castle', src: '/assets/buildings/castle.webp' },
        { alias: 'building-wood', src: '/assets/buildings/wood.webp' },
        // ... 1 par BuildingType
      ],
    },
  ],
};

await Assets.init({ manifest });
```

### Bundles lazy

- `boot` chargé au démarrage (logo + spinner).
- `world-map` chargé au montage de la `WorldMapScene`.
- `village` chargé au montage de la `VillageScene`.
- Cleanup : `Assets.unloadBundle('village')` quand on quitte la scene si on est court en mémoire (sur mobile).

### Format d'assets

- **WebP** par défaut (compression bien meilleure que PNG, support universel hors IE).
- **JSON sprite atlas** (TexturePacker, Free Texture Packer) pour grouper les sprites d'une scene en une seule texture.
- Pas de SVG (lourd à parser, on est en WebGL).

---

## ECS ou pas ECS

**Décision : pas d'ECS.**

Le jeu n'est pas assez complexe en termes d'entités runtime (pas de simulation physique, pas d'IA en temps réel — tout est calculé serveur). Un ECS apporte de la complexité sans bénéfice à cette échelle.

**Pattern adopté** : `Container` Pixi par entité logique, état dans Zustand, scene comme « réconciliateur ».

```ts
// pseudo-code
class WorldMapScene extends Container {
  private markers = new Map<string, VillageMarker>();

  init() {
    this.unsub = useWorldEntitiesStore.subscribe(
      (s) => s.entities,
      (entities) => this.reconcile(entities),
    );
  }

  private reconcile(entities: Map<string, WorldEntity>) {
    // Ajouter ce qui manque
    for (const [id, e] of entities) {
      if (!this.markers.has(id)) {
        const marker = new VillageMarker(e);
        this.markers.set(id, marker);
        this.viewport.addChild(marker);
      } else {
        this.markers.get(id)!.update(e);
      }
    }
    // Retirer ce qui n'existe plus
    for (const [id, marker] of this.markers) {
      if (!entities.has(id)) {
        marker.destroy();
        this.markers.delete(id);
      }
    }
  }

  destroy() {
    this.unsub();
    super.destroy({ children: true });
  }
}
```

**Si plus tard** la complexité explose (animations procédurales, simulation locale) → introduire `bitecs` ou `koota`. Pas avant.

---

## Math libraries

Pixi v8 expose `Point`, `Rectangle`, `Matrix` natifs — suffisant.

- Si on a besoin de noise pour de la génération procédurale visuelle (vagues, particules) : `simplex-noise` (1 KB).
- Pas de gl-matrix, pas de tweak.

---

## Animations / Tweens

**Décision : pas de lib externe initialement.**

Pixi expose un `ticker`, on écrit nos propres easings (`easeOutQuad`, `easeInOutCubic`) — 30 lignes max.

Si on a besoin de tweens complexes (chaînage, séquences) → ajouter `motion` (anciennement framer-motion, support canvas) ou `gsap` (free tier suffit).

À évaluer en Phase 6 quand on fait les expéditions animées.

---

## Sound

**Décision : reporter à post-Phase 7.**

Le son ne fait pas partie du critère de succès. Quand on s'y mettra : `@pixi/sound` (intégré à l'écosystème, charge via Assets API).

---

## Filters et effets visuels

Pixi v8 offre :

- `BlurFilter`, `ColorMatrixFilter`, `NoiseFilter`, `DisplacementFilter` (natif).
- `pixi-filters` package pour Glow, Outline, Shockwave, etc.

Usage prévu (Phase 5-6) :
- **Glow** sur le village sélectionné.
- **Outline** sur les villages survolés.
- **Shockwave** lors d'une attaque résolue (au point d'impact sur la carte).

---

## Texte

`Text` natif de Pixi (BitmapText pour de gros volumes).

- Pour les labels de villages sur la carte : `Text` standard est OK (10-100 instances).
- Si on dépasse 1000 labels visibles → passer en `BitmapText` avec une font BMFont précompilée.

---

## Debug overlay (remplace AdminPanel)

`src/pixi/debug/DebugOverlay.ts` :
- Toggle au clavier `~` (tilde).
- Affiche FPS, draw calls, nombre d'entités sur la scene active, dernier event WS reçu.
- Boutons pour switcher de scene rapidement.
- Boutons pour injecter des entités factices (stress test).

Lib utile : `pixi-stats` (panneau FPS prêt à l'emploi).

---

## Dependencies finales (résumé Phase 0)

```jsonc
{
  "dependencies": {
    "@battleforthecrown/shared": "0.1.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-query-devtools": "^5.0.0",
    "class-variance-authority": "^0.7.0",
    "jwt-decode": "^4.0.0",
    "lucide-react": "^0.544.0",
    "pixi-viewport": "^6.0.0",
    "pixi.js": "^8.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "socket.io-client": "^4.8.0",
    "zod": "^3.0.0",
    "zustand": "^4.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "@vitest/ui": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "jsdom": "^27.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.7.0",
    "typescript-eslint": "^8.0.0",
    "vite": "^5.0.0",
    "vitest": "^3.0.0"
  }
}
```

À Phase 5-6 (animations / particules) ou Phase 7 (polish), ajouter au cas par cas :
- `@pixi/particle-emitter` (Phase 5 : poussière construction, Phase 6 : effets combat) **— décidé**
- `motion` ou `gsap` (animations tweenées d'expéditions)
- `pixi-filters` (glow, outline, shockwave)
- `pixi-stats` (debug FPS)
- `@pixi/sound` (audio, post-migration)

---

## Conventions de code Pixi

- **Toute Container hérite et expose `destroy()`** : on libère les listeners Zustand et les enfants Pixi systématiquement.
- **Pas de `setInterval` dans les scenes** : utiliser `app.ticker.add()` qui se nettoie automatiquement à la destruction de la scene.
- **Pas de variables globales** : tout passe par stores Zustand ou par un bus d'événements interne minimal.
- **Pas de référence circulaire** : la scene référence le store, jamais l'inverse.
- **Tests** : tester les fonctions pures (math, hit-test, easings). Le rendu Pixi n'est pas testé unitairement (test E2E Playwright en Phase 7 si besoin).

---

## Décisions tranchées

### Vue village : top-down 2D (style Kingsage / Tribal Wars), pas de 3D

- **Pas de 3D**, jamais. Référence visuelle : Kingsage, Tribal Wars, Travian.
- **Top-down 2D** plutôt qu'isométrique : plus simple à animer, plus simple à composer (assets faciles à trouver/produire), parfait sur mobile portrait.
- **Mobile portrait** comme orientation principale : la VillageScene est conçue dès le départ pour un viewport vertical (les bâtiments et le HUD se placent en conséquence).
- **Camera zoom/dézoom + pan** dans la VillageScene aussi : pas une grille fixe figée. On utilise `pixi-viewport` pour la VillageScene comme pour la WorldMapScene, avec des bounds plus serrés (taille du village, pas du monde) et un range de zoom adapté (`minScale: 0.5`, `maxScale: 2.5` à ajuster).
- **Conséquence sur l'arborescence** : `VillageScene` instancie son propre `Viewport`. Voir [02-target-architecture.md](./02-target-architecture.md) (la VillageScene avait été décrite « sans viewport », c'est corrigé).

### Mini-map : PixiJS, pas SVG

- L'objectif est un **gros terrain de jeu modulable** où on ajoutera plein de features (overlays alliances, brouillard de guerre, indicateurs d'attaques entrantes, zones contestées…).
- SVG plafonne autour de quelques centaines de nodes interactifs avant de ramer.
- On utilise un **second `Application` Pixi en miniature** OU un `RenderTexture` downscalée mise à jour 1×/seconde depuis la WorldMapScene principale.
- La mini-map vit dans un coin du HUD (overlay React qui héberge un `<canvas>` Pixi), on peut cliquer dessus pour téléporter le viewport principal.

### Particules : OUI, dès Phase 6

- Lib : **`@pixi/particle-emitter`** (officielle de l'écosystème Pixi, MIT, ~10 KB). Compatible Pixi v8.
- Effets prévus pour Phase 6 :
  - **Poussière** sur le chemin d'une expédition (sprite armée laisse une traînée).
  - **Étincelles / flash** au point d'impact d'un combat résolu.
  - **Fumée** sur un village conquis ou pillé.
  - **Particules dorées** sur un retour victorieux avec loot.
- Effets pour Phase 5 (village) :
  - **Poussière** sur les chantiers en construction.
  - **Lumière** discrète sur le bâtiment sélectionné (en plus du `Glow`).
- Les configs d'émetteurs sont stockées dans `src/pixi/effects/emitters/*.json` (éditables, même par un game designer).
