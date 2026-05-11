# Tasks — chantiers post-audit

Chantiers identifiés après la résolution complète de l'audit (`docs/architecture/audit/`). Chacun est un ticket `.md` factuel avec état actuel + pistes + question à trancher. Aucune décision préalable — l'user tranche, l'agent exécute.

## Tickets actifs

_(Aucun ticket actif.)_

## Roadmap stratégique

- [00 — Roadmap MVP](./00-mvp-roadmap.md) — ordre d'implémentation des phases gameplay non encore codées. Document directeur dont seront dérivés les tickets actionables phase par phase.

## Runs (exécutions semi-autonomes)

Fiches d'exécution déléguées aux harnesses Claude Code ou Codex (lead + sub-agents à scope chirurgical). Skills workspace : `$plan-run <description>` pour créer une fiche depuis la roadmap, `$run <path>` pour exécuter (fiche de run **ou** ticket actif — path obligatoire, `@` optionnel ; le mode est détecté via le path). Pipeline et conventions : [`runs/README.md`](./runs/README.md).

### Runs actifs

- [013 — Feature village styles backend](./runs/013-feature-village-styles-backend.md) — 📋 `PLANNED`. Phase 3 styles de village : contrat shared/backend, coûts, cooldown, effets combat/économie, confidentialité et tests.
- [014 — Feature village styles frontend](./runs/014-feature-village-styles-frontend.md) — 📋 `PLANNED`. Phase 3 styles de village : exposition Pixi/HUD, mutation UI, états bloqués, reload et smoke IG.

### Runs archivés

