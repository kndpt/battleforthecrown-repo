# Tasks — chantiers post-audit

Quatre chantiers identifiés après la résolution complète de l'audit (`docs/architecture/audit/`). Chacun est un ticket `.md` factuel avec état actuel + pistes + question à trancher. Aucune décision préalable — l'user tranche, l'agent exécute.

## Tickets actifs

- [02 — Tests smokes / E2E : repartir d'une base saine](./02-smoke-tests-strategy.md) 🟡
- [03 — CI : automatiser ou pas](./03-ci-strategy.md) 🟠

## Archivés

- [01 — Audit des tests unitaires](./archive/01-unit-tests-audit.md) ✅ Résolu 2026-05-08
- [04 — Monorepo : structure git](./04-monorepo-git-strategy.md) ✅ Résolu 2026-05-08

## Légende

- 🟡 **Majeur** — touche la structure ou le filet de qualité.
- 🟠 **Moyen** — qualité de vie, dette à éclaircir.

## Process

Identique à l'audit `docs/architecture/audit/README.md` :

1. Lire le ticket en entier (état actuel + pistes).
2. Confirmer/infirmer l'état actuel via le code (le ticket peut être inexact).
3. Choisir une piste avec son tradeoff.
4. Plan d'implémentation découpable en steps vérifiables.
5. Validation user avant exécution.
