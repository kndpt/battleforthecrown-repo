# Run #006 — audit-conquest

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

Pré-décomposition indicative (9 tâches) — **stratégie ticketage agressif** :

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

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décision préalable actée : ticketage agressif validé en planification — voir Notes ci-dessus.)_

## Rapport final

_(Vide au démarrage.)_
