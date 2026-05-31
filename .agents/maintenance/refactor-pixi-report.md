# Code Quality Report — Pixi Frontend

Populated by `/bftc-code-quality-pixi`. Each run appends a dated entry.

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
