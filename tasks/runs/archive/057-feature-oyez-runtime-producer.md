# Run #057 — feature-oyez-runtime-producer

> **Statut** : DONE
> **Démarré** : 2026-06-20
> **Terminé** : 2026-06-20

## Cible

- **Phase roadmap** : Phase 10 — Rétention quotidienne MVP
- **Spec source** : [`docs/gameplay/05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md) (§ Oyez, § Interaction avec les cartes, § Exemples)
- **Type** : `feature`
- **Modules backend** : `retention`, `workers`
- **Modules frontend** : `retention` (durcissement de type uniquement, pas de nouvelle UI)

## Dépendances

- Runs [`026-feature-daily-cards-oyez-backend-shared`](./archive/026-feature-daily-cards-oyez-backend-shared.md) et [`027-feature-daily-cards-oyez-frontend-hud`](./archive/027-feature-daily-cards-oyez-frontend-hud.md) livrés : model `DailyOyez`, DTO, fetch `getActiveOyez`, UI `OyezBanner` + `Oyez · en cours` dans `DailyRetentionWidget`. Ce run automatise la production runtime et branche l'influence carte.
- Run [`046-refactor-royal-duty-light-fomo`](./archive/046-refactor-royal-duty-light-fomo.md) — Acceptance #9 figée : l'Oyez reste une variation douce, jamais une bénédiction, un pass ou un bonus PvP durable.
- Run [`049-feature-royal-duty-level-scaling`](./archive/049-feature-royal-duty-level-scaling.md) — scaling carte par niveau du château joueur ; la 4ᵉ tâche thématique doit composer avec ce scaling sans empiler de récompense.
- Aucun prérequis amont actif.

## Critère de fin (acceptance)

- [ ] Un monde `OPEN` voit un `DailyOyez` créé en runtime par un worker pg-boss à 04:00 Europe/Paris, sans intervention manuelle (automatisable : smoke handler + assertion DB).
- [ ] Au plus 1 `DailyOyez` actif simultané par `worldId` à tout instant — spec § Oyez « 1 seul Oyez actif simultané » (automatisable : smoke double-appel + assertion `count(active) ≤ 1`).
- [ ] Le producer est idempotent : un second appel sur le même `worldId` alors qu'un Oyez actif existe ne crée pas de doublon (automatisable : smoke).
- [ ] La cadence par défaut résout en moyenne ~2 Oyez/semaine par monde, configurable via `WorldConfig.oyez.weeklyCadence` (automatisable : unit du sélecteur).
- [ ] Le catalogue expose exactement 4 thèmes nommés `BUILDERS | MARCH | WATCH | BARBARIANS` + labels FR alignés sur la spec § Exemples (automatisable : grep + unit).
- [ ] `DailyOyezDto.theme` est typé `OyezTheme` côté shared (plus `string`), consommé tel quel par le backend et le front (automatisable : `tsc --noEmit` strict).
- [ ] Sous Oyez actif, la carte générée pour le `currentDayKey` contient 4 tâches : les 3 tâches naturelles du scaling + 1 tâche thématique cohérente avec le thème (automatisable : smoke).
- [ ] Sans Oyez actif, la carte conserve exactement 3 tâches (régression-proof sur runs 046/049) (automatisable : smoke existant non régressé).
- [ ] La récompense ressources de la carte sous Oyez reste plafonnée à 12 %/jour selon le scaling existant — pas de bonus de récompense empilable (automatisable : assertion sur `reward.wood/stone/iron`).
- [ ] Un changement d'heure DST Europe/Paris ne casse pas le cron 04:00 (automatisable : unit sur la conversion tz, ou QA backend justifiée).
- [ ] Spec `docs/gameplay/05-daily-cards-and-oyez.md` acte la cadence retenue, le catalogue 4 thèmes et la règle « carte = 4 tâches sous Oyez » (automatisable : grep doc).
- [ ] `DailyRetentionWidget` continue d'afficher `Oyez · en cours` quand un Oyez existe, sans nouvelle UI majeure (visuel/gameplay — checklist QA Kelvin ≤ 5 items).

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- Prisma : skill `bftc-prisma`
- Workers/Outbox : skill `bftc-workers-outbox`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- T1 — Spec & contrat shared : trancher cadence (default 2/sem), figer le catalogue 4 thèmes (`BUILDERS | MARCH | WATCH | BARBARIANS`), introduire `OyezTheme` enum dans `packages/shared/src/retention/types.ts`, typer `DailyOyezDto.theme`, étendre `WorldConfigSchema` avec section `oyez { enabled, weeklyCadence, defaultDurationHours }`, créer la migration Prisma pour l'index unique partiel `DailyOyez(worldId) WHERE status = 'ACTIVE'` (garantie DB de l'invariant « 1 seul Oyez actif »). Mettre à jour `docs/gameplay/05-daily-cards-and-oyez.md` pour acter la règle « carte = 4 tâches sous Oyez ».
- T2 — Catalogue producer : `src/modules/retention/retention-oyez.ts` — table `{ theme → DailyCardTaskType + label + minTargetTier? }` couvrant les 4 thèmes mappés sur les events runtime existants (`COMPLETE_BUILDING`, `TRAIN_UNITS`, `RAID_BARBARIAN`, etc.). Voir Points d'attention (§ WATCH/MARCH non câblés) pour la décision exacte à figer en refinement.
- T3 — Service producer : `OyezProducerService.produceForWorld(worldId, now)` — idempotent (no-op si Oyez actif déjà présent), sélection thème via `weeklyCadence/7` (ou variante déterministe `seed(worldId, ISO-week)`), insertion DB. L'idempotence doit être garantie au niveau DB via un index unique partiel `DailyOyez(worldId) WHERE status = 'ACTIVE'` (migration Prisma T1) afin d'éviter les doublons en cas de race ; le `findFirst` de la transaction constitue une garde supplémentaire, pas l'unique verrou. Filtre `status = OPEN`. Couvert par unit tests.
- T4 — Worker pg-boss : `OyezWorker` schedulé cron `0 4 * * *` `tz: 'Europe/Paris'`, itère sur worlds `OPEN`, délègue à `OyezProducerService`. Pattern aligné sur `WorldLifecycleWorker`. Register dans `workers.module.ts`.
- T5 — Influence carte : `RetentionService.buildDailyCardPayload` reçoit l'Oyez actif et appende 1 tâche thématique aux 3 tâches naturelles (carte = 4 tâches sous Oyez). Pas de modif de la récompense (reste plafonnée 12 %/jour). Tests unit + smoke.
- T6 — Smoke daily-retention : étendre `test/daily-retention.smoke.spec.ts` pour (a) déclencher le producer manuellement (handler exposé) et vérifier l'insertion ; (b) vérifier qu'une carte générée sous Oyez actif contient 4 tâches dont 1 du type thématique attendu ; (c) vérifier idempotence (second appel = no-op).
- T7 — Frontend ajustement minimal : durcir le type `theme` côté `DailyRetentionWidget` + `DailyQuestModal` mappers, mapper l'enum vers icône/eyebrow ; pas de nouvelle UI.
- T8 — ADR + docs archi : `docs/architecture/decisions.md` court (choix producer pg-boss + cron Europe/Paris + idempotence DB via index unique partiel + carte 4 tâches sous Oyez). Maj `docs/architecture/backend-modules.md` si nouveau worker.

## Points d'attention

- **Cadence « 1-2/semaine » non tranchée par la spec** — refinement étape 3 du run : default 2/sem retenu, configurable par `WorldConfig.oyez.weeklyCadence`.
- **Mapping thème → event runtime incomplet** : `WATCH` (scout/Watchtower) et `MARCH` (envoi/rappel d'armée) n'ont pas d'event métier consommé par les daily cards aujourd'hui (`SCOUT_TARGET` et `SEND_REINFORCEMENT` listés dans `DAILY_CARD_TASK_TYPES` mais non câblés dans `getTaskProjection`). Le contrat du run fixe **4 thèmes** (acceptance #5) — pas de catalogue réduit à 2 thèmes dans ce run. Refinement étape 3 : câbler `SCOUT_TARGET` et `SEND_REINFORCEMENT` dans `getTaskProjection` (scope T2/T5, aligné spec § Exemples) pour rendre `WATCH`/`MARCH` vérifiables en smoke. Toute réduction de scope (ex. reporter le câblage à un run satellite) exige d'abord d'amender les acceptances #5, #7 et le critère grep doc — gate bloquant avant implémentation.
- **Idempotence DB** : l'invariant « 1 seul Oyez actif par `worldId` » doit être garanti par un index unique partiel en DB (`DailyOyez(worldId) WHERE status = 'ACTIVE'`, voir T3) — le `findFirst` seul ne suffit pas en cas de schedules concurrents.
- **Garde-fou run 046 Acceptance #9** : Oyez = variation douce. Donc *pas* de bonus de récompense, *pas* de tâche PvP exclusive. La 4ᵉ tâche suit les mêmes règles de récompense que les 3 naturelles.
- **Sélection probabiliste vs déterministe** : `weeklyCadence/7` par jour est simple mais peut donner 0 ou 4 Oyez/semaine. Alternative : planning hebdo déterministe (`seed(worldId, ISO-week)` → 2 jours tirés). À trancher.
- **Filtrage des mondes** : producer doit ignorer les mondes `PLANNED`, `LOCKED`, `ENDED`. Filtre `status = OPEN` requis.
- **Spec § Oyez « non cumulatif avec même catégorie »** : à interpréter — probablement « deux Oyez du même thème ne s'enchaînent pas immédiatement ». Optionnel pour MVP.

## Progress (rempli pendant le run)

_(git history)_

## Décisions prises

_(git history + ADR-18)_ — Déviation clé : le schéma `DailyOyez` n'a pas de colonne `status` ; l'invariant « 1 actif/monde » est enforce via colonne `day_key` + index unique `(world_id, day_key)` + durée < 24h, pas via un index `WHERE status='ACTIVE'` (plan). Implémentation lead direct (slice verticale couplée) actée comme dérogation.

## Rapport final

Producer Oyez runtime livré : worker pg-boss cron 04:00 Europe/Paris → `OyezProducerService` (déterministe, idempotent, mondes OPEN) ; catalogue 4 thèmes mappés sur events runtime (`scout.reported`/`reinforcement.sent` câblés) ; carte = 4 tâches sous Oyez sans bonus de récompense ; `OyezTheme` typé end-to-end shared↔back↔front ; docs (gameplay + ADR-18 + backend-modules) + SPEC §V9.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] `DailyOyez` créé en runtime par worker — `yarn workspace battleforthecrown-backend test:smoke:run -- daily-retention` (test « produces the Oyez of the day for an OPEN world ») → 6/6 passed
  - [x] 1 seul Oyez actif simultané par monde — smoke assertion `activeCount === 1` + index unique `daily_oyez(world_id, day_key)` → passed
  - [x] Idempotence producer — smoke « stays idempotent » (`second.created === false`, 1 row) → passed
  - [x] Cadence ~2/sem par default (exactement `weeklyCadence`/semaine ISO) — `yarn workspace battleforthecrown-backend test src/modules/retention/retention-oyez.spec.ts` (`toHaveLength(2)`) → 7/7 passed
  - [x] Catalogue 4 thèmes — `rg "BUILDERS|MARCH|WATCH|BARBARIANS" packages/shared/src/retention/types.ts` → `OYEZ_THEMES` = ces 4 ; labels FR dans `retention-oyez.ts` `OYEZ_CATALOGUE`
  - [x] `DailyOyezDto.theme` typé enum — `yarn static-check` (tsc strict back+front+shared) → green
  - [x] Carte = 4 tâches sous Oyez — smoke (`card.tasks.toHaveLength(4)` + `SCOUT_TARGET` présent) → passed
  - [x] Carte = 3 tâches sans Oyez (régression) — smokes existants (`tasks.toHaveLength(3)`) → passed
  - [x] Récompense plafonnée 12 %/jour inchangée — smoke `card.reward` === `getDailyCardScaling(level).reward` (tâche thématique `rewardWeight: 0`) → passed
  - [x] Cron DST Europe/Paris — unit `retention-oyez.spec.ts` (spring-forward 2026-03-29 + fall-back 2026-10-25 sur le boundary 04:00) → passed
  - [x] Spec actée — `rg "weeklyCadence|4 tâches sous Oyez" docs/gameplay/05-daily-cards-and-oyez.md` → présents (§ Oyez + § Interaction)
  - [ ] UI `Oyez · en cours` inchangée — visuel → checklist QA Kelvin ci-dessous
- **Review indépendante** : `Déclenchée (raison : (a) back + shared + front-types ; (b) spec gameplay canonique modifiée ; (d) invariant durable Phase 10)` — **VERDICT: GO** (0 bloquant/majeur ; 4 nits mineurs, 3 corrigés : type `OyezTheme` sur le résultat producer, cap durée `< 24h` (max 23), test DST fall-back ; nit migration sans backfill = non-action, NULLs distincts en Postgres).
- **Tests automatisés** :
  - `yarn workspace battleforthecrown-backend test` → 486 passed
  - `yarn workspace battleforthecrown-backend test src/modules/retention/retention-oyez.spec.ts` → 7 passed
  - `yarn workspace battleforthecrown-pixi test src/features/retention` → 7 passed
  - `yarn static-check` → green
- **Smokes lancés** : `yarn workspace battleforthecrown-backend test:smoke:preflight` puis `test:smoke:run -- daily-retention` → 6 passed. **Ciblés** (diff backend `src/` non transversal : nouveau worker + module retention, pas de changement Outbox/auth/schema global hors `daily_oyez`). Full smoke couvert par CI PR.
- **Smokes ajoutés/modifiés** : `test/daily-retention.smoke.spec.ts` — test #1 étendu (Oyez WATCH → carte 4 tâches + assertion reward cap), + 2 tests producer (idempotence, filtre non-OPEN).
- **QA fonctionnelle agent** : producer exercé end-to-end via smoke (insertion DB + `GET /retention` + claim). Boot DI + `onModuleInit` du worker validés par le boot smoke. Non exécuté en serveur live séparé : redondant avec le smoke.
- **Tests IG à faire par le user** (≤ 5 items) :
  - [ ] Ouvrir la sheet Devoir royal sur un monde où un `DailyOyez` est actif (producer ou insertion manuelle).
  - [ ] Vérifier que la bannière `Oyez · en cours` s'affiche avec l'icône du thème.
  - [ ] Vérifier que la carte du jour montre 4 tâches dont 1 thématique.
  - [ ] Vérifier l'absence de bannière + carte = 3 tâches quand aucun Oyez actif.
  - [ ] Mobile : pas d'emprise excessive de la bannière.
