---
name: bftc-tests-policy
description: Use for BFTC test decisions, Jest/Vitest/smokes, Zod, pure formulas, orchestration, stores, or `$bftc-run` test planning.
---

# BFTC Tests Policy

Use the smallest durable regression net. Do not add tests "just in case".

Tests doivent viser le comportement observable via interface publique. Ajouter un comportement à la fois : un signal rouge utile, le minimum pour passer vert, puis itérer. Ne pas écrire une matrice de tests imaginés en avance si le premier slice peut changer la compréhension.

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
yarn workspace battleforthecrown-backend test:smoke:preflight
yarn workspace battleforthecrown-backend test
yarn workspace battleforthecrown-backend test:smoke:run -- <file-or-pattern...>
yarn workspace battleforthecrown-backend test:smoke
yarn workspace battleforthecrown-pixi test
```

## Backend smoke targeting

Local agent runs should be targeted; CI PR runs the full smoke suite.

Use existing smoke files under `battleforthecrown-backend/test/*.smoke.spec.ts` as the targeting unit:

| Impact touched | Preferred smoke target(s) |
|---|---|
| auth/login/refresh/JWT guard | `auth.smoke.spec.ts` |
| worlds public/membership/join/session | `worlds-public.smoke.spec.ts`, `world-membership.smoke.spec.ts` |
| village buildings/queue/labels/strategy | `construction.smoke.spec.ts`, `village-labels.smoke.spec.ts`, `village-strategy.smoke.spec.ts` |
| resources/crowns/retention/onboarding | `production-tick.smoke.spec.ts`, `crowns.smoke.spec.ts`, `daily-retention.smoke.spec.ts`, `onboarding.smoke.spec.ts` |
| army training/read/noble | `army-training.smoke.spec.ts`, `army-training-read.smoke.spec.ts`, `recruit-noble.smoke.spec.ts` |
| combat attack/reports/scout/vision | `combat-attack.smoke.spec.ts`, `combat-reports-inbox.smoke.spec.ts`, `scouting.smoke.spec.ts`, `vision.smoke.spec.ts` |
| conquest/capture/finalize | `combat-conquest-hook.smoke.spec.ts`, `conquest-service.smoke.spec.ts`, `conquest-finalize.smoke.spec.ts` |
| recall/reinforcement | `recall-en-route.smoke.spec.ts`, `reinforcements.smoke.spec.ts` |
| realtime/socket/outbox dispatch | domain smoke plus `realtime-socket.smoke.spec.ts` |
| barbarian seeding/templates | `barbarians.smoke.spec.ts` |

Run full local smoke only for cross-cutting changes: Prisma schema/migration, AppModule/boot/config, gateway/outbox global plumbing, auth global, shared contracts consumed by multiple backend domains, worker scheduler infrastructure, or unclear blast radius.

If backend code changed but no smoke is run, the final report must name the exception: pure formula covered by unit, DTO/type-only, dead-code removal, script/fixture outside runtime, or docs-only.

## Forbidden

- `jest.mock('@prisma/client')`, mocked `PrismaService`, mocked `pg-boss`, mocked `setInterval`/`fetch` as the main strategy.
- `expect(mockX).toHaveBeenCalledWith(...)` as the main assertion for business behavior.
- `*.worker.spec.ts`, `*.controller.spec.ts`, or service specs that assert mocked Prisma calls.
- Large snapshots or DOM snapshots for presentation.
- `skip` / `xit` without a linked reason.

If the user asks for a forbidden test, push back and propose the allowed substitute: smoke, pure helper extraction, or `bftc-qa`.

## Gotchas

- Backend orchestration confidence comes from real effects: DB row, REST payload, Outbox event, WS event, or worker result.
- Before backend smokes, run `yarn workspace battleforthecrown-backend test:smoke:preflight`; it verifies Docker/native Postgres, `battleforthecrown_smoke`, clones, and Prisma migration status.
- Pixi scenes are expensive and low-signal in tests; extract layout/math/builders and test those.
- Adding a test does not replace QA. Use `bftc-qa` before finalizing code changes.
