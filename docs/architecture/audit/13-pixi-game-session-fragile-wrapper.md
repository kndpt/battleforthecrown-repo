# 13 — `GameSession` wrapper aux responsabilités dispersées

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-pixi`
**Tags** : architecture, lifecycle, app-shell

## Symptôme

Le composant `GameSession.tsx` (137 lignes) cumule plusieurs responsabilités hétérogènes — connexion WebSocket, branchement des bindings d'events, seeding des stores Zustand depuis les queries REST, sync expéditions. Cela fonctionne, mais le pattern est implicite : si un écran protégé n'est pas wrappé par `GameSession`, plusieurs fonctionnalités tombent silencieusement.

## Localisation

- `src/features/game/GameSession.tsx`
  - Lignes 19-65 — connexion / déconnexion WebSocket.
  - Lignes 46-49 — `bindServerEvents({ queryClient })` (devrait être global, pas par session).
  - Lignes 52-80 — seed `useResourcesStore` / `useCrownsStore` depuis les queries REST initiales.
  - Lignes 87-100 — seed `useWorldMapStore` avec les villages du joueur.
  - Lignes 105-133 — sync expeditions query → store.
- `src/App.tsx` lignes 69-84 — `GameGuard`, `WorldMapGuard`, etc. qui wrappent les écrans.

## Détail technique

`GameSession` fait essentiellement le rôle d'**app shell** pour l'expérience joueur authentifié et "jouant". Mais il est rangé en `features/game/`, ce qui suggère qu'il est spécifique à un écran.

Pourquoi c'est fragile :
1. Le branchement WS-bindings (`bindServerEvents`) est lié au cycle de vie de `GameSession`. Si on ouvre un nouvel écran qui ne passe pas par GameSession (ex : page paramètres standalone), les events WS ne sont pas captés → état frontend dérive.
2. Le seeding initial des stores fait une demi-douzaine de queries en parallèle — si l'une échoue silencieusement, l'écran s'affiche avec des données partielles.
3. Les `useEffect` se déclenchent en cascade sur les dépendances (`worldId`, `userId`, `villageId`) — risque de re-seeds multiples sur un changement de contexte.

## Impact

- **Pattern implicite** : tout dev qui ajoute un écran protégé doit savoir qu'il doit le wrapper dans `GameSession`. Pas de garde au compile-time.
- **Difficile à tester** : un test d'intégration d'un écran isolé doit reconstituer manuellement tous les seeds.
- **Cycle de vie WS opaque** : `bindServerEvents` peut être appelé plusieurs fois si `GameSession` se monte/démonte (à vérifier).
- **Couplage** : changement dans une query REST se répercute dans `GameSession` qui doit re-seed différemment.

## Contexte

Le wrapper a probablement été ajouté en réponse à un besoin concret (une fois la WS branchée pour un écran, on n'a pas voulu la débrancher en navigant). Pas de pattern d'app-shell formalisé en amont.

## Pistes à explorer

- **App shell explicite** : promote `GameSession` vers `src/app/AuthenticatedShell.tsx` (ou similaire), wrap au niveau Router (toutes les routes protégées).
- **Découper les responsabilités** :
  - `WebSocketProvider` — connect/disconnect, bind events, expose status.
  - `GameContextSeeder` — seed stores depuis queries REST initiales.
  - `ExpeditionsSync` — sync expeditions store ↔ query.
  - Chaque sous-composant a une responsabilité unique.
- **Hook custom** : `useGameSession()` si on veut garder un point d'entrée unique mais déclaratif.
- **Garde au compile-time** : type `ProtectedRoute` qui exige le wrapping.
- **Tests** : test d'intégration vérifiant que la WS reste connectée à travers les navigations entre écrans protégés.

## Tickets liés

- [02 — Events WS non bindés](./02-ws-events-not-bound.md) — relié : si bindings sont incomplets, le `GameSession` actuel ne change rien.
- [12 — Composants transverses mal placés](./12-pixi-transverse-components-misplaced.md) — même question : où vit la "shell" de l'app.

## Dimensions à valider en sortie

- L'app shell est nommée et positionnée explicitement (par exemple, un wrapper au niveau Router).
- Les responsabilités sont découpées (WS / seeding / sync) en composants/hooks dédiés.
- Aucun écran protégé ne peut "oublier" l'app shell (garde au compile-time ou test d'intégration).
- `bindServerEvents` est appelé au plus une fois par session.
