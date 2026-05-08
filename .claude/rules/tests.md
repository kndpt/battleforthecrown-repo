# Tests — politique transversale (source unique)

Document de référence pour décider **si**, **quoi**, et **comment** tester. Couvre les 3 workspaces du monorepo : `battleforthecrown-backend` (Jest), `battleforthecrown-pixi` (Vitest), `packages/shared`.

> Ce document complète [`qa.md`](./qa.md) (vérification fin de tâche). **Test automatisé ≠ QA.** Les deux peuvent coexister, jamais se substituer — cf. section *Tests vs QA* en bas.

## TL;DR — arbre de décision

Avant d'écrire un test, applique cet arbre dans l'ordre :

```
Tu vas modifier ou écrire du code → as-tu besoin d'un test ?

┌─ Le user a demandé un test explicitement ?
│    └─→ OUI : valide le type contre la grille « Types autorisés » ci-dessous.
│
├─ C'est une formule numérique pure (calculs, géométrie, distance, temps) ?
│    └─→ OUI : test unit pure-logic.
│
├─ C'est une validation Zod / un schéma DTO ?
│    └─→ OUI : test unit pure-logic.
│
├─ C'est une strategy ou un algorithme isolable (combat resolution, fog of war,
│    placement) qu'on peut tester sans toucher à Prisma / réseau / WS ?
│    └─→ OUI : test unit pure-logic.
│
├─ C'est de l'orchestration (worker pg-boss, controller HTTP, service Prisma,
│    gateway WS, mutation TanStack Query) ?
│    └─→ NON, JAMAIS de test unit. Couvert par smoke (cf. tasks/02). En attendant
│        que les smokes soient en place : QA in-game + inspection backend manuelle.
│
├─ C'est un composant React / une scène Pixi de présentation pure ?
│    └─→ NON.
│
└─ Sinon → NON par défaut. Vérification = QA in-game (cf. qa.md) ou inspection
   backend par l'agent (curl + SQL + logs).
```

**Règle d'or** : pas de test spontané. Le coût d'écriture/maintenance ne se justifie que sur de la logique pure non triviale. Ajouter un test "au cas où" est un anti-pattern (cf. ticket [`01-unit-tests-audit.md`](../../tasks/archive/01-unit-tests-audit.md), 26 → 7 fichiers spec backend pour cette raison).

## Types de tests autorisés

### 1. Unit pure-logic (tous les workspaces)

Test sans `jest.mock` / `vi.mock` structurel sur un système externe (Prisma, pg-boss, fetch, socket.io, setInterval). N'importe que des fonctions pures + leurs inputs.

#### Backend — `battleforthecrown-backend/src/**/*.spec.ts` (Jest)

✅ **Autorisé** :
- Formules combat : `combat.utils.spec`, `combat-strategies.spec`, `loot.manager.spec`.
- Formules monde : `world-config.service.spec` (cost, production rate, travel time, storage limit, population — Prisma mocké uniquement pour fournir le `WorldConfig`, pas pour asserter sur des `update()`).
- Géométrie / fog : `vision.service.spec` (`isInVision`, `applyFogOfWar` purs ; `getVisionDisks` testé pour le mapping watchtowerLevel → radius).
- Validation Zod : `combat/dto/*.spec`.
- Templates statiques : `barbarian-tier-templates.spec`.

❌ **Interdit** :
- `*.worker.spec.ts` qui mocke pg-boss + Prisma → smoke.
- `*.controller.spec.ts` qui mocke les services injectés → smoke REST.
- `*.service.spec.ts` qui mocke `PrismaService.$transaction` et asserte sur `tx.<table>.update.toHaveBeenCalledWith(...)` → smoke avec vraie DB.

Commande : `yarn workspace battleforthecrown-backend test`.

#### Pixi — `battleforthecrown-pixi/src/**/*.test.ts` (Vitest jsdom)

✅ **Autorisé** :
- Helpers purs : `lib/cn`, `lib/interpolation`, `useZodForm`, `pixi/entities/expeditionMath`, `pixi/scenes/villageLayout`, `features/world/buildMapEntities`, `features/village/constructionProgress`, `pixi/assets/manifest`.
- Stores Zustand (actions de mutation pures, pas le câblage WS) : `stores/expeditions`, `stores/worldMap`.
- Plomberie sensible : `api/client.test` (refresh JWT 401), `api/ws-bindings.test` (mapping events → store).
- Composants à logique non triviale : formulaires Zod (validation + soumission), optimistic UI (rollback path), hooks custom complexes.

