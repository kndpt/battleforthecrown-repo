# Run #062 — fix-training-multi-type-queue

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant
- **Spec source** : `docs/gameplay/08-units.md` § Mécanique d'entraînement — file séquentielle (à amender à la livraison : L61 distingue séquentiel MVP / parallèle post-MVP)
- **Type** : fix
- **Modules** : backend (`schema.prisma`, `recruit-troops`, `training.worker`, `cancel-recruitment`, `army.service`, `recruit-noble`, `army.module`) | frontend (vérif no-op uniquement)

## Dépendances

- Migration Prisma appliquée avant tout test/smoke (`prisma migrate deploy`).
- Aucune dépendance de phase — run autonome.

## Critère de fin (acceptance)

- [ ] La DB accepte ≥ 2 `UnitTraining` pour un même `(villageId, building)` — `@@unique` supprimé.
- [ ] Entraîner type A puis type B sur Caserne ne retourne plus `'Training already in progress'` ; les 2 rows existent en DB.
- [ ] Un seul training (oldest `createdAt`) a un job pg-boss actif ; le 2e row n'a aucun job tant que le 1er n'est pas complété.
- [ ] À complétion du training actif, le worker démarre automatiquement le suivant (premier tick schedulé).
- [ ] Annuler le training actif (1er en file) démarre le suivant ; annuler un training en attente ne perturbe pas l'actif.
- [ ] `getInventory` expose comme actif le training oldest (déterministe via `orderBy: { createdAt: 'asc' }`).
- [ ] `yarn static-check` vert.
- [ ] Smoke `army-training.smoke.spec.ts` — cas multi-type vert.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-prisma`, `bftc-workers-outbox`
- Connexe résolu : `tasks/archive/076-cancel-army-training-from-queue-chip.md` — le cancel backend doit désormais démarrer le suivant en file
- Connexe résolu : `tasks/archive/44-army-training-schema-drift.md` — ce run supprime le même `@@unique`
- Connexe résolu : `tasks/archive/47-noble-training-visual-queue-missing.md` — logique deferred s'applique aussi à `THRONE_HALL`

## Décomposition initiale

- **T1** — `prisma/schema.prisma` : remplacer `@@unique([villageId, building])` par `@@index([villageId, building])` sur `UnitTraining` + `prisma migrate dev` + `prisma generate`.
- **T2** — `recruit-troops.use-case.ts` : supprimer le `throw BadRequestException('Training already in progress')` L81-83 ; repurposer `activeTraining` comme flag `isFirst` — si `isFirst`, créer row + schedule pg-boss job (comportement actuel) ; sinon créer row sans schedule (démarrage différé).
- **T3** — `training.worker.ts` : dans la branche `isComplete` (après `delete`), `findFirst({ where: { villageId, building }, orderBy: { createdAt: 'asc' } })` → si row suivant, `nextTickAt = now + timePerUnitMs`, `update({ nextUnitEta: nextTickAt })`, `boss.send('training:tick', ...)`.
- **T4** — `cancel-recruitment.use-case.ts` : injecter `PG_BOSS` ; avant `delete`, détecter si training annulé est le premier en file (`findFirst createdAt < training.createdAt` → absence = premier) ; après `delete`, si était premier : trouver le suivant et scheduler son premier tick.
- **T5** — `army.service.ts` : `getInventory` — remplacer `include: { unitTraining: true }` par `include: { unitTraining: { orderBy: { createdAt: 'asc' } } }` pour que `.find()` soit déterministe.
- **T6** — `recruit-noble.use-case.ts` : vérifier que le schedule pg-boss suit la même logique conditionnelle (deferred si `THRONE_HALL` training déjà actif) ; ajuster si nécessaire.
- **T7** — `army.module.ts` : s'assurer que `PG_BOSS` est dans les providers accessibles à `CancelRecruitmentUseCase` (à vérifier — peut-être déjà présent via module).
- **T8** — `test/army-training.smoke.spec.ts` : ajouter cas multi-type (entraîner A puis B → vérifier 2 rows, B démarre après complétion A) + cas cancel actif → suivant démarre.
- **T9** — `docs/gameplay/08-units.md` L61 : amender pour distinguer file séquentielle (MVP, 1 actif, les autres en attente) vs file parallèle (post-MVP, plusieurs simultanés).

## Points d'attention

- **Concurrence** : 2 requêtes quasi-simultanées sur même `(village, building)` pourraient toutes deux lire `activeTraining = null` et scheduler 2 jobs. La transaction Prisma isole la lecture/écriture — vérifier que le niveau d'isolation est suffisant ou ajouter `SELECT FOR UPDATE` si besoin.
- **"Actif" = oldest `createdAt`** : si 2 rows ont le même `createdAt` au ms près, tie-break par `id` (CUID lexicographique) — à acter dans le code via `orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]`.
- **Résilience au reboot** : si le worker crash entre le `delete` du training actif et le `boss.send` du suivant, le suivant reste orphelin. Acceptable pour MVP — noter comme dette.
- **Noble / THRONE_HALL** : la logique deferred est générique sur `building` → couvre déjà le Noble si T6 est cohérent.

## Progress

_(Vide au démarrage. Rempli pendant le run.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run.)_

## Rapport final

### Acceptance & QA

- [ ] `POST /army/:villageId/train` (type A) → 201 — `curl`
- [ ] `POST /army/:villageId/train` (type B, A actif) → 201, 2 rows en DB — `curl` + SQL
- [ ] `GET /army/:villageId/training` → 2 items ordonnés — `curl`
- [ ] Smoke multi-type vert — `yarn workspace battleforthecrown-backend test:smoke -- army`
- [ ] `yarn static-check` vert
- **Review indépendante** : oui (back+front, migration schema, diff > 100 lignes, invariant durable)
- **Tests automatisés** : smoke `army-training.smoke.spec.ts` multi-type
- **Tests IG user** : checklist courte (voir `$bftc-qa`)
