# Prisma — accès données

## Règles fondamentales

- ✅ **Source de vérité** : [`prisma/schema.prisma`](../../prisma/schema.prisma). Toute évolution du modèle commence là.
- ✅ Toujours injecter `PrismaService` dans les services (pas dans les controllers).
- ❌ **Jamais** de `import { PrismaClient } from '@prisma/client'` ailleurs que dans `infra/prisma/prisma.service.ts`. Tout passe par `PrismaService`.
- ❌ Jamais d'accès Prisma direct depuis un controller.

## Transactions

`$transaction` est **obligatoire** quand plusieurs writes doivent réussir ou échouer ensemble. C'est notamment le cas pour le pattern Outbox (mutation + insert dans `EventOutbox` doivent être atomiques).

```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.village.update({ where: { id }, data: { ... } });
  await tx.eventOutbox.create({ data: { type: 'building.completed', payload, worldId } });
});
```

Préférer la forme **callback** `$transaction(async tx => ...)` pour pouvoir composer plusieurs opérations conditionnelles. La forme **array** `$transaction([promise1, promise2])` ne supporte pas la logique entre étapes.

## N+1 et performance

- ✅ `include` ou `select` pour les relations qu'on consomme dans la même requête.
- ❌ `.findMany()` puis `.find(item => item.relation)` dans une boucle = N+1 garanti.
- ✅ Pour les listes denses (world entities, leaderboard), envisager `select` minimal pour ne pas charger les colonnes JSON lourdes.
- ✅ Préférer un `groupBy` à un agrégat manuel côté Node.

## Migrations

- `yarn prisma migrate dev --name <nom>` en local pour générer une migration depuis le schéma.
- `yarn prisma migrate deploy` en CI/prod pour appliquer.
- ❌ **Jamais** `prisma migrate reset` sur une base partagée — interdit par la convention projet.
- Les migrations sont dans `prisma/migrations/` et **font partie du commit** qui modifie le schéma.

## Seed

- `prisma/seed-default-world-config.sql` initialise la config par défaut d'un monde.
- Le seeding des villages barbares est fait par un service applicatif (`world/barbarian-seeding.service.ts`), pas un script SQL — il dépend de `world.config` et des règles métier.

## Types

- Les types générés Prisma (`User`, `Village`, etc.) sont consommables tels quels dans les services.
- Pour les retours typés vers les controllers, préférer un DTO de sortie explicite plutôt que d'exposer le type Prisma brut (évite les fuites de colonnes internes).
- Types partagés inter-module : `src/common/prisma.types.ts`.

## Enums Prisma ↔ unions shared

Prisma 6 génère ses enums comme **unions de literals** (`'FORTRESS' | 'RAIDERS' | ...`). Ils sont structurellement assignables aux unions shared équivalentes — **pas de cast `as VillageStrategyType` aux frontières**.

Quand un enum Prisma est dupliqué côté shared (ex : `VillageStrategy` ↔ `VillageStrategyType`, `TargetKind`, `ExpeditionStatus`), ajouter une vérification d'alignement bidirectionnel dans `src/common/prisma-shared-enums.ts` :

```ts
const _xToPrisma: Record<SharedUnion, PrismaEnum> = { ... };
const _xFromPrisma: Record<PrismaEnum, SharedUnion> = { ... };
```

Si l'un ou l'autre côté ajoute/supprime/renomme une variante, le build casse. **Préférer ce filet à un cast inline.**

## Schéma — tables critiques

| Table | Rôle |
|-------|------|
| `User`, `RefreshToken` | auth |
| `World`, `WorldMembership`, `WorldConfig` | mondes + config par monde |
| `Village`, `Building`, `BuildingQueue` | village joueur + bâtiments |
| `BarbarianVillage` | villages barbares (seed procédural) |
| `ArmyUnit`, `TrainingQueue` | armée + entraînement |
| `Combat`, `CombatReport`, `Army`, `Loot` | combats + butin + retour |
| `Crown`, `CrownTransaction` | monnaie premium |
| `EventOutbox` | événements à diffuser via WS |

Voir le schéma complet pour les relations exactes — il est commenté.

## Pièges connus

- **Champ JSON `world.config`** : ne pas faire `update` partiel naïvement. Utiliser un merge applicatif puis remplacer le champ entier.
- **Décimaux Prisma** : ressources / production sont parfois `Decimal`. Conversion `Number(value)` côté Node, ou utiliser `Decimal.js` pour les calculs critiques (production tick).
- **Cascade** : peu de `onDelete: Cascade` dans le schéma actuel. Suppression d'un user = orchestration applicative à coder.
