# 34 — Rappel d'armée pendant l'aller : non implémenté

**Sévérité** : 🟠 Majeur (feature spec MVP manquante — règle globale du combat)
**Statut** : ✅ Terminé 2026-05-10 (par $run @tasks/34-army-recall-missing.md)

## Symptôme

[`docs/gameplay/04-combat.md` § Mécanique générale](../docs/gameplay/04-combat.md#mécanique-générale) précise :

> **Rappel pendant l'aller** : le joueur peut rappeler son armée à tout moment **avant l'arrivée**. Le demi-tour se fait à la position actuelle : le temps de retour est égal au temps déjà parcouru depuis le départ. Aucune perte, aucun loot (pas de combat). S'applique à tous les trajets sortants : raids, conquêtes (Seigneur compris), scouts. Pas de rappel sur le retour.

`grep -r 'recall\|cancel.*expedition\|abort.*expedition'` côté backend → **0 hit**. Aucun endpoint, aucune transition `EN_ROUTE → RETURNING` à demi-tour, aucun re-scheduling pg-boss.

## État actuel

Audit run 004 :
- `combat.controller.ts` n'expose pas de `POST /combat/recall/:expeditionId`.
- `Expedition.status` (Prisma) supporte `EN_ROUTE | RETURNING` mais aucune transition pilotée par action user — uniquement par le worker arrivée.
- pg-boss : le job `combat:resolve` est planifié au dispatch avec `startAfter: arrivalAt`. Aucun mécanisme pour le **canceler** côté code (pg-boss expose `cancel(jobId)` mais on ne stocke pas le jobId).

## Scope d'implémentation (estimé ~ 30 lignes net + tests + endpoint)

### Endpoint

- `POST /combat/recall/:expeditionId`.
- Validation : `OwnershipService.assertVillageOwnedBy(expedition.attackerVillageId)`.
- Refuser si `expedition.status !== 'EN_ROUTE'` (déjà revenue ou résolue).

### Logique métier

```ts
// pseudocode
const elapsed = Date.now() - expedition.dispatchedAt.getTime();
const returnAt = new Date(Date.now() + elapsed); // demi-tour à la position actuelle

await prisma.$transaction(async (tx) => {
  // Cancel le job combat:resolve planifié
  await this.boss.cancel(`resolve:${expeditionId}`); // singletonKey utilisé au dispatch

  await tx.expedition.update({
    where: { id: expedition.id },
    data: { status: 'RETURNING', returnAt, recalled: true },
  });

  await this.boss.send('combat:return', { expeditionId }, {
    startAfter: returnAt,
    singletonKey: `return:${expedition.id}`,
  });

  await createOutboxEvent(tx, 'expedition.recalled', expedition.attackerVillageId, {
    expeditionId, returnAt: returnAt.toISOString(),
  });
});
```

### return.worker

- Lecture du flag `expedition.recalled` (à ajouter sur le modèle `Expedition`).
- **Skip** la création d'un combat report (pas de combat eu lieu, pas de pertes).
- Réinjecter l'armée intégrale (pas de soustraction de pertes), pas de loot.

### Frontend (hors scope ticket — pour info)

- Bouton « Rappeler » sur la carte/HUD pour toute expédition `EN_ROUTE`.
- Réception event `expedition.recalled` → recalculer affichage retour.

## Pré-requis schema Prisma

- Ajouter `Expedition.dispatchedAt` (si absent — auditer le schéma actuel ; possiblement déjà présent comme `createdAt`).
- Ajouter `Expedition.recalled: Boolean @default(false)` (sinon : flag dans `details` JSON, mais explicite > implicite).

## Tests

- **Unit** : helper pure-logic `computeRecallReturnTime(dispatchedAt, now)` si extrait → 1 test par case (parfaitement à mi-chemin, juste après dispatch, juste avant arrivée).
- **Smoke** : flow REST `attack → recall → return.worker` (vraie DB, expedition supprimée, troupes restituées sans loot, pas de combatReport créé).

## Tradeoff scope

Feature autonome ~ 0,5-1 jour dev. À implémenter **avant** la conquête PvP (Phase 4) car la spec [`14-pvp-conquest.md`](../docs/gameplay/14-pvp-conquest.md) compte sur le rappel comme outil défensif clé. Couplé naturellement au ticket [33](./33-reinforcements-inter-villages-missing.md) — même mécanique de demi-tour.

## Question à trancher au démarrage

- Cancel pg-boss : utiliser `boss.cancel(singletonKey)` (nécessite que le `singletonKey` ait été passé au dispatch initial — vérifier `combat.service.ts:159`). Si non, fallback : laisser le job `combat:resolve` se déclencher mais court-circuiter en lisant `expedition.status === 'RETURNING'` au début du handler.
- Est-ce qu'un raid déjà arrivé (job en cours d'exécution) est rappelable ? **Non** — la spec dit « avant l'arrivée ». Refuser si `Date.now() >= expedition.arrivalAt`.

## Rapport final

L'armée peut désormais être rappelée pendant le trajet aller.
- Ajout du champ `recalled` dans Prisma.
- Implémentation de `recallEnRoute` dans `CombatService` avec calcul du temps de retour proportionnel.
- Sécurisation du job de retour en le planifiant hors transaction (prévention race condition).
- Mise à jour de `ReturnWorker` pour restituer les troupes sans combat si `recalled=true`.
- Exposition de l'événement Outbox et WS `expedition.recalled` et `expedition.returned`.
- Smoke test validé.
