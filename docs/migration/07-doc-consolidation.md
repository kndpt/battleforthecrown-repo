# 07 — Consolidation documentaire (Phase 8)

> Le repo a accumulé de la doc dans tous les coins, partiellement obsolète, écrite pour l'humain ou pour Trae IDE. Cette phase reconstruit un **système de doc cohérent, centré sur Claude Code**, en suivant les conventions officielles Anthropic.

## Pourquoi cette phase

Aujourd'hui, un agent (et même un humain) qui débarque dans le repo doit lire :

- `/README.md` (3 lignes), `/WARP.md` (2 lignes), `/.trae/rules/project_rules.md` (workspace map)
- `/battleforthecrown/README.md` (TODO/BUG/NEW ad hoc), `/battleforthecrown/docs/` (6 fichiers `auth-routing.md`, `redux-architecture.md` — **tout sera obsolète après la migration**), `/battleforthecrown/docs/features/` (~20 fichiers `*-gameplay.md` / `*-technical.md`)
- `/battleforthecrown-backend/AGENTS.md` (16.8 KB, vraie source de vérité aujourd'hui), `/battleforthecrown-backend/.trae/rules/project_rules.md`, `/battleforthecrown-backend/docs/` (12 fichiers), `/battleforthecrown-backend/docs-v2/` (index pointant vers des dossiers `gameplay/` qui n'existent pas)
- 3 `.claude/settings.local.json` éparpillés, mais zéro `CLAUDE.md`

**Problèmes** :
- Aucun `CLAUDE.md` au sens de la convention Anthropic — Claude n'a pas de point d'entrée canonique au projet.
- `AGENTS.md` du backend = 16 KB → trop long, gaspillage de contexte, compliance dégradée (best practice Anthropic : < ~200 lignes par fichier de mémoire).
- `WARP.md` et `.trae/` = configs pour d'autres outils (Warp terminal, Trae IDE), polluent le repo.
- Docs liées à des décisions d'archi qui vont disparaître (Redux, Next.js routes…) = pièges pour Claude.
- Multiples `docs/` vs `docs-v2/` qui se contredisent.

## Convention cible (officielle Anthropic)

