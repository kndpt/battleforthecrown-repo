# Run 016 - Scouting backend/shared

## Plan

- [x] Preflight: worktree clean, fiche run, rules, SPEC, docs source, lessons.
- [x] Cartographie: backend combat/expeditions/reports/outbox, Prisma schema, shared events/unit config, smokes existants.
- [x] Refinement: découper en tâches chirurgicales backend/shared/test/docs.
- [x] Implémentation: modèle `ScoutReport`, endpoint scout, worker/résolution/retour, events outbox, shared contracts.
- [x] Tests: smoke cycle complet + vérifications ciblées Prisma/shared.
- [x] Review 5 axes + fixes.
- [x] Retest: smokes obligatoires backend + `yarn static-check`.
- [x] Docs impact + backprop SPEC si nécessaire.
- [x] Archive run, update `tasks/README.md`, commit final.

## Notes de cadrage

- Scope MVP: scout SPY-only, succès automatique, aucune perte, retour des ESPIONs.
- Source gameplay: `docs/gameplay/11-scouting.md` + unités `docs/gameplay/08-units.md`.
- Respecter SPEC §C: backend server-authoritative, Outbox, pas de migration destructive.
- Tests backend orchestration: smoke réel, pas de mocks Prisma/pg-boss.
- Découpage implémenté: migration additive `ScoutReport` + `ExpeditionKind.SCOUT`, endpoint `POST /combat/scout`, events `scout.sent/reported/returned`, bindings WS front non-UI.

## Review

- Correctness: smoke réel couvre SPY gate Caserne 3, SPY-only, cible barbare/joueur visible, refus hors vision, `ScoutReport` snapshot, style joueur, retour des ESPIONs.
- Readability: ajout isolé dans `initiateScout`, `handleScoutArrival`, `presentScoutReport`; pas de surcharge des rapports combat.
- Architecture: `ScoutReport` dédié + events `scout.*`; Outbox et pg-boss existants réutilisés.
- Security: accès report via `scoutUserId`, cible hors vision refusée, style ennemi absent du public hors report.
- Performance: indexes `scoutUserId/worldId/timestamp`, pas de nouveau polling ou scan large.
