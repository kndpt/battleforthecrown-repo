# 04 — Risques & tradeoffs

## Tradeoffs à valider avant Phase 0

### {#tradeoff-vite-vs-next} Vite vs garder Next.js (CSR-only)

| Critère | Vite | Next.js (CSR-only) |
|---------|------|-------------------|
| HMR sur un canvas qui s'auto-réinstancie | ✅ rapide, contrôle total | 🟡 moins prévisible (Fast Refresh React, pas Pixi) |
| SSR pour SEO | ❌ pas de SSR | ✅ possible |
| App Router / file-based routing | ❌ on perd | ✅ on garde |
| Middleware/edge | ❌ on perd | ✅ on garde |
| Bundle final | ✅ plus petit (pas le runtime Next) | 🟡 plus gros |
| Familiarité existante | 🟡 à apprendre côté équipe | ✅ déjà utilisé |
| Magie / convention | ✅ très peu | 🟡 beaucoup |

**Verdict : Vite.** SEO non pertinent (jeu authentifié), middleware non utilisé pour du gameplay. Le seul vrai inconvénient est de perdre l'App Router, qu'on remplace facilement par react-router.

**Risque résiduel** : si on a besoin d'un CDN edge avec rewrites pour des sous-domaines de monde plus tard, on devra ajouter une couche (Cloudflare, Caddy). À ce moment-là.

---

### {#tradeoff-zustand-vs-redux} Zustand + TanStack Query vs Redux Toolkit + RTK Query

| Critère | Zustand + TanStack | RTK + RTK Query |
|---------|-------------------|-----------------|
| Boilerplate par store/endpoint | ~10 lignes | ~30-50 lignes |
| Persistence | ✅ middleware natif, opt-in par store | 🟡 redux-persist avec liste blanche |
| Cache invalidation | ✅ TanStack tags très clairs | ✅ RTK tags |
| Optimistic UI | ✅ `onMutate/onError` standard | ✅ `pessimistic update` plus verbeux |
| Subscribe sans re-render React | ✅ `useStore.subscribe()` natif | 🟡 nécessite `store.subscribe()` raw |
| DevTools | ✅ Redux DevTools support | ✅ natif |
| Communauté / écosystème | ✅ très large | ✅ très large |
| Migration depuis l'existant | 🟡 réécriture | ✅ copie |

**Verdict : Zustand + TanStack Query.**

L'ancien projet utilise déjà un mix : RTK pour API + Redux slices pour UI state — **on a déjà deux paradigmes**. Passer à Zustand+TanStack unifie : *server state* dans TanStack, *client state* dans Zustand. C'est plus propre et plus court.

**Risque résiduel** : si une équipe arrive avec une forte culture Redux, il faudra du temps d'adaptation. Mitigé par : la doc dans `02-target-architecture.md`, et le fait que les concepts (selectors, dispatch → setState, slices → store) sont équivalents.

---

### Repo : nouveau dossier vs réécriture in-place

| Critère | Nouveau dossier en parallèle | Réécriture in-place |
|---------|-----------------------------|---------------------|
| Démontrable à mi-chemin | ✅ deux apps qui marchent | ❌ frontend cassé pendant des semaines |
| Rollback en cas de problème | ✅ supprimer le nouveau | ❌ git revert de N commits |
| Branche git unique | 🟡 chemin différent | ✅ même chemin |
| Espace disque | 🟡 légèrement plus | ✅ moins |
| Risque de drift entre les deux | 🟡 oui pendant la migration | ✅ non |

