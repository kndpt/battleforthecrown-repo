# Code Quality Report — Pixi Frontend

Populated by `/bftc-refactor-pixi`. Each run appends a dated entry.

---

## Run 2026-05-30 — commit `f6e401f` (HEAD at scan)

### Prior findings
_No prior run — first pass._

---

### Orientation

45 262 lines across pixi/src. High-churn files last 3 months: `BuildingManagementPanel.tsx` (+949/-308), `ArmyScreen.tsx`, `WorldMapScene.ts`. Largest files:

| File | LOC |
|---|---|
| DesignSystemPreview.tsx | 3236 |
| ArmyViewDesign.tsx | 1593 |
| queries.ts | 1120 |
| AuthScreens.tsx | 1002 |
| ws-bindings.test.ts | 975 |
| BuildingManagementPanel.tsx | 962 |
| WorldMapScene.ts | 720 |
| ws-bindings.ts | 680 |
| KingdomActivitiesPanel.tsx | 662 |
| GameHeader.tsx | 538 |

Mental model: API layer (`src/api/`) → Zustand stores (`src/stores/`) → TanStack Query cache (`queries.ts`) → HUD components (`src/features/`) + Pixi scenes (`src/pixi/`). WS bindings bridge server events into both stores and TanStack cache in parallel — a known dual-write tension.

---

### Findings

#### A. Store lifecycle & logout

| ID | Category | Location | Description | Severity | Effort |
|---|---|---|---|---|---|
| A1 | Store lifecycle | `queries.ts:1110-1119` | `useLogout()` does not call `clear()` on `useResourcesStore`, `useCrownsStore`, `useExpeditionsStore`, `useWorldMapStore` after `clearSession()`/`clearGame()` | **Critical** | S |
| A2 | Store lifecycle | `queries.ts:1110-1119` | `useLogout()` does not reset `useUiStore` (toasts, victoryModals, openModal, openPanel) — stale modal overlays visible on re-login | High | S |
| A3 | Cache config | `queries.ts:253-254` | `useResourcesQuery` has `staleTime: 0` + `refetchOnMount: 'always'` — defeats cache; triggers a full refetch on every component mount even when WS keeps data fresh | High | S |

**STATUS: RESOLVED in this run.**

#### B. Store duplication (dual source of truth)

| ID | Category | Location | Description | Severity | Effort |
|---|---|---|---|---|---|
| B1 | Store duplication | `stores/resources.ts` / `queries.ts:243` | `useResourcesStore.byVillageId` duplicates `useResourcesQuery` cache. WS updates store directly (`ws-bindings.ts:68`); query layer async; potential momentary divergence | Critical | M |
| B2 | Store duplication | `stores/crowns.ts` / `queries.ts:309` | `useCrownsStore.byKey` duplicates `useCrownsQuery` cache — same dual-write pattern | Critical | M |
| B3 | Store mutation bypass | `queries.ts:859-872` | `useRecallExpeditionMutation.onSuccess` writes to `useExpeditionsStore.getState().update()` directly instead of relying on `onSettled` query invalidation | High | M |

**STATUS: OPEN — deferred to next run.**

#### C. TanStack Query patterns

| ID | Category | Location | Description | Severity | Effort |
|---|---|---|---|---|---|
| C1 | Cache invalidation | `queries.ts:108, 433` | Hardcoded query key arrays `['buildings', villageId]`, `['combat', 'reports', userId]` instead of `queryKeys.*` helpers | High | S |
| C2 | Optimistic rollback | `queries.ts:472-545` | `useTrainUnitsMutation` hardcodes 60s duration; `useCancelTrainingMutation` has no rollback | High | M |
| C3 | Missing gcTime | `queries.ts:1000-1016` | `worldEntities` query no `gcTime` | Medium | S |

**STATUS: OPEN.**

#### D. GameHeader component

| ID | Category | Location | Description | Severity | Effort |
|---|---|---|---|---|---|
| D1 | Over-fetching | `GameHeader.tsx:149-196` | 6 × `useQueries` × N villages → 6N HTTP requests on sheet open | Critical | L |
| D2 | God component | `GameHeader.tsx:1-537` | 538 LOC, 12 `useMemo`, 3 responsibilities, no tests | High | L |
| D3 | Memoization | `GameHeader.tsx:210-233` | `toResultMap()` called 6× per render | Medium | S |

**STATUS: OPEN.**

