# Run #065 — world-ended-archive-wipe

> **Statut** : DONE
> **Démarré** : 2026-06-25
> **Terminé** : 2026-06-25

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

## Décomposition initiale & Points d'attention

_(git history)_ — la majorité du scaffolding shared (`archiveAfterDays`, `deriveWorldArchiveAt`, exclusion ARCHIVED de `GET /world/me/memberships`, `touchUserMembership`) avait été posée en anticipation par 061/runs amont. Reste livré : enum event, migration, worker purge, guards reads.

## Décisions prises (synthèse)

- **`World` conservé** (status `ARCHIVED`, pas de `delete`) → les cascades `onDelete` depuis `World` ne se déclenchent pas ; rapports/snapshot/memberships/gloire/renown/cosmétiques survivent. Purge = `deleteMany` explicite des tables `worldId` dénormalisées + `Village` en dernier (cascade ses 8 enfants).
- **VillageIntel purgé** (gap fiche) — intel éphémère par-village, dénormalisé, sans FK → `deleteMany`.
- **RenownLedger conservé** (gap fiche) — `worldId` nullable, XP cross-monde, cascade `User` seulement.
- **Aucun changement frontend** — le backend exclut déjà les mondes ARCHIVED de la liste memberships (`PublicWorldStatusSchema.safeParse → []`), donc `pickLastPlayedMembership` ne peut structurellement pas router vers un monde archivé (branche « OU exclut les archivés » de la fiche).

## Rapport final

### Acceptance & QA

- [x] Migration `ARCHIVED` + `archived_at` — `migration.sql` + `enum_range` contient ARCHIVED. `migrate deploy` (template smoke) vert ; `migrate dev` impossible (drift run 068 préexistant) → migration écrite à la main.
- [x] Worker `ENDED → ARCHIVED` à `endsAt + archiveAfterDays` + purge atomique — smoke `test/world-archive.smoke.spec.ts` (`result.endedToArchived === 1`).
- [x] Purge effective + cascade Village — smoke : `village/crownBalance/dailyCard/villageIntel/expedition/building/population count = 0`.
- [x] Conservation durables — smoke : `combatReport > 0`, `worldFinalRankingSnapshot > 0`, `worldMembership = 2`.
- [x] Lecture seule ARCHIVED — `assertWorldWritable(worldId)` rejette `WORLD_READ_ONLY` (smoke 7f, asserté direct : post-purge le combat REST 404 sur village absent avant la garde).
- [x] `GET /worlds/public` exclut ARCHIVED — smoke 7e.
- [x] Reads side-effecting blindés — smoke 7g : `getCrownBalance`/`getSummary` post-purge ne recréent rien (counts restent 0).
- [x] Idempotence — smoke 7h : 2e tick `endedToArchived = 0`, event count stable à 1.
- **Review indépendante** : Déclenchée (raison: purge destructive durable + transverse backend + diff > 100 l). Verdict **GO**, 0 bloquant/majeur, 3 mineurs logués (test Pixi resume = risque éliminé backend ; double-garde idempotence intentionnelle ; smoke snapshot robuste).
- **Tests automatisés** : `yarn workspace battleforthecrown-backend test` → 509 verts. Unit pure-logic `deriveWorldArchiveAt` (existant) couvre `archiveAt = endsAt + archiveAfterDays` default 7.
- **Smokes lancés** : Ciblés — `world-archive crowns daily-retention world-ended-lifecycle worlds-public world-membership world-inscription-phase world-lifecycle-spawner` → 27 verts. Full suite = CI PR.
- **Smokes ajoutés** : `test/world-archive.smoke.spec.ts` (purge/conservation/read-only/idempotence/no-recreate + gate fenêtre archive). `worlds-public.smoke` mis à jour (nouveau champ `endedToArchived`).
- **QA fonctionnelle agent** : smoke end-to-end (worker réel + DB + Outbox) = preuve suffisante.
- **Tests IG user** : aucun — comportement 100 % data/backend, couvert par smoke + assertions SQL.

**Docs** : mises à jour `realtime.md`, `data-model.md`, `backend-modules.md`, `gameplay/19-world-lifecycle.md` (transition ARCHIVED + matrice purge/conservation).
