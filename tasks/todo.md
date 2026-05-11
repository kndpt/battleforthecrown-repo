# Run 012 - Inbox combat reports

## Plan

- [x] Preflight: worktree clean, fiche run, rules, SPEC, docs source, lessons.
- [x] Cartographie: backend combat/reports/outbox, shared events, frontend messages/badge.
- [ ] Refinement: contrat MVP + tâches chirurgicales.
- [x] Implémentation: docs gameplay, backend persistence/API/WS, frontend inbox/badge.
- [x] Tests: smokes backend, tests frontend ciblés si mapping non trivial.
- [x] Review 5 axes + fixes.
- [x] Retest: smokes obligatoires backend + `yarn static-check`.
- [x] Docs impact + backprop SPEC si nécessaire.
- [ ] Archive run, update `tasks/README.md`, commit final.

## Notes de cadrage

- Scope MVP limité aux rapports de combat persistants.
- Décision MVP: conserver `CombatReport` comme source de vérité inbox combat Phase 2.
- Correction nécessaire: état lu/non-lu par participant, pas un booléen global partagé.
- Ne pas embarquer scout, conquête, push deep-link, pin/archive/filtres avancés.
- Respecter SPEC §C: backend server-authoritative, Outbox, pas de migration destructive sans accord.

## Review

- Correctness: `CombatReport` reste source MVP; lecture/suppression sont maintenant par participant attaquant/défenseur, avec fallback legacy `is_read`.
- Readability: helpers `getReportRole` / `canAccessReport` centralisent les règles d'accès.
- Architecture: pas de table `Report` transverse; migration additive uniquement; `EventOutbox` reste canal WS.
- Security: un rapport masqué n'est plus accessible par le participant qui l'a supprimé; l'autre participant conserve son accès.
- Performance: requêtes list restent indexées sur `attackerUserId` / `defenderUserId`; ajout de booléens sans scan supplémentaire non borné.
