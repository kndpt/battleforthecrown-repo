# 21 — Décalage visuel entre fin extrapolée et disparition de la file d'entraînement

**Statut** : ✅ Résolu le 2026-05-08
**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-pixi`
**Tags** : ux, realtime, outbox, training
**Origine** : observé en QA pendant la résolution du [ticket 11 (optimistic UI)](./11-pixi-optimistic-ui-asymmetric.md).

## Résolution

**Piste A (polling actif côté frontend)** retenue. Pas touché à l'archi Outbox — refuser la piste B ("émettre l'event direct dans `TrainingWorker`") qui aurait cassé l'atomicité du pattern Outbox (`workers.md` : *"si la mutation échoue, l'event n'est pas créé"*).

`UnitCard.tsx` : un `useEffect` dépendant du `now` du `useTickingNow(1_000)` détecte la condition "fin extrapolée mais file pas encore retirée" :

```ts
const overdue = now - Date.parse(training.createdAt) >= totalDurationMs;
if (overdue && training.completedQty < training.totalQty) {
  queryClient.invalidateQueries({ queryKey: queryKeys.armyTraining(villageId) });
}
```

Effet : tant que la condition tient, on déclenche une `invalidateQueries` toutes les ~1 s (cadence du tick). Le refetch ramène l'état serveur à jour ; dès que la `TrainingQueue` est supprimée côté DB, `training` devient `undefined`, l'effet n'a plus de matière, le polling s'arrête naturellement.

**Bornes du décalage résiduel** : ~1 s pg-boss + ~0–1 s outbox poll + ~100 ms refetch ≈ **0–2 s** au lieu de **1–4 s** (la borne haute coupée car le frontend force le refetch avant qu'il arrive par WS). UX acceptable même sur mondes rapides (multiplier × 100).

Pas de clamp visuel à 99 % — la barre conserve l'animation à 100 % comme post-ticket 11, le polling masque le délai. Pas de modification backend.

## Symptôme

Quand un entraînement se termine, l'`UnitCard` affiche `10/10`, "Prochaine dans 0:01", barre pleine, puis **reste figé pendant ~4-5 secondes** avant que la file disparaisse et que l'inventaire passe à +N. Le bouton "En cours…" reste désactivé pendant ce délai.

Capture utilisateur observée : 15 milices déjà visibles dans "Vos troupes" (donc le serveur a déjà commit les unités), mais la file d'entraînement est encore là à `10/10`.

## Localisation

- `battleforthecrown-pixi/src/features/army/UnitCard.tsx:108-120` — calcul de `progress`, `displayedCompletedQty`, `totalRemainingMs` extrapolé localement depuis `training.createdAt + N × timePerUnitMs`.
- `battleforthecrown-backend/src/workers/training.worker.ts` — finalisation training (job pg-boss), suppression de la `TrainingQueue`, écriture `unit.training.completed` dans `EventOutbox`.
- `battleforthecrown-backend/src/workers/outbox.worker.ts` — poll ~1 s, diffusion via Socket.IO.
- `battleforthecrown-pixi/src/api/ws-bindings.ts:79-92` — handler `unit.training.completed` qui invalide la file et l'inventaire (depuis fix ticket 11).

## Détail technique

Le frontend extrapole la fin "côté visuel" à `createdAt + totalQty × timePerUnitMs` (cf résolution ticket 11). Côté serveur, la chaîne réelle pour faire disparaître l'entry est :

1. **pg-boss exécute le job training** au `nextUnitEta` de la dernière unité (poll par défaut ~1-2 s).
2. **`TrainingWorker.handle`** supprime la `TrainingQueue` + écrit `unit.training.completed` dans `EventOutbox`, en transaction.
3. **`OutboxWorker` poll ~1 s**, lit l'event, le diffuse via gateway, marque `processedAt`.
4. **Le frontend reçoit l'event WS**, exécute `applyUnitTrainingCompleted` → `invalidateQueries(armyTraining/Inventory/population)` → refetch REST → la file disparaît, l'inventaire augmente.

Coût cumulé : 1-3 s (pg-boss) + 0-1 s (outbox poll) + ~100 ms (refetch) ≈ **1-4 s de décalage** entre la fin visuelle frontend et la disparition de la file. Borne haute observée : 4-5 s.

## Impact

- **UX trompeuse** : la barre dit "fini" mais le bouton "Entraîner" reste indisponible. Le joueur peut croire que l'app est figée ou que le serveur n'a pas répondu.
- **Plus visible avec multiplier élevé** : sur les mondes rapides (multiplier × 30+), un training de 3 milices dure ~3 s côté visuel, mais le décalage représente ~100 % du temps perçu d'entraînement.
- **Sans incidence fonctionnelle** : la donnée DB est cohérente, l'inventaire reflète bien les unités produites — c'est purement visuel.

## Contexte

Bug latent **avant** la résolution du ticket 11 : le `staleTime: 2_000` de `useArmyTrainingQuery` faisait un refetch passif qui rendait le décalage moins frappant. Une fois l'extrapolation locale en place (fix ticket 11 sur la progress bar figée), la barre arrive vraiment à 100 % au moment théorique, et le décalage entre "barre pleine" et "file qui disparaît" est désormais saillant.

## Pistes à explorer

- **Clamp visuel à 99 %** tant que `training.completedQty < totalQty` (la barre n'atteint jamais 100 % avant que le serveur confirme).
- **Re-fetch agressif** quand l'extrapolation atteint 100 % : déclencher un `invalidateQueries` côté frontend si `now ≥ createdAt + totalDurationMs` et `training.completedQty < totalQty`. Polling actif tant que la file n'a pas été retirée.
- **Réduire le délai serveur** :
  - Faire émettre l'event Outbox **directement par le `TrainingWorker`** sans dépendre du polling Outbox (gain ~0-1 s).
  - Réduire l'intervalle de poll Outbox (gain ~0-1 s, mais charge DB).
  - `pg-boss` `newJobCheckIntervalSeconds` plus court côté training (gain ~1 s, charge DB).
- **Supprimer l'extrapolation** et revenir à un affichage qui ne dépasse pas `completedQty` côté DB. La progress bar redeviendrait figée à `0/N` jusqu'à la fin (régression UX vs ticket 11).

## Tickets liés

- [11 — Optimistic UI asymétrique](./11-pixi-optimistic-ui-asymmetric.md) — ticket d'origine, résolution en a révélé le décalage.

## Dimensions à valider en sortie

- Décision : clamp visuel à 99 %, polling actif côté frontend, optimisation backend, ou combinaison.
- Mesure du décalage actuel sur un monde de prod (multiplier réel) avant et après fix.
- Cohérence avec les autres workers Outbox (construction, combat) qui ont probablement le même pattern de décalage.
