# 26 — Marqueurs de carte privés (MVP léger)

**Statut** : spec MVP livrée (run 085, promotion du lab [`tickets/10-map-notes-and-markers.md`](./lab/tickets/10-map-notes-and-markers.md)).
**Type** : aide stratégique privée, cosmétique. **Zéro effet gameplay.**

## Objectif joueur

La carte est le point central de la session mobile. Le joueur a besoin d'une **mémoire stratégique persistée** : une cible à scout, un voisin dangereux, un futur spot de village, un site contesté. Aujourd'hui cette mémoire vit hors jeu (notes externes, capture d'écran). On la ramène dans le jeu, privée et rapide.

Précédent privé-par-joueur : [`11-scouting.md § Carnet d'intel`](./11-scouting.md) (run 055). Comme l'intel, un marqueur n'est visible que de son propriétaire et ne révèle rien aux autres.

## Mécanique

Un **marqueur** est posé sur une **tile libre** identifiée par ses coordonnées `(worldId, x, y)`, **indépendamment de son contenu** (vide, village, barbare, site). Aucun lien dur vers une entité : le marqueur vit sur la tile, pas sur ce qui s'y trouve. Cela permet « futur spot » sur une case vide et garantit que le marqueur survit à la disparition de l'entité qui s'y trouvait.

Chaque marqueur porte :

- un **kind** (enum, icône lisible) : `TO_SCOUT`, `TARGET`, `DANGER`, `FUTURE_VILLAGE`, `INTEREST`, `NOTE` ;
- une **note libre** courte optionnelle (≤ 80 caractères) pour le contexte.

Unicité : **un seul marqueur par tile par joueur** — `(userId, worldId, x, y)`. Reposer un marqueur sur une tile déjà marquée = édition idempotente (upsert).

## Décisions tranchées (refinement 2026-06-28, figées)

| Question | Décision MVP |
| --- | --- |
| **Cible** | Tile libre `(worldId, x, y)`, jamais liée dur à une entité. |
| **Contenu** | 1 kind enum (6 valeurs) + note libre ≤ 80 chars optionnelle. |
| **Cap** | **50 marqueurs** par `userId × worldId`. |
| **Persistance** | DB backend (cross-device), pas localStorage — cohérent avec l'intel. |
| **Suppression auto** | **Non.** Le marqueur reste affiché sur sa tile même si l'entité disparaît. Pas de greying « entité disparue » au MVP. Anti-frustration : on ne perd pas la mémoire stratégique. |
| **Mini-map** | **Non** — la mini-map reste lisible. |
| **Brouillard (fog)** | Marqueur affiché **même hors vision** : c'est la mémoire privée du joueur, pas une révélation publique. Aucune fuite — c'est seulement ce que le joueur sait déjà. |
| **Archive de monde** | **Purgés** avec le reste du royaume du joueur par `WorldLifecycleWorker.archiveEndedWorlds` (cf. [`19-world-lifecycle.md`](./19-world-lifecycle.md) § Wipe). Player-scoped per-world, aucun carry-over cross-monde. |

## Garde-fous

- **Pas de gameplay caché** : le marqueur n'altère aucune résolution (combat, vision, production).
- **Pas de partage social** au MVP (post-MVP [`21-alliances-and-tribes.md`](./21-alliances-and-tribes.md)).
- **Cap 50** lisible, suffisant pour un usage stratégique, borne l'UI et la DB.
- **Isolation par compte stricte** : un marqueur n'apparaît jamais pour un autre joueur. Le DTO ne fuit jamais d'`userId` cross.
- **Off-fog ≠ fuite** : afficher un marqueur hors vision ne révèle rien sur l'état courant de la tile, seulement la note que le joueur s'est écrite.

## Contrat backend

Module `MapMarkerModule`, scopé `userId × worldId`, JWT obligatoire (jamais `@Public`).

| Endpoint | Effet |
| --- | --- |
| `GET /worlds/:worldId/map-markers` | Liste des marqueurs du joueur sur ce monde. Autorisé en `ENDED` (consultation). |
| `POST /worlds/:worldId/map-markers` | Create / upsert sur `(userId, worldId, x, y)`. Cap 50 revérifié dans la même transaction que l'insert. |
| `PATCH /worlds/:worldId/map-markers/:id` | Édite kind / note. Ownership vérifiée. |
| `DELETE /worlds/:worldId/map-markers/:id` | Supprime. Ownership vérifiée. |

- Mutations soumises à `assertWorldWritable` (invariant lecture-seule `ENDED`/`ARCHIVED`). `GET` reste possible en `ENDED`.
- Codes d'erreur machine : `MAP_MARKER_NOT_FOUND` (404), `MAP_MARKER_CAP_REACHED` (409).
- Pas d'event WS au MVP : privé par compte, pas de réplication temps réel. Le front se resynchronise par invalidation REST TanStack Query.

Contrats partagés dans [`@battleforthecrown/shared/map-markers`](../../packages/shared/src/map-markers/) : `MapMarkerKind`, `MapMarkerDto`, `CreateMapMarkerSchema`, `UpdateMapMarkerSchema`, `MAP_MARKER_CAP = 50`, `MAP_MARKER_NOTE_MAX_LENGTH = 80`, `MAP_MARKER_ERROR_CODES`.

Modèle Prisma `MapMarker` (`worldId` dénormalisé, pas de FK cascade depuis `Village`) — purge explicite à l'archive, comme `VillageIntel`. Détail entité : [`docs/architecture/data-model.md`](../architecture/data-model.md).

## Contrat frontend

- Couche overlay Pixi `markersLayer` dans `WorldMapScene` : 1 visuel par marqueur, rendu au-dessus des entités et sous la `captureMarker`. Mappe `kind` → icône + couleur. Reconciliation `Map<id, Visual>` pour éviter la recréation par frame.
- `MapMarkerSheet` mobile-friendly : pick `kind`, édite la note, save / delete. Cap `{N}/50` affiché, tooltip « Cap atteint » à 50.
- TanStack Query : `useMapMarkersQuery`, `useUpsertMapMarkerMutation`, `useDeleteMapMarkerMutation` avec optimistic UI (snapshot + rollback) et invalidation REST.

## Hors scope MVP

- Partage tribu / alliances (post-MVP `21`).
- Suppression auto si l'entité disparaît.
- Marqueurs sur la mini-map.
- Alertes / notifications liées.
- Tags personnalisables (kind enum figé) et couleur custom (kind → couleur fixe).
