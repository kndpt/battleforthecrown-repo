# Run #064 — world-recurring-planned-spawner

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle (`tasks/00-mvp-roadmap.md` § Phase 11)
- **Spec source** :
  - `docs/gameplay/19-world-lifecycle.md` § « Paramètres MVP » lignes 40-50 — paramètre `newWorldEverydays` (default 🔧 7 j) : « Un nouveau monde PLANNED → OPEN toutes les ~7 j pour qu'un latecomer trouve toujours un monde frais à rejoindre ».
  - `docs/gameplay/00-game-flow.md` § « En parallèle : plusieurs mondes simultanés » lignes 105-111 — « Un nouveau monde PLANNED → OPEN toutes les ~7 j ».
- **Type** : feature
- **Modules** :
  - backend `workers/world-lifecycle.worker.ts` (extension : nouvel axe « créer PLANNED »), `modules/world/world.service.ts`, `prisma/seed-default-world-config.sql` éventuellement
  - shared : aucun nouveau type prévu (lifecycle config existante consommée)
  - frontend : aucun (la liste publique `/worlds/public` consomme déjà les mondes `PLANNED | OPEN | LOCKED`)

## Dépendances

- Run [`032-world-lifecycle-foundation-and-identity`](archive/032-world-lifecycle-foundation-and-identity.md) — DONE. A livré les 4 paramètres lifecycle dans `WorldConfig` (dont `newWorldEverydays`, default 7) et le worker `WorldLifecycleWorker` qui pilote `PLANNED → OPEN → LOCKED → ENDED`. Le rapport final reconnaît explicitement : « `newWorldEverydays` (default 7, doc seulement, pas de worker MVP) ». Ce run est la suite directe.
- Run [`061-feature-world-ended-lifecycle`](061-feature-world-ended-lifecycle.md) — PLANNED. Indépendant (touche `LOCKED → ENDED` + snapshot leaderboard, pas la création de PLANNED). Pas de conflit de scope.

## Critère de fin (acceptance)