#### E. ArmyScreen

| ID | Category | Location | Description | Severity | Effort |
|---|---|---|---|---|---|
| E1 | God component | `ArmyScreen.tsx:229-571` | 571 LOC, 3+ responsibilities | High | L |
| E2 | Memoization | `armyViewModel.ts:103-183` | `buildArmyViewModel` not memoized — O(N) rebuild per render | High | M |
| E3 | Stale selection | `ArmyScreen.tsx:251-252` | garrison selection not validated against live query data | Medium | M |

**STATUS: OPEN.**

#### F. WorldMapScene

| ID | Category | Location | Description | Severity | Effort |
|---|---|---|---|---|---|
| F1 | Cleanup leak | `WorldMapScene.ts:564-573` | `exit()` does not remove viewport listeners | High | S |
| F2 | State desync | `WorldMapScene.ts:364-513` | `visuals Map` not reconciled with store on entity removal | High | M |
| F3 | Update loop | `WorldMapScene.ts:709` | `drawCaptureMarker()` called every frame, no dirty-check | Medium | M |
| F4 | Magic numbers | `WorldMapScene.ts:34-35` | `PLAYER_SPRITE_SIZE=72`, `SPRITE_SIZE=64` unreferenced | Low | S |

**STATUS: OPEN.**

#### G. ws-bindings

| ID | Category | Location | Description | Severity | Effort |
|---|---|---|---|---|---|
| G1 | Auth guard | `ws-bindings.ts:68,83,96...` | 47 `store.getState()` calls without post-logout guards | High | M |
| G2 | Timeout leak | `ws-bindings.ts:49-58` | `pendingTimeouts` not debounced per expeditionId on reconnect | High | M |
| G3 | Error swallow | `ws-bindings.ts:52-58` | async `fn` in `scheduleTimeout` not awaited, rejections lost | Medium | S |
| G4 | Key mismatch | `ws-bindings.ts:449-452` | `invalidatePowerQueries` missing `worldId` scope | Medium | M |

**STATUS: OPEN.**

#### H. Type safety & tests

| ID | Category | Location | Description | Severity | Effort |
|---|---|---|---|---|---|
| H1 | Untyped payloads | `ws-bindings.ts:64-621` | No Zod validation on WS event payloads at trust boundary | High | L |
| H2 | Missing tests | `queries.ts:1110-1119` | `useLogout()` store-clear contract untested | High | S |
| H3 | Missing tests | `ws-bindings.ts` | battle event sequences + timeout race untested | High | M |
| H4 | Missing tests | `GameHeader.tsx` | 538 LOC, 0 tests | Medium | L |

**STATUS: H2 RESOLVED in this run. H1, H3, H4 OPEN.**

---

### "Looks bad but is actually fine"

- **`useExpeditionsStore` written from both WS and mutations**: intentional — WS is the authoritative timeline; mutations write optimistically. Documented in conventions.
- **`staleTime` variance across queries**: intentional tuning per query frequency. The `staleTime:0` on resources was a bug (now fixed), not a pattern.
- **`DesignSystemPreview.tsx` 3236 LOC**: design system prototype, not production HUD. Out of scope.

---

### Selected theme: **State lifecycle hygiene (A1, A2, A3, H2)**

**Rationale:** Logout leaving stale resources/crowns/expeditions/toasts/modals in stores is a real bug — re-login to a different world briefly shows previous session state. `staleTime:0` compounds it: every component mount fires a fresh HTTP fetch even when WS keeps resources up-to-date. Both are S effort, surgical, fully testable, no backend changes.

**Rejected themes:**
- B1/B2 (store duplication): M effort, high regression risk; needs dedicated run.
- D1/D2 (GameHeader over-fetch): L effort; warrants its own run.
- G1 (WS auth guards): M effort, no known prod trigger.
- H1 (Zod validation): L effort; separate run.

---

### Verification

```
yarn workspace battleforthecrown-pixi test logout-lifecycle → 6/6 PASS
yarn static-check → PASS (tsc + eslint, backend + pixi)
```

### Files changed

- `battleforthecrown-pixi/src/api/queries.ts` — `useLogout` extended with 8 store clears, `staleTime` fixed on `useResourcesQuery`
- `battleforthecrown-pixi/src/stores/logout-lifecycle.test.ts` — NEW (6 regression tests)

### Docs impact

Aucun changement requis — `useLogout` est un détail d'implémentation interne.
