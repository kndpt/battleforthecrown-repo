# 02 — Events WebSocket définis dans shared mais non écoutés côté frontend

**Statut** : ✅ Résolu le 2026-05-06
**Sévérité** : 🔴 Critique
**Workspace(s)** : cross-workspace (`packages/shared` ↔ `battleforthecrown-pixi`)
**Tags** : ws, contract-drift, dead-feature

## Résolution

Option B retenue (linéaire + garde compile-time exhaustive après analyse de 3 stratégies) :

- **Garde structurelle côté frontend** : `bindServerEvents` réécrit autour d'un `Record<ServerEventName, ServerEventListener<K>>` exhaustif. Ajouter un event dans `shared/events/types.ts` sans déclarer son binding casse désormais la compilation Pixi — le drift décrit dans le ticket ne peut plus réapparaître silencieusement.
- **Signatures uniformisées** : tous les binders adoptent `(payload, ctx) => void` (les binders qui n'ont pas besoin de `ctx` reçoivent `_ctx?` non utilisé). `bindServerEvents` itère sur les clés de la map, supprimant le tableau ad hoc.
- **`unit.training.completed` bindé** : `applyUnitTrainingCompleted` invalide `armyTraining` / `armyInventory` / `population` et pousse un toast « Entraînement terminé ». Le `refetchInterval: 5_000` de `useArmyTrainingQuery` est retiré → latence ressentie ~1 s (Outbox) au lieu de jusqu'à 5 s, et plus de poll inutile pendant qu'un training est actif.
- **`unit.training.started` supprimé côté backend** : retrait de l'`eventOutbox.create` dans `army.service.trainUnits` (la mutation REST renvoie déjà la ligne `UnitTraining` et le frontend invalide ses queries au `onSettled`). Type `UnitTrainingStartedPayload` supprimé de `packages/shared/src/events/types.ts`, plus le case dispatch + méthode `notifyUnitTrainingStarted` dans `event-outbox.service.ts`.
- **`village.strategy.changed` supprimé côté backend** : retrait de l'`eventOutbox.create` dans `village-strategy.service.changeStrategy` (post-mutation invalidation TanStack suffit en mono-session — et le frontend Pixi n'avait même pas câblé la feature). `EventOutboxService` retiré du constructeur. Type `VillageStrategyChangedPayload` supprimé de shared, case + méthode `notifyVillageStrategyChanged` retirés.
- **Specs nettoyées** : `event-outbox.service.spec.ts` (cas dispatch obsolètes), `game.gateway.spec.ts` (test « multi-user » rebrancher sur `building.completed`), `training-system.integration-spec.ts` (assertion outbox retirée), `village-strategy.integration-spec.ts` (titre + assertion outbox retirés, import du type mort supprimé).

Vérification : `tsc` shared OK, `type-check` Pixi OK, `nest build` backend OK ; 57/57 tests Pixi PASS, 318/324 tests backend PASS (les 6 KO sont pré-existants sur main, sans rapport — `loot.manager.spec.ts` et `world-config.service.spec.ts`). Migration SQL Outbox non nécessaire : 0 row pending pour les kinds supprimés au moment du déploiement.

Voir les commits `refactor(pixi-frontend/ws,shared): exhaustive ServerEvents bindings + bind training.completed` (repo racine) et `refactor(backend/event): drop dead unit.training.started + village.strategy.changed outbox events` (sous-repo backend).

## Symptôme

Trois événements WebSocket sont déclarés dans `packages/shared/events/types.ts` **et** émis par le backend via le pattern Outbox, mais **aucun binding** côté frontend ne les écoute. Le frontend retombe sur du polling REST (avec un délai de fraîcheur de plusieurs secondes) pour récupérer les changements.

## Events concernés

| Event | Défini shared | Émis backend | Bindé frontend |
|---|---|---|---|
| `unit.training.started` | ✅ `events/types.ts:8-17` | ✅ `event-outbox.service.ts:82-95` | ❌ |
| `unit.training.completed` | ✅ `events/types.ts:19-25` | ✅ `event-outbox.service.ts:82-95` | ❌ |
| `village.strategy.changed` | ✅ `events/types.ts:112-119` | ✅ `event-outbox.service.ts:118-122` | ❌ |

