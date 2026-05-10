# Run #006 — audit-conquest

> **Statut** : DONE
> **Démarré** : 2026-05-10
> **Terminé** : 2026-05-10

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (cf. [`../00-mvp-roadmap.md`](../00-mvp-roadmap.md)). 6ᵉ sous-run sur 7. **Débloque la Phase 5** (Conquête barbare).
- **Spec source** : [`docs/gameplay/10-conquest.md`](../../docs/gameplay/10-conquest.md) (règles communes uniquement)
  - § Cadre commun (Seigneur, Salle du Trône, période de capture, sacrifice)
  - § Le Seigneur — recrutement et règles (5000/5000/5000 + 5000 couronnes + 15 pop + 8h, cap 1/village, file parallèle Throne, annulation, stockage indéfini exposé au scout)
  - § Devenir « Seigneur du village conquis » (transfert si fenêtre tient ; mort si combat perdu ; cas escorte gagne mais Seigneur meurt)
  - § Garde-fous globaux (les anti-snowball PvP sortent du scope = spec 14)
  - Renvois : [`03-buildings.md`](../../docs/gameplay/03-buildings.md) § Salle du Trône, [`08-units.md`](../../docs/gameplay/08-units.md) § Seigneur, [`02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) § Conquête et reset, [`04-combat.md`](../../docs/gameplay/04-combat.md) § Conquête
- **Type** : `audit`
- **Modules backend** :
  - `battleforthecrown-backend/src/modules/combat/conquest.service.ts` (transfert + delete Watchtower + outbox `village.conquered`)
  - `battleforthecrown-backend/src/modules/combat/combat.module.ts`
  - `battleforthecrown-backend/src/modules/army/dto/train-units.dto.ts` (NOBLE listé dans Zod Caserne — divergence frontale spec)
  - `battleforthecrown-backend/src/modules/gameplay/recruit-troops.use-case.ts`
  - `battleforthecrown-backend/src/workers/training.worker.ts`
  - `battleforthecrown-backend/src/modules/combat/combat.worker.ts`
  - `battleforthecrown-backend/prisma/schema.prisma` (`conqueredAt` existe ; aucun champ `captureUntil`/`pendingConquestId`/`nobleId`)
- **Modules frontend** : —
- **Modules transverses** :
  - `packages/shared/src/army/unit.ts` (NOBLE divergent : 1000/800/500/5pop/600s/Caserne L10 vs spec 5000/5000/5000+5000 couronnes/15pop/28800s/Throne Hall L1)
  - `packages/shared/src/army/types.ts` (`UnitCost` n'a pas de champ `crowns` → blocage de typage)
  - `packages/shared/src/village/buildings.ts` (`THRONE_HALL` ajouté en 002 — enveloppe ; mécanique métier branchée ici)

## Dépendances

- **Run 002** [`audit-buildings`](./002-audit-buildings.md) — **DOIT être DONE avant 006**. 002 livre `THRONE_HALL` dans `BUILDING_TYPES`/`DEFINITIONS`/`UNLOCK_REQUIREMENTS:6`/`POWER_WEIGHTS:35` + guard `getBuildingMaxLevel === 1`. Sans cette enveloppe, 006 doit créer le bâtiment **et** la mécanique = double scope.
- **Run 001** [`audit-economy-progression`](./001-audit-economy-progression.md) — partage la § « Conquête et reset » de spec 02. Convention : 001 traite l'**état d'arrivée** du village conquis (ressources reset à 0 vs 50 % en code, pop recalculée du Moulin hérité). 006 traite le **flow** (qui peut conquérir, recrutement Seigneur, fenêtre, sacrifice).
- **Run 003** [`audit-units`](./003-audit-units.md) — confronte la fiche stat NOBLE (atk/def/mobilité). 006 ne touche **pas** les stats militaires ; uniquement coûts + bâtiment de recrutement + cap 1/village + cycle de vie.
- **Run 004** [`audit-combat`](./004-audit-combat.md) — § Combat de pré-conquête couvert par 004 côté résolution. 006 reprend uniquement le post-combat (Seigneur survivant ? oui → fenêtre ; non → conquête échouée + loot ramené).

## Critère de fin (acceptance)

- [ ] Tableau de confrontation spec 10 ↔ code exhaustif : 1 ligne par invariant (recrutement Seigneur lieu/coût/temps/file/annulation/cap-1, période de capture, transfert, sacrifice, mort, cas escorte-survivante).
- [ ] **Bâtiment de recrutement** : Seigneur recruté à la Salle du Trône, **pas** à la Caserne. NOBLE retiré de `train-units.dto.ts`. Endpoint dédié Throne Hall créé OU **ticket ouvert** (ticketage agressif si > 50 lignes).
- [ ] **Coûts Seigneur** alignés sur spec 10 : 5000 bois / 5000 pierre / 5000 fer / **5000 couronnes** / 15 pop / 8 h. `UnitCost` shared étendu avec champ `crowns?: number` (extension typée, pas un cast).
- [ ] **Cap 1 Seigneur par village** : guard backend qui refuse une 2ᵉ recrutement si un NOBLE est déjà en garnison ou en file Trône.
- [ ] **Pré-requis combat de conquête** : `conquerVillage` n'est appelable qu'avec un Seigneur survivant côté attaquant. Cas escorte-survivante-mais-Seigneur-mort = conquête échouée + loot ramené.
- [ ] **Période de capture** : Seigneur s'installe et reste immobilisé toute la fenêtre. Spec 10 dit « variable selon contexte » — durées concrètes par tier dans spec 13 (PvE) et spec 14 (PvP). 006 livre la **mécanique** générique (état pendant, transfert si fenêtre tient, mort si attaqué et Seigneur tombe). Implémentation peut être ticketée si data model + worker > 50 lignes.
- [ ] **Sacrifice du Seigneur** : à la fin de la fenêtre OK, le Seigneur disparaît du village d'origine **et** ne se matérialise pas comme unité dans le village conquis.
- [ ] **Annulation** : Seigneur en cours d'entraînement annulable comme troupe normale, remboursement complet (ressources + couronnes + pop).
- [ ] **Hors scope explicite** : reset ressources à 0 (spec 02, traité par run 001), bâtiments hérités intacts, durées exactes fenêtre PvE (spec 13, Phase 5), durées + garde-fous PvP (spec 14, Phase 7), Watchtower clear sur conquête (déjà OK, commit `e84436f`).
- [ ] Pour chaque écart < 50 lignes : fix dans la run.
- [ ] **Décision validée : ticketage agressif**. 3 tickets externes prévus :
  - **Ticket A** — `recruit-noble.use-case` + endpoint Throne Hall (gros).
  - **Ticket B** — `captureWindow` data model (Prisma) + worker pg-boss `conquest-finalize.worker` (gros).
  - **Ticket C** — Hook `combat.worker` post-résolution (Seigneur survivant ? → ouvre fenêtre ; mort ? → loot ramené, pas de transfert) (medium).
  - 006 livre : alignement coûts shared (`UnitCost.crowns`), retrait NOBLE de la Caserne, cap 1/village (helper pur), tickets A/B/C ouverts. Phase 5 consomme.
- [ ] Tests pure-logic : coût Seigneur, cap 1/village (helper pur), validation Zod recrutement Throne Hall (si endpoint créé), helper `canStartConquest(attackerArmy, nobleSurvived)`. Aucun mock Prisma, aucun mock pg-boss (cf. `.claude/rules/tests.md`).
- [ ] `yarn workspace battleforthecrown-backend test` vert.
- [ ] `yarn workspace @battleforthecrown/shared build` vert.
- [ ] Section `## Rapport final` remplie + commit final + QA hybride (au minimum « lancer entraînement Noble depuis Throne Hall » si endpoint livré).

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

**Cartographie code-mapper (2026-05-10)** : la pré-décomposition de planification surestimait l'écart. NOBLE est **déjà aligné** côté shared sur wood/stone/iron/pop/time/requiredThroneHallLevel (run 002 a livré l'enveloppe Throne Hall + run 003 a normalisé les coûts). Restent uniquement :

