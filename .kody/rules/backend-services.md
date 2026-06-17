---
title: "Backend — service invariants"
scope: "file"
path: ["battleforthecrown-backend/src/**/*.service.ts"]
severity_min: "high"
languages: ["jsts"]
buckets: ["error-handling", "security"]
enabled: true
---

@kody-sync

## Instructions

Flag:

1. Direct Socket.IO `emit` — use Outbox instead.
2. Multi-table writes outside `$transaction`.
3. Swallowed exceptions in catch blocks.
4. Public methods without explicit return types.

## Examples

### Bad example

```typescript
async updateResources(villageId: string, delta: ResourceDelta) {
  try {
    await this.prisma.village.update({ where: { id: villageId }, data: delta });
    this.gateway.server.emit('resources.updated', { villageId, delta });
  } catch (e) {
    this.logger.error(e);
  }
}
```

### Good example

```typescript
async updateResources(villageId: string, delta: ResourceDelta): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    await tx.village.update({ where: { id: villageId }, data: delta });
    await tx.eventOutbox.create({ data: { type: 'resources.updated', payload: { villageId, delta } } });
  });
}
```
