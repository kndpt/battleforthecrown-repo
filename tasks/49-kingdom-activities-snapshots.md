# 49 — Snapshots serveur des activités du royaume

**Sévérité** : 🟡 Majeure

**Statut** : 🆕 Ouvert

**Décision produit** : les badges et la bottom sheet d'activités doivent se réhydrater depuis le serveur. Les events WS invalident les snapshots, mais ne sont pas la source de vérité.

## Contexte

Le ticket 46 demandait déjà `GET /combat/conquests/open` pour les captures ouvertes.

Le nouveau panneau regroupe aussi les expéditions. Or l'API actuelle expose seulement :

```http
GET /combat/:villageId/active
```

Ce contrat est village-scoped. Il suffit pour l'écran armée courant, mais pas pour un badge haut de carte qui doit compter toutes les attaques, renforts et espionnages actifs du joueur sur le royaume.

## Objectif

Ajouter les snapshots serveur nécessaires au panneau `Activités du royaume` :

1. captures ouvertes du joueur courant ;
2. expéditions actives du joueur courant sur le monde courant.

## Routes recommandées

```http
GET /combat/conquests/open
GET /combat/expeditions/open
```

Pourquoi deux routes :

- les captures sont portées par `PendingConquest` ;
- les expéditions sont portées par `Expedition` ;
- le frontend peut invalider/refetch chaque source sans créer un DTO agrégé prématuré.

## DTO capture recommandé

```ts
interface OpenConquestDto {
  pendingConquestId: string;
  attackerVillageId: string;
  attackerVillageName: string;
  targetVillageId: string;
  targetName: string;
  targetX: number;
  targetY: number;
  targetTier: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | null;
  captureStartedAt: string;
  captureUntil: string;
  status: 'OPEN';
}
```

## DTO expédition recommandé

```ts
interface OpenExpeditionDto {
  expeditionId: string;
  kind: 'ATTACK' | 'REINFORCE' | 'SCOUT';
  attackerVillageId: string;
  attackerVillageName: string;
  targetVillageId: string | null;
  targetName: string | null;
  targetX: number;
  targetY: number;
  targetKind: string;
  departAt: string;
  arrivalAt: string;
  returnAt: string | null;
  status: 'EN_ROUTE' | 'RESOLVED' | 'RETURNING';
  recalled: boolean;
}
```

## Règles

- Filtrer par joueur courant, pas par village actif seulement.
- Filtrer par monde courant si le modèle ne le déduit pas sans ambiguïté.
- Ne retourner que les états ouverts/actifs.
- Trier par prochaine échéance ascendante :
  - `captureUntil ASC` pour captures ;
  - `arrivalAt` ou `returnAt` selon phase pour expéditions.
- Inclure les métadonnées minimales pour éviter au frontend de recroiser toute la carte.
- Préserver `GET /combat/:villageId/active` tant que les écrans existants l'utilisent.

## Events qui doivent invalider côté frontend

Captures :

- `village.capture-window-opened`
- `village.capture-window-completed`
- `village.capture-window-interrupted`
- `village.conquered`
- `noble.killed`

Expéditions :

- `battle.resolved`
- `battle.returned`
- `expedition.recalled`
- `reinforcement.arrived`
- `reinforcement.returned`
- events scout existants liés au départ, retour ou rapport.

## Hors scope

- UI React.
- Port de la maquette.
- Historique des captures ou expéditions terminées.
- Endpoint agrégé unique `activities`.

## Critères de succès

- Après reload, les captures ouvertes sont retournées sans attendre un event WS.
- Après reload, les attaques, renforts et espionnages actifs du joueur sont retournés sans dépendre du village sélectionné.
- Les endpoints ne fuitent pas les captures ou expéditions d'autres joueurs.
- Les résultats sont multi-villages et triés par échéance.
- Les endpoints restent compatibles avec la future intégration tabs/badges.

## Tests attendus

- Tests backend du filtrage user/world.
- Tests backend du tri.
- Tests backend multi-villages.
- Smoke backend si les routes touchent `battleforthecrown-backend/src/`.
- `yarn static-check`.