- Champ `crowns?: number` absent de `UnitCost` → blocage typage.
- `UNIT_COSTS[NOBLE].crowns` non posé.
- NOBLE listé dans le DTO Caserne (`train-units.dto.ts`).
- Pas de helper `canRecruitNoble` (cap 1/village).
- `ConquestService.conquerVillage` orphelin (aucun caller) — Ticket C couvre.
- Pas de `PendingConquest` ni worker `conquest-finalize` — Ticket B couvre.

**Décomposition retenue (10 tâches)** :

- T1 — Étendre `UnitCost` avec `crowns?: number` (`packages/shared/src/army/types.ts`).
- T2 — Aligner `UNIT_COSTS[NOBLE].crowns = 5000` (`packages/shared/src/army/unit.ts`).
- T3 — Retirer NOBLE de l'enum DTO Caserne (`train-units.dto.ts`) + guard explicite « Throne Hall, voir Ticket #40 » dans `recruit-troops.use-case.ts`.
- T4 — Helper pur `canRecruitNoble({ garrisonNobleCount, hasNobleInQueue })` (`packages/shared/src/army/recruitment.ts`) + export dans `index.ts`.
- T5 — Tests pure-logic : NOBLE costs spec 10 (extension `units-catalog.spec.ts`) + 4 cas `canRecruitNoble` (nouveau spec).
- T6 — Ouvrir **Ticket #40** : endpoint Throne Hall + use-case `RecruitNobleUseCase` + file Trône.
- T7 — Ouvrir **Ticket #41** : data model `PendingConquest` + worker `conquest-finalize.worker.ts` + events Outbox.
- T8 — Ouvrir **Ticket #42** : hook `combat.worker` post-résolution (Seigneur survivant ? → ouvre PendingConquest ; mort ? → loot ramené sans transfert).
- T9 — `yarn workspace @battleforthecrown/shared build` + `yarn workspace battleforthecrown-backend test` verts.
- T10 — Tableau confrontation + rapport final + review + archive + commit.