Référence : [Claude Code memory docs](https://code.claude.com/docs/en/memory.md), [skills](https://code.claude.com/docs/en/skills.md), [settings](https://code.claude.com/docs/en/settings.md).

### Fichiers que Claude Code charge automatiquement

| Fichier | Quand chargé | Versionné ? |
|---------|--------------|-------------|
| `./CLAUDE.md` (root) | Au démarrage | ✅ commit |
| `./CLAUDE.local.md` (root) | Au démarrage | ❌ gitignore |
| `<workspace>/CLAUDE.md` | Quand Claude travaille dans ce workspace | ✅ commit |
| `.claude/settings.json` | Au démarrage | ✅ commit |
| `.claude/settings.local.json` | Au démarrage | ❌ gitignore |
| `.claude/rules/*.md` | Au démarrage (ou path-scoped via frontmatter) | ✅ commit |
| `.claude/skills/*/SKILL.md` | À l'invocation | ✅ commit |
| `.claude/agents/*/AGENT.md` | À l'invocation | ✅ commit |
| `.claude/commands/*.md` | À l'invocation | ✅ commit |
| `~/.claude/CLAUDE.md` | Au démarrage (user-global, déjà existant) | hors repo |

### Ordre de chargement en monorepo

Quand Claude travaille sur `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts` :
1. `/CLAUDE.md` (root)
2. `/CLAUDE.local.md` (si présent)
3. `/.claude/rules/**/*.md` (root rules)
4. `/battleforthecrown-pixi/CLAUDE.md` (workspace)
5. `/battleforthecrown-pixi/.claude/rules/**/*.md` (si présents)

Les fichiers plus proches du fichier édité sont chargés **en dernier** → leurs instructions overridable celles du root.

### Règles de contenu

- **Concret, vérifiable** : « 2-space indentation, trailing commas, ESLint enabled » plutôt que « format code nicely ».
- **< 200 lignes** par fichier (au-delà, déplacer dans `.claude/rules/` path-scoped).
- **Pas de récit** : facts, conventions, commandes courantes, pointeurs.
- **Imports `@path/file.md`** pour faire référence à d'autres fichiers (résolus depuis le fichier porteur, profondeur max 5).

## Structure cible

```
battleforthecrown-repo/
│
├── CLAUDE.md                         # ◀ Entry point, < 100 lignes
│                                     #   Vue globale + map des workspaces + commandes racine
│
├── README.md                         # Pour humains qui découvrent le repo (court)
├── .gitignore                        # ajouter .claude/settings.local.json, CLAUDE.local.md
│
├── .claude/
│   ├── settings.json                 # Permissions, hooks, MCP (commit)
│   ├── settings.local.json           # Personal (gitignore)
│   ├── rules/
│   │   ├── conventions.md            # Conventions globales (TS strict, yarn, FR pour échanges)
│   │   ├── git.md                    # Format commits (déjà décrit dans CLAUDE user)
│   │   └── docs.md                   # Comment et où documenter (anti-prolifération)
│   ├── skills/                       # Skills team-wide propres au projet
│   │   └── (à créer au besoin)
│   └── agents/                       # Sub-agents projet (vide pour l'instant)
│
├── docs/                             # ◀ UN SEUL dossier docs racine
│   ├── README.md                     # Carte de la doc (index)
│   ├── architecture/                 # Doc humain de référence (cross-workspace)
│   │   ├── overview.md
│   │   ├── data-model.md             # Schéma Prisma + entités
│   │   └── realtime.md               # WebSocket Outbox, latences, événements
│   ├── gameplay/                     # Doc gameplay (humain + Claude)
│   │   ├── overview.md
│   │   ├── buildings.md
│   │   ├── units-and-combat.md
│   │   ├── resources-and-population.md
│   │   ├── crowns.md
│   │   ├── power.md
│   │   └── strategies.md
│   └── migration/                    # ◀ Ce dossier (chantier en cours)
│       ├── README.md
│       ├── 00-overview.md
│       ├── ...
│       └── CHANGELOG.md
│
├── packages/shared/
│   └── (pas de CLAUDE.md — code pur, pas de domaine spécifique)
│
├── battleforthecrown-pixi/           # nouveau frontend (créé en Phase 0)
│   ├── CLAUDE.md                     # ◀ < 80 lignes : Pixi+React+Zustand+TanStack
│   ├── README.md                     # Comment lancer / tester
│   └── .claude/
│       ├── settings.local.json       # gitignored
│       └── rules/
│           ├── pixi-conventions.md   # path-scoped src/pixi/**
│           └── react-hud.md          # path-scoped src/features/** + src/ui/**
│
├── battleforthecrown-backend/
│   ├── CLAUDE.md                     # ◀ < 80 lignes : NestJS+Prisma+pg-boss+Outbox
│   ├── README.md                     # Comment lancer / tester
│   └── .claude/
│       ├── settings.local.json       # gitignored
│       └── rules/
│           ├── nest-conventions.md
│           ├── prisma.md
│           └── workers.md
│
└── battleforthecrown/                # ◀ SUPPRIMÉ en fin de Phase 7
                                      #   (archive sur branche legacy/nextjs-frontend)
```

## Plan de consolidation

### Étape 1 — Inventaire à conserver / migrer / supprimer

| Fichier actuel | Sort | Destination |
|----------------|------|-------------|
| `/README.md` (3 lignes) | 🟡 réécrire | `/README.md` étoffé (humain) |
| `/WARP.md` | ❌ supprimer | — (Warp config, hors scope Claude) |
| `/.trae/rules/project_rules.md` | ❌ supprimer | — (Trae IDE, on est sur Claude Code) |
| `/.claude/settings.local.json` (root) | ✅ garder | en l'état (gitignore-le si pas déjà fait) |
| `/battleforthecrown/README.md` (TODO ad hoc) | 🟡 extraire | TODO list → `/docs/migration/post-migration-todo.md` |
| `/battleforthecrown/docs/auth-routing.md` | ❌ supprimer | (architecture caduque, sera réécrite côté pixi) |
| `/battleforthecrown/docs/redux-architecture.md` | ❌ supprimer | (Redux disparait avec la migration) |
| `/battleforthecrown/docs/ui-design-system.md` | 🟡 réécrire | `/docs/architecture/ui-design-system.md` (nouvelle stack) |
| `/battleforthecrown/docs/ui-library.md` | 🟡 réécrire | idem |
| `/battleforthecrown/docs/ui-writing-style.md` | ✅ garder | `/docs/architecture/ui-writing-style.md` (FR/EN ton, voix) |
| `/battleforthecrown/docs/features/*-gameplay.md` | 🟡 fusionner | `/docs/gameplay/*.md` (5-6 fichiers max) |
| `/battleforthecrown/docs/features/*-technical.md` | ❌ supprimer | (architecture caduque) |
| `/battleforthecrown/.trae/rules/...` | ❌ supprimer | — |
| `/battleforthecrown/.claude/settings.local.json` | ❌ supprimer | (le workspace `battleforthecrown` est supprimé en Phase 7) |
| `/battleforthecrown-backend/AGENTS.md` (16.8 KB) | 🟡 splitter | → 3 fichiers : `/battleforthecrown-backend/CLAUDE.md` (concise) + `/battleforthecrown-backend/.claude/rules/nest-conventions.md` + `/docs/architecture/backend-modules.md` |
| `/battleforthecrown-backend/.trae/rules/...` | ❌ supprimer | — |
| `/battleforthecrown-backend/.claude/settings.local.json` | ✅ garder | en l'état |
| `/battleforthecrown-backend/docs-v2/index.md` | ❌ supprimer | (références à des dossiers fantômes) |
| `/battleforthecrown-backend/docs-v2/technical/*` | 🟡 migrer | → `/docs/architecture/` |
| `/battleforthecrown-backend/docs/*.md` (12 fichiers) | 🟡 trier | gameplay → `/docs/gameplay/`, technique → `/docs/architecture/`, `IMPLEMENTATION_SUMMARY.md` et `PHASE2_*.md` → supprimer |
| `/battleforthecrown-backend/prisma/schema.prsima.md` | ❌ supprimer (typo) | — (la vraie source = `schema.prisma`) |
| `/docs/meta/` (root, vide) | ❌ supprimer | — |
| `/docs/migration/*` (ce chantier) | ✅ garder | en l'état pendant la migration |

### Étape 2 — Création des CLAUDE.md (gabarits courts)

#### `/CLAUDE.md` (root) — gabarit ~80 lignes

```markdown
# Battle for the Crown — workspace root

MMORTS médiéval (réf : Kingsage, Travian). Monorepo yarn workspaces.

## Workspaces

- `battleforthecrown-pixi/` — frontend Vite + React + PixiJS v8 + Zustand + TanStack Query
- `battleforthecrown-backend/` — NestJS + Prisma + pg-boss + Socket.IO
- `packages/shared/` — types et formules pures partagés (lecture seule pour les workspaces)

## Commandes racine

- `yarn install`
- `yarn dev:shared` — watch du package shared
- `yarn workspace battleforthecrown-pixi dev` — frontend
- `yarn workspace battleforthecrown-backend start:dev` — backend (PORT=15001)

## Conventions (toutes confondues)

@.claude/rules/conventions.md

## Git

@.claude/rules/git.md

## Doc

- Architecture humain : `docs/architecture/`
- Gameplay : `docs/gameplay/`
- Migration en cours : `docs/migration/`
- Pas de doc dans `<workspace>/docs/` — tout passe par `/docs/`. Voir `.claude/rules/docs.md`.
```

#### `/battleforthecrown-pixi/CLAUDE.md` — gabarit ~70 lignes

```markdown
# Frontend PixiJS

Vite + React 19 + PixiJS v8 + Zustand + TanStack Query.

## Commandes

- `yarn dev` — Vite, port 5173
- `yarn test` — Vitest
- `yarn build` — bundle prod (cible < 500 KB JS gzippé)
- `yarn type-check`, `yarn lint`

## Architecture

- `src/pixi/` — tout ce qui touche au canvas (scenes, entities, viewport, assets, effets, debug)
- `src/features/` — HUD React (login, panels, modales, listes) — un dossier par domaine métier
- `src/ui/` — design system Tailwind
- `src/stores/` — Zustand
- `src/api/` — client REST (TanStack Query) + singleton WebSocket Socket.IO
- `src/lib/` — helpers purs (réutilise `@battleforthecrown/shared` quand possible)

## Règles spécifiques canvas et HUD

@.claude/rules/pixi-conventions.md
@.claude/rules/react-hud.md

## Contrat avec le backend

- API REST + Socket.IO. Snapshot figé : `/docs/migration/06-api-contract-snapshot.md`
- Types partagés via `@battleforthecrown/shared` — ne jamais dupliquer une formule.
```

#### `/battleforthecrown-backend/CLAUDE.md` — gabarit ~70 lignes

```markdown
# Backend NestJS

NestJS + Prisma + PostgreSQL + pg-boss + Socket.IO.

## Commandes

- `PORT=15001 yarn start:dev` — dev (le frontend tape sur 15001)
- `yarn test` — unit tests
- `yarn test:e2e` — E2E
- `yarn lint`, `yarn type-check`

## Architecture

- `src/modules/<domain>/` — un module par bounded context (auth, world, village, resources, army, combat, crowns, power, population, event)
- `src/workers/` — pg-boss workers (production, construction, training, outbox, crown-production)
- `src/infra/prisma/`, `src/infra/pg-boss/` — wrappers techniques
- `src/common/` — pipes, middleware, types Prisma partagés
- `prisma/schema.prisma` — source de vérité du modèle de données

## Patterns

- **Outbox** : toute mutation crée une ligne `EventOutbox` dans la même transaction → `OutboxWorker` dispatche via Socket.IO
- **Server-authoritative** : pas de calcul critique côté client. Le backend est l'unique vérité.

## Règles spécifiques

@.claude/rules/nest-conventions.md
@.claude/rules/prisma.md
@.claude/rules/workers.md

## Doc gameplay et architecture détaillées

`/docs/gameplay/`, `/docs/architecture/`.
```

### Étape 3 — Rules path-scoped (`.claude/rules/`)

Format avec frontmatter :

```markdown
---
description: Conventions Pixi v8 (scenes, viewport, lifecycle)
paths:
  - "battleforthecrown-pixi/src/pixi/**"
---

# Pixi conventions

- Toute Container expose `destroy()` qui libère les listeners Zustand et les enfants Pixi.
- Pas de `setInterval` ; utiliser `app.ticker.add()` (auto-cleanup).
- Subscriptions Zustand via `useStore.subscribe(selector, callback)` — pas de hook React dans le code Pixi.
- Animations : `@pixi/particle-emitter` pour les effets, `motion`/easings custom pour les tweens.
- Assets via `Assets.loadBundle()` (Pixi Assets API), pas de `Loader` legacy.
- Cf. `/docs/migration/05-pixijs-stack-decisions.md` pour les choix de stack et formats d'assets.
```

Mêmes principes pour `react-hud.md`, `nest-conventions.md`, `prisma.md`, `workers.md`.

### Étape 4 — `.gitignore`

S'assurer que :

```
# Claude
.claude/settings.local.json
**/.claude/settings.local.json
CLAUDE.local.md
**/CLAUDE.local.md

# Trae (à virer après migration)
.trae/
**/.trae/
```

### Étape 5 — `/docs/README.md` (carte de la doc)

```markdown
# Documentation Battle for the Crown

## Pour démarrer
- [Architecture overview](./architecture/overview.md)
- [Gameplay overview](./gameplay/overview.md)

## Architecture
…liste des fichiers `architecture/`…

## Gameplay
…liste des fichiers `gameplay/`…

## Chantier en cours
- [Migration vers PixiJS](./migration/README.md)

## Conventions
- Pour Claude Code : voir `/CLAUDE.md` à la racine et les `.claude/rules/` dans chaque workspace.
- Toute nouvelle doc va dans `/docs/<domain>/`. Pas dans les workspaces.
```

### Étape 6 — Validation finale

- Lancer Claude Code dans le repo et vérifier que :
  - `/CLAUDE.md` est bien chargé (test trivial : poser une question sur les workspaces).
  - Quand on édite un fichier dans `battleforthecrown-pixi/src/pixi/`, le rule `pixi-conventions.md` doit influencer les réponses.
- Lire 5 fichiers au hasard de `/docs/` et vérifier qu'aucun ne référence Redux, Next.js App Router, ou un fichier qui n'existe plus.
- Mesurer : combien de KB de doc Claude charge au démarrage ? Cible : **< 30 KB total** sur le `/CLAUDE.md` + `.claude/rules/` racine.

## Quand exécuter cette phase

**Phase 8 — APRÈS la Phase 7** (suppression du legacy `battleforthecrown/`).

Raisons :
- On supprime d'abord le code legacy → ses docs deviennent évidemment obsolètes → le tri devient trivial.
- Les conventions Pixi/Zustand sont fixées par les Phases 4-6 → on documente du **réel**, pas du futur.
- Le `06-api-contract-snapshot.md` a été stressé par toutes les phases → il est fiable, on peut le promouvoir en doc d'architecture (`/docs/architecture/realtime.md` + `/docs/architecture/api.md`).

Durée estimée : **1-2 jours**. Surtout du tri + écriture concise.

## Definition of Done — Phase 8

- ✅ `/CLAUDE.md` racine existe, < 100 lignes, mentionne les 3 workspaces et leurs commandes.
- ✅ Chaque workspace actif a son propre `CLAUDE.md` < 100 lignes.
- ✅ Chaque workspace actif a `.claude/rules/` avec au moins un fichier path-scoped pertinent.
- ✅ `/docs/` racine contient `architecture/`, `gameplay/`, `migration/` — et seulement ça.
- ✅ Aucun `WARP.md`, `.trae/`, `AGENTS.md` au sens 16 KB, ni `docs-v2/` n'existe plus.
- ✅ Aucun fichier de `/docs/` ne mentionne Redux, Next.js, App Router (sauf l'historique `/docs/migration/`).
- ✅ `.gitignore` couvre `.claude/settings.local.json` et `CLAUDE.local.md`.
- ✅ Test pratique : un agent Claude Code « cold start » doit pouvoir résumer le projet et faire une petite tâche en restant dans les conventions, sans qu'on lui rappelle quoi que ce soit en chat.

## Anti-patterns à éviter

1. **Ne PAS recréer un mega-AGENTS.md** comme l'actuel (16 KB). Splitter dans `.claude/rules/`.
2. **Ne PAS multiplier les `docs/` dans les workspaces** (anti-DRY, source de drift). Tout dans `/docs/`.
3. **Ne PAS écrire de doc générée par feature** (`*-technical.md` par feature). Une doc d'archi par domaine, pas par fichier.
4. **Ne PAS écrire pour l'humain et pour Claude dans le même fichier**. Les `CLAUDE.md` sont opérationnels (commandes, règles). La doc humaine d'architecture/gameplay est dans `/docs/`. Claude peut lire les deux, mais le ton diffère.
5. **Ne PAS laisser la doc dériver pendant les phases 0-7**. Petites mises à jour incrémentales du `CHANGELOG.md` pendant. Refonte complète seulement en Phase 8.
