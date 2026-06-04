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
