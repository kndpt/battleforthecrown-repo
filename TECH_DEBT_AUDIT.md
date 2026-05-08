# Tech Debt Audit - battleforthecrown-repo

Generated: 2026-05-08

Scope: root workspace, active Pixi frontend, shared package, backend nested repo, and the legacy workspace only where it still affects the active workspace. The working tree was dirty before this audit (`battleforthecrown-pixi/src/features/auth/*`, `packages/shared/src/auth/*`, `useZodForm*`, `tsconfig.tsbuildinfo`), so findings against those files reflect the current local tree, not necessarily committed `main`.

## Executive Summary

- The current Pixi frontend does not type-check: the new shared auth schemas and `useZodForm` integration infer `{}`/incompatible Zod types at the login/register call sites.
- Backend unit tests are red in two high-risk areas: production tick tests are stale after the `updateProduction` signature changed, and loot tests disagree with the runtime unit catalog.
- The highest-impact runtime risk is WebSocket authorization: any authenticated socket can join any `world:<id>` room without a membership check.
- The repo says "TypeScript strict everywhere", but the active Pixi app does not enable `strict`, and the backend explicitly has `noImplicitAny: false`.
- API contract validation is asymmetric: backend/shared now use Zod in several places, but frontend REST responses are still blindly cast after `response.json()`.
- Several docs/rules are stale after recent refactors (`GameSession`, `processedAt`, `training.completed`, `seed-if-needed`), which will mislead future agents.
- World-map and outbox paths are functional but fragile: hardcoded 500x500 bounds, full-world fetches before fog filtering, manual query keys, and unmanaged delayed timers are all easy regression points.
- The legacy Next workspace is still declared as an active Yarn workspace, so root `build/lint/test` continue to include a directory the repo guidance says is temporary and should not be modified.
- Dependency vulnerability audit passed: `yarn audit --groups dependencies --groups devDependencies` reported 0 vulnerabilities. `knip`, `madge`, and `depcheck` were not installed locally; `npx --no-install` still attempted network resolution and failed under DNS restrictions.

## Architectural Mental Model

This is a Yarn workspace around a server-authoritative MMORTS. The active client is `battleforthecrown-pixi`: React owns HUD/routes/forms, Pixi owns canvas scenes, Zustand holds local/session snapshots, and TanStack Query owns REST cache. `packages/shared` is the intended contract layer for pure formulas, enums, and schemas. The backend is a nested NestJS/Prisma/Postgres repo with bounded modules, pg-boss workers for delayed work, and an Outbox table that decouples DB mutations from Socket.IO delivery.

The intended architecture is clear: controllers validate and delegate, use cases own cross-domain mutations, services are read models/helpers, and WebSocket events are emitted from durable Outbox rows. The actual code mostly follows that, but the migration is mid-flight: old docs still describe removed names, strict TS is not fully enabled, frontend cache invalidation still has hand-written keys, and some security/performance assumptions are encoded as comments rather than enforced contracts.

## Findings

