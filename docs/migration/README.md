# Migration vers PixiJS — Index

> Chantier de simplification du frontend `battleforthecrown` (Next.js + React + Redux + Tailwind) vers une stack centrée sur **PixiJS v8** + un HUD React minimal.
> **Le backend NestJS reste intouché** — la migration est purement front.

## Statut du chantier

| Phase | Statut | Document |
|------|--------|----------|
| Audit | ✅ Terminé | [01-current-state.md](./01-current-state.md) |
| Vision & objectifs | ✅ Rédigé | [00-overview.md](./00-overview.md) |
| Architecture cible | ✅ Rédigé | [02-target-architecture.md](./02-target-architecture.md) |
| Plan d'exécution | ✅ Rédigé | [03-migration-plan.md](./03-migration-plan.md) |
| Risques / tradeoffs | ✅ Rédigé | [04-risks-and-tradeoffs.md](./04-risks-and-tradeoffs.md) |
| Décisions stack PixiJS | ✅ Rédigé | [05-pixijs-stack-decisions.md](./05-pixijs-stack-decisions.md) |
| Contrat API figé (REST + WS) | ✅ Rédigé | [06-api-contract-snapshot.md](./06-api-contract-snapshot.md) |
| Consolidation documentaire (Phase 8) | ✅ Rédigé | [07-doc-consolidation.md](./07-doc-consolidation.md) |
| **Validation user** | ✅ Validée le 2026-05-04 | Vite + Zustand+TanStack + nouveau dossier |
| Phase 0 — DB + backend + scaffold Vite | ✅ Done (2026-05-04) | [CHANGELOG](./CHANGELOG.md#phase-0--skill-scaffold-plomberie-2026-05-04) |
| Phase 1 — Auth + sélection monde | ✅ Done (2026-05-04) | [CHANGELOG](./CHANGELOG.md#phase-1--auth--sélection-de-monde-hud-pur-pas-de-canvas-2026-05-04) |
| Phase 2 — WebSocket + stores | ✅ Done (2026-05-04) | [CHANGELOG](./CHANGELOG.md#phase-2--couche-temps-réel--websocket--stores-liés-2026-05-04) |
| Phase 3 — HUD village | ✅ Done (2026-05-04) | [CHANGELOG](./CHANGELOG.md#phase-3--hud-complet-du-village-sans-canvas-2026-05-04) |
| Phase 4 — WorldMap PixiJS | 🟡 Done partiel (2026-05-05) | [CHANGELOG](./CHANGELOG.md#phase-4--pixijs-world-map-la-grosse-pièce-2026-05-05) |
| Phase 5 — VillageScene PixiJS | ✅ Done (2026-05-05) | [CHANGELOG](./CHANGELOG.md#phase-5--pixijs-village-view-top-down-2026-05-05) |
| Phase 6 — Animations expéditions | ✅ Done (2026-05-05) | [CHANGELOG](./CHANGELOG.md#phase-6--animations-expéditions-et-combats-2026-05-05) |
| Phase 7 — Polish + archive legacy (sans suppression) | 🟡 Done partiel (2026-05-05) | [CHANGELOG](./CHANGELOG.md#phase-7--polish-perf-archive-legacy-sans-suppression-2026-05-05) |
| Phase 8 — Consolidation doc | 🟡 Done partiel (2026-05-05) | [CHANGELOG](./CHANGELOG.md#phase-8--consolidation-documentaire-claudemd-hiérarchique-2026-05-05) |
| Phase 9 — Fidélité design (assets + ui-test + composants) | ✅ Done (2026-05-05) — 9.A/B/C/D/E + L1-L8 livrés | [CHANGELOG](./CHANGELOG.md#phase-9--fidélité-design-assets--ui-test--composants-2026-05-05) |

## Comment lire cette doc

**Lecture conseillée dans l'ordre** :

1. **[00-overview.md](./00-overview.md)** — Pourquoi on migre, ce qu'on attend, ce qu'on ne touche pas. *Lis-le en premier, c'est court.*
2. **[01-current-state.md](./01-current-state.md)** — Cartographie exhaustive de l'existant (15 features, 121 fichiers TS/TSX, surface API). *Référence pendant toute la migration.*
3. **[02-target-architecture.md](./02-target-architecture.md)** — Schéma cible : Vite + React (HUD) + PixiJS v8 (canvas) + Zustand. *Vue d'avion.*
4. **[03-migration-plan.md](./03-migration-plan.md)** — 8 phases incrémentales, livrables, critères de done. *Le plan d'exécution.*
5. **[04-risks-and-tradeoffs.md](./04-risks-and-tradeoffs.md)** — Ce qui peut mal tourner et comment on l'évite.
6. **[05-pixijs-stack-decisions.md](./05-pixijs-stack-decisions.md)** — Choix précis dans l'écosystème Pixi (viewport, particules, asset bundler, etc.).
7. **[06-api-contract-snapshot.md](./06-api-contract-snapshot.md)** — Endpoints REST et events WebSocket figés à un instant T pour ne pas dériver pendant la migration.
8. **[07-doc-consolidation.md](./07-doc-consolidation.md)** — Phase 8 : refonte de toute la doc Claude/AGENTS/README en un système `CLAUDE.md` hiérarchique conforme aux conventions Anthropic.

### Annexes opérationnelles

- **[db-setup.md](./db-setup.md)** — Bootstrap Postgres + Prisma, snippets SQL de debug, reset (utilisé par la Phase 0.A).

## Dépendances externes

- **Skill PixiJS** : `npx skills add https://github.com/pixijs/pixijs-skills` (à exécuter en début de Phase 0).
- **Backend** : doit tourner (`yarn workspace battleforthecrown-backend start:dev`) pendant toute la migration pour valider chaque phase.
- **Package shared** : `@battleforthecrown/shared` est consommé tel quel dans la nouvelle app, son build doit rester opérationnel.

## Conventions de ce chantier

- Aucun changement backend tant qu'une phase n'a pas signalé un manque (ex : endpoint qui pousse seulement une partie du payload nécessaire au rendu).
- Chaque phase produit un **livrable jouable** ou **mesurable** — pas de phase « plomberie » sans démo.
- Les commits suivent `<type>(<scope>): <subject>` (cf. CLAUDE.md global).
- Tout écart au plan est noté dans `docs/migration/CHANGELOG.md` (à créer au début de la Phase 0).
