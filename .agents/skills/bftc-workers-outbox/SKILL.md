---
name: bftc-workers-outbox
description: Use for BFTC workers, pg-boss, EventOutbox, Socket.IO events, realtime updates, ticks, combat/return, or frontend notifications.
---

# BFTC Workers + Outbox

The backend is server-authoritative; realtime is DB-first.

## Outbox invariant

Any user-visible backend mutation that must notify the frontend writes an `EventOutbox` row in the same Prisma transaction as the mutation. `OutboxWorker` later emits via `GameGateway` and marks `processedAt`.

New WS event type usually means:

- backend `event/event-types.ts`
- event creation in the service transaction
- frontend `battleforthecrown-pixi/src/api/ws-bindings.ts`
- smoke or backend QA proving the event/effect

## Worker pattern

- One worker per `<name>.worker.ts`.
- Register in `onModuleInit` with injected `PG_BOSS`.
- Wrap/propagate errors so pg-boss retries; never let a job kill the process.
- Size `expireInSeconds` for real job duration.
- Batch heavy reads; avoid unbounded `findMany`.

## Exceptions

`ProductionWorker` and `BarbarianSeedingCatchupWorker` intentionally mutate DB without Outbox. Read `docs/architecture/realtime.md` before adding events there.

## Tests

Workers are orchestration. Do not write `*.worker.spec.ts` with mocked Prisma/pg-boss. Use `bftc-tests-policy`: smoke or backend QA with real effects.

## Gotchas

- Combat/return flow often spans `Combat`, `Expedition`, `Army`, `Loot`, `CombatReport`, and Outbox; verify both DB state and emitted event contract.
- Frontend tolerates 0-1s Outbox latency; do not emit directly from services to "speed it up".