| ID | Category | File:Line | Severity | Effort | Description | Recommendation |
|---|---|---:|---|---|---|---|
| F001 | Type & contract debt | `battleforthecrown-pixi/src/features/auth/LoginScreen.tsx:22` | Critical | S | `useZodForm(loginSchema)` currently fails `tsc`; Zod types from the shared package are not assignable to the local schema interface, and `validate()` later returns `{}` at the call site. | Make `useZodForm` generic over `z.input`/`z.output` from the same Zod instance consumed by the app, or expose a small shared `ParsableSchema<T>` type from `packages/shared`. |
| F002 | Type & contract debt | `battleforthecrown-pixi/src/features/auth/RegisterScreen.tsx:32` | Critical | S | Register has the same Zod type mismatch, and the submit path then sees `data.email` / `data.password` as missing from `{}`. | Fix the form helper once, then assert `LoginScreen` and `RegisterScreen` compile under `yarn workspace battleforthecrown-pixi type-check`. |
| F003 | Test debt | `battleforthecrown-backend/src/workers/production.worker.spec.ts:196` | High | S | Backend tests expect `updateProduction('village1', false)`, but production code now calls `updateProduction(village.id)` only. Four tests fail on this stale argument. | Update the spec to the current signature and add a regression assertion that the worker does not create per-tick WS events. |
| F004 | Test debt | `battleforthecrown-backend/src/modules/combat/loot/loot.manager.ts:85` | High | M | `LootManager` ignores `context.config.units.stats` and reads `UNIT_CATALOG.stats`, while tests still inject custom carry capacities and fail. | Decide the source of truth. If world config should override unit carry capacity, use `context.config`; if not, rewrite tests around shared catalog values. |
| F005 | Type & contract debt | `battleforthecrown-pixi/tsconfig.app.json:21` | High | S | The Pixi app does not enable `strict`, despite repo docs claiming strict TS for the active frontend. `noUnused*` is not a substitute. | Add `"strict": true` and fix surfaced errors incrementally, starting with the auth form break above. |
| F006 | Type & contract debt | `battleforthecrown-backend/tsconfig.json:21` | High | M | Backend explicitly sets `"noImplicitAny": false`; this contradicts the root convention and lets implicit `any` leak despite ESLint's explicit-any rule. | Turn on `strict` or at least `noImplicitAny`, then fix errors module by module. |
| F007 | Security hygiene | `battleforthecrown-backend/src/modules/event/game.gateway.ts:55` | High | M | `join:world` accepts any `worldId` from any authenticated socket and joins `world:<id>` without checking `WorldMembership`. World-scoped events can leak to non-members. | Inject an ownership/membership service into the gateway or move room joins through a backend-validated session context. |
| F008 | Security hygiene | `battleforthecrown-backend/src/modules/event/game.gateway.ts:17` | Medium | S | Socket.IO CORS is `cors: true`, while REST CORS is restricted to `FRONTEND_URL`. The WS surface is more permissive than REST. | Mirror REST CORS configuration in `@WebSocketGateway({ cors: { origin, credentials: true } })`. |
| F009 | Security hygiene | `battleforthecrown-backend/src/modules/auth/auth.service.ts:140` | Medium | M | Refresh returns the same refresh token instead of rotating it; a stolen refresh token remains valid until session expiry. | Rotate refresh tokens on refresh and invalidate the previous session row atomically. |
| F010 | Security hygiene | `battleforthecrown-pixi/src/stores/auth.ts:35` | Medium | M | Access and refresh tokens are persisted in `localStorage`, making XSS token theft persistent across reloads. | Prefer httpOnly refresh cookies plus in-memory access tokens, or document the accepted threat model and add CSP/sanitization hardening. |
| F011 | Type & contract debt | `battleforthecrown-pixi/src/api/client.ts:153` | High | M | REST responses are blindly cast from JSON to `T`; shared Zod schemas do not protect frontend REST boundaries. | Add parser hooks to `ApiClient` or parse in query hooks for auth, world config, events-derived DTOs, and combat reports. |
| F012 | Consistency rot | `battleforthecrown-pixi/src/api/ws-bindings.ts:68` | Medium | S | `applyBuildingCompleted` uses literal query keys while `queryKeys` exists. This exact drift already happened elsewhere in this file historically. | Replace all literal cache keys in bindings with `queryKeys.*` factories. |
| F013 | Consistency rot | `battleforthecrown-pixi/src/api/queries.ts:114` | Medium | S | `useJoinWorldMutation` invalidates `['memberships']` and `['villages']`, but the actual keys include `userId`/`worldId`. This relies on fuzzy prefix matching. | Use `queryKeys.myMemberships(userId)` / `queryKeys.myVillages(userId, worldId)` or intentionally document prefix invalidation helpers. |
| F014 | Type & contract debt | `battleforthecrown-pixi/src/api/queries.ts:513` | Medium | S | `useAttackMutation` returns `unknown`, even though combat launch is a critical contract that drives resource, army, and expedition UI. | Define and validate an `AttackResponseDto` shared with backend or return `void` if the payload is intentionally ignored. |
| F015 | Type & contract debt | `battleforthecrown-pixi/src/api/queries.ts:480` | Low | S | `useDeleteReportMutation` uses `unknown` for a delete endpoint whose shape should be `void`/`204` or a known DTO. | Type this as `void` and make `ApiClient.delete<void>` the standard for empty deletes. |
| F016 | Error handling & observability | `battleforthecrown-pixi/src/features/combat/ReportDetailModal.tsx:151` | Medium | S | Delete-report failure is only `console.error`; the user gets no toast or recovery path. | Push a UI toast and keep the modal open with `isDeleting` reset. |
| F017 | Error handling & observability | `battleforthecrown-pixi/src/api/ws-bindings.ts:128` | Medium | M | Battle phase timers are scheduled with `setTimeout`, but `bindServerEvents` cleanup only unregisters socket handlers. Logout/navigation cannot cancel already scheduled store mutations. | Track timeout IDs inside binding context and clear them in the cleanup returned by `bindServerEvents`. |
| F018 | Consistency rot | `battleforthecrown-pixi/src/features/layout/GameHeader.tsx:97` | Low | S | Header notifications are hardcoded to `0` even though `useUnreadReportsCount` exists for unread combat reports. | Wire the existing unread-count hook or remove the notification affordance until it has data. |
| F019 | Test debt | `battleforthecrown-pixi/src/features/layout/AuthenticatedShell.tsx:108` | Medium | M | Expedition status is cast directly to the frontend phase union; no test covers `AuthenticatedShell`, and a backend enum change would silently become a bad UI state. | Add a small mapper with exhaustive handling and unit tests for backend expedition statuses. |
| F020 | Architectural decay | `battleforthecrown-pixi/src/api/queries.ts:24` | Medium | M | `queries.ts` is a 658-line mixed registry of keys, DTOs, auth, world, village, army, combat, config, and mutations. It is also one of the highest-churn files. | Split by domain (`queries/auth.ts`, `queries/village.ts`, etc.) while re-exporting a stable public API. |
| F021 | Architectural decay | `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts:137` | Medium | L | `WorldMapScene` combines terrain generation, viewport setup, fog rendering, entity reconciliation, expedition visuals, selection, and resize lifecycle in one 629-line file. | Extract terrain/fog layers and entity reconciliation into scene-local helpers with their own tests for pure coordinate math. |
| F022 | Performance & resource hygiene | `battleforthecrown-backend/src/workers/production.worker.ts:57` | High | M | Production tick loads every village in the world and then updates each sequentially. This will not scale to persistent-world populations. | Page villages in batches and make `ResourcesService.updateProduction` accept preloaded data or bulk-update where possible. |
| F023 | Performance & resource hygiene | `battleforthecrown-backend/src/modules/world/world-entities-query.service.ts:59` | High | M | `getAllEntities` reads all entities and all barbarian villages before fog filtering in `WorldController`; fog does not reduce DB work. | Query by visible disks/chunks server-side, or require viewport/radius parameters from the client. |
| F024 | Performance & resource hygiene | `battleforthecrown-backend/src/modules/world/world-entities-query.service.ts:34` | Medium | S | Radius queries clamp `maxX`/`maxY` to `499`, while `World.gridWidth` and `gridHeight` are configurable. Non-500 worlds will be clipped. | Read world dimensions or pass grid bounds into the query service instead of hardcoding 500x500. |
| F025 | Type & contract debt | `battleforthecrown-backend/src/modules/world/world.controller.ts:54` | Medium | S | `parseInt` results are not checked for `NaN`; a query like `centerX=abc` still sets `x !== undefined` and flows into Prisma filters. | Parse with Zod/coercion schemas for world query params and reject invalid inputs with 400. |
| F026 | Security hygiene | `battleforthecrown-backend/src/modules/power/power.controller.ts:34` | Medium | S | Public leaderboard `limit` uses `parseInt(limit, 10) || 20` without an upper bound. A client can request arbitrarily large leaderboards. | Clamp `limit` with a Zod number schema, e.g. `1..100`. |
| F027 | Performance & resource hygiene | `battleforthecrown-backend/src/modules/resources/resources.service.ts:45` | Medium | M | `getResources` performs a catch-up write and recursively calls itself when data is stale. Concurrent reads can trigger redundant writes and duplicate work. | Fold catch-up and read projection into a single transaction/helper that returns the fresh payload directly. |
| F028 | Performance & resource hygiene | `battleforthecrown-backend/src/modules/crowns/crowns.service.ts:104` | Medium | M | `updateProduction` opens a transaction, then calls `calculateProductionRate`, which uses `this.prisma` outside the transaction. The rate can be computed from a different snapshot than the balance update. | Make `calculateProductionRate` accept `PrismaClientOrTx` and pass `tx`. |
| F029 | Consistency rot | `battleforthecrown-backend/src/modules/crowns/crowns.service.ts:247` | Low | M | Crowns still uses `createOutboxEvent` directly, while gameplay uses `OutboxPublisher`; two event-publishing patterns remain. | Either intentionally document combat/crowns as exceptions or add `crownsChanged` to `OutboxPublisher`. |
| F030 | Test debt | `battleforthecrown-pixi/src/features/auth/LoginScreen.tsx:22` | High | S | Pixi tests pass even while auth screens fail type-check; no component or integration test exercises the form schema path. | Add focused tests for login/register validation after fixing the type error. |
| F031 | Dependency & config debt | `package.json:5` | Medium | M | The legacy Next app is still an active Yarn workspace, so root `yarn workspaces run build/lint/test` includes a directory the root guidance says is temporary and should not be modified. | Remove `battleforthecrown` from root workspaces after archive validation, or move legacy commands behind explicit scripts. |
| F032 | Dependency & config debt | `battleforthecrown-backend/package.json:15` | Low | S | Backend `lint` runs ESLint with `--fix`, so a verification command can mutate files. | Split `lint` and `lint:fix`; use non-mutating lint in CI/audit workflows. |
| F033 | Documentation drift | `battleforthecrown-pixi/README.md:42` | Low | S | Pixi README still says `features/game` contains `GameSession`, but the current shell is `features/layout/AuthenticatedShell`. | Update the structure tree and route description to match ADR-13. |
| F034 | Documentation drift | `docs/architecture/auth.md:28` | Low | S | Auth docs still list `/world/seed-if-needed` as a public dev/admin route, but the current world controller has no such endpoint. | Remove the stale route from the public-route table. |
| F035 | Documentation drift | `battleforthecrown-backend/.claude/rules/workers.md:76` | Low | S | Worker rules still describe `processedAt` and event `training.completed`/`player.died`; the current schema/code uses `dispatchedAt` and `unit.training.completed`, with no `player.died` schema. | Refresh worker rules from `EventOutbox` schema and `EVENT_PAYLOAD_SCHEMAS`. |

