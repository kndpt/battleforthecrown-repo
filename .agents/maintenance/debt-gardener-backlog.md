# BFTC Debt Gardener Backlog

This backlog tracks bounded existing-debt candidates for `bftc-debt-gardener`.

## Candidate States

- `candidate`: worth inspecting in a future run.
- `proposed`: selected by an open PR.
- `fixed`: merged or otherwise resolved.
- `rejected`: inspected and intentionally skipped.

## Rotation Hints

- Shared formulas/contracts.
- Backend APIs, services, workers, Outbox.
- Pixi API layer, stores, view-models, scenes.
- Gameplay and architecture documentation drift.

## Candidates

- status: proposed
  area: `battleforthecrown-backend/src/modules/event/game.gateway.ts`
  branch: claude/bftc-debt-gardener-EGUH6
  title: "fix(backend/event): type verifyAsync with JwtPayload in GameGateway"
  note: >
    `verifyAsync(token)` returned untyped `unknown`, forcing an eslint-disable for `.sub` access.
    `JwtPayload` with `sub: string` already existed in `src/common/auth`. Fix: use
    `verifyAsync<JwtPayload>(token)`, import the type, remove the eslint-disable.
  verification: yarn static-check ✓

- status: candidate
  area: `battleforthecrown-pixi/src/api/queries.ts`
  note: Prior audits flagged this as a high-value contract/API surface; reverify before editing.

- status: candidate
  area: `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts`
  note: Prior audits flagged this as a high-value Pixi scene surface; prefer small rendering/input cleanup only.

- status: proposed
  area: `battleforthecrown-backend/src/modules/world/world-entities-query.service.ts`
  branch: claude/bftc-debt-gardener-EGUH6
  title: "fix(backend/world): parse barbarian village data with Zod schema"
  note: >
    `barbarianVillageDataSchema` was defined but never called (suppressed with eslint-disable).
    Meanwhile `playerVillageDataSchema.parse()` was used symmetrically. Fix: call `.parse()`
    on the assembled barbarian data, mirror the player village pattern, remove eslint-disable.
  verification: yarn static-check ✓ · yarn test:world (114 tests) ✓

- status: candidate
  area: `battleforthecrown-backend/src/workers/production.worker.ts`
  note: Prior audits flagged this as a high-value worker surface; preserve Outbox/server-authoritative invariants.

## Runs

- 2026-05-29: initialized with known high-value candidate areas; outcome: baseline-only.
- 2026-05-29: selected `world-entities-query.service.ts` — barbarian schema parse symmetry; PR on `claude/bftc-debt-gardener-EGUH6`.
- 2026-05-29: selected `game.gateway.ts` — type verifyAsync with JwtPayload; same branch.
