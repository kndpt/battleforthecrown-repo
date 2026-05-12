---
name: bftc-design-system-migration
description: Use when migrating BFTC HTML design-system prototypes into React/Tailwind components.
---

# BFTC Design System Migration

Use this when porting files from `battleforthecrown-design-system/project` into `battleforthecrown-pixi`.

Go straight to the migration. Do not create or maintain `tasks/todo.md` for this skill.

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

- Match visual output first: dimensions, colors, gradients, borders, radii, shadows, spacing, labels, and fixture content.
- A migrated component is not done when it only looks correct. It must be production-usable in the game immediately.
- Treat the HTML prototype as the source of truth. Do not infer a "better" game style from existing React components.
- Use React + Tailwind classes. Use arbitrary Tailwind values when the prototype has exact pixels or hex values.
- Do not copy prototype DOM structure when a cleaner React shape gives the same render.
- Keep components presentation-only unless integrating a real game workflow.
- Use `publicAsset()` for public assets.
- Add each migrated component to `/design-system` for human review before replacing production UI.
- First preview must reproduce the source HTML example with the same visible text, icons, and states. Add extra examples only after the faithful source case exists.
- Existing primitives are allowed only when they reproduce the prototype exactly. If a primitive changes shape, color, spacing, typography, or state styling, implement the local markup first and extract a primitive later.
- Do not preserve a previous React port when it conflicts with the source HTML. Rebaseline from `preview/*.html`.

## Production-Ready Component Contract

Every migrated component must be final enough to be imported by game screens without rewriting its API.

- Expose an exported named `Props` interface for every component.
- All visible content must come from props, not hardcoded fixture data: labels, quantities, names, icons, rows, costs, timers, badges, actions, and state text.
- Keep fixtures only in `DesignSystemPreview.tsx`.
- Expose all semantic visual states as typed props: `variant`, `tone`, `size`, `state`, `disabled`, `locked`, `urgent`, `insufficient`, `loading`, etc. Use the names that match the component domain.
- Components with user input or value changes must be controlled: `value` + `onChange`, plus bounds/options when relevant (`min`, `max`, `step`, `options`, `active`, `open`).
- Components with actions must expose callbacks with useful payloads: `onClick`, `onAction`, `onClose`, `onCancel`, `onConfirm`, `onSubmit`, `onRecruit(value)`, etc.
- Use real semantic controls for interactions: `button`, `form`, `input`, `input[type=range]`, not inert `div`s with click handlers.
- Disable or clamp invalid actions in the component when bounds are known.
- Keep visual defaults allowed, but never require the caller to know preview-only fixture values.
- If a component is only a static visual sample and cannot be made production-usable yet, remove it from the sas instead of presenting it as a migrated component.

## No Approximation Rule

- Never approximate prototype CSS values with nearest Tailwind shortcuts unless the value is exactly equivalent.
- Tailwind opacity shortcuts are allowed only when they exactly match the source value. Example: `bg-black/20` is allowed for `rgba(0,0,0,.2)`, but not for `rgba(0,0,0,.18)`.
- For non-standard opacity, border, shadow, filter, radius, or gradient values, use exact arbitrary values:
  - `bg-[rgba(0,0,0,.18)]`
  - `border-[rgba(0,0,0,.25)]`
  - `shadow-[inset_0_1px_0_rgba(255,255,255,.45)]`
- Do not invent visual highlights. If the prototype has no inset white highlight, do not add `inset_0_1px_0_rgba(...)`.
- Audit nested visual parts separately: outer container, thumbnail/icon box, close controls, buttons, borders, backgrounds, fills, shadows, filters, text shadows, and icon sizes.
- If two prototypes use the same source visual pattern, reuse the exact same React class string or extract a shared constant. Do not retranslate it independently.

## Fidelity workflow

1. Read and summarize the target HTML selectors and inline styles before coding.
2. Create a source-to-React style map for every relevant selector, including nested selectors.
   Example:
   - `.thumb` source: `background:rgba(0,0,0,.18); border:2px solid rgba(0,0,0,.25)`
   - React: `bg-[rgba(0,0,0,.18)] border-2 border-[rgba(0,0,0,.25)]`
3. Port the exact source example into `DesignSystemPreview.tsx`.
4. Run an approximation audit:
   - `rtk grep -n "black/[0-9]\\|white/[0-9]\\|opacity-[0-9][0-9]\\|border-black/[0-9]\\|bg-black/[0-9]" battleforthecrown-pixi/src/features/design-system`
   - Inspect every match against the source HTML. Replace non-exact shortcuts with arbitrary values.
5. Run a production API audit before moving on:
   - Are all fixture values props?
   - Are all states typed props?
   - Are value-changing widgets controlled with `value/onChange`?
   - Do all actions expose callbacks with useful payloads?
   - Does the preview demonstrate at least one real state update for interactive components?
6. Compare React output against the HTML prototype in the browser before moving to another component.
7. If the comparison or API audit fails, fix it before API cleanup or composition.

## Component API rules

- Every component must expose a named `Props` interface, exported when useful outside the file.
- No production candidate may hardcode fixture data such as names, quantities, labels, tabs, report rows, costs, or actions.
- Preview examples and fake data live in `DesignSystemPreview.tsx`, not inside reusable components.
- Prefer small typed data objects over positional tuples once data has semantic meaning.
- Components may provide visual defaults for variants, sizes, and optional labels, but content must come from props.
- Composite components may reuse existing primitives only after fidelity is proven. Example: use `BftcButton` for actions, `CostPill` for costs, `Timer` for durations, `PanelSurface` for parchment shells only if their render matches the prototype.
- Interactive components must be genuinely usable: use real semantic controls (`button`, `input`, `input[type=range]`, etc.) and expose controlled props (`value`/`onChange`, `active`/`onChange`, `open`/`onClose`) where state changes.
- Event handlers are optional only for action side effects (`onClick`, `onClose`, `onAction`); value-changing widgets must expose an `onChange`-style prop and the preview must demonstrate it with React state.

## Verification

- Run `yarn workspace battleforthecrown-pixi type-check`.
- Run `yarn workspace battleforthecrown-pixi build` before handoff when routing or assets changed.
- For visible UI changes, start Vite and inspect `/design-system` in the browser.