## Top 5 If You Fix Nothing Else

1. **F001/F002 - Restore Pixi type-check.**
   - Change `useZodForm` to consume a stable Zod-compatible type from the app's Zod instance, or export form schemas from the same package instance the frontend compiles against.
   - Run `yarn workspace battleforthecrown-pixi type-check` until clean.

2. **F007 - Authorize WebSocket world joins.**
   - Add `WorldMembership` lookup in `handleJoinWorld`.
   - Return an error and do not `client.join()` if the authenticated user is not a member.
   - Add gateway tests for member, non-member, and missing-auth cases.

3. **F003/F004 - Make backend tests meaningful again.**
   - Update production worker specs to the current signature.
   - Decide whether loot capacity is shared-catalog or world-config driven, then align tests and implementation.
   - Keep `yarn workspace battleforthecrown-backend test --runInBand` green before more gameplay refactors.

4. **F005/F006 - Enforce real strict TypeScript.**
   - Pixi: add `"strict": true` to `tsconfig.app.json`.
   - Backend: turn on `noImplicitAny`; then consider full `strict`.
   - Do this after F001/F002, not before, to keep the error list actionable.

5. **F011/F012/F013 - Centralize API contracts and query keys.**
   - Add parser support to `ApiClient` or domain query hooks.
   - Replace literal query keys with `queryKeys`.
   - Add a lint/test guard that fails on unapproved literal query keys in `ws-bindings.ts`.

