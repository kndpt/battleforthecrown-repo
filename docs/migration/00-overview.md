# 00 — Vision & objectifs de la migration

## Le pitch

Battle for the Crown est un MMORTS médiéval (inspirations : **Kingsage, Travian, Tribal Wars**) — gestion de villages, ressources, armée, combats temps réel, conquête.

Aujourd'hui, le frontend est un **Next.js 15 + React 19 + Redux Toolkit + RTK Query + redux-persist + Tailwind**. Cette stack est solide pour des SPA orientées formulaires, mais elle est **mal alignée avec le cœur du jeu** :

- La **carte du monde** (`WorldMapCanvas.tsx`, 854 lignes de SVG/HTML) est rendue en DOM. Avec 500×500 tuiles cibles, le DOM s'effondre.
- La **vue village** (`VillageCanvas.tsx`, 17 lignes) est un placeholder « bientôt disponible ». Elle doit afficher une grille 10×10 de bâtiments animés, des particules, des feedbacks visuels riches.
- Le **HUD** (panels, modales, bottom sheets) est en React/Tailwind et fonctionne très bien. C'est le seul morceau qu'on garde.

## Objectif de la migration

> **Remplacer le rendu DOM/SVG des deux écrans canvas-heavy (carte monde + vue village) par PixiJS v8, et simplifier la stack frontend autour de cet axe.**

### Ce qu'on simplifie

