# Run #085 — feature-private-map-markers

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap MVP — promotion d'un ticket lab à très bon ratio bénéfice/coût (UX mobile, zéro impact gameplay), candidat naturel à un cycle post-MVP rétention/QoL. Pas de blocage si reporté.
- **Spec source** : [`docs/gameplay/lab/tickets/10-map-notes-and-markers.md`](../../docs/gameplay/lab/tickets/10-map-notes-and-markers.md) (lab, à **promouvoir** dans une spec canonique pendant ce run — proposition : nouvelle `docs/gameplay/26-private-map-markers.md`, alignée sur la convention « MVP léger » de `22-village-roles-and-navigation.md` et `11-scouting.md § Carnet d'intel`).
- **Type** : `feature`
- **Modules** : nouveau backend `modules/map-markers` (CRUD scopé `userId × worldId`) + Prisma + shared `map-markers/` (types + Zod + cap) + frontend Pixi (couche overlay carte + sheet édition) + docs gameplay (nouvelle spec) + docs UI library.

## Pourquoi maintenant

Le lab ticket 10 est noté **« très bon » ratio bénéfice/coût** (cf. document). Les piliers MVP voisins sont livrés (carnet d'intel run 055, multi-village run 021, sélecteur village run 042, panneau carte run 079, scout run 016/017, profil joueur run 082), donc :

1. La carte est aujourd'hui le **point central** de la session mobile. Le joueur a besoin d'une mémoire stratégique persistée (cible à scout, voisin dangereux, futur spot, site contesté) et la garde aujourd'hui hors jeu.
2. Le composant `WorldMapScene` est mature et a déjà une primitive `captureMarker` (cf. `pixi/scenes/WorldMapScene.ts:592` — `Graphics` overlay non-interactif sur les villages en capture). Le pattern est démontré, l'extension à un nouveau type de marker privé est mécanique.
3. Aucun gameplay critique n'en dépend — c'est une couche d'aide pure, qui peut être livrée sans coordination avec une autre feature en flight.

## Gap (preuves code)

- `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts` — aucune couche `markersLayer` / `notesLayer` ; seule la `captureMarker` Graphics existe (594) sur les villages publics, pas de marker privé scope joueur.
- `battleforthecrown-pixi/src/features/world/` — aucun composant `MapMarkerSheet` / `MapMarkerEditor` / `MapMarkersPanel`.
- `battleforthecrown-backend/src/modules/` — aucun module `map-markers/` (modules existants : `army, auth, combat, cosmetic, crowns, event, friendship, gameplay, intel, onboarding, population, power, rankings, renown, resources, retention, strategy, users, village, world` — `intel` est privé par village cible, pas un marker libre par tile).
- `battleforthecrown-backend/prisma/schema.prisma` — aucun modèle `MapMarker` / `PrivateMarker`.
- `packages/shared/src/` — aucun répertoire `map-markers/` ni type `MapMarkerKind` / `MapMarkerDto`.
- `docs/gameplay/lab/tickets/10-map-notes-and-markers.md` — lab non promu, **« Points à trancher » non répondus** : marqueur sur tile/village/site/tout ? Tags fixes vs note libre ? Mini-map ? Suppression auto si entité disparaît ?

## Dépendances

- ✅ `WorldMapScene` (run 023+) — overlay layer extensible (pattern `captureMarker` à reprendre).
- ✅ `VillageIntel` runtime (run 055) — précédent qui prouve qu'on peut faire du privé par joueur sans toucher au public-fog.
- ✅ Sélecteur multi-village + `SelectedEntityPanel` (run 042/079) — surfaces où ajouter un CTA « Marquer ».
- Hors scope : partage tribu/alliances (post-MVP `21`), notes publiques, gameplay-mutant (le marker reste cosmétique).

## Étape 0 — Questions lab tranchées (refinement acté 2026-06-28)

Les 7 réponses sont **figées** (validées par Kelvin). À reporter telles quelles dans la spec canonique `26-private-map-markers.md` :

- **Cible** : ✅ **tile libre** — le marker est posé sur n'importe quelle **tile** `(worldId, x, y)`, identifiée par ses coordonnées, **indépendamment de son contenu** (vide, village, site). Aucun lien dur vers une entité → permet « futur spot » et survit à la disparition d'une entité. Unicité `(userId, worldId, x, y)`.
- **Contenu** : ✅ **1 kind enum** (`TO_SCOUT | TARGET | DANGER | FUTURE_VILLAGE | INTEREST | NOTE`) + **note libre courte** (≤ 80 chars, optionnelle). Kind fixe pour icône lisible, note pour le contexte.
- **Cap** : ✅ **50 markers par `userId × worldId`** (borne UI lisible, suffisant pour usage stratégique).
- **Persistance** : ✅ **DB backend** (cross-device), pas localStorage — cohérent avec `VillageIntel` privé.
- **Suppression auto** : ✅ **NON** au MVP — un marker sur tile dont le village a été détruit reste affiché en gris « entité disparue ». Anti-frustration : on ne perd pas la mémoire stratégique.
- **Mini-map** : ✅ **NON** au MVP — la mini-map reste lisible, pas de pollution.
- **Visibilité dans la vision (brouillard)** : ✅ marker affiché **même hors vision** (mémoire privée du joueur, pas une révélation publique). Pas de fuite — c'est seulement ce que **le joueur** sait déjà.

## Critère de fin (acceptance)

- [ ] **[spec]** Nouvelle spec `docs/gameplay/26-private-map-markers.md` créée, source canonique, qui acte les 7 réponses ci-dessus (cible, kinds, cap, persistance, no-auto-delete, no-mini-map, off-fog). Lab `tickets/10-*` déplacé en « Idées promues » (cf. `lab/README.md` + `lab/tickets/README.md`). Index `docs/gameplay/README.md` mis à jour.
- [ ] **[backend]** Modèle Prisma `MapMarker` (`id`, `userId`, `worldId`, `x`, `y`, `kind enum`, `note?`, `createdAt`, `updatedAt`) + migration additive. Index `(userId, worldId)` et `@@unique([userId, worldId, x, y])` (un marker par tile par joueur — édition idempotente).
- [ ] **[backend]** Module `MapMarkerModule` : `POST /worlds/:worldId/map-markers` (create/upsert), `GET /worlds/:worldId/map-markers` (liste self scopée monde), `PATCH /worlds/:worldId/map-markers/:id`, `DELETE /worlds/:worldId/map-markers/:id`. JWT obligatoire (jamais `@Public`), ownership vérifiée par service (`assertOwnedBy userId`), cap 50 revérifié dans la même tx que l'insert (404 `MAP_MARKER_NOT_FOUND`, 409 `MAP_MARKER_CAP_REACHED`). `assertWorldWritable` appliqué pour respecter l'invariant lecture-seule `ENDED`/`ARCHIVED` côté mutations (GET reste possible en `ENDED` pour consultation).
- [ ] **[shared]** `packages/shared/src/map-markers/` : `MapMarkerKind`, `MapMarkerDto`, `CreateMapMarkerSchema` (Zod), `UpdateMapMarkerSchema`, `MAP_MARKER_CAP = 50`, `MAP_MARKER_NOTE_MAX_LENGTH = 80`, `MAP_MARKER_ERROR_CODES`. Exposé via barrel `index.ts`.
- [ ] **[frontend]** Couche overlay Pixi `markersLayer` dans `WorldMapScene` : 1 sprite/Graphics par marker, rendu **au-dessus** des entités et **sous** la capture markers. Mappe `kind` → icône + couleur (pattern à reprendre depuis `worldMapEntityStyle.ts`). Reconciliation (`Map<id, Visual>`) pour éviter recréation à chaque frame.
- [ ] **[frontend]** `MapMarkerSheet` (mobile-friendly) accessible via clic long / icône sur tile sélectionnée : pick `kind`, edit note, save/delete. Cap 50 affiché côté UI (`{N}/50` + tooltip « Cap atteint » si 50). Pas de partage social, pas de mini-map.
- [ ] **[frontend]** Query/mutation TanStack Query (`useMapMarkersQuery`, `useUpsertMapMarkerMutation`, `useDeleteMapMarkerMutation`) avec optimistic UI (snapshot + rollback), rafraîchies par invalidation REST (pas d'event WS au MVP — privé par compte, pas de réplication temps réel).
- [ ] **[invariant]** Aucun marker n'apparaît pour un autre joueur (revue rapide du DTO, jamais d'`userId` cross). Test backend smoke confirme isolation par compte.
- [ ] **[tests]** Smoke backend CRUD + cap + isolation cross-account + isolation cross-world ; Vitest pixi pour `markersLayer` reconciliation + mappe kind→style + mutation rollback. `yarn static-check` + `yarn test:backend` + `yarn test:pixi` verts. Smoke total ≥ 8 critères couverts.
- [ ] **[docs]** `docs/architecture/backend-modules.md` (entrée `map-markers`), `docs/architecture/data-model.md` (entité `MapMarker`), `battleforthecrown-pixi/docs/ui-library.md` (composant `MapMarkerSheet` si réutilisable). Sortie du lab actée (`lab/README.md` + `lab/tickets/README.md` + ce ticket comme « Source canonique »).

## Hors scope (à ne pas faire dans ce run)

- Partage tribu/alliances (post-MVP `21`).
- Suppression auto si entité disparaît (cf. tranchée Étape 0).
- Mini-map markers (cf. tranchée Étape 0).
- Alertes/notifications liées (post-MVP, sans valeur ajoutée tant qu'on n'a pas d'événement public sur tile).
- Tags personnalisables (kind enum figé MVP, plus simple à coder + plus lisible).
- Couleur custom par marker (kind → couleur fixe — cohérent design system).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-prisma`, `bftc-react-hud`, `bftc-pixi-scene`, `bftc-tests-policy`, `bftc-qa`
- Spec source : `docs/gameplay/lab/tickets/10-map-notes-and-markers.md`
- Précédent privé par joueur : `docs/gameplay/11-scouting.md § Carnet d'intel` + run `055-feature-intel-notebook`.
- Précédent overlay map : `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts:592` (`captureMarker`).

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — Spec canonique + sortie lab** : créer `docs/gameplay/26-private-map-markers.md` + déplacer ticket lab en « Idées promues » (`lab/README.md` + `lab/tickets/README.md` + index `docs/gameplay/README.md`).
- **T2 — Prisma + shared contracts** : modèle `MapMarker` + migration ; `packages/shared/src/map-markers/`.
- **T3 — Backend module** : `MapMarkerModule` (controller + service) + tests unit (cap, ownership, isolation) + smoke spec.
- **T4 — Frontend overlay + sheet** : `markersLayer` dans `WorldMapScene` + `MapMarkerSheet` + style/icône par kind.
- **T5 — Queries + intégration HUD** : TanStack Query + invalidation + point d'entrée (clic long tile / CTA panneau).
- **T6 — Docs archi + UI library** : `backend-modules.md` + `data-model.md` + `ui-library.md`.

## Progress

_(Vide au démarrage. À remplir pendant `$bftc-run`.)_

## Décisions prises

- **2026-06-28 (refinement)** — 7 questions Étape 0 tranchées (cf. section Étape 0). Point clé : **Cible = tile libre** (marker indexé par coordonnées `(worldId, x, y)`, jamais lié dur à une entité). Reste = propositions par défaut confirmées (kind enum + note ≤80, cap 50, backend, no auto-delete, no mini-map, off-fog).

## Rapport final

### Acceptance & QA

_(Vide au démarrage. Rempli à la clôture.)_