## Quick Wins

- [ ] F003: Remove the stale `false` argument from production worker specs.
- [ ] F012: Replace `applyBuildingCompleted` literal query keys with `queryKeys`.
- [ ] F016: Show a toast on report-delete failure.
- [ ] F018: Wire `useUnreadReportsCount` into `GameHeader`.
- [ ] F025: Validate world entity query params with Zod.
- [ ] F026: Clamp public leaderboard `limit`.
- [ ] F032: Split backend `lint` and `lint:fix`.
- [ ] F033/F034/F035: Refresh stale docs/rules.

## Things That Look Bad But Are Actually Fine

- `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts:491` clears maps without manually destroying every entity visual in `exit()`, which looks suspicious. `SceneManager` calls `scene.view.destroy({ children: true })` after `exit()` at `battleforthecrown-pixi/src/pixi/scenes/SceneManager.ts:67`, so Pixi children are destroyed by the manager. Do not "fix" this by double-destroying.
- `battleforthecrown-pixi/src/features/layout/AuthenticatedShell.tsx:46` binds server events in one shell-level effect. That used to be a lifecycle smell when `GameSession` was wrapped per screen, but `App.tsx:107` now mounts `AuthenticatedShell` once above protected routes, which is the right ownership boundary.
- `battleforthecrown-backend/src/modules/event/event-outbox.service.ts:74` catches per-event dispatch failures and continues. That looks like swallowed errors, but for an Outbox dispatcher it is intentional: one malformed event should not block later events forever. The missing piece is better poison-event handling, not throwing the whole batch.
- `battleforthecrown-backend/src/modules/combat/loot/loot.manager.ts:43` executes loot providers sequentially. That is acceptable because providers share remaining carry capacity; parallelization would make resource allocation order ambiguous.
- `battleforthecrown-pixi/src/stores/game.ts:25` persists selected `worldId`/`villageId` in localStorage. Unlike auth tokens, this is not sensitive and helps restore the player context after reload.
- `packages/shared/src/events/schemas.ts:100` duplicates TypeScript event interfaces with Zod schemas. This is intentional contract hardening at runtime boundaries, not redundant typing to remove.

