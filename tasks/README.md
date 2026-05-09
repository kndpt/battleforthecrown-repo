# Tasks — chantiers post-audit

Chantiers identifiés après la résolution complète de l'audit (`docs/architecture/audit/`). Chacun est un ticket `.md` factuel avec état actuel + pistes + question à trancher. Aucune décision préalable — l'user tranche, l'agent exécute.

## Tickets actifs

_Aucun ticket actif. La pile post-audit est vide._

## Archivés

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
