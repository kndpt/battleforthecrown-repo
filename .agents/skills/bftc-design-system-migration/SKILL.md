---
name: bftc-design-system-migration
description: Use when migrating BFTC HTML design-system prototypes into React/Tailwind components.
---

# BFTC Design System Migration

Use this when porting files from `battleforthecrown-design-system/project` into `battleforthecrown-pixi`.

## Source order

1. Read the target `preview/*.html`.
2. Read `preview/_card.css`.
3. Read `colors_and_type.css`.
4. Follow asset paths under `project/assets/` and prefer existing copies in `battleforthecrown-pixi/public/assets/`.

## Placement

- Draft and validate new ports in `battleforthecrown-pixi/src/features/design-system/`.
- Keep preview-only compositions in `DesignSystemPreview.tsx`.
- Promote stable stateless primitives to `battleforthecrown-pixi/src/ui/`.
- Promote shared stateful shell components to `battleforthecrown-pixi/src/features/layout/`.

## Porting rules

- Match visual output first: dimensions, colors, gradients, borders, radii, shadows, spacing, and labels.
- Use React + Tailwind classes. Use arbitrary Tailwind values when the prototype has exact pixels or hex values.
- Do not copy prototype DOM structure when a cleaner React shape gives the same render.
- Keep components presentation-only unless integrating a real game workflow.
- Use `publicAsset()` for public assets.
- Add each migrated component to `/design-system` for human review before replacing production UI.

## Component API rules

- Every component must expose a named `Props` interface, exported when useful outside the file.
- No production candidate may hardcode fixture data such as names, quantities, labels, tabs, report rows, costs, or actions.
- Preview examples and fake data live in `DesignSystemPreview.tsx`, not inside reusable components.
- Prefer small typed data objects over positional tuples once data has semantic meaning.
- Components may provide visual defaults for variants, sizes, and optional labels, but content must come from props.
- Composite components must reuse existing primitives instead of duplicating their styles. Example: use `BftcButton` for actions, `CostPill` for costs, `Timer` for durations, `PanelSurface` for parchment shells.
- Interactive components must be genuinely usable: use real semantic controls (`button`, `input`, `input[type=range]`, etc.) and expose controlled props (`value`/`onChange`, `active`/`onChange`, `open`/`onClose`) where state changes.
- Event handlers are optional only for action side effects (`onClick`, `onClose`, `onAction`); value-changing widgets must expose an `onChange`-style prop and the preview must demonstrate it with React state.

## Verification

- Run `yarn workspace battleforthecrown-pixi type-check`.
- Run `yarn workspace battleforthecrown-pixi build` before handoff when routing or assets changed.
- For visible UI changes, start Vite and inspect `/design-system` in the browser.