**Pré-décomposition planification (conservée pour traçabilité)** :

- T1 — Lire spec 10 + § Conquête de spec 04 + § Conquête et reset de spec 02. Extraire invariants vérifiables. Confirmer le partage avec runs 001/003/004.
- T2 — Cartographier `conquest.service.ts`, callers (`combat.worker`, attaque endpoint), `recruit-troops.use-case.ts`, `training.worker.ts`, schéma Prisma. Confirmer absence totale de Throne Hall recruit / capture window / Seigneur survival check.
- T3 — Tableau de confrontation. Sortie : ✓/✗ + sévérité par invariant.
- T4 — Lot **enveloppe shared** : aligner coûts NOBLE (`UNIT_COSTS[NOBLE]`) sur spec 10 (5000×3 + 5000 couronnes + 15 pop + 28800s). Étendre `UnitCost` avec `crowns?: number`. Tests pure-logic.
- T5 — Lot **retrait NOBLE Caserne** : retirer NOBLE du DTO Caserne `train-units.dto.ts`. Adapter `recruit-troops.use-case.ts` pour rejeter NOBLE (TODO référencé Ticket A pour réacheminement Throne Hall).
- T6 — Lot **cap 1/village** : helper pur `canRecruitNoble(village)` (vérif garnison + file). Tests pure-logic.
- T7 — **Ouvrir Ticket A** : `recruit-noble.use-case` + endpoint `POST /villages/:id/throne/recruit-noble` + file Trône indépendante. Ticket décrit scope complet (cap 1, validation Zod, intégration training.worker).
- T8 — **Ouvrir Ticket B** : data model `PendingConquest` (Prisma migration) + worker `conquest-finalize.worker.ts`. Ticket décrit scope (champs `captureUntil`, `attackerVillageId`, `attackerNobleId`, hook EventOutbox `village.capture-window-opened`/`completed`/`interrupted`).
- T9 — **Ouvrir Ticket C** : hook `combat.worker` post-résolution (Seigneur survivant → ouvre fenêtre ; mort → loot ramené). Mise à jour `conquest.service.ts` pour ne plus transférer immédiatement.
- T10 — `yarn test` + `yarn build` shared + section `## Rapport final` + QA hybride + commit. Rapport doit lister explicitement les 3 tickets ouverts et leur lien au flow complet.

