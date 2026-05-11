# 42 — Hook `combat.worker` post-résolution conquête (ouverture fenêtre + cas escorte-survivante)

**Sévérité** : 🟠 Majeur (cas spec 10 § "armée gagne mais Seigneur meurt" non géré + `ConquestService` orphelin)
**Statut** : 🆕 Ouvert 2026-05-10 (issue de [run 006](./runs/archive/006-audit-conquest.md))
**Spec amont** : [`docs/gameplay/10-conquest.md` § Devenir « Seigneur du village conquis »](../docs/gameplay/10-conquest.md#devenir---seigneur-du-village-conquis-) + [`10-conquest.md` § Cas particulier escorte-survivante](../docs/gameplay/10-conquest.md#cas-particulier--armée-gagne-le-combat-de-pré-conquête-mais-le-seigneur-meurt) + [`04-combat.md` § Conquête](../docs/gameplay/04-combat.md#conquête)

## Symptôme

Le `ConquestService` (`conquest.service.ts`) expose `conquerVillage(...)` mais **aucun caller ne l'invoque** — `grep -r 'conquerVillage' battleforthecrown-backend/src/` retourne 0 hit. Le hook post-résolution du combat n'a jamais été codé.

Conséquences :
- Une attaque réussie n'a aucun effet de conquête, même si l'attaquant a un Seigneur survivant.
- Le cas spec 10 « armée gagne mais Seigneur meurt → conquête échouée + loot ramené » n'a pas de chemin (le combat retourne le loot par défaut, ce qui correspond ; mais pas de signal explicite « tentative de conquête échouée »).

## État actuel

- `combat.worker.ts` (`battleforthecrown-backend/src/modules/combat/`) — résout le combat, calcule pertes/loot, émet `battle.resolved`, déclenche `ReturnWorker`. Pas de branche conquête.
- `return.worker.ts` — gère le retour des troupes (loot + survivors) vers le village d'origine. Pas de branche conquête.
- `ConquestService.conquerVillage` — orphelin, transfert immédiat (à terme appelé par worker `conquest-finalize`, voir #41).
- Aucune notion de « cette attaque embarque un Seigneur » au niveau du `Combat` ou de l'`Army` Prisma — l'inventaire des unités embarquées est dans `Army.units`.

## Scope d'implémentation (estimation 50-100 lignes net)

### Détection « tentative de conquête »

Une expédition est une « tentative de conquête » si l'`Army` de l'attaquant contient au moins 1 NOBLE au départ. Pas besoin d'un nouveau champ Prisma : `army.units.find(u => u.unitType === 'NOBLE' && u.quantity > 0)`.

### Branche post-résolution (dans `combat.worker.ts` ou nouveau helper)

Après la résolution combat, **avant** le `ReturnWorker` :

```
si (attaque réussie ET army contenait NOBLE au départ):
  si (NOBLE survivant dans army.units):
    → ouvrir PendingConquest (ticket #41)
       - immobiliser le Seigneur : retirer de army.units survivants (n'embarque pas dans le retour)
       - calculer captureUntil selon contexte (tier barbare / PvP)
       - émettre village.capture-window-opened
    → ReturnWorker prend le reste de l'escorte (sans NOBLE) + loot
  sinon (NOBLE mort):
    → conquête échouée
    → émettre noble.killed (nouvel event Outbox, payload: { villageId, attackerUserId })
    → ReturnWorker classique : escorte survivante + loot
```

### Hook fenêtre interruptible

Si un combat hostile est résolu sur un village où `PendingConquest.status === OPEN` ET que le combat tue le Seigneur attaquant immobilisé :
- Appeler `ConquestService.interruptCaptureWindow(targetVillageId, 'noble-killed-during-window')` (helper du ticket #41).
- Le Seigneur immobilisé fait partie de la garnison défensive du village cible pendant la fenêtre — donc il prend les pertes du combat subi. Voir spec 10 § « Si la conquête est interrompue (combat perdu pendant la fenêtre de capture), le Seigneur meurt avec le reste de la garnison attaquée. »

### Refactor `ConquestService.conquerVillage`

L'implémentation actuelle (transfert immédiat) reste correcte mais devient **terminale** : appelée seulement par `conquest-finalize.worker` (ticket #41), jamais directement depuis le combat.

### Events Outbox à créer

- `noble.killed` — payload `{ attackerVillageId, attackerUserId, combatId }`. Permet au frontend d'afficher une notif spéciale.

### Durées par tier

Ce ticket n'embarque pas les durées (PvE = ticket #41 § « Durées par contexte » + spec 13 ; PvP = spec 14). Il prend la durée comme **paramètre fourni par le caller** (combat worker passe `tierDurationMs` en argument à l'ouverture).

## Tests

- Smoke (vraie DB + pg-boss + Outbox) : 3 scénarios :
  1. Attaque réussie avec Seigneur survivant → `PendingConquest` créé, event `village.capture-window-opened`.
  2. Attaque réussie avec Seigneur mort → pas de `PendingConquest`, escorte rentre avec loot, event `noble.killed`.
  3. Attaque hostile pendant fenêtre + Seigneur défenseur tué → `PendingConquest.status = INTERRUPTED`, event `village.capture-window-interrupted`.
- Pure-logic : aucun helper extractible évident — orchestration pure.

## Tradeoff scope

≈ 1 jour dev. Dépend de **#40** (sans Seigneur recrutable, le scénario ne peut pas être testé end-to-end) et **#41** (`PendingConquest` n'existe pas tant que le ticket n'est pas livré). Ordre recommandé : #40 → #41 → #42.

## Questions à trancher au démarrage

1. Immobilisation du Seigneur : l'enlever de l'`UnitInventory` du village attaquant (il est physiquement chez la cible) vs marquer un champ « in-conquest ». Recommandation : le retirer de l'inventaire, le restaurer si interruption (rollback) — non, en cas d'interruption le Seigneur **meurt** (spec 10), donc pas de rollback. Le retirer simplement.
2. La spec dit « le Seigneur fait partie des pertes de l'attaquant » dans le cas escorte-survivante : à confirmer dans la table de pertes générée par `combat-strategies` — le NOBLE est-il filtrable ? Vérifier au démarrage.
