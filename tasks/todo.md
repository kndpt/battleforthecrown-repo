# Ticket 64 - remove deprecated WorldEntity

- [x] Preflight: git clean, ticket, source 63, rules, SPEC, backend briefing, Prisma/test skills lus.
- [x] Cartographie: usages `WorldEntity` / `world_entity` dans runtime, scripts, smokes, docs.
- [x] Implémenter le retrait runtime/Prisma sans migration destructive non approuvée.
- [x] Mettre à jour les docs et helpers impactés.
- [x] Vérifier Prisma generate, smokes vision/world map, static-check.
- [x] Review 5 axes + archive ticket + `tasks/README.md` + commit.

## Notes

- Scope strict: `WorldEntitiesQueryService` doit consommer uniquement `Village`.
- Migration: pas de `DROP TABLE` sans accord user explicite (`SPEC.md §C`). Le schéma Prisma peut oublier la table pendant que la table physique legacy reste non gérée.
- Hors scope: recalibrage vision/fog, changement de payload frontend, reset DB.

## Review

- Correctness: `WorldEntitiesQueryService` ne lit plus `prisma.worldEntity`; villages joueurs/barbares restent projetés depuis `Village`.
- Readability: retrait net du modèle Prisma et du script legacy, sans alias de compatibilité.
- Architecture: source canonique unique `Village`; pas de migration destructive générée.
- Security: aucun endpoint/auth/secret modifié.
- Performance: une requête legacy supprimée dans `getAllEntities` et `getEntitiesInRadius`.
- Review indépendante: GO. Mineur schema comment traité.

## Verification

- `yarn workspace battleforthecrown-backend prisma:generate` OK.
- `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown" yarn workspace battleforthecrown-backend prisma validate` OK.
- `yarn test:smoke:preflight` OK.
- `yarn workspace battleforthecrown-backend test:smoke:run --runInBand` : 22/23 suites OK, `reinforcements.smoke.spec.ts` timeout.
- `yarn workspace battleforthecrown-backend test:smoke:run reinforcements.smoke.spec.ts --runInBand` OK.
- `yarn static-check` OK.
- SQL local : `SELECT count(*) FROM world_entity;` = 0 sur `battleforthecrown` et `battleforthecrown_smoke`.
