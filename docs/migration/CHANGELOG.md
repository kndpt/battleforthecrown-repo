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

