# 85 — Notification serveur `OPEN → LOCKED` : toast côté joueur en session

**Sévérité** : 🟢 Mineur
**Statut** : 🆕 Ouvert
**Spec amont** : [`docs/gameplay/19-world-lifecycle.md` § OPEN → LOCKED](../docs/gameplay/19-world-lifecycle.md#open--locked)

## Symptôme

À la bascule `OPEN → LOCKED`, le backend émet déjà `world.status.changed` (cf. `world-lifecycle.worker.ts:358`, routé `directWorld` par `event-outbox-notification-planner.ts:195`) et le frontend invalide les caches `publicWorlds` / `worlds` / `myMemberships` / `worldConfig` (cf. `applyWorldStatusChanged` dans `battleforthecrown-pixi/src/api/ws-bindings.ts:134-175`). **Mais aucun toast n'est affiché au joueur en session** : la branche `if (payload.to === "ENDED")` ajoute un toast « Monde terminé », il n'y a pas de branche équivalente pour `LOCKED`. Le joueur déjà sur le monde voit son écran de sélection se mettre à jour silencieusement et ne sait pas pourquoi le monde a disparu de la liste publique des mondes joignables.

La spec § OPEN → LOCKED stipule explicitement :

> Notification serveur : « La fenêtre d'inscription est fermée. Le monde tourne maintenant entre ses {N} joueurs jusqu'au {endsAt}. »

Symétrie attendue avec le pattern toast `ENDED` livré par le run 061/066.

## Cause racine probable

Oubli lors des runs 032 (foundation lifecycle) / 061 (`ENDED` snapshot + lecture seule) / 066 (`ENDED` UI lecture seule) : la transition `OPEN → LOCKED` n'a jamais reçu de pendant UI explicite, le frontend a été câblé pour invalider les caches mais pas pour notifier le joueur. Le run 083 (event `world.inscription-phase.changed` pour `main → late`) a établi le pattern « notif phase sans toast, juste invalidation cache » — mais la spec demande bien un toast pour `LOCKED` (« Notification serveur : ... »).

## Comportement attendu

- À la réception WS `world.status.changed` avec `payload.to === "LOCKED"`, `applyWorldStatusChanged` émet un toast via `useUiStore.pushToast` (tone `info`, ttlMs aligné sur le pattern `ENDED`).
- Titre court (ex : « Inscription close ») + description reprenant le sens de la spec (« La fenêtre d'inscription est fermée. {endsAt} »).
- Les invalidations de cache existantes (`publicWorlds`, `worlds`, `myMemberships`, `worldConfig`, `worldConfigFull`) restent inchangées — non-régression.
- Aucun toast pour les autres transitions hors `LOCKED` / `ENDED` (PLANNED → OPEN reste silencieux, OPEN → ENDED — saut improbable — affiche uniquement le toast `ENDED`, etc.).
- Le toast n'est pas spammé si l'event est rejoué (TTL court, pattern existant côté `ENDED`).

## Pistes

**A — Toast simple à wording figé (retenue).** Une branche `if (payload.to === "LOCKED") { ... }` dans `applyWorldStatusChanged`, miroir de la branche `ENDED`. Description fixe ou dérivée de `payload.at` sans dépendre d'un cache fraîchement invalidé. Pas de coordination avec un autre refetch — robuste, prévisible, symétrique avec `ENDED`.

**B — Toast enrichi avec memberCount + endsAt lus de la cache `publicWorlds` après refetch.** Le payload ne porte pas `memberCount` ni `endsAt`. Lire ces valeurs après la refetch déclenchée par l'invalidation est fragile (timing : la refetch peut être en vol au moment du `pushToast`). Coût implémentation > bénéfice UX. À reconsidérer post-MVP si playtest le justifie.

**A retenue** : symétrie avec `ENDED`, livraison rapide, alignée sur la décision design « notification serveur » qui vise d'abord le sens (« le monde n'accepte plus de nouvelles inscriptions »), pas le compteur précis.

## Scope recommandé

### Frontend

- `battleforthecrown-pixi/src/api/ws-bindings.ts` — ajouter une branche `if (payload.to === "LOCKED")` dans `applyWorldStatusChanged` (juste après la branche `ENDED`, ~ligne 155-174), miroir du pattern `pushToast({ title, description, tone: "info", ttlMs: 6000 })`.

### Tests

- `battleforthecrown-pixi/src/api/ws-bindings.test.ts` — assertion : le toast est poussé quand `payload.to === "LOCKED"` ; pas de toast pour PLANNED → OPEN ; toast `ENDED` toujours déclenché pour `to === "ENDED"`.

## Points d'attention

- **Cible audience du toast** : `world.status.changed` est routé `directWorld` par `event-outbox-notification-planner.ts:195` → seuls les sockets joints à la room `world:<worldId>` reçoivent l'event. Le toast s'affichera donc uniquement pour les joueurs membres en session sur ce monde — comportement attendu, aucune action explicite côté front nécessaire.
- **Idempotence visuelle** : le pattern `ENDED` ne dédoublonne pas explicitement, le `ttlMs` fait office de garde-fou. Conserver la même approche.
- **Wording FR** : la spec donne le sens, pas un libellé canonique ; rester court (mobile) et neutre, sans inclure le `endsAt` brut sans formatage humain. À borner par le concepteur du run.
- **Pas de modification backend** : `payload` actuel (`{ worldId, from, to, at }`) suffit pour le wording figé piste A. Si la piste B est retenue plus tard, ajouter `memberCount` / `endsAt` au payload via `packages/shared/src/events/types.ts` + `schemas.ts` + `world-lifecycle.worker.ts` (hors scope ce ticket).

## Critères de succès

- [ ] `applyWorldStatusChanged` affiche un toast `info` quand `payload.to === "LOCKED"` (vérifié via test Vitest mockant `useUiStore.pushToast`).
- [ ] Aucun toast pour PLANNED → OPEN, OPEN → OPEN (no-op), ou autres combinaisons hors `LOCKED` / `ENDED` (test).
- [ ] Toast `ENDED` toujours déclenché (non-régression test).
- [ ] Les 5 invalidations de cache existantes (`publicWorlds`, `worlds`, `myMemberships`, `worldConfig`, `worldConfigFull`) restent en place et restent appelées pour toutes les transitions (test).
- [ ] `yarn static-check` vert.
- [ ] `yarn workspace battleforthecrown-pixi test` vert.
