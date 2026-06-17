---
title: "Backend — NestJS layering, Outbox, Prisma, workers"
scope: "file"
path: ["battleforthecrown-backend/src/**/*.ts"]
severity_min: "high"
languages: ["jsts"]
buckets: ["error-handling", "security", "performance"]
enabled: true
---

@kody-sync

Reference: @file:docs/architecture/decisions.md

## Instructions

**Layering (CRITICAL — bftc-refactor-backend dim.1)**

- Controllers must ONLY: validate input via DTO + call one service method + return.
  Business logic (if/else rules, domain object construction, multi-step orchestration) in a
  controller is a BLOCKING violation.
- `this.prisma.*` in `*.controller.ts` or `*.gateway.ts` is a BLOCKING violation.
- Flag circular module dependencies (A imports B which imports A).

**God services (HIGH — dim.2)**

- Flag service files > 400 LOC or > 8 public methods. They must be split by domain.
- Flag a single service managing unrelated domains (e.g., combat AND resources).

**Outbox pattern (CRITICAL — dim.4 + conventions.md)**

- Every write that produces a domain event MUST create an `EventOutbox` record in the SAME
  `prisma.$transaction(...)`. Flag any transaction that writes domain data but omits the outbox entry.
- Flag `this.server.emit(...)` or `socket.emit(...)` called directly from services/workers.
  All socket events must flow through OutboxWorker, never emitted directly.

**Prisma / DB (HIGH — dim.3)**

- Flag N+1 patterns: a loop containing `.findUnique()`, `.findFirst()`, or `.findMany()`
  without batching via `include`, `Promise.all`, or a single scoped query.
- Flag multi-table writes outside `prisma.$transaction(...)`.
- Flag `$queryRaw` / `$executeRaw` where a typed Prisma query is feasible.

**Error handling (HIGH — dim.5)**

- BLOCK empty catch: `catch (e) {}`.
- BLOCK catch that only logs without rethrowing or wrapping: `catch (e) { console.error(e) }`.
- All HTTP errors must use NestJS `HttpException` subclasses or a typed exception filter.
- All controller inputs must use a DTO class with class-validator decorators.

**Type debt (HIGH — dim.6)**

- Public service methods must have explicit return types (including `Promise<void>`).
- `process.env.*` outside ConfigModule/ConfigService is a violation. Use `configService.get<T>('KEY')`.

**Workers (HIGH — bftc-workers-outbox)**

- pg-boss job handlers must be idempotent: running the same job twice must not produce duplicate side effects.
- Workers must not contain business logic — they orchestrate, services compute.

**Tests (HIGH — dim.8)**

- New service methods touching combat calculations, resource production, population, economy, or
  crown balance require a unit test.
- Flag `it.skip` / `xit` without a `// TODO: reason` comment.
- Tests must assert behavior (output given input), not implementation (mock call chain verification).

## Examples

### Bad example

```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.village.update({ where: { id }, data: { wood: newWood } });
  this.server.emit('village.updated', { id, wood: newWood });
});
```

### Good example

```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.village.update({ where: { id }, data: { wood: newWood } });
  await tx.eventOutbox.create({ data: { type: 'village.updated', payload: { id, wood: newWood } } });
});
```