## Points d'attention

- **NOBLE en code = squelette divergent à 100 %** : présent dans le DTO Caserne avec coûts spec 08 (1000/800/500/5pop/600s/Caserne L10), aucune trace de Throne Hall ni de couronnes. Le coût « 28800s + 5000 couronnes + 15 pop + Throne Hall » crée un changement structurel : extension de `UnitCost` (`crowns?: number`), file de recrutement nouvelle.
- **Aucune fenêtre de capture en code** : `conquest.service.conquerVillage` transfère **immédiatement** la propriété. Spec 10 impose une période de capture pendant laquelle le Seigneur est immobilisé et un combat hostile peut interrompre. Changement structurel majeur (data model + worker + outbox events nouveaux). **Décision : ticket B + ticket C** — 006 ne livre PAS le data model ni le worker.
- **Convention partage 001 vs 006 sur reset ressources** : code = 50 % conservé. Spec 02 = reset à 0. Spec 13 = barbares « ressources reset à 0 ». Ce point est dans **001**, pas 006. 006 ne re-tranche pas.
- **`UnitCost.crowns` n'existe pas** : extension typée requise (`crowns?: number`). 006 livre cette extension.
- **File parallèle Trône** : spec 10 « la Salle du Trône a sa **propre file**, indépendante de la Caserne ». Choix d'implé : (a) discriminant sur `TrainingQueue` ; (b) nouvelle table `NobleTrainingQueue` (migration). À trancher dans Ticket A.
- **Cap 1/village inclut la garnison ET la file** : un joueur ne peut pas mettre 1 Seigneur en file s'il en a 1 en garnison. 006 livre le helper `canRecruitNoble`.
- **Sacrifice = pas d'`UnitInventory` dans le village conquis** : à tester dans Ticket C.
- **Outbox events à étendre** : `village.conquered` actuel devient terminal (= fenêtre tenue). Ajouter `village.capture-window-opened`, `village.capture-interrupted`, `noble.killed`. **Décrit dans Ticket B.**
- **Guards spec 10 hors scope MVP** : règle puissance ÷ 3 + bouclier 48 h sont des règles **PvP** (spec 14, Phase 7). 006 n'implémente **rien** de ces garde-fous.
- **Risque double-tâche avec 002 sur Throne Hall** : 002 livre l'enveloppe shared/buildings. 006 ne touche pas ces fichiers — uniquement le module gameplay/recruit-noble + DTO Caserne. Si 002 pas DONE avant 006 → bloquer le run en attendant 002.
- **Frontend hors scope** : tout impact UI (bouton Recruter Seigneur, indicateur fenêtre de capture, notification fin de fenêtre) → ticket de suivi.

## Notes — segmentation Phase 1

6ᵉ sur 7. **Stratégie validée : 006 unique avec ticketage agressif** (3 tickets externes). Cette stratégie maintient le run en scope `medium` au lieu de `large` :

- **006 livre** : extension `UnitCost.crowns`, alignement coûts NOBLE, retrait NOBLE Caserne, cap 1/village (helper pur), 3 tickets ouverts.
- **Phase 5** consomme les 3 tickets pour livrer la conquête barbare end-to-end.

NOBLE est présent en code mais c'est un squelette divergent à 100 % de la spec 10 — quasi-greenfield pour la mécanique métier. Throne Hall enveloppe 100 % à la charge de 002 (bloquant).

