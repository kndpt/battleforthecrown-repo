# Run 032 - World lifecycle foundation and identity

- [x] Preflight: verifier worktree clean, fiche run, rules, SPEC, skills specialises et spec source.
- [x] Cartographier `WorldConfig`, `world` backend, workers, outbox, events shared et smokes existants.
- [x] Mettre a jour le contrat shared: `WorldConfigSchema.lifecycle`, `identity`, helpers lifecycle, DTO public.
- [x] Ajouter `World.plannedOpenAt` via migration Prisma non destructive et retrofitter `world.config` JSON.
- [x] Mettre a jour seed SQL et fixtures smoke pour la nouvelle shape `world.config`.
- [x] Ajouter le service/endpoint public des mondes joignables ou planifies.
- [x] Ajouter le worker de transitions `PLANNED -> OPEN -> LOCKED -> ENDED` avec event outbox `world.status.changed`.
- [x] Ajouter les tests pure-logic et smoke backend requis.
- [x] Lancer `prisma generate`, build shared si necessaire, tests cibles, smokes backend et `yarn static-check`.
- [x] Faire review 5 axes + review independante, fixer les findings majeurs/bloquants.
- [x] Verifier impact docs, completer la fiche run, archiver, mettre a jour `tasks/README.md`, commit unique.

## Decisions prises

- Mode complet: backend + shared + migration + contrat public + worker, donc pas de mode rapide.
- `plannedOpenAt` est le seul ajout SQL et reste nullable, conforme fiche/spec.
- Pas de worker de creation automatique de nouveaux mondes MVP: `newWorldEverydays` reste dans config/doc seulement.
- `identity` reste dans `world.config`; le nom `World.name` est preserve et sert de fallback pour `displayName` en migration/normalisation.
- Tests unitaires limites aux helpers purs shared; worker/controller/service Prisma verifies par smoke et QA backend reelle.
- Delegation shared fermee sans rapport final apres timeout court; les fichiers modifies par l'agent ont ete repris et audites par le lead.
- Review independante initiale BLOCK: `plannedOpenAt`, `tempoProfile`, starvation worker, index lifecycle. Corrections appliquees puis re-review GO.

## Review

- Correctness: payload public valide par Zod, transitions idempotentes, `plannedOpenAt` limite aux mondes `PLANNED`, `ENDED` exclus.
- Architecture: mutation statut + EventOutbox dans la meme transaction; frontend invalide les caches sans logique autoritative.
- Performance: `_count` Prisma pour `joinedCount`, index lifecycle, pas de limite arbitraire sur les transitions dues.
- Security: endpoint public expose uniquement les metadonnees monde attendues.
- Docs: data model, backend modules, realtime et spec lifecycle mis a jour.