- [ ] `WorldLifecycleWorker.handleLifecycleTick` ajoute un quatrième axe `ensurePlannedPipeline(now)` exécuté **avant** `openPlannedWorlds`. Sa responsabilité unique : garantir qu'un monde joignable « frais » existe pour les latecomers.
- [ ] Trigger de création : si **aucun** monde n'est en status `PLANNED` **et** que le dernier monde ayant transitionné `PLANNED → OPEN` (ordre `startedAt desc`) est plus vieux que `newWorldEverydays` jours, créer un nouveau monde `PLANNED` avec `plannedOpenAt = lastStartedAt + newWorldEverydays * MS_PER_DAY`. Si `lastStartedAt + cadence` est déjà passé, `plannedOpenAt = now` (l'`openPlannedWorlds` du même tick l'ouvrira aussitôt).
- [ ] Cas bootstrap (aucun monde n'a jamais été `OPEN`) : si **aucun** monde n'est `PLANNED` **et** qu'aucun monde n'a de `startedAt`, créer un seul monde `PLANNED` avec `plannedOpenAt = now`. Idempotence : un seul monde de bootstrap.
- [ ] Le nouveau monde `PLANNED` hérite de la config canonique du seed par défaut (`prisma/seed-default-world-config.sql`) — mêmes `lifecycle`, mêmes `tempo`, mêmes dimensions. L'identité (`name`, `sigil`, `themeColor`, `displayOrder`) est dérivée déterministiquement (proposition : suffixe numérique incrémental basé sur `count(world)`, sigil/themeColor par rotation déterministe). Tranché à l'étape 1 (Refinement).
- [ ] Idempotence : deux ticks rapprochés ne créent jamais deux mondes `PLANNED` simultanés. Le check `count(status=PLANNED) === 0` reste l'invariant primaire.
- [ ] Concurrence multi-instance : la création est protégée par un guard atomique (advisory lock pg-boss ou `INSERT ... ON CONFLICT` sur une clé déterministe `world.name`/`displayOrder`). Pattern tranché à l'étape 1.
- [ ] Pas de création si le système est saturé en mondes `OPEN | LOCKED | PLANNED` au-delà d'un seuil de sécurité (proposition : `< 50` mondes actifs). Garde-fou souple pour éviter de noyer la liste publique en cas de bug.
- [ ] Event Outbox `world.planned.created` émis dans la même transaction Prisma que la création par le worker, payload `{ worldId, plannedOpenAt, source: 'auto' }`. La constante `source` est un littéral aujourd'hui — l'extension à `'manual'` (côté seed / admin) est explicitement hors scope de ce run pour éviter une union morte (cf. § Hors scope).
- [ ] La création **manuelle** (admin / seed) reste possible et n'est jamais bloquée par ce worker — le worker ne fait que combler le trou si la cadence n'a pas été honorée à la main. Le seed/admin n'émet **pas** `world.planned.created` au MVP (statu quo : aucun outbox event sur le chemin manuel aujourd'hui).
- [ ] Smoke backend : (a) seed un monde déjà en `OPEN` avec `startedAt = now - 8j` et aucun `PLANNED` → après tick worker : un nouveau monde existe en status `OPEN` avec `startedAt ≈ now` (créé en `PLANNED` puis ouvert dans le même tick par `openPlannedWorlds`, conformément au critère « si `lastStartedAt + cadence` est déjà passé, `plannedOpenAt = now` »), aucun monde `PLANNED` ne reste après le tick ; un second tick rapproché ne crée pas de doublon. (b) **Cas négatif cadence non échue** : seed un monde `OPEN` avec `startedAt = now - 3j` (cadence 7j) et aucun `PLANNED` → après tick worker : **aucun** nouveau monde créé. (c) Cas bootstrap : DB vide → tick crée 1 seul monde, ouvert immédiatement (`plannedOpenAt = now`).
- [ ] Unit pure-logic (Vitest, ≥ 3) sur le calcul `nextPlannedOpenAt(lastStartedAt, newWorldEverydays, now)` : (a) cadence respectée, retard rattrapé sans accumulation (un seul monde même si retard de plusieurs cadences) ; (b) **cas négatif** : `now < lastStartedAt + newWorldEverydays * MS_PER_DAY` → la fonction signale `skip` (return `null` ou variant équivalent) et `ensurePlannedPipeline` n'écrit rien ; (c) bootstrap renvoie `now`.
- [ ] `GET /worlds/public` continue d'exposer le nouveau monde `PLANNED` sans changement de contrat DTO.
- [ ] `yarn static-check` + `yarn test:backend` + `yarn test:smoke` verts.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-prisma`, `bftc-workers-outbox`

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- T1 — Pure-logic : `computeNextPlannedOpenAt(lastStartedAt, newWorldEverydays, now)` dans `world-lifecycle.worker.ts` ou helper séparé. Unit Vitest sur cadence + retard + bootstrap.
- T2 — `WorldLifecycleWorker.ensurePlannedPipeline(now)` : check `count(status=PLANNED) > 0` → skip ; sinon lire le dernier `startedAt` (worlds `OPEN | LOCKED | ENDED`), calculer `plannedOpenAt`, créer le monde avec guard atomique. Câblage dans `handleLifecycleTick` avant `openPlannedWorlds`.
- T3 — Dérivation identité monde (`name`, `sigil`, `themeColor`, `displayOrder`) : pattern déterministe basé sur `count(world)` ou `max(displayOrder)+1`. Helper dans `WorldService` ou inline worker. Trancher au refinement.
- T4 — Outbox event `world.planned.created` dans la tx de création.
- T5 — Smoke backend `world-lifecycle-spawner.smoke.spec.ts` : 3 scénarios (cadence respectée, retard rattrapé, bootstrap).
- T6 — Doc impact : `docs/architecture/backend-modules.md` (mention worker spawner), `docs/architecture/realtime.md` (event `world.planned.created`). Pas de mise à jour spec gameplay nécessaire (`19-world-lifecycle.md` est déjà la source).

## Points d'attention

- **Identité du monde auto-créé** : la spec gameplay ne tranche pas le naming. Proposition : suffixe numérique `Monde-{displayOrder}` ou rotation thématique sur les `WorldSigilSchema` / `WorldThemeColorSchema`. À valider user étape 3 du run (pas du plan).
- **Cadence vs jitter** : si la cadence pile à `7j × n` tombe pendant un down du worker, le tick suivant doit rattraper sans créer plusieurs PLANNED d'un coup. L'invariant `count(PLANNED) === 0` couvre ce cas en plafonnant naturellement à 1 monde futur d'avance.
- **Bootstrap vs idempotence sur DB déjà seedée** : le seed `prisma/seed-default-world-config.sql` crée déjà un monde par défaut. Si le worker tourne dans un environnement de dev avec ce seed, la première itération doit voir l'existant et ne pas en créer un second. Couvert par le check `count(world) > 0` avant le branche bootstrap.
- **Concurrence multi-instance backend** : en prod avec ≥ 2 instances pg-boss, deux workers peuvent tirer le même tick. Le guard atomique est obligatoire. Options : advisory lock postgres (`pg_try_advisory_xact_lock`) ou unique constraint sur `world.displayOrder` (P2002 → swallow). Trancher au refinement.
- **Liste publique et UX latecomer** : `GET /worlds/public` expose déjà les `PLANNED`. Avec la création auto, un latecomer voit toujours un monde dont la `plannedOpenAt` est ≤ 7 j. Vérifier que le frontend (run 042 `world-detail-page`) affiche correctement un monde `PLANNED` futur (countdown attendu). Si gap UI → ticket dédié, hors scope de ce run.
- **Wipe ENDED et archivage** : la spec 19 § Archivage prévoit que les mondes `ENDED` sortent de l'UI 7 j après. Ce run n'archive pas les `ENDED` (run successeur dédié, déjà mentionné dans 061). Pas de couplage.
- **Plafond `< 50 mondes actifs`** : valeur arbitraire défensive. À valider au refinement — purement un garde-fou anti-bug, pas une règle gameplay.

## Hors scope explicite

- UI admin pour piloter manuellement la cadence ou désactiver le spawner — pas de cas d'usage MVP, manipulation directe DB suffit.
- Émission de `world.planned.created` avec `source: 'manual'` sur le chemin seed / admin — tant qu'aucun consommateur downstream n'en a besoin, on garde la payload littérale `'auto'`. Si un futur run ajoute un consommateur (ex : notification admin de nouveau monde), il ajoutera le `'manual'` et son chemin d'émission dans son propre scope.
- Notification serveur aux joueurs « un nouveau monde s'ouvre dans X jours » — relève de la spec `16-notifications.md` (encore en chantier).
- Wipe destructeur à `endsAt + 7j` — run successeur dédié (déjà signalé hors scope dans run 061).
- Modification du contrat `GET /worlds/public` ou de la sélection UI front — ce run garantit uniquement que la donnée existe en DB.

## Liens détectés (préflight)

- À faire avant : run 032 ✅ done (a livré le worker et le paramètre `newWorldEverydays`).
- À faire après : run UI « Monde terminé » (post-run 061), ticket éventuel UI countdown `PLANNED` côté `WorldsSelectionScreen`, run wipe destructeur `endsAt + 7j` post-MVP.
- Connexe : run 061 (`world-ended-lifecycle`, PLANNED) — touche la même classe `WorldLifecycleWorker` mais sur la transition opposée. Coordination de merge attendue (modifications du worker à intégrer dans l'ordre des merges).
- Doublon : aucun.
- Déjà résolu : non. Run 032 a explicitement reporté ce livrable.
- Keywords scannés : `world-lifecycle`, `world-spawner`, `planned`, `recurring`, `newWorldEverydays`, `multi-monde`, `cadence`.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : oui (critères déclencheurs : invariant durable « toujours un monde joignable frais à 7j max » + impact backend transverse + diff estimé > 100 lignes worker + smoke + helper).
- **Tests automatisés** : Vitest unit (`computeNextPlannedOpenAt`) + smoke backend (`world-lifecycle-spawner.smoke.spec.ts`).
- **Tests IG user** : `Aucun` (entièrement automatisable — manipulation DB + tick worker en smoke).