- [012 — Inbox combat reports](./runs/archive/012-feature-inbox-combat-reports.md) — ✅ `DONE` (2026-05-11). Inbox combat MVP : contrat gameplay figé, `CombatReport` conservé, lu/suppression par participant, invalidation WS attaquant/défenseur, smoke REST reports + smokes backend verts.
- [011 — Découpler le return worker du CombatReport](./runs/archive/011-fix-return-worker-decouple-report.md) — ✅ `DONE` (2026-05-10). Fix report supprimé pendant retour : snapshot `survivingUnits`/`loot` sur `Expedition`, `battle.returned.reportId` nullable, smoke de régression vert.
- [010 — Implémentation frontend renforts](./runs/archive/010-implementation-frontend-reinforcements.md) — ✅ `DONE` (2026-05-10). Frontend renforts finalisé : action `Renforcer`, garnison `INCOMING`/`OUTGOING`, `Rappeler`/`Renvoyer`, rendu `REINFORCE` liste/carte/mini-carte, WS + docs + smokes verts.
- [009 — Fix UI bâtiments verrouillés / non construits](./runs/archive/009-fix-ui-locked-unbuilt.md) — ✅ `DONE` (2026-05-10). Frontend village lock-aware : helper pur `getBuildingLockState`, modale sans upgrade verrouillé, scène Pixi sans bâtiments level 0, libellé `Non construit`, test Vitest + build Pixi verts.
- [000 — Pilote : audit du module `power`](./runs/archive/000-pilote-audit-power.md) — ✅ `DONE` (2026-05-10). Run de validation du système avant généralisation. **Système refondé après ce run** suite au rapport méta — sub-agents fourre-tout `team-*` supprimés, remplacés par sub-agents à scope chirurgical (`code-mapper`, `implementer`, `test-writer`, `test-runner`, `doc-writer`).
- [001 — Audit spec 02 : économie & progression](./runs/archive/001-audit-economy-progression.md) — ✅ `DONE` (2026-05-10). Phase 1, 1ᵉʳ des 7 sous-runs de consolidation. 12 invariants confrontés, 2 écarts fixés : reset 0/0/0 ressources sur conquête barbare (`conquest.service.ts`) + correction formulation bonus Château −36 % à niveau 10 (`spec 02 § Formules`).
- [002 — Audit spec 03 : bâtiments](./runs/archive/002-audit-buildings.md) — ✅ `DONE` (2026-05-10). Phase 1, 2ᵉ sous-run. 12 bâtiments confrontés, 4 écarts fixés : Council Hall + Throne Hall ajoutés (catalogue + poids + unlock), warehouse storage 5 niveaux → 10 niveaux spec, queue construction alignée (spec 2 → 3). Résout ticket 30. Ouvre ticket 32 (refacto unlockCastleLevel).
- [003 — Audit spec 08 : unités](./runs/archive/003-audit-units.md) — ✅ `DONE` (2026-05-10). Phase 1, 3ᵉ sous-run. 10 unités confrontées, 6 écarts fixés : ajout WARRIOR + RAM, NOBLE aligné spec (5000×3 / 15 pop / 8h) + nouveau champ `requiredThroneHallLevel`, TEMPLAR fix (wood/atk/def/cap), SPY fix (Caserne lvl/poids), CATAPULT désactivé MVP (poids), MILITIA + ARCHER poids alignés. Passifs déclarés data-only via `UnitPassive` discriminated union (consommation = run 004).
- [004 — Audit spec 04 : combat](./runs/archive/004-audit-combat.md) — ✅ `DONE` (2026-05-10). Phase 1, 4ᵉ sous-run. **Audit pur, 0 fix code**. 21 axes confrontés ; conformité élevée sur PvP, loot, trajet, libération pop, bonus style, return.worker. 3 écarts ticketés (33 renforts, 34 rappel, 35 drift durée retour). Garnison barbare (`defender.units = {}` + `lossesAttacker = {}`) déléguée run 005 ; conquête déléguée run 006.
- [005 — Audit spec 06 : barbares](./runs/archive/005-audit-barbarians.md) — ✅ `DONE` (2026-05-10). Phase 1, 5ᵉ sous-run. Catalogue templates étendu T1→T5 (ajout T4/T5), Warehouse levels alignés spec (1/1/2/3/4), blueprint troupes data-only par tier (15/35/70/110/150 selon proportions 60/25/10/5), fourchette roll ressources spec (30-100 %). 4 tickets follow-up (#36 persistance troupes, #37 régen, #38 strategy combat barbare, #39 rapport asymétrique).
- [006 — Audit spec 10 : conquête](./runs/archive/006-audit-conquest.md) — ✅ `DONE` (2026-05-10). Phase 1, 6ᵉ sous-run. Stratégie ticketage agressif. Livré : `UnitCost.crowns?: number`, `UNIT_COSTS[NOBLE].crowns = 5000`, `requiredThroneHallLevel: 6 → 1`, NOBLE retiré du DTO Caserne, helper pur `canRecruitNoble` (cap 1/village). 3 tickets ouverts (#40 recrutement Throne Hall, #41 PendingConquest + worker, #42 hook combat). Débloque Phase 5.
- [007 — Audit spec 07 : seeding barbares](./runs/archive/007-audit-barbarian-spawning.md) — ✅ `DONE` (2026-05-10). Phase 1, 7ᵉ et **dernier sous-run** (Phase 1 close). Branche A retenue : spec finalisée (T1-T5 sur anneau `[8, 60]`, anti-submersion par présence joueur, catchup d'arrivée différée). Renaming `BarbarianBackfillWorker` → `BarbarianSeedingCatchupWorker` + correction sémantique data-model.md. Helper pur `adjustCapacityForPlayerPresence`. Migration `jsonb_set` mondes existants. 19 tests pure-logic geometry. Ticket 26 finalisé MVP.
- [008 — Self-reset world](./runs/archive/008-self-reset-world.md) — ✅ `DONE` (2026-05-10). Hors phase. Endpoint `DELETE /world/:worldId/me` + bouton/modale garde-fou frontend pour réinitialiser un joueur sur un monde (full wipe puis re-join propre). Anonymisation `CombatReport` côté défenseur. 0 event Outbox.

## Archivés

- [44 — Crash armée : migration `unit_training.building` non appliquée](./archive/44-army-training-schema-drift.md) ✅ Résolu 2026-05-11 par application des migrations locales + garde-fou dev server.
- [43 — Risque de mort du Seigneur sur victoire coûteuse](./archive/43-noble-loss-chance-on-costly-victory.md) ✅ Résolu 2026-05-11 par $run @tasks/43-noble-loss-chance-on-costly-victory.md
- [41 — Période de capture : `PendingConquest` + worker](./archive/41-capture-window-data-model.md) ✅ Résolu 2026-05-11 par $run @tasks/41-capture-window-data-model.md
- [42 — Hook combat post-résolution conquête](./archive/42-combat-conquest-hook.md) ✅ Résolu 2026-05-11 par $run @tasks/42-combat-conquest-hook.md
- [40 — Recrutement Seigneur à la Salle du Trône](./archive/40-recruit-noble-throne-hall.md) ✅ Résolu 2026-05-11 par $run @tasks/40-recruit-noble-throne-hall.md
- [39 — Rapport de combat asymétrique victoire/défaite](./archive/39-combat-report-asymmetric-defeat.md) ✅ Résolu 2026-05-11 par $run @tasks/39-combat-report-asymmetric-defeat.md
- [38 — `BarbarianVillageStrategy` : résolution combat réelle](./archive/38-barbarian-combat-real-resolution.md) ✅ Résolu 2026-05-11 par $run @tasks/38-barbarian-combat-real-resolution.md
- [37 — Régénération barbare (troupes + ressources) absente](./archive/37-barbarian-regeneration-missing.md) ✅ Résolu 2026-05-11 par $run @tasks/36-barbarian-troops-runtime-persistence.md @tasks/37-barbarian-regeneration-missing.md
- [36 — Persistance runtime des troupes barbares + roll initial 60-100 %](./archive/36-barbarian-troops-runtime-persistence.md) ✅ Résolu 2026-05-11 par $run @tasks/36-barbarian-troops-runtime-persistence.md @tasks/37-barbarian-regeneration-missing.md
- [35 — Drift durée retour vs spec « même vitesse qu'à l'aller »](./archive/35-return-travel-time-recomputed-vs-spec.md) ✅ Résolu 2026-05-11 par $run @tasks/35-return-travel-time-recomputed-vs-spec.md
- [34 — Rappel d'armée pendant l'aller non implémenté](./archive/34-army-recall-missing.md) ✅ Résolu 2026-05-10 par $run @tasks/34-army-recall-missing.md
- [33 — Renforts inter-villages non implémenté](./archive/33-reinforcements-inter-villages-missing.md) ✅ Résolu 2026-05-10 par $run @tasks/33-reinforcements-inter-villages-missing.md
- [29 — Puissance publique (village + royaume) non exposée](./archive/29-power-public-visibility-missing.md) ✅ Résolu 2026-05-10 par $run @tasks/29-power-public-visibility-missing.md (endpoints publics dédiés village/royaume).
- [30 — Salle du Conseil : poids défini en spec, bâtiment absent du modèle](./archive/30-power-council-hall-missing.md) ✅ Résolu 2026-05-10 par run 002 (Piste A : implémentée comme bâtiment 1 niveau).
- [31 — `PowerSnapshot.kingdom` : champ DB sémantiquement faux](./archive/31-power-snapshot-kingdom-field-misnamed.md) ✅ Résolu 2026-05-10 par $run @tasks/31-power-snapshot-kingdom-field-misnamed.md (Piste B : table morte supprimée).
- [32 — Drift potentiel `unlockCastleLevel` ↔ `BUILDING_UNLOCK_REQUIREMENTS`](./archive/32-buildings-unlock-duplication.md) ✅ Résolu 2026-05-10 par $run @tasks/32-buildings-unlock-duplication.md (Piste A : source unique via dérivation depuis `BUILDING_DEFINITIONS`).
- [01 — Audit des tests unitaires](./archive/01-unit-tests-audit.md) ✅ Résolu 2026-05-08
- [02 — Tests smokes / E2E](./archive/02-smoke-tests-strategy.md) ✅ Résolu 2026-05-08
- [03 — CI : automatiser ou pas](./archive/03-ci-strategy.md) ✅ Résolu 2026-05-08
- [04 — Monorepo : structure git](./archive/04-monorepo-git-strategy.md) ✅ Résolu 2026-05-08
- [05 — WorldConfig multipliers : sémantique inversée](./archive/05-world-config-multipliers-semantics.md) ✅ Résolu 2026-05-08
- [06 — Production tick + backfill : pas d'event Outbox](./archive/06-production-tick-and-backfill-no-outbox.md) ✅ Résolu 2026-05-08
- [07 — Crown production : event Outbox conditionné sur `production > 0`](./archive/07-crown-production-event-gate.md) ✅ Résolu 2026-05-08
- [08 — Combat : crash P2025 si défenseur sans ResourceStock](./archive/08-combat-defender-resource-stock-guard.md) ✅ Résolu
- [09 — Fog of war : positions cachées exposées au client](./archive/09-fog-of-war-coordinate-leak.md) ✅ Résolu
- [10 — NumericKeypad UI](./archive/10-numeric-keypad-ui.md) ✅ Résolu
- [11 — Revenu en couronnes : taux par puissance non chiffré](./archive/11-crown-income-rate-undefined.md) ✅ Résolu 2026-05-09
- [12 — Récompenses classements & cycles reset non chiffrés](./archive/12-rankings-rewards-undefined.md) ✅ Résolu 2026-05-09
- [20 — Pop libérée à la mort = friction offensive faible](./archive/20-pop-released-on-death-weak-friction.md) ✅ Résolu 2026-05-09
- [28 — Bénédiction royale : % de gain couronnes manquant](./archive/28-royal-blessing-crown-percentage.md) ✅ Résolu 2026-05-09
- [13 — Renforts entre mes propres villages](./archive/13-reinforcements-between-own-villages.md) ✅ Résolu 2026-05-09
- [16 — Pré-conquête : armée gagne mais Seigneur meurt](./archive/16-pre-conquest-noble-dies-army-wins.md) ✅ Résolu 2026-05-09
- [19 — Village conquis sans vision propre](./archive/19-conquered-village-vision-gap.md) ✅ Résolu 2026-05-09
- [21 — Garde-fou puissance ÷ 3 fuite la puissance défensive](./archive/21-power-guardrail-leaks-defender-power.md) ✅ Résolu 2026-05-09
- [22 — Conquête T1/T2 quasi gratuite mais non assumée](./archive/22-low-tier-barbarian-conquest-trivial.md) ✅ Résolu 2026-05-09
- [23 — Snowball PvP : ni cooldown re-conquête, ni bouclier](./archive/23-pvp-snowball-no-cooldown-no-shield.md) ✅ Résolu 2026-05-09
- [24 — Fenêtre Château 4-5 : style choisi sans conquête](./archive/24-style-without-conquest-window.md) ✅ Résolu 2026-05-09
- [25 — Visibilité durée capture : asymétrie barbare vs PvP](./archive/25-capture-duration-visibility-asymmetry.md) ✅ Résolu 2026-05-09
- [14 — Initiative barbare non spécifiée](./archive/14-barbarian-initiative-undefined.md) ✅ Résolu 2026-05-09
- [15 — Zones d'influence : système annoncé non spécifié](./archive/15-influence-zones-floating-system.md) ✅ Résolu 2026-05-09
- [18 — Cycle de vie d'un village barbare totalement vidé](./archive/18-emptied-barbarian-village-lifecycle.md) ✅ Résolu 2026-05-09
- [26 — Recyclage barbares vs spawn neuf](./archive/26-barbarian-recycling-vs-spawn.md) ✅ Spec MVP finalisée 2026-05-10 par run 007 (recyclage / cron de régulation reportés post-MVP)
- [27 — Sprites barbares à refaire : 5 tiers, 3 sprites](./archive/27-barbarian-tier-sprites-redesign.md) ✅ Résolu (spec) 2026-05-09
- [17 — Bénédictions : application temporelle non spécifiée](./archive/17-blessings-temporal-effects.md) ✅ Résolu (post-MVP) 2026-05-09

## Légende

- 🟡 **Majeur** — touche la structure, le filet de qualité, ou un bug runtime latent.
- 🟠 **Moyen** — qualité de vie, dette à éclaircir.
- 🟢 **Mineur** — cosmétique, doc, ou choix archi à confirmer sans urgence.

## Process

Pour résoudre un ticket actif : `$run tasks/<id>-<slug>.md` (mode ticket auto, `@` optionnel). Le pipeline lit le ticket, demande à l'utilisateur de trancher la piste si plusieurs proposées, exécute en mode rapide, archive le ticket et commit. Détail : [`runs/README.md`](./runs/README.md).
