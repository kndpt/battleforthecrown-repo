# Tasks — chantiers post-audit

Chantiers identifiés après la résolution complète de l'audit (`docs/architecture/audit/`). Chacun est un ticket `.md` factuel avec état actuel + pistes + question à trancher. Aucune décision préalable — l'user tranche, l'agent exécute.

## Tickets actifs

- [66 — Inbox combat : tag VICTOIRE/DÉFAITE faux dans la liste](./66-inbox-report-outcome-uses-losses-heuristic.md) — 🟡 Majeur. La liste de l'inbox calcule l'issue via une heuristique de pertes, divergente de la règle canonique utilisée par le modal.
- [57 — Source canonique du lifecycle des bâtiments joueur](./57-player-village-building-lifecycle-roster.md) — 🟡 Majeur. Centraliser la politique join/conquête/backfill des bâtiments pour éviter les oublis à chaque nouveau bâtiment activé.
- [51 — Standardiser les bottom sheets sur le design `Activités du royaume`](./51-bottom-sheet-design-system-base.md) — 🟠 Moyen. Faire du nouveau panneau la base design-system des bottom sheets actuels et futurs.

## Tickets découpés

_(Aucun ticket découpé.)_

## Roadmap stratégique

- [00 — Roadmap MVP](./00-mvp-roadmap.md) — ordre d'implémentation des phases gameplay non encore codées. Document directeur dont seront dérivés les tickets actionables phase par phase.

## Runs (exécutions semi-autonomes)

Fiches d'exécution déléguées aux harnesses Claude Code ou Codex (lead + sub-agents à scope chirurgical). Skills workspace :

- `$bftc-plan <input>` — triage un sujet (description libre, path roadmap + section, ou path spec) en **ticket** (`tasks/<id>.md`) ou **fiche de run** (`tasks/runs/<id>.md` statut `PLANNED`) selon des critères explicites (backend+frontend, invariant SPEC, > 4 fichiers, etc.). Validation user avant écriture.
- `$bftc-run <path>` — exécute (fiche de run **ou** ticket actif — path obligatoire, `@` optionnel ; le mode est détecté via le path).

Pipeline et conventions : [`runs/README.md`](./runs/README.md).

### Runs actifs

- [034 — Isolation multi-monde des données joueur](./runs/034-fix-world-scoped-player-data.md) — 📋 `PLANNED`. Scoper puissance, rapports et caches front au monde courant, avec audit global des surfaces user-scoped visibles.
- [029 — Migration design-system des modales bâtiment restantes](./runs/029-migrate-building-modals-design-system.md) — 📋 `PLANNED`. Migrer les bâtiments actifs encore legacy et cadrer leurs contenus métier validés.

### Runs archivés

