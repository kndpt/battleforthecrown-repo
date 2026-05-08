# 07 — Crown production : event Outbox conditionné sur `production > 0`

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend`
**Tags** : crowns, outbox, ux, edge-case
**Statut** : ✅ Résolu 2026-05-08

## Résolution

Stratégie retenue : **option C+** (statu quo + clarification + smoke renforcé + bouchage d'un trou orthogonal).

L'analyse a montré que le « bug user-visible » suggéré (HUD stale quand `production = 0`) n'existe pas vraiment :
- Le HUD pixi interpole en continu via `projectCrowns` (`battleforthecrown-pixi/src/lib/interpolation.ts`) tant qu'un snapshot est présent.
- Le seed REST initial est garanti par `useCrownsQuery` au montage de `AuthenticatedShell`. L'interpolation reprend de « maintenant » (le code force `lastUpdateTs: Date.now()` dans `setCrowns`).
- L'asymétrie entre `updateProduction` (gardé sur `production > 0`) et `recalculateOnBuildingChange` (toujours émis) est un **design choisi**, pas un bug : tick opportuniste vs event métier.

L'analyse a en revanche déterré **un vrai trou orthogonal** : `VillageStrategyService.changeStrategy` (`src/modules/strategy/village-strategy.service.ts`) déduit le coût de changement directement sur `crownBalance.balance` sans émettre `crowns.changed`. Cas réel où le HUD pouvait rester stale — fixé.

## Changements

- **`battleforthecrown-backend/src/modules/crowns/crowns.service.ts`** : JSDoc sur `updateProduction` qui documente la garde, l'asymétrie volontaire avec `recalculateOnBuildingChange`, et l'invariant à respecter ailleurs (toute autre source qui mute `CrownBalance.balance` doit émettre son propre event).
- **`battleforthecrown-backend/src/modules/strategy/village-strategy.service.ts`** : injection de `CrownsService`, appel `createCrownsChangedEvent` dans la même transaction que la déduction du coût de changement de stratégie.
- **`battleforthecrown-backend/src/modules/strategy/strategy.module.ts`** : import de `CrownsModule`.
- **`battleforthecrown-backend/test/smoke.spec.ts`** : 2 nouveaux smokes — `tick → no crowns.changed when production rounds to 0` (verrouille l'invariant inverse) et `strategy change: deducting crowns dispatches crowns.changed` (verrouille le bouchage du trou).
- **`docs/architecture/realtime.md`** § « Asymétrie volontaire avec `CrownProductionWorker` » : précision sur la garde `production > 0` + invariant explicite pour les autres sources de mutation.

## Vérif

```bash
yarn workspace battleforthecrown-backend test:smoke
# → 12/12 ✓ (dont les 2 nouveaux)
```

---

(Ticket original conservé ci-dessous pour contexte historique.)

## Contexte

Trouvé en écrivant le smoke crown production (ticket 02). Le worker `crown-production` poll toutes les 5 minutes et appelle `crownsService.updateProduction(userId, worldId, true)`. À l'intérieur, l'event `crowns.changed` n'est créé que **si la production calculée > 0**. Conséquence : un user dont le rate de production est 0 (typique en début de partie, sans buildings crown-producers) ne reçoit aucun event WS — son `CrownBalance.lastUpdateTs` est mis à jour silencieusement, mais le HUD pixi reste sur la dernière valeur reçue.

## État actuel

`src/modules/crowns/crowns.service.ts:105-152` :

```ts
async updateProduction(userId: string, worldId: string, createEvent = false) {
  return this.prisma.$transaction(async (tx) => {
    // ... lookup CrownBalance
    const productionRate = await this.calculateProductionRate(userId, worldId);
    const elapsedMs = now.getTime() - crownBalance.lastUpdateTs.getTime();
    const elapsedHours = elapsedMs / MS_PER_HOUR;
    const production = Math.floor(productionRate * elapsedHours);
    const newBalance = crownBalance.balance + production;

    const updated = await tx.crownBalance.update({
      where: { userId_worldId: { userId, worldId } },
      data: { balance: newBalance, lastUpdateTs: now },
    });

    // L168 ↓ — la garde
    if (createEvent && production > 0) {
      await this.createCrownsChangedEvent(userId, worldId, tx);
    }

    return updated;
  });
}
```

À comparer avec `recalculateOnBuildingChange` (l.158) qui **émet toujours** l'event (l.220, hors du `if`). Cohérence interne déjà brisée : deux helpers du même service ont une politique d'émission différente.

Cas qui tombent dans le piège :
- Un nouveau joueur sans Castle level suffisant pour produire des couronnes. `productionRate = 0`. Aucun event sur la durée.
- Un user expérimenté dont le tick passe alors qu'il n'a pas accumulé assez d'`elapsedHours` pour une couronne entière (`Math.floor` peut rendre 0 si l'arrondi est défavorable). Skip silencieux.

Manifestation côté pixi :
- HUD couronnes affiche la dernière valeur reçue par WS, ou un fallback REST initial.
- Si une autre source change `CrownBalance` (achat de crown, récompense, dépense en jeu), le HUD peut afficher une valeur stale jusqu'au prochain refresh manuel.

## Pistes

### A. Toujours émettre l'event quand `createEvent=true`

- Retirer `&& production > 0` de la garde.
- Aligner `updateProduction` avec `recalculateOnBuildingChange`.
- Avantage : cohérent, le frontend a une source d'autorité régulière.
- Risque : volume WS — ~1 event / user / 5 min même quand rien ne change. Acceptable pour la taille du projet.
- Coût : 1 ligne + ajustement payload (rate=0 → balance inchangé, c'est OK).

### B. Émettre uniquement si `balance` ou `productionRate` a changé

- Charger l'ancien balance/rate, comparer, émettre seulement sur diff.
- Avantage : zero-noise.
- Risque : code plus tordu, et la première connexion d'une session utilisateur a quand même besoin d'une valeur fraîche (qui peut venir d'un fetch REST initial).
- Coût : ~30 min.

### C. Garder la garde mais expliciter

- Ajouter un commentaire qui explique que le frontend doit gérer le cas "pas d'event = pas de changement". Et s'assurer que le pixi a bien un fetch REST de fallback à la connexion.
- Avantage : zero-changement de comportement.
- Risque : si un bug existe côté pixi (HUD stale dans certains cas), le ticket reste latent.

## Question à trancher

A (toujours émettre), B (diff-only), ou C (statu quo + doc) ?

## Dimensions à valider en sortie

- Si A : assertion `production = 0` dans le smoke crown ajoutée (event encore dispatché). Pixi peut rester tel quel — il consommera juste plus d'events.
- Si B : helper `hasChanges` dans `crowns.service.ts` + smoke qui asserte le bon comportement (event sur diff, pas d'event sur identique).
- Si C : commentaire JSDoc + audit pixi pour valider qu'il y a un fallback REST si pas d'event.

## Tickets liés

- [02 — Smoke tests](./archive/02-smoke-tests-strategy.md) ✅ — le smoke crown backdate `lastUpdateTs` d'1 jour pour forcer `production > 0`. Si A est retenu, ce backdate devient inutile.
- [06 — Production tick + barbarian backfill : pas d'event Outbox](./archive/06-production-tick-and-backfill-no-outbox.md) ✅ — même thème (politique d'émission Outbox). La nouvelle section "Exceptions au pattern Outbox" de [`docs/architecture/realtime.md`](../docs/architecture/realtime.md) explique aussi pourquoi `CrownProductionWorker` est traité différemment.
