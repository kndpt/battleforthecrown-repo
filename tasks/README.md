# Tasks — chantiers post-audit

Chantiers identifiés après la résolution complète de l'audit (`docs/architecture/audit/`). Chacun est un ticket `.md` factuel avec état actuel + pistes + question à trancher. Aucune décision préalable — l'user tranche, l'agent exécute.

## Tickets actifs

- [29 — Puissance publique (village + royaume) non exposée](./29-power-public-visibility-missing.md) 🟡 Majeur — issue du [run 000](./runs/archive/000-pilote-audit-power.md) (INV-5/INV-7).
- [31 — `PowerSnapshot.kingdom` : champ DB sémantiquement faux](./31-power-snapshot-kingdom-field-misnamed.md) 🟡 Majeur — issue du run 000.
- [32 — Drift potentiel `unlockCastleLevel` ↔ `BUILDING_UNLOCK_REQUIREMENTS`](./32-buildings-unlock-duplication.md) 🟢 Mineur — issue du [run 002](./runs/archive/002-audit-buildings.md).

## Roadmap stratégique

- [00 — Roadmap MVP](./00-mvp-roadmap.md) — ordre d'implémentation des phases gameplay non encore codées. Document directeur dont seront dérivés les tickets actionables phase par phase.

## Runs (exécutions semi-autonomes)

Fiches d'exécution déléguées au système d'équipe Claude (lead + sub-agents à scope chirurgical). Slash commands : `/plan-run <description>` pour créer une fiche depuis la roadmap, `/run <id>` pour exécuter. Pipeline et conventions : [`runs/README.md`](./runs/README.md).

- [004 — Audit spec 04 : combat](./runs/004-audit-combat.md) — 📋 `PLANNED`. Phase 1, 4ᵉ sous-run. Résolution PvE/PvP, loot, trajets, libération pop, bonus style. Renforts + rappel ticketés.
- [005 — Audit spec 06 : barbares](./runs/005-audit-barbarians.md) — 📋 `PLANNED`. Phase 1, 5ᵉ sous-run. Templates T1-T5 (ajout T4/T5), blueprint troupes, défense barbare, régénération.
- [006 — Audit spec 10 : conquête](./runs/006-audit-conquest.md) — 📋 `PLANNED`. Phase 1, 6ᵉ sous-run. Alignement coûts NOBLE + retrait Caserne + cap 1/village. 3 tickets externes ouverts (recruit-noble, capture window, hook combat) — débloque Phase 5.
- [007 — Audit spec 07 : seeding barbares](./runs/007-audit-barbarian-spawning.md) — 📋 `PLANNED`. Phase 1, 7ᵉ et dernier sous-run. Cas particulier : spec en chantier, arbitrage A/B (finaliser vs reporter) en T1.
- [009 — Fix UI bâtiments verrouillés / non construits](./runs/009-fix-ui-locked-unbuilt.md) — 📋 `PLANNED`. Phase 1, dette frontend post-run 002. Modale lock-aware, helper pur partagé, scène Pixi sans level 0, libellé `Niv. 0` → `Non construit`.

### Runs archivés

- [000 — Pilote : audit du module `power`](./runs/archive/000-pilote-audit-power.md) — ✅ `DONE` (2026-05-10). Run de validation du système avant généralisation. **Système refondé après ce run** suite au rapport méta — sub-agents fourre-tout `team-*` supprimés, remplacés par sub-agents à scope chirurgical (`code-mapper`, `implementer`, `test-writer`, `test-runner`, `doc-writer`).
- [001 — Audit spec 02 : économie & progression](./runs/archive/001-audit-economy-progression.md) — ✅ `DONE` (2026-05-10). Phase 1, 1ᵉʳ des 7 sous-runs de consolidation. 12 invariants confrontés, 2 écarts fixés : reset 0/0/0 ressources sur conquête barbare (`conquest.service.ts`) + correction formulation bonus Château −36 % à niveau 10 (`spec 02 § Formules`).
- [002 — Audit spec 03 : bâtiments](./runs/archive/002-audit-buildings.md) — ✅ `DONE` (2026-05-10). Phase 1, 2ᵉ sous-run. 12 bâtiments confrontés, 4 écarts fixés : Council Hall + Throne Hall ajoutés (catalogue + poids + unlock), warehouse storage 5 niveaux → 10 niveaux spec, queue construction alignée (spec 2 → 3). Résout ticket 30. Ouvre ticket 32 (refacto unlockCastleLevel).
- [003 — Audit spec 08 : unités](./runs/archive/003-audit-units.md) — ✅ `DONE` (2026-05-10). Phase 1, 3ᵉ sous-run. 10 unités confrontées, 6 écarts fixés : ajout WARRIOR + RAM, NOBLE aligné spec (5000×3 / 15 pop / 8h) + nouveau champ `requiredThroneHallLevel`, TEMPLAR fix (wood/atk/def/cap), SPY fix (Caserne lvl/poids), CATAPULT désactivé MVP (poids), MILITIA + ARCHER poids alignés. Passifs déclarés data-only via `UnitPassive` discriminated union (consommation = run 004).
- [008 — Self-reset world](./runs/archive/008-self-reset-world.md) — ✅ `DONE` (2026-05-10). Hors phase. Endpoint `DELETE /world/:worldId/me` + bouton/modale garde-fou frontend pour réinitialiser un joueur sur un monde (full wipe puis re-join propre). Anonymisation `CombatReport` côté défenseur. 0 event Outbox.

## Archivés

- [30 — Salle du Conseil : poids défini en spec, bâtiment absent du modèle](./archive/30-power-council-hall-missing.md) ✅ Résolu 2026-05-10 par run 002 (Piste A : implémentée comme bâtiment 1 niveau).
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
- [26 — Recyclage barbares vs spawn neuf](./archive/26-barbarian-recycling-vs-spawn.md) 🟡 Décision provisoire 2026-05-09 (à reprendre en pré-launch)
- [27 — Sprites barbares à refaire : 5 tiers, 3 sprites](./archive/27-barbarian-tier-sprites-redesign.md) ✅ Résolu (spec) 2026-05-09
- [17 — Bénédictions : application temporelle non spécifiée](./archive/17-blessings-temporal-effects.md) ✅ Résolu (post-MVP) 2026-05-09

## Légende

- 🟡 **Majeur** — touche la structure, le filet de qualité, ou un bug runtime latent.
- 🟠 **Moyen** — qualité de vie, dette à éclaircir.
- 🟢 **Mineur** — cosmétique, doc, ou choix archi à confirmer sans urgence.

## Process

Identique à l'audit `docs/architecture/audit/README.md` :

1. Lire le ticket en entier (état actuel + pistes).
2. Confirmer/infirmer l'état actuel via le code (le ticket peut être inexact).
3. Choisir une piste avec son tradeoff.
4. Plan d'implémentation découpable en steps vérifiables.
5. Validation user avant exécution.
