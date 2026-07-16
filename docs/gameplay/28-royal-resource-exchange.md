# 28 — Échange royal de ressources

**Statut** : spec MVP livrée (run 099, promotion de l'« alternative plus saine » du lab [`tickets/12-player-resource-market.md`](./lab/tickets/12-player-resource-market.md)).
**Type** : conversion intra-village, server-authoritative. **Aucune interaction sociale.**

## Objectif joueur

Un joueur peut se retrouver avec un stock déséquilibré (trop de bois, pas assez de fer) sans pour autant vouloir ouvrir la porte à un marché joueur-joueur — trop risqué pour l'anti-abus (feed, alts, racket, cf. ticket 12 § Risque principal). L'échange royal débloque ce déséquilibre **sans** créer d'économie inter-joueurs : c'est une soupape mono-joueur, mono-village, à taux défavorable et plafonnée.

## Mécanique

Conversion **bois ↔ pierre ↔ fer**, à l'intérieur d'**un seul village** (le joueur choisit une ressource source, une ressource destination, un montant de source à dépenser). Les couronnes ne sont **jamais** convertibles.

- **Taux** : `RESOURCE_CONVERSION_RATE = 2` — défavorable. Dépenser `amount` de la ressource source crédite `floor(amount / 2)` de la destination.
- **Arrondi floor** : aucun crédit gratuit. Un montant qui arrondirait à 0 unité créditée (`amount < 2`) est **refusé avant tout débit** — le serveur ne brûle jamais de ressource pour 0 en retour.
- **Plafond quotidien** : `RESOURCE_CONVERSION_DAILY_CAP = 5000` unités de **source dépensée**, par type de ressource, par village, par jour. Reset **04:00 Europe/Paris** via `getParisDailyKey` — même horloge que les cartes quotidiennes (cf. [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md)).

Formule et constantes : [`@battleforthecrown/shared/resources/conversion.ts`](../../packages/shared/src/resources/conversion.ts) (`convertResourceAmount`, `RESOURCE_CONVERSION_RATE`, `RESOURCE_CONVERSION_DAILY_CAP`). Commande validée Zod : [`conversion-command.ts`](../../packages/shared/src/resources/conversion-command.ts).

## Invariants anti-abus

| Garde-fou | Détail |
| --- | --- |
| **Aucune couronne convertible** | Seuls `WOOD` / `STONE` / `IRON` sont acceptés côté schéma (`ConvertResourcesCommandSchema`). |
| **Pas de transfert inter-village ni inter-joueur** | Le payload cible un seul `villageId` — aucun champ destination village/joueur n'existe. La conversion reste strictement intra-village, contrairement à la caravane (cf. [`02-economy-and-progression.md` § Caravane](./02-economy-and-progression.md#caravane-de-ressources-entre-ses-propres-villages)). |
| **Ownership server-authoritative** | Le village doit appartenir à l'appelant (`OwnershipService.assertVillageOwnedBy`). |
| **Monde en lecture seule bloqué** | Mutation refusée sur un monde `ENDED`/`ARCHIVED` (`assertWorldWritable`). |
| **Destination pleine → refus avant débit** | La capacité de l'Entrepôt destination est vérifiée **avant** tout débit de la source. Un entrepôt plein rejette l'action en 4xx — aucune valeur n'est détruite. |
| **Concurrence** | Transaction isolation `Serializable` + retry, plafond quotidien appliqué via un `updateMany` conditionnel sur la ligne du jour (idiome identique à l'extraction de ressources) — deux requêtes concurrentes ne peuvent ni dépasser le plafond ni créer une ligne dupliquée. |

## Surface

- **Pas de bâtiment dédié** — le `MARKET` du ticket 12 est écarté au profit d'une action HUD directe dans l'écran ressources.
- **Endpoint** : `POST /resources/:villageId/convert`. Hébergé par `GameplayModule` (pas `ResourcesModule`) pour éviter un cycle `ResourcesModule ↔ GameplayModule` via `EventModule` — voir le commentaire du contrôleur [`resource-exchange.controller.ts`](../../battleforthecrown-backend/src/modules/gameplay/resource-exchange.controller.ts).
- **Use-case** : [`convert-resources.use-case.ts`](../../battleforthecrown-backend/src/modules/gameplay/convert-resources.use-case.ts).
- **Event temps réel** : réutilise `resources.changed` (aucun nouveau schéma d'event) — cf. [`docs/architecture/realtime.md`](../architecture/realtime.md).
- **Persistance du plafond quotidien** : table Prisma `ResourceConversionDaily` — détail entité dans [`docs/architecture/data-model.md`](../architecture/data-model.md).

## Hors scope MVP

- Marché joueur-joueur (`MARKET`) — reste **post-MVP**, cf. [`lab/tickets/12-player-resource-market.md`](./lab/tickets/12-player-resource-market.md) pour les risques non résolus.
- Transfert inter-village de ressources converties (couvert par la caravane existante, pas par l'échange royal).
- Taxe/frais variable ou taux ajustable par monde — le taux est une constante partagée, pas un paramètre `WorldConfig`.
