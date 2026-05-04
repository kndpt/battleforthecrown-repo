# Battle for the Crown — workspace root

> Briefing minimaliste pour Claude Code. Version finale viendra en Phase 8 (cf. `docs/migration/07-doc-consolidation.md`).

## Contexte

MMORTS médiéval style Kingsage / Tribal Wars (gestion de villages, ressources, armée, combats, conquête).
**Chantier en cours : migration du frontend Next.js → Vite + React + PixiJS v8.** Voir `docs/migration/`.

## Workspaces yarn

- `battleforthecrown/` — **frontend legacy** Next.js + React + Redux. **NE PAS MODIFIER** pendant la migration. Sera supprimé en fin de Phase 7.
- `battleforthecrown-pixi/` — **nouveau frontend** (à créer en Phase 0). Vite + React + PixiJS + Zustand + TanStack Query.
- `battleforthecrown-backend/` — NestJS + Prisma + Postgres + pg-boss + Socket.IO. **NE PAS MODIFIER** sauf nécessité documentée.
- `packages/shared/` — types et formules pures partagés. **LECTURE SEULE** pour les workspaces frontend.

## Commandes essentielles

```bash
# Dev
yarn install
yarn dev:shared                                              # watch package shared
PORT=15001 yarn workspace battleforthecrown-backend start:dev  # backend dev (port 15001)
yarn workspace battleforthecrown-pixi dev                    # nouveau frontend (port 5173, à partir Phase 0)

# DB Postgres (Docker)
cd battleforthecrown-backend && docker compose up -d
yarn workspace battleforthecrown-backend prisma migrate deploy

# Tests / lint / type-check
yarn workspaces run test
yarn workspaces run lint
```

Détail DB et SQL utiles : `docs/migration/db-setup.md`.

## Règles globales

- **Toujours yarn**, jamais npm.
- **Commits en EN, format `<type>(<scope>): <subject>`.** Échanges en français avec le user.
- **TypeScript strict** : pas de `any` pour faire taire le compilateur, trouver une solution typée.
- **Server-authoritative** : le backend est l'unique vérité. Le frontend interpole entre updates WebSocket, ne calcule rien d'autoritatif.
- **Pattern Outbox** : toute mutation backend crée une ligne `EventOutbox` dans la même transaction. Latence event WS = 0 à ~1 s.
- **Server tourne sur PORT=15001** (pas le défaut 8080).

## Run autonome (nuit du 2026-05-04)

> Si tu démarres une nouvelle session pour exécuter le chantier de migration en autonomie, commence par lire **`docs/migration/AUTONOMOUS_RUN.md`** AVANT toute action. Ce fichier contient les règles, garde-fous, et la séquence de phases.

## Documentation

- **Plan de migration en cours** : `docs/migration/` (8 documents + `db-setup.md` + `CHANGELOG.md`).
- **Architecture backend** : `battleforthecrown-backend/AGENTS.md` (sera splitté en Phase 8) + `battleforthecrown-backend/docs-v2/technical/`.
- **Doc gameplay legacy** : `battleforthecrown/docs/features/*-gameplay.md` (à fusionner en Phase 8 dans `docs/gameplay/`).

## Memory utilisateur

- Préférences globales utilisateur : `~/.claude/CLAUDE.md` (chargé automatiquement). Inclut : Plan Mode Default, Verification Before Done, Skills First / Subagents.
