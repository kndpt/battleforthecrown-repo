# Run #068 — rankings-weekly-cycle-close-and-titles

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors phase numérotée — chantier d'animation Gloire pendant la durée d'un monde, complémentaire de la Phase 11 ENDED (`tasks/00-mvp-roadmap.md` § Phase 11 + spec 24).
- **Spec source** :
  - `docs/gameplay/24-rankings.md` § « Cycles » (lignes 106-115) + § « Rewards » (lignes 117-129) — cycle court hebdo MVP + titre temporaire sur le cycle suivant + badge public.
  - `docs/gameplay/23-world-tempo-and-multipliers.md` — sémantique tempo (la cadence hebdo doit rester wall-clock alignée par défaut, mais le tempo peut compresser les seuils d'animation si désiré).
- **Type** : feature
- **Modules** :
  - backend `modules/rankings/`, `workers/rankings-cycle.worker.ts` (nouveau), `prisma/schema.prisma` + migration
  - shared `packages/shared/src/rankings/` (types + constantes cycle + libellés titre)
  - frontend `battleforthecrown-pixi/src/features/rankings/RankingsScreen.tsx`, `battleforthecrown-pixi/src/features/design-system/components/PlayerProfileSheet.tsx`, query TanStack dédiée

## Dépendances

- Run [`051-feature-rankings-glory`](archive/051-feature-rankings-glory.md) — DONE. A livré `GloryLedger` + `RankingsService.getGloryLeaderboard` + cutoff glissant `getWeeklyCutoff()`. Ce run remplace ce cutoff glissant par une **frontière de cycle persistée** et lui adosse un mécanisme de clôture.
- Run [`067-feature-world-ended-cosmetic-permanent-rewards`](067-feature-world-ended-cosmetic-permanent-rewards.md) — PLANNED. Couvre les awards **permanents** à `ENDED`. Périmètre disjoint (cosmétique permanent fin de monde ≠ titre temporaire de cycle hebdo). Aucun ordre imposé entre les deux runs.

## Contexte

La spec 24 § Cycles tranche MVP : deux lectures coexistent, la « vue hebdomadaire » crée de l'animation pendant le monde, le « monde entier » donne le hall of fame final. Le run 051 a livré le runtime des trois leaderboards mais s'appuie sur un cutoff glissant `now − 7j` (`rankings.service.ts:18,261-263`), jamais aligné sur une frontière de cycle. Conséquence concrète :

- Aucun « Champion de la semaine N » figé : un joueur qui prend la tête vendredi soir et perd ses points le jeudi suivant n'a jamais existé officiellement.
- Aucune persistance des champions hebdo → la promesse spec « titre temporaire sur le cycle suivant » n'a pas d'écriture DB.
- Aucun badge public sur la fiche joueur → la spec § Rewards (« badge public sur la fiche joueur ») reste lettre morte.
- Aucun bandeau « cycle en cours / champion sortant » sur l'écran rankings → la rétention compétitive promise est invisible.

Le runtime existant est conservé en lecture vivante (live leaderboard). Ce run ajoute la couche de **clôture officielle** + **attribution de titre temporaire** + **affichage public** par-dessus.

## Critère de fin (acceptance)

- [ ] Migration Prisma crée `GloryCycleSnapshot` avec : `id`, `worldId` (FK), `signal` (enum `ASSAULT_GLORY` | `RAMPART_GLORY`), `cycleIndex` (int, 1-based, monotone par `worldId × signal`), `cycleStartAt` (DateTime UTC), `cycleEndAt` (DateTime UTC, exclusif), `closedAt`, `entries` (JSONB : `[{userId, displayName, score, rank}]`, top N fixé à 20 par défaut), unique `(worldId, signal, cycleIndex)`, index `(worldId, signal, cycleEndAt)`.
- [ ] Migration Prisma crée `RankingCycleTitleAward` avec : `id`, `userId` (FK), `worldId` (FK), `signal` (enum `ASSAULT_GLORY` | `RAMPART_GLORY`), `cycleIndex` (int, ref logique `GloryCycleSnapshot.cycleIndex`), `cycleEndAt` (snapshot copie pour lecture rapide), `validUntilAt` (DateTime UTC, = `cycleEndAt` du cycle suivant), `awardedAt`, unique `(userId, worldId, signal, cycleIndex)`, index `(userId, validUntilAt)`.
- [ ] Worker `RankingsCycleWorker` (pg-boss singleton, tick horaire) ferme **tous** les cycles hebdo échus pour tous les mondes OPEN/LOCKED : pour chaque (`worldId`, `signal`), **boucle tant qu'il existe** au moins un cycle dont `cycleEndAt <= now` et qui n'a pas de `GloryCycleSnapshot`, et le snapshote en une transaction Prisma (lecture du leaderboard sur la fenêtre `[cycleStartAt, cycleEndAt)`, écriture du snapshot, attribution du `RankingCycleTitleAward` au rang 1 avec `score > 0`). Garantit le rattrapage multi-cycles en un seul tick si plusieurs ticks ont été manqués (downtime worker, latence pg-boss).
- [ ] **Frontière de cycle** : alignée **Lundi 00:00 UTC** par défaut (configurable via `WorldConfig.rankings.weeklyCycleResetDayUtc = 1` + `weeklyCycleResetHourUtc = 0` dans `packages/shared/src/world/schemas.ts`). Le `cycleIndex 1` démarre au premier Lundi 00:00 UTC **à partir** de `world.createdAt` (borne **inclusive** — un monde créé exactement à Lundi 00:00 UTC ouvre son `cycleIndex 1` immédiatement) ; pré-cycle (entre createdAt et premier lundi, durée 0 à <7j) ne donne pas lieu à snapshot.
- [ ] Tiebreaker rank 1 : si plusieurs joueurs partagent `score` au rang 1, tous reçoivent le titre. Score = 0 → aucun titre attribué (cas monde sans PvP cette semaine).
- [ ] Idempotence : second tick du worker sur un cycle déjà snapshotté = no-op (contrainte unique `(worldId, signal, cycleIndex)`).
- [ ] `RankingsService.getGloryLeaderboard(worldId, signal, 'WEEKLY')` lit désormais le **cycle courant** (fenêtre `[cycleStartAt, cycleEndAt)`) au lieu d'un cutoff glissant ; pour cohérence le pré-cycle (avant premier lundi) reste sur cutoff glissant `7j` en repli explicite (jamais snapshotté).
- [ ] Endpoint `GET /worlds/:worldId/rankings/cycles/current` retourne `{ signal, cycleIndex, cycleStartAt, cycleEndAt, lastClosedSnapshot?: { cycleIndex, entries[0..2] } }` pour les deux signaux Gloire (POWER reste live, hors cycle).
- [ ] Endpoint `GET /users/me/ranking-titles` retourne la liste des titres actifs (`validUntilAt > now`) **et** historiques (`validUntilAt <= now`) du joueur connecté, triée `awardedAt DESC`, avec `worldDisplayName` snapshot + `signal` + `cycleIndex` + libellé FR (`Champion d'Assaut · Semaine 3 · Avalon`).
- [ ] Catalogue libellés FR centralisé dans `packages/shared/src/rankings/` (extension de `RANKING_SIGNAL_LABELS` existant) : `RANKING_CYCLE_TITLE_LABELS = { ASSAULT_GLORY: 'Champion d'Assaut', RAMPART_GLORY: 'Champion du Rempart' }`.
- [ ] `RankingsScreen` affiche un bandeau « Semaine en cours · clôture <date FR> · meneur <playerName> » + sous l'onglet hebdo, lien « Voir le champion sortant (Semaine N-1) » qui ouvre une sheet listant le top 3 de la semaine précédente issu du snapshot.
- [ ] `PlayerProfileSheet` affiche une section « Titres » montrant les titres actifs (badge coloré or/argent/bronze selon signal, libellé FR, monde) + chevron vers l'historique complet (si > 3 titres). Vide → section masquée.
- [ ] Event Outbox `rankings.cycle.closed` émis à chaque clôture de cycle pour permettre invalidation TanStack côté front (queries `rankings`, `ranking-titles`).
- [ ] Wipe destructeur (run 065) ne supprime **pas** la table `RankingCycleTitleAward` (titres permanents par construction, comme les awards run 067). `GloryCycleSnapshot` est lié au monde et peut être purgé avec le wipe — à acter dans le run 065.
- [ ] Smoke backend : fast-forward 2 semaines sur un monde avec scoring PvP fictif, assert **4** `GloryCycleSnapshot` créés (2 semaines × 2 signaux Gloire), assert `RankingCycleTitleAward` créé pour les top 1 par semaine et par signal, endpoint `/users/me/ranking-titles` retourne 200 + entrées attendues, endpoint `/worlds/:worldId/rankings/cycles/current` retourne le cycle en cours.
- [ ] Unit pure-logic (Vitest, ≥ 2) : (1) calcul des frontières de cycle aligné Lundi 00:00 UTC à partir d'un `world.createdAt` donné + `cycleIndex` ; (2) résolution top-1-par-signal avec tiebreaker + score = 0.
- [ ] `yarn static-check` + `yarn test:backend` + `yarn test:pixi` verts.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-prisma`, `bftc-workers-outbox`, `bftc-react-hud`

## Décomposition initiale

_(Lead étape 3 — tâches ≤ 5 fichiers)_

- T1 — Migration Prisma : modèles `GloryCycleSnapshot` + `RankingCycleTitleAward` + uniques + index + `prisma generate`.
- T2 — Shared `packages/shared/src/rankings/` : type `RankingCycleTitleDto` + `GloryCycleSnapshotDto` + helper pur `computeCycleBoundaries(worldCreatedAt, cycleIndex, { resetDayUtc, resetHourUtc })` + constantes `WEEKLY_CYCLE_DEFAULT_RESET_DAY_UTC = 1` + libellés FR `RANKING_CYCLE_TITLE_LABELS`. Unit tests sur `computeCycleBoundaries` (semaine d'inscription, semaine pleine, transition DST → invariante car UTC, etc.).
- T3 — Shared `packages/shared/src/world/schemas.ts` : extension de `WorldConfigSchema` avec section `rankings: { weeklyCycleResetDayUtc, weeklyCycleResetHourUtc, snapshotEntriesPerCycle }` (defaults). Backfill SQL non requis (default appliqué à la lecture, optional config).
- T4 — Backend `RankingsCycleService.closeDueCycles(now)` : itère mondes OPEN/LOCKED, pour chaque (`worldId`, `signal`) calcule le dernier cycle dû et batch en transaction (snapshot + title). Unit test sur la résolution top-1 + tiebreaker + score 0.
- T5 — Backend `RankingsCycleWorker` (pg-boss tick horaire, singleton) appelle `closeDueCycles(now)`. Backend `RankingsService.getGloryLeaderboard` bascule sur fenêtre cycle courant. Event Outbox `rankings.cycle.closed` émis dans la transaction.
- T6 — Endpoint REST `GET /worlds/:worldId/rankings/cycles/current` + `GET /users/me/ranking-titles` + DTO + query TanStack côté front. Auth requise.
- T7 — Frontend `RankingsScreen` : bandeau cycle en cours + lien « champion sortant ». `PlayerProfileSheet` : section « Titres » avec badges. Composant partagé `RankingTitleBadge` dans `design-system`.
- T8 — Smoke backend dédié `rankings-cycle.smoke.spec.ts` + doc impact :
  - `docs/architecture/data-model.md` mention `GloryCycleSnapshot` + `RankingCycleTitleAward`
  - `docs/gameplay/24-rankings.md` § Cycles confirmer wall-clock Lundi 00:00 UTC + § Rewards lien vers la mécanique titre temporaire
  - `docs/gameplay/19-world-lifecycle.md` § Wipe ↔ noter que `RankingCycleTitleAward` survit au wipe destructeur (cosmétique permanent)

## Points d'attention

- **Frontière wall-clock vs tempo** : la spec 23 (tempo) compresse les durées de jeu (production, construction, capture). Décision MVP de ce run : la **cadence du cycle hebdo reste wall-clock** (Lundi 00:00 UTC) pour rester lisible socialement (« la semaine de jeu »). Si la communauté trouve la cadence trop lente sur un monde compressé, un `WorldConfig.rankings.weeklyCycleResetDayUtc` override est possible mais ce run ne livre pas l'UI de cette config — paramétrable via SQL en dur si besoin.
- **Pré-cycle** : entre `world.createdAt` et le premier Lundi 00:00 UTC suivant, aucun cycle n'est snapshotté (durée variable de 0 à 7 jours). `RankingsService.getGloryLeaderboard` retombe sur le cutoff glissant `7j` existant pour rester non-vide visuellement. Documenter ce repli explicitement.
- **Worker missed-tick** : si pg-boss est down 24h, plusieurs cycles peuvent être dus simultanément. `closeDueCycles` doit itérer en boucle tant que des cycles restent dus (et non snapshotter uniquement le plus récent), pour reconstruire l'historique sans trou. Smoke spec doit couvrir « 3 semaines à rattraper en un seul tick ».
- **Sécurité concurrence** : si deux instances du worker tournent simultanément (rare mais possible en HA), la contrainte unique `(worldId, signal, cycleIndex)` + `INSERT ... ON CONFLICT DO NOTHING` (ou catch + skip) protège. Pas de `pg_advisory_xact_lock` nécessaire grâce à la contrainte DB.
- **Lifecycle ENDED** : un monde `ENDED` n'a plus besoin de clôture hebdo (le snapshot final 067 a déjà gelé les classements). Le worker doit explicitement exclure `WorldStatus = 'ENDED'` ou `'ARCHIVED'` du scan.
- **Titre temporaire vs cosmétique permanent** : `RankingCycleTitleAward.validUntilAt` borne l'affichage « actif » mais l'entrée reste en DB → joueur peut consulter son historique de titres même après expiration. Distinct de `UserWorldCosmeticAward` (run 067) qui est attaché à la fin de monde uniquement.
- **Affichage profil mobile** : si un joueur a 8 cycles × 2 signaux = 16 titres après une vie de jeu, la section profil ne doit pas exploser la sheet. Limite : 3 titres actifs affichés + chevron historique complet (à designer post-MVP).
- **Multiplicateur adversaire et anti-farm** : la valeur `points` du `GloryLedger` est déjà calculée avec `applyPairDiminishingReturns` + `calculateOpponentMultiplier` (run 051). Le snapshot lit ces points effectifs, pas les `rawPoints` — anti-farm appliqué naturellement.
- **Top N snapshot** : 20 entrées par cycle (aligné sur le `limit` par défaut de `getGloryLeaderboard`). Configurable via `WorldConfig.rankings.snapshotEntriesPerCycle` pour les mondes spéciaux. Storage JSONB borné (< 20 × 200 octets = 4 KB par snapshot, négligeable).

## Hors scope explicite

- **Bannière + cadre de profil** : la spec 24 § Rewards cite « bannière ou cadre de profil ». Ce run livre uniquement le **titre textuel + badge coloré simple**. Assets visuels designés = follow-up post-MVP (cf. exclusion identique du run 067).
- **Bonus défensif temporaire au top 1 hebdo** : la spec 24 dit « Un bonus défensif temporaire peut être rouvert plus tard, mais il doit rester séparé de l'offensif et ne jamais financer directement les Seigneurs ou l'expansion. » → explicitement reporté post-MVP, ce run respecte « rewards cosmétiques uniquement ».
- **Titre POWER hebdo** : la spec § Rewards parle de titres pour les cycles. La Puissance du Royaume est **live**, pas cyclique (§ Puissance du Royaume : « live, non reset »). Ce run ne livre pas de « champion de la semaine » sur POWER — la spec ne le demande pas.
- **Notifications push fin de cycle** : un joueur top 1 pourrait être notifié à la clôture. Hors scope — la spec 16-notifications est elle-même en chantier. Suivra quand 16 sera livrée.
- **Vue « Hall of Fame » multi-mondes** : afficher l'historique complet des titres d'un joueur tous mondes confondus est livré côté DB (table cross-world) mais l'UI dédiée est hors scope. La fiche profil affiche les titres du **monde courant** uniquement au MVP.
- **Sondage / leaderboard public d'un autre joueur** : afficher les titres d'un joueur étranger via la fiche scout ou le rapport de combat = follow-up post-MVP (alignement avec 067 hors scope « affichage public »).

## Liens détectés (préflight)

- **À faire avant** : aucun. Run 051 (DONE) fournit déjà `GloryLedger` + le runtime des leaderboards.
- **À faire après** :
  - Ticket post-MVP « bannière + cadre de profil visuels champion hebdo » quand assets UI designés.
  - Ticket post-MVP « notification push fin de cycle » dépendant de la spec 16-notifications.
  - Ticket post-MVP « bonus défensif temporaire MVP+ » si la communauté demande un effet mécanique (à acter spec d'abord).
- **Connexe (contexte)** :
  - Run [`067-feature-world-ended-cosmetic-permanent-rewards`](067-feature-world-ended-cosmetic-permanent-rewards.md) — distinct (ENDED final vs hebdo temporaire) mais doivent partager la convention `<libellé champion> du monde X` et l'UI fiche profil (section unique « Récompenses » ou deux sections distinctes — à trancher au refinement entre les deux runs).
  - Run [`065-feature-world-ended-archive-wipe`](065-feature-world-ended-archive-wipe.md) — doit explicitement préserver `RankingCycleTitleAward` lors du wipe, et acter la purge ou conservation de `GloryCycleSnapshot`.
- **Doublon** : aucun. Le slug `world-ended-cosmetic-permanent-rewards` du JSON couvre ENDED uniquement ; ce run couvre la cadence hebdo runtime.
- **Déjà résolu** : non. Ticket archivé `tasks/archive/12-rankings-rewards-undefined.md` avait proposé 1500/1000/500 couronnes → **supersédé** par spec 24 cosmétiques uniquement. Ce run respecte la nouvelle direction (titre + badge, zéro reward économique).
- **Keywords scannés** : `rankings`, `gloire`, `weekly`, `cycle`, `titre`, `champion`, `hebdo`, `cosmetic-cycle`, `cycle-close`, `ranking-title`, `weekly-reset`.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : oui (critères déclencheurs : back+front + invariant durable « frontière de cycle hebdo wall-clock + titre temporaire » + diff estimé > 100 lignes).
- **Tests automatisés** : Vitest unit (`computeCycleBoundaries` + résolution top-1) + smoke backend (fast-forward 2 semaines + assert snapshots + assert titres + endpoints).
- **Tests IG user** : checklist FR ≤ 5 items pour Kelvin (bandeau cycle en cours visible, badge titre apparaît sur profil après simulation clôture, libellés FR, vide ne crashe pas).
