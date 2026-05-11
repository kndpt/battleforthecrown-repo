---
name: bftc-react-hud
description: Use for BFTC React HUD/features, Zustand stores, TanStack Query, DTO/Zod forms, panels, or optimistic UI.
---

# BFTC React HUD

Use this for the React shell around the Pixi canvas.

## Stack defaults

- React 19, `react-router` v7, Tailwind 3.4.
- Zustand for persistent global state; TanStack Query v5 for REST cache.
- `socket.io-client` singleton `gameSocket`.
- Zod schemas from `@battleforthecrown/shared` for forms.
- No Redux, Recoil, Jotai, `next/*`, styled-components, or CSS modules.

## Data flow

REST mutation and WS events are separate paths that converge:

`useMutation → ApiClient → backend mutation + EventOutbox → invalidate/refetch`
and
`OutboxWorker → Socket.IO → ws-bindings.ts → store update`.

Keep backend authoritative. Never decrement resources optimistically; let WS/REST resync.

## Forms

Use shared Zod schema + `useZodForm`. Keep API error state separate from field validation. Client-only confirmations may extend the shared schema locally; do not add fields to shared if never sent to API.

## UI placement

- `src/ui/`: stateless primitives only; no imports from `@/stores`, `@/api`, or `@/features`.
- `src/features/layout/`: stateful shared app shell, nav, toasts, overlays.
- `src/features/<domain>/`: stateful domain UI.

## Optimistic UI

Use only when rollback is cheap. Pattern: cancel queries, snapshot previous, update cache, rollback in `onError`, invalidate in `onSettled`.

## QA/tests

For tests, use `bftc-tests-policy`. Test helpers, Zod forms, WS mappings, stores, and non-trivial rollback logic. Skip presentation-only components.

Use `bftc-qa` for visible game/HUD checklist.
