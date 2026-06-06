# Run #049 — feature-royal-duty-level-scaling

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 10 — Rétention quotidienne MVP
- **Spec source** : [`docs/gameplay/05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md) (§Cartes quotidiennes 34-45, §Types de tâches 47-57, §Récompenses 69-86)
- **Type** : feature
- **Modules backend** : `retention`, `event` (`combat.worker` pour `targetTier`), `prisma` (conditionnel)
- **Modules frontend** : `pixi/features/retention`

## Objectif

Faire scaler **missions ET récompenses** du Devoir royal selon le **niveau du joueur = château max parmi ses villages**, pour que la carte reste un nudge pertinent du early au late sans snowball.

Aujourd'hui c'est plat et inadapté :
- Récompense fixe `DAILY_REWARD = { wood:120, stone:120, iron:120 }` (`retention.service.ts:34`).
- 3 tâches fixes `target:1` (`TASK_TEMPLATES`, `retention.service.ts:36-44`).

Confronté à l'économie réelle, 120/ressource vaut ~1h de prod + ~40% d'un upgrade en early, mais devient négligeable en mid/late (~5 min de prod, <1% d'un upgrade, < un seul raid barbare T1). Réfs : prod `packages/shared/src/resources/production.ts:6`, coûts `packages/shared/src/village/buildings.ts:90-167`, loot barbare `prisma/seed-default-world-config.sql:47-110`.

**Principe retenu** : chaque **band** (château max) a 3 missions tier-appropriées ; levier anti-farm principal = **qualité (tier barbare)**, pas quantité ; récompense **par mission proportionnelle à la difficulté, sommée sur les 3** ; total/jour **plafonné** (non-snowball, cohérent `05:43,86`). Scaling sur le château max (proxy de progression), **jamais** sur le village receveur (gameable, n'est que la destination du claim).

## Dépendances

- **Baseline** : run [`046 — refactor-royal-duty-light-fomo`](./archive/046-refactor-royal-duty-light-fomo.md) (DONE 2026-06-02) — 1 carte/jour, 3 tâches naturelles, grâce bornée. Ce run **scale par-dessus**, ne re-tranche pas le lifecycle backlog/FOMO.
- Origine MVP : [`026 — daily-cards-oyez backend/shared`](./archive/026-feature-daily-cards-oyez-backend-shared.md), [`027 — daily-cards-oyez frontend/HUD`](./archive/027-feature-daily-cards-oyez-frontend-hud.md).
- Règle Phase 9 de choix du village récompensé **inchangée** (claim demande un village possédé, propose le dernier récompensé).
- Onboarding scripté reste distinct ; ne pas transformer le Devoir royal en tutoriel.
- Migrations Prisma non destructives uniquement. Ne jamais reset la DB.

## Décisions à trancher (étape 1 du run)

- **Q1 — Tier barbare dans la mission** : (A, **recommandé**) propager `targetTier` dans `BattleResolvedPayload` + projection « tier ≥ floor » → vrai levier anti-farm ; coût faible (donnée déjà persistée `combat.worker.ts:471`, `defenderVillage` en scope à l'émission l.681-701). (B) quantité seule d'abord, tier en run suivant.
- **Q2 — Ancrage récompense** : (A) % du revenu/coût réel de la band via formules shared (`production.ts` + `buildings.ts`) → auto-équilibré ; NOTE : loot barbare vit en seed SQL, pas en shared TS → ancrer sur loot tier = lecture world config en plus. (B) table de chiffres fixes par band.
- **Q3 — Plafond total/jour** : ~10-12% du revenu journalier de la band — confirmer la base (prod brute des producteurs au niveau band ? crowns inclus ou non ?).
- **Q4 — Structure récompense** : par-carte (sommée à la génération, **zéro migration**) vs par-tâche (migration `DailyCardTask`, plus granulaire). La décision user « récompense par mission » penche par-tâche → arbitrer migration vs `metadata`.
- **Q5 — Granularité band** : 1 château = 1 band (1-10) ou regroupements early/mid/late.

## Points d'attention

- **a)** `BattleResolvedPayload` (`packages/shared/src/events/types.ts:36-51`) sans tier aujourd'hui → si Q1-A, breaking change shared back+front (rebuild `@battleforthecrown/shared` obligatoire avant smokes). Donnée source déjà dispo.
- **b)** Tiers barbares gated par **distance**, pas par level (`seed-default-world-config.sql:47-110`, T1 8-20 tiles … T5 50-60). Mission « tier ≥ floor » doit rester **atteignable** depuis le joueur — sémantique floor, pas « exactement Tn ».
- **c)** Conflit session 5-15 min (`05:40`) : upgrade niv≥9 ≈ 2 jours (`buildings.ts:102`, 172800s) → infaisable dans la fenêtre. Le floor construction doit rester complétable en 1 jour ; la difficulté monte par combat (tier/distance) + quantité, **pas** par exiger un gros upgrade.
- **d)** Projection actuelle `+1`/event ignore `completedQty` (`retention.service.ts:345`) → quantité scalée impose d'adapter ; régression silencieuse possible si oublié.
- **e)** `DailyCardTask.metadata` (Json) déjà présent et **inexploité** → vecteur naturel pour stocker tier/quantité par tâche **sans migration**. Préférer ça à de nouvelles colonnes tant que possible.
- **f)** Loot barbare = seed SQL, pas formule shared → ancrer la récompense sur prod (`production.ts`) est self-contained ; sur loot réel coûte une lecture world config. Trancher en Q2.
- **g)** **Deux chemins de création de carte** : `ensureDailyCard` (`retention.service.ts:228`) + `ensureDailyCardInTransaction` (`:365`) — appliquer le scaling aux **deux**, sinon incohérence selon que la carte naît au `getSummary` ou à un event.
- **h)** Si Q4 = par-carte, la « proportionnalité par mission » est conceptuelle (somme), pas persistée. Clarifier avant toute migration.

## Critère de fin (acceptance)

- [ ] Deux joueurs à château max différents reçoivent des cartes avec missions et/ou récompenses différentes (automatisable : test module scaling pur).
- [ ] Le helper château max retourne le max parmi tous les villages du joueur sur le monde, fallback 1 sans château (automatisable : test agrégat).
- [ ] `battle.resolved` porte `targetTier` non-null pour une cible `BARBARIAN_VILLAGE` (automatisable : test worker/type) — _si Q1-A retenu_.
- [ ] Une tâche RAID floor tier `T_n` ne progresse pas sur une victoire tier < `T_n`, progresse sur tier ≥ `T_n` (automatisable : test projection) — _si Q1-A_.
- [ ] Une tâche `target>1` progresse de `completedQty` et ne passe `CLAIMABLE` qu'à `progress>=target` (automatisable : test projection ; couvre le bug `+1` actuel).
- [ ] Récompense totale/jour ≤ plafond Q3 de la band (automatisable : test borne sur table de scaling).
- [ ] `yarn static-check` vert, shared rebuild inclus (automatisable).
- [ ] Le widget affiche la cible scalée lisible en <5s (« Vaincre un barbare T3 », progress x/y) (visuel/gameplay : checklist Kelvin IG).
- [ ] À haut château, aucune mission construction n'exige un upgrade infaisable en 1 jour (visuel/gameplay : checklist Kelvin IG).

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Prisma : skill `bftc-prisma`
- Workers/Outbox : skill `bftc-workers-outbox`
- Frontend HUD : skill `bftc-react-hud`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

Décomposition pressentie (issue du planning, à confirmer/replanner à l'étape 3) :

- **T1** — Helper « château max joueur/monde » : requête agrégée Building `CASTLE` + tests purs. (≤2 fichiers)
- **T2** — Module de scaling pur (shared ou backend) : table band → 3 missions (type, target, metadata tier/qty) + récompense. Pure-logic testable. (≤3)
- **T3** — Câbler la génération : `ensureDailyCard` + `ensureDailyCardInTransaction` consomment T1+T2 ; params tâche dans `metadata`. (≤2)
- **T4** — `targetTier` dans `battle.resolved` : `events/types.ts` + `combat.worker.ts:681-701`. (≤3) — _si Q1-A_.
- **T5** — Projection scalée : `progressMatchingTaskForDay` + `getTaskProjection` supportent `target>1` (`completedQty`) et filtre tier via `metadata`. (≤2)
- **T6** — _(conditionnel Q4=par-tâche)_ migration Prisma reward par tâche + `mapCard`/DTO. (≤4)
- **T7** — Front `DailyRetentionWidget` : affichage cible scalée (tier/quantité, progress x/y). (≤2)
- **T8** — Docs `05-daily-cards-and-oyez.md` : proxy château max, bandes, plafond, leviers. (1)

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] <critère> — `<commande>` → <résultat observé>
- **Review indépendante** : `Déclenchée (raison: back+front + payload WS partagé + boucle anti-farm / chemin économique)` — verdict à remplir.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : `server + curl` / REST / WS / worker / `SELECT` DB selon pertinence.
- **Tests IG à faire par le user** : checklist observable (widget lisible, floor construction faisable), sinon `Aucun`.
