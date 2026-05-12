# Run #016 — feature-scouting-backend-shared

> **Statut** : DONE
> **Démarré** : 2026-05-12
> **Terminé** : 2026-05-12

## Cible

- **Phase roadmap** : Phase 4 — Scouting
- **Spec source** : [`docs/gameplay/11-scouting.md`](../../docs/gameplay/11-scouting.md)
- **Type** : `feature`
- **Modules backend** : `combat`, `reports`, `event`, `prisma`
- **Modules frontend** : `—`

## Dépendances

- Phase 2 close : run [`015`](./archive/015-close-phase-2-inbox-reports.md), inbox combat persistante + lu/suppression + invalidation WS.
- Phase 3 close : runs [`013`](./archive/013-feature-village-styles-backend.md) et [`014`](./archive/014-feature-village-styles-frontend.md), style persisté et masqué hors scout.
- Décision produit : modèle dédié `ScoutReport`, pas d'extension opportuniste de `CombatReport`.
- Décision produit : coût mission limité à l'ESPION engagé + temps de trajet, sans coût couronnes MVP.
- Postgres + pg-boss disponibles pour les smokes backend.

## Critère de fin (acceptance)

- [x] Un ESPION est recrutable via la Caserne niveau 3 et reste indisponible avant ce prérequis.
- [x] Un joueur peut envoyer une mission scout composée d'ESPION(s) uniquement vers un village barbare visible.
- [x] Un joueur peut envoyer une mission scout composée d'ESPION(s) uniquement vers un village joueur visible.
- [x] Une cible hors vision est refusée comme pour une attaque.
- [x] À l'arrivée, le serveur crée un `ScoutReport` persistant contenant composition d'armée, stock de ressources et style stratégique si applicable.
- [x] Au MVP, la mission scout réussit toujours et ne tue aucun ESPION.
- [x] Les ESPION(s) reviennent au village d'origine après le trajet retour.
- [x] Les événements/outbox nécessaires invalident l'inbox du propriétaire du rapport scout.
- [x] Le style d'un village joueur ennemi reste absent des endpoints publics hors rapport scout.
- [x] Un smoke ou test d'intégration couvre le cycle complet : disponibilité SPY → envoi scout → rapport → retour.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- Prisma/shared : ajouter `ExpeditionKind.SCOUT`, `ScoutReport`, contrats REST et events `scout.sent/reported/returned`.
- Backend combat : ajouter `POST /combat/scout`, validation SPY-only + vision, résolution sans combat, retour via `ReturnWorker`.
- Reports : exposer lecture/lu/suppression `ScoutReport` côté REST.
- Front non-UI : étendre bindings WS et type d'expédition pour supporter les events scout sans écran dédié.
- Tests/docs : ajouter smoke cycle complet + docs architecture/inbox.

## Progress (rempli pendant le run)

- [x] Préflight, règles, SPEC, docs source, skills Prisma/Outbox/tests.
- [x] Cartographie backend/shared avec `code_mapper` + lectures ciblées.
- [x] Implémentation Prisma/shared/backend/WS bindings.
- [x] Migration additive appliquée sur DB dev et DB smoke.
- [x] Smoke scouting ajouté et suite smoke complète verte.
- [x] Docs architecture/gameplay mises à jour.
- [x] Review 5 axes et `yarn static-check` vert.

## Décisions prises

- `ScoutReport` reste séparé de `CombatReport`, conformément à la décision produit.
- `ExpeditionKind.SCOUT` réutilise l'infrastructure pg-boss existante : `CombatWorker` crée le snapshot, `ReturnWorker` restitue les ESPIONs.
- Events dédiés `scout.sent`, `scout.reported`, `scout.returned` pour éviter de surcharger les payloads `battle.*`.
- Pas de backprop `SPEC.md` : aucun invariant transversal nouveau au-delà de la spec gameplay et des docs architecture mises à jour.

## Rapport final

Implémentation backend/shared du scout MVP :
- migration additive `20260512120000_add_scouting` avec `ScoutReport` + lien nullable depuis `Expedition`;
- endpoint `POST /combat/scout` et endpoints reports scout (`GET/PATCH/DELETE`);
- résolution scout succès auto, snapshot unités/ressources/style, retour des ESPIONs sans perte;
- events Outbox/WS dédiés et bindings Pixi non-UI;
- smoke de régression complet.

Review 5 axes :
- Correctness : critères couverts par smoke réel REST + pg-boss + Prisma + Outbox.
- Readability : logique scout isolée dans `initiateScout`, `handleScoutArrival`, `presentScoutReport`.
- Architecture : `ScoutReport` dédié, pas d'extension opportuniste `CombatReport`; Outbox transactionnel conservé.
- Security : accès aux scout reports limité à `scoutUserId`; cible hors vision refusée; style ennemi absent des endpoints publics testés.
- Performance : requêtes `ScoutReport` indexées par `scoutUserId`, `worldId`, `timestamp`; pas de scan non borné ajouté au hot path.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Mission scout SPY-only vers village barbare visible — preuve : `yarn test:smoke`, test `scouting: SPY-only mission snapshots visible targets and returns spies`, `POST /combat/scout` barbare 2xx + `scout.reported/returned`.
  - [x] Mission scout SPY-only vers village joueur visible — preuve : même smoke, cible `PLAYER_VILLAGE` 2xx + `ScoutReport.strategy = RAIDERS`.
  - [x] Cible hors vision refusée — preuve : même smoke, barbare distant `POST /combat/scout` → 403.
  - [x] `ScoutReport` snapshot persistant avec unités, ressources, style nullable — preuve : même smoke, assertions DB `MILITIA=7`, `wood=321`, `strategy=null` barbare, `SQUIRE=3`, `iron=234`, `strategy=RAIDERS` joueur.
  - [x] Retour des ESPION(s) au village d'origine — preuve : même smoke, `scout.returned` dispatché et inventaire final `SPY=2`.
- **Tests automatisés** :
  - `yarn workspace @battleforthecrown/shared build` — OK.
  - `yarn workspace battleforthecrown-backend prisma generate` — OK.
  - `yarn workspace battleforthecrown-backend tsc --noEmit` — OK.
  - `yarn workspace battleforthecrown-pixi tsc --noEmit` — OK.
  - `yarn test:smoke:preflight` — OK.
  - `yarn workspace battleforthecrown-backend jest --config ./test/jest-smoke.json --runInBand --forceExit test/smoke.spec.ts` — OK, 18 tests.
  - `yarn test:smoke` — OK, 8 suites, 30 tests.
  - `yarn static-check` — OK.
- **Smokes lancés** : `yarn test:smoke` — OK, 8 suites / 30 tests.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/smoke.spec.ts` — scénario complet disponibilité SPY → mission scout barbare/joueur → `ScoutReport` → retour SPY + refus hors vision + absence leak style public.
- **QA fonctionnelle agent** : couverte par smoke backend réel (REST + Prisma + pg-boss + Outbox). Migration appliquée sur DB dev et DB smoke via `prisma migrate deploy`.
- **Tests IG à faire par le user** : Aucun test IG nécessaire pour cette run backend/shared ; l'UI d'envoi/rendu inbox arrive en run 017.
