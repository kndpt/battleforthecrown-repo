# Code Quality Report — Pixi Frontend

Populated by `/bftc-refactor-pixi`. Each run appends a dated entry.

New PRs use branch `maint/refactor-pixi/<short-topic>` and PR title
`maint(refactor-pixi): <subject>`. Older report entries may keep legacy
`claude/*` branch names.

---

_No runs yet._

---

## Run 2026-05-30 — commit 8e0fa8a

**Scan date:** 2026-05-30  
**Commit SHA:** 8e0fa8a7ced6a4f113444df4ce2769315a02fea3

### Mental model

Le frontend est bien stratifié :
- **API layer** : `src/api/` — `client.ts` (fetch wrapper), `queries.ts` (toutes les hooks TanStack Query centralisées), `ws-bindings.ts` (gestionnaire d'événements WebSocket → invalidations/stores), `ws.ts` (singleton socket.io).
- **Stores Zustand** : `src/stores/` — 6 stores minces et spécialisés (`auth`, `game`, `resources`, `crowns`, `expeditions`, `worldMap`, `ui`). Chacun a `clear()`. Persistance localStorage uniquement sur `auth` et `game`.
- **View-models** : `src/features/*/` — transformations data → props design-system. Bien séparés des composants.
- **Pixi canvas** : `src/pixi/scenes/` — factories qui retournent `{view, enter, exit, update}`. Subscribe au store Zustand en dehors de React via `store.subscribe()`.
- **React HUD** : `src/features/*/` — consomme TanStack Query + stores Zustand.

---

### Findings

#### Theme A — Query key inconsistency in ws-bindings.ts (**RESOLVED** — commit 714c83b)

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| A1 | API layer | ws-bindings.ts:221 | `['army', payload.villageId]` ne correspondait PAS à `queryKeys.armyInventory()` | **Critical** | S | **RESOLVED** |
| A2 | API layer | ws-bindings.ts:275 | Même bug sur `applyScoutReturned` | **Critical** | S | **RESOLVED** |
| A3 | API layer | ws-bindings.ts:314 | Même bug sur `applyExpeditionReturned` | **Critical** | S | **RESOLVED** |
| A4 | API layer | ws-bindings.ts:417 | Même bug sur `applyVillageAttacked` (défenseur) | **Critical** | S | **RESOLVED** |
| A5 | API layer | ws-bindings.ts:108–111 | Clés brutes inline au lieu de `queryKeys.*` | Medium | S | **RESOLVED** |
| A6 | API layer | ws-bindings.ts:199,201,220,315 | Même pattern sur d'autres handlers | Medium | S | **RESOLVED** |

#### Theme B — queryFn dupliquées dans GameHeader et WorldSelector (**PARTIALLY RESOLVED** — PR in progress)

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| B1 | TanStack Query | GameHeader.tsx:149–196 | 6 `useQueries` avec `apiClient.get` inline — duplique `queries.ts` + staleTime training 5s vs 2s | Medium | M | **RESOLVED** (run 2026-05-31) |
| B2 | TanStack Query | WorldSelector.tsx:60–65 | Idem pour `publicKingdomPower` | Low | S | STILL OPEN |

#### Theme C — Component size

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| C1 | Component design | GameHeader.tsx (538 LOC) | Agrège 7+ queries, multi-village data, 3 sheets — > 2 responsabilités | Medium | L | STILL OPEN |
| C2 | Component design | BuildingManagementPanel.tsx (962 LOC) | Grand composant, mais logique encapsulée dans des sous-composants inline | Low | M | STILL OPEN |

---

### "Looks bad but is actually fine"

| Pattern | Verdict |
|---------|---------|
| `projectResources` dans `interpolation.ts` | ✅ display-only, pas autoritatif — conforme server-authoritative |
| `useEffect(() => setEntities(visibleEntities))` dans `WorldMapScreen` | ✅ sync délibérée TanStack → Zustand pour canvas Pixi hors React |
| `useEffect(() => markRead(...))` dans `ReportDetailModal` | ✅ fire-once sur ouverture |
| `getState()` dans ws-bindings | ✅ lecture impérative hors React — pattern correct |
| `['memberships']`, `['villages']`, `['world-entities']` clés larges dans ws-bindings (conquest/capture events) | ✅ invalidation cross-ownership intentionnelle |
| `['combat', 'reports', userId]` clé partielle dans `invalidateCombatReports` | ✅ prefix match intentionnel (tous worldId) |
| `['power', 'kingdom', userId]` clé partielle dans `invalidatePowerQueries` | ✅ même pattern, intentionnel |
| `['villages']` dans `useJoinWorldMutation` | ✅ cross-world après join — worldId exact non connu avant la réponse serveur |
| Stores sans reset implicite | ✅ `useLogout()` appelle `.clear()` sur chaque store |
| `blipVisuals` non itérés dans `exit()` de WorldMapScene | ✅ `SceneManager` appelle `view.destroy({ children: true })` après `exit()` — cleanup Pixi géré |
| 6 `useEffect` dans WorldMapCanvas | ✅ lifecycle Pixi correct, souscriptions store, vision, cleanup |
| Reconciliation expéditions dans `AuthenticatedShell` | ✅ fallback REST→Zustand pour events WS manqués |

---

## Run 2026-05-31 — commit 714c83b

**Scan date:** 2026-05-31  
**Commit SHA:** 714c83b8c4d65832e468d1aa325a00894688756c

### Prior findings update

- A1–A6 : **RESOLVED** (commit 714c83b merged B1 from run 2026-05-30)
- B1 : **SELECTED FOR THIS RUN**
- B2 : STILL OPEN
- C1, C2 : STILL OPEN

### New findings

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| B1 | TanStack Query | GameHeader.tsx:149–196 | 6 `useQueries` avec `queryFn` inline — duplique `queries.ts` ; staleTime training : 5s inline vs 2s dans `armyTrainingQueryOptions` → progress stale en multi-village | **Medium** | M |
| N1 | Store design | ui.ts:24–49 | `openModalId`, `openPanelId`, `openModal`, `openPanel` définis mais jamais lus/appelés en dehors de `ui.ts` — dead code | Low | S |
| N2 | API layer | queries.ts:193,229 | `useResetWorldMutation` et `useUpdateVillageLabelMutation` invalident à la fois `queryKeys.myVillages(userId,worldId)` et `['villages']` — redondant | Low | S |

### "Looks bad but is actually fine" (this run)

Tous les patterns du run précédent confirmés. Ajout :
- `blipVisuals` non détruits explicitement dans `WorldMapScene.exit()` : ✅ `view.destroy({ children: true })` de `SceneManager` couvre l'ensemble du sous-arbre Pixi ; les Maps JS sont GC'd quand le handle sort de scope.

### Selected theme: **Theme B1 + N1 + N2 — `queryOptions` refactor + dead state cleanup**

**Rationale :**
- B1 est le bug actif le plus notable : la multi-village sheet (`GameHeader`) peut afficher des barres de progression d'entraînement avec 2× plus de stale que l'écran armée principal (5s vs 2s). En extrayant `armyTrainingQueryOptions` dans `queries.ts`, les deux call sites héritent automatiquement du même `staleTime`.
- Le pattern `queryOptions` de TanStack v5 est l'idiome recommandé pour partager la config de query entre `useQuery` et `useQueries` sans duplication.
- N1 et N2 sont de petits nettoyages cohérents avec le même diff.

**Rejected :**
- Theme B2 (WorldSelector inline queryFn) : low priority, peut être fixé lors d'un run maintenance.
- Theme C (component size) : scope trop large, nécessite une discussion de design.

### Verification

```
yarn static-check   → green (tsc --noEmit + ESLint backend + pixi)
yarn test:pixi      → 45 test files, 229 tests passed
```

---

## Run 2026-05-31 (b) — commit a086359

**Scan date:** 2026-05-31
**Commit SHA:** a086359a03f9a6b011a12d9978055c25d83957ab

### Prior findings update

- A1–A6 : **RESOLVED** (commit 714c83b)
- B1 : **RESOLVED** (`armyTrainingQueryOptions` + `queryOptions` refactor, PR #22)
- B2 (WorldSelector inline queryFn) : STILL OPEN
- N1 (ui.ts dead `openModalId`/`openPanelId`) : **RESOLVED** — plus présent dans `ui.ts` (store réduit à toasts + victoryModals)
- N2 (redundant `['villages']` invalidation) : **RESOLVED** — `useResetWorldMutation`/`useUpdateVillageLabelMutation` n'invalident plus que `queryKeys.myVillages(...)`
- C1 (GameHeader god-component, 527 LOC) : STILL OPEN
- C2 (BuildingManagementPanel 962 LOC) : STILL OPEN

### Mental model

Frontend bien stratifié et discipliné. Vérifié cette passe :
- **Server-authoritative** : aucune violation. `projectResources`/`projectCrowns` (`lib/interpolation.ts`) sont display-only ; toute mutation passe par REST → invalidation TanStack. Les valeurs autoritatives (power, population, garrison) viennent du serveur.
- **Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `fetch`/`axios` hors `src/api/`, 0 `.setState` direct hors actions. Boundary Zod sur `worlds/public`, `world/config`.
- **Stores Zustand** : minces, une responsabilité chacun, tous avec `clear()`. **Sauf** : le teardown de session n'appelait `clear()` que sur 2 des 7 stores.

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| S1 | Store design / correctness | `api/queries.ts:1118` (`useLogout`) | Ne reset que `auth` + `game`. `resources`, `crowns`, `expeditions`, `ui`, `worldMap` persistent en mémoire après logout. | **High** | S | **SELECTED** |
| S2 | Store design / correctness | `api/index.ts:18` (`clearTokens` sur 401 refresh-fail) | Même lacune : `clearSession()` + `useGameStore.clear()` seulement. Forced-logout laisse l'état de session du user précédent. | **High** | S | **SELECTED** |
| S3 | Store design | `stores/ui.ts` | Pas d'action `clear()` composite : `clearToasts` + `clearVictoryModals` doivent être appelés séparément → facile à oublier dans un teardown. | Medium | S | **SELECTED** |
| C1 | Component design | `features/layout/GameHeader.tsx` (527 LOC) | God-component : 7 queries simples + 6 `useQueries` multi-village + 3 view-models inline (`villageSheetItems`, `profileVillages`, `profileSheetData`) + 3 sheets. Recommandation : extraire un hook `useMultiVillageData` + un `gameHeaderProfileViewModel` testable. | Medium | L | STILL OPEN |
| C3 | Component design | `features/army/ArmyScreen.tsx` (571 LOC) | Dérivations `selectedGarrison*` (lignes 301-330) en JSX component plutôt qu'en view-model. Borderline — la logique de garnison pourrait rejoindre `armyViewModel`. | Low | M | STILL OPEN |

**Impact concret de S1/S2** : `expeditions.byId` est rendu sur la carte (`WorldMapCanvas.reconcileExpeditions` au mount). Après logout puis re-login, des expéditions fantômes du user précédent s'affichent jusqu'au premier reconcile REST (`AuthenticatedShell`). Les `victoryModals` (`ui`) ne sont purgés nulle part → une modale de victoire en file peut popper après re-login. `resources.byVillageId` / `crowns.byKey` croissent sans borne entre sessions (fuite mémoire).

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `expeditions` non clear sur logout | ⚠️ partiellement auto-réparé par le reconcile REST dans `AuthenticatedShell` (prune des ids absents de `liveIds`), mais fenêtre de ghost-render au mount + dépend d'un villageId sélectionné → vrai finding (S1). |
| `clearTokens` ne disconnect pas le socket | ✅ `AuthenticatedShell` disconnect le socket via cleanup d'effet quand `accessToken` passe à null. |
| `ws-bindings` clés partielles (`['power','kingdom',userId]`, `['combat','reports',userId]`) | ✅ prefix-match intentionnel (tous worldId) — confirmé run précédent. |
| `useActiveExpeditionsQuery` `refetchInterval` conditionnel | ✅ poll de secours quand le socket drop, off quand 0 expédition active. |
| Stores `byVillageId`/`byKey` keyés par UUID | ✅ pas de collision inter-user, mais croissance non bornée → traité par S1. |
| `armyViewModel.ts` (pure, testé indirectement) | ✅ fonctions pures bien séparées, view-model pattern respecté. |

### Selected theme: **S1 + S2 + S3 — centralized session-store teardown**

**Rationale :**
- Bug de correctness latent (fuite d'état inter-session : expéditions fantômes, modale de victoire, fuite mémoire). Catégorie store-design explicitement priorisée par le skill ("Missing reset on logout/disconnect").
- Élimine la duplication entre les 2 sites de teardown (`useLogout`, `clearTokens`) qui dérivaient déjà (l'un sans `worldMap`, l'autre sans `ui`).
- Scope chirurgical, 100 % vérifiable par `test:pixi` + `static-check`, aucun changement backend.

**Implementation :**
- `stores/session.ts` (nouveau) : `resetGameSessionStores()` reset `game` + `resources` + `crowns` + `expeditions` + `ui` + `worldMap`.
- `stores/ui.ts` : ajout action `clear()` composite (toasts + victoryModals).
- `api/index.ts` (`clearTokens`) et `api/queries.ts` (`useLogout`) appellent le helper.
- `stores/session.test.ts` (nouveau) : seed des 6 stores → reset → assert vides.

**Rejected :**
- C1 (GameHeader decomposition) : effort L, churn élevé sur `GameHeader.test.tsx` (508 LOC), bénéficie d'une discussion design dédiée. Documenté avec recommandation.
- C3 (ArmyScreen garrison derivations) : low priority, borderline.
- B2 (WorldSelector inline queryFn) : low, candidat `bftc-maint-debt`.

### Verification

```text
yarn static-check   → green (tsc --noEmit backend + pixi, ESLint backend + pixi --quiet)
yarn test:pixi      → 46 test files, 230 tests passed (+1 session.test.ts)
```

---

## Run 2026-06-03 — commit ad45e43

**Scan date:** 2026-06-03  
**Commit SHA:** ad45e43bf699ffafc07bce3c7981c8b25f14bc05

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1 (GameHeader inline queryFn/staleTime) : **RESOLVED**
- B2 (WorldSelector/useWorldCardModels inline queryFn) : **RESOLVED** (ce run)
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED**
- C1 (GameHeader god-component) : **RESOLVED** (useMultiVillageData + profileViewModel)
- C2 (BuildingManagementPanel 962 LOC) : STILL OPEN — logique encapsulée dans sous-composants, faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — low, borderline view-model
- D2 (headerHelpers.ts tests) : **RESOLVED** (ce run — headerHelpers.test.ts)
- D3 (VillageView inline keyframes) : STILL OPEN — cosmétique, ~72 LOC de CSS inline
- D4 (magic number 60_000) : STILL OPEN — acceptable (remplacé par le serveur en <1s)

### Mental model

Frontend propre et discipliné. Couverture de cette passe :
- **Server-authoritative** : 0 violation. Interpolation display-only, toutes les mutations via REST → invalidation TanStack.
- **Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `@ts-expect-error`, 0 `fetch`/`axios` hors `src/api/`, 0 `.setState` direct hors actions.
- **Optimistic UI** : patterns `onMutate/onError/onSettled` corrects.
- **Query layer** : `queries.ts` est maintenant la seule source de `queryFn` — `useWorldCardModels` était le dernier fichier hors-`queries.ts` à définir une `queryFn` inline avec schéma Zod et `staleTime`.
- **Pixi scenes** : `WorldMapScene.ts` (720 LOC) propre — pas de lecture de store dans le ticker, cleanup correct via `SceneManager.destroy({ children: true })`.

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| B2 | API layer | `features/worlds/useWorldCardModels.ts:35-49` | Inline `queryFn` + `PublicKingdomPowerSchema` local + `staleTime: 30_000` non partagés. Dernier `queryFn` hors `queries.ts`. | **Medium** | S | **RESOLVED** (ce run) |
| D2 | Test gap | `features/layout/headerHelpers.ts` | `toResultMap`, `getPlayerInitials`, `formatWorldPhase` — 0 test dédié, 3+ call sites (useMultiVillageData, profileViewModel, VillageView, GameHeader). | Low | S | **RESOLVED** (ce run) |
| D3 | Component design | `features/game/VillageView.tsx:477-549` | Bloc `<style>` inline (72 LOC de keyframes + classes d'animation) dans le JSX — non standard, ne peut pas être analysé statiquement. | Low | S | STILL OPEN |
| D4 | Naming / magic numbers | `api/queries.ts:509,1047` | `timePerUnitMs: 60_000` / `endTime: +60_000` hardcodés — OK car remplacé par le serveur en <1s. | Low | S | STILL OPEN |
| E1 | Component size | `features/game/VillageView.tsx` (970 LOC) | Toujours large, mais bien organisé : hero (~300 LOC animé), dérivations useMemo (~100 LOC), handlers (~100 LOC), JSX (~200 LOC). Pas de god-component — responsabilités bien délimitées pour un écran principal. | Low | L | NOTED |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `useWorldCardModels.ts` inline queryFn | ⚠️ était le seul cas restant — **traité par ce run** |
| `WorldMapScene.ts exit()` — `visuals.clear()` sans `destroyVisual()` | ✅ `SceneManager.destroy({ children: true })` couvre l'arbre Pixi entier |
| 5 `useMemo<CSSProperties>` parallax dans VillageView | ✅ display-only, dépendances correctes, rAF throttle justifié |
| `VillageView.tsx` `<style>` block inline | ⚠️ non standard mais fonctionnel, pas de comportement cassé — D3, candidat bftc-maint-debt |
| `retryAttachTextures` toutes les 500ms dans `WorldMapScene.update()` | ✅ O(n) forEach sur une petite Map (assets), 500ms cooldown — acceptable |
| `SpecializedBuildingDetailModal.tsx` (639 LOC) | ✅ purement présentationnel (props only), sous-composants par type de bâtiment, testé |
| `ArmyScreen.tsx` garrison derivations inline | ✅ 10 lignes de ternaires simples sur des arrays petits, pas de fuite de logique métier |
| `headerHelpers.ts` nommé `headerHelpers` mais utilisé par `useMultiVillageData` | ✅ couplage faible, renommage = churn mécanique sans valeur |
| `toResultMap` non wrappé dans `useMemo` dans `useMultiVillageData` | ✅ utilisé comme `combine` option de `useQueries` — TanStack stabilise les références via son propre système |

### Selected theme: **B2 + D2 — Centralize `publicKingdomPower` query config + `headerHelpers.test.ts`**

**Rationale :**
- B2 était le dernier `queryFn` inline hors `queries.ts` — viole la convention établie (toutes les queryFn/staleTime dans `queries.ts`). L'extraction vers `publicKingdomPowerQueryOptions` suit exactement le pattern `armyTrainingQueryOptions` (run 2026-05-31).
- D2 : `toResultMap` (utilisé 6× dans `useMultiVillageData`) + `getPlayerInitials` (3 call sites) + `formatWorldPhase` (2 call sites) n'avaient aucun test direct. Un regression sur `toResultMap` (ex : swap d'index dans le flatMap) ne serait attrapée que par les tests E2E de rendu.
- Les deux items forment un thème cohérent : « compléter la couche data — centralisation + filet de régression ».

**Rejected :**
- D3 (VillageView keyframes) : cosmétique, candidat `bftc-maint-debt`.
- E1 (VillageView 970 LOC) : organisé, lisible, décomposition serait du churn mécanique.
- C2 (BuildingManagementPanel) : logique encapsulée en sous-composants, faible gain.
- C3 (ArmyScreen garrison) : low, borderline.

### Verification

```text
yarn static-check   → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn workspace …-pixi test --run   → 58 test files, 300 tests passed (+1 headerHelpers.test.ts, +15 tests)
```

**Diff :** `queries.ts` +35 LOC (`publicKingdomPowerQueryOptions` + Zod schema + type), `useWorldCardModels.ts` −15 LOC (inline queryFn supprimé), `headerHelpers.test.ts` +97 LOC (14 tests directs). Net : −15 / +132 LOC dans les fichiers modifiés.

---

## Run 2026-06-02 — commit 34b14a7

**Scan date:** 2026-06-02
**Commit SHA:** 34b14a749538d769e56a5866d31e04339946f118

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1 (`armyTrainingQueryOptions`) : **RESOLVED**
- B2 (WorldSelector inline queryFn) : STILL OPEN — low, candidat `bftc-maint-debt`
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED** (PR mergée)
- C1 (GameHeader god-component) : **SELECTED** cette passe (élargi en D1, cf. ci-dessous)
- C2 (BuildingManagementPanel 962 LOC) : STILL OPEN — logique encapsulée dans sous-composants, faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — low, borderline view-model

### Mental model

Frontend toujours bien stratifié et discipliné. Vérifié cette passe :
- **Server-authoritative** : 0 violation. `useDisplayResources`/`useDisplayCrowns` (interpolation display-only), toutes les mutations passent par REST → invalidation TanStack. Aucune valeur autoritative calculée localement.
- **Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `@ts-expect-error`, 0 `fetch`/`axios` hors `src/api/`, 0 `.setState` direct hors actions. Boundary Zod sur `worlds/public`, `world/config`, cancel responses.
- **Optimistic UI** : `useUpgradeBuildingMutation`, `useTrainUnitsMutation`, `useCancelConstructionMutation` — tous avec `onMutate`/`onError`/`onSettled` corrects.
- **TanStack Query** : `queries.ts` (1212 LOC) est un module plat de hooks centralisés — pas un god-file problématique. `queryOptions` partagé pour resources/buildings/queue/strategy/population/armyTraining.

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| D1 | Component design / DRY | `features/layout/GameHeader.tsx:90-411` ⇄ `features/game/VillageView.tsx:188-411` | ~180 LOC d'orchestration multi-village + view-models profil **dupliqués quasi-verbatim** entre les 2 plus gros composants de production : `villageIds`, 6 `useQueries` (resources/population/buildings/queue/strategy/training) avec gating `isVillageSheetOpen`/`shouldLoadProfileVillages` identique, `powerByVillageId`, 6 `toResultMap`, `villageSheetItems` (+ tri), `profileVillages`, `profileSheetData`, `strategyLabels`. Un fix de logique (ex bug B1) doit être appliqué 2× ; risque de dérive. | **Medium** | M | **SELECTED** |
| D2 | Test gap | `features/layout/headerHelpers.ts` | `toResultMap`, `getPlayerInitials`, `formatWorldPhase` — helpers purs, 0 test dédié (couverts indirectement via `GameHeader.test.tsx`). | Low | S | NOTED |
| D3 | Component design | `features/layout/GameHeader.tsx:339-357` | Bloc `<style>{...}</style>` inline (keyframes) dans le JSX — magic CSS, pourrait vivre dans `index.css` ou un module. | Low | S | NOTED |
| D4 | Naming / magic numbers | `api/queries.ts:509`, `:1047` | `timePerUnitMs: 60_000` / `endTime: +60_000` hardcodés dans les placeholders optimistic — durée arbitraire non nommée (acceptable car remplacée par le serveur en <1s, mais magic number). | Low | S | NOTED |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `queries.ts` 1212 LOC | ✅ module plat de hooks API centralisés, pas de god-logic ; découpe par domaine = churn mécanique à faible valeur. |
| Double `useKingdomPowerQuery()` après extraction du hook | ✅ TanStack dédupe par clé (un seul fetch, observer partagé). Le hook l'absorbe pour éviter l'ambiguïté. |
| `useRecallExpeditionMutation.onSuccess` écrit dans `useExpeditionsStore` | ✅ via l'action `update` du store (pattern reconcile documenté), pas un `setState` brut. |
| `refetchInterval` conditionnels (expeditions, conquests, retention) | ✅ poll de secours quand WS drop, off au repos. |
| `villageSheetItems` sans `now` passé à `buildMultiVillageSheetItems` | ✅ défaut `Date.now()` au render — ETAs sheet rafraîchies au re-render, comportement voulu (préservé). |
| `categorizeVillageBuildings`, `getOnboardingGuidance`, `armyViewModel` | ✅ view-models purs bien séparés. |

### Selected theme: **D1 — extract shared multi-village data hook + profile view-model**

**Rationale :**
- C1 (GameHeader god-component) était reporté 2× pour effort/discussion. La découverte que **VillageView duplique le même bloc quasi à l'identique** double la valeur : l'extraction supprime ~180 LOC dupliquées, dé-duplique 2 god-components d'un coup, et **réduit** le risque de churn futur (un seul point de fix au lieu de 2).
- Catégorie « business logic in JSX components » + « components with > 2 responsibilities » explicitement priorisée par le skill.
- Les view-models profil (`buildProfileVillages`, `buildPlayerProfileSheetData`) deviennent **purs et testables** (comble partiellement D2).
- Scope chirurgical, 100 % vérifiable par `test:pixi` + `static-check`, 0 changement backend/API.

**Implementation :**
- `features/layout/useMultiVillageData.ts` (nouveau) : hook encapsulant `useKingdomPowerQuery` + 6 `useQueries` + maps + `villageSheetItems`. Expose `{ kingdomPower, powerByVillageId, buildingsByVillageId, strategyByVillageId, villageSheetItems }`.
- `features/layout/profileViewModel.ts` (nouveau, pur) : `strategyLabels`, `buildProfileVillages`, `buildPlayerProfileSheetData`.
- `features/layout/profileViewModel.test.ts` (nouveau) : tests des 2 builders.
- `GameHeader.tsx` + `VillageView.tsx` : consomment hook + view-model, suppression des blocs dupliqués.

**Rejected :**
- C2 (BuildingManagementPanel) : logique déjà encapsulée en sous-composants, faible gain.
- C3 (ArmyScreen garrison) : low, borderline.
- B2 (WorldSelector inline queryFn) : low, candidat `bftc-maint-debt`.
- D3/D4 : cosmétiques, hors thème cohérent.

### Verification

```text
yarn static-check                          → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn workspace …-pixi test --run           → 56 test files, 282 tests passed (+1 profileViewModel.test.ts)
```

**Diff :** `GameHeader.tsx` −~190 LOC, `VillageView.tsx` −~210 LOC ; nouveaux `useMultiVillageData.ts` (hook), `profileViewModel.ts` (pur) + `.test.ts`, `+ buildSortedMultiVillageSheetItems` dans `multiVillageSheet.ts`. Net : −393 / +156 dans les fichiers modifiés.

---

## Run 2026-06-04 — commit 3ac0888

**Scan date:** 2026-06-04
**Commit SHA:** 3ac088806af7c7b4ac976ff1ca3b127849d799dd

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1, B2 : **RESOLVED**
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED**
- C1 (GameHeader god-component) : **RESOLVED**
- D2 (headerHelpers tests) : **RESOLVED**
- C2 (BuildingManagementPanel 962 LOC) : STILL OPEN — logique encapsulée dans sous-composants, faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — low, borderline view-model
- D3 (VillageView inline `<style>` block) : STILL OPEN — cosmétique
- D4 (magic number 60_000 optimistic) : STILL OPEN — acceptable

### Mental model

Frontend propre et discipliné. Vérifié cette passe :
- **Server-authoritative** : 0 violation. `projectResources`/`projectCrowns` display-only, toutes les mutations via REST → invalidation TanStack.
- **Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `@ts-expect-error`, 0 `fetch`/`axios` hors `src/api/`, 0 `.setState` direct hors actions. Boundary Zod sur `worlds/public`, `world/config`, `cancelResponses`, `retentionSummary`, `publicKingdomPower`, `buildMapEntities.captureWindow`.
- **Stores Zustand** : minces, une responsabilité chacun, tous avec `clear()`. Session teardown centralisé (`stores/session.ts`).
- **Pixi scenes** : `WorldMapScene.ts` (721 LOC) propre — pas de lecture de store dans le ticker, cleanup correct via `SceneManager.destroy({ children: true })`. Deux bugs corrigés ce run (F1 + F4).
- **TanStack Query** : `queries.ts` (1237 LOC) centralisé, `queryOptions` partagés. `openConquests` / `openExpeditions` avec `refetchInterval` conditionnel.

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| F1 | API layer / UX | `ws-bindings.ts:527` | `applyVillageCaptureWindowCompleted` toast `description: payload.targetVillageId` affichait le UUID brut de la cible — aucun nom de village dans le payload | **Medium** | S | **RESOLVED** (ce run) |
| F4 | Pixi scene / Performance | `WorldMapScene.ts:709` | `drawCaptureMarker` appelé sur toutes les entités à chaque tick (~60/s), y compris celles sans `captureWindow` → `Graphics.clear()` inutile sur 100+ entités/frame | **Medium** | S | **RESOLVED** (ce run) |
| F2 | Magic string | `DailyRetentionWidget.tsx:295` | `expiresInValue="04h00"` hardcodé — approximation du reset quotidien non dérivée des données | Low | S | STILL OPEN |
| F3 | Test gap | `kingdomActivitiesViewModel.ts:121` | `formatTime` pure — non testée directement | Low | S | STILL OPEN |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `['power', 'kingdom', userId]` clé partielle dans `invalidatePowerQueries` | ✅ prefix-match intentionnel (tous worldId) — n'atteint pas `publicKingdomPower` car le 3e élément est `'public'` |
| `['combat', 'reports', userId]` dans `invalidateCombatReports` | ✅ prefix-match intentionnel (cross-world) — confirmé runs précédents |
| `['memberships']`, `['villages']`, `['world-entities']` dans `applyVillageConquered` / capture events | ✅ broad invalidation cross-ownership intentionnelle |
| `useWorldEntitiesQuery` `staleTime: 30_000` + `refetchInterval: 30_000` | ✅ refetchInterval force le refresh indépendamment de la staleness ; WS events invalident immédiatement |
| `captureWindow` field absent du `SelectedEntityPanel` tooltip | ✅ information rendue par le marker Pixi sur la carte, non dupliquée dans le callout |
| `SelectedEntityPanel` appelle `useArmyInventoryQuery(null)` / `useGarrisonQuery(null)` pour entités non-mine | ✅ `enabled: Boolean(villageId)` — queries désactivées quand null |
| `DailyRetentionWidget.tsx` `expiresInValue="04h00"` | ⚠️ placeholder du reset journalier (minuit Paris) — non dérivé du DTO ; F2, candidat `bftc-maint-debt` |

### Selected theme: **F1 + F4 — capture event correctness & Pixi tick optimization**

**Rationale :**
- F1 est un bug UX visible sur le happy-path de la capture (toast "Capture terminée" affichait un UUID opaque). Le payload `VillageCaptureWindowCompletedPayload` ne contient pas de nom de village → message générique `'Village conquis'`.
- F4 est une anomalie Pixi : `drawCaptureMarker` était appelé sur TOUTES les entités dans le ticker même quand aucune n'était en capture, entraînant `Graphics.clear()` inutile sur chaque entité à ~60/s. La correction consiste à ne passer dans `drawCaptureMarker` que les entités ayant effectivement un `captureWindow` actif. Le nettoyage lors du retrait du `captureWindow` est déjà géré par `drawEntity` (ligne 429) appelé via `reconcile`.
- Le test ajouté à `ws-bindings.test.ts` régresse F1 et assure qu'aucune future modification du payload ne réintroduira un UUID brut.
- Thème cohérent (domaine capture window), scope chirurgical (3 fichiers), 100 % vérifiable sans backend.

**Rejected :**
- F2 (DailyRetentionWidget expiresInValue hardcoded) : low, cosmétique, candidat `bftc-maint-debt`.
- F3 (formatTime test gap) : low, formatTime couverte indirectement par `mapOpenConquestToCaptureCard` tests.
- C2, C3, D3, D4 : reportés depuis runs précédents, bénéfice marginal.

### Verification

```text
yarn static-check   → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn test:pixi      → 59 test files, 309 tests passed (+1 ws-bindings.test.ts)
```

---

## Run 2026-06-05 — commit 9e2589c

**Scan date:** 2026-06-05
**Commit SHA:** 9e2589c (on branch maint/refactor-pixi/shared-compute-progress)

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1, B2 : **RESOLVED**
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED**
- C1 (GameHeader god-component) : **RESOLVED**
- D2 (headerHelpers tests) : **RESOLVED**
- F1 (UUID toast) : **RESOLVED**
- F4 (drawCaptureMarker all entities) : **RESOLVED**
- G1 (computeProgress duplication) : **RESOLVED** (ce run)
- F3 / G2 (formatTime untested) : **RESOLVED** (ce run)
- C2 (BuildingManagementPanel 962 LOC) : STILL OPEN — logique encapsulée dans sous-composants, faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — low, borderline view-model
- D3 (VillageView inline `<style>` block) : STILL OPEN — cosmétique
- D4 (magic number 60_000) : STILL OPEN — acceptable
- F2 (DailyRetentionWidget expiresInValue hardcoded) : STILL OPEN — cosmétique

### Mental model

Frontend propre et discipliné. Vérifié cette passe (commit 67bf004 + contexte):
- **Server-authoritative** : 0 violation. `computeProgress` et `formatTime` sont display-only.
- **Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `@ts-expect-error`, 0 `fetch`/`axios` hors `src/api/`.
- **Noble unit** : `useRecruitNobleMutation` — pas d'optimistic UI, `onSettled` invalide armyTraining/armyInventory/resources/population/crowns. Correct (noble training dure ~minutes, rollback non trivial).
- **SelectedEntityPanel** : 3 queries avec `enabled` guards, capture section bien gérée.
- **worldMapScene** : ticker ne passe dans `drawCaptureMarker` que les entités avec `captureWindow` actif (F4 fixé).

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| G1 | DRY / Type debt | `SelectedEntityPanel.tsx:219` (commit 67bf004) | `computeProgress` copié verbatim depuis `kingdomActivitiesViewModel.ts:141` — 2 définitions identiques. | **Medium** | S | **RESOLVED** (ce run) |
| G2 | Test gap | `kingdomActivitiesViewModel.ts:124` | `formatTime` exporté sans test direct — `endTime` jamais asserté dans les tests existants. | Low | S | **RESOLVED** (ce run) |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `useRecruitNobleMutation` sans optimistic UI | ✅ noble training = opération longue/irréversible, `onSettled` invalide correctement |
| `SelectedEntityPanel` 3 queries inline | ✅ `enabled: Boolean(ownedVillageId)` / `Boolean(villagePowerId)` — pas de fetch superflu pour entités non-possédées |
| `computeProgress` retourne 100 quand `endAt <= startAt` | ✅ comportement voulu : capture terminée = barre pleine |
| `kingdomActivitiesViewModel.ts` `computeProgress` était private | ✅ devenu export nommé — aucune violation d'encapsulation, module-level helper cohérent |
| `noble.killed` dans ws-bindings sans toast de succès | ✅ succès = `village.capture-window-completed` (toast séparé) ; `noble.killed` est l'échec |
| ArmyScreen 3 BottomSheets inline | ✅ zIndex distincts (80), ouverture exclusive, pas de couplage problématique |
| C3 (ArmyScreen garrison ternaires) | ✅ 30 lignes plates, facile à lire, extraction = churn sans valeur |

### Selected theme: **G1 + G2 — Extract `computeProgress` + direct `formatTime`/`computeProgress` tests**

**Rationale :**
- G1 : copie introduite dans 67bf004 (feature noble/capture). Une divergence future (ex: clamping différent) devrait être appliquée 2× ou passerait inaperçue.  
- G2 : `formatTime` est un export pur ; son résultat `endTime` n'était jamais vérifié. Une régression locale ou de timezone ne serait pas catchée.
- Thème cohérent (domaine capture window timing), scope S, zéro backend, entièrement vérifiable.

**Implementation :**
- `kingdomActivitiesViewModel.ts` : `function computeProgress` → `export function computeProgress`.
- `SelectedEntityPanel.tsx` : import `computeProgress` depuis `kingdomActivitiesViewModel`, suppression du doublon local.
- `kingdomActivitiesViewModel.test.ts` : ajout de suites `formatTime` (3 tests) et `computeProgress` (5 tests) + assertion `endTime` dans le test conquest existant.

**Rejected :**
- C2/C3 : scope large, churn sans valeur fonctionnelle.
- D3/D4/F2 : cosmétiques, candidats `bftc-maint-debt`.

### Verification

```text
yarn static-check   → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn test:pixi      → 60 test files, 322 tests passed (+8 kingdomActivitiesViewModel.test.ts)
```

**Diff :** `kingdomActivitiesViewModel.ts` +1 LOC (`export`), `SelectedEntityPanel.tsx` −8 LOC (local computeProgress supprimé, import ajouté), `kingdomActivitiesViewModel.test.ts` +57 LOC (+8 tests). Net : −7 / +58 dans les fichiers modifiés.

---

## Run 2026-06-06 — commit 502f039

**Scan date:** 2026-06-06  
**Commit SHA:** 502f039eacfe8312f7da8139f339f980a4ca2009

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1, B2 : **RESOLVED**
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED**
- C1 (GameHeader god-component) : **RESOLVED**
- D2 (headerHelpers tests) : **RESOLVED**
- F1 (UUID toast) : **RESOLVED**
- F4 (drawCaptureMarker all entities) : **RESOLVED**
- G1 (computeProgress duplication) : **RESOLVED**
- F3 / G2 (formatTime tests) : **RESOLVED**
- H1 (armyTraining refetchInterval) : **SELECTED** (ce run)
- H2 (BuildingDetailModal polling useEffect) : **SELECTED** (ce run)
- C2 (SpecializedBuildingDetailModal 643 LOC) : STILL OPEN — bien organisé (sous-composants par type), faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — 30 lignes plates, extraction = churn sans valeur
- D3 (VillageView inline `<style>` block, lignes 477-549) : STILL OPEN — cosmétique
- D4 (magic number 60_000 optimistic) : STILL OPEN — acceptable, serveur remplace en <1s
- F2 (DailyRetentionWidget expiresInValue hardcoded) : STILL OPEN — cosmétique

### Mental model

Frontend propre et discipliné. Vérifié cette passe (commit 502f039 + 67bf004 noble/capture feature):
- **Server-authoritative** : 0 violation. `travelMs`/`totalAttack`/`totalCarryCapacity` dans `AttackDetailModal` sont display-only (estimations avant soumission) — le serveur calcule les valeurs autoritatives à la création d'expédition.
- **Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `@ts-expect-error`, 0 `fetch`/`axios` hors `src/api/`. `usePublicVillagePowerQuery` valide la réponse avec `PublicVillagePowerSchema` (Zod strict).
- **Stores Zustand** : tous avec `clear()`, teardown centralisé dans `stores/session.ts` — confirmé.
- **Pixi scenes** : `WorldMapScene.ts:729-745` ticker correct — `drawCaptureMarker` uniquement sur entités avec `captureWindow` actif (fix F4 confirmé).
- **TanStack Query** : `openConquests` / `openExpeditions` / `activeExpeditions` / `retentionSummary` ont tous `refetchInterval` conditionnel. `armyTraining` était le seul manquant.

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| H1 | TanStack Query | `api/queries.ts:525-534` (`armyTrainingQueryOptions`) | Pas de `refetchInterval` — `ArmyScreen` ne se répare pas si le WS drop pendant un entraînement de Noble (10+ min). Toutes les queries longues comparables ont un `refetchInterval` conditionnel (`activeExpeditions`, `openConquests`, `openExpeditions`, `retentionSummary`). | **Medium** | S | **RESOLVED** (ce run) |
| H2 | Component design | `features/village/BuildingDetailModal.tsx:138-149` | `useEffect` appelant `queryClient.invalidateQueries` toutes les secondes comme workaround local du H1 manquant — préoccupation de poll appartient à la couche query, pas au composant. Redondant une fois H1 corrigé. | Low | S | **RESOLVED** (ce run) |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `QueueBottomSheet.formatTime` (ligne 20) vs `VillageViewSectionHelpers.formatQueueTime` | ✅ Formats différents ("H h MM m" vs "H:MM") pour des contextes UI distincts — pas une duplication |
| `BottomNavigationBar` styles inline au lieu de Tailwind | ✅ Animations spring et CSS custom properties (`--village-enter-x`) non exprimables en Tailwind standard |
| `AttackDetailModal` calculs locaux `travelMs` / `totalAttack` / `totalCarryCapacity` | ✅ Estimations display-only avant soumission ; le serveur calcule les valeurs autoritatives |
| `armyTraining` sans `refetchInterval` | ⚠️ **Était** le seul cas manquant — traité par H1 |
| `BuildingDetailModal` `useEffect` polling noble training | ⚠️ Workaround composant du H1 manquant — traité par H2 |
| Noble training sans optimistic UI | ✅ Opération longue/irréversible, `onSettled` invalide correctement |
| `useOpenConquestsQuery` `refetchInterval: 10_000` (vs 5_000 pour expeditions) | ✅ Conquêtes moins fréquentes, 10s acceptable |
| `WorldMapScene` exit — pas de `visuals.clear()` explicite | ✅ `SceneManager.destroy({ children: true })` couvre l'arbre Pixi entier |

### Selected theme: **H1 + H2 — `refetchInterval` sur `armyTrainingQueryOptions` + suppression du workaround composant**

**Rationale :**
- H1 est un gap de correctness : l'entraînement noble dure 10+ min, un drop WS pendant cette fenêtre est probable. Toutes les queries avec des données actives longues ont `refetchInterval` — `armyTraining` était l'exception non justifiée.
- H2 est la conséquence directe de H1 : le `useEffect` dans `BuildingDetailModal` compensait le manquant mais seulement quand cette modale spécifique était ouverte (pas `ArmyScreen`). Corriger H1 couvre les deux call sites proprement.
- Le fix suit la convention établie et testée déjà utilisée pour `activeExpeditions`, `openConquests`, `retentionSummary`.
- Scope S : +4 LOC dans `queries.ts`, −14 LOC dans `BuildingDetailModal.tsx` (imports + useEffect).

**Implementation :**
- `api/queries.ts:525-534` : ajout `refetchInterval: (query) => query.state.data && query.state.data.length > 0 ? 5_000 : false` à `armyTrainingQueryOptions`.
- `features/village/BuildingDetailModal.tsx` : suppression `useEffect`, `queryClient`, imports `useQueryClient` / `queryKeys` / `computeUnitTrainingProgress` devenus inutiles.

**Rejected :**
- D3 (VillageView `<style>` block) : cosmétique, candidat `bftc-maint-debt`.
- C2, C3 : churn sans bénéfice fonctionnel.
- D4, F2 : cosmétiques.

### Verification

```text
yarn static-check   → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn test:pixi      → 60 test files, 322 tests passed (aucun test cassé)
```

**Diff :** `queries.ts` +4 LOC (`refetchInterval`), `BuildingDetailModal.tsx` −14 LOC (useEffect + imports). Net : −10 LOC dans les fichiers modifiés.

---

## Run 2026-06-07 — commit a44a710

**Scan date:** 2026-06-07  
**Commit SHA:** a44a7102c077ac691ee33a8b107d6277565262f4

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1, B2 : **RESOLVED**
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED**
- C1 (GameHeader god-component) : **RESOLVED**
- D2 (headerHelpers tests) : **RESOLVED**
- F1 (UUID toast) : **RESOLVED**
- F4 (drawCaptureMarker all entities) : **RESOLVED**
- G1 (computeProgress duplication) : **RESOLVED**
- F3 / G2 (formatTime tests) : **RESOLVED**
- H1 (armyTraining refetchInterval) : **RESOLVED**
- H2 (BuildingDetailModal polling useEffect) : **RESOLVED**
- I1 (joinErrorMessage tests) : **RESOLVED** (ce run)
- I5 (ctaFor joined+LOCKED test) : **RESOLVED** (ce run)
- C2 (SpecializedBuildingDetailModal 643 LOC) : STILL OPEN — organisé, faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — 30 lignes plates
- D3 (VillageView inline `<style>` block) : STILL OPEN — cosmétique
- D4 (magic number 60_000 optimistic) : STILL OPEN — acceptable
- F2 (DailyRetentionWidget expiresInValue hardcoded) : STILL OPEN — serveur n'expose pas le reset time

### Mental model

Frontend propre et discipliné. Vérifié cette passe (commits depuis run 2026-06-06) :
- **Server-authoritative** : 0 violation. Aucun nouveau calcul local autoritatif.
- **Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `@ts-expect-error`, 0 `fetch`/`axios` hors `src/api/`.
- **Stores Zustand** : inchangés, teardown centralisé confirmé.
- **Pixi scenes** : `WorldMapScene.ts` inchangé, ticker correct.
- **TanStack Query** : `queries.ts` patterns cohérents. `reinforcementReportQuery` + `reinforcementReportsQuery` ajoutées avec `staleTime` conformes aux patterns existants (60_000 / 10_000).
- **ArmyScreen WS-drop cascade** : useEffect correct — guard `(prev.len > 0 || prev.completedTotal > 0)` protège contre le spurious trigger au mount.

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| I1 | Test gap | `features/worlds/useWorldCardModels.ts:77-87` | `joinErrorMessage` — 4 branches (ApiError+match, ApiError+pas de match, ApiError+message vide, non-ApiError), 0 test direct | Low | S | **RESOLVED** (ce run) |
| I5 | Test gap | `features/worlds/worldsViewModel.ts:152-156` | `ctaFor` joined+LOCKED non testé — quand un monde se ferme avec des joueurs déjà inscrits, le CTA doit rester "Entrer" pas "Inscriptions closes" | Low | S | **RESOLVED** (ce run) |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `ArmyScreen` WS-drop cascade `['power', 'kingdom', userId]` raw key | ✅ prefix-match intentionnel — même pattern que `invalidatePowerQueries` dans ws-bindings |
| Garde défensive `if (world.isJoined)` dans `onJoin` de `WorldSelector`/`WorldDetailScreen` | ✅ mort en routing normal (design system route `joined→onEnter`), mais inoffensif |
| `useDeleteReinforcementReportMutation` n'invalide pas le cache du rapport individuel | ✅ cohérent avec delete patterns combat/scout ; composant appelle `onClose()` après delete |
| `ReinforcementReportModal.tsx` 315 LOC | ✅ purement présentationnel, organisé par section, cohérent avec design-system modals existantes |
| `expiresInValue="04h00"` dans `DailyRetentionWidget.tsx:295` | ✅ `RetentionSummaryDto` n'expose pas le reset time — F2 bloqué côté serveur |
| `onEnter`/`onJoin` dupliqués entre `WorldSelector` et `WorldDetailScreen` | ✅ contextes de navigation distincts ; abstraction sans valeur pour 2 écrans |

### Selected theme: **I1 + I5 — Test coverage: `joinErrorMessage` + `ctaFor` joined+LOCKED**

**Rationale :**
- `joinErrorMessage` est la seule traduction d'erreur pour les world joins (2 callers production). 4 branches dont le fallback sur message vide — une régression exposerait les messages internes backend.
- `ctaFor` joined+LOCKED est un cas gameplay réel (inscriptions ferment pendant une partie active). La suite ne testait que joined+OPEN et joined+PLANNED.
- Les deux sont des fonctions pures sans mock nécessaire — filet chirurgical.

**Rejected :**
- C2/C3 : churn sans impact comportemental.
- D3/D4/F2 : cosmétiques ou bloqués backend.

### Verification

```text
yarn static-check   → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn test:pixi      → 62 test files, 348 tests passed (+1 useWorldCardModels.test.ts, +6 tests)
yarn test:backend   → 25 suites, 272 tests passed
```

**Diff :** `useWorldCardModels.test.ts` +33 LOC (nouveau, 5 tests), `worldsViewModel.test.ts` +15 LOC (+1 test). Net : +48 LOC.

---

---

## Run 2026-06-08 — commit fa7e29f

**Scan date:** 2026-06-08
**Commit SHA:** fa7e29fa9c6065455164577c1e9de4bbbf5f8ea1

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1, B2 : **RESOLVED**
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED**
- C1 (GameHeader god-component) : **RESOLVED**
- D2 (headerHelpers tests) : **RESOLVED**
- F1 (UUID toast) : **RESOLVED**
- F4 (drawCaptureMarker all entities) : **RESOLVED**
- G1 (computeProgress duplication) : **RESOLVED**
- F3 / G2 (formatTime tests) : **RESOLVED**
- H1 (armyTraining refetchInterval) : **RESOLVED**
- H2 (BuildingDetailModal polling useEffect) : **RESOLVED**
- I1 (joinErrorMessage tests) : **RESOLVED**
- I5 (ctaFor joined+LOCKED test) : **RESOLVED**
- **D3 (VillageView inline `<style>` block) : RESOLVED (ce run)**
- C2 (SpecializedBuildingDetailModal 962 LOC) : STILL OPEN — organisé, faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — 30 lignes plates
- D4 (magic number 60_000 optimistic) : STILL OPEN — acceptable
- F2 (DailyRetentionWidget expiresInValue hardcoded) : STILL OPEN — serveur n'expose pas le reset time

### Mental model

Frontend propre et discipliné. Vérifié cette passe (commits depuis run 2026-06-07) :
- **Server-authoritative** : 0 violation. Les nouvelles features (capture reports, power sheet, focus navigation, royal duty par niveau) n'introduisent aucun calcul autoritatif local.
- **Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `@ts-expect-error`, 0 `fetch`/`axios` hors `src/api/`.
- **Stores Zustand** : inchangés, teardown centralisé confirmé. `worldMapStore.clear()` inclut `pendingFocus`.
- **Pixi scenes** : `WorldMapScene.ts` inchangé, ticker correct.
- **TanStack Query** : `useEnterWorldMutation` (nouveau) invalide `['memberships']` — correct (enter ne crée pas de village).
- **Focus navigation** : mécanisme `pendingFocus` + URL params cohérent ; `WorldMapScreen` nettoie les deux en réponse à `activeFocus`.

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| D3 | Component design | `features/game/VillageView.tsx:477-549` | 72 LOC de CSS inline (`<style>` block) — 4 keyframes + 7 classes + media query. Couplage implicite avec `VillageViewSections.tsx` (`.village-resource-*`, `.bftc-noscroll` définis dans VillageView mais consommés dans VillageViewSections). | **Medium** | S | **RESOLVED** (ce run) |
| J1 | Naming | `features/world/worldMapNavigation.ts:14-16` | `normalizeFocusValue` dead ternary — les deux branches retournent `value.toString()`. | Low | S | NOTED |
| J2 | Type debt | `api/queries.ts` (`CombatReportDto.details`) | `occupationDefense?: unknown` — truthiness-only check, `unknown` techniquement correct. | Low | S | NOTED |
| J3 | Test gap | `features/power/PowerBottomSheet.tsx:20-26` | `villageTierFromPower` pure, seuils hardcodés (300/800/1500/2500), zéro test. | Low | S | NOTED |
| J4 | Component design | `features/combat/ReportDetailModal.tsx:100,193,299` | Backdrop wrapper verbatim 3× dans les 3 sub-composants. | Low | S | NOTED |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `ReportCard.tsx` calcs inline (`attackerLosses`, `defenderLosses`, `totalLoot`) | ✅ 3 triviales additions, display-only, clairement correctes |
| `DailyRetentionWidget` `createPortal` | ✅ pattern React standard pour stacking context |
| `worldMapNavigation.ts` `setPendingFocus` + URL params simultanés | ✅ belt-and-suspenders : URL survit cross-page, `pendingFocus` couvre si déjà sur `/game/world` |
| `worldMapStore.clear()` sur unmount WorldMapScreen | ✅ inclut `pendingFocus: null` — confirmé `worldMap.ts:44` |
| `useEnterWorldMutation` invalide uniquement `['memberships']` | ✅ enter ne crée pas de village |
| `PowerBottomSheet.tsx` `numberFormatter` local | ✅ composant UI auto-contenu |
| `bftc-noscroll` utilisé dans `VillageViewSections.tsx` | ✅ résolu par D3 — maintenant dans `index.css` |

### Selected theme: **D3 — Extract VillageView inline `<style>` block to `index.css`**

**Rationale :**
- D3 différé depuis run 2026-06-03 (4 runs) — pattern non standard qui résiste à la maintenance automatisée. C'est le bon moment de l'éliminer.
- Le `<style>` inline empêche toute analyse statique CSS (Tailwind, IDE, purging). Les keyframes et classes sont invisibles des outils de refactoring.
- Couplage implicite identifié : `VillageViewSections.tsx` utilise `.village-resource-fill-enter`, `.village-resource-value-enter` et `.bftc-noscroll` sans les définir — ils existent uniquement grâce au `<style>` de VillageView. Rendre la dépendance explicite dans `index.css` améliore la maintenabilité.
- Scope S : 2 fichiers, migration mécanique, aucun changement comportemental.

**Implementation :**
- `index.css` : ajout des 4 keyframes (`villageAssetEnter`, `villageInfoEnter`, `villageResourceFillEnter`, `villageResourceValueEnter`), 7 classes, 1 `@media (prefers-reduced-motion)` block, 2 sélecteurs `.bftc-noscroll`.
- `VillageView.tsx` : suppression du `<style>` block + Fragment wrapper (`<>` / `</>`). Return simplifié vers la `<div>` directement. −78 LOC.

**Rejected :**
- J1 (normalizeFocusValue dead ternary) : low, trivial, `bftc-maint-debt`.
- J3 (villageTierFromPower test) : low, display-only, `bftc-maint-debt`.
- J4 (ReportDetailModal backdrop × 3) : low, même fichier, `bftc-maint-debt`.
- C2, C3 : churn sans bénéfice fonctionnel.

### Verification

```text
yarn static-check   → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn test:pixi      → 66 test files, 363 tests passed (aucun test cassé)
```

**Diff :** `VillageView.tsx` −78 LOC (style block + Fragment), `index.css` +111 LOC (keyframes + classes). Net : −78 / +111 dans les fichiers modifiés.

---

## Run 2026-06-09 — commit 42d136a

**Scan date:** 2026-06-09
**Commit SHA:** 42d136a5b574ab6466596d634d8118f79535067e

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1, B2 : **RESOLVED**
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED**
- C1 (GameHeader god-component) : **RESOLVED**
- D2 (headerHelpers tests) : **RESOLVED**
- D3 (VillageView inline `<style>` block) : **RESOLVED** — run 2026-06-08
- F1, F4 (capture event correctness & Pixi tick) : **RESOLVED**
- G1, G2 (computeProgress duplication / formatTime tests) : **RESOLVED**
- H1, H2 (armyTraining refetchInterval / BuildingDetailModal polling) : **RESOLVED**
- I1 (joinErrorMessage tests) : **RESOLVED** — run 2026-06-07 (+ `enterErrorMessage` ajouté dans même PR)
- I5 (ctaFor joined+LOCKED test) : **RESOLVED** — run 2026-06-07
- J1 (normalizeFocusValue dead ternary) : **SELECTED** (ce run)
- J2 (minTargetTier task label test gap) : **SELECTED** (ce run)
- J3 (villageTierFromPower test) : NOTED — candidat `bftc-maint-debt`
- J4 (ReportDetailModal backdrop × 3) : NOTED — candidat `bftc-maint-debt`
- C2 (SpecializedBuildingDetailModal 643 LOC) : STILL OPEN — organisé, faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — 30 lignes plates
- D4 (magic number 60_000 optimistic) : STILL OPEN — acceptable
- F2 (DailyRetentionWidget expiresInValue hardcoded) : STILL OPEN — bloqué côté serveur (RetentionSummaryDto n'expose pas le reset time)

### Mental model

Frontend propre et discipliné. Commits depuis run 2026-06-07 :
- `run(048)/d0d9685` : `worldMapNavigation.ts` (nouveau) + `WorldMapScreen` focus URL, `VictoryModalHost` map link — navigation propre, store `worldMap.pendingFocus` correctement utilisé.
- `dc12d42` : `feat(retention): scale royal duty by player level` — `mapTask` conditionnel `minTargetTier`, DTOs `@shared/retention` mis à jour.
- `c80b05e` : `feat(combat): add capture reports` — `combatReportView.ts` enrichi (`recipientRole`, `captureFinalized`), tests étendus.
- `f788610` : `fix(combat): snapshot report village labels` — `CombatReportDto` enrichi (snapshot villageNames), `combatReportView.ts` adapté, tests mis à jour.
- `504db2e` / `dbe90c3` : UI power + séparation enter/join avec `useEnterWorldMutation` + `enterErrorMessage` (déjà couvert dans `useWorldCardModels.test.ts` ligne 41–66).

**Server-authoritative** : 0 violation. Aucun calcul local autoritatif introduit.
**Type debt** : 0 `as any`, 0 `@ts-ignore`. `enterErrorMessage` typé, `CombatReportDto.recipientRole` union strict.
**Stores Zustand** : inchangés, teardown centralisé confirmé.
**Pixi scenes** : `WorldMapScene.ts` inchangé, ticker correct.
**TanStack Query** : `useEnterWorldMutation` sans `['villages']` → ✅ `setContext({ worldId })` suffit (nouvelle clé de query déclenche le re-fetch automatiquement).

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| J1 | Naming / readability | `features/world/worldMapNavigation.ts:14-17` | `normalizeFocusValue` : ternaire mort — `Number.isInteger(v) ? v.toString() : v.toString()`, les deux branches identiques. Trompe le lecteur en laissant croire que les deux cas sont traités différemment. | Low | S | **RESOLVED** (ce run) |
| J2 | Test gap | `features/retention/DailyRetentionWidget.test.tsx` | `mapTask` branch `minTargetTier` (ajouté dans dc12d42) sans test direct : les tâches de pillage barbares à tier spécifique doivent afficher `task.label` (fourni par le serveur) plutôt que `taskLabelOverride`. | Low | S | **RESOLVED** (ce run) |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `useEnterWorldMutation` sans invalidation `['villages']` | ✅ `setContext({ worldId })` change la clé `useMyVillagesQuery(worldId)` → TanStack re-fetche automatiquement |
| `invalidateCombatReports` ne couvre pas `reinforcement-reports` | ✅ domaines distincts — `reinforcement-reports` invalidé uniquement sur `reinforcement.returned` / `garrison.added` |
| `invalidateReinforcementReports` raw key `['combat', 'reinforcement-reports', userId]` | ✅ prefix-match intentionnel (cross-worldId) — même pattern que `invalidateCombatReports` |
| `buildWorldMapFocusSearch` passe des entiers pour x/y | ✅ coordonnées de tiles sont toujours des entiers dans ce jeu — `String(n)` suffit |
| `DailyRetentionWidget.tsx:301` `expiresInValue="04h00"` | ✅ `RetentionSummaryDto` n'expose pas le reset time — F2 bloqué côté serveur |

### Selected theme: **J1 + J2 — Dead ternary cleanup + filet de régression `minTargetTier`**

**Rationale :**
- J1 élimine un ternaire trompeur introduit dans `d0d9685`. Le lecteur voit `Number.isInteger ? ... : ...` et s'attend à un traitement différent selon le cas. Simplification en `String(value)` — comportement identique, intention lisible. Scope : 1 LOC.
- J2 couvre la branche `minTargetTier` de `mapTask` introduite dans `dc12d42` sans filet de régression. Une régression (ex : swap de condition) afficherait la mauvaise étiquette pour les tâches de pillage à tier (`"Vaincre un village barbare"` au lieu du label serveur précis). Test S : 1 render, 2 assertions.
- Thème cohérent (code récent ajouté sans nettoyage minutieux), scope total S, zéro changement backend.

**Rejected :**
- C2/C3 : faible gain comportemental, churn mécanique.
- D4/F2 : cosmétiques ou bloqués côté serveur.

### Verification

```text
yarn static-check   → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn test:pixi      → 66 test files, 364 tests passed (+1 DailyRetentionWidget.test.tsx)
```

**Diff :** `worldMapNavigation.ts` −2 LOC (ternaire → `String(value)`), `DailyRetentionWidget.test.tsx` +37 LOC (+1 test). Net : −2 / +37 dans les fichiers modifiés.

---

## Run 2026-06-10 — commit 9b7c2dc

**Scan date:** 2026-06-10
**Commit SHA:** 9b7c2dc69560ec504a8ed5631cb9378c49c5cac1

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1, B2 : **RESOLVED**
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED**
- C1 (GameHeader god-component) : **RESOLVED**
- D2 (headerHelpers tests) : **RESOLVED**
- D3 (VillageView inline `<style>` block) : **RESOLVED**
- F1, F4 (capture event correctness & Pixi tick) : **RESOLVED**
- G1, G2 (computeProgress duplication / formatTime tests) : **RESOLVED**
- H1, H2 (armyTraining refetchInterval / BuildingDetailModal polling) : **RESOLVED**
- I1, I5 (world join/enter error tests) : **RESOLVED**
- J1, J2 (dead ternary / minTargetTier test) : **RESOLVED**
- J3 (villageTierFromPower test) : NOTED — `PowerBottomSheet.test.tsx` existe (render test via mock) mais n'exerce pas la fonction directement ; candidat `bftc-maint-debt`
- J4 (ReportDetailModal backdrop × 3) : NOTED — candidat `bftc-maint-debt`
- C2 (SpecializedBuildingDetailModal 643 LOC) : STILL OPEN — organisé, faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — 30 lignes plates
- D4 (magic number 60_000 optimistic) : STILL OPEN — acceptable
- F2 (DailyRetentionWidget expiresInValue hardcoded) : STILL OPEN — bloqué côté serveur

### Mental model

Frontend propre et discipliné. Commit majeur depuis run 2026-06-09 :
- `9b7c2dc` (run 050) : feature `resource caravans` — `CaravanLaunchModal.tsx` (369 LOC), `caravanLaunchState.ts` (pure view-model), `caravanLaunchState.test.ts` (6 tests), WS handlers (`applyCaravanSent`, `applyCaravanArrived`, `applyCaravanRecalled`, `applyCaravanReturned`), ws-bindings tests (+185 LOC), `useInitiateCaravanMutation` dans `queries.ts`.

**Server-authoritative** : 0 violation. `CaravanLaunchModal` calcule `activeCaravanResources` / `caravanCapacity` / `travelMs` display-only depuis données TanStack Query (serveur). Aucun calcul autoritatif local.
**Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `@ts-expect-error`. `CARAVAN_SPEED` / `CARRY_PER_PORTER` / `getCaravanResourceCapacity` importés depuis `@battleforthecrown/shared`.
**Stores Zustand** : inchangés, teardown centralisé confirmé.
**Pixi scenes** : `ExpeditionVisual.ts` — `CARAVAN_GLYPH` + couleur or (`0xd4a017`) correctement intégrés, aucune lecture de store dans ticker.
**TanStack Query** : `useInitiateCaravanMutation` invalide `resources`, `population`, `activeExpeditions`, `openExpeditions` — correct. `useRecallExpeditionMutation` ne couvrait pas ces deux keys : voir K1.

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| K1 | TanStack Query | `api/queries.ts:1053` | `useRecallExpeditionMutation.onSettled` n'invalide pas `resources` ni `population`. Pour un rappel de caravane en cas de drop WS : porteurs libérés (population) et ressources retournées à l'origine ne se rafraîchissent pas. Comparer : `applyCaravanRecalled` invalide correctement les deux ; `useInitiateCaravanMutation.onSettled` invalide aussi les deux. | **Medium** | S | **SELECTED** (ce run) |
| K2 | DRY | `features/world/CaravanLaunchModal.tsx:37` / `features/world/caravanLaunchState.ts:4` | `RESOURCE_KEYS = ["wood", "stone", "iron"] as const` défini deux fois. `caravanLaunchState.ts` (source logique) devrait exporter la constante ; `CaravanLaunchModal.tsx` l'importe. | Low | S | **SELECTED** (ce run) |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `activeCaravanResources` filtre uniquement `EN_ROUTE` | ✅ display-only — le backend applique le cap côté serveur ; le frontend est une aide UX non autoritative |
| `CaravanLaunchModal` sans optimistic UI | ✅ allocation population + ressources avec guards multiples — rollback non trivial |
| `getCaravanResourceCapacity(getWarehouseStorageLimit(warehouseLevel))` dans le composant | ✅ fonctions pures shared, display-only, résultat stable tant que `warehouseLevel` ne change pas |
| `TempoService.applyDuration(calculateTravelTime(...))` dans `CaravanLaunchModal` | ✅ `travelMs` display-only, `worldConfig.data?.tempo` vient du serveur |
| `recallLabel: kind !== 'REINFORCE' && EN_ROUTE` couvre `CARAVAN` | ✅ caravanes rappelables — logique correcte |
| `applyCaravanArrived` invalide `resources(targetVillageId)` mais pas `population(villageId)` | ✅ porteurs restent mobilisés jusqu'au retour physique (`applyCaravanReturned` invalide `population`) |
| `useInitiateCaravanMutation.onSettled` invalide `resources(targetVillageId)` au send | ✅ inoffensif pour multi-village (même joueur, 2 villages) ; le serveur est authoritative |

### Selected theme: **K1 + K2 — caravan query layer : fix WS-drop recall gap + DRY RESOURCE_KEYS**

**Rationale :**
- K1 est un gap de correctness : rappeler une caravane (via `useRecallExpeditionMutation`) en cas de drop WS laisse `resources` et `population` stales. `useInitiateCaravanMutation.onSettled` invalide déjà les deux ; l'ajout dans `useRecallExpeditionMutation.onSettled` est conservatif (pour les rappels d'armées non-caravane, les queries sont no-op = inoffensif).
- K2 consolide les deux définitions identiques de `RESOURCE_KEYS` — une divergence future (ajout d'une ressource) devrait être faite en 1 lieu.
- Thème cohérent (domaine caravane, couche query), scope S, 0 changement backend.

**Implementation :**
- `api/queries.ts` : ajout `queryKeys.resources(villageId)` + `queryKeys.population(villageId)` dans `useRecallExpeditionMutation.onSettled`.
- `caravanLaunchState.ts` : `const RESOURCE_KEYS` → `export const RESOURCE_KEYS`.
- `CaravanLaunchModal.tsx` : import `RESOURCE_KEYS` depuis `caravanLaunchState`, suppression de la déclaration locale.

**Rejected :**
- K3 (premature `resources(targetVillageId)` invalidation on send) : inoffensif, aucun bénéfice comportemental à supprimer.
- C2/C3 : churn sans impact comportemental.
- D4/F2 : cosmétiques ou bloqués côté serveur.

### Verification

```text
yarn static-check   → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn test:pixi      → 67 test files, 378 tests passed (aucun test cassé)
```

**Diff :** `queries.ts` +2 LOC (2 invalidations ajoutées), `caravanLaunchState.ts` +1 mot-clé (`export`), `CaravanLaunchModal.tsx` −1 LOC (déclaration locale supprimée). Net : +1 LOC dans les fichiers modifiés.

---

## Run 2026-06-11 — commit 16f51b3

**Scan date:** 2026-06-11
**Commit SHA:** 16f51b3dad2abb903ee107085e83f35e5bfff200

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1, B2 : **RESOLVED**
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED**
- C1 (GameHeader god-component) : **RESOLVED**
- D2 (headerHelpers tests) : **RESOLVED**
- D3 (VillageView inline `<style>` block) : **RESOLVED**
- F1, F4 (capture event correctness & Pixi tick) : **RESOLVED**
- G1, G2 (computeProgress duplication / formatTime tests) : **RESOLVED**
- H1, H2 (armyTraining refetchInterval / BuildingDetailModal polling) : **RESOLVED**
- I1, I5 (world join/enter error tests) : **RESOLVED**
- J1, J2 (dead ternary / minTargetTier test) : **RESOLVED**
- K1, K2 (caravan recall WS-drop gap / RESOURCE_KEYS DRY) : **RESOLVED**
- **L3 (OnboardingFab inline `<style>` block) : RESOLVED (ce run)**
- **L5 (useRankingsSummaryQuery no refetchInterval) : RESOLVED (ce run)**
- C2 (SpecializedBuildingDetailModal 643 LOC) : STILL OPEN — organisé, faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — 30 lignes plates
- D4 (magic number 60_000 optimistic) : STILL OPEN — acceptable
- F2 (DailyRetentionWidget expiresInValue hardcoded) : STILL OPEN — bloqué côté serveur
- J3 (villageTierFromPower test) : NOTED — candidat `bftc-maint-debt`
- J4 → L4 (ReportDetailModal backdrop ×4) : NOTED — candidat `bftc-maint-debt`

### Mental model

Frontend propre et discipliné. Commits depuis run 2026-06-10 :
- `16f51b3` (run 052) : feature `caravan reports` — `caravanReportView.ts` (175 LOC pur), `ReportDetailModal.tsx` (+216 LOC, 4 sub-composants), `caravanReportView.test.ts` (119 LOC, 6 tests), WS-bindings tests (+12 LOC).
- `39a93fc` (run 051) : feature `glory rankings` — `RankingsScreen.tsx` (228 LOC), `rankingsFormat.ts` (9 LOC), `RankingsScreen.test.tsx` (16 LOC).
- `78051a7` : fix `OnboardingFab` — drag interaction complète (579 LOC), `OnboardingFab.test.tsx` (+62 LOC).

**Server-authoritative** : 0 violation. Rankings display-only, caravan reports display-only depuis DTO serveur.  
**Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `fetch`/`axios` hors `src/api/`.  
**Stores Zustand** : inchangés, teardown centralisé confirmé.  
**TanStack Query** : `useRankingsSummaryQuery` manquait `refetchInterval` (L5, corrigé ce run).

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| L3 | Component design | `OnboardingFab.tsx:533-577` | Bloc `<style>` inline — 2 keyframes + `@media` block référençant `--bftc-onboarding-drag-x/y`. Régression directe de D3 résolu run 2026-06-08. CSS custom properties résolues au niveau de l'élément → keyframes déplaçables dans `index.css`. | Medium | S | **RESOLVED** (ce run) |
| L5 | TanStack Query | `api/queries.ts:571-583` | `useRankingsSummaryQuery` sans `refetchInterval`. `applyRankingsChanged` ne couvre que les glory writes ; si WS drop, le leaderboard reste stale. Parallèle de H1 (armyTraining, run 2026-06-06). | Medium | S | **RESOLVED** (ce run) |
| L1 | Dead code | `features/rankings/rankingsFormat.ts:5-9` | `periodLabel` exporté + testé mais jamais importé en production. `RankingsScreen.tsx:179` redéfinit une `const periodLabel` locale avec des strings UI différentes ("7 derniers jours" ≠ "Hebdomadaire"). | Low | S | STILL OPEN |
| L4 | Component design | `features/combat/ReportDetailModal.tsx` | Backdrop div verbatim ×4 (Scout, Caravan, Reinforcement, Combat). Était J4 (×3), caravane ajoute le 4e. | Low | S | NOTED — candidat `bftc-maint-debt` |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `applyCaravanRecalled` n'appelle pas `invalidateCaravanReports` | ✅ Reports créés sur `arrived`/`returned` uniquement — correct |
| `['combat', 'caravan-report']` prefix match large dans `invalidateCaravanReports` | ✅ Invalide tous les détails cachés sur nouvelle arrivée — intentionnel (analogue combat) |
| `NUMBER_FORMATTER` défini dans 3 fichiers (`caravanReportView`, `ReportDetailModal`, `ReportsList`) | ✅ Module-level const standard React — pas de couplage |
| `formatDate` dans 2 fichiers (ReportsList / ReportCard) avec options légèrement différentes | ✅ ReportCard affiche heure+minute dans les dates passées ; ReportsList affiche seulement jour/mois — variation intentionnelle |
| `RankingsScreen` `useRankingsSummaryQuery` sans `refetchInterval` (partiellement mitigé par `invalidatePowerQueries`) | ⚠️ Ne couvre pas glory-only changes ni WS drop → **traité par L5** |
| `OnboardingFab` `<style>` block avec CSS custom properties dynamiques | ⚠️ Custom properties résolues au niveau élément par spec → même pattern que D3 → **traité par L3** |

### Selected theme: **L3 + L5 — OnboardingFab style migration + rankings `refetchInterval`**

**Rationale :**
- L3 est une régression directe de D3 (run 2026-06-08, 3 jours) : les keyframes `bftcOnboardingSelectPulse`/`bftcOnboardingAdvancePulse` utilisent le même pattern CSS-custom-property que les keyframes VillageView migrées dans ce run. Avoir 1 `<style>` inline dans le codebase signale que c'est acceptable — nous venons de confirmer que ce n'est pas le cas.
- L5 ferme un gap de correctness identique à H1 (`armyTraining` run 2026-06-06) : le leaderboard peut rester stale si WS drop pendant la session. L'ajout `refetchInterval: 30_000` correspond au `staleTime: 30_000` existant.
- Thème cohérent (qualité des features nouvelles), scope total S, 0 changement backend.

**Rejected :**
- L1 (`periodLabel` dead export) : décision produit sur les labels ("7 derniers jours" vs "Hebdomadaire"), hors scope refactoring.
- L4 (ReportDetailModal backdrop ×4) : cosmétique, candidat `bftc-maint-debt`.

### Verification

```text
yarn static-check   → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn test:pixi      → 69 test files, 389 tests passed (aucun test cassé)
```

**Diff :** `queries.ts` +5 LOC (`refetchInterval` + commentaire), `OnboardingFab.tsx` −47 LOC (style block supprimé), `index.css` +52 LOC (keyframes + media). Net : −47 / +57 dans les fichiers modifiés.

---

## Run 2026-06-12 — commit d8b2fee

**Scan date:** 2026-06-12  
**Commit SHA:** d8b2fee7e0ac2fef7e459091a8b29e3239b4c42d

### Prior findings update

- A1–A6 (ws-bindings query keys) : **RESOLVED**
- B1, B2 : **RESOLVED**
- N1, N2 : **RESOLVED**
- S1, S2, S3 (session teardown) : **RESOLVED**
- C1 (GameHeader god-component) : **RESOLVED**
- D2 (headerHelpers tests) : **RESOLVED**
- D3 (VillageView inline `<style>` block) : **RESOLVED**
- F1, F4 (capture event correctness & Pixi tick) : **RESOLVED**
- G1, G2 (computeProgress duplication / formatTime tests) : **RESOLVED**
- H1, H2 (armyTraining refetchInterval / BuildingDetailModal polling) : **RESOLVED**
- I1, I5 (world join/enter error tests) : **RESOLVED**
- J1, J2 (dead ternary / minTargetTier test) : **RESOLVED**
- K1, K2 (caravan recall WS-drop gap / RESOURCE_KEYS DRY) : **RESOLVED**
- L3, L5 (OnboardingFab style / rankings refetchInterval) : **RESOLVED**
- **L1 (rankingsFormat `periodLabel` dead export) : SELECTED (ce run) → M1**
- L4 (ReportDetailModal backdrop ×4) : STILL OPEN — candidat `bftc-maint-debt`
- C2 (SpecializedBuildingDetailModal 643 LOC) : STILL OPEN — organisé, faible risque
- C3 (ArmyScreen garrison derivations) : STILL OPEN — 30 lignes plates
- D4 (magic number 60_000) : STILL OPEN — acceptable
- F2 (DailyRetentionWidget expiresInValue hardcoded) : STILL OPEN — bloqué côté serveur
- J3 (villageTierFromPower test) : NOTED — candidat `bftc-maint-debt`

### Mental model

Frontend propre et discipliné. Commits depuis run 2026-06-11 :
- `2dedff0` : `maint(refactor-pixi)` run 2026-06-11 (OnboardingFab style + rankings refetchInterval) — PR #76 mergée.
- `8332545` (run 053) : `User.displayName` global, `mapEntityLabels.ts` (pure, testée), `authSessionResponseSchema` Zod boundary, email retiré de `AuthUser`. `RegisterScreen` étendu, `SelectedEntityPanel` simplifié.
- `0b03b4f` (run 052) : `LostKingdomScreen` (joueur éliminé), `applyVillageConquered` étendu (clears `villageId` store), `WorldSessionGate.test.tsx` (5 tests).
- `11b4d1a` (fix #79) : `BottomSheet` unmount-on-close (retourne `null` quand fermé), hero pointer capture corrigé, `BottomSheet.test.tsx` ajouté.
- `d8b2fee` (maint debt #80) : `formatCompactNumber` centralisé dans `lib/resourceConfig.ts`, doublon `MultiVillageBottomSheet` supprimé.

**Server-authoritative** : 0 violation. Aucun calcul local autoritatif introduit.  
**Type debt** : 0 `as any`, 0 `@ts-ignore`, 0 `fetch`/`axios` hors `src/api/`.  
**Stores Zustand** : inchangés, teardown centralisé confirmé.  
**TanStack Query** : `useRankingsSummaryQuery` a son `refetchInterval: 30_000` (L5 fixé).  
**Pixi scenes** : `WorldMapScene.ts` inchangé, ticker correct.

### New findings

| ID | Category | Location | Description | Severity | Effort | Status |
|----|----------|----------|-------------|----------|--------|--------|
| M1 | Dead code / Test debt | `features/rankings/rankingsFormat.ts:5-9` + `RankingsScreen.test.tsx:11-15` | `periodLabel` export jamais importé en production. `RankingsScreen.tsx:179` redéfinit son propre `periodLabel` local avec des strings différentes (`"7 derniers jours"` vs `"Hebdomadaire"`). Le test en ligne 11-15 testait une fonction morte avec des strings qui ne correspondent pas à l'UI. | **Medium** | S | **RESOLVED** (ce run) |
| M2 | Test gap | `features/worlds/LostKingdomScreen.tsx:13-16` | `defaultVillageName(undefined)` → `'Royaume du joueur'`. Branche non testée via `WorldSessionGate.test.tsx` (tous les cas seedaient `displayName: 'Alice'`). | Low | S | **RESOLVED** (ce run) |

### "Looks bad but is actually fine" (this run)

| Pattern | Verdict |
|---------|---------|
| `LostKingdomScreen` importe `joinErrorMessage` depuis `useWorldCardModels` | ✅ fonction pure exportée, aucun hook invoqué — couplage de fichier sans couplage de hook |
| `applyVillageConquered` `setContext({ worldId, villageId: null })` sans redirect | ✅ `WorldSessionGate` réagit au `villageId → null` via re-render + `hasNoVillage` |
| `BottomSheet` unmount-on-close (`return null` quand `!isOpen`) | ✅ intentionnel — sheets BFTC stateless ou rechargent depuis TanStack Query |
| `WorldSessionGate` `hasNoVillage = isSuccess && !selectedVillage` | ✅ guard correct — ne se déclenche pas sur loading/error |
| `RankingsScreen.tsx:179` `const periodLabel` locale (vs `rankingsFormat.periodLabel` supprimé) | ✅ strings intentionnellement différentes — format court "7 derniers jours" vs "Hebdomadaire" |
| `RegisterScreen` : `useZodForm` + `useState` séparés | ✅ pattern établi (`LoginScreen` identique) |
| `ws-bindings.test.ts` couvrant `applyVillageConquered` + `previousOwnerId` | ✅ couverture correcte de la branche `villageId: null` |

### Selected theme: **M1 + M2 — Dead export `periodLabel` + test gap `defaultVillageName` fallback**

**Rationale :**
- M1 est un export mort dont le test diverge de la production (les strings ne correspondent pas). Maintenir ce test crée une fausse confiance et induit en erreur quiconque cherche d'où vient `"Hebdomadaire"` dans l'UI (réponse : nulle part). Suppression propre en 2 fichiers.
- M2 couvre la branche `displayName` absent de `defaultVillageName` — un utilisateur éliminé sans displayName obtiendrait `'Royaume du joueur'` comme nom de village. La branche était non couverte dans tous les cas de test existants qui seedaient toujours `displayName: 'Alice'`.
- Thème cohérent : nettoyage du test debt introduit par les features récentes (run-051 rankings, run-052 rejoin).

**Rejected :**
- C2/C3 : churn sans impact comportemental.
- D4/F2 : cosmétiques ou bloqués côté serveur.
- L4 (ReportDetailModal backdrop ×4) : candidat `bftc-maint-debt`.

### Verification

```text
yarn static-check   → green (tsc backend + pixi, ESLint backend + pixi --quiet)
yarn test:pixi      → 71 test files, 404 tests passed (net 0 : −1 periodLabel test, +1 defaultVillageName test)
```

**Diff :** `rankingsFormat.ts` −5 LOC (periodLabel supprimé), `RankingsScreen.test.tsx` −4 LOC (import + test morts), `WorldSessionGate.test.tsx` +20 LOC (+1 test `displayName` absent). Net : −9 / +20 dans les fichiers modifiés.
