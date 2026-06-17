---
title: "Pixi frontend — React components, Zustand, optimistic UI"
scope: "file"
path: ["battleforthecrown-pixi/src/**/*.tsx"]
severity_min: "high"
languages: ["jsts"]
buckets: ["style-conventions", "error-handling"]
enabled: true
---

@kody-sync

Reference: @file:docs/architecture/decisions.md

## Instructions

**Server-authoritative (CRITICAL — dim.1)**

Same as `*.ts` above: no authoritative local computation, no direct store mutations bypassing REST/WS.

**Optimistic UI (HIGH — dim.2 + conventions.md)**

- Optimistic updates only when: (1) backend typically < 500ms, (2) rollback trivial, (3) WS re-syncs state.
- Every optimistic mutation MUST implement all three: `onMutate` (snapshot + local update),
  `onError` (rollback via context), `onSettled` (invalidate related keys).
- Flag any optimistic pattern missing one of the three handlers.

**Zustand stores (HIGH — dim.3)**

- Flag god stores managing more than one domain in the same store slice.
- Derived state must NOT be stored in the store — use selectors or view-models.
- Direct `.setState()` calls from outside the store module are a violation.
- Flag stores missing a reset action for logout/disconnect.
- Flag state duplicated between a Zustand store and a TanStack Query cache.

**Component design (HIGH — dim.5)**

- Business logic (derivations, rule checks, calculations) must not appear in JSX.
  It belongs in view-models, custom hooks, or stores.
- A component with > 2 clear responsibilities must be split.
- Prop drilling > 2 levels where a store or context is appropriate is a violation.
- Async panels and the Pixi canvas must be wrapped in error boundaries.

**TanStack Query**

- Raw `fetch()` or `axios.*` outside `src/api/` is a violation.
- Mutations must invalidate relevant query keys in `onSuccess` or `onSettled`.
- `useEffect` used to trigger data fetching is a violation — use `enabled` conditions.

## Examples

### Bad example

```tsx
const canAttack = troops > 0 && target.distance <= range;
return <Button disabled={!canAttack} onClick={() => mutate({ targetId })} />;
```

### Good example

```tsx
const { canAttack } = useAttackViewModel({ troops, target });
return (
  <ErrorBoundary>
    <Button disabled={!canAttack} onClick={() => attackMutation.mutate({ targetId })} />
  </ErrorBoundary>
);
```
