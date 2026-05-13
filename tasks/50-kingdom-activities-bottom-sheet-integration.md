# 50 — Intégration HUD et bottom sheet des activités du royaume

**Sévérité** : 🟡 Majeure

**Statut** : 🆕 Ouvert

**Décision UX** : la carte doit afficher un ou deux badges d'activités en haut de map. Cliquer sur un badge ouvre la même bottom sheet `Activités du royaume`, avec l'onglet correspondant actif.

## Dépendances

- Ticket 48 terminé : composants design-system disponibles.
- Ticket 49 terminé : snapshots serveur captures + expéditions disponibles.

## Objectif

Brancher la maquette dans l'app Pixi réelle :

- badge `Captures N` si `N > 0` ;
- badge `Expéditions N` si `N > 0` ;
- badges alignés quand les deux compteurs existent ;
- clic badge `Captures` ouvre la bottom sheet sur l'onglet `Captures` ;
- clic badge `Expéditions` ouvre la bottom sheet sur l'onglet `Expéditions` ;
- le panneau affiche les listes réelles et leurs états loading/error/empty.

## Données frontend

Ajouter les hooks TanStack Query :

```ts
queryKeys.openConquests(userId, worldId)
useOpenConquestsQuery()

queryKeys.openExpeditions(userId, worldId)
useOpenExpeditionsQuery()
```

Règles :

- les badges lisent les counts depuis les queries ;
- la bottom sheet lit les listes depuis les mêmes queries ;
- aucun état local ne doit survivre si le snapshot serveur dit que la liste est vide ;
- les events WS invalident/refetch les queries concernées ;
- polling raisonnable autorisé tant qu'il y a des activités ouvertes, comme pour les expéditions actuelles.

## UI

- Réutiliser les composants du ticket 48.
- Remplacer l'ancienne présentation stone `ExpeditionList` dans la bottom sheet par `Activités du royaume`.
- Garder les actions existantes nécessaires, notamment `Rappeler` pour une attaque rappelable si le design final l'expose.
- Les états vides doivent rester discrets :
  - `Aucune expédition active.`
  - `Aucune capture en cours.`
- Les erreurs doivent être compactes et permettre un retry.
- Le badge expéditions couvre attaques, renforts et espionnage actifs.

## Placement

MVP recommandé :

- visible sur la carte monde ;
- acceptable dans le shell global si le coût d'intégration est faible ;
- ne pas ajouter un nouvel écran plein `Conquêtes`.

## Hors scope

- Refonte de l'inbox/messages.
- Historique des captures.
- Annulation volontaire de capture.
- Nouveau système de notifications push/offline.
- Refonte complète de `BottomNavigationBar`.

## Critères de succès

- Avec 3 captures ouvertes, le badge `Captures 3` apparaît et ouvre l'onglet captures.
- Avec 2 expéditions actives, le badge `Expéditions 2` apparaît et ouvre l'onglet expéditions.
- Si les deux compteurs existent, les deux badges s'alignent proprement.
- Si un compteur passe à 0 après event + refetch, son badge disparaît.
- Après reload, les listes se reconstruisent depuis les snapshots serveur.
- Les invalidations WS ne créent pas de doublons visuels.

## Tests attendus

- Tests frontend hooks + mapping DTO vers view-model.
- Tests frontend invalidations WS captures et expéditions.
- Tests composants pour loading/error/empty/list.
- `yarn static-check`.
- Inspection navigateur du flow badge → bottom sheet.
