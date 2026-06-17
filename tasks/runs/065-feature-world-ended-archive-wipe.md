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
  - backend : `src/workers/world-lifecycle.worker.ts`, `src/modules/world/world.service.ts`, helper `assertWorldWritable` livré par run 061, `prisma/schema.prisma` (enum + colonne `archivedAt`). **Reads side-effecting à garder du `ARCHIVED`** : `src/modules/crowns/crowns.service.ts` (`getCrownBalance` upsert), `src/modules/retention/retention.service.ts` (`getSummary` crée la carte du jour) — sans guard, un refresh HUD/API post-purge recrée les données reset.
  - frontend : `battleforthecrown-pixi/src/features` — `WorldSessionGate` / `pickLastPlayedMembership` filtrer les memberships `ARCHIVED` pour ne pas y router le joueur (sinon village count = 0 → `LostKingdomScreen` sur un monde inaccessible). Endpoint `GET /world/me/memberships` côté backend doit exposer le statut `ARCHIVED` ou exclure les mondes archivés.
  - shared : `packages/shared/src/world/schemas.ts` (`archiveAfterDays: 7` dans `WorldLifecycleSchema`) **et** `packages/shared/src/events/schemas.ts` + `events/types.ts` — étendre l'enum payload `world.status.changed` (actuellement `PLANNED | OPEN | LOCKED | ENDED`) à `ARCHIVED`, sinon l'Outbox dispatcher rejette l'event au parse.

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
- [ ] **Reads side-effecting blindés sur `ARCHIVED`** : `CrownsService.getCrownBalance()` (`crowns.service.ts:60-80`) et `RetentionService.getSummary()` (`retention.service.ts:49-58`) court-circuitent l'upsert/la création de carte si le monde est `ARCHIVED` (refresh HUD/API post-purge ne recrée jamais les données). Auditer toute autre méthode lecture qui fait un `upsert`/`create` paresseux scopé monde (auth, daily-card task progress, etc.) et appliquer le même guard.
- [ ] **Shared event schema étendu** : `packages/shared/src/events/schemas.ts:256-260` + `events/types.ts:262-265` — `world.status.changed` accepte `to: 'ARCHIVED'` (et `from: 'ENDED'`). Test WS dédié : l'Outbox dispatcher parse et émet l'event sans rejet. Sans ça, la transition `ENDED → ARCHIVED` est silencieusement perdue.
- [ ] **Memberships filtrées côté UI** : `WorldSessionGate` (`pickLastPlayedMembership`) ignore les memberships dont le monde est `ARCHIVED`. Endpoint `GET /world/me/memberships` expose le statut monde ou exclut les `ARCHIVED`. Test Pixi : un joueur dont la dernière session était sur un monde archivé est routé vers la sélection de monde, pas vers `LostKingdomScreen`.
- [ ] Smoke backend dédié `test/world-archive.smoke.spec.ts` : seed monde, fast-forward à `endsAt + archiveAfterDays + 1ms`, tick worker, assert (a) `world.status === 'ARCHIVED'` + `archivedAt` non nul, (b) `count(village WHERE worldId = X) === 0`, (c) `count(combatReport WHERE worldId = X) > 0` (conservation), (d) `count(worldFinalRankingSnapshot WHERE worldId = X) > 0` (conservation snapshot 061), (e) `GET /worlds/public` ne liste plus le monde, (f) `initiateAttack` retourne 403 `WORLD_READ_ONLY`, (g) `getCrownBalance` post-purge **ne recrée pas** la ligne `CrownBalance` (count reste à 0), (h) `getSummary` post-purge ne recrée pas de `DailyCard`.
- [ ] Unit pure-logic ≥ 1 : `resolveWorldLifecycleConfig` lit `archiveAfterDays` avec default 7 ; calcul `archiveAt = endsAt + archiveAfterDays` déterministe.
- [ ] `yarn static-check` + `yarn test:backend` + `yarn test:smoke` verts.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-prisma`, `bftc-workers-outbox`, `bftc-qa`

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- T1 — Shared : ajouter `archiveAfterDays: 7` à `DEFAULT_WORLD_LIFECYCLE_CONFIG` et `WorldLifecycleSchema` (`packages/shared/src/world/schemas.ts`) **+ étendre l'enum payload `world.status.changed` à `ARCHIVED`** dans `packages/shared/src/events/schemas.ts` + `events/types.ts`. Rebuild shared.
- T2 — Migration Prisma : `enum WorldStatus` étendu avec `ARCHIVED` + colonne `archived_at` sur `world`. `prisma migrate dev --name add_world_archived_status`. Vérifier les 3 index existants sur `status` (lignes 154-156 schema) restent valides.
- T3 — Audit cascades : recenser dans `schema.prisma` toutes les FK `worldId` ou indirectes via `villageId` ; produire la matrice « purgé via cascade / purgé via `deleteMany` explicite dans la tx / conservé ». Sécuriser les exceptions (rapports, `GloryLedger`, snapshot final — pas dépendants de `World` côté FK).
- T4 — Worker : `archiveEndedWorlds(now)` + méthode privée `archiveWorld(worldId)` qui orchestre la `$transaction` complète (purge ordonnée + status + outbox). ≤ 5 fichiers : `world-lifecycle.worker.ts` + spec dédiée.
- T5 — Helper read-only : étendre `assertWorldWritable` livré par 061 pour rejeter `ARCHIVED` + étendre `touchUserMembership` (1 ligne chacun). **Ajouter un guard `ARCHIVED` au début de `CrownsService.getCrownBalance()` (early return ou throw selon contrat) et de `RetentionService.getSummary()` pour bloquer les upserts/créations paresseuses post-purge.** Audit grep ciblé sur `upsert`/`create` dans les services scopés monde pour exhaustivité. ~4-5 fichiers.
- T5b — Frontend resume flow : `WorldSessionGate` filtre les memberships `ARCHIVED` avant `pickLastPlayedMembership`. Exposer le statut monde dans `GET /world/me/memberships` (DTO `MembershipWithWorldStatus`) si pas déjà fait. Test Pixi : dernière session archivée → écran `/worlds` (pas `LostKingdomScreen`). 2-3 fichiers.
- T6 — Tests : Vitest unit sur `archiveAt = endsAt + archiveAfterDays` ; spec worker isolée (mock prisma) sur sélection + ordre de purge ; smoke backend end-to-end.
- T7 — Docs impact : `docs/architecture/backend-modules.md` (worker, helper étendu), `docs/architecture/data-model.md` (enum + colonne `archivedAt`), `docs/gameplay/19-world-lifecycle.md` (ajouter 5e ligne `ARCHIVED` au tableau des status ou note brève qui pointe vers `data-model.md`). Pas de duplication doc (cf. `docs/AGENTS.md`).

## Points d'attention

- **Choix design ARCHIVED vs `archivedAt` nullable seul** — recommandation : **Piste A (status `ARCHIVED`) + colonne `archivedAt` redondante**. Justifications : (a) cohérence avec les 4 status existants tous représentés dans l'enum, (b) `archivedAt` seul oblige tous les call-sites status-aware à apprendre une 5e règle (status `ENDED` ET `archivedAt` nullable), (c) l'enum est filtrable via les 3 index Prisma déjà en place, (d) la migration enum Postgres est additive et sans downtime (`ALTER TYPE ... ADD VALUE 'ARCHIVED'`), (e) `archivedAt` reste utile pour l'audit (« quand a-t-on archivé ») sans coût ergonomique puisqu'il n'est pas la source de vérité du gating. Contrat public verrouillé via `PublicWorldStatusSchema = z.enum(['PLANNED','OPEN','LOCKED'])` côté shared, donc `ARCHIVED` n'expose rien au frontend.
- **Sort de `WorldMembership` à l'archive** — non tranché par la spec. Trade-off : (a) **conserver** permet le futur affichage profil global « mondes joués » sans table dédiée ; (b) **purger** est cohérent avec « reset complet ». **Recommandation : conserver** — `villageCount = 0` après purge `Village` reflète déjà l'état « plus de royaume sur ce monde », et la pose des futures récompenses cosmétiques (titre/bannière/badge) bénéficiera de la relation user×world persistée. À acter à l'étape 1 du run.
- **Sort des `Expedition` en vol** — la fenêtre de 7 j en lecture seule pendant `ENDED` laisse rarement des expéditions actives ; mais `Expedition.attackerVillageId` n'a pas de relation Prisma explicite (cf. schéma lignes 480-515), **pas de cascade**. Purge explicite à l'archive — `expedition.deleteMany({ where: { worldId } })` dans la tx.
- **Volumétrie de la transaction** — sur monde mature (~200 joueurs, ~1k villages), la suppression cascade peut tenir 1-5 s en transaction. Mesurer en smoke ; sinon paginer (mais perte d'atomicité). À surveiller.
- **Idempotence et rollback** — la `$transaction` Prisma garantit l'atomicité. Vérifier qu'aucun `deleteMany` n'est en dehors de `tx`. Un échec partiel doit laisser `status = ENDED` intact.
- **Couronnes vs compte global** — `CrownBalance` est aujourd'hui `(userId, worldId)`. Conforme à la spec « Couronnes accumulées : reset ». Vérifier qu'il n'existe pas de table couronnes globales.
- **Outbox event** — réutilisation de `world.status.changed` avec `to: 'ARCHIVED'` cohérent avec le pattern run 032, plutôt qu'un nouvel event `world.archived`. **Attention** : le contrat shared (`events/schemas.ts:256-260` + `events/types.ts:262-265`) ne liste actuellement que `PLANNED | OPEN | LOCKED | ENDED`. Sans extension dans T1, l'Outbox dispatcher rejette l'event au parse et la transition est silencieusement perdue.
- **Reads side-effecting** — `CrownsService.getCrownBalance()` upsert si absent, `RetentionService.getSummary()` crée la carte du jour. Sans guard `ARCHIVED`, n'importe quel refresh HUD/API post-purge recrée des `CrownBalance` / `DailyCard` orphelins, rendant la purge non-durable. T5 doit couvrir ce chemin **et** auditer les autres services pour des upserts paresseux similaires.
- **Resume flow frontend** — `WorldSessionGate` choisit `pickLastPlayedMembership(memberships.data ?? [])` sans connaître le statut du monde. Si la dernière session du joueur était sur le monde fraîchement archivé, le frontend route vers `LostKingdomScreen` (village count = 0) sur un monde inaccessible. T5b filtre les memberships archivées avant le pick.
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
