# Run #097 — fix-noble-cap-inflight-occupation

> **Statut** : DONE
> **Démarré** : 2026-07-13
> **Terminé** : 2026-07-13

## Cible

- **Phase roadmap** : Phase 5 — Conquête barbare (`tasks/00-mvp-roadmap.md:62-70`, recrutement Seigneur + période de capture)
- **Spec source** : `docs/gameplay/10-conquest.md:62-66` (§ « Cap : 1 Seigneur par village »)
- **Type** : fix
- **Modules** : backend `modules/gameplay/recruit-noble.use-case.ts` | shared `packages/shared/src/army/recruitment.ts` | docs `docs/gameplay/10-conquest.md`

## Dépendances

- Aucune. Run autonome — le code de conquête (recrutement Seigneur, fenêtre de capture, garnison d'occupation) existe déjà.

## Symptôme

Le cap « 1 Seigneur par village » n'est appliqué qu'aux Seigneurs **présents** au village : garnison (`unitInventory` NOBLE) + file Trône (`unitTraining` THRONE_HALL). Un Seigneur **parti en conquête** est invisible au gate de recrutement, donc le village d'origine peut recruter un 2ᵉ Seigneur avant que la conquête soit résolue → 2 Seigneurs simultanés issus d'un seul village, en violation de `10-conquest.md:62-64`.

Cycle de vie non couvert :
1. Lancement de l'attaque → le NOBLE est décrémenté de `unitInventory` (`combat.service.ts` `verifyAndDeductUnits`) → garnison d'origine = 0.
2. Marche (`Expedition` EN_ROUTE) puis fenêtre de capture (`PendingConquest` OPEN) → le NOBLE survivant est stationné en `Garrison` **sur la cible** (`originVillageId` = village d'origine) — invisible au gate du village d'origine.
3. Pendant toute cette période, `canRecruitNoble` retourne `allowed: true` alors qu'un Seigneur est déjà « en usage ».

## Cause racine

`canRecruitNoble` (`packages/shared/src/army/recruitment.ts:28-36`) et le gate use-case (`recruit-noble.use-case.ts:101-104`) définissent « posséder un Seigneur » = garnison **OU** file. Origine : run 40 (`tasks/archive/40-recruit-noble-throne-hall.md`) + audit 006 (`tasks/runs/archive/006-audit-conquest.md`) ont figé cette définition sans envisager le cycle de vie sortant (vol + occupation).

## Comportement attendu

Le cap « 1 Seigneur par village » couvre **garnison + file + en-vol + en-occupation**. Le village d'origine ne peut re-recruter un Seigneur qu'une fois la conquête **résolue** :
- Conquête **réussie** (`PendingConquest` COMPLETED, Seigneur installé dans le village conquis) → re-recrutement autorisé (le Seigneur n'appartient plus au village d'origine).
- Conquête **échouée / interrompue** → le Seigneur revient ; le re-recrutement redevient possible seulement quand il est de nouveau comptabilisé (garnison d'origine) — sans double comptage transitoire.

## Pistes

- **Piste A (agrégat)** : le use-case calcule un seul `nobleInUseCount` = garnison + Expedition(NOBLE sortante non résolue) + Garrison(NOBLE `originVillageId` = village) et le passe à `canRecruitNoble`. Minimal, un seul message d'erreur générique.
- **Piste B (raisons distinctes)** : ajouter à `canRecruitNoble` des entrées `nobleInFlightCount` / `nobleOccupyingCount` + reasons `IN_FLIGHT` / `OCCUPYING` pour des messages clairs (« Seigneur en campagne », « Seigneur en occupation »). Plus de surface, meilleure UX/observabilité.
- **Signal métier le plus propre** : occupation via `PendingConquest` status=OPEN AND `attackerVillageId`=village ; vol via `Expedition` status=EN_ROUTE AND kind=ATTACK AND `units` JSON contient NOBLE>0. À trancher en refinement : s'appuyer sur les états métier (PendingConquest + Expedition) vs l'état physique (Garrison away) — recouvrement partiel.

## Scope recommandé

### Shared
- `packages/shared/src/army/recruitment.ts` — élargir `CanRecruitNobleInput` + `CanRecruitNobleReason` selon la piste retenue. Rebuild `@battleforthecrown/shared`.
- `packages/shared/src/army/recruitment.spec.ts` (ou équivalent) — couvrir les nouveaux états (unit pure-logic).

### Backend
- `battleforthecrown-backend/src/modules/gameplay/recruit-noble.use-case.ts` — ajouter dans le `Promise.all` (sous l'advisory lock existant `training:<villageId>:THRONE_HALL`) le comptage : Expedition sortante NOBLE non résolue + PendingConquest OPEN (+ Garrison away si retenu).
- Éventuelle migration Prisma : index `[attackerVillageId, status]` sur `PendingConquest` (absent aujourd'hui) si la requête l'exige.

### Docs
- `docs/gameplay/10-conquest.md` § Cap — backprop : préciser que le cap couvre garnison + file + vol + occupation, et que le re-recrutement n'est possible qu'à conquête résolue.

## Décomposition initiale

- **T1** — Smoke rouge : recruter A → lancer conquête barbare avec A → tenter recruter B pendant EN_ROUTE puis pendant PendingConquest OPEN → attendu 400. (`recruit-noble.smoke.spec.ts`)
- **T2** — Étendre `canRecruitNoble` (`recruitment.ts`) : nouvelles entrées + reasons selon piste retenue ; mettre à jour l'unit spec pure-logic. Rebuild shared.
- **T3** — Câbler le use-case : requêtes Expedition sortante NOBLE non résolue + PendingConquest OPEN (+ Garrison away si retenu) dans le `Promise.all`, sous l'advisory lock existant.
- **T4** — Couvrir le leg RETURNING/RESOLVED (conquête échouée, Seigneur en retour avec `survivingUnits` NOBLE non encore atterri) : décider s'il compte, éviter le trou de fenêtre et le double comptage.
- **T5** — Ajouter l'index Prisma `[attackerVillageId, status]` sur `PendingConquest` si le comptage l'exige (migration).
- **T6** — Backprop doc `10-conquest.md` § Cap.
- **T7** — Rendre le smoke T1 vert + `yarn static-check` + suite conquête.

## Critère de fin (acceptance)

- [x] [smoke] Recruter A, lancer conquête avec A, tenter recruter B pendant EN_ROUTE → 400. (`recruit-noble.smoke.spec.ts`)
- [x] [smoke] Idem pendant `PendingConquest` status=OPEN (Seigneur en occupation sur la cible) → 400.
- [x] [smoke] Après conquête COMPLETED (Seigneur installé dans le village conquis), le village d'origine peut re-recruter → 201.
- [x] [smoke/SQL] Après conquête interrompue/échouée et retour du Seigneur, re-recrutement possible sans double comptage.
- [x] [test unit] `canRecruitNoble` couvre les nouveaux états avec la reason attendue.
- [x] [smoke] **Interleaving** : recrutement de B et finalisation/interruption de la conquête de A en concurrence → aucun état où 2 Seigneurs coexistent, aucun faux blocage post-résolution (couvre la fenêtre TOCTOU du verrou, cf. Points d'attention).
- [x] [grep/build] Aucun appelant de `canRecruitNoble` laissé sur l'ancienne signature ; `@battleforthecrown/shared` rebuild.
- [x] [static] `yarn static-check` vert.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-prisma`, `bftc-workers-outbox`, `bftc-tests-policy`, `bftc-qa`
- Connexes : `tasks/archive/40-recruit-noble-throne-hall.md` (gate cap = garnison+file, origine du gap), `tasks/runs/archive/006-audit-conquest.md` (cap défini « garnison OU file », cas en-vol jamais envisagé), `tasks/archive/43-noble-loss-chance-on-costly-victory.md` + `tasks/archive/16-pre-conquest-noble-dies-army-wins.md` (cycle de vie Seigneur).

## Points d'attention

- **Couverture continue** : EN_ROUTE (vol) → PendingConquest OPEN + Garrison(NOBLE away) (occupation) → COMPLETED (Seigneur consommé/installé) ou RETURNING (échec, retour). Le leg RETURNING/RESOLVED avec `survivingUnits` NOBLE n'est ni en inventaire ni en garnison d'origine tant qu'il n'a pas atterri → risque de fenêtre où le cap n'est pas appliqué. À trancher en refinement.
- **TOCTOU du verrou (bloquant refinement)** : l'advisory lock existant `training:<villageId>:THRONE_HALL` ne sérialise **que** `recruit-noble.use-case.ts`. Les writers de conquête — `ConquestService.openCaptureWindowInTx`, `interruptCaptureWindowInTx` et la finalisation (`conquest-finalize.worker.ts`) — n'acquièrent **pas** cette clé. Un comptage qui s'appuie uniquement sur le `Promise.all` sous ce lock laisse donc une fenêtre TOCTOU : une ouverture/interruption/finalisation de fenêtre de capture peut committer en parallèle du gate de recrutement et fausser le décompte (double recrutement, ou faux blocage). **Le run doit trancher** : (a) faire acquérir la **même clé de lock** (`training:<villageId>:THRONE_HALL`) par les writers de conquête concernés — attention aux risques d'interblocage / d'ordre d'acquisition —, OU (b) s'appuyer sur un invariant DB atomique (état métier lu dans la même tx avec une garantie de sérialisation suffisante) + **un test d'interleaving dédié** prouvant l'absence de course. Ne pas considérer le lock training seul comme suffisant.
- `Expedition.units` est du JSON non indexé → le comptage NOBLE en vol nécessite un parse applicatif, pas de filtre SQL direct. Préférer `PendingConquest` OPEN (état métier propre) quand possible.
- `PendingConquest` n'a pas d'index `[attackerVillageId, status]` → l'ajouter si une requête sur ce champ est introduite.
- Attaque simple (kind=ATTACK non-conquête) emmenant un NOBLE : peu probable (le NOBLE ne sert qu'à conquérir) mais confirmer que le domaine l'interdit, sinon le comptage doit le couvrir aussi.
- La spec ne définit pas explicitement l'état « en vol/occupation » comme comptant dans le cap — c'est une interprétation de l'invariant (pas de 2 Seigneurs simultanés issus d'un village). À faire valider en étape 1 du pipeline avant backprop doc.
- Message d'erreur front : vérifier si l'UI de recrutement affiche un libellé spécifique (piste B) ou générique — probablement aucun changement front (gate 100 % backend).

## Review indépendante

**Requise** : invariant gameplay + surface de concurrence cross-entités (comptage lisant `Expedition`/`PendingConquest`/`Garrison` sous l'advisory lock training existant — risque de trou si un état transitoire n'est pas couvert, ou de faux positif bloquant le re-recrutement légitime post-conquête). Backprop SPEC à valider. Un relecteur indépendant doit confirmer la couverture continue vol → occupation → résolution.

## Rapport final

Cap « 1 Seigneur par village » élargi à tout le cycle de vie (garnison + file + en-vol/retour + occupation). Gate `recruit-noble` passé en tx `Serializable` + `withSerializableRetry` (pattern des writers de conquête) pour un comptage cross-entités race-free ; `canRecruitNoble` étendu (reasons `IN_FLIGHT`/`OCCUPYING`) ; index `PendingConquest[attackerVillageId,status]`. Décision TOCTOU : snapshot Serializable+SSI plutôt qu'advisory lock partagé sur les writers de conquête _(git history)_.

### Acceptance & QA

**Critères d'acceptance vérifiés**
- [x] EN_ROUTE → 400 — `test:smoke:run recruit-noble.smoke` → « blocks recruiting while a noble is EN_ROUTE (IN_FLIGHT) » vert
- [x] PendingConquest OPEN → 400 — idem → « blocks recruiting while a noble occupies a target (OCCUPYING) » vert
- [x] COMPLETED → 201 — idem → « allows recruiting once the conquest is resolved (COMPLETED) » vert
- [x] Retour échec sans double comptage — idem → « blocks a surviving noble returning home but allows a lost one » + « allows recruiting once a conquest is interrupted (INTERRUPTED) » vert
- [x] Unit `canRecruitNoble` nouveaux états/reasons — `test recruitment.spec` → 6/6 (IN_FLIGHT, OCCUPYING, priorité GARRISON>QUEUE>IN_FLIGHT>OCCUPYING)
- [x] Interleaving concurrent (recruit || atterrissage retour) — smoke « interleaving: recruit racing a noble landing home never breaks the cap (#6) » 8 rounds non-vacants (RESOLVED+inventory=1 asserté), `noblesOwnedBy===1`, recruit=400
- [x] Aucun appelant sur ancienne signature + shared rebuild — `grep canRecruitNoble` = 1 caller (use-case) ; `shared build` OK
- [x] `yarn static-check` vert

**Review indépendante** : Déclenchée (raison: invariant durable + concurrence cross-entités + diff>100 lignes + backprop doc). Cycles 1-2 BLOCK (couverture #6 puis vacuité du test de preuve), cycle 3 **GO** (test course-vs-retour non-vacant, 0 finding bloquant/majeur ; 3 mineurs dont docstring corrigée).

**Tests automatisés** : `test recruitment.spec` 6/6 ; suite unit backend 600/600.

**Smokes lancés** (Ciblés) : `test:smoke:preflight` OK ; `test:smoke:run recruit-noble.smoke` 8/8 ; filet conquête (`conquest-service`, `conquest-finalize`, `capture-defender`, `combat-conquest-hook`) 13/13. Full smoke = CI PR.

**Smokes ajoutés/modifiés** : `test/recruit-noble.smoke.spec.ts` — +6 tests (EN_ROUTE, OCCUPYING, COMPLETED, RETURNING vivant/mort, INTERRUPTED, interleaving retour #6).

**QA fonctionnelle agent** : couverte par smokes REST + états DB conquête. Limite documentée : fenêtre torn-read TOCTOU sub-milliseconde non forçable en smoke black-box (bascule empirique ReadCommitted ×24 sans échec) ; correction adossée à Serializable+SSI (mécanisme commun à tous les writers de conquête). Le test #6 prouve l'invariant sous concurrence réelle, non-vacant.

**Tests IG à faire par le user** : Aucun — gate 100 % backend, aucun rendu Pixi/React ni shape payload front modifiés.

### Docs
Docs : mises à jour — `docs/gameplay/10-conquest.md` § Cap (couverture cycle de vie complet ; résolution = seule libération du cap).