Côté frontend, `src/api/ws-bindings.ts:149-165` liste les listeners actifs : aucune trace de ces trois events.

## Détail technique

Côté backend, le pattern Outbox écrit l'event dans `EventOutbox` au sein de la transaction de mutation (training démarré, terminé, ou stratégie changée). `OutboxWorker` poll toutes les ~1 s, dispatche via `GameGateway.notifyUser(userId, event, payload)`. Le `kind` de l'event est typé strict dans le switch backend (`default: never` exhaustif), ce qui garantit la cohérence côté serveur.

Côté frontend, `bindServerEvents()` dans `src/api/ws-bindings.ts` enregistre uniquement :
- `resources.changed`
- `crowns.changed`
- `building.completed`
- `battle.sent` / `battle.resolved` / `battle.returned`
- `village.attacked` / `village.conquered`

Pour récupérer l'état de l'entraînement, le frontend utilise `useArmyTrainingQuery()` (`src/api/queries.ts:293-304`) avec `refetchInterval: 5000`. Donc :
- Latence perçue training : 0 à 5 s (au lieu de 0 à 1 s prévu via Outbox).
- Charge serveur inutile : poll toutes les 5 s même quand rien ne se passe.

Pour la stratégie, le frontend dépend d'une invalidation post-mutation (à vérifier qu'elle existe dans `useChangeStrategyMutation` côté front). Mais si **un autre joueur** change la stratégie d'un village partagé (cas multi-joueur futur), le client local ne sera jamais notifié.

## Impact

- **Fonctionnel** : feature "temps réel" non tenue pour 3 events. UX dégradée pour la file d'entraînement (5 s de stale).
- **Architectural** : drift entre shared et frontend. La promesse "ServerEvents = source unique de vérité" est trahie.
- **Coût serveur** : polling REST inutile.
- **Risque silencieux** : si demain on ajoute un autre event au shared, il ne sera peut-être pas non plus bindé. Pas de garde au compile-time qui force l'exhaustivité côté front.

## Pistes à explorer

- Ajouter les 3 bindings manquants dans `ws-bindings.ts` (cas le plus simple).
- À l'inverse, supprimer du backend les events jamais consommés (si la décision produit est de polling — peu probable, vu l'archi annoncée).
- Forcer une garde au compile-time : type côté front qui exige `Record<keyof ServerEvents, Listener>` exhaustif. Dès qu'un event manque, ts erreur.
- Audit : produire une matrice `event × (défini shared / émis back / écouté front)` automatisée (script ou test).

## Décision validée

(2026-05-06, par l'utilisateur)

- **`unit.training.completed`** : à **binder côté frontend**. Remplace le polling REST de `useArmyTrainingQuery` qui peut dès lors retirer son `refetchInterval: 5000`. Gain UX (latence ~1 s au lieu de jusqu'à 5 s) et gain ops (suppression du poll inutile).
- **`unit.training.started`** : à **supprimer côté backend** (event inutile pour un usage solo : la mutation REST `useTrainUnitsMutation` renvoie déjà l'état). Retirer aussi de `ServerEvents` dans `packages/shared/events/types.ts` et de l'émission dans `event-outbox.service.ts`.
- **`village.strategy.changed`** : à **supprimer côté backend** (post-mutation invalidation TanStack Query suffit en mono-session). Retirer aussi de `ServerEvents` et de l'émission Outbox.

L'agent suivant doit **planifier l'implémentation** (ordre des suppressions, gestion des migrations Outbox en cours, suppression du polling), pas re-explorer les options.

## Tickets liés

- [03 — Dual path `resources.changed`](./03-resources-changed-dual-path.md) — autre symptôme de divergence sur le contrat WS.
- [09 — typage relâché backend](./09-backend-relaxed-typing.md) — la garde compile-time côté front bénéficie d'un typage strict côté back.

## Dimensions à valider en sortie

- Tous les events de `ServerEvents` (côté shared) ont soit un binding actif, soit une décision documentée de ne pas être consommé.
- Une garde structurelle empêche un nouvel event d'être ajouté côté shared sans déclencher d'erreur tant qu'il n'est pas traité côté front.
- Tests : émettre chaque event côté back et vérifier l'effet attendu côté front (mutation store / invalidation query / toast).
