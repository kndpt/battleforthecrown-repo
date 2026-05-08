# 02 — Tests smokes / E2E : repartir d'une base saine

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend`, `battleforthecrown-pixi`
**Tags** : tests, e2e, smoke, regression
**Statut** : ✅ Résolu 2026-05-08

## Résolution

Stratégie retenue : **option B** (supprimer les 4 `*.integration-spec.ts`, écrire des smokes propres from scratch). 7 commits :

1. `chore(backend/tests)` : remove broken integration specs (8 fichiers, -2284 lignes)
2. `chore(backend/tests)` : scaffold smoke harness (DB `battleforthecrown_smoke`, helpers, jest config)
3. `test(backend/smoke)` : production tick + construction
4. `test(backend/smoke)` : training + combat resolve+return
5. `test(backend/smoke)` : conquest + crown production + barbarian backfill
6. `test(backend/smoke)` : JWT auth + fog of war + Socket.IO outbox dispatch
7. `docs(architecture)` : smoke-tests.md + clôture du ticket

**Suite finale** : 10 flows, ~23s sur runInBand, 1 seul boot AppModule. Validation côté DB + Outbox.dispatchedAt + un smoke transversal Socket.IO réel pour valider le pipeline complet.

**Décisions clés actées** :
- Time control via `WorldConfig` test (multipliers élevés → durations clampées au minimum 1s)
- Pas de mock Prisma/pg-boss dans les smokes
- DB dédiée `battleforthecrown_smoke` (jamais la DB dev)
- 1 seul fichier `smoke.spec.ts`, 1 boot, 1 it() par flow
- 2 exceptions DB-only (production tick, barbarian backfill) — by design, pas d'Outbox sur ces flows

Doc opérationnelle : [`docs/architecture/smoke-tests.md`](../docs/architecture/smoke-tests.md). Politique transversale : [`.claude/rules/tests.md`](../.claude/rules/tests.md).

---

## Contexte

Pendant l'audit on a touché shared, backend, pixi sur ~25 fichiers. Les unit tests + le type-check passent, mais on n'a aucune garantie que les flows critiques (login → upgrade → recruit → attack → return) tournent encore en prod-like.

Aujourd'hui on a des **tests "E2E/intégration" backend nominaux**, mais l'inspection révèle qu'ils ne fonctionnent plus du tout. Reste à décider : on ressuscite, on supprime et repart avec des smokes simples, ou les deux.

## État actuel

### Backend — `test/*.integration-spec.ts`

4 fichiers volumineux :

- `combat-conquest.integration-spec.ts` (716 lignes — Phase 2 combat & conquête)
- `construction-queue.integration-spec.ts` (~300 lignes)
- `training-system.integration-spec.ts` (560 lignes)
- `village-strategy.integration-spec.ts` (~500 lignes)

**Lancés via `yarn test:e2e`** :

```
Test Suites: 4 failed, 4 total
Tests:       51 failed, 51 total
```

100 % cassés. Typique : `PrismaClientValidationError` dès le setup (`training-system.integration-spec.ts:45`) — les fixtures ne matchent plus le schéma Prisma actuel (champs ajoutés/renommés au fil des PRs).

### Pixi — Vitest jsdom

Tests présents (12 fichiers, 65 tests) mais **tous unitaires**. Aucun test :
- de bout en bout (`Playwright` / `Cypress` absents)
- de smoke contre un backend réel
- de session utilisateur complète

### Couverture des flows critiques aujourd'hui

État **post-résolution ticket 01** (2026-05-08) : la colonne unit a été nettoyée. Les specs orchestration ont été supprimées (cf. ticket 01) ; ne restent que la logique pure. **Les ❌ E2E ci-dessous sont la dette que ce ticket doit combler.**

| Flow | Couverture unit (logique pure) | Couverture E2E / smoke |
|---|---|---|
| Login + refresh JWT | côté pixi : `client.test.ts` (refresh) | ❌ — à couvrir |
| Upgrade bâtiment | `world-config.service.spec` (formules cost/time) | ❌ (E2E mort, à recoder) |
| Recruter unité | — | ❌ — à couvrir |
| Lancer attaque + retour | `combat-strategies.spec` (formules combat), `combat.utils.spec` (casualty math), `loot.manager.spec` (capacity/loot factor) | ❌ (E2E mort, à recoder) |
| Conquête | — | ❌ (E2E mort, à recoder) |
| Production tick | `world-config.service.spec` (production rate formula) | ❌ — à couvrir |
| Fog of war | `vision.service.spec` (géométrie pure) | ❌ — à couvrir |

## Lien avec ticket 01 (résolu)

Le ticket [`01-unit-tests-audit.md`](./archive/01-unit-tests-audit.md) a été résolu en parallèle de ce ticket avec une politique stricte *"logique pure uniquement"* côté unit. **Conséquence directe : les smokes deviennent le filet de sécurité unique pour l'orchestration / I/O.**

**Contrat implicite à respecter quand on écrit les smokes** :

Les flows ci-dessous étaient (mal) couverts par des `*.worker.spec.ts` / `*.service.spec.ts` qui mockaient Prisma + pg-boss. Ces tests ont été supprimés. Chaque flow doit avoir un smoke équivalent qui hit la vraie DB et observe l'event Outbox :

- **Production tick** (était `production.worker.spec.ts`) → smoke : créer un village, attendre 1 tick, vérifier `ResourceStock` mis à jour + event `resources.changed` émis.
- **Construction** (était `construction.worker.spec.ts` + `upgrade-building.use-case.spec.ts`) → smoke : `POST /villages/:id/buildings/:type/upgrade`, attendre `endTime`, vérifier `Building.level` incrémenté + event `building.completed`.
- **Training** (était `training.worker.spec.ts`) → smoke : `POST /army/villages/:id/train`, attendre par tranches, vérifier `UnitInventory` + event `unit.training.completed`.
- **Combat resolution + return** (était `combat.service.spec.ts` + `combat.worker.spec.ts` + `return.worker.spec.ts`) → smoke : `POST /combat/attack`, attendre `arrivalAt`, vérifier `CombatReport` créé + event `battle.resolved` ; attendre `returnAt`, vérifier troupes/butin retournés + event `battle.returned`.
- **Conquête** (était `conquest.service.spec.ts`) → smoke : conquérir un village barbare, vérifier `Village.userId` réassigné + event `village.conquered`.
- **Outbox dispatch** (était `outbox.worker.spec.ts` + `event-outbox.service.spec.ts`) → smoke transversal : tout smoke ci-dessus qui assert l'arrivée de l'event WS valide implicitement le worker outbox.
- **Crown production** (était `crown-production.worker.spec.ts`) → smoke : avancer le temps de la fenêtre de production, vérifier crowns incrémentés.
- **Barbarian backfill** (était `barbarian-backfill.worker.spec.ts`) → smoke : conquérir un barbare, attendre le job de backfill, vérifier qu'un nouveau barbare a été semé.
- **JWT auth + refresh** (était `auth.service.spec.ts` + `game.gateway.spec.ts`) → smoke : register → login → access endpoint → laisser le token expirer → refresh → access OK.
- **Fog of war wiring** (était `world.controller.spec.ts`) → smoke : `GET /world/:id/entities` avec/sans watchtower, vérifier les entités fogged dans le payload.

**Critère de couverture** : un flow est "couvert smoke" quand le test passe une mutation REST réelle, attend les workers, et asserte sur l'état DB **et** sur l'event WS reçu. Mocker Prisma ou pg-boss dans un smoke = anti-pattern (cf. politique ticket 01).

**Si la stratégie smoke retenue ne peut pas couvrir un de ces flows** (ex : on choisit option C Playwright qui ne voit pas les workers backend), il faut soit ajouter des smokes backend dédiés, soit ré-introduire un test unit ciblé pour le flow orphelin — mais en respectant la politique pure-logic-only (mocker Prisma reste interdit).

## Question à trancher

1. **Les 4 fichiers d'intégration backend** : on les ressuscite (effort ~4-8 h estimés) ou on les supprime ?
2. **Stratégie cible** : tests smoke léger (curl + vérif DB minimale) ou tests E2E lourds (Playwright complet) ?
3. **Granularité** : un smoke par flow (5 flows critiques) ou un seul mégasmoke "happy path" complet ?

## Pistes

### A. Ressusciter les `*.integration-spec.ts` existants

- Fixer les fixtures pour qu'elles matchent le schéma actuel + les conventions post-audit (`multipliers.travel`, helpers shared, etc.).
- Avantage : on garde la profondeur (plusieurs scénarios par flow), tests déjà écrits.
- Risque : effort élevé, et ces tests resteront fragiles aux évolutions futures du schéma. Ils sont aussi très longs à exécuter (chaque test instancie `AppModule` complet).

### B. Supprimer les `*.integration-spec.ts` + smokes minimaux backend

- Supprimer les 4 fichiers (commit avec message qui explicite ce qui était couvert).
- Écrire 5-7 smokes en `test/smoke.spec.ts` qui font :
  - Boot du module, JWT auth, mutation REST, vérif DB via Prisma, vérif event Outbox.
  - Un smoke par flow critique (~50 lignes chacun).
- Run via `yarn test:smoke` séparé du `yarn test` unit.
- Avantage : repart sur du léger, lisible, rapide. ~2-3 h pour les 5-7 smokes.
- Risque : couverture moins fine — les edge-cases ne sont plus testés.

### C. Smokes pixi via Playwright (frontend-driven)

- Lancer un Playwright qui automatise une session : login + clic upgrade + assertion DOM.
- Demande backend en marche (séparation prod-like).
- Avantage : couvre frontend + backend en un seul flow.
- Risque : flaky sur la timing UI (animations, polling). Setup CI plus lourd (deux services).

### D. Hybride — Smokes backend (B) + smokes pixi optionnels (C)

- Phase 1 : tuer les E2E morts, écrire les smokes backend.
- Phase 2 (plus tard) : ajouter Playwright si la valeur le justifie.
- Avantage : démarrage rapide, on peut toujours ajouter Playwright après.
- Risque : Phase 2 peut ne jamais arriver, on reste sans couverture frontend.

## Dimensions à valider en sortie

- Décision tranchée : A, B, C, D ou autre.
- Si suppression : journaliser dans le commit message les flows / scénarios perdus.
- `yarn test:e2e` (ou équivalent) **passe** sur main, pas en `skip`.
- Documentation courte dans `docs/architecture/` : où vivent les smokes, comment les lancer, quand les ajouter.
- Idéalement < 1 minute pour exécuter le suite smoke complet (sinon on les lance jamais).

## Tickets liés

- [01 — Tests unitaires](./archive/01-unit-tests-audit.md) — la décision dépend en partie de ce qu'on garde côté unit.
- [03 — CI strategy](./03-ci-strategy.md) — la cadence d'exécution des smokes dépend de la CI.
