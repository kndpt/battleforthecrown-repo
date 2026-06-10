# Authentification

Server-authoritative. Le backend est la seule source de vérité de l'identité — aucun `userId` n'est accepté du client en query/param/body.

## Flow

### REST

- `POST /auth/register` | `/auth/login` → `{ accessToken (15min), refreshToken (7d), userId, email }`.
- `POST /auth/refresh` → `{ accessToken, refreshToken }` à partir du refresh token (le refresh token est renvoyé tel quel — pas de rotation).
- Toutes les autres routes : header `Authorization: Bearer <accessToken>`.

Sessions persistées (`Session` table). Refresh token hashé bcrypt en DB. Voir `src/modules/auth/auth.service.ts`.

### WebSocket

JWT au handshake via `socket.handshake.auth.token`, vérifié dans `src/modules/event/game.gateway.ts`. Sur 401 (token expiré), le front rafraîchit via REST puis reconnecte — détails dans [`realtime.md`](./realtime.md).

## Enforcement (couche HTTP)

`JwtAuthGuard` est enregistré comme `APP_GUARD` global dans `app.module.ts` → **toute route est protégée par défaut**. Opt-out explicite avec `@Public()` :

| Route | Pourquoi public |
|---|---|
| `/auth/*` | login/register/refresh |
| `/health` | sondes infra |
| `/world` (liste), `/world/:id/details`, `/world/:id/config` | lobby pré-login |
| `/world/seed-if-needed` | dev/admin (TODO : guard admin) |
| `/power/village/:id/public` | puissance bâtiments publique d'un village |
| `/power/kingdom/:userId/public?worldId=...` | puissance royaume publique d'un joueur sur un monde |
| `/power/leaderboard?worldId=...` | classement public de puissance d'un monde |
| `/rankings?worldId=...`, `/rankings/:signal?worldId=...` | classements publics Puissance du Royaume / Gloire d'Assaut / Gloire du Rempart |

Dans un controller protégé :

```ts
@Get('something')
foo(@CurrentUser() user: AuthenticatedUser) { ... }
```

`@CurrentUser()` throw si la route n'a pas de guard — fail-fast volontaire.

## Ownership (couche service)

`OwnershipService` (`src/common/auth/ownership.service.ts`) bloque les accès cross-user :

- `assertVillageOwnedBy(villageId, userId)` → `Forbidden` si pas propriétaire, `NotFound` si inexistant.
- `assertWorldMember(worldId, userId)` → `Forbidden` si pas membre.

À appeler en tête des méthodes service qui prennent un `villageId`/`worldId` côté client :

```ts
async getResources(villageId: string, userId: string) {
  await this.ownership.assertVillageOwnedBy(villageId, userId);
  // ... logique métier
}
```

**Cas mixte worker/controller** (ex : `resources.updateProduction`, `crowns.updateProduction`) : l'assert se fait dans le **controller**, pas dans le service — les workers tournent sans contexte user et ne doivent pas être bloqués.

## Ajouter un endpoint

| Type | Démarche |
|---|---|
| Privé (défaut) | `@CurrentUser() user`. Si l'endpoint prend un `villageId` ou `worldId`, ajouter `assertVillageOwnedBy` / `assertWorldMember` dans le service (ou le controller si méthode mixte). |
| Public | `@Public()` sur la méthode (ou la classe). Ajouter au tableau ci-dessus. |

## Modèle de menace

**Bloqué** :
- Spoof d'identité (`userId` injecté en query/body/path) — JWT signé serveur.
- Accès cross-user à un village ou un monde — `OwnershipService`.

**Pas (encore) bloqué** :
- Rate limiting (brute-force login, spam d'attaques).
- Admin / RBAC — pas de notion de rôle au-delà de `WorldMembership.role`.
- Révocation serveur d'un access token avant expiration (fenêtre 15 min acceptée).

## Variables d'environnement

```env
JWT_ACCESS_SECRET=<random 32+ bytes>
```

`JWT_REFRESH_SECRET` figure dans `.env` mais n'est pas utilisée par le code actuel : les refresh tokens sont signés et vérifiés avec `JWT_ACCESS_SECRET` via le `JwtService` global. À aligner si on veut une vraie séparation des secrets.

## Pointeurs code

- `src/common/auth/` — `@Public`, `@CurrentUser`, `JwtAuthGuard`, `JwtStrategy`, `OwnershipService`, `AuthContextModule` (global).
- `src/modules/auth/` — register / login / refresh + `Session`.
- `src/modules/event/game.gateway.ts` — JWT au handshake WS.