## Open Questions For The Maintainer

- Should world-scoped WebSocket rooms ever be joinable by non-members for public spectator features, or should every `world:<id>` join be membership-guarded?
- Should unit carry capacity be globally defined in `UNIT_CATALOG`, or configurable per world through `CombatConfig`? Tests and implementation currently disagree.
- Is the legacy Next workspace still needed in root `workspaces`, or can it be fully removed from active Yarn commands now that the Pixi app is the active frontend?
- Is refresh-token rotation intentionally postponed for MVP, or should it be treated as part of the auth baseline before wider testing?
- Should public world config remain pre-login-visible, or should sensitive per-world balance settings move behind auth/member checks?

## Tooling Notes

- `yarn workspace battleforthecrown-pixi type-check` failed with the auth/Zod errors cited in F001/F002.
- `yarn workspace battleforthecrown-pixi test` passed: 12 files, 63 tests. Vitest printed the known jsdom canvas `getContext()` warning.
- `yarn workspace @battleforthecrown/shared build` passed.
- `yarn workspace battleforthecrown-backend build` passed.
- `yarn workspace battleforthecrown-backend test --runInBand` failed: 2 suites, 7 tests failed (production worker and loot manager).
- `yarn workspace battleforthecrown-pixi lint` passed with 1 warning: unused `react-hooks/set-state-in-effect` disable in `WorldMapScreen.tsx:85`.
- `yarn audit --groups dependencies --groups devDependencies` passed with 0 vulnerabilities.
- `npx --no-install knip`, `madge`, and `depcheck` could not run because the tools are not installed locally and npm attempted registry DNS resolution.
