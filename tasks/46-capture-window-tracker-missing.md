# 46 — Tracker persistant des captures en cours

**Sévérité** : 🟡 Majeure

**Statut** : 🧩 Découpé

**Décision produit** : une capture ouverte est un état long, critique et réhydratable. `PendingConquest` doit rester la source de vérité, l'UI ne doit pas reconstruire cet état uniquement depuis les events WS.

## Découpage retenu

Ce ticket ne doit plus être exécuté directement. Il est découpé en trois tickets ordonnés :

1. [48 — Design-system du panneau Activités du royaume](./archive/48-kingdom-activities-design-system.md)
2. [49 — Snapshots serveur des activités du royaume](./49-kingdom-activities-snapshots.md)
3. [50 — Intégration HUD et bottom sheet des activités du royaume](./50-kingdom-activities-bottom-sheet-integration.md)

Pourquoi ce découpage :

- la maquette couvre désormais captures et expéditions dans un même panneau ;
- le badge haut de carte nécessite des compteurs réhydratables ;
- les expéditions doivent être comptées au niveau royaume, pas seulement depuis le village actif ;
- la migration design-system doit précéder l'intégration app pour éviter de re-coder deux fois la bottom sheet.

## Symptôme

Le run 019 rend la conquête barbare lançable et lisible :

- durée de capture affichée avant lancement ;
- CTA `Lancer conquête` quand un Noble est sélectionné ;
- toasts WS pour fenêtre ouverte, réussite, interruption, mort du Noble ;
- invalidations store/query sur les events.

Mais l'état "capture en cours" n'a pas encore d'UI persistante. Si le joueur recharge l'app après `village.capture-window-opened`, le toast est perdu et l'interface ne peut pas reconstruire les captures ouvertes.

## Pourquoi

Une capture dure de 2 h à 12 h. C'est trop long pour être traité comme un feedback transitoire.

Le joueur doit pouvoir répondre à trois questions sans dépendre d'un toast passé :

- Quelle capture est en cours ?
- Où est le Seigneur immobilisé ?
- Combien de temps reste-t-il avant réussite ou risque d'interruption ?

Sans snapshot serveur, l'UI ne peut pas distinguer :

- aucune capture ;
- capture ouverte mais event manqué ;
- capture déjà terminée/interrompue pendant que le joueur était offline.

## Solution attendue

### 1. Backend — endpoint snapshot canonique

Ajouter un endpoint de lecture des captures ouvertes pour le joueur courant.

Route recommandée :

```http
GET /combat/conquests/open
```

Pourquoi cette route :

- la capture est déclenchée par le combat ;
- elle peut concerner plusieurs villages attaquants ;
- l'écran/HUD doit pouvoir afficher toutes les captures du joueur, pas seulement celles du village actuellement sélectionné.

DTO recommandé :

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

Règles :

- filtrer par `attackerUserId = currentUser.id` ;
- ne retourner que `status = OPEN` ;
- inclure les métadonnées cible utiles à l'UI sans obliger le frontend à recroiser la carte ;
- trier par `captureUntil ASC`.

Extension future à garder facile :

- ajouter plus tard `GET /combat/conquests?status=open|completed|interrupted` pour historique ;
- ajouter un champ `kind: 'BARBARIAN' | 'PVP'` quand la conquête PvP sera implémentée ;
- ajouter `interruptionReason` uniquement pour les statuts terminaux, pas dans le DTO `OPEN` MVP.

### 2. Frontend — query source of truth

Ajouter un hook TanStack Query :

```ts
queryKeys.openConquests(userId, worldId)
useOpenConquestsQuery()
```

Règles :

- afficher l'état depuis cette query, pas depuis un store local ad hoc ;
- les events WS invalident/refetch la query ;
- aucun état frontend ne doit survivre si le snapshot serveur dit qu'il n'y a plus de capture ouverte.

Events qui doivent invalider :

