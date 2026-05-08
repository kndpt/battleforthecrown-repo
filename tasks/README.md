# Tasks — chantiers post-audit

Quatre chantiers identifiés après la résolution complète de l'audit (`docs/architecture/audit/`). Chacun est un ticket `.md` factuel avec état actuel + pistes + question à trancher. Aucune décision préalable — l'user tranche, l'agent exécute.

## Tickets actifs

- [03 — CI : automatiser ou pas](./03-ci-strategy.md) 🟠
- [05 — WorldConfig multipliers : sémantique inversée](./05-world-config-multipliers-semantics.md) 🟡
- [06 — Production tick + backfill : pas d'event Outbox](./06-production-tick-and-backfill-no-outbox.md) 🟢
- [07 — Crown production : event Outbox conditionné sur `production > 0`](./07-crown-production-event-gate.md) 🟡
- [08 — Combat : crash P2025 si défenseur sans ResourceStock](./08-combat-defender-resource-stock-guard.md) 🟡
- [09 — Fog of war : positions cachées exposées au client](./09-fog-of-war-coordinate-leak.md) 🟡

## Archivés

- [01 — Audit des tests unitaires](./archive/01-unit-tests-audit.md) ✅ Résolu 2026-05-08
- [02 — Tests smokes / E2E](./archive/02-smoke-tests-strategy.md) ✅ Résolu 2026-05-08
- [04 — Monorepo : structure git](./04-monorepo-git-strategy.md) ✅ Résolu 2026-05-08

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
