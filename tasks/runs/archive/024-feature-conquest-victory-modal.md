# Run #024 — feature-conquest-victory-modal

> **Statut** : DONE
> **Démarré** : 2026-05-14
> **Terminé** : 2026-05-14

## Cible

- **Phase roadmap** : Phase 5 (Conquête barbare) — feedback UX applicable aussi en Phase 7 (Conquête PvP), même event `village.conquered`.
- **Spec source** : [`docs/gameplay/13-barbarian-conquest.md`](../../docs/gameplay/13-barbarian-conquest.md), [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md).
- **Type** : feature
- **Modules backend** : `combat` (ConquestService), `event` (EventOutboxService) — selon piste retenue.
- **Modules frontend** : `pixi/ui` (nouveau modal celebrate), `pixi/stores` (slot modal global), `pixi/ws-bindings` (swap toast → modal).

## Contexte

L'event WS `village.conquered` est aujourd'hui notifié à l'attaquant via un simple **toast warning** `"Village conquis (x, y)"` (cf. `battleforthecrown-pixi/src/api/ws-bindings.ts:422-436`). C'est sous-dimensionné pour ce qui est un évènement majeur de gameplay (résultat d'un investissement Seigneur + fenêtre de capture tenue 4-18 h).

Le design-system propose un **modal celebrate "VICTOIRE"** (couronne + grand titre + CTA "Voir le rapport") dans [`battleforthecrown-design-system/project/preview/components-modals.html`](../../battleforthecrown-design-system/project/preview/components-modals.html) lignes 43-47, variant `modal success` avec le bloc `.celebrate`. C'est ce modal qu'on veut adopter pour matérialiser la conquête réussie côté attaquant.

**Payload disponible** (`VillageConqueredPayload` dans `packages/shared/src/events/types.ts:103-110`) :

```ts
{ villageId, newOwnerId, previousTier, x, y, buildingsKept }
```

→ pas de `villageName`. Le wording HTML d'origine ("pillé 2.400 ressources, capturé 12 prisonniers") provient d'un raid/combat et **ne s'applique pas** à la conquête. À ré-écrire pour le cas conquête (nom + position).

L'event n'est envoyé qu'à l'attaquant (`notifyUser(newOwnerId, …)` dans `event-outbox.service.ts:398-417`), donc le modal n'apparaîtra jamais côté défenseur. Le pendant "perte de village" côté défenseur est hors scope (pas d'event ni de spec MVP dédiée).

## Pistes de design (à trancher au refinement étape 3 du run)

- **Piste A — Enrichir le payload backend (recommandée)** : ajouter `villageName` (+ éventuellement `previousOwnerName`) à `VillageConqueredPayload`. Avantage : modal a tout ce qu'il faut au moment du WS, pas de race condition sur le cache TanStack Query (les invalidations `memberships`/`villages`/`world-entities` viennent juste de partir). Touche `packages/shared` + backend + front. Estimé : ~5-6 fichiers.
- **Piste B — Frontend seul, résolution via cache** : lookup `villageName` via `queryClient.getQueryData(['villages'])` ou `useWorldMapStore`. Risque : la query peut ne pas avoir refetch au moment du modal, fallback nécessaire. Estimé : ~3-4 fichiers.

## Dépendances

- Aucune dépendance bloquante.
- Connexe : `tasks/runs/023-migrate-runtime-toasts-design-system.md` — migration des `pushToast` runtime vers le design-system. Ce run **retire** un consumer (`village.conquered`) qui ne sera plus un toast mais un modal. À coordonner pour éviter le conflit (le toast existant disparaît, pas besoin de le migrer dans 023).
- Référence pattern migration design-system → React : `tasks/archive/48-kingdom-activities-design-system.md`, `tasks/archive/51-bottom-sheet-design-system-base.md`.

## Critère de fin (acceptance)

