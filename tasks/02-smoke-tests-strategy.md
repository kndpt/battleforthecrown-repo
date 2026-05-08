# 02 — Tests smokes / E2E : repartir d'une base saine

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend`, `battleforthecrown-pixi`
**Tags** : tests, e2e, smoke, regression

## Contexte

Pendant l'audit on a touché shared, backend, pixi sur ~25 fichiers. Les unit tests + le type-check passent, mais on n'a aucune garantie que les flows critiques (login → upgrade → recruit → attack → return) tournent encore en prod-like.

Aujourd'hui on a des **tests "E2E/intégration" backend nominaux**, mais l'inspection révèle qu'ils ne fonctionnent plus du tout. Reste à décider : on ressuscite, on supprime et repart avec des smokes simples, ou les deux.

## État actuel

### Backend — `test/*.integration-spec.ts`

4 fichiers volumineux :

- `combat-conquest.integration-spec.ts` (716 lignes — Phase 2 combat & conquête)
- `construction-queue.integration-spec.ts` (~300 lignes)
- `training-system.integration-spec.ts` (560 lignes)
- `village-strategy.integration-spec.ts` (~500 lignes)

**Lancés via `yarn test:e2e`** :

```
Test Suites: 4 failed, 4 total
Tests:       51 failed, 51 total
```

100 % cassés. Typique : `PrismaClientValidationError` dès le setup (`training-system.integration-spec.ts:45`) — les fixtures ne matchent plus le schéma Prisma actuel (champs ajoutés/renommés au fil des PRs).

### Pixi — Vitest jsdom

Tests présents (12 fichiers, 65 tests) mais **tous unitaires**. Aucun test :
- de bout en bout (`Playwright` / `Cypress` absents)
- de smoke contre un backend réel
- de session utilisateur complète

### Couverture des flows critiques aujourd'hui

| Flow | Couverture unit | Couverture E2E |
|---|---|---|
| Login + refresh JWT | `client.test.ts` | ❌ |
| Upgrade bâtiment | `world-config.service.spec`, `gameplay/upgrade-building.use-case.spec` | ❌ (E2E mort) |
| Recruter unité | `army.service.spec` | ❌ (E2E mort) |
| Lancer attaque + retour | `combat.service.spec`, `combat.worker.spec` (partiel) | ❌ (E2E mort) |
| Conquête | — | ❌ (E2E mort) |
| Production tick | `production.worker.spec` (cassé, cf. ticket 01) | ❌ |

## Question à trancher

1. **Les 4 fichiers d'intégration backend** : on les ressuscite (effort ~4-8 h estimés) ou on les supprime ?
2. **Stratégie cible** : tests smoke léger (curl + vérif DB minimale) ou tests E2E lourds (Playwright complet) ?
3. **Granularité** : un smoke par flow (5 flows critiques) ou un seul mégasmoke "happy path" complet ?

## Pistes

### A. Ressusciter les `*.integration-spec.ts` existants

- Fixer les fixtures pour qu'elles matchent le schéma actuel + les conventions post-audit (`multipliers.travel`, helpers shared, etc.).
- Avantage : on garde la profondeur (plusieurs scénarios par flow), tests déjà écrits.
- Risque : effort élevé, et ces tests resteront fragiles aux évolutions futures du schéma. Ils sont aussi très longs à exécuter (chaque test instancie `AppModule` complet).

### B. Supprimer les `*.integration-spec.ts` + smokes minimaux backend

- Supprimer les 4 fichiers (commit avec message qui explicite ce qui était couvert).
- Écrire 5-7 smokes en `test/smoke.spec.ts` qui font :
  - Boot du module, JWT auth, mutation REST, vérif DB via Prisma, vérif event Outbox.
  - Un smoke par flow critique (~50 lignes chacun).
- Run via `yarn test:smoke` séparé du `yarn test` unit.
- Avantage : repart sur du léger, lisible, rapide. ~2-3 h pour les 5-7 smokes.
- Risque : couverture moins fine — les edge-cases ne sont plus testés.

### C. Smokes pixi via Playwright (frontend-driven)

- Lancer un Playwright qui automatise une session : login + clic upgrade + assertion DOM.
- Demande backend en marche (séparation prod-like).
- Avantage : couvre frontend + backend en un seul flow.
- Risque : flaky sur la timing UI (animations, polling). Setup CI plus lourd (deux services).

### D. Hybride — Smokes backend (B) + smokes pixi optionnels (C)

- Phase 1 : tuer les E2E morts, écrire les smokes backend.
- Phase 2 (plus tard) : ajouter Playwright si la valeur le justifie.
- Avantage : démarrage rapide, on peut toujours ajouter Playwright après.
- Risque : Phase 2 peut ne jamais arriver, on reste sans couverture frontend.

## Dimensions à valider en sortie

- Décision tranchée : A, B, C, D ou autre.
- Si suppression : journaliser dans le commit message les flows / scénarios perdus.
- `yarn test:e2e` (ou équivalent) **passe** sur main, pas en `skip`.
- Documentation courte dans `docs/architecture/` : où vivent les smokes, comment les lancer, quand les ajouter.
- Idéalement < 1 minute pour exécuter le suite smoke complet (sinon on les lance jamais).

## Tickets liés

- [01 — Tests unitaires](./01-unit-tests-audit.md) — la décision dépend en partie de ce qu'on garde côté unit.
- [03 — CI strategy](./03-ci-strategy.md) — la cadence d'exécution des smokes dépend de la CI.
