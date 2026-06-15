# Run #057 — feature-oyez-runtime-producer

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

- T1 — Spec & contrat shared : trancher cadence (default 2/sem), figer le catalogue 4 thèmes (`BUILDERS | MARCH | WATCH | BARBARIANS`), introduire `OyezTheme` enum dans `packages/shared/src/retention/types.ts`, typer `DailyOyezDto.theme`, étendre `WorldConfigSchema` avec section `oyez { enabled, weeklyCadence, defaultDurationHours }`. Mettre à jour `docs/gameplay/05-daily-cards-and-oyez.md` pour acter la règle « carte = 4 tâches sous Oyez ».
- T2 — Catalogue producer : `src/modules/retention/retention-oyez.ts` — table `{ theme → DailyCardTaskType + label + minTargetTier? }` couvrant les 4 thèmes mappés sur les events runtime existants (`COMPLETE_BUILDING`, `TRAIN_UNITS`, `RAID_BARBARIAN`, etc.). Voir Points d'attention (§ WATCH/MARCH non câblés) pour la décision exacte à figer en refinement.
- T3 — Service producer : `OyezProducerService.produceForWorld(worldId, now)` — idempotent (no-op si Oyez actif déjà présent), sélection thème via `weeklyCadence/7` (ou variante déterministe `seed(worldId, ISO-week)`), insertion DB. L'idempotence doit être garantie au niveau DB via un index unique partiel `DailyOyez(worldId) WHERE status = 'ACTIVE'` (migration Prisma T1) afin d'éviter les doublons en cas de race ; le `findFirst` de la transaction constitue une garde supplémentaire, pas l'unique verrou. Filtre `status = OPEN`. Couvert par unit tests.
- T4 — Worker pg-boss : `OyezWorker` schedulé cron `0 4 * * *` `tz: 'Europe/Paris'`, itère sur worlds `OPEN`, délègue à `OyezProducerService`. Pattern aligné sur `WorldLifecycleWorker`. Register dans `workers.module.ts`.
- T5 — Influence carte : `RetentionService.buildDailyCardPayload` reçoit l'Oyez actif et appende 1 tâche thématique aux 3 tâches naturelles (carte = 4 tâches sous Oyez). Pas de modif de la récompense (reste plafonnée 12 %/jour). Tests unit + smoke.
- T6 — Smoke daily-retention : étendre `test/daily-retention.smoke.spec.ts` pour (a) déclencher le producer manuellement (handler exposé) et vérifier l'insertion ; (b) vérifier qu'une carte générée sous Oyez actif contient 4 tâches dont 1 du type thématique attendu ; (c) vérifier idempotence (second appel = no-op).
- T7 — Frontend ajustement minimal : durcir le type `theme` côté `DailyRetentionWidget` + `DailyQuestModal` mappers, mapper l'enum vers icône/eyebrow ; pas de nouvelle UI.
- T8 — ADR + docs archi : `docs/architecture/decisions.md` court (choix producer pg-boss + cron Europe/Paris + idempotence par lookup actif + carte 4 tâches sous Oyez). Maj `docs/architecture/backend-modules.md` si nouveau worker.

## Points d'attention