- [033 — Écran sélection royaumes Pixi](./runs/archive/033-feature-worlds-selection-screen.md) — ✅ `DONE` (2026-05-25). Écran `/worlds` branché sur `GET /worlds/public`, variante B bannières héraldiques portée dans le design-system, onglets Inscription/Bientôt/Verrouillés, CTA Rejoindre / Me prévenir / Inscription close, navigation depuis profil et tests Pixi.
- [032 — Lifecycle backend foundation + identité monde](./runs/archive/032-world-lifecycle-foundation-and-identity.md) — ✅ `DONE` (2026-05-25). `WorldConfig.lifecycle` + identité monde, `plannedOpenAt`, endpoint public `/worlds/public`, worker transitions `PLANNED→OPEN→LOCKED→ENDED`, event `world.status.changed`, binding Pixi et docs.
- [030 — Sprites de villages joueurs selon le niveau du Château](./runs/archive/030-feature-world-map-village-sprites-by-castle-level.md) — ✅ `DONE` (2026-05-22). `castleLevel` exposé sur les villages joueurs, mapping shared Château → tiers visuels, rendu Pixi `village-tier1..6` et invalidation realtime sur Château terminé.
- [031 — Sélecteur multi-village en bottom sheet](./runs/archive/031-feature-multi-village-bottom-sheet-selector.md) — ✅ `DONE` (2026-05-22). Header IG branché sur le `MultiVillageBottomSheet` design-system, flèches directes préservées, données indisponibles neutralisées sans valeurs fictives, tri alphabétique et test Pixi ciblé.
- [029 — Migration design-system des modales bâtiment restantes](./runs/archive/029-migrate-building-modals-design-system.md) — ✅ `DONE` (2026-05-21). Modales bâtiment restantes migrées vers le design-system, contenus métier spécialisés et Salle du Conseil routée vers Voie du village.
- [028 — Bonus de vitesse d'entraînement de la Caserne](./runs/archive/028-barracks-training-speed-bonus.md) — ✅ `DONE` (2026-05-21). Bonus de vitesse Caserne partagé, appliqué aux nouvelles formations backend et reflété dans l'UI armée Pixi.
- [026 — Tempo monde : plomberie + clean cut](./runs/archive/026-world-tempo-plumbing-clean-cut.md) — ✅ `DONE` (2026-05-16). `WorldConfig.tempo` remplace `gameSpeed`/`economy.productionRate`, `TempoService` shared centralise durées/débits, callsites backend + estimations Pixi + smokes migrés.
- [027 — Tempo monde : recalibration des constantes MVP](./runs/archive/027-world-tempo-recalibrate-mvp-constants.md) — ✅ `DONE` (2026-05-17). Valeurs absolues Standard MVP compressées : durées bâtiments/unités/capture `÷4`, production/couronnes/régen `×4`, docs gameplay `02/03/06/07/08/10/13/14/15/23` et constantes shared alignées.
- [025 — Puissance armée rattachée au village d'origine](./runs/archive/025-fix-origin-anchored-army-power.md) — ✅ `DONE` (2026-05-16). Calcul power origin-anchored : inventaire + expéditions + garnisons par origine réelle, invalidation power des origines de renforts touchées, smokes attaque/scout/renfort.
- [027 — Cartes quotidiennes & Oyez frontend/HUD](./runs/archive/027-feature-daily-cards-oyez-frontend-hud.md) — ✅ `DONE` (2026-05-15). HUD top permanent, sheet quotidienne/Oyez, claim village, invalidations retention et test Pixi.
- [026 — Cartes quotidiennes & Oyez backend/shared](./runs/archive/026-feature-daily-cards-oyez-backend-shared.md) — ✅ `DONE` (2026-05-15). Socle runtime Phase 10 : modèles daily/Oyez, API retention, projection idempotente des events Outbox, claim ressources et smoke backend.
- [023 — Runtime toasts migrés sur le design-system](./runs/archive/023-migrate-runtime-toasts-design-system.md) — ✅ `DONE` (2026-05-14). `ToastStack` rend le toast design-system, mapping `error -> danger`, close/TTL testés et labels runtime localisés.
- [024 — Modal Victoire de conquête](./runs/archive/024-feature-conquest-victory-modal.md) — ✅ `DONE` (2026-05-14). Payload `village.conquered` enrichi de `villageName`, store UI étendu avec queue FIFO de modaux victoire, composant `VictoryModal` porté du design-system, host singleton dans `App.tsx`, CTA "Voir le village" qui recentre la WorldMap via `pendingFocus`, tests unit ajoutés.
- [020 — Stats unités uniquement + défense par archétype branchée](./runs/archive/020-feature-units-stats-only-wire-defense-archetype.md) — ✅ `DONE` (2026-05-14). Suppression complète des passifs `UnitPassive` côté shared/backend/frontend/doc ; résolution combat branchée sur `defenseInfantry/Cavalry/Archer` selon l'archétype attaquant, avec smoke cavalerie vs archers.
- [022 — Réactivité temps réel de la puissance (training + bâtiments)](./runs/archive/022-fix-power-realtime-reactivity.md) — ✅ `DONE` (2026-05-14). Event métier `unit.trained` à chaque tick training, invalidations power front sur training/building, docs realtime/cartes/onboarding et smokes backend verts.
- [021 — Navigation multi-village par étiquettes](./runs/archive/021-feature-village-labels-navigation.md) — ✅ `DONE` (2026-05-13). Phase 9 : étiquettes privées, capitale dérivée, sélecteur multi-village, filtre carte et règle future de ciblage des récompenses.
- [019 — Feature barbarian conquest frontend UI](./runs/archive/019-feature-barbarian-conquest-frontend-ui.md) — ✅ `DONE` (2026-05-13). Phase 5 frontend/UI : recrutement Seigneur Salle du Trône, lancement conquête barbare lisible, durée capture T1-T5 visible, invalidations WS et static-check verts.
- [018 — Feature barbarian conquest backend shared](./runs/archive/018-feature-barbarian-conquest-backend-shared.md) — ✅ `DONE` (2026-05-13). Phase 5 backend/shared : finalisation barbare conforme spec, bâtiments matérialisés par tier, Seigneur installé hors armée, smoke T2 + smokes backend + static-check verts.
- [017 — Feature scouting frontend inbox](./runs/archive/017-feature-scouting-frontend-inbox.md) — ✅ `DONE` (2026-05-12). Phase 4 Scouting frontend : action `Scout` SPY-only, coût sans couronnes, inbox mixte combat/scout via design system, détail `ScoutReportCard`, tests Pixi + static-check verts.
- [016 — Feature scouting backend shared](./runs/archive/016-feature-scouting-backend-shared.md) — ✅ `DONE` (2026-05-12). Phase 4 Scouting backend/shared : mission scout SPY-only, `ScoutReport`, events `scout.*`, retour ESPION, endpoints reports scout, docs + smokes backend verts.
- [015 — Close phase 2 inbox reports](./runs/archive/015-close-phase-2-inbox-reports.md) — ✅ `DONE` (2026-05-12). Clôture Phase 2 : roadmap/spec alignées avec le MVP combat livré par run 012 ; aucun delta backend/frontend requis ; static-check vert.
- [014 — Feature village styles frontend](./runs/archive/014-feature-village-styles-frontend.md) — ✅ `DONE` (2026-05-12). Phase 3 styles de village frontend : HUD Salle du Conseil, modal branchée API stratégie, coûts/cooldown/erreurs serveur, refetch après mutation, tests Pixi + static-check verts.
- [013 — Feature village styles backend](./runs/archive/013-feature-village-styles-backend.md) — ✅ `DONE` (2026-05-12). Phase 3 styles de village backend : coûts thématiques scalés Château, premier changement payant, gate Salle du Conseil, cooldown, confidentialité carte, Forteresse combat, smokes backend verts.
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

- [71 — Stock initial absent sur inscription monde](./archive/71-fix-starting-resources-defaults.md) ✅ Résolu 2026-05-25 par correction directe Codex.
- [70 — Ouvrir la fiche joueur depuis l'avatar IG](./archive/70-integrate-player-profile-sheet.md) ✅ Résolu 2026-05-24 par $bftc-run @tasks/70-integrate-player-profile-sheet.md
- [68 — Renvoyer un renfort étranger ne produit aucun trajet retour sur la WorldMap](./archive/68-send-back-foreign-reinforcement-no-return-trip.md) ✅ Résolu 2026-05-18 par $bftc-run @tasks/68-send-back-foreign-reinforcement-no-return-trip.md
- [64 — Supprimer la table miroir `WorldEntity` devenue morte](./archive/64-remove-deprecated-world-entity.md) ✅ Résolu 2026-05-17 par $bftc-run @tasks/64-remove-deprecated-world-entity.md
- [69 — Inbox combat : couleur du badge VICTOIRE/DÉFAITE et icônes de carte](./archive/69-inbox-report-tag-and-icon-mapping.md) ✅ Résolu 2026-05-16 par $bftc-run @tasks/69-inbox-report-tag-and-icon-mapping.md
- [66 — Inbox combat : tag VICTOIRE/DÉFAITE faux dans la liste](./archive/66-inbox-report-outcome-uses-losses-heuristic.md) ✅ Résolu 2026-05-15 par $bftc-run @tasks/66-inbox-report-outcome-uses-losses-heuristic.md
- [67 — Réactivité temps réel de la puissance après combat](./archive/67-power-realtime-combat-events.md) ✅ Résolu 2026-05-15 par $bftc-run @tasks/67-power-realtime-combat-events.md
- [65 — Distinguer mes villages des villages joueurs étrangers sur la WorldMap](./archive/65-own-vs-foreign-villages-map-distinction.md) ✅ Résolu 2026-05-15 par $bftc-run @tasks/65-own-vs-foreign-villages-map-distinction.md
- [63 — Les autres joueurs n'apparaissent jamais sur la carte](./archive/63-foreign-players-invisible-on-world-map.md) ✅ Résolu 2026-05-15 par $bftc-run @tasks/63-foreign-players-invisible-on-world-map.md
- [62 — Mini-carte interactive : sync bidirectionnel avec la carte principale](./archive/62-interactive-minimap-sync.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/62-interactive-minimap-sync.md
- [61 — Indicateur visuel du village actif sur la WorldMap](./archive/61-active-village-map-indicator.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/61-active-village-map-indicator.md
- [60 — Popup village possédé : bouton « Aller à ce village »](./archive/60-own-village-popup-goto-button.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/60-own-village-popup-goto-button.md
- [58 — Vision multi-village : seuls les cercles du village sélectionné sont affichés](./archive/58-multi-village-vision-disks-missing.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/58-multi-village-vision-disks-missing.md
- [57 — Source canonique du lifecycle des bâtiments joueur](./archive/57-player-village-building-lifecycle-roster.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/57-player-village-building-lifecycle-roster.md
- [59 — Smokes backend : flakies par ordering Jest](./archive/59-smokes-jest-ordering-flakies.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/59-smokes-jest-ordering-flakies.md
- [55 — Bâtiments avancés absents après conquête d'un village barbare](./archive/55-conquered-village-missing-advanced-buildings.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/55-conquered-village-missing-advanced-buildings.md
- [56 — Popup village possédé : afficher les troupes présentes](./archive/56-own-village-popup-troops-list.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/56-own-village-popup-troops-list.md
- [47 — Queue visuelle de formation du Noble manquante](./archive/47-noble-training-visual-queue-missing.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/47-noble-training-visual-queue-missing.md
- [51 — Standardiser les bottom sheets sur le design `Activités du royaume`](./archive/51-bottom-sheet-design-system-base.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/51-bottom-sheet-design-system-base.md
- [52 — Multiplier de vitesse pour les durées de capture/conquête](./archive/52-conquest-capture-time-speed-multiplier.md) ✅ Résolu 2026-05-13 par $bftc-run @tasks/52-conquest-capture-time-speed-multiplier.md
- [53 — Rapport défenseur manquant quand une capture est attaquée](./archive/53-capture-occupation-defense-report-missing.md) ✅ Résolu 2026-05-13 par $bftc-run @tasks/53-capture-occupation-defense-report-missing.md
- [50 — Intégration HUD et bottom sheet des activités du royaume](./archive/50-kingdom-activities-bottom-sheet-integration.md) ✅ Résolu 2026-05-13 par $bftc-run @tasks/46-capture-window-tracker-missing.md @tasks/50-kingdom-activities-bottom-sheet-integration.md
- [46 — Tracker persistant de fenêtre de capture manquant](./archive/46-capture-window-tracker-missing.md) ✅ Résolu 2026-05-13 après livraison des tickets 48, 49 et 50.
- [45 — Watchtower niveau 10 : supprimer la vision globale](./archive/45-watchtower-finite-vision.md) ✅ Résolu 2026-05-13 par $bftc-run @tasks/45-watchtower-finite-vision.md
- [49 — Snapshots serveur des activités du royaume](./archive/49-kingdom-activities-snapshots.md) ✅ Résolu 2026-05-13 par $bftc-run @tasks/49-kingdom-activities-snapshots.md
- [48 — Design-system du panneau Activités du royaume](./archive/48-kingdom-activities-design-system.md) ✅ Résolu 2026-05-13 par migration design-system directe.
- [44 — Crash armée : migration `unit_training.building` non appliquée](./archive/44-army-training-schema-drift.md) ✅ Résolu 2026-05-11 par application des migrations locales + garde-fou dev server.
- [43 — Risque de mort du Seigneur sur victoire coûteuse](./archive/43-noble-loss-chance-on-costly-victory.md) ✅ Résolu 2026-05-11 par $bftc-run @tasks/43-noble-loss-chance-on-costly-victory.md
- [54 — Retour fantôme pendant capture avec Seigneur](./archive/54-conquest-capture-phantom-return.md) ✅ Résolu 2026-05-14 par $bftc-run @tasks/54-conquest-capture-phantom-return.md
- [41 — Période de capture : `PendingConquest` + worker](./archive/41-capture-window-data-model.md) ✅ Résolu 2026-05-11 par $bftc-run @tasks/41-capture-window-data-model.md
- [42 — Hook combat post-résolution conquête](./archive/42-combat-conquest-hook.md) ✅ Résolu 2026-05-11 par $bftc-run @tasks/42-combat-conquest-hook.md
- [40 — Recrutement Seigneur à la Salle du Trône](./archive/40-recruit-noble-throne-hall.md) ✅ Résolu 2026-05-11 par $bftc-run @tasks/40-recruit-noble-throne-hall.md
- [39 — Rapport de combat asymétrique victoire/défaite](./archive/39-combat-report-asymmetric-defeat.md) ✅ Résolu 2026-05-11 par $bftc-run @tasks/39-combat-report-asymmetric-defeat.md
- [38 — `BarbarianVillageStrategy` : résolution combat réelle](./archive/38-barbarian-combat-real-resolution.md) ✅ Résolu 2026-05-11 par $bftc-run @tasks/38-barbarian-combat-real-resolution.md
- [37 — Régénération barbare (troupes + ressources) absente](./archive/37-barbarian-regeneration-missing.md) ✅ Résolu 2026-05-11 par $bftc-run @tasks/36-barbarian-troops-runtime-persistence.md @tasks/37-barbarian-regeneration-missing.md
- [36 — Persistance runtime des troupes barbares + roll initial 60-100 %](./archive/36-barbarian-troops-runtime-persistence.md) ✅ Résolu 2026-05-11 par $bftc-run @tasks/36-barbarian-troops-runtime-persistence.md @tasks/37-barbarian-regeneration-missing.md
- [35 — Drift durée retour vs spec « même vitesse qu'à l'aller »](./archive/35-return-travel-time-recomputed-vs-spec.md) ✅ Résolu 2026-05-11 par $bftc-run @tasks/35-return-travel-time-recomputed-vs-spec.md
- [34 — Rappel d'armée pendant l'aller non implémenté](./archive/34-army-recall-missing.md) ✅ Résolu 2026-05-10 par $bftc-run @tasks/34-army-recall-missing.md
- [33 — Renforts inter-villages non implémenté](./archive/33-reinforcements-inter-villages-missing.md) ✅ Résolu 2026-05-10 par $bftc-run @tasks/33-reinforcements-inter-villages-missing.md
- [29 — Puissance publique (village + royaume) non exposée](./archive/29-power-public-visibility-missing.md) ✅ Résolu 2026-05-10 par $bftc-run @tasks/29-power-public-visibility-missing.md (endpoints publics dédiés village/royaume).
- [30 — Salle du Conseil : poids défini en spec, bâtiment absent du modèle](./archive/30-power-council-hall-missing.md) ✅ Résolu 2026-05-10 par run 002 (Piste A : implémentée comme bâtiment 1 niveau).
- [31 — `PowerSnapshot.kingdom` : champ DB sémantiquement faux](./archive/31-power-snapshot-kingdom-field-misnamed.md) ✅ Résolu 2026-05-10 par $bftc-run @tasks/31-power-snapshot-kingdom-field-misnamed.md (Piste B : table morte supprimée).
- [32 — Drift potentiel `unlockCastleLevel` ↔ `BUILDING_UNLOCK_REQUIREMENTS`](./archive/32-buildings-unlock-duplication.md) ✅ Résolu 2026-05-10 par $bftc-run @tasks/32-buildings-unlock-duplication.md (Piste A : source unique via dérivation depuis `BUILDING_DEFINITIONS`).
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

Pour résoudre un ticket actif : `$bftc-run tasks/<id>-<slug>.md` (mode ticket auto, `@` optionnel). Le pipeline lit le ticket, demande à l'utilisateur de trancher la piste si plusieurs proposées, exécute en mode rapide, archive le ticket et commit. Détail : [`runs/README.md`](./runs/README.md).