- [ ] Quand l'attaquant termine une conquête (barbare ou PvP), un modal "Victoire" plein écran apparaît côté HUD : bandeau vert success, couronne, titre VICTOIRE, description (nom du village conquis + position), CTA principal.
- [ ] Le toast warning actuel sur `village.conquered` est retiré (un seul feedback visuel, pas les deux).
- [ ] Le modal n'apparaît jamais côté défenseur (acquis par le backend — vérifier que rien ne fuit côté front via une query partagée).
- [ ] Le modal est fermable (overlay click, bouton ×, ou bouton CTA).
- [ ] Le CTA principal pointe vers une action cohérente (ouvrir l'inbox/rapport de conquête si disponible, sinon CTA neutre type "Continuer" — à trancher en clarification étape 1).
- [ ] Compatible barbare ET PvP : aucun branchement spécifique au `previousTier`, le même modal sert dans les deux cas.
- [ ] `/design-system` continue d'afficher le modal celebrate sans régression visuelle.
- [ ] Pas de double-affichage si plusieurs `village.conquered` arrivent rapprochés (singleton queue ou écrasement à arbitrer).
- [ ] `yarn static-check` vert, smokes/unit pertinents verts.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Points d'attention

- Wording : adapter le texte HTML d'origine (raid) au contexte conquête. Ne pas mentionner "ressources pillées" ni "prisonniers capturés" (faux pour la conquête — voir spec 13/14, le stock est reset à 0 et il n'y a pas de prisonniers en MVP).
- CTA "Voir le rapport" : vérifier si la conquête écrit déjà un rapport inbox (Phase 2 a livré le `CombatReport` du combat de pré-conquête, mais le rapport de conquête finale n'est peut-être pas encore livré). Si pas dispo, CTA neutre "Continuer".
- Singleton modal global : prévoir un slot dans `useUiStore` (ou équivalent) pour éviter de monter plusieurs modaux concurrents.
- Pas d'animation lourde au MVP — réutiliser le rendu CSS design-system tel quel, porté en composant React + Tailwind.
- Tests : composant React isolé en unit (rendu, props) + smoke léger sur le store UI. Pas de test orchestré ws→modal au MVP (cf. `bftc-tests-policy`).

## Décomposition initiale (rempli par le lead à l'étape 3)

### Décisions étape 1 (clarification)

- **Piste A** retenue : enrichir `VillageConqueredPayload` avec `villageName` (uniquement — pas `previousOwnerName`).
- **CTA principal** : "Voir le village" — recentre la carte mondiale sur le village conquis.
- **Concurrence** : queue séquentielle (FIFO). Plusieurs `village.conquered` rapprochés → modaux s'enchaînent, l'utilisateur ferme le 1er pour voir le 2e.

### Tâches chirurgicales

| # | Scope | Fichiers | Type |
|---|---|---|---|
| T1 | Enrichir `VillageConqueredPayload` avec `villageName` | `packages/shared/src/events/{types,schemas}.ts` + `conquest.service.ts:471` + `event-outbox.service.ts:398-417` (4 fichiers) | shared + backend |
| T2 | Slot `victoryModals` (queue FIFO) dans `useUiStore` | `battleforthecrown-pixi/src/stores/ui.ts` (1 fichier) | store |
| T3 | Composant `VictoryModal` porté du HTML design-system | `battleforthecrown-pixi/src/ui/modals/VictoryModal.tsx` (1 fichier nouveau) | UI |
| T4 | `VictoryModalHost` singleton au niveau `App.tsx` | `VictoryModalHost.tsx` nouveau + `App.tsx` (2 fichiers) | UI |
| T5 | Swap toast → `pushVictoryModal` dans `ws-bindings` | `ws-bindings.ts:422-436` (1 fichier, ~10 lignes) | wiring |
| T6 | Focus map post-conquête : slot `pendingFocus` + `useEffect` dans `WorldMapScreen` | `useWorldMapStore` + `WorldMapScreen.tsx` (2 fichiers) | UI navigation |
| T7 | Tests unit `applyVillageConquered` + store queue | `ws-bindings.test.ts` + test store (1-2 fichiers) | test |
| T8 | Preview section dans `/design-system` | `DesignSystemPreview.tsx` (1 fichier, ~20 lignes) | doc visuelle |

Total estimé : ~12-13 fichiers touchés sur 7 sous-tâches.

### Cartographie code (étape 2 — synthèse)

- `target.name` est dispo dans `conquest.service.ts` au moment du `createOutboxEvent` (confirmé ligne 481 par le log existant `Village ${target.name} conquered…`).
- `useUiStore` actuel : `toasts: Toast[]` + `openModalId: string | null`. Pattern toast = array avec auto-dismiss TTL. Le slot `victoryModals` réutilise le pattern array mais **sans auto-dismiss** (l'utilisateur doit fermer explicitement).
- Composant `Modal.tsx` (`src/ui/modals/Modal.tsx`) existe avec CVA variants (`default/warning/danger/info`). On peut soit ajouter un variant `success`, soit créer `VictoryModal` indépendant (rendu `.celebrate` très différent — pas de header, pas de bouton ×, centré). **Choix lead** : composant indépendant (réutilisation faible, pattern celebrate suffisamment distinct).
- HUD actuellement **décentralisé** : `ToastStack` est rendu par écran (`WorldMapScreen`, `VillageView`, `ArmyScreen`, `MessagesScreen`, `WorldLockedScreen`). Pour `VictoryModalHost`, on monte au niveau racine (`App.tsx`) pour garantir l'affichage quel que soit l'écran actif au moment du WS.
- `centerOn(worldX, worldY)` existe sur le handle `WorldMapScene` (ligne 712), déjà utilisé dans `WorldMapScreen:152`. CTA "Voir le village" → set `pendingFocus` dans le store + `useNavigate('/game/world')` ; `WorldMapScreen` consomme `pendingFocus` au mount.
- Aucun test n'existe pour `applyVillageConquered` (gap identifié — le run ajoute la couverture).

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Progress (rempli pendant le run)

- **T1** ✅ Payload `VillageConqueredPayload` enrichi avec `villageName` (types + schema Zod côté shared, propagation `conquest.service.ts:471` et `event-outbox.service.ts:398-417`). Rebuild shared OK.
- **T2** ✅ Slot `victoryModals: VictoryModalEntry[]` + méthodes `pushVictoryModal` / `dismissVictoryModal` / `clearVictoryModals` ajoutées à `useUiStore`. Queue FIFO sans auto-dismiss.
- **T3** ✅ Composant `VictoryModal.tsx` (`src/ui/modals/`) porté du HTML design-system : bandeau vert success, couronne (`/assets/casual-icons/crown.png`), titre VICTOIRE, description (`Vous avez conquis {villageName} ! ({x}, {y})`), CTA `Voir le village`.
- **T4** ✅ `VictoryModalHost.tsx` singleton monté dans `App.tsx` au niveau racine (dans `<BrowserRouter>` pour `useNavigate`). Lit `victoryModals[0]`, monte le modal avec `key={id}` pour reset entre entrées.
- **T5** ✅ `applyVillageConquered` (`ws-bindings.ts:422-436`) : `pushToast` remplacé par `pushVictoryModal`. Invalidations et `removeEntity` conservés.
- **T6** ✅ Slot `pendingFocus: PendingMapFocus | null` ajouté à `useWorldMapStore`. `WorldMapScreen` consomme via 2 effets : (1) seed initial du camera, (2) `centerOn` quand canvasRef prêt (relancé par `worldEntities.isLoading` / `myVillages.isLoading`). Race condition initiale identifiée en review et corrigée.
- **T7** ✅ `stores/ui.test.ts` (3 tests : FIFO, dismiss ciblé, clear) + un test `applyVillageConquered` ajouté à `ws-bindings.test.ts` (vérifie push modal + entité removed + pas de toast).
- **T8** ✅ Section "Victory Modal (runtime)" ajoutée dans `DesignSystemPreview.tsx` avec bouton "Ouvrir l'aperçu" (données factices `Cravia (42, 88)`).

## Décisions prises

- **Composant indépendant** plutôt qu'extension du `Modal.tsx` existant : le rendu celebrate (pas de header, bandeau vert au lieu de barre marron, pas de bouton ×, CTA seul centré) est suffisamment distinct pour ne pas tordre le composant base. Réutilisation = `Button variant="success"`.
- **HUD global à `App.tsx`** plutôt que par écran comme `ToastStack` : l'event `village.conquered` peut arriver alors que le joueur est sur n'importe quel écran (Village, Army, Messages, World Map). Un singleton global garantit l'affichage immédiat sans dépendre du screen actif.
- **Race condition camera/pendingFocus** : la première implémentation incluait `pendingFocus` dans les deps du useEffect d'init camera, ce qui pouvait écraser le centrage Pixi après `setPendingFocus(null)`. Corrigé en sortant `pendingFocus` des deps de l'effet 1 (utilisé seulement comme seed initial) et en faisant dépendre l'effet 2 de `worldEntities.isLoading` / `myVillages.isLoading` (signaux que le canvas est monté). `eslint-disable-next-line react-hooks/exhaustive-deps` commenté sur l'effet 1.
- **Pas de backprop SPEC** : le contrat "event WS inclut villageName" est un détail d'implémentation (tracé dans `packages/shared/src/events/` + tests), pas un invariant gameplay durable.
- **Documentation** : `docs/architecture/realtime.md` ligne 117 mise à jour pour inclure `villageName` dans le payload listé.

## Rapport final

### Synthèse

Run #024 livre le modal de victoire de conquête : event `village.conquered` enrichi côté backend avec `villageName`, store UI étendu avec une queue FIFO de modaux victoire, composant React `VictoryModal` porté du design-system, host singleton global, swap du toast warning historique vers le modal, focus map sur le village fraîchement conquis via le CTA "Voir le village". Tests unit ajoutés (store + handler ws). Documentation realtime synchronisée.

### Fichiers touchés

Backend / shared :
- `packages/shared/src/events/types.ts` — `+ villageName: string`
- `packages/shared/src/events/schemas.ts` — `+ villageName: z.string()`
- `battleforthecrown-backend/src/modules/combat/conquest.service.ts` — `+ villageName: target.name`
- `battleforthecrown-backend/src/modules/event/event-outbox.service.ts` — forward `villageName`

Frontend :
- `battleforthecrown-pixi/src/stores/ui.ts` — `+ victoryModals` + 3 méthodes
- `battleforthecrown-pixi/src/stores/worldMap.ts` — `+ pendingFocus` + `setPendingFocus`
- `battleforthecrown-pixi/src/ui/modals/VictoryModal.tsx` (nouveau)
- `battleforthecrown-pixi/src/ui/modals/VictoryModalHost.tsx` (nouveau)
- `battleforthecrown-pixi/src/App.tsx` — `+ <VictoryModalHost />`
- `battleforthecrown-pixi/src/api/ws-bindings.ts` — swap `pushToast` → `pushVictoryModal`
- `battleforthecrown-pixi/src/features/world/WorldMapScreen.tsx` — consume `pendingFocus`
- `battleforthecrown-pixi/src/features/design-system/DesignSystemPreview.tsx` — preview section

Tests :
- `battleforthecrown-pixi/src/stores/ui.test.ts` (nouveau, 3 tests)
- `battleforthecrown-pixi/src/api/ws-bindings.test.ts` — `+ describe applyVillageConquered`

Docs :
- `docs/architecture/realtime.md` ligne 117 — `+ villageName`

### Tickets ouverts

Aucun.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Modal "Victoire" plein écran avec bandeau vert + couronne + titre VICTOIRE + nom + position + CTA — preuve : `VictoryModal.tsx` rend exactement ces éléments, preview accessible via `/design-system`.
  - [x] Toast warning historique retiré sur `village.conquered` — preuve : test `applyVillageConquered` assert `useUiStore.getState().toasts).toHaveLength(0)`.
  - [x] Modal jamais côté défenseur — preuve : `event-outbox.service.ts:399-409` `notifyUser(newOwnerId, …)`, l'event n'est pas broadcast.
  - [x] Modal fermable (overlay click, Escape, CTA) — preuve : `VictoryModal.tsx` implémente `closeOnOverlayClick` et `closeOnEscape` + CTA appelle `onViewVillage` qui dismiss.
  - [x] CTA "Voir le village" centre la map sur le village conquis — preuve : `VictoryModalHost` set `pendingFocus({x,y})` + navigate `/game/world` ; `WorldMapScreen` consomme via 2 effets dont l'un appelle `canvasRef.current.centerOn(x, y)`.
  - [x] Compatible barbare et PvP (même event, même UX) — preuve : aucun branchement sur `previousTier` dans le handler ni le modal.
  - [x] `/design-system` affiche la preview sans régression — preuve : section "Victory Modal (runtime)" ajoutée, bouton "Ouvrir l'aperçu" déclenche le modal local.
  - [x] Pas de double-affichage si plusieurs `village.conquered` rapprochés — preuve : queue FIFO testée (`ui.test.ts` `pushes modals in FIFO order` + `dismissVictoryModal removes only the matching entry`), `VictoryModalHost` n'affiche que `victoryModals[0]`.
  - [x] `yarn static-check` vert + tests verts.

- **Tests automatisés** :
  - `yarn workspace battleforthecrown-pixi test --run` → **131 tests passed (23 fichiers)**, dont 3 nouveaux dans `ui.test.ts` + 1 nouveau dans `ws-bindings.test.ts`.
  - `yarn test:backend` → **202 tests passed (16 suites)**.
  - `yarn static-check` → **OK** (type-check backend + pixi + eslint deux côtés).

- **Smokes lancés** :
  - `yarn test:smoke:preflight` → OK.
  - `yarn test:smoke` → **41 tests passed (22 suites)** en 32s.

- **Smokes ajoutés/modifiés** : Aucun. Raison : le changement backend est limité à l'enrichissement d'un payload d'event existant ; le smoke `conquest-service.smoke.spec.ts` couvre déjà la dispatch de `village.conquered` (sans assert sur le payload détaillé, ce qui reste acceptable — le typage TS + Zod garantit la shape). Pas de nouvelle orchestration pg-boss / worker à couvrir.

- **QA fonctionnelle agent** : Non exécuté. Raison : pas d'orchestration backend nouvelle à valider côté serveur, le payload-only change est validé par le typage strict + les smokes existants. La validation visuelle du modal et du focus map relève du test IG (UI rendue côté React + Pixi).

- **Tests IG à faire par le user** :
  - [ ] **Aperçu design-system** : ouvrir `http://localhost:5173/design-system`, scroller jusqu'à la section "Victory Modal (runtime)", cliquer "Ouvrir l'aperçu", vérifier le rendu (bandeau vert, couronne, VICTOIRE en gros, ligne "Vous avez conquis Cravia ! (42, 88)", bouton "Voir le village"). Fermer via Escape, overlay click, et bouton CTA — les 3 doivent fermer le modal.
  - [ ] **Conquête barbare bout-en-bout** : sur un monde dev, lancer une conquête barbare (T1 ou T2 pour aller vite), tenir la fenêtre de capture, vérifier qu'au moment où l'event `village.conquered` arrive (toast actuel disparu, modal affiché), le modal Victoire apparaît avec le bon nom de village et la position. Cliquer "Voir le village" → vérifier que la WorldMap s'ouvre centrée sur le village conquis.
  - [ ] **Conquête PvP (si compte test disponible)** : même scénario, vérifier que le modal apparaît côté attaquant uniquement, **jamais** côté défenseur (aucun feedback visuel chez le défenseur perdant ce village — comportement attendu MVP).
  - [ ] **Z-index / overlay** : pendant que le modal est affiché, vérifier qu'aucun élément HUD (toasts, panels) ne le recouvre ; l'overlay sombre doit couvrir toute la page.