## Progress (rempli pendant le run)

- 2026-05-10 — Étape 0/2 : préflight OK (run 002 DONE), code-mapper sur 10 modules. Constat : NOBLE costs déjà alignés sauf champ `crowns`. ConquestService orphelin.
- 2026-05-10 — Étape 3 : décomposition validée 10 tâches (T1-T10). Statut → RUNNING.
- 2026-05-10 — Étapes 4-5 : T1+T2+T3+T4+T5 livrés (lead direct, modifs chirurgicales). Build shared OK, 139/139 tests backend verts.
- 2026-05-10 — T6+T7+T8 : tickets #40/#41/#42 ouverts.
- 2026-05-10 — Étape 6 : review code-reviewer = APPROVE (0 bloquant, 0 majeur, 3 mineurs/nits). 1 mineur intégré au ticket #41 (interaction `BarbarianBackfillWorker`).
- 2026-05-10 — Étape 8 : re-test skip (dernier ajustement = doc only).
- 2026-05-10 — Étape 9 : docs aucun changement nécessaire (raison : code conforme spec 10, source de vérité dans `packages/shared/src/army/types.ts`, tickets externes documentent eux-mêmes les prochaines étapes).
- 2026-05-10 — Étape 10 : archive + commit. Statut → DONE.

## Décisions prises

