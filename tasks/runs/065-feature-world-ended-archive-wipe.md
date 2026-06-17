# Run #065 — world-ended-archive-wipe

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle (`tasks/00-mvp-roadmap.md` § Phase 11)
- **Spec source** :
  - `docs/gameplay/19-world-lifecycle.md` § « `LOCKED → ENDED` » lignes 99-107 (« Le monde reste consultable 🔧 7 j en `ENDED` puis archivé — données conservées pour stats globales, plus accessibles depuis l'UI »).
  - `docs/gameplay/19-world-lifecycle.md` § « Wipe et récompenses fin de monde » lignes 109-121 (table « royaume / ressources / couronnes archivés puis purgés ; stats personnelles conservées »).
- **Type** : feature
- **Modules** :
  - backend : `src/workers/world-lifecycle.worker.ts`, `src/modules/world/world.service.ts`, helper `assertWorldWritable` livré par run 061, `prisma/schema.prisma` (enum + colonne `archivedAt`).
  - frontend : aucun changement direct (`GET /worlds/public` exclut déjà `ARCHIVED` via `PublicWorldStatusSchema`). Vérification ciblée sur la liste « Mes royaumes » (memberships).
  - shared : `packages/shared/src/world/schemas.ts` (`archiveAfterDays: 7` dans `WorldLifecycleSchema`).

## Dépendances

- Run [`061-feature-world-ended-lifecycle`](./061-feature-world-ended-lifecycle.md) — **PLANNED, doit être DONE avant**. Livre (a) la transition `LOCKED → ENDED` + snapshot atomique du leaderboard (`WorldFinalRankingSnapshot`), (b) le helper `assertWorldWritable` que ce run étend à `ARCHIVED`, (c) la liste exhaustive des mutations protégées.
- Run [`032-world-lifecycle-foundation-and-identity`](./archive/032-world-lifecycle-foundation-and-identity.md) — DONE. Base réutilisée : worker pg-boss, `enum WorldStatus`, event `world.status.changed`.

## Critère de fin (acceptance)

- [ ] Migration Prisma additive : `enum WorldStatus { PLANNED, OPEN, LOCKED, ENDED, ARCHIVED }` + colonne `world.archived_at: DateTime?` (audit indépendant du status).
- [ ] `WorldLifecycleWorker.handleLifecycleTick` ajoute `archiveEndedWorlds(now)` après `endExpiredWorlds`, sélectionne `status = 'ENDED' AND endsAt + archiveAfterDays * 1d <= now`, transitionne `ENDED → ARCHIVED` dans une **`$transaction` Prisma unique** qui (a) purge les entités joueur listées ci-dessous, (b) update `status` + `archivedAt`, (c) émet `world.status.changed` via Outbox (`{ from: 'ENDED', to: 'ARCHIVED' }`).
- [ ] **Entités purgées** dans la transaction : `Village` (+ cascades `Building`, `ResourceStock`, `Population`, `UnitInventory`, `UnitTraining`, `VillageStrategyConfig`, `Garrison`, `PendingConquest`), `Expedition` du monde (purge explicite — pas de cascade FK), `WorldSeedState`, `ChunkSpawnState`, `ZoneCapacity`, `CrownBalance` du monde, `DailyCard` (+ `DailyCardTask`), `DailyOyez`, `OnboardingState` (+ `OnboardingStepProgress`).
- [ ] **Entités conservées** : `User`, `WorldMembership` (cf. § Points d'attention), `CombatReport`, `ScoutReport`, `ReinforcementReport`, `CaravanReport`, `InboxEntry`, `GloryLedger`, `WorldFinalRankingSnapshot` (livré par 061), `World` lui-même (`status = ARCHIVED`, conservé pour FK rapports).
- [ ] `GET /worlds/public` continue d'exclure les mondes `ARCHIVED` (filtre actuel `['PLANNED','OPEN','LOCKED']` suffit — vérifier intact).
- [ ] `assertWorldWritable(worldId)` (livré par run 061) rejette **toute** mutation sur monde `ARCHIVED` avec le même code `WORLD_READ_ONLY` que pour `ENDED` (extension d'1 ligne).
- [ ] `touchUserMembership` (`world.service.ts:194`) rejette `ARCHIVED` au même titre que `ENDED`.
- [ ] Smoke backend dédié `test/world-archive.smoke.spec.ts` : seed monde, fast-forward à `endsAt + archiveAfterDays + 1ms`, tick worker, assert (a) `world.status === 'ARCHIVED'` + `archivedAt` non nul, (b) `count(village WHERE worldId = X) === 0`, (c) `count(combatReport WHERE worldId = X) > 0` (conservation), (d) `count(worldFinalRankingSnapshot WHERE worldId = X) > 0` (conservation snapshot 061), (e) `GET /worlds/public` ne liste plus le monde, (f) `initiateAttack` retourne 403 `WORLD_READ_ONLY`.
- [ ] Unit pure-logic ≥ 1 : `resolveWorldLifecycleConfig` lit `archiveAfterDays` avec default 7 ; calcul `archiveAt = endsAt + archiveAfterDays` déterministe.
- [ ] `yarn static-check` + `yarn test:backend` + `yarn test:smoke` verts.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-prisma`, `bftc-workers-outbox`, `bftc-qa`

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- T1 — Shared : ajouter `archiveAfterDays: 7` à `DEFAULT_WORLD_LIFECYCLE_CONFIG` et `WorldLifecycleSchema` (`packages/shared/src/world/schemas.ts`). Rebuild shared.
- T2 — Migration Prisma : `enum WorldStatus` étendu avec `ARCHIVED` + colonne `archived_at` sur `world`. `prisma migrate dev --name add_world_archived_status`. Vérifier les 3 index existants sur `status` (lignes 154-156 schema) restent valides.
- T3 — Audit cascades : recenser dans `schema.prisma` toutes les FK `worldId` ou indirectes via `villageId` ; produire la matrice « purgé via cascade / purgé via `deleteMany` explicite dans la tx / conservé ». Sécuriser les exceptions (rapports, `GloryLedger`, snapshot final — pas dépendants de `World` côté FK).
- T4 — Worker : `archiveEndedWorlds(now)` + méthode privée `archiveWorld(worldId)` qui orchestre la `$transaction` complète (purge ordonnée + status + outbox). ≤ 5 fichiers : `world-lifecycle.worker.ts` + spec dédiée.
- T5 — Helper read-only : étendre `assertWorldWritable` livré par 061 pour rejeter `ARCHIVED` + étendre `touchUserMembership` (1 ligne chacun). 2 fichiers.
- T6 — Tests : Vitest unit sur `archiveAt = endsAt + archiveAfterDays` ; spec worker isolée (mock prisma) sur sélection + ordre de purge ; smoke backend end-to-end.
- T7 — Docs impact : `docs/architecture/backend-modules.md` (worker, helper étendu), `docs/architecture/data-model.md` (enum + colonne `archivedAt`), `docs/gameplay/19-world-lifecycle.md` (ajouter 5e ligne `ARCHIVED` au tableau des status ou note brève qui pointe vers `data-model.md`). Pas de duplication doc (cf. `docs/AGENTS.md`).

## Points d'attention

- **Choix design ARCHIVED vs `archivedAt` nullable seul** — recommandation : **Piste A (status `ARCHIVED`) + colonne `archivedAt` redondante**. Justifications : (a) cohérence avec les 4 status existants tous représentés dans l'enum, (b) `archivedAt` seul oblige tous les call-sites status-aware à apprendre une 5e règle (status `ENDED` ET `archivedAt` nullable), (c) l'enum est filtrable via les 3 index Prisma déjà en place, (d) la migration enum Postgres est additive et sans downtime (`ALTER TYPE ... ADD VALUE 'ARCHIVED'`), (e) `archivedAt` reste utile pour l'audit (« quand a-t-on archivé ») sans coût ergonomique puisqu'il n'est pas la source de vérité du gating. Contrat public verrouillé via `PublicWorldStatusSchema = z.enum(['PLANNED','OPEN','LOCKED'])` côté shared, donc `ARCHIVED` n'expose rien au frontend.
- **Sort de `WorldMembership` à l'archive** — non tranché par la spec. Trade-off : (a) **conserver** permet le futur affichage profil global « mondes joués » sans table dédiée ; (b) **purger** est cohérent avec « reset complet ». **Recommandation : conserver** — `villageCount = 0` après purge `Village` reflète déjà l'état « plus de royaume sur ce monde », et la pose des futures récompenses cosmétiques (titre/bannière/badge) bénéficiera de la relation user×world persistée. À acter à l'étape 1 du run.
- **Sort des `Expedition` en vol** — la fenêtre de 7 j en lecture seule pendant `ENDED` laisse rarement des expéditions actives ; mais `Expedition.attackerVillageId` n'a pas de relation Prisma explicite (cf. schéma lignes 480-515), **pas de cascade**. Purge explicite à l'archive — `expedition.deleteMany({ where: { worldId } })` dans la tx.
- **Volumétrie de la transaction** — sur monde mature (~200 joueurs, ~1k villages), la suppression cascade peut tenir 1-5 s en transaction. Mesurer en smoke ; sinon paginer (mais perte d'atomicité). À surveiller.
- **Idempotence et rollback** — la `$transaction` Prisma garantit l'atomicité. Vérifier qu'aucun `deleteMany` n'est en dehors de `tx`. Un échec partiel doit laisser `status = ENDED` intact.
- **Couronnes vs compte global** — `CrownBalance` est aujourd'hui `(userId, worldId)`. Conforme à la spec « Couronnes accumulées : reset ». Vérifier qu'il n'existe pas de table couronnes globales.
- **Outbox event** — réutilisation de `world.status.changed` avec `to: 'ARCHIVED'` cohérent avec le pattern run 032, plutôt qu'un nouvel event `world.archived`.
- **Doc gameplay 19** — la spec parle de « 7 j puis archivé » sans tracer la transition dans le tableau des status (4 lignes). Ajouter une 5e ligne `ARCHIVED` ou une note brève renvoyant vers `data-model.md`. Préférence : note brève pour éviter la duplication.

## Review indépendante

**Requise** — critères déclencheurs : purge destructive durable + invariant lifecycle backend + transverse 6+ modules backend (worker, world, prisma, helper, outbox, smoke). Pas de couplage front, mais l'impact data est définitif.

## Progress

_(Vide au démarrage. Sera rempli par `$bftc-run`.)_

## Décisions prises

_(Vide au démarrage. Sera rempli par `$bftc-run`.)_

## Rapport final

### Acceptance & QA

- [ ] Migration appliquée : `psql -c "SELECT unnest(enum_range(NULL::\"WorldStatus\"));"` → liste contient `ARCHIVED`.
- [ ] Worker transitionne `ENDED → ARCHIVED` à `endsAt + 7j` : smoke `test/world-archive.smoke.spec.ts`.
- [ ] Purge effective : assert SQL `count(village WHERE worldId = X) = 0` après tick.
- [ ] Conservation rapports + snapshot : assert SQL `count(combatReport WHERE worldId = X) > 0` et `count(worldFinalRankingSnapshot WHERE worldId = X) > 0`.
- [ ] Lecture seule étendue : `curl -X POST .../combat/attack` sur monde ARCHIVED → 403 `WORLD_READ_ONLY`.
- [ ] `GET /worlds/public` ne liste pas le monde ARCHIVED.
- **Review indépendante** : requise (purge destructive + transverse backend).
- **Tests automatisés** : Vitest unit (config + calcul date) + spec worker mock prisma + smoke backend end-to-end.
- **Tests IG user** : aucun — Kelvin valide via la checklist QA backend (smoke vert + assertions SQL ci-dessus suffisent).
