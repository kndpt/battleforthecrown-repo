# Run #062 — fix-training-multi-type-queue

> **Statut** : DONE
> **Démarré** : 2026-06-19
> **Terminé** : 2026-06-19

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

_(git history)_

## Décisions prises

_(git history)_

## Rapport final

Synthèse : `@@unique([villageId, building])` remplacé par `@@index` → file séquentielle (1 row/type, tête = oldest `createdAt,id`). Seule la tête a un job pg-boss ; worker (complétion) et cancel (retrait tête) promeuvent le suivant. Garantie de sérialisation restaurée par `pg_advisory_xact_lock` par `(village, building)` dans recruit-troops + recruit-noble (compense la perte du garde-fou unique DB). Noble inchangé côté queue (gate `canRecruitNoble` + lock).

### Acceptance & QA

**Critères d'acceptance vérifiés**

- [x] DB accepte ≥2 `UnitTraining` même `(villageId, building)` — `migration drop_unit_training_unique_building` + smoke `queues a second unit type` (`rows == [MILITIA, WARRIOR]`) → 2 rows coexistent.
- [x] Type A puis B ne renvoie plus `'Training already in progress'`, 2 rows — smoke `queues a second unit type` (`trainB.status < 300`) → vert.
- [x] Un seul job actif (tête), 2e sans job — smoke assert `militiaSlot.trainingStartTime` truthy & `warriorSlot.trainingStartTime` falsy → vert.
- [x] À complétion, worker démarre le suivant — smoke : WARRIOR atteint l'inventaire sans re-POST → vert.
- [x] Annuler la tête démarre le suivant — smoke `cancelling the active head promotes the next` → WARRIOR entraîné → vert.
- [x] Annuler un training en attente ne perturbe pas l'actif — smoke `cancelling a waiting unit leaves the active head untouched` → MILITIA complète, WARRIOR qty 0 → vert.
- [x] `getInventory` expose la tête déterministe — `army.service.ts` `orderBy [{createdAt asc},{id asc}]` + smoke `trainingStartTime` sur MILITIA.
- [x] `yarn static-check` vert — `yarn static-check` → Done, 0 erreur.
- [x] Smoke multi-type vert — `yarn workspace battleforthecrown-backend test:smoke:run -- army-training.smoke` → 7/7 passed.

**Review indépendante** : Déclenchée (raison: diff > 100 lignes + invariant durable « file séquentielle »). Cycle 1 → `BLOCK` (2 majeurs : régression garantie concurrence ; critère L25 non testé). Fix : advisory lock + smoke cancel-waiting + tie-break `getTraining`. Cycle 2 → `GO`.

**Tests automatisés** : `test:smoke:run -- army-training.smoke` → 7/7 (4 existants + 3 nouveaux). `yarn static-check` → vert.

**Smokes lancés** : Ciblés — `yarn workspace battleforthecrown-backend test:smoke:run -- army-training.smoke` → 7/7. (Diff backend non transversal : pas de full smoke local ; CI PR couvre la suite complète.)

**Smokes ajoutés/modifiés** : `test/army-training.smoke.spec.ts` — 3 cas : queue multi-type + auto-start ; cancel tête → promotion ; cancel attente → tête intacte.

**QA fonctionnelle agent** : couverte par les smokes (boot app réelle + REST + worker pg-boss + outbox + DB). Pas de QA manuelle séparée nécessaire.

**Tests IG à faire par le user** :
- [ ] Caserne : lancer MILICE puis GUERRIER → les 2 apparaissent dans la file, MILICE s'entraîne, GUERRIER en attente.
- [ ] À la fin de MILICE, GUERRIER démarre seul sans action.
- [ ] Annuler la formation active → la suivante démarre ; annuler une en attente → l'active continue.

### Dette notée (hors scope)

- Résilience reboot : crash worker entre `delete` tête et `boss.send` suivant ⇒ suivant orphelin sans job (MVP, fiche L54).
- Drift pré-existant repo : FK `onboarding_state_narrative_target_village_id_fkey` présent en migration mais sans `@relation` dans le schema → restauré à l'identique, non traité ici.