**Verdict : Nouveau dossier.** Le risque de drift est faible car le **legacy ne reçoit aucun commit nouveau pendant la migration** (on l'archive en lecture seule mentalement). À la fin, on supprime.

---

### PixiJS v8 vs v7

- v8 stable depuis fin 2024.
- API simplifiée (`new Application().init()` async, plus de `new Application({})` synchrone).
- WebGPU automatique avec fallback WebGL.
- Batching nettement amélioré.
- v7 sera maintenue, mais c'est l'option de stagnation.

**Verdict : v8.** Le seul risque est sur des libs tierces qui ne supportent pas encore v8. Vérifié :
- `pixi-viewport` : version 6.x compatible Pixi v8 ✅
- `@pixi/sound` : compatible ✅

---

## Risques techniques majeurs

### R1 — Performance WorldMap au-delà de 1000 entités

**Description** : 500×500 tuiles + 5000 villages + 50 expéditions actives = beaucoup de draw calls.

**Mitigation** :
- `pixi-viewport` cull naturellement hors viewport.
- `ParticleContainer` pour les tuiles de fond (50 000+ sprites possibles).
- Sprite sheets unifiés (1 atlas pour villages, 1 pour tuiles) → 1 batch par type.
- Phase 4 inclut un test de stress dédié. Si on n'atteint pas 60 fps, on adopte un système de chunks pre-rendered (RenderTexture par chunk de 16×16 tuiles).

**Plan B** : si même avec chunks ça rame → revoir le gameplay (limiter le viewport zoom-out, pagination des entités).

---

### R2 — Latence WebSocket et désynchronisation visuelle

**Description** : pattern Outbox = délai 0-1s. Si on lance 3 attaques rapides, leur ordre visuel peut différer de l'ordre logique backend.

**Mitigation** :
- Toujours rendre l'optimistic update **immédiatement** côté client (sprite expédition apparaît instantanément).
- Quand l'event WS arrive, **réconcilier** par `expeditionId` (créer si absent, fusionner si existe).
- En cas de désync majeure (>5s) : provoquer un refetch complet via TanStack Query.

---

### R3 — Conflit React 19 / certaines libs

**Description** : React 19 est récent, certains packages (notamment Testing Library, ESLint plugins) peuvent traîner.

**Mitigation** :
- Phase 0 : `yarn install` propre, lever les warnings tôt.
- Si conflit : downgrade ponctuel à React 18.3 (zéro coût, équivalent fonctionnel).

---

### R4 — Asset pipeline : pas d'assets graphiques disponibles

**Description** : le legacy n'a pas l'air d'avoir des sprites finalisés (`unitConfig.ts` mentionne `assetPath` mais probable placeholder).

**Mitigation** :
- Phase 4-5 utilise des **placeholders graphiques** (formes, texte, couleurs unies). Pas un blocker pour la migration technique.
- Lister les assets nécessaires dans `docs/migration/assets-required.md` (à créer en Phase 4).
- Délégué au game designer / artist en parallèle.

**Plan B** : utiliser des sets libres (Kenney.nl, OpenGameArt) pour le MVP visuel. Le pipeline d'asset Pixi (Assets API) supporte tous les formats standards.

---

### R5 — Tests E2E manquants pour valider l'iso-fonctionnalité

**Description** : le legacy n'a pas de tests E2E (Playwright/Cypress). Comment garantir qu'on n'oublie rien ?

**Mitigation** :
- Pour chaque écran porté, **scénario manuel décrit dans le CHANGELOG** + capture vidéo si possible.
- Phase 7 inclut une vraie suite Playwright pour le golden path.
- L'audit `01-current-state.md` sert de checklist.

---

### R6 — Drift de l'API backend pendant la migration

**Description** : si pendant 3 semaines un autre dev modifie le backend, on peut casser l'app pixi sans le voir.

**Mitigation** :
- `06-api-contract-snapshot.md` fige l'API à un moment T.
- À chaque phase, vérifier rapidement le contrat (script de health-check optionnel).
- Au moindre doute, regenerer les types depuis le backend (futur : OpenAPI/tRPC envisageable).

**Plan B** : adopter `tRPC` ou `Hey API` pour générer les clients depuis NestJS. Hors scope de cette migration mais à garder en tête.

---

### R7 — Dépendance au skill PixiJS

**Description** : le skill `pixijs-skills` est un référentiel externe, peut évoluer ou disparaître.

**Mitigation** :
- Le skill est une **aide**, pas une dépendance runtime. La doc officielle PixiJS ([pixijs.com](https://pixijs.com/8.x/guides) — utiliser le skill `find-docs` ou Context7 si on en a besoin) reste la source de vérité.
- Si le skill plante : la migration continue avec la doc officielle.

---

## Risques non-techniques

### N1 — Estimation 13-18 jours optimiste

**Description** : c'est une estimation pour un développeur full-time. Avec interruptions, support, débogage backend incident, x1.5 à x2.

**Mitigation** :
- Phases courtes et démontrables → le user peut interrompre à tout moment et garder ce qui est fait.
- Phase 4 (la plus risquée) timeboxée : si on dépasse 5 jours, on simplifie (moins d'entités, pas de mini-map, etc.).

---

### N2 — Tentation d'élargir le scope

**Description** : pendant qu'on touche au front, on est tenté d'ajouter des features (le 3D village mentionné dans le TODO, l'arbre tech, le système de quêtes).

**Mitigation** :
- **No.** Le scope de cette migration est **iso-fonctionnel** (et meilleur sur les deux écrans canvas).
- Toute feature nouvelle est notée dans `docs/migration/post-migration-todo.md`, pas implémentée.

---

### N3 — Suppression du legacy : moment psychologique

**Description** : à la fin de Phase 7, supprimer 121 fichiers TS/TSX sur lesquels on a passé du temps fait peur.

**Mitigation** :
- On **archive** le legacy dans une branche git `legacy/nextjs-frontend` avant suppression sur `main`.
- Si dans 6 mois on regrette : `git checkout legacy/nextjs-frontend -- battleforthecrown/`.

---

## Décisions actées AVANT Phase 0 (2026-05-04)

| Décision | Choix | Lien |
|----------|-------|------|
| Bundler | ✅ **Vite** | [tradeoff](#tradeoff-vite-vs-next) |
| State | ✅ **Zustand + TanStack Query** | [tradeoff](#tradeoff-zustand-vs-redux) |
| Repo | ✅ **Nouveau dossier `battleforthecrown-pixi/`** | [strategy](./03-migration-plan.md#strategy) |
| Pixi | ✅ **v8** | — |
| Vue village | ✅ Top-down 2D, viewport zoom/pan, mobile portrait | [05](./05-pixijs-stack-decisions.md#vue-village--top-down-2d-style-kingsage--tribal-wars-pas-de-3d) |
| Mini-map | ✅ PixiJS | [05](./05-pixijs-stack-decisions.md#mini-map--pixijs-pas-svg) |
| Particules | ✅ `@pixi/particle-emitter` | [05](./05-pixijs-stack-decisions.md#particules--oui-dès-phase-6) |

Phase 0 débloquée.
