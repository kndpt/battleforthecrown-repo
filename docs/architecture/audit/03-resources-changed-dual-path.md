# 03 — Deux chemins pour créer l'event `resources.changed` avec des payloads divergents

**Sévérité** : 🔴 Critique
**Workspace(s)** : `battleforthecrown-backend`
**Tags** : outbox, contract-drift, ws

## Symptôme

L'event Outbox `resources.changed` est créé par **deux chemins distincts** dans le backend, avec des **payloads différents** :

- L'un construit le payload **avec** `productionRates`.
- L'autre **sans** `productionRates`.

Le frontend reçoit indistinctement les deux et applique la mise à jour du store. Selon le chemin emprunté, les taux de production en mémoire peuvent rester figés tandis que les stocks bougent.

## Localisation

- `src/modules/resources/resources.service.ts:154-169` — création directe `tx.eventOutbox.create({ kind: 'resources.changed', payload: { villageId, wood, stone, iron, ... } })` **sans** `productionRates`.
- `src/modules/resources/resources.service.ts:367-391` — helper `createResourcesChangedEvent()` qui appelle `getProductionRates()` puis crée l'event **avec** `productionRates`.

(Lignes selon le rapport cross-workspace Phase A — à reconfirmer en lecture précise.)

Côté frontend, `src/api/ws-bindings.ts` `applyResourcesChanged` consomme `payload.productionRates` s'il est présent ; sinon le store ne met pas à jour les taux et garde la valeur précédente.

## Détail technique

Le pattern Outbox est censé garantir un contrat unique : `kind = 'resources.changed'` ⇒ `payload = ResourcesChangedPayload` (défini dans `packages/shared/events/types.ts:90-102`). En réalité, le contrat est respecté côté **type**, mais deux producteurs construisent des payloads différents :

1. Chemin "rapide" : la mutation modifie les stocks et insère l'event manuellement, sans recalculer les rates (probablement pour éviter une requête supplémentaire dans la transaction).
2. Chemin "complet" : passe par le helper qui charge les rates avant insertion.

Conséquence : le payload côté shared définit `productionRates` comme **optionnel** (ou bien il est obligatoire mais omis silencieusement, à vérifier dans le type).

## Impact

- **Cohérence d'état frontend** : si un upgrade de bâtiment passe par le chemin "rapide", le frontend voit les stocks bouger mais conserve un taux obsolète. À la prochaine mutation passant par le chemin "complet", le taux est rafraîchi — mais entre les deux, l'UI affiche un débit/h faux.
- **Diagnostic confus** : un bug "les ressources ne convergent pas" peut venir de ce double chemin, sans trace évidente dans les logs (les deux events ont le même `kind`).
- **Surface de duplication** : tout changement futur du payload doit être appliqué à deux endroits.

## Contexte

Probablement issu d'une optimisation : insérer l'event dans la transaction sans déclencher une requête `getProductionRates` quand le rate "ne devrait pas avoir changé". Mais l'invariant n'est pas clair : un upgrade de bâtiment de production change précisément le rate.

## Pistes à explorer

- Unifier sur un seul producteur d'event `resources.changed` (le helper `createResourcesChangedEvent`) et faire en sorte qu'il accepte les rates en paramètre quand on les a déjà calculés (évite la requête supplémentaire).
- Strict-typer le payload Outbox côté back (Zod ou type literal) pour interdire qu'un event sorte sans tous ses champs requis.
- Ou bien : décider que `productionRates` est vraiment optionnel sur cet event, et créer un event séparé `resources.production-rate.changed` quand il faut signaler un changement de débit.

## Tickets liés

- [02 — Events WS non bindés](./02-ws-events-not-bound.md) — autre symptôme du même problème de contrat WS lâche.
- [09 — typage relâché backend](./09-backend-relaxed-typing.md) — `payload as any` dans `event.utils.ts` permet ce type d'écart.

## Dimensions à valider en sortie

- Un seul code path produit chaque `kind` d'event Outbox.
- Le payload de chaque event passe par une validation (Zod ou équivalent) avant insertion en DB, qui rejette tout payload incomplet.
- Test d'intégration : après un upgrade de bâtiment de production, le frontend voit le nouveau rate dans l'event WS reçu (et pas seulement après un refetch REST).
