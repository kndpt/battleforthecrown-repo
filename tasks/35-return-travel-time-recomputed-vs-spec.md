# 35 — Drift potentiel : durée retour recalculée vs spec « à la même vitesse qu'à l'aller »

**Sévérité** : 🟢 Mineure (drift possible, pas de bug observé)
**Statut** : 🆕 Ouvert 2026-05-10 (issue de [run 004](./runs/archive/004-audit-combat.md))

## Symptôme

[`docs/gameplay/04-combat.md` § Mécanique générale](../docs/gameplay/04-combat.md#mécanique-générale) :

> L'armée survivante revient avec le loot, **à la même vitesse qu'à l'aller**.

Code actuel — `battleforthecrown-backend/src/modules/combat/combat.worker.ts:288-300` :

```ts
const distance = calculateDistance(attackerVillage.x, attackerVillage.y, expedition.targetX, expedition.targetY);
const travelTimeMs = await this.worldConfig.getTravelTimeForArmy(
  expedition.worldId,
  distance,
  parseUnitMap(expedition.units, 'expedition.units'),  // armée initiale, pas survivants
  context.attackerStrategyConfig?.strategy,            // stratégie au moment de la résolution
);
```

La durée retour est **recalculée** à la résolution — pas la durée aller stockée. En pratique :
- `distance` : inchangée (mêmes coordonnées) ✅
- `expedition.units` : armée **initiale** (n'a pas été mutée), donc `findSlowestUnitSpeed` identique ✅
- `getTravelTimeForArmy` dépend aussi de `worldConfig.combat.speedMultiplier` et du bonus de style → **drift si admin change la config monde OU si le joueur change de style entre dispatch et résolution**.

Aujourd'hui aucun de ces leviers n'évolue en cours de partie sans intervention manuelle, donc le résultat est en pratique identique à la durée aller. **Mais la spec est littérale**, et l'invariant n'est pas exprimé dans le code.

## État actuel

- Le job pg-boss `combat:return` est planifié avec `startAfter: returnAt` (ligne 360-367) basé sur le recalcul.
- La durée aller initiale n'est nulle part stockée explicitement (déductible de `arrivalAt - dispatchedAt` si ces deux champs existent — à vérifier via `prisma/schema.prisma`).

## Pistes

### Piste A — Stocker la durée aller, la réutiliser au retour

Ajouter `Expedition.outboundTravelMs: Int` au dispatch. À la résolution :

```ts
const returnAt = new Date(Date.now() + expedition.outboundTravelMs);
```

**Tradeoff** : exact, robuste à tout changement de config/style. Migration Prisma + 1 champ. Couplé naturellement au ticket [34](./34-army-recall-missing.md) (le rappel a aussi besoin de connaître `dispatchedAt` pour calculer `elapsed`).

### Piste B — Recalculer mais figer la stratégie au dispatch

Stocker `Expedition.attackerStrategyAtDispatch: VillageStrategy?`. Recalcul retour utilise cette valeur, pas la stratégie courante.

**Tradeoff** : ne couvre pas le cas `worldConfig.combat.speedMultiplier` modifié. Demi-mesure.

### Piste C — Statu quo + acter dans la doc

Documenter dans [`docs/architecture/backend-modules.md` § Combat] que la durée retour suppose une config monde stable + stratégie stable. **Tradeoff** : 0 code, faible coût, mais laisse un piège latent.

## Recommandation

**Piste A** lors de l'implémentation du ticket [34 — rappel d'armée](./34-army-recall-missing.md), qui requiert déjà `dispatchedAt`/`elapsed`. Mutualiser la migration Prisma. En attendant, Piste C (note dans la doc) suffit — le drift n'est pas observable en production actuelle.

## Référence audit

Run 004 — finding lecture critique `combat.worker.ts:288-300`. Pas de fix dans le run (audit pur, hors scope d'implémentation).
