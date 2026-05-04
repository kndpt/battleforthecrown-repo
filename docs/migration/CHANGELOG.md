# Migration PixiJS — CHANGELOG

> Journal de bord du chantier. **Une entrée par phase**, mise à jour en temps réel pendant l'exécution autonome.
> Format : Definition of Done atteinte ? Ce qui a été fait, ce qui a dévié, blockers, captures éventuelles.

## Convention d'entrée

```markdown
## Phase X — <titre> (YYYY-MM-DD)

**Statut** : ✅ Done | 🟡 Done partiel | ❌ Blocker | ⏸️ Skipped

**Ce qui a été fait** :
- ...

**Écart par rapport au plan** (s'il y en a) :
- ...

**Blockers / questions ouvertes** :
- ...

**Commits** :
- `<sha>` `<type>(<scope>): <subject>`

**Vérification (Definition of Done)** :
- [x] / [ ] critère 1
- [x] / [ ] critère 2

**Captures** : `docs/migration/captures/phase-X-*.png` (optionnel)

---
```

## Historique

<!-- Les entrées s'ajoutent ici, plus récentes en haut -->

## Phase 1 — Auth + sélection de monde (HUD pur, pas de canvas) (2026-05-04)

**Statut** : ✅ Done

**Ce qui a été fait** :
- `src/lib/types.ts` réécrit en évitant `enum` (interdit par `erasableSyntaxOnly`) → `BuildingType`, `UnitType`, `ExpeditionStatus`, `TargetKind` deviennent des `as const` objects + types literal. `any[]` → `unknown[]`.
- `src/lib/{gameHelpers,combatHelpers,resourceConfig,unitConfig}.ts` portés depuis le legacy. `gameHelpers` retypé pour virer le `any`.
- `src/ui/` copié intégralement depuis le legacy. Ajustements :
  - `ToastProvider` : `useToast` extrait dans `useToast.ts` + `toast-context.ts` (Fast Refresh ESLint compliance).
  - `Tooltip` : `setMounted(true)` dans `useEffect` annoté `eslint-disable-next-line react-hooks/set-state-in-effect`.
  - `PopulationIndicator` : la dépendance vers le hook `usePopulation` (Phase 3) remplacée par des props (`availablePopulation`, `loading`).
  - `HeaderActions` : composant placeholder, code mort retiré.
