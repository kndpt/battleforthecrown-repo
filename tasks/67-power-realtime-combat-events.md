# 67 — Réactivité temps réel de la puissance après combat

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Spec amont** : [`docs/gameplay/09-power-and-rankings.md`](../docs/gameplay/09-power-and-rankings.md) (réactivité WS actée par run 022).

## Symptôme

Quand le joueur attaque quelqu'un ou se fait attaquer, la puissance affichée dans le HUD top (`GameHeader`) et dans la modale `PowerBottomSheet` ne baisse pas — il faut **F5** pour voir la nouvelle valeur. La puissance backend est correcte (l'inventaire est bien décrémenté à la résolution combat), c'est uniquement le **wiring WS frontend** qui manque.

Le pattern équivalent pour le **recrutement** (`unit.trained`) et la **construction** (`building.completed`) a déjà été câblé par le run archivé [`022-fix-power-realtime-reactivity`](./runs/archive/022-fix-power-realtime-reactivity.md). Ce ticket étend strictement le même pattern aux events combat.

## Cause racine probable

`battleforthecrown-pixi/src/api/ws-bindings.ts` traite déjà les events combat (handlers présents, autres invalidations OK) mais **n'appelle pas `invalidatePowerQueries`** (helper créé par run 022, l. 418-422) dans :

- `applyBattleResolved` (l. 156-190) — l'attaquant perd les unités mortes au combat, sa puissance baisse.
- `applyVillageAttacked` (l. 384-398) — le défenseur perd les unités mortes en défense, sa puissance baisse.
- `applyVillageConquered` (l. 424+) — le village change de propriétaire, le nouveau proprio gagne en puissance royaume.
- `applyBattleReturned` (l. 192-200) — à évaluer : probablement no-op puissance (les survivants rentrent sans changement d'inventaire net). À documenter en commentaire si on n'invalide pas.

## Comportement attendu

- Après un combat sortant (`battle.resolved`) avec pertes attaquantes, la puissance village + royaume baisse **sans F5** dans `GameHeader` et `PowerBottomSheet`.
- Après un combat entrant (`village.attacked`) avec pertes défenseuses, la puissance village défenseur + royaume baisse **sans F5**.
- À la conquête (`village.conquered`), la puissance royaume du nouveau propriétaire est rafraîchie **sans F5**.

## Scope recommandé

### Frontend

- `battleforthecrown-pixi/src/api/ws-bindings.ts` :
  - Ajouter `invalidatePowerQueries(ctx, payload.villageId)` dans `applyBattleResolved`.
  - Ajouter `invalidatePowerQueries(ctx, payload.defenderVillageId)` dans `applyVillageAttacked`.
  - Ajouter `invalidatePowerQueries(ctx, payload.villageId)` dans `applyVillageConquered`.
  - Vérifier `applyBattleReturned` : si butin/ressources impactent la formule power, invalider aussi ; sinon laisser tel quel et commenter le choix.

### Tests

- `battleforthecrown-pixi/src/api/ws-bindings.test.ts` : 3 nouveaux cas vérifiant que `invalidateQueries` est appelé sur `villagePower(villageId)` + `kingdomPower(userId)` pour `battle.resolved`, `village.attacked`, `village.conquered`.

### Docs

- Aucun changement attendu : le pattern realtime power est déjà documenté dans [`docs/architecture/realtime.md`](../docs/architecture/realtime.md) et [`docs/gameplay/09-power-and-rankings.md`](../docs/gameplay/09-power-and-rankings.md) par le run 022. À confirmer en fin de run.

## Points d'attention

- **`village.conquered` et ancien propriétaire** : l'ancien proprio doit voir son `kingdomPower` baisser. Vérifier en cartographie code si `village.attacked` est bien émis **avant** `village.conquered` côté backend (auquel cas l'invalidation de l'ancien proprio est déjà couverte). Sinon, le payload `village.conquered` devra contenir l'ancien `userId` et on invalidera explicitement son `kingdomPower`.
- **`battle.returned`** : à confirmer no-op puissance. Si le butin transféré au retour impacte la formule power (peu probable mais à vérifier dans le module backend `power`), il faut invalider aussi sur cet event.
- **Payloads** : confirmer que `BattleResolvedPayload`, `VillageAttackedPayload`, `VillageConqueredPayload` exposent bien les `villageId` nécessaires (l'utilisation existante dans les handlers laisse penser que oui).

## Critères de succès

- [ ] `invalidatePowerQueries` appelé dans `applyBattleResolved`, `applyVillageAttacked`, `applyVillageConquered`.
- [ ] `applyBattleReturned` traité (no-op documenté ou invalidation ajoutée selon la cartographie).
- [ ] `ws-bindings.test.ts` couvre les 3 nouveaux cas via spy sur `queryClient.invalidateQueries`.
- [ ] `yarn static-check` + `yarn test:pixi` verts.
- [ ] QA IG fournie au user : checklist 3 scénarios (attaque sortante avec pertes / attaque entrante avec pertes / conquête) pour observer la puissance baisser sans F5 dans `GameHeader` + `PowerBottomSheet`.

## Références

- Précédent direct : [`tasks/runs/archive/022-fix-power-realtime-reactivity.md`](./runs/archive/022-fix-power-realtime-reactivity.md) — pattern source (training + building).
