# NestJS — règle courte

Gardien léger des conventions backend. Charger les skills spécialisés dès que le scope le demande : `bftc-prisma`, `bftc-workers-outbox`, `bftc-tests-policy`, `bftc-qa`.

## Invariants

- Controller = HTTP seulement : route, params/body/query, auth decorator, délégation au service.
- Service = logique métier, validations, orchestration, transactions.
- Prisma seulement via `PrismaService`; jamais d'accès DB depuis controller.
- Nouveau DTO = Zod + `ZodValidationPipe`. `class-validator` reste legacy, ne pas en ajouter.
- Auth protégée par défaut via `JwtAuthGuard` global ; opt-out seulement avec `@Public()`.
- Accès joueur/village/monde validé dans les services (`OwnershipService` ou équivalent).
- Module Nest = bounded context autosuffisant : imports/providers/controllers/exports explicites.

## Gotchas

- Quand une méthode publique de service est renommée/supprimée, grep `src/`, `test/` et `scripts/`; les scripts sont compilés au boot backend.
- Après changement `packages/shared`, rebuild `@battleforthecrown/shared` avant de croire les smokes.
- Si le code observé contredit cette règle, suivre le code et signaler la contradiction.
