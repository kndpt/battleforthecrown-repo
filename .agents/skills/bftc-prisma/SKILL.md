---
name: bftc-prisma
description: Use for BFTC Prisma schema, migrations, client calls, transactions, relations, enums, seed data, N+1, or DB inspection.
---

# BFTC Prisma

Use Prisma through the project boundaries, not as a generic ORM.

## Rules

- Source of truth: `battleforthecrown-backend/prisma/schema.prisma`.
- Inject `PrismaService` in services. Never instantiate `PrismaClient` outside `infra/prisma/prisma.service.ts`.
- Controllers never access Prisma directly.
- Mutation + `EventOutbox` row must be in the same `$transaction(async tx => ...)`.
- Prefer `select`/`include` deliberately; avoid N+1 loops and loading heavy JSON columns in dense lists.

## Migrations

1. Edit `schema.prisma`.
2. Generate migration with `yarn workspace battleforthecrown-backend prisma migrate dev --name <name>` when appropriate.
3. Inspect `migration.sql`.
4. Non-destructive pending migrations may be applied with `yarn workspace battleforthecrown-backend prisma migrate deploy`.
5. Destructive migrations (`DROP`, `TRUNCATE`, `DELETE`, `ALTER ... DROP`) require explicit user approval.
6. Run `yarn workspace battleforthecrown-backend prisma generate` after schema changes.

`prisma migrate reset` is forbidden.

## Shared enum boundary

When a Prisma enum duplicates a shared union (`VillageStrategy`, `TargetKind`, `ExpeditionStatus`, etc.), maintain bidirectional compile checks in `src/common/prisma-shared-enums.ts`. Prefer that to inline casts.

## Gotchas

- Use `bftc-db` for local SQL reads.
- `world.config` is JSON: merge applicatively, then replace the whole field.
- Prisma decimals need explicit conversion (`Number(value)`) unless precision matters.
- Few cascades exist; destructive deletes are application orchestration.
