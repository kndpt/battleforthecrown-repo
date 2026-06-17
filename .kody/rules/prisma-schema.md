---
title: "Prisma schema governance"
scope: "file"
path: ["battleforthecrown-backend/prisma/schema.prisma"]
severity_min: "high"
enabled: true
---

@kody-sync

## Instructions

**Prisma schema rules (bftc-prisma)**

- Schema changes MUST have a matching migration file. Flag schema edits without a new migration.
- NEVER use `migrate reset` or destructive seed overwrites.
- New models and fields must be documented in `docs/architecture/data-model.md`.
- Flag: missing `@@index` on foreign key fields, nullable fields that should be non-nullable,
  enum values without a corresponding TypeScript type in `packages/shared/`.

## Examples

### Bad example

```prisma
model Battle {
  id        String  @id @default(cuid())
  villageId String
  village   Village @relation(fields: [villageId], references: [id])
}
```

No migration added, no `@@index` on `villageId`, and no shared TypeScript enum/type update.

### Good example

Schema change ships with a new migration, `@@index([villageId])`, and a matching type in `packages/shared/`,
plus an update to `docs/architecture/data-model.md`.
