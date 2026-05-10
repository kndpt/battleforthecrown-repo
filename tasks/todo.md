# Run 011 — fix-return-worker-decouple-report

## Plan

- [x] Reprendre l'état local du run en cours et relire règles/leçons.
- [x] Vérifier le diff existant : schema, workers, smoke, migration.
- [x] Finaliser le découplage return/report et renforcer le smoke.
- [x] Lancer migrations/generate si nécessaire, tests backend et smoke.
- [x] Lancer `yarn static-check`, review 5 axes et impact docs.
- [x] Finaliser fiche, archive, README tasks et commit.

## Review

- Correctness : le `ReturnWorker` ne dépend plus de `CombatReport`; le smoke report supprimé pendant retour couvre inventaire, ressources et event nullable.
- Readability : changement localisé aux snapshots d'expédition et au contrat d'event partagé.
- Architecture : Outbox + transaction unique conservées; `battle.returned.reportId` nullable aligné backend/shared/frontend.
- Security : suppression de rapport reste contrôlée par l'endpoint existant, pas de nouvel accès.
- Performance : deux colonnes JSON nullables, aucune requête additionnelle au retour.
- Vérifications : backend unit, smokes complets, `static-check` verts.
- Docs : mises à jour ciblées dans gameplay, data-model, realtime et smoke-tests.
