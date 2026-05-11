---
name: bftc-tests-policy
description: Use for BFTC test decisions, Jest/Vitest/smokes, Zod, pure formulas, orchestration, stores, or `$run` test planning.
---

# BFTC Tests Policy

Use the smallest durable regression net. Do not add tests "just in case".

## Decision

1. User explicitly asked for a test → continue, but validate the type below.
2. Pure formula, geometry, distance, time, Zod schema, static template, isolated strategy → unit pure-logic.
3. Backend orchestration (controller, service with Prisma, worker, pg-boss, Outbox, WS gateway) → smoke or agent-run backend QA, never unit mocks.
4. Frontend orchestration (TanStack mutation, WS binding, Zustand store wiring) → test only if the mapping/rollback logic is non-trivial.
5. Pixi scene or presentation-only React component → no component/scene test; test helpers/data shapes only.
6. Otherwise → no automated test; explain the QA path.

## Allowed

- Backend unit: `battleforthecrown-backend/src/**/*.spec.ts`, pure logic only.
- Backend smoke: `battleforthecrown-backend/test/*.smoke.spec.ts`, real REST/DB/worker/Outbox. Use `battleforthecrown_smoke`, never dev DB.
- Pixi/Vitest: helpers, Zod forms, API client refresh, WS event mapping, Zustand pure actions, optimistic rollback.
- Shared: test from the consuming workspace; shared itself has no runner.

Commands:

```bash
yarn test:smoke:preflight
yarn workspace battleforthecrown-backend test
yarn workspace battleforthecrown-backend test:smoke
yarn workspace battleforthecrown-pixi test
```

## Forbidden

- `jest.mock('@prisma/client')`, mocked `PrismaService`, mocked `pg-boss`, mocked `setInterval`/`fetch` as the main strategy.
- `expect(mockX).toHaveBeenCalledWith(...)` as the main assertion for business behavior.
- `*.worker.spec.ts`, `*.controller.spec.ts`, or service specs that assert mocked Prisma calls.
- Large snapshots or DOM snapshots for presentation.
- `skip` / `xit` without a linked reason.

If the user asks for a forbidden test, push back and propose the allowed substitute: smoke, pure helper extraction, or `bftc-qa`.

## Gotchas

- Backend orchestration confidence comes from real effects: DB row, REST payload, Outbox event, WS event, or worker result.
- Before backend smokes, run `yarn test:smoke:preflight`; it verifies Docker, `battleforthecrown_smoke`, and Prisma migration status.
- Pixi scenes are expensive and low-signal in tests; extract layout/math/builders and test those.
- Adding a test does not replace QA. Use `bftc-qa` before finalizing code changes.
