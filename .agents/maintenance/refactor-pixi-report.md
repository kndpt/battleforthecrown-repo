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

#### Theme A — Query key inconsistency in ws-bindings.ts (**SELECTED FOR PR**)

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| A1 | API layer | ws-bindings.ts:221 | `['army', payload.villageId]` ne correspond PAS à `queryKeys.armyInventory()` = `['army', 'inventory', villageId]` → inventaire armée non invalidé après `battle.returned` | **Critical** | S |
| A2 | API layer | ws-bindings.ts:275 | Même bug sur `applyScoutReturned` | **Critical** | S |
| A3 | API layer | ws-bindings.ts:314 | Même bug sur `applyExpeditionReturned` | **Critical** | S |
| A4 | API layer | ws-bindings.ts:417 | Même bug sur `applyVillageAttacked` (défenseur) | **Critical** | S |
| A5 | API layer | ws-bindings.ts:108–111 | Clés brutes `['buildings', ...]`, `['queue', ...]`, `['population', ...]`, `['resources', ...]` au lieu de `queryKeys.*` | Medium | S |
| A6 | API layer | ws-bindings.ts:199,201,220,315 | Même pattern sur d'autres handlers | Medium | S |

#### Theme B — queryFn dupliquées dans GameHeader et WorldSelector

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| B1 | TanStack Query | GameHeader.tsx:149–196 | 6 `useQueries` avec `apiClient.get` inline — duplique la logique de `queries.ts` | Medium | M |
| B2 | TanStack Query | WorldSelector.tsx:60–65 | Idem pour `publicKingdomPower` | Low | S |

#### Theme C — Component size

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| C1 | Component design | GameHeader.tsx (538 LOC) | Agrège 7+ queries, multi-village data, 3 sheets — > 2 responsabilités | Medium | L |
| C2 | Component design | BuildingManagementPanel.tsx (962 LOC) | Grand composant, mais logique encapsulée dans des sous-composants inline | Low | M |

---

### "Looks bad but is actually fine"

| Pattern | Verdict |
|---------|---------|
| `projectResources` dans `interpolation.ts` | ✅ display-only, pas autoritatif — conforme server-authoritative |
| `useEffect(() => setEntities(visibleEntities))` dans `WorldMapScreen` | ✅ sync délibérée TanStack → Zustand pour canvas Pixi hors React |
| `useEffect(() => markRead(...))` dans `ReportDetailModal` | ✅ fire-once sur ouverture |
| `getState()` dans ws-bindings | ✅ lecture impérative hors React — pattern correct |
| `['memberships']`, `['villages']`, `['world-entities']` clés larges | ✅ invalidation cross-world intentionnelle |
| `['combat', 'reports', userId]` clé partielle | ✅ prefix match intentionnel (tous worldId) |
| Stores sans reset implicite | ✅ `useLogout()` appelle `.clear()` sur chaque store |

---

### Selected theme: **Theme A — Inline query keys dans ws-bindings.ts**

**Rationale :** A1–A4 sont des bugs actifs : l'inventaire armée n'est jamais rafraîchi après retour d'expédition ou attaque reçue (sauf via le polling 5s sur `activeExpeditions`). L'utilisateur voit des effectifs obsolètes dans l'HUD. A5–A6 sont du debt cohérence qui masquait ces bugs. Fix dans un seul fichier, zero régression cross-workspace.

**Rejected :**
- Theme B : confort/DRY, pas de bug actif.
- Theme C : scope trop large pour un PR cohérent.

---

### Verification

Voir résultats dans le PR associé : `claude/bftc-refactor-pixi-ws-querykeys`.
