# Ticket 35 — return travel time recomputed vs spec

## Plan

- [x] Relire ticket, règles, SPEC et contexte return flow récent.
- [x] Cartographier `Expedition`, dispatch combat/renfort/rappel et retour combat.
- [x] Persister la durée aller au dispatch et la réutiliser au retour combat.
- [x] Ajouter le filet smoke pertinent.
- [x] Mettre à jour docs/ticket/README puis archiver.
- [x] Lancer migrations/generate/tests/static-check, review et commit.

## Review

- Correctness : `CombatWorker` réutilise `Expedition.outboundTravelMs`; dispatch attaque/renfort/rappel remplit le champ depuis le calcul aller.
- Readability : champ dédié et invariant `SPEC.md V1`; pas de dépendance implicite à `arrivalAt - departAt` dans le worker.
- Architecture : migration non destructive appliquée dev + smoke; Outbox/pg-boss inchangés.
- Security : aucun nouvel endpoint ni permission.
- Performance : une colonne `Int`, aucune requête additionnelle au retour.
- Vérifications : migrations dev + smoke appliquées, Prisma généré, backend type-check, unit backend, smokes backend et `static-check` verts.
- Docs : mises à jour ciblées dans `docs/architecture/backend-modules.md`, `docs/architecture/data-model.md`, `SPEC.md`, ticket archivé et README tasks.