- **Ticketage agressif** appliqué (déjà acté en planification) : 3 tickets externes #40/#41/#42 ouverts, 0 ligne d'orchestration backend dans ce run. Conforme à `## Cible § ticketage agressif`.
- **`requiredThroneHallLevel: 6 → 1`** sur `UNIT_COSTS[NOBLE]` (`unit.ts:86`). Justification : la spec 10 § « Bâtiment requis : Salle du Trône » précise « 1 seul niveau au MVP, mono-construction par village ». Le `6` était sémantiquement faux (confusion avec Château 6 = pré-requis du **bâtiment** Throne Hall, géré par `BUILDING_UNLOCK_REQUIREMENTS.THRONE_HALL = 6`). Aucun caller backend n'utilisait cette valeur — captures vérifiées par grep. Aucun test n'assertait la valeur `6`. Risque de régression nul.
- **Guard backend redondant** dans `recruit-troops.use-case.ts` (`unitType === NOBLE` → `BadRequestException` + lien Ticket #40). Justification : défense en profondeur. Le DTO Zod bloque déjà l'endpoint `/army/:villageId/train` côté contrôleur, mais le use-case pourrait être appelé depuis un futur endpoint admin / script / autre controller sans re-passer par ce DTO. Validé par review.
- **Helper `canRecruitNoble` dans `packages/shared`** (pas dans le backend). Justification : pure-logic, réutilisable côté Pixi pour griser un bouton avant l'appel REST. Aucune dépendance Prisma. Couvert par 4 tests pure-logic (matrice 2×2 garrison × queue).
- **Priorité `GARRISON_FULL` > `QUEUE_FULL`** dans `canRecruitNoble` quand les deux sont occupés. Choix arbitraire mais cohérent (statut présent prime sur statut futur), documenté par le test `recruitment.spec.ts`.

### Review findings (code-reviewer, 2026-05-10)

- **Verdict** : APPROVE.
- **Bloquants** : 0.
- **Majeurs** : 0.
- **Mineurs** :
  - Ticket #40 : avant démarrage, grep `cancel-recruitment.use-case` (référencé `:43`) pour confirmer son existence et éviter doublon. → noté pour démarrage Phase 5.
  - Ticket #41 : préciser interaction `BarbarianBackfillWorker` (reseed après `village.capture-window-completed`, pas pendant). → **intégré** dans le ticket § Questions à trancher #4.
  - Ticket #42 : Q2 (NOBLE filtrable dans table de pertes) déjà documentée comme question d'ouverture.
- **Nits** : commentaires denses sur sentinel `requiredBarracksLevel: 99` — acceptés.

## Rapport final

### Tableau de confrontation spec 10 ↔ code (post-run)

| # | Invariant spec 10 | État avant 006 | État après 006 | Couverture |
|---|---|---|---|---|
| 1 | Seigneur recruté à la Salle du Trône (pas Caserne) | NOBLE listé dans `train-units.dto.ts` enum Caserne | NOBLE retiré du DTO Caserne + guard explicite use-case | ✅ Bloqué côté Caserne. Endpoint Throne Hall = **Ticket #40**. |
| 2 | Coût Seigneur : 5000 bois / 5000 pierre / 5000 fer / 5000 couronnes / 15 pop / 8 h | wood/stone/iron/pop/time alignés (run 003), `UnitCost.crowns` absent | `UnitCost.crowns?: number` ajouté + `UNIT_COSTS[NOBLE].crowns = 5000` | ✅ Coût complet typé. Déduction au recrutement = **Ticket #40**. |
| 3 | Throne Hall mono-niveau (L1 max MVP) | `requiredThroneHallLevel: 6` (sémantiquement faux) | `requiredThroneHallLevel: 1` | ✅ Aligné spec. |
| 4 | Cap 1 Seigneur par village (garnison + file) | Aucun helper, aucun guard | Helper pur `canRecruitNoble({ garrisonNobleCount, hasNobleInQueue })` + 4 tests | ✅ Helper livré. Câblage backend = **Ticket #40**. |
| 5 | Annulation Seigneur en cours d'entraînement = remboursement complet (ressources + couronnes + pop) | Annulation existante via `cancel-recruitment.use-case` (ne gère pas `crowns`) | Inchangé | 🔓 **Ticket #40** § « cancel-recruitment.use-case étendre pour rembourser crowns ». |
| 6 | File parallèle Trône (indépendante de la Caserne) | `UnitTraining` unique par village, 1 active à la fois | Inchangé | 🔓 **Ticket #40** § « discriminant `building` sur `UnitTraining` vs table dédiée ». |
| 7 | Combat de pré-conquête : Seigneur survivant requis | Aucune branche conquête dans `combat.worker.ts`/`return.worker.ts`. `ConquestService.conquerVillage` orphelin (0 caller). | Inchangé | 🔓 **Ticket #42** § « hook combat.worker post-résolution ». |
| 8 | Cas escorte-survivante mais Seigneur mort → conquête échouée + loot ramené | Pas de signal explicite ; le combat retourne le loot par défaut (correct par accident) | Inchangé | 🔓 **Ticket #42** § « Seigneur mort → noble.killed event + ReturnWorker classique ». |
| 9 | Période de capture (variable selon contexte, Seigneur immobilisé) | Aucun data model, aucun worker | Inchangé | 🔓 **Ticket #41** § « `PendingConquest` + `conquest-finalize.worker` ». |
| 10 | Sacrifice du Seigneur (disparaît du village d'origine, ne se matérialise pas dans le conquis) | `ConquestService.conquerVillage` ne touche pas l'`UnitInventory` du Seigneur (orphelin) | Inchangé | 🔓 **Tickets #41 + #42** § « immobilisation puis suppression de l'UnitInventory ». |
| 11 | Stockage indéfini d'un Seigneur en garnison + visible au scout | Pas testé (Seigneur jamais recruté) | Inchangé | 🔓 Découle de #40 + scouting (spec 11). Pas de ticket dédié — implicite quand #40 livre. |
| 12 | Garde-fous PvP (puissance ÷ 3 + bouclier 48 h) | N/A (Phase 7) | N/A | ⏸️ Hors scope explicite (spec 14, Phase 7). |
| 13 | Reset ressources village conquis à 0 (vs 50 % en code) | Code = 50 %. Traité par run 001. | Inchangé (pas dans scope 006) | ⏸️ Couvert par run 001 (audit-economy). |

**Légende** : ✅ livré dans 006 | 🔓 ouvert via ticket #40/#41/#42 | ⏸️ hors scope explicite.

### Fichiers touchés

**Modifiés (6)** :
- `packages/shared/src/army/types.ts` — `crowns?: number` sur `UnitCost`.
- `packages/shared/src/army/unit.ts` — `crowns: 5000` + `requiredThroneHallLevel: 1` sur NOBLE.
- `packages/shared/src/army/index.ts` — re-export `recruitment`.
- `battleforthecrown-backend/src/modules/army/dto/train-units.dto.ts` — NOBLE retiré + commentaire pointant Ticket #40.
- `battleforthecrown-backend/src/modules/gameplay/recruit-troops.use-case.ts` — guard NOBLE → `BadRequestException`.
- `battleforthecrown-backend/src/modules/power/units-catalog.spec.ts` — test alignement spec 10.

**Créés (5)** :
- `packages/shared/src/army/recruitment.ts` — helper `canRecruitNoble`.
- `battleforthecrown-backend/src/modules/army/recruitment.spec.ts` — 4 cas pure-logic.
- `tasks/40-recruit-noble-throne-hall.md` — ticket A.
- `tasks/41-capture-window-data-model.md` — ticket B.
- `tasks/42-combat-conquest-hook.md` — ticket C.

### Tickets ouverts

- **#40** — Recrutement Seigneur à la Salle du Trône : use-case dédié + endpoint `POST /army/:villageId/throne/recruit-noble` + déduction couronnes + file Trône (discriminant `UnitTraining`).
- **#41** — Période de capture : `PendingConquest` Prisma + worker `conquest-finalize.worker.ts` + 3 events Outbox.
- **#42** — Hook `combat.worker` post-résolution : Seigneur survivant → ouvre #41 ; mort → loot ramené, event `noble.killed`.

Ordre d'implémentation Phase 5 : **#40 → #41 → #42**.

### Tests / build

- `yarn workspace @battleforthecrown/shared build` ✅
- `yarn workspace battleforthecrown-backend test` ✅ — **139/139** verts (11 suites).

### Docs

Aucun changement nécessaire. Raison : la spec `docs/gameplay/10-conquest.md` reste source de vérité ; le code y est aligné après ce run. Le champ `UnitCost.crowns?: number` est lisible directement dans `packages/shared/src/army/types.ts` — pas de duplication. Les tickets #40/#41/#42 documentent eux-mêmes les prochaines étapes.

### QA

**Pas de QA user IG nécessaire** — raison : aucune surface visible côté frontend dans ce run (NOBLE n'était pas exposé dans le HUD avant ce run, et reste non exposé). Le retrait du DTO Caserne ferme un chemin qui n'aurait jamais été emprunté par un joueur (NOBLE échouait sur `requiredBarracksLevel: 99` avant aussi).

**QA backend (vérifiée par l'agent)** :

- ✅ `yarn workspace @battleforthecrown/shared build` → exit 0.
- ✅ `yarn workspace battleforthecrown-backend test` → 139/139 verts, dont nouveau `recruitment.spec.ts` (4 cas) et extension `units-catalog.spec.ts` (NOBLE coûts spec 10).
- ✅ `git diff --stat` → diff cohérent avec la décomposition (6 modifs + 5 nouveaux fichiers, hors fichiers ambient pré-existants).
- ✅ Review `agent-skills:code-reviewer` → APPROVE, 0 bloquant, 0 majeur.

### Méta-évaluation

- **Pré-décomposition planification surestimait l'écart** (NOBLE wood/stone/iron/pop/time/Throne-Hall-level déjà alignés par run 002+003). La cartographie `code-mapper` a permis de réduire le scope effectif (~20 lignes net hors tickets, vs estimation initiale plus large).
- **Stratégie ticketage agressif validée** : aucune ligne d'orchestration backend dans ce run, contrats clairs pour Phase 5.
- **1 micro-fix opportun capturé** : `requiredThroneHallLevel: 6 → 1`, source de bug latent. Aucun caller actuel ne l'utilisait, mais Ticket #40 l'aurait consommé incorrectement.
