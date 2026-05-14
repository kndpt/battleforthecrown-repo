# Run #022 — fix-power-realtime-reactivity

> **Statut** : DONE
> **Démarré** : 2026-05-14
> **Terminé** : 2026-05-14

## Cible

- **Phase roadmap** : Hors roadmap (bug d'observabilité runtime — features Phase 1 power calculé OK côté backend mais non rafraîchi côté frontend sur les events training/building)
- **Spec source** : [`docs/gameplay/09-power-and-rankings.md`](../../docs/gameplay/09-power-and-rankings.md) (réactivité WS à acter explicitement si absente)
- **Type** : `bug`
- **Modules backend** : `army/training`, `event/outbox`, `shared/events`
- **Modules frontend** : `pixi/api/ws-bindings`, `pixi/features/power`

## Dépendances

- Aucune phase amont à terminer. Bug autonome.

## Critère de fin (acceptance)

- [ ] Pendant un training en cours, la puissance village et la puissance royaume affichées dans le HUD top (`GameHeader`) et dans la modale "Puissance Totale" (`PowerBottomSheet`) augmentent à chaque unité fabriquée, sans F5.
- [ ] À la fin d'un upgrade de bâtiment (event `building.completed`), la puissance est rafraîchie sans F5 dans les deux surfaces.
- [ ] Nouveau event Outbox `unit.trained` émis par `training.worker.ts` à chaque tick training, dans la même transaction Prisma que l'incrément `unitsCreated` (invariant Outbox : aucun event WS avant commit DB).
- [ ] L'event `unit.training.completed` est conservé pour la fin de queue.
- [ ] Binding frontend `unit.trained` invalide les queryKeys consommatrices (`armyInventory`, `population` si impacté, `power.village.*`, `power.kingdom.*`).
- [ ] Binding frontend `applyBuildingCompleted` invalide aussi `power.village.*` + `power.kingdom.*` (en plus des invalidations existantes).
- [ ] Volume Outbox borné : training de N unités produit ≤ N+1 events (`unit.trained` ×N + `unit.training.completed` ×1).
- [ ] Smoke `army-training.smoke.spec.ts` étendu : vérifie qu'un training de N unités produit bien N events `unit.trained` en table EventOutbox.
- [ ] [`docs/architecture/realtime.md`](../../docs/architecture/realtime.md) documente le pattern "event métier émis depuis un worker, consommé par plusieurs invalidations front", avec `unit.trained` comme exemple canonique et la justification du choix vs un event signal-pur.
- [ ] [`docs/gameplay/05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md) référence `unit.trained` (et autres events métier candidats) comme source de validation des tâches `Recruter`, `Lancer un upgrade`, `Raider un barbare`, `Scout une cible`, `Renforcer un village`.
- [ ] [`docs/gameplay/15-onboarding.md`](../../docs/gameplay/15-onboarding.md) référence `unit.trained`, `building.completed`, `battle.resolved`, `scout.completed` comme déclencheurs candidats des étapes scriptées du tuto.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Contexte & décisions amont

Décision retenue : **Piste B — event Outbox `unit.trained` à chaque tick training**, validée par le user en `$bftc-plan`.

### Diagnostic (cartographie planner)

Double cause racine confirmée en lecture (ne pas re-cartographier ces deux points en étape 2, juste vérifier qu'ils sont toujours vrais) :

1. **Backend** — `training.worker.ts` (~ l. 92, 106-135) n'émet `unit.training.completed` qu'à la complétion totale du batch. Aucun event aux ticks intermédiaires.
2. **Frontend** — `ws-bindings.ts` : ni `applyUnitTrainingCompleted` (l. 132) ni `applyBuildingCompleted` (l. 88) n'invalident `['power', 'village', …]` ou `['power', 'kingdom', …]`. Même l'event final n'a aucun effet sur la query power (`staleTime: 30_000`).

### Pistes évaluées

- **A — Front seul (rejetée)** : invalider `power.*` dans les bindings existants. 1-2 fichiers, 0 charge réseau, mais la puissance ne bouge qu'à la fin du batch (1 update pour 43 unités → mauvaise UX, l'utilisateur n'observe rien pendant 90 s de training).
- **B — Event métier `unit.trained` à chaque tick (RETENUE)** : nouveau event Outbox émis dans le training worker à chaque unité fabriquée, en plus du `unit.training.completed` final. Le frontend mappe `unit.trained` aux invalidations dont il a besoin (`armyInventory`, `population`, `power.*`).
- **C — Event signal `power.changed` (rejetée)** : event d'invalidation pur émis par les workers. Volume identique à B mais sémantique "ordre d'invalidation" qui couple backend et store front. Surtout : inutile pour les futures features qui ont besoin du **fait métier** ("une unité a été fabriquée"), pas du signal puissance.

### Justification du choix B — réutilisation par features futures

L'event `unit.trained` n'a pas qu'un usage power. Il servira directement aux features Phase 8 et Phase 10 de la roadmap MVP :

- **Cartes quotidiennes (Phase 10, [`docs/gameplay/05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md))** — la tâche `Recruter une unité` valide une progression au fil des unités fabriquées. Avec `unit.trained`, le système de cartes incrémente naturellement le compteur de progression. Avec `power.changed` (piste C), on aurait un signal "la puissance a bougé" qui ne permet pas de savoir si c'est dû à un training ou à un upgrade.
- **Onboarding (Phase 8, [`docs/gameplay/15-onboarding.md`](../../docs/gameplay/15-onboarding.md))** — le tuto est une machine à états déclenchée par des **faits gameplay** ("premier upgrade", "premier raid", "premier scout"). La future étape recrutement aura besoin du même type de signal. Si on prend C aujourd'hui, on devra de toute façon créer `unit.trained` plus tard pour onboarding + cartes, et on cumule deux events qui décrivent le même fait — pire des deux mondes (charge réseau doublée + sémantique brouillée).

