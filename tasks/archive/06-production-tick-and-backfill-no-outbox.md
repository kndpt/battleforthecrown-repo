# 06 — Production tick + barbarian backfill : pas d'event Outbox

**Sévérité** : 🟢 Mineure
**Workspace(s)** : `battleforthecrown-backend`
**Tags** : outbox, workers, design-decision, doc-debt
**Statut** : ✅ Résolu 2026-05-08

## Résolution

Stratégie retenue : **option A étendue**. Le statu quo (pas d'event Outbox sur les deux workers) est validé comme choix archi conscient — l'analyse a montré :

- L'interpolation côté pixi (`projectResources`) est mathématiquement identique au backend tant que `productionRates` et `maxPerType` ne changent pas. Tout changement de rate déclenche déjà un event (`building.completed`, ou émission directe par `construction.worker.ts` quand un producer/WAREHOUSE complète). Le tick horaire n'apporte aucune valeur user-visible — il sert uniquement de catchup DB et de backstop pour le combat.
- Pour le backfill, `useWorldEntitiesQuery` a `refetchInterval: 30_000` → max 30 s de latence pour voir une nouvelle BV apparaître, et le worker tourne 1×/jour à minuit UTC. Le ticket original sur-vendait l'invisibilité ("jusqu'au prochain pan/zoom").

L'analyse a aussi déterré **deux bugs doc** sur le déclencheur de `resources.changed` :
- `docs/architecture/realtime.md` (catalogue d'événements) listait à tort `ProductionWorker tick` comme déclencheur.
- `battleforthecrown-backend/.claude/rules/workers.md` (§ Tick de production) affirmait que le tick "écrit `resources.changed` dans Outbox".

**Travaux livrés** :
1. `realtime.md` — déclencheur de `resources.changed` corrigé (5 vrais callers d'`OutboxPublisher.resourcesChanged` listés) ; nouvelle section "Exceptions au pattern Outbox" qui documente production tick + barbarian backfill + l'asymétrie volontaire avec `CrownProductionWorker`.
2. `workers.md` (§ Tick de production) — formulation corrigée + renvoi vers la section canonique de `realtime.md`.
3. Commentaire dans `barbarian-backfill.worker.ts` au-dessus de `handleBackfill`.
4. Commentaire existant dans `production.worker.ts` enrichi avec un pointer vers la doc canonique.

Aucun changement de comportement runtime, aucun smoke ajouté (les smokes existants — `smoke.spec.ts:33` pour le tick et `:285` pour le backfill — assertaient déjà l'effet DB seul, ce qui est cohérent avec le choix archi).

## Contexte

Trouvé en écrivant les smokes (ticket 02). Deux workers font des mutations DB **sans** écrire dans `EventOutbox`. C'est un choix délibéré pour le production tick (un commentaire le confirme) et probablement un oubli ou une décision implicite pour le backfill barbare. Le contrat Outbox est documenté ailleurs comme "toute mutation qui doit notifier le frontend écrit l'événement dans EventOutbox dans la même transaction" — ces deux exceptions méritent d'être consignées explicitement, ou rebranchées.

## État actuel

### Production tick — `src/workers/production.worker.ts`

```ts
// lignes 71-73
// No WebSocket broadcast on tick — the frontend interpolates locally
// between mutation-driven `resources.changed` events.
for (const village of villages) {
  await this.resourcesService.updateProduction(village.id);
}
```

`updateProduction` lit/écrit `ResourceStock.lastUpdateTs` et les ressources, **pas d'EventOutbox**. Le `resources.changed` n'est émis que via les mutations applicatives (upgrade qui finit, `resources/:id/produce` REST manuel, construction d'un building producteur).

Conséquence : un joueur avec **aucune mutation** pendant 1 h voit le HUD interpoler localement (montant calculé côté pixi à partir du dernier event + production rate). Pas de discrepancy visible tant que l'interpolation est juste, mais aucune source d'autorité périodique.

### Barbarian backfill — `src/modules/world/barbarian-backfill.worker.ts`

```ts
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async handleBackfill() { ... }
```

`handleBackfill` → `BarbarianSeedingService.seedAroundVillage` → `tx.village.create({ data: { isBarbarian: true, ... } })` + entrées `building`, `resourceStock`, `unitInventory`. Aucun event Outbox créé.

Conséquence : un joueur connecté au moment du backfill ne reçoit aucune notification. Les nouveaux barbares apparaissent dans la prochaine query de map (`/world/:id/entities`). Le HUD ne sait pas qu'il faut invalider/refetch — invisible jusqu'au prochain pan/zoom.

## Pistes

### A. Documenter explicitement les 2 exceptions

- Ajouter un encart "Exceptions au pattern Outbox" dans `docs/architecture/realtime.md` qui liste : production tick (rationale: interpolation côté front) et barbarian backfill (rationale: refetch à la prochaine query map).
- Ajouter un commentaire dans `barbarian-backfill.worker.ts` (le worker production a déjà le sien).
- Avantage : zéro changement de comportement, juste une dette de doc résorbée. Le prochain dev sait que c'est intentionnel et où chercher si ça change.
- Coût : ~15 min.

### B. Émettre `resources.changed` à la fin de chaque tick

- Pour chaque village traité dans `handleProductionTick`, après `updateProduction`, appeler `outbox.resourcesChanged(villageId)`.
- Avantage : une source d'autorité périodique, le frontend peut arrêter d'interpoler agressivement.
- Risque : N events × N villages × 1 tick/h = beaucoup de noise WS pour zéro valeur user-visible (l'interpolation est déjà parfaite tant que le rate ne change pas). Charge inutile sur le gateway.
- Verdict : seulement si l'interpolation s'avère insuffisante. Pas évident aujourd'hui.

### C. Émettre un event `world.barbarians.seeded` après le backfill

- `BarbarianBackfillWorker` → après `seedAroundVillage`, créer un event Outbox `world.barbarians.seeded` avec les coords des nouveaux BVs.
- Le frontend peut alors invalider le cache map ou pousser les entités directement.
- Avantage : UX cohérente — pas besoin d'attendre un pan/zoom user pour voir l'apparition.
- Coût : nouveau `kind` dans `event-types.ts` + handler côté `event-outbox.service.ts` + binding pixi côté `ws-bindings.ts`. ~1h.

### D. Statu quo

- L'interpolation côté pixi semble suffire en pratique. Personne n'a remonté de bug visible.

## Question à trancher

A (doc only), B (events à chaque tick), C (event au backfill), B+C, ou D ?

## Dimensions à valider en sortie

- Si A : `realtime.md` mis à jour avec la section "Exceptions au pattern Outbox", commentaire ajouté dans `barbarian-backfill.worker.ts`.
- Si B/C : nouveau(x) event(s) bindé(s) côté pixi, smoke ajouté dans `test/smoke.spec.ts` qui asserte le dispatch.
- Cohérence avec [`workers.md`](../battleforthecrown-backend/.claude/rules/workers.md) — "Pattern Outbox (critique)".

## Tickets liés

- [02 — Smoke tests](./archive/02-smoke-tests-strategy.md) ✅ — les smokes correspondants assertent l'effet DB seul, en attendant la décision ici.