- ❌ **Next.js** → ✅ **Vite** (pas de SSR, pas d'app router, pas de middleware = moins de magie, build instantané, dev server plus rapide).
- ❌ **Redux Toolkit + RTK Query + redux-persist** → ✅ **Zustand + TanStack Query** (équivalent fonctionnel, ~5x moins de code, pas de boilerplate de slices, persistance trivialement opt-in par store).
- ❌ **Rendu DOM/SVG dans `WorldMapCanvas`** → ✅ **PixiJS v8 + `pixi-viewport`**.
- ❌ **Placeholder `VillageCanvas`** → ✅ **PixiJS v8** (rendu isométrique 2D, possibilité de basculer en 3D Three.js plus tard si besoin).

### Ce qu'on garde

- ✅ **Backend NestJS** : aucun changement. Mêmes endpoints REST, même WebSocket Socket.IO, même schéma Prisma.
- ✅ **Package `@battleforthecrown/shared`** : types, coûts bâtiments, formules de combat, weights de power. Importé tel quel par la nouvelle app.
- ✅ **HUD React** : panels, modales, formulaires (login, register, train units, upgrade building), bottom navigation, toasts. La design system `src/ui/` est conservée et portée vers Vite quasiment sans changement.
- ✅ **Logique métier client** : `combatHelpers.ts`, `gameHelpers.ts`, `resourceConfig.ts`, `unitConfig.ts`, `navigation.ts` — code pur, recopié.
- ✅ **WebSocket service** : `wsService` singleton + event bus. Reconnecté à Zustand au lieu de Redux.

### Ce qu'on supprime (sans regret)

- `src/app/` (App Router Next.js)
- `src/app/store.ts` (Redux)
- `src/app/api.ts` (RTK Query → remplacé par TanStack Query)
- Tous les `*.slice.ts` dans `src/features/`
- `redux-persist`, `@reduxjs/toolkit`, `react-redux`
- `next`, `eslint-config-next`
- `tsconfig.tsbuildinfo` (226 KB, artefact)
- La route `/ui-test` (storybook maison à recréer proprement plus tard, hors scope)
- `AdminPanel` côté React (à reconstruire en debug overlay PixiJS minimal)

## Critères de succès

Cette migration est **terminée** quand, sur la nouvelle app PixiJS :

1. Un joueur peut **se connecter, choisir un monde, voir sa carte du monde** avec zoom/pan fluides à 60fps sur 500×500 tuiles. *(Phase 4)*
2. Un joueur peut **entrer dans son village**, voir ses bâtiments dessinés, cliquer dessus pour ouvrir le HUD d'upgrade. *(Phase 5)*
3. Un joueur peut **lancer une attaque** depuis la carte monde et voir l'expédition s'animer (chemin tracé, troupes en marche). *(Phase 6)*
4. **Tous les events WebSocket** (`building.completed`, `resources.changed`, `battle.resolved`, etc.) sont consommés et déclenchent le bon update visuel. *(Phase 4-6)*
5. Le **bundle de prod** est `< 500 KB gzippé` (hors assets) et le **TTI** est `< 2s` sur connexion 4G simulée. *(Phase 7)*
6. La nouvelle app **passe les mêmes tests Vitest** que l'ancienne pour les helpers métier (combatHelpers, gameHelpers). *(Continu)*
7. Un seul `package.json` au lieu d'un workspace côté front (le shared reste en workspace pour le backend). *(Phase 0)*
8. **La documentation Claude est consolidée** : un `CLAUDE.md` racine + un par workspace, des `.claude/rules/` path-scoped, plus aucun `WARP.md`/`AGENTS.md` géant/`docs-v2` fantôme. Un agent qui démarre à froid trouve tout ce qu'il faut sans qu'on le briefe. *(Phase 8)*

## Ce qu'on N'attend PAS

- ❌ Pas de portage 1:1 des écrans `/ui-test` (storybook).
- ❌ Pas de SEO ni SSR — c'est un jeu connecté, pas un site marketing.
- ❌ Pas de PWA / offline pour ce chantier (peut venir après).
- ❌ Pas de mobile natif (Capacitor/Tauri) — le canvas Pixi marchera sur mobile web, ça suffit.
- ❌ Pas de refonte gameplay : on reproduit l'UX existante, en mieux pour les écrans canvas.

## Estimation grossière

| Phase | Description | Effort indicatif |
|-------|-------------|------------------|
| 0 | Skill + scaffold Vite + structure dossiers | ½ jour |
| 1 | Auth + sélection de monde (HUD pur, sans canvas) | 1 jour |
| 2 | Layer client API (TanStack Query + WebSocket → Zustand) | 1-2 jours |
| 3 | Design system porté + HUD du village (sans rendu canvas) | 1-2 jours |
| 4 | **PixiJS world map** (la grosse pièce) | 3-5 jours |
| 5 | **PixiJS village view** (top-down 2D, zoom/pan, mobile portrait) | 2-3 jours |
| 6 | Animations expéditions + feedbacks combat + particules | 2-3 jours |
| 7 | Polish, perf, bundle, tests E2E, suppression du legacy | 2 jours |
| 8 | **Consolidation documentaire** (CLAUDE.md hiérarchique, refonte de la doc Claude/AGENTS/README) | 1-2 jours |
| Total | — | **~14-20 jours** |

(Ces durées supposent une montée en compétence progressive sur Pixi v8 ; le skill PixiJS aide à passer la courbe.)

## Décisions actées (2026-05-04)

1. ✅ **Vite** (pas Next.js CSR-only). Voir [04-risks-and-tradeoffs.md](./04-risks-and-tradeoffs.md#tradeoff-vite-vs-next).
2. ✅ **Zustand + TanStack Query** (pas Redux Toolkit + RTK Query). Voir [04](./04-risks-and-tradeoffs.md#tradeoff-zustand-vs-redux).
3. ✅ **Nouveau dossier `battleforthecrown-pixi/`** monté en parallèle de `battleforthecrown/` (qu'on supprime à la fin), pas de refactor in-place.
4. ✅ **Pixi v8** (WebGPU + fallback WebGL).

### Décisions liées (rendu canvas)

- ✅ **VillageScene = top-down 2D** (style Kingsage / Tribal Wars), pas isométrique, pas de 3D, mobile portrait, viewport zoom/pan.
- ✅ **Mini-map = PixiJS** (RenderTexture downscalée), pas SVG.
- ✅ **Particules** (`@pixi/particle-emitter`), oui — Phase 5 et 6.
