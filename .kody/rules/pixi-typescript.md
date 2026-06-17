---
title: "Pixi frontend — server-authoritative and API layer"
scope: "file"
path: ["battleforthecrown-pixi/src/**/*.ts"]
severity_min: "high"
languages: ["jsts"]
buckets: ["security", "performance"]
enabled: true
---

@kody-sync

Reference: @file:docs/architecture/decisions.md

## Instructions

**Server-authoritative (CRITICAL — bftc-refactor-pixi dim.1 + conventions.md)**

- The frontend NEVER computes authoritative state. Resource balances, troop counts, crown balances,
  combat results must come from the server (REST response or WebSocket event).
- Display interpolation (e.g., resources/hour smooth progress) is allowed but the interpolated value
  MUST NOT be written back to a store as authoritative truth.
- Flag mutations that update a Zustand store directly without going through
  REST → TanStack Query invalidation.

**TanStack Query (HIGH — dim.4)**

- Raw `fetch()` or `axios.*` outside `src/api/` is a violation.
- Mutations must invalidate relevant query keys in `onSuccess` or `onSettled`.
- Frequently-read queries missing `staleTime` or `gcTime` are a performance violation.
- `useEffect` used to trigger data fetching is a violation — use `enabled` conditions.

**Type debt (HIGH — dim.7)**

- API response shapes at the trust boundary must be validated with Zod.
- Types must be imported from `packages/shared/`, NOT from `battleforthecrown-backend/`.
- No untyped WebSocket message handlers.

**API layer (HIGH — dim.8)**

- All HTTP calls must go through `src/api/client.ts`. Flag raw `fetch()` elsewhere.
- Non-standard call sites that bypass `ApiClient.tryRefresh` are a 401-handling violation.

## Examples

### Bad example

```typescript
useGameStore.getState().setWood(currentWood + productionPerHour);
```

### Good example

```typescript
const { data } = useQuery({ queryKey: ['village', id], queryFn: () => api.village.get(id) });
const displayWood = interpolateResource(data.wood, data.woodRate);
```
