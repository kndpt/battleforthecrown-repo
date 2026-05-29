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

- status: candidate
  area: `battleforthecrown-pixi/src/api/queries.ts`
  note: Prior audits flagged this as a high-value contract/API surface; reverify before editing.

- status: candidate
  area: `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts`
  note: Prior audits flagged this as a high-value Pixi scene surface; prefer small rendering/input cleanup only.

- status: candidate
  area: `battleforthecrown-backend/src/modules/world/world-entities-query.service.ts`
  note: Prior audits flagged this as a high-value backend query surface; look for query shape, N+1, or contract drift.

- status: candidate
  area: `battleforthecrown-backend/src/workers/production.worker.ts`
  note: Prior audits flagged this as a high-value worker surface; preserve Outbox/server-authoritative invariants.

## Runs

- 2026-05-29: initialized with known high-value candidate areas; outcome: baseline-only.