- `village.capture-window-opened`
- `village.capture-window-completed`
- `village.capture-window-interrupted`
- `village.conquered`
- `noble.killed`

### 3. UI — tracker de captures en cours

Ajouter une vue persistante "Captures en cours" accessible depuis le HUD.

Placement recommandé MVP :

- intégrer dans le panneau `Expéditions` existant, ou dans un onglet voisin du même bottom sheet ;
- ne pas créer un écran plein dédié tant qu'il n'y a pas d'historique ou de gestion avancée.

Comportement :

- si aucune capture : ne pas afficher de bruit permanent dans le HUD ;
- si au moins une capture : afficher un indicateur/badge dans le HUD et une liste dans le panneau ;
- chaque item affiche cible, coordonnées, tier, village attaquant, temps restant, fin prévue.

## Composant à designer

### Nom fonctionnel

`CaptureWindowTracker`

### Forme

Une liste compacte de cartes, pas une modale plein écran.

Elle doit fonctionner dans :

- bottom sheet mobile ;
- panneau desktop compact ;
- éventuellement future sidebar "Activités".

### Item `CaptureWindowCard`

Contenu obligatoire :

- titre cible : `Village barbare T3` ou nom réel si disponible ;
- coordonnées : `259|242` ;
- tier : badge `T1` à `T5` ;
- village d'origine : `Depuis Royaume de ...` ;
- temps restant : valeur principale, ex. `3h 42m` ;
- fin prévue : valeur secondaire, ex. `Fin à 21:18` ;
- statut : `Capture en cours`.

État visuel :

- normal : capture ouverte ;
- bientôt terminé : seuil visuel à définir, recommandé `< 15 min` ;
- terminé/interrompu : pas nécessaire en persistant MVP si l'item disparaît après refetch, mais prévoir une variante transitoire si l'event arrive pendant que le panneau est ouvert.

Actions MVP :

- `Voir sur la carte` : recentre/sélectionne la cible si l'écran carte est disponible ;
- pas de bouton d'annulation : la spec ne prévoit pas d'annuler volontairement une capture.

Contraintes UI :

- lisible à une main sur mobile ;
- ne pas mélanger avec les formations de troupes ;
- ne pas utiliser seulement un toast ;
- éviter une métaphore de "queue de construction" : c'est un état territorial exposé au risque PvP, pas une production interne.

### États vides/erreur/loading

- Loading discret : spinner ou skeleton d'une ligne.
- Empty : texte court dans le panneau, ex. `Aucune capture en cours`.
- Error : message compact + retry, sans bloquer le reste du HUD.

## Hors scope

- Historique des captures terminées.
- Capture PvP.
- Annulation volontaire d'une capture.
- Notifications push/offline.
- Design d'un écran plein "Conquêtes".
- Simulation locale d'une capture si le backend ne la retourne pas.

## Critères de succès

- Après reload, une capture ouverte avant reload est visible sans attendre un nouvel event WS.
- Le tracker affiche cible, coordonnées, tier, village d'origine, temps restant et fin prévue.
- Une capture terminée/interrompue disparaît ou passe transitoirement en état terminal après event + refetch.
- `PendingConquest` reste la source de vérité ; pas de source de vérité frontend concurrente.
- Les events WS ne créent pas de doublon visuel.
- Le tracker reste compatible multi-captures.
- Le design reste extensible vers historique, PvP et notifications plus tard.

## Tests attendus

- Backend :
  - endpoint ne retourne que les captures `OPEN` du user courant ;
  - tri par `captureUntil ASC` ;
  - pas de fuite des captures d'autres joueurs.
- Frontend :
  - query + rendu état empty/loading/error/list ;
  - calcul temps restant depuis `captureUntil` ;
  - invalidation sur events WS concernés.
- Vérification finale :
  - `yarn static-check` vert ;
  - smoke backend si le endpoint touche `battleforthecrown-backend/src/`.
