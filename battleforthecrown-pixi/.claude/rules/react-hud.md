# Conventions React HUD

Le HUD est tout ce qui n'est pas le canvas Pixi : login, sélection monde, header, panels, modales, navigation.

## Stack imposée

- **React 19** avec `react-router` v7 pour le routing.
- **Tailwind 3.4** pour le styling. Palette dans `tailwind.config.ts`.
- **Zustand** pour le state global persistant (auth, game, resources, crowns, ui, worldMap, expeditions).
- **TanStack Query v5** pour le cache REST + mutations.
- **socket.io-client** pour le temps réel via `gameSocket` singleton.
- **`zod`** pour la validation des formulaires côté front.
- **Pas de Redux**, pas de Recoil, pas de Jotai. Pas de `next/*` (ce n'est plus du Next).

## State

- Global persistant → **Zustand + persist middleware**. Voir `src/stores/`.
- Cache REST → **TanStack Query**. Voir `src/api/queries.ts`. Toujours typer `useQuery<T>` et `useMutation<TData, TError, TInput, TContext>`.
- Local au composant → `useState`. Si trois `useState` deviennent quatre, regarder si un `useReducer` ou un store serait plus clair.

## Data flow

```
Component → useMutation()
              ↓
          ApiClient.post()  →  POST /endpoint
              ↓                       ↓
          onSuccess          backend mutation + EventOutbox row
              ↓                       ↓
          invalidate           OutboxWorker (~1s) → WS event
              ↓                       ↓
          refetch               ws-bindings.ts → store update
              ↓                       ↓
          rerender             rerender (different path)
```

Les deux paths convergent : la même donnée arrive du REST (refetch) et du WS (binding). C'est volontaire — c'est ce qui rend l'UI tolérante à des reconnexions WS partielles.

## Optimistic UI

**Règle** : optimistic **obligatoire** pour toute mutation rapide (< 1s typique) avec feedback visuel direct (apparition d'une entry, badge, file). Pas optimistic pour les mutations rares ou à risque d'erreur élevé (rollback fréquent = clignotement UI).

Pour les mutations dont la latence est ressentie (upgrade bâtiment, train unité) :

```ts
useMutation({
  mutationFn: ...,
  onMutate: async (input) => {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, optimisticValue);
    return { previous };
  },
  onError: (_err, _input, context) => {
    if (context?.previous !== undefined) {
      queryClient.setQueryData(queryKey, context.previous);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  },
});
```

Ne jamais decrement les ressources en optimistic — laisser l'event WS `resources.changed` gérer la mise à jour autoritative.

## UI primitives

`src/ui/` (portées du legacy) : `Button`, `IconButton`, `Input`, `InputLabel`, `Card`, `Modal`, `Toast`, `Tooltip`, `Spinner`, `Slider`, `Panel`, `Badge`, `Avatar`, `Select`, `ResourceIcon`, `HeaderBar`, `ProgressBar`. Toutes typées strict.

Trois cas selon couplage et portée :

- **Stateless transverse** (pas de store/api, primitive design system) → `src/ui/<category>/`. Ex : `Button`, `HeaderBar`, `PlayerProfile`.
- **Stateful transverse** (lit store/api, partagé par plusieurs écrans) → `src/features/layout/`. Shell de l'app : header, navigation, toasts, overlays. Ex : `GameHeader`, `BottomNavigationBar`, `ToastStack`.
- **Stateful feature-specific** (un seul domaine consomme) → `src/features/<domaine>/`. Ex : `BuildingManagementPanel`, `UnitCard`.

## Path alias

`@/*` → `./src/*`. Préférer cet alias aux `../../`.

## Tests

- Helpers purs : tests systématiques (cn, interpolation, construction progress, expeditionMath, layout).
- Composants : tester ceux qui ont une logique non triviale (formulaires zod, optimistic). Skipper les composants 100% présentation.

## Lazy loading

Les routes lourdes (canvas Pixi) sont `React.lazy` :

```tsx
const GameScreen = lazy(() => import('@/features/game/GameScreen').then((m) => ({ default: m.GameScreen })));
```

Le HUD initial (auth/landing) reste eager pour un TTI rapide.
