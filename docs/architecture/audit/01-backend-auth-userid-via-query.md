# 01 — Backend : `userId` passé en `@Query` au lieu d'être tiré du JWT

**Statut** : ✅ Résolu le 2026-05-06
**Sévérité** : 🔴 Critique
**Workspace(s)** : `battleforthecrown-backend`
**Tags** : security, auth, controllers

## Résolution

Big bang d'auth (option A retenue après analyse de 4 solutions) :

- `JwtAuthGuard` enregistré comme `APP_GUARD` global avec opt-out via `@Public()` (auth, health, world public, leaderboard).
- Tout `userId` côté client (`@Query`, `@Param`, `@Body`) remplacé par `@CurrentUser()` issu du JWT validé.
- Nouveau `OwnershipService` (`assertVillageOwnedBy`, `assertWorldMember`) injecté dans les services métier — bloque toute action croisée user A → ressource de B.
- URLs nettoyées : `/world/users/:userId/memberships` → `/world/me/memberships` ; `/power/kingdom/:userId` → `/power/kingdom` ; `/crowns/:userId/:worldId` → `/crowns/:worldId`.
- DTOs mis à jour : `JoinWorldRequest`, `ChangeStrategyRequest` perdent leur champ `userId`.
- Frontend Pixi aligné : `queries.ts` ne pousse plus `userId` côté wire ; les call-sites lisent `userId` depuis `useAuthStore` uniquement pour les query keys d'invalidation.

Vérification fonctionnelle : login + flow complet (combat, upgrade, train, reports, crowns, join world) + tentative cross-user → tout vert. Spec unitaires triviaux supprimés (à recouvrir avec intent plus tard).

Voir le commit `feat(backend/auth): enforce JWT globally with resource ownership checks` côté sous-repo backend, et `refactor(pixi-frontend,shared): drop userId from API calls (now from JWT)` côté racine.

## Symptôme

Plusieurs controllers backend acceptent `userId` directement en query string, sans contrainte qu'il corresponde à l'utilisateur authentifié par le JWT. Un client peut donc passer un `userId` arbitraire et accéder aux données d'autres utilisateurs (lecture, et potentiellement écriture selon l'endpoint).

## Localisation

Endpoints concernés (rapport backend Phase A) :

- `src/modules/combat/combat.controller.ts:19` — `attack()` : `@Query('userId') userId`
- `src/modules/combat/combat.controller.ts:25` — `getActiveExpeditions()` : idem
- `src/modules/combat/combat.controller.ts:32` — `getAllReports()` : idem
- `src/modules/power/power.controller.ts` — patterns similaires (à confirmer ligne par ligne)
- `src/modules/crowns/crowns.controller.ts` — patterns similaires
- `src/modules/world/world.controller.ts` — endpoint `POST /world/join` accepte `userId` dans le body via `JoinWorldDto`

À auditer : tous les autres endpoints qui prennent `userId` ou `villageId` en argument client sans vérifier l'ownership.

## Détail technique

Le projet a déjà :
- Un `JwtAuthGuard` opérationnel (`src/common/auth/jwt-auth.guard.ts`).
- Une stratégie JWT Passport.
- Une infra `Session` en DB (refresh tokens hashés).

Mais l'application du guard n'est pas systématique, et il n'existe pas (ou n'est pas utilisé partout) de décorateur `@CurrentUser()` qui extrait `req.user.userId` validé. Résultat : la majorité du backend dépend de ce que le client déclare, pas de ce que le JWT prouve.

Exemple théorique d'attaque :
```
GET /combat/reports?userId=<id-de-la-victime>
→ retourne les rapports de combat de la victime
```

## Impact

- **Confidentialité** : tout user authentifié peut lire les données de tout autre user (rapports, expéditions actives, balance couronnes, classement détaillé).
- **Intégrité** : selon les endpoints, possible d'agir au nom d'un autre user. À vérifier précisément pour `POST /combat/attack` (un attaquant peut-il déclencher une attaque depuis le village de quelqu'un d'autre ?).
- **Conformité / audit** : aucune trace fiable de "qui a fait quoi" tant que l'identité n'est pas authentifiée côté serveur.

## Contexte

Le projet est en phase MMORTS prototype. Le pattern actuel a probablement été retenu pour aller vite ; l'authentification existe (JWT login/refresh), mais l'enforcement sur les endpoints métier a été repoussé. Il reste maintenant à industrialiser.

## Pistes à explorer (sans engagement)

- Decorator custom `@CurrentUser()` qui retourne `req.user` typé après `JwtAuthGuard`.
- `JwtAuthGuard` global sur `AppModule` avec `@Public()` opt-out pour `/auth/login`, `/auth/register`, `/auth/refresh`.
- Audit exhaustif des controllers : remplacer chaque `@Query('userId')` / `@Body() { userId }` par `@CurrentUser()`.
- Vérifier l'ownership croisée : pour les endpoints qui prennent `villageId`, valider que `village.userId === currentUser.userId` (ou `village.worldId` accessible au currentUser via `WorldMembership`).

## Tickets liés

- Aucun direct, mais la solution touchera transversalement tous les controllers métier. À combiner éventuellement avec [09 — typage relâché backend](./09-backend-relaxed-typing.md) si on type aussi `req.user`.

## Dimensions à valider en sortie

- Plus aucun controller métier n'accepte `userId` côté client.
- Les routes protégées renvoient 401 sans JWT valide, 403 si l'ownership de la ressource ne correspond pas.
- Tests d'intégration couvrant un cas "user A tente de lire les données de user B".
