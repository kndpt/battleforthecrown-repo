# Code Quality Report — Backend

Populated by `/bftc-refactor-backend`. Each run appends a dated entry.

---

## Run 2026-05-30 — Scan SHA `ce5f7c2288d4ae779c6533d6f0528c9ca56aa7e8`

### Orientation

Backend NestJS 10. Modules principaux : `combat/`, `event/`, `resources/`, `strategy/`, `retention/`, `onboarding/`, `world/`, `army/`, `village/`, `crowns/`, `power/`, `population/`. Workers : `production`, `construction`, `world-lifecycle`, `crown-production`, `outbox`.

Top fichiers par LOC : `combat.worker.ts` (1142), `combat.service.ts` (1132 avant refactor → 906 après), `conquest.service.ts` (565), `event-outbox.service.ts` (537), `village-strategy.service.ts` (495).

---

### Findings

| ID | Catégorie | Fichier:ligne | Description | Sévérité | Effort |
|----|-----------|---------------|-------------|----------|--------|
| F01 | Service design | `combat.service.ts:909-1132` (avant) | 8 méthodes publiques de CRUD rapport (getAllReports, getReport, deleteReport, markReportAsRead + scouts) mélangées avec logique d'initiation de combat. Aucune dépendance partagée. | **High** | M |
| F02 | Naming/side-effect | `resources.service.ts:24-64` | `getResources()` déclenche `updateProduction()` si stock trop vieux puis se rappelle récursivement. Sémantique getter violée — les appelants reçoivent une mutation silencieuse. | **Medium** | S |
| F03 | Layering | `event-outbox.service.ts:52-200` | `EventOutboxService` dispatche 20+ types d'events et appelle directement `retention.recordOutboxEvent()` + `onboarding.recordOutboxEvent()`. Couplage dispatcher → domaines métier fragile. | **Medium** | M |

### Patterns investigués et exclus ("Looks bad but is actually fine")

- **Outbox pattern** : toutes mutations DB dans `combat.worker.ts`, `conquest.service.ts`, `return.worker.ts` sont dans `$transaction()` avec `EventOutbox`. Exception production tick documentée (intentionnel).
- **N+1 queries** : boucles dans `combat.worker.ts` itèrent sur données pré-fetchées avec `include`. Pas de `findUnique` en boucle.
- **any/as any** : absent du code de production ; seulement dans les mocks de tests.
- **Erreurs swallowed** : tous les `catch` loggent + rethrow. Idempotence guards sur P2002 corrects pour la replay.
- **OwnershipService** : présent sur tous les endpoints sensibles.

---

### Thème sélectionné pour ce run : Extraction ReportService depuis CombatService (F01)

**Rationale** : seul finding High avec effort M et zéro risque de régression gameplay. 8 méthodes publiques + 3 helpers privés n'utilisent que `PrismaService` + `OwnershipService` — aucune dépendance sur la logique d'expédition.

**Thèmes rejetés** :
- F02 (rename `getResources`) : effort S mais impact trop limité pour un PR hebdomadaire.
- F03 (EventOutbox coupling) : fonctionnel et safe ; risque de régression lors du découplage sans bénéfice immédiat mesurable.

---

### Résultats de vérification

```
yarn workspace battleforthecrown-backend type-check  → OK
yarn workspace battleforthecrown-backend lint:check --quiet → OK
yarn workspace battleforthecrown-backend test -- --testPathPatterns="combat" → 71 tests passed
```

### Fichiers modifiés

- `battleforthecrown-backend/src/modules/combat/report.service.ts` — NOUVEAU (241 LOC)
- `battleforthecrown-backend/src/modules/combat/combat.service.ts` — 1132 → 906 LOC (-226)
- `battleforthecrown-backend/src/modules/combat/combat.controller.ts` — injecte ReportService
- `battleforthecrown-backend/src/modules/combat/combat.module.ts` — fournit ReportService
