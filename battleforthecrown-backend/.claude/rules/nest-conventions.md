# NestJS — conventions

## Architecture en couches

```
HTTP Request
    │
    ▼
[Controller]   ← validation DTO, extraction params, délégation
    │
    ▼
[Service]      ← logique métier, orchestration, transactions
    │
    ▼
[PrismaService] ← accès DB
```

### 1. Controllers (couche HTTP)

- ❌ **Aucune logique métier** dans les controllers. Si tu tapes plus de 3 lignes hors validation/délégation, c'est trop.
- ✅ Définir routes + méthodes HTTP, extraire `@Body() / @Param() / @Query()`, déléguer au service, retourner la réponse.
- ✅ Auth globale : `JwtAuthGuard` est `APP_GUARD`, opt-out via `@Public()`. Voir [`docs/architecture/auth.md`](../../../docs/architecture/auth.md).
- ✅ `@CurrentUser()` pour récupérer l'utilisateur authentifié.

### 2. Services (couche métier)

- ✅ **Toute la logique métier** vit ici. Règles, validations business, calculs de coûts, contrôle de prérequis.
- ✅ Orchestration : un service peut injecter d'autres services.
- ✅ `@Injectable()`, injection par constructeur.
- ✅ Transactions Prisma `$transaction` quand plusieurs writes doivent être atomiques (et **toujours** quand un EventOutbox accompagne une mutation — cf. `workers.md`).
- ❌ Jamais d'accès direct à `Request` / `Response` HTTP — ça reste dans le controller.

#### Renommer / supprimer une méthode publique

Quand on renomme ou supprime une méthode publique d'un service, **grep aussi `scripts/`** (et pas seulement `src/`). Les scripts d'admin/maintenance (`scripts/test-village-placement-100.ts`, etc.) sont compilés par `nest start` au boot — un caller obsolète fait planter le démarrage du backend, y compris en QA. Checklist avant commit :

```bash
grep -rn "<oldName>" src/ scripts/ test/
```

### 3. Modules

Chaque module est **autosuffisant** et représente un bounded context :

- `imports` : autres modules nécessaires.
- `providers` : services du module.
- `controllers` : routes HTTP.
- `exports` : services partagés avec d'autres modules.

Modules globaux : `ConfigModule`, `PrismaModule`, `LoggerModule` (pino).

## DTOs et validation

Le projet migre **`class-validator` → Zod**.

### Nouveau code (Zod)

```typescript
import { z } from 'zod';

export const upgradeBuildingSchema = z.object({
  buildingType: z.enum(['CASTLE', 'FARM', 'WOOD', /* ... */]),
});

export type UpgradeBuildingDto = z.infer<typeof upgradeBuildingSchema>;
```

Utiliser `ZodValidationPipe` (déjà disponible dans `common/pipes/zod-validation.pipe.ts`) :

```typescript
@Post('upgrade')
upgrade(@Body(new ZodValidationPipe(upgradeBuildingSchema)) dto: UpgradeBuildingDto) { ... }
```

### Code legacy (class-validator)

Toléré mais **ne pas en ajouter** :

```typescript
export class TrainUnitsDto {
  @IsString() @IsIn(['MILITIA', 'ARCHER']) unitType: string;
  @IsInt() @Min(1) quantity: number;
}
```

`ValidationPipe` global avec `whitelist: true` (supprime les propriétés inconnues).

### Règles DTO

- ✅ Un DTO par action (`UpgradeBuildingDto`, `TrainUnitsDto`, `InitiateAttackDto`).
- ✅ Schéma Zod composable et réutilisable.
- ✅ Type domaine inféré via `z.infer<>` — pas de duplication interface + schéma.

## Guards et authentification

`JwtAuthGuard` est enregistré comme `APP_GUARD` global → **toute route est protégée par défaut**. Opt-out via `@Public()` (auth, health, world public, leaderboard).

- `@CurrentUser()` pour récupérer l'utilisateur dans un controller protégé.
- `OwnershipService.assertVillageOwnedBy` / `assertWorldMember` dans les services pour bloquer les accès cross-user.
- WebSocket : JWT au handshake (`socket.handshake.auth.token`), vérifié dans `event/game.gateway.ts`.

Détail complet : [`docs/architecture/auth.md`](../../../docs/architecture/auth.md).

## Tests

**Source unique** : [`../../../.claude/rules/tests.md`](../../../.claude/rules/tests.md). Lire avant d'écrire ou demander un test (arbre de décision, types autorisés, anti-patterns).

Spécificités backend (résumé — le détail vit dans tests.md) :

- **Vérification préférée pour les changements applicatifs** : lancer le serveur (`PORT=15001 yarn start:dev`), exercer les endpoints concernés, **inspecter la BDD** via le skill `bftc-db`. Nettoyer les fixtures à la fin.
- **Spec autorisé** = pure-logic only (formules combat/monde, Zod, strategies, géométrie, templates).
- **Spec interdit** = `*.worker.spec.ts` / `*.controller.spec.ts` / specs services qui mockent `PrismaService` ou `pg-boss`. → smoke (cf. [`tasks/02-smoke-tests-strategy.md`](../../../tasks/02-smoke-tests-strategy.md)).

Commandes :
```bash
yarn test           # unit (logique pure)
yarn test:e2e       # smoke (à brancher selon ticket 02)
yarn test:cov       # couverture
```

## Structure des modules métiers

Modules actuels (bounded contexts) :

| Module | Rôle |
|--------|------|
| `auth` | JWT + sessions + refresh |
| `world` | Mondes, config, seeding barbares, placement villages |
| `village` | Villages joueurs + bâtiments + queue construction |
| `resources` | Production passive (bois/pierre/fer), capacité warehouse |
| `army` | Entraînement et inventaire des troupes |
| `combat` | Attaque, conquête, butin, retour d'armée |
| `crowns` | Monnaie premium (production passive + transactions) |
| `population` | Habitants, capacité farm |
| `power` | Calcul de puissance village + royaume |
| `event` | WebSocket gateway + EventOutbox |

Détail dans [`docs/architecture/backend-modules.md`](../../../docs/architecture/backend-modules.md).

## Logger

`pino` via `LoggerModule`. Logger structuré, JSON en prod. Récupérer dans un service via `@InjectPinoLogger()` ou `Logger` natif Nest.

## Erreurs

- HTTP : lever `BadRequestException`, `NotFoundException`, `ForbiddenException`, etc. — Nest les sérialise en JSON.
- Worker : try/catch + log structuré, **ne jamais laisser une erreur tuer le process** (cf. `workers.md`).
- Domaine : exceptions custom dans `src/common/exceptions/` si la sémantique est partagée entre plusieurs modules.