- **Cadence « 1-2/semaine » non tranchée par la spec** — refinement étape 3 du run : default 2/sem retenu, configurable par `WorldConfig.oyez.weeklyCadence`.
- **Mapping thème → event runtime incomplet** : `WATCH` (scout/Watchtower) et `MARCH` (envoi/rappel d'armée) n'ont pas d'event métier consommé par les daily cards aujourd'hui (`SCOUT_TARGET` et `SEND_REINFORCEMENT` listés dans `DAILY_CARD_TASK_TYPES` mais non câblés dans `getTaskProjection`). Deux options à trancher en refinement : (i) limiter le catalogue MVP à 2 thèmes câblables (`BUILDERS`+`BARBARIANS`) — **si retenu, les acceptances #5, #7 et le critère grep doc doivent être mis à jour en conséquence lors du refinement** ; (ii) câbler les 2 events manquants au passage (élargit le scope). Option (iii) — garder 4 thèmes sans câbler les events — écartée car elle rendrait l'acceptance #5 (`WATCH`/`MARCH` valident) invérifiable en smoke.
- **Idempotence DB** : l'invariant « 1 seul Oyez actif par `worldId` » doit être garanti par un index unique partiel en DB (`DailyOyez(worldId) WHERE status = 'ACTIVE'`, voir T3) — le `findFirst` seul ne suffit pas en cas de schedules concurrents.
- **Garde-fou run 046 Acceptance #9** : Oyez = variation douce. Donc *pas* de bonus de récompense, *pas* de tâche PvP exclusive. La 4ᵉ tâche suit les mêmes règles de récompense que les 3 naturelles.
- **Sélection probabiliste vs déterministe** : `weeklyCadence/7` par jour est simple mais peut donner 0 ou 4 Oyez/semaine. Alternative : planning hebdo déterministe (`seed(worldId, ISO-week)` → 2 jours tirés). À trancher.
- **Filtrage des mondes** : producer doit ignorer les mondes `PLANNED`, `LOCKED`, `ENDED`. Filtre `status = OPEN` requis.
- **Spec § Oyez « non cumulatif avec même catégorie »** : à interpréter — probablement « deux Oyez du même thème ne s'enchaînent pas immédiatement ». Optionnel pour MVP.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] `DailyOyez` créé en runtime par worker — `yarn workspace battleforthecrown-backend test test/daily-retention.smoke.spec.ts -t "oyez producer"` → <résultat>
  - [ ] 1 seul Oyez actif simultané par monde — smoke double-appel
  - [ ] Idempotence producer — smoke second-call
  - [ ] Cadence ~2/sem par default — unit selector
  - [ ] Catalogue 4 thèmes — `rg "OyezTheme\\.(BUILDERS|MARCH|WATCH|BARBARIANS)" packages/shared`
  - [ ] `DailyOyezDto.theme` typé enum — `yarn workspace @battleforthecrown/shared build`
  - [ ] Carte = 4 tâches sous Oyez — smoke
  - [ ] Carte = 3 tâches sans Oyez (régression) — smoke existant
  - [ ] Récompense plafonnée 12 %/jour inchangée — assertion smoke
  - [ ] Cron DST Europe/Paris — unit ou QA backend
  - [ ] Spec actée — `rg "weeklyCadence|4 tâches sous Oyez" docs/gameplay/05-daily-cards-and-oyez.md`
  - [ ] UI inchangée — checklist QA Kelvin
- **Review indépendante** : `Déclenchée (raison : (a) back + shared + front-types coordonnés ; (b) spec gameplay canonique Phase 10 modifiée ; (d) invariant durable Phase 10 — idempotence par monde + cron 04:00 Europe/Paris + carte 4 tâches sous Oyez)` — verdict à remplir.
- **Tests automatisés** : commandes exactes + résultat synthétique à remplir.
- **Smokes ajoutés/modifiés** : `test/daily-retention.smoke.spec.ts` (extension).
- **QA fonctionnelle agent** : déclenchement manuel handler producer + lecture DB + curl `GET /retention` après production, à exécuter en étape 10.
- **Tests IG à faire par le user** (≤ 5 items) :
  - [ ] Ouvrir la sheet Devoir royal sur un monde test où un `DailyOyez` est inséré par le producer.
  - [ ] Vérifier que la bannière `Oyez · en cours` s'affiche.
  - [ ] Vérifier que la carte du jour montre 4 tâches dont 1 thématique.
  - [ ] Vérifier l'absence de bannière quand aucun Oyez n'est actif (carte = 3 tâches).
  - [ ] Vérifier mobile : pas d'emprise excessive de la bannière.