Choisir B aujourd'hui pose la pierre du pattern « event métier émis depuis le worker, consommé par plusieurs invalidations / progressions front » qui supportera Phase 8, Phase 10, et toute feature ultérieure qui aura besoin de réagir à un fait gameplay (achievements, événements, statistiques, etc.).

### Points d'attention pour le refinement

- **Charge Outbox** : training de 100 unités = 100 events `unit.trained` + 1 `completed`. Mesurer sur scénario réaliste (N joueurs en parallèle) avant de confirmer le pattern. Si la charge devient un problème, l'optimisation se fait en étape ultérieure (batch d'events, debounce front) sans changer le contrat WS.
- **Atomicité Prisma** : l'event `unit.trained` doit être inséré dans `EventOutbox` dans la **même transaction** que l'incrément `unitsCreated`. Pas d'event sans commit DB.
- **Précédent ressources** : vérifier comment `production.worker.ts` gère sa réactivité (signal d'invalidation ou fait métier ?) — référence `tasks/archive/06-production-tick-and-backfill-no-outbox.md`. Aligner le wording si pattern différent.
- **Spec 09 muette sur "temps réel"** : à compléter via backprop SPEC étape 8c si l'invariant n'y est pas explicite.
- **`[TEMP DEBUG #062]`** dans `applyBuildingCompleted` (ws-bindings.ts l. 92-123) : un debug temporaire est en place pour une investigation séparée. Ne pas le supprimer par inadvertance pendant le wiring power — coordonner si l'investigation est encore ouverte.
- **Power query `staleTime: 30_000`** : conserver. L'invalidation explicite reste la source de vérité du refresh — `staleTime` n'est qu'un filet auto à 30 s qui explique pourquoi F5 finit par marcher aussi sans WS.
- **Buildings** : à confirmer en étape 2 que `building.completed` existe déjà côté backend et est bien le seul event à brancher côté front pour la puissance bâtiment. Pas de nouvel event building à créer a priori.

## Décomposition initiale (rempli par le lead à l'étape 3)

- Backend/shared event contract : ajouter `unit.trained` aux types/schémas partagés, publisher et dispatcher Outbox ; émettre l'event dans `TrainingWorker` à chaque unité produite, dans la transaction Prisma existante.
- Frontend WS bindings : invalider `armyInventory`, `population`, `power.village.*` et `power.kingdom.*` sur `unit.trained`, et `power.*` sur `building.completed`.
- Regression smoke : étendre `army-training.smoke.spec.ts` pour vérifier N events `unit.trained` + 1 completion sur un training de N unités.
- Docs : acter le pattern event métier dans `realtime.md`, la réactivité power dans la spec power, et les déclencheurs candidats cartes/onboarding.

## Progress (rempli pendant le run)

- Préflight OK : worktree clean, run `PLANNED`, rules/spec/briefings chargés.
- Cartographie OK : diagnostic planner confirmé dans `training.worker.ts` et `ws-bindings.ts`.
- Coding OK : event `unit.trained`, invalidations power et docs ajoutés.
- Review ciblée OK : wiring partagé/backend/frontend cohérent, aucun finding bloquant avant tests.
- Tests OK : smoke backend complet, Vitest ciblé ws-bindings et `yarn static-check` verts.

## Décisions prises

- Mode complet sans sub-agent : scope borné et fichiers identifiés ; exécution directe plus économique que délégation, sans contourner les hard gates.
- `unit.trained` reprend le même payload que `unit.training.completed` (`trainingId`, `villageId`, `unitType`, `completedQty`, `totalQty`) pour garder un contrat simple et réutilisable par power, cartes quotidiennes et onboarding.

## Rapport final

Implémenté :

- Nouveau contrat partagé `unit.trained` + validation Zod + dispatch Outbox user-scoped.
- `TrainingWorker` écrit `unit.trained` dans la même transaction Prisma que l'incrément d'inventaire, à chaque unité produite, tout en conservant `unit.training.completed` à la fin de queue.
- `ws-bindings.ts` invalide `armyInventory`, `population`, `power.village.*`, `power.kingdom.*` sur `unit.trained`, et `power.*` sur `building.completed`.
- Smoke `army-training.smoke.spec.ts` couvre 3 unités → 3 events `unit.trained` + 1 completion.
- Test Vitest `ws-bindings.test.ts` couvre les invalidations power pour `unit.trained` et `building.completed`.
- Docs mises à jour : realtime, power, cartes quotidiennes/Oyez, onboarding.
- Fix de vérification : `packages/shared clean` supprime aussi `tsconfig.tsbuildinfo`, sinon `clean && build` peut laisser un `dist` vide.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Training en cours rafraîchit la puissance sans F5 — preuve : `unit.trained` invalide `power.village.*` + `power.kingdom.*` dans `ws-bindings.test.ts`.
  - [x] `building.completed` rafraîchit la puissance sans F5 — preuve : `applyBuildingCompleted` invalide `power.*` dans `ws-bindings.test.ts`.
  - [x] `unit.trained` émis dans la transaction Prisma du tick training — preuve : appel `this.outbox.unitTrained(..., tx)` dans `TrainingWorker` juste après `unitInventory.upsert`.
  - [x] `unit.training.completed` conservé — preuve : smoke training attend toujours l'event final dispatché.
  - [x] Volume Outbox borné — preuve : smoke 3 unités attend 3 `unit.trained` + 1 `unit.training.completed`.
  - [x] Docs demandées mises à jour — preuve : `docs/architecture/realtime.md`, `docs/gameplay/09-power-and-rankings.md`, `docs/gameplay/05-daily-cards-and-oyez.md`, `docs/gameplay/15-onboarding.md`.
- **Tests automatisés** :
  - `rtk yarn test:smoke:preflight` — OK.
  - `rtk yarn test:smoke` — OK, 22 suites / 37 tests.
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 rtk yarn workspace battleforthecrown-pixi test src/api/ws-bindings.test.ts` — OK, 19 tests.
  - `rtk yarn static-check` — OK.
  - `rtk yarn workspace @battleforthecrown/shared clean && rtk yarn workspace @battleforthecrown/shared build` — OK, `dist/time/index.js` présent.
- **Smokes lancés** : `rtk yarn test:smoke` — OK.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/army-training.smoke.spec.ts` — training de 3 unités, N events `unit.trained`, 1 completion.
- **QA fonctionnelle agent** : smoke backend réel couvre REST `/army/:villageId/train`, pg-boss training worker, Prisma DB et EventOutbox.
- **Tests IG à faire par le user** :
  - [ ] Lancer un training de plusieurs unités et vérifier que le badge puissance du `GameHeader` augmente unité par unité sans F5.
  - [ ] Ouvrir "Puissance Totale" pendant ce training et vérifier que la puissance village + royaume se rafraîchit sans F5.
  - [ ] Lancer un upgrade court et vérifier qu'à `building.completed`, le badge + la bottom sheet puissance se mettent à jour sans F5.
