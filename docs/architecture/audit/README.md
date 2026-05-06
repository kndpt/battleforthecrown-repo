# Audit d'architecture — Tickets

Issus de la **Phase A** du chantier de réappropriation : 4 sous-agents ont cartographié l'architecture en lecture seule (pixi frontend, backend NestJS, packages/shared, contrats cross-workspace), puis la synthèse a produit 16 problèmes distincts.

Chaque ticket décrit **un problème observé**, factuel, avec références `path:line`. Ils sont volontairement **sans recommandation chiffrée** — la résolution (analyse de plusieurs solutions + choix) sera faite séparément ticket par ticket par un autre agent.

## Légende

- 🔴 **Critique** — sécurité, drift cross-workspace, ou contrat divergent qui peut faire diverger l'état frontend/backend.
- 🟡 **Majeure** — couplage structurel, dette qui freine l'évolution.
- 🟠 **Moyenne** — cohérence interne, qualité de vie, convention non appliquée.

## Tickets

### Cross-workspace (contrats, sync)

- [02 — Events WS définis mais non bindés frontend](./02-ws-events-not-bound.md) 🔴
- [03 — Dual path `resources.changed`](./03-resources-changed-dual-path.md) 🔴
- [04 — Typage permissif `WorldConfigDto`](./04-world-config-permissive-typing.md) 🔴
- [08 — Doublon types loot dans shared](./08-loot-types-duplication.md) 🟡

### Backend NestJS

- ✅ [01 — `userId` en `@Query` (fuite auth)](./01-backend-auth-userid-via-query.md) 🔴 — **résolu le 2026-05-06**
- [05 — Dépendances circulaires `forwardRef`](./05-backend-circular-deps.md) 🟡
- [06 — God services (`world-config`, `world`, `barbarian-seeding`)](./06-backend-god-services.md) 🟡
- [09 — Typage relâché (`as any`, `Record<string, number>`)](./09-backend-relaxed-typing.md) 🟡
- [10 — Logging incohérent (Pino + console.log)](./10-backend-logging-inconsistent.md) 🟡

### Shared (`packages/shared`)

- [07 — Templates barbares avec types fantômes](./07-shared-dead-barbarian-templates.md) 🟡

### Frontend Pixi

- [11 — Optimistic UI asymétrique](./11-pixi-optimistic-ui-asymmetric.md) 🟠
- [12 — Composants transverses dans `features/`](./12-pixi-transverse-components-misplaced.md) 🟠
- [13 — `GameSession` wrapper aux responsabilités dispersées](./13-pixi-game-session-fragile-wrapper.md) 🟠
- [14 — Convention zod non appliquée](./14-pixi-zod-not-applied.md) 🟠
- [15 — `setTimeout` magiques dans ws-bindings](./15-pixi-magic-timeouts-ws-bindings.md) 🟠
- [17 — Statut de `src/pixi/manifest.ts`](./17-pixi-manifest-ts-usage.md) 🟠

### Transverse

- [16 — Magic numbers hardcodés](./16-magic-numbers-hardcoded.md) 🟠

## Process pour traiter un ticket

1. Lire le ticket en entier (symptôme + détails techniques + impact + contexte).
2. Investiguer le code aux références `path:line` citées pour confirmer les observations (le ticket peut contenir des erreurs ou être incomplet — la cartographie est lecture rapide, pas exhaustive).
3. Lister 2 à 3 pistes de solution avec leurs tradeoffs (coût d'implémentation, surface du refacto, risques, alignement avec l'archi cible).
4. Proposer un choix argumenté + un plan d'implémentation découpable en steps vérifiables.
5. Valider avec l'utilisateur avant d'exécuter.

## Ordre de traitement (suggéré, à valider)

L'ordre n'est pas figé. Quelques principes :

- Les 🔴 cross-workspace devraient passer en premier — ils touchent les contrats et leur résolution conditionne le reste.
- [01 — auth userId @Query](./01-backend-auth-userid-via-query.md) est de la sécurité, à isoler tôt même si techniquement majeur (pas critique fonctionnellement aujourd'hui mais inacceptable en prod).
- [05 — circular deps backend](./05-backend-circular-deps.md) et [06 — god services](./06-backend-god-services.md) sont structurants : leur résolution oriente la nouvelle architecture, donc à voir tôt aussi.
- Les 🟠 cohérence frontend (11-15) peuvent être traités en parallèle ou après.

## Tickets connexes

Plusieurs tickets se renforcent mutuellement (couplage / typage / contrats WS). Voir la section "Tickets liés" en fin de chaque ticket.