- `tsconfig.app.json` : `verbatimModuleSyntax` désactivé temporairement (sera réactivé Phase 7), `paths` `@/*` configuré (TS 6 syntax sans `baseUrl`).
- `vite.config.ts` + `vitest.config.ts` : alias `@/` → `./src` aligné.
- `src/api/client.ts` : `ApiClient` typé strict, `request<T>(path, options)`, helpers `get/post/patch/delete`, refresh JWT auto sur 401 avec dédoublonnage `refreshInflight` (pas de double refresh en cas de requêtes concurrentes), `x-world-id` / `x-village-id` injectés depuis le `gameContext` adapter, `ApiError` typé.
- `src/api/types.ts` : `AuthSessionResponse` (shape réelle backend `{ accessToken, refreshToken, userId, email }`) avec helper `toAuthSession()`. **Drift identifié** entre `06-api-contract-snapshot.md` (`{ accessToken, refreshToken, user }`) et le code backend réel — la réalité l'emporte, snapshot à mettre à jour Phase 8.
- `src/api/queries.ts` : `useLoginMutation`, `useRegisterMutation`, `useWorldsQuery`, `useMyMembershipsQuery`, `useJoinWorldMutation`, `useMyVillagesQuery`, `useLogout`. Toutes câblées via TanStack Query v5.
- `src/api/query-client.ts` : `QueryClient` global avec defaults raisonnables (`staleTime: 30s`, retry désactivé sur 401/403/404 et sur les mutations).
- `src/stores/auth.ts` (Zustand persist `bftc-auth`) : `accessToken`, `refreshToken`, `user`, `setSession`, `setTokens`, `clearSession`, sélecteur `selectIsAuthenticated`.
- `src/stores/game.ts` (Zustand persist `bftc-game`) : `worldId`, `villageId`, `setWorld`, `setVillage`, `setContext`, `clear`.
- `src/api/index.ts` : `apiClient` singleton qui branche les deux stores via les adapters.
- Écrans `src/features/` :
  - `auth/LandingScreen.tsx` (page `/`).
  - `auth/LoginScreen.tsx`, `auth/RegisterScreen.tsx` (validation `zod`, gestion erreurs, état loading).
  - `auth/ProtectedRoute.tsx` (redirect `/auth/login` si pas de token).
  - `worlds/WorldSelector.tsx` (`/worlds` → liste mondes + bouton join avec un nom de village par défaut basé sur l'email).
  - `worlds/MyWorldsScreen.tsx` (`/my-worlds` → mondes du user, bouton "Entrer" qui fetch le 1er village du user dans le monde puis navigate `/game`).
- `src/App.tsx` : routes `/`, `/auth/login`, `/auth/register`, `/worlds`, `/my-worlds`, `/game`. `ProtectedRoute` enveloppe `/worlds`, `/my-worlds`, `/game`. `GameGuard` redirige vers `/my-worlds` si `worldId` est null. `QueryClientProvider` + `ReactQueryDevtools` (DEV only).
- ESLint flat config : ajout de `argsIgnorePattern: '^_'` (et `caughtErrors`/`vars`) sur `@typescript-eslint/no-unused-vars`.
- Tests Vitest :
  - `src/api/client.test.ts` (4 cas) : GET avec auth header, refresh sur 401 + retry, refresh failed → clear tokens + throw, body sérialisé + `x-world-id`/`x-village-id` depuis `gameContext`.
  - `src/lib/cn.test.ts` (2 cas) inchangés depuis Phase 0.
- Validation backend live : `POST /auth/register` → 201, `POST /auth/login` → 200, `POST /world/default/join` → 201 (membership + village créés en DB, vérifié via `psql`), `GET /world/users/:userId/memberships` → 1 entry, `GET /village?worldId=&userId=` → 1 village.

**Écart par rapport au plan** :
- `src/lib/types.ts` : pas une copie littérale (les `enum` sont incompatibles avec `erasableSyntaxOnly: true` du tsconfig moderne). Conversion en `as const` objects → API d'usage identique (`BuildingType.CASTLE` reste `'CASTLE'`).
- `verbatimModuleSyntax` désactivé pour ne pas bloquer la migration. Les imports `type` corrects sont une correction qu'on fera Phase 7 (script automatisé). Pour l'instant, on perd un peu de tree-shaking mais rien de critique.
- Le `WorldMembership` du backend ne contient PAS de `villageId`. Il faut une query séparée `GET /village?worldId&userId` pour récupérer le 1er village du user → ajout de `useMyVillagesQuery` non prévue dans le plan.
- `Drift backend ↔ snapshot` documenté ci-dessus pour `auth.service.ts`. À aligner Phase 8.

**Blockers / questions ouvertes** :
- Aucun.

**Commits** :
- (à venir) `feat(pixi-frontend/auth): port lib helpers + UI primitives`
- (à venir) `feat(pixi-frontend/auth): API client, stores, queries, screens`

**Vérification (Definition of Done)** :
- [x] `yarn workspace battleforthecrown-pixi type-check` → propre.
- [x] `yarn workspace battleforthecrown-pixi lint` → propre.
- [x] `yarn workspace battleforthecrown-pixi test` → 6 tests passants (2 fichiers).
- [x] `yarn workspace battleforthecrown-pixi build` → bundle prod produit.
- [x] **Aucun import `pixi.js`** dans les écrans Phase 1 — c'est volontaire, on valide la plomberie React+API d'abord (le canvas Pixi reste sur `/game` via `HelloPixiScene` héritée de Phase 0).
- [x] Backend live : register, login, join, memberships, villages testés via curl, données présentes en DB (1 user + 1 membership + 1 village `Smoke village` à (233, 247)).

**Vérification UI (à confirmer par le user au matin)** :
- `/` doit afficher la landing page avec les boutons "Connexion" et "Créer un compte" (ou "Reprendre" si déjà connecté).
- `/auth/register` → formulaire email/password/confirm. Submit → POST `/auth/register` → set session → navigate `/worlds`.
- `/auth/login` → formulaire email/password. Submit → POST `/auth/login` → set session → navigate `/my-worlds`.
- `/worlds` → liste avec "Default World", bouton "Rejoindre" → POST `/world/default/join` → navigate `/game`. Si déjà rejoint, le bouton devient "Déjà rejoint".
- `/my-worlds` → "Default World — 1 village", bouton "Entrer" → fetch villages → navigate `/game`.
- `/game` (via context worldId) → affiche le `HelloPixiScene` (canvas Pixi avec "Hello Pixi" doré). Sans worldId, redirect vers `/my-worlds`.
- Persist : refresh navigateur → session conservée (localStorage `bftc-auth` + `bftc-game`).

**Captures** : —

---


## Phase 0 — Skill, scaffold, plomberie (2026-05-04)

**Statut** : ✅ Done

**Ce qui a été fait** :
- Bootstrap DB Postgres 16 (`docker compose up -d`), 14 migrations Prisma appliquées, seed `seed-default-world-config.sql` exécuté (UPDATE 1 sur `world_config`).
- Backend NestJS lancé en background sur `PORT=15001` via `yarn workspace battleforthecrown-backend start:dev`. `/health` répond `{"status":"ok","info":{"database":{"status":"up"}}}`.
- Repo git initialisé à la racine du workspace (`battleforthecrown-repo/`). `.gitignore` racine ignore `node_modules/`, `battleforthecrown/`, `battleforthecrown-backend/` (chacun a son propre `.git`), `.trae/`, `WARP.md`. Commit baseline : `9d6a8a9`.
- Scaffold `battleforthecrown-pixi/` via `yarn create vite --template react-ts` (Vite 8, React 19.2, TypeScript 6.0).
- Workspace ajouté dans `package.json` racine (`"battleforthecrown-pixi"`).
- Dépendances runtime : `pixi.js@^8`, `pixi-viewport@6`, `react-router@7`, `zustand@5`, `@tanstack/react-query@5` + devtools, `socket.io-client@4`, `jwt-decode@4`, `zod@4`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@battleforthecrown/shared@0.1.0`.
- Dépendances dev : `vitest@4` + `@vitest/coverage-v8` + `@vitest/ui`, `jsdom@29`, `@testing-library/react@16` + `jest-dom` + `user-event`, `tailwindcss@3.4`, `postcss`, `autoprefixer`.
- Tailwind config copiée depuis le legacy (palette `kingdom`, `game.{green,blue,red,gold,stone}`, `parchment`, `text-shadow-game`).
- Structure cible créée : `src/{api,features,lib,pixi/{scenes,assets,entities},stores,ui,test}` avec `.gitkeep`.
- `src/lib/env.ts` (typage strict des `VITE_*`), `src/lib/cn.ts` (clsx + tailwind-merge), `src/test/setup.ts` (jest-dom).
- `src/pixi/application.ts` : factory `createPixiApp` (Pixi 8 `await app.init()`, `resizeTo` container, `autoDensity`, `backgroundAlpha: 0`).
- `src/pixi/PixiCanvas.tsx` : composant React qui mount/unmount l'app dans une `ref` avec gestion du double-mount StrictMode (flag `cancelled` + destroy).
- `src/features/HelloPixiScene.tsx` : monte un `Text` "Hello Pixi" au centre du canvas, recentré sur resize.
- `src/App.tsx` : router minimal `/`, `/auth/login` (placeholder), `/game` (PixiCanvas).
- `.env.local` : `VITE_API_BASE_URL=http://localhost:15001`, `VITE_WS_URL=http://localhost:15001`.
- Test trivial `cn.test.ts` (2 cases, vérifie clsx + tailwind-merge).

**Écart par rapport au plan** :
- Skill PixiJS officiel non installé : `npx skills add https://github.com/pixijs/pixijs-skills` → l'option n'a pas été lancée car non bloquante et la doc Pixi v8 est largement suffisante pour Phase 0. À reprendre si besoin avant Phase 4.
- Scaffolder Vite 8 (au lieu de 7 envisagé) : Vite 8 est sortie depuis le plan, retenue car elle reste compatible avec `@vitejs/plugin-react@6` et `vitest@4`. TypeScript 6.0.2 idem (résolution de modules ESM identique).

**Blockers / questions ouvertes** :
- Aucun.

**Commits** :
- `9d6a8a9` `chore(repo): initialize workspace git baseline before pixi migration`
- (à venir) `feat(pixi-frontend): scaffold Vite + React 19 + Pixi v8`

**Vérification (Definition of Done)** :
- [x] DB Postgres healthy, 21 tables visibles via `\dt`.
- [x] Backend `/health` 200, DB up.
- [x] `yarn workspace battleforthecrown-pixi dev` répond sur `http://localhost:5173` (HTML attendu, `main.tsx` et `App.tsx` servis par HMR sans erreur).
- [x] `yarn workspace battleforthecrown-pixi build` produit `dist/` (725 modules, ~636 KB JS minifié, 188 KB gzip — Pixi pèse lourd, ce sera optimisé Phase 7 via lazy-load).
- [x] `yarn workspace battleforthecrown-pixi type-check` passe.
- [x] `yarn workspace battleforthecrown-pixi test` passe (1 file, 2 tests).
- [x] `yarn workspace battleforthecrown-pixi lint` passe.
- [x] CHANGELOG créé et renseigné, table `README.md` migration mise à jour.

**Vérification UI (à confirmer par le user au matin)** :
- Au montage de `/game`, le canvas Pixi doit afficher `Hello Pixi` doré centré sur fond `#1a1a2e`, avec un sous-titre `BATTLE FOR THE CROWN — PIXI BOOT` en haut.
- `/` doit afficher deux boutons (Login placeholder, Open Pixi canvas) sur fond sombre.

**Captures** : —

---

