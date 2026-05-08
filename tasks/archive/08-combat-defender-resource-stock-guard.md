# 08 — Combat worker : crash P2025 si défenseur n'a pas de `ResourceStock`

**Statut** : ✅ Résolu 2026-05-08
**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend`
**Tags** : combat, defensive-coding, prisma, latent-bug

## Résolution

Stratégie retenue : **piste A (guard local)** sur les deux chemins du `combat.worker.ts`. C bypass écarté : les 2 callsites de prod (`join-world.use-case.ts`, `barbarian-village.factory.ts`) respectent déjà l'invariant Village ⇔ ResourceStock dans la même transaction, un helper aurait été un re-wrap sans valeur ajoutée. B (`upsert`) écarté : `decrement` sur un record fraîchement créé à 0 produit des valeurs négatives (le schéma ne contraint pas `>= 0`).

Implémentation (`battleforthecrown-backend/src/modules/combat/combat.worker.ts`) :
- Type de `defenderVillage` étendu via `Prisma.VillageGetPayload<{ include: { resourceStock: true } }>`.
- Chemin BARBARIAN : `findUnique({ include: { resourceStock: true } })` + guard fusionné `if (defenderVillage?.resourceStock)`.
- Chemin PLAYER : guard imbriqué `if (defenderVillage.resourceStock)` autour du seul decrement (l'`unitInventory` continue de tourner sans stock).

Bug latent collatéral découvert et fixé en QA : `combat.worker.ts` (defender decrement) et `return.worker.ts` (attacker increment au retour) mutaient le `ResourceStock` **sans** émettre `resources.changed` — symptôme : ressources non rafraîchies live côté HUD au retour de combat. Le fix wire `EventModule` dans `CombatModule` et appelle `OutboxPublisher.resourcesChanged(villageId, tx)` dans la même transaction Prisma que la mutation, alignant le pattern avec construction/training/recruit/cancel-*/upgrade.

Doc mise à jour : `docs/architecture/realtime.md` (catalogue d'événements `resources.changed` complété avec les deux nouveaux callers combat).

Hardening laissé en suspens (pas dans le scope) : `return.worker.ts` throw `Combat report not found` si `expedition.report` est null (cas qui survient si un user supprime manuellement une ligne `combat_report` — la FK optionnelle `Expedition.reportId` passe à NULL via `onDelete: SetNull`). Pourrait fallback sur `expedition.units` pour restituer les troupes au lieu de retry en boucle. À ouvrir comme ticket dédié si on tape sur ce cas en prod.

## Contexte

Trouvé en écrivant le smoke combat (ticket 02). Quand l'attaquant arrive sur un village défenseur (player ou barbarian), le `CombatWorker` décrémente les ressources lootées du défenseur via `tx.resourceStock.update({ where: { villageId } })`. Si le défenseur n'a **aucune** ligne `ResourceStock`, Prisma throw `P2025 - No record was found for an update`, la transaction rollback, l'event `battle.resolved` n'est jamais créé, pg-boss retry, fail à nouveau.

En pratique aujourd'hui : tous les villages joueurs et tous les barbares créés par le `BarbarianVillageFactory` ont un `ResourceStock`. Le bug est donc **latent** mais réel : n'importe quelle entrée DB qui crée un `Village` sans `ResourceStock` (smoke, migration, script de debug, futur cas métier) déclenche un combat infiniment cassé jusqu'à intervention manuelle.

## État actuel

`src/modules/combat/combat.worker.ts:104-144` (chemin BARBARIAN + chemin PLAYER, deux fois la même structure) :

```ts
defenderVillage = await tx.village.findUnique({ where: { id: expedition.targetRefId } });

if (defenderVillage) {
  const lootedResources = resolution.loot.resources || { wood: 0, stone: 0, iron: 0 };

  // ↓ crash si pas de ResourceStock pour ce villageId
  await tx.resourceStock.update({
    where: { villageId: defenderVillage.id },
    data: {
      wood:  { decrement: lootedResources.wood  },
      stone: { decrement: lootedResources.stone },
      iron:  { decrement: lootedResources.iron  },
      lastUpdateTs: new Date(),
    },
  });
}
```

Le worker `findUnique` puis `update` directement, sans `findUnique` sur `ResourceStock` ni guard. Si la relation 1:1 `Village.resourceStock` est absente → P2025.

Reproduction smoke (avant fix) :
```
PrismaClientKnownRequestError: No record was found for an update.
  code: 'P2025',
  meta: { modelName: 'ResourceStock', cause: 'No record was found for an update.' }
  → at combat.worker.ts:112
```

Le retry pg-boss empile les jobs `combat:resolve` qui échouent en boucle.

## Pistes

### A. Guard early-return si pas de stock

- Lire `defenderVillage.resourceStock` (déjà inclus dans la requête originale, ou rajouter `include: { resourceStock: true }`).
- Si `null`, skip la décrémentation et émettre quand même l'event `battle.resolved` avec `loot: { resources: {0,0,0} }`.
- Avantage : le combat se résout proprement même contre une cible "exotique".
- Coût : ~5 lignes × 2 emplacements.

### B. `upsert` au lieu de `update`

- Remplacer par `tx.resourceStock.upsert({ where: { villageId }, update: { decrement... }, create: { wood: 0, ... } })`.
- Avantage : auto-réparation, plus de P2025 possible.
- Risque : un `decrement` sur un nouveau record (créé avec 0) ferait un `decrement: X` sur 0 → -X. Pas grave si on cap à 0 par contrat, mais le schema Prisma accepte les valeurs négatives. À vérifier.

### C. Garantir l'invariant en amont (Village ⇔ ResourceStock obligatoire)

- Au niveau Prisma : déjà 1:1 optionnelle. La relation pourrait devenir 1:1 NOT NULL avec un trigger ou une création atomique systématique.
- Politique applicative : tout `village.create` passe par un helper `createVillageWithStock` qui fait les deux dans la même transaction.
- Avantage : impossible d'arriver à l'état pathologique.
- Coût : audit des callsites de `village.create` (~5 endroits estimés), refactor.

### D. Statu quo + doc

- Documenter dans `docs/architecture/data-model.md` que tout `Village` doit avoir un `ResourceStock` et que c'est un invariant non vérifié par le schéma.
- Risque : la prochaine fois qu'un dev oublie, retour du bug.

## Question à trancher

A (guard local), B (upsert), C (invariant garanti), D (doc) ?

A est le minimum vital, C est la solution propre. B est probablement à éviter sauf si on accepte la sémantique.

## Dimensions à valider en sortie

- Si A : guard ajouté aux deux chemins (BARBARIAN + PLAYER), smoke combat sans pré-création de ResourceStock — le combat passe quand même.
- Si C : helper `createVillageWithStock`, callsites migrés, smoke barbarian sans ResourceStock manuel.
- Tests : assertion que pg-boss n'a aucune retry dans `pgboss.archive` après le smoke combat (sinon retry caché).

## Tickets liés

- [02 — Smoke tests](./archive/02-smoke-tests-strategy.md) ✅ — le smoke combat crée explicitement le `ResourceStock` du barbare pour contourner ce bug. À retirer si A ou C est appliqué.
