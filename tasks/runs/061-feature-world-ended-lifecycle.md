# Run #061 — world-ended-lifecycle

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle (`tasks/00-mvp-roadmap.md` § Phase 11)
- **Spec source** :
  - `docs/gameplay/19-world-lifecycle.md` § `LOCKED → ENDED` (lignes 99-107) + § « Wipe et récompenses fin de monde » lignes 109-121 — partie « Mode lecture seule » uniquement (wipe destructeur hors scope)
  - `docs/gameplay/24-rankings.md` § « Puissance du Royaume » + § « Cycles » (vue monde entier) + § « Données sources »
- **Type** : feature
- **Modules** :
  - backend `workers/world-lifecycle.worker.ts`, `modules/rankings`, `modules/world`, `modules/combat`, `modules/army`, `modules/village` ou `gameplay`, `modules/strategy`, `modules/retention`, `prisma/schema.prisma` + migration
  - frontend : aucun (UI lecture seule = run successeur)
  - shared : éventuel type de snapshot dans `packages/shared/rankings` ou `packages/shared/world`

## Dépendances

- Run [`032-world-lifecycle-foundation-and-identity`](archive/032-world-lifecycle-foundation-and-identity.md) — DONE. A livré les transitions `PLANNED → OPEN → LOCKED → ENDED` + `WorldConfig.lifecycle` + worker pg-boss. Avait explicitement reporté : « Snapshot leaderboard / wipe hors scope (post-MVP, ticket dédié si requis) ». Ce run est ce ticket dédié.
- Run [`051-feature-rankings-glory`](archive/051-feature-rankings-glory.md) — DONE. A livré les trois classements runtime (Puissance du Royaume + Gloire d'Assaut + Gloire du Rempart) via `RankingsService` + `GloryLedger`. Source à snapshotter.

## Critère de fin (acceptance)

- [ ] Migration Prisma crée `WorldFinalRankingSnapshot` avec au minimum : `worldId`, `userId`, `signal` (POWER / OFFENSE_GLORY / DEFENSE_GLORY), `rank`, `score`, `snapshotAt`. Unique `(worldId, signal, userId)`, index `(worldId, signal, rank)`.
- [ ] À la transition `LOCKED → ENDED` dans `WorldLifecycleWorker.transitionWorld`, **dans la même transaction Prisma** que l'update status + l'outbox event, un snapshot complet des 3 classements est persisté pour tous les `WorldMembership` du monde (y compris membres éliminés à `villageCount = 0`).
- [ ] Échec du snapshot ⇒ rollback transactionnel de la transition (jamais de monde ENDED sans snapshot).
- [ ] Helper backend `assertWorldWritable(worldId)` (ou guard NestJS équivalent) rejette toute mutation sur monde `ENDED` avec HTTP 403 + code d'erreur lisible (`WORLD_READ_ONLY`).
- [ ] Mutations protégées (liste minimale) : `initiateAttack`, `scout`, `training` (army), construction de bâtiment, dispatch caravane, changement de style de village, claim carte quotidienne. Inventaire exhaustif tranché à l'étape 1 (Refinement).
- [ ] Lectures non impactées : `GET /worlds/:id`, `GET /villages`, inbox, rapports, classements restent 200 sur monde ENDED.
- [ ] Smoke backend : fast-forward d'un monde (config tempo + `endsAt` manipulé) → après tick worker : monde `ENDED`, snapshot non vide en DB, mutation refusée 403, lecture 200.
- [ ] Unit pure-logic (Vitest, ≥ 1) sur le tri/tiebreaker du snapshot (ordre déterministe sur égalité de score, inclus membres à score = 0).
- [ ] `yarn static-check` + `yarn test:backend` + `yarn test:smoke` verts.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-prisma`, `bftc-workers-outbox`

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- T1 — Migration Prisma : modèle `WorldFinalRankingSnapshot` + index/unique + `prisma generate`.
- T2 — `RankingsService.snapshotFinalRankings(tx, worldId, at)` : compute Puissance Royaume (via `PowerService`) + Gloire d'Assaut + Gloire du Rempart cumulées monde entier, tri, attribution rangs avec tiebreaker stable (proposition : `userId` lexicographique), batch `createMany` dans la tx fournie. Unit test sur tri + tiebreaker.
- T3 — Câblage worker : `WorldLifecycleWorker.transitionWorld` appelle `rankings.snapshotFinalRankings(tx, worldId, params.at)` quand `to === 'ENDED'`, dans la même `$transaction`. Outbox enrichi ou nouvel event `world.final-rankings.snapshotted`.
- T4 — Helper `assertWorldWritable(worldId)` dans `WorldService` (ou guard NestJS) → `ForbiddenException('WORLD_READ_ONLY')` si status ENDED. Pattern à trancher au refinement.
- T5 — Application du helper sur les controllers/use-cases de mutation listés. Inventaire exhaustif à l'étape 1.
- T6 — Smoke backend dédié dans `test/` : seed monde, fast-forward, assert snapshot + 403 mutation + 200 lecture.
- T7 — Doc impact : `docs/architecture/backend-modules.md` (helper), `docs/gameplay/24-rankings.md` § Données sources (mention table snapshot), pointer `19-world-lifecycle.md` si précision technique manque.

## Points d'attention

- **Inventaire mutations à protéger** : la liste est indicative. Une mutation oubliée = trou silencieux dans l'invariant. Refinement obligatoire avant T5.
- **Pattern guard vs helper** : décorateur NestJS (`@RequiresWorldWritable()` avec metadata sur le param `worldId`) plus DRY ; helper appelé en service plus explicite. Trancher au refinement.
- **Tiebreaker** : la spec 19/24 ne tranche pas. Proposition : `userId` lexicographique. À valider user étape 3.
- **Membres éliminés (`villageCount = 0`)** : doivent-ils apparaître dans le snapshot POWER (score 0, rang dernier ex æquo) ou être exclus ? Spec 24 silencieuse. Proposition : inclus, audit historique plus complet.
- **Coût performance** : 3 classements × N membres en une seule tx peut être lourd sur grand monde. Vérifier compute < quelques secondes ; sinon paginer (compromis sur l'atomicité).
- **Code d'erreur** : `WORLD_READ_ONLY` (403) ou `WORLD_ENDED` (409) ? 403 sémantiquement correct si on traite la lecture seule comme une permission. Trancher au refinement.
- **`recallExpedition`** : faut-il bloquer ? Une armée en vol au moment du ENDED doit pouvoir revenir (cohérence données). Lister explicitement actions autorisées.
- **Jobs en cours (training, construction enqueuées avant ENDED)** : laisser finir (pas de nouvelle action, mais jobs en queue terminent) — sinon scope explose.
- **Achats couronnes** : transaction globale (compte) ou liée à monde précis ? Si globale, le check ne s'applique pas. Clarifier au refinement.

## Hors scope explicite

- Récompenses cosmétiques permanentes (titre / bannière / badge profil) — la spec 19 § Questions ouvertes acte « Catalogue précis à définir avec le travail UI/UX. Pas bloquant. » → ticket dédié quand le catalogue UI sera tranché.
- Archivage destructeur à `endsAt + 7j` (purge ressources / villages / armée) — geste destructeur lourd, run successeur dédié.
- UI front « Monde terminé » (écran lecture seule de consultation du leaderboard final) — run successeur. La table snapshot livrée ici suffit aux 3 runs aval.

## Liens détectés (préflight)

- À faire avant : run 032 ✅ done, run 051 ✅ done. Aucun blocage.
- À faire après : run UI « Monde terminé » (consomme le snapshot), run wipe destructeur `endsAt + 7j`, ticket post-MVP « cosmétiques permanentes » (dépend catalogue UI).
- Connexe : run 052 (eliminated player rejoin) — touche le lifecycle mais sur LOCKED, pas ENDED.
- Doublon : aucun.
- Déjà résolu : non.
- Keywords scannés : `world-lifecycle`, `ended`, `lifecycle`, `leaderboard`, `snapshot`, `world-status`.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : oui (critères déclencheurs : invariant durable + diff estimé > 100 lignes + impact transverse sur 6+ modules).
- **Tests automatisés** : Vitest unit (snapshot tri/tiebreaker) + smoke backend (fast-forward + mutation 403 + lecture 200).
- **Tests IG user** : `Aucun` (entièrement automatisable — pas d'UI front dans ce run).