❌ **Interdit** :
- Scènes Pixi en tant que telles. Le coût/valeur n'est pas là (Canvas + WebGL + ticker = pénible à mocker, signal pauvre). À la place : tester les helpers/data shapes que la scène consomme.
- Composants 100 % présentation : `Button`, `Card`, `Badge`, `Modal` vide, etc.
- Snapshot tests de DOM volumineux.

Commande : `yarn workspace battleforthecrown-pixi test`.

#### Shared — `packages/shared/`

Pas de runner propre (pure typing + formules). Si du code shared mérite un test, **le tester depuis le workspace consommateur**. Le typing est garanti par `tsc`.

### 2. Smoke (backend, à venir)

Stratégie en cours — voir [`02-smoke-tests-strategy.md`](../../tasks/02-smoke-tests-strategy.md). Quand les smokes seront en place, ils respecteront ce contrat : mutation REST réelle → vraie DB → attendre worker → asserter event Outbox via WS. **Jamais** de mock de Prisma ou pg-boss dans un smoke.

**En attendant** : ne réintroduis **pas** de test unit avec mocks pour combler le vide. Le filet temporaire = QA in-game + inspection backend manuelle (curl + SQL + logs).

## Anti-patterns (interdits, sans exception)

| Pattern | Pourquoi |
|---|---|
| `jest.mock('@prisma/client')` ou mock de `PrismaService` dans une spec | Mock-théâtre : asserte qu'on appelle `mock.update()`, pas que la mutation réussit. Cassé silencieusement à chaque migration. → smoke. |
| Mock de `pg-boss` (`mockBoss.work`/`mockBoss.send`) | La logique du worker est de l'orchestration, pas de la logique pure. → smoke. |
| Mock global de `setInterval` / `setTimeout` / `fetch` | Remplacer un primitive du runtime ferme la porte à tous les tests adjacents et masque les vrais bugs. |
| `expect(mockX).toHaveBeenCalledWith(...)` comme **assertion principale** | Indicateur fort de mock-théâtre. Asserter sur l'**effet** (DB, output retourné, event reçu), pas sur l'appel intermédiaire. |
| `Test.createTestingModule({ providers: [...tout] })` pour tester une formule | Sur-couplage. Tester la fonction pure directement, sans Nest. |
| Snapshot tests sur du JSON volumineux ou du DOM | Maintenance pénible, signal pauvre, faux positifs à chaque évolution cosmétique. |
| `*.skip()` / `xit()` traînants sans justification | Si un test est cassé : on le répare, on le supprime, ou on documente le `skip` avec un lien vers une issue. Pas de zombies. |

## Tests vs QA — clarification

| | Test automatisé | QA (cf. [`qa.md`](./qa.md)) |
|---|---|---|
| **Quand** | Tâche de code qui mérite un filet de régression | Fin de **toute** tâche, même refacto/doc |
| **Qui** | L'agent l'écrit, run en CI | User clique IG, ou agent fait curl/SQL |
| **Cible** | Logique métier non triviale, formules, Zod | Comportement runtime observable (UI, endpoint, event WS) |
| **Persistance** | Vit dans le repo, joué à chaque change | One-shot — fenêtre d'observation, pas un artefact |

Les deux sont **complémentaires**. Un fix qui ajoute un test ne dispense pas de la QA, et inversement.

## Si l'utilisateur demande un test interdit

Pousse-back avant d'écrire : *"Ce pattern est interdit cf. `.claude/rules/tests.md` (mock-théâtre / orchestration). Je propose [smoke / unit pure-logic sur le helper extrait / vérification backend par l'agent]. OK ?"* Demande confirmation avant de procéder.

## Références

- [`01-unit-tests-audit.md`](../../tasks/archive/01-unit-tests-audit.md) — historique du tri 26 → 7 fichiers spec backend (résolu 2026-05-08), source de la politique pure-logic-only.
- [`02-smoke-tests-strategy.md`](../../tasks/02-smoke-tests-strategy.md) — stratégie smoke pour l'orchestration (en cours), liste des flows à couvrir.
- [`qa.md`](./qa.md) — vérification fin de tâche, distinct des tests automatisés.
