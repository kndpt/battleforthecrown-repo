# Code Quality Report — Backend

Populated by `/bftc-refactor-backend`. Each run appends a dated entry.

New PRs use branch `maint/refactor-backend/<short-topic>` and PR title
`maint(refactor-backend): <subject>`. Older report entries may keep legacy
`claude/*` branch names.

---

## Run 2026-06-04 — branch `maint/refactor-backend/resources-fetch-rates`

**Model:** claude-sonnet-4-6
**Scan commit:** `3ac0888`

---

### Prior findings status (Run 2026-06-03)

| ID | Status | Note |
|----|--------|------|
| E1 | **RESOLVED** | Crown balance TOCTOU fixed (commit `5e817c2`). |
| E2 | **RESOLVED** | Resource TOCTOU fixed (`updateMany WHERE >= cost` in `changeStrategy`). |
| E3 | **RESOLVED** | Cooldown TOCTOU fixed (atomic `updateMany WHERE cooldownEndsAt <= now`). |
| C6 | **STILL OPEN** | Recursive `this.getResources` at `resources.service.ts:50`. Terminates in 2 steps max (updateProduction stamps `lastUpdateTs = now`, second call's elapsed < threshold). Not a bug; cosmetically surprising. |
| B3 | **STILL OPEN** | `getUserIdByVillage` N+1 in outbox dispatch (`event-outbox.service.ts:539`, ~15 call-sites). Deferred (5th run). |
| B4 | **STILL OPEN** | Verbose `logger.log` in hot dispatch loop (`event-outbox.service.ts:65-91` + 8 notify sites). Deferred. |
| B5 | **STILL OPEN** | Capture duration tables hardcoded at `combat.worker.ts:35-49`. PR #46 (draft) proposes extraction but not merged. |
| B6 | **STILL OPEN** | `applyDefenderLosses`/`getCaptureDurationMs` re-spell inline `Prisma.VillageGetPayload<…>` instead of `DefenderVillage` alias (`combat.worker.ts:949-951, 1063-1065`). Low. |
| D4 | **STILL OPEN** | `expedition.create` block repeated 4× in `combat.service.ts`. Deferred. |
| D5 | **STILL OPEN** | `buildBarbarianDefender`/`buildPlayerDefender` garrison loop duplication (`combat.worker.ts:842-866, 911-930`). Deferred. |
| D6 | **STILL OPEN** | Verbose `logger.log` at entry of each combat public method. Low. Deferred. |

---

### Module structure (mental model)

`src/` = bounded contexts under `modules/` + cross-cutting `workers/`, `infra/`, `common/`. Layering clean: only `health.controller.ts` touches Prisma (liveness ping). Zero `as any`, zero `console.*`, zero `@ts-ignore` in production code. Combat module still largest by size and churn (`combat.worker.ts` 1389, `combat.service.ts` 911). Prior TOCTOU fixes closed E1/E2/E3. `event-outbox.service.ts` (560 LOC) carries B3/B4. `resources.service.ts` (340 → 293 LOC after this run) had the highest intra-service duplication. `crowns.service.ts` (282) and `world-entities-query.service.ts` (258) introduced minor new findings (N2, N3).

---

### Findings

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| N1 | Duplication | `resources.service.ts:98-126, 160-175, 264-285` (pre-fix) | **SELECTED** — `findBuilding + getProductionRate` × 3 resources repeated 3× in `updateProduction`, `calculateCurrentResources`, `getProductionRates`. ~30 LOC × 3. Extracted to `fetchBuildingRates` private helper. | Medium | S |
| N2 | Duplication | `crowns.service.ts:131-178, 202-248` | `updateProduction` and `recalculateOnBuildingChange` duplicate the crown production accumulation pattern (find balance → calculateProductionRate → elapsedHours → floor → increment). Only divergence: `recalculateOnBuildingChange` creates balance if missing, always emits event. | Low | M |
| N3 | Correctness | `world-entities-query.service.ts:98-100` | `getVillagesInRadius` missing upper-bound clamp on `maxX`/`maxY` (const `maxX = centerX + radius` vs `getEntitiesInRadius` which uses `Math.min(…, 499)`). No practical Prisma bug but inconsistent with sibling method. | Low | S |

---

### Looks bad but is actually fine

- **`this.getResources` recursive call** (`resources.service.ts:50`) — terminates in exactly 2 calls: `updateProduction` stamps `lastUpdateTs = now`, so the second call's `elapsedMs` ≈ 0, well below `PRODUCTION_CATCHUP_THRESHOLD_MS`. Not N+1 recursion.
- **`calculateProductionRate` called inside `$transaction` in `recalculateOnBuildingChange`** (`crowns.service.ts:224`) — uses `this.prisma` (not the tx client), so it reads committed state. The building update is committed before this method is called (from construction worker). Correct.
- **`getProductionRate` is async** (`WorldConfigService`) — in-memory config cache, no DB round-trips. The `Promise.all` in the new `fetchBuildingRates` helper is a cosmetic parallelization bonus, not an N+1 fix.
- **`PVP_CAPTURE_DURATIONS_MS` / `BARBARIAN_CAPTURE_DURATIONS_MS` hardcoded** — B5 still open; draft PR #46 proposes extraction to `capture-duration.ts` but not yet merged.
- **`VillageStrategy` (Prisma) vs `VillageStrategyType` (shared)** — both resolve to the same string literal union; TypeScript structural compatibility allows passing one where the other is expected without cast.

---

### Selected theme: N1 — Extract `fetchBuildingRates` in `ResourcesService`

**Why this over alternatives:**
- `resources.service.ts` had the most glaring intra-file duplication — the same 30-LOC pattern 3× with no semantic difference.
- Single-file scope, pure extraction, fully behavior-preserving. No public API change, no Prisma change, no gameplay rule change.
- The 3 callers (`updateProduction` / `calculateCurrentResources` / `getProductionRates`) are all in the resource hot path (called per tick, per REST poll, per combat). A single source of truth benefits future strategy bonuses or new resource types.
- **B3 (outbox N+1)** deferred again — real impact but the fix changes `dispatchEvent` signature + 15 notify-function signatures; merits its own focused PR with a load assertion.
- **N2 (crowns duplication)** deferred — Medium effort, the divergence around balance creation makes extraction tricky without obscuring intent.

**Result:**
- `resources.service.ts`: new private `fetchBuildingRates(worldId, buildings, strategy?)` helper, uses `Promise.all` on the 3 independent `getProductionRate` calls.
- `updateProduction`: ~30 LOC of building-lookup + rate-fetch → 5-line destructure call.
- `calculateCurrentResources`: same.
- `getProductionRates`: same.
- Net: 61 insertions / 90 deletions = −29 LOC in service body + 22 LOC helper = −7 LOC net.

### Verification

```shell
yarn static-check                                   → ✅ tsc (backend+pixi) + eslint --quiet, 0 errors
yarn test:backend                                   → ✅ 240 passed, 22 suites
npx jest --config ./test/jest-smoke.json crowns.smoke.spec.ts village-strategy.smoke.spec.ts → ✅ 6 passed
npx jest --config ./test/jest-smoke.json construction.smoke.spec.ts daily-retention.smoke.spec.ts → ✅ 8 passed
```

### Docs impact

Aucun changement nécessaire — refactor interne d'un service (extraction de helper privé), pas de changement d'API REST, d'event WS, de modèle Prisma ni de règle gameplay. Findings B3/B4/B5/B6/D4/D5/D6/N2/N3 restent ouverts, documentés ci-dessus.

---

## Run 2026-06-03 — branch `maint/refactor-backend/strategy-crown-toctou`

**Model:** claude-sonnet-4-6
**Scan commit:** `2c3aed4`

---

### Prior findings status (Run 2026-06-02)

| ID | Status | Note |
|----|--------|------|
| D1 | **RESOLVED** | `loadOwnedVillage` helper in place (`combat.service.ts:647`). |
| D2 | **RESOLVED** | `assertTargetInVision` helper in place (`combat.service.ts:669`). |
| D3 | **RESOLVED** | `scheduleResolution` helper in place (`combat.service.ts:687`). |
| B3 | **STILL OPEN** | `getUserIdByVillage` N+1 in outbox dispatch still at `event-outbox.service.ts:539`, ~16 call-sites. Deferred (4th run). |
| B4 | **STILL OPEN** | Verbose `logger.log` in hot dispatch loop at `event-outbox.service.ts:65-91` + 8 per-notify sites. |
| B5 | **STILL OPEN** | Capture duration tables hardcoded at `combat.worker.ts:35-49`. Low. |
| B6 | **STILL OPEN** | `applyDefenderLosses`/`getCaptureDurationMs` re-spell inline `Prisma.VillageGetPayload<…>` at `combat.worker.ts:947-951, 1063-1066`. Low. |
| D4 | **STILL OPEN** | `expedition.create` block repeated 4× in `combat.service.ts`. Deferred. |
| D5 | **STILL OPEN** | `buildBarbarianDefender`/`buildPlayerDefender` garrison loop duplication at `combat.worker.ts:842-866, 877-945`. Deferred. |
| D6 | **STILL OPEN** | Verbose `logger.log` at entry of each combat public method. Low. |
| C6 | **REOPENED** | Recursive `this.getResources` call at `resources.service.ts:50` marked RESOLVED in run-2 but still present. |

---

### Module structure (mental model)

`src/` = bounded contexts under `modules/` + cross-cutting `workers/`, `infra/`, `common/`. Layering clean: only `health.controller.ts` touches Prisma (liveness ping). Zero `as any`, zero `console.*`, zero `@ts-ignore` in production code. Combat module still dominates by size and churn (`combat.worker.ts` 1389 LOC, `combat.service.ts` 911 LOC, `conquest.service.ts` 565 LOC). The `strategy/` module (`village-strategy.service.ts` 495 LOC) is new-ish and contains a TOCTOU correctness bug in its transaction boundary. `retention/` recently grew to 573 LOC but is well-structured. `event-outbox.service.ts` (560 LOC) still carries the B3 N+1 and B4 log noise.

---

### Findings

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| E1 | Correctness | `village-strategy.service.ts:183-213` | **SELECTED** — `changeStrategy` reads `crownBalance` outside the `$transaction` (line 183), snapshots the balance, then uses `balance: crownBalance.balance - changeCost.crowns` inside the tx (line 210). Two concurrent requests can both pass the `balance < changeCost` check against the same snapshot and both succeed with the same absolute value, leaving the balance at `snapshot - cost` instead of `snapshot - 2×cost`. Crown balance can be overdrafted. | High | S |
| E2 | Correctness | `village-strategy.service.ts:165-228` | **RESOLVED (commit `8580f25`)** — Same TOCTOU pattern for `resourceStock.wood/stone/iron`: pre-tx check removed, replaced with `tx.resourceStock.updateMany WHERE wood/stone/iron >= cost` + count check. Same atomic pattern as E1. CodeRabbit LGTM (lines 207-234). | Medium | S |
| E3 | Correctness | `village-strategy.service.ts:157-163` | **RESOLVED** — Cooldown check read `village.strategyConfig.cooldownEndsAt` before the `$transaction`: two concurrent requests could both pass, both debit, both write `villageStrategyConfig` — double-charge. Folded the guard into an atomic `updateMany WHERE cooldownEndsAt IS NULL OR <= now` at the head of the tx (fail-fast); 0 rows ⇒ disambiguate row-missing (first change → guarded `create`, P2002→409) vs. cooldown-active (→409). Pre-tx check kept as a free early-out. Concurrency regression test added (`village-strategy.smoke.spec.ts`). | Low | M |
| C6 | Readability/reliability | `resources.service.ts:50` | Recursive `this.getResources(villageId, userId)` call after `updateProduction`. Was marked RESOLVED in run 2026-05-31 but is still present. Terminates after one level (production catchup updates `lastUpdateTs`) but surprising; a loop or an explicit re-read would be clearer. | Low | S |
| B3 | Performance | `event-outbox.service.ts:539` | `getUserIdByVillage` issues one `findUnique` per event in the ~1s dispatch loop — up to 100 sequential single-row queries per batch. Now ~16 call-sites. Carried (4th run). | Medium | M |
| B4 | Observability | `event-outbox.service.ts:65-91` + 8 notify sites | Hot dispatch loop logs 2–3 verbose lines per event at default level on every poll. Should be `debug`. Carried. | Low | S |
| B5 | Config | `combat.worker.ts:35-49` | Capture duration tables hardcoded in worker. Carried. | Low | S |
| B6 | Type debt | `combat.worker.ts:947-951, 1063-1066` | `applyDefenderLosses`/`getCaptureDurationMs` re-spell inline `Prisma.VillageGetPayload<…>` instead of the named `DefenderVillage` alias at line 58. Carried. | Low | S |
| D4 | Duplication | `combat.service.ts:117,187,270,393` | `expedition.create` data block repeated 4× (varies on `kind`/`targetKind`/optional reinforcement fields). Carried. | Medium | M |
| D5 | Duplication | `combat.worker.ts:842-866, 911-930` | `buildBarbarianDefender`/`buildPlayerDefender` share identical garrison→participants aggregation loop (~25 LOC). Carried. | Low | M |
| D6 | Observability | `combat.service.ts:56,155,224,308,432` | `logger.log(…, { dto })` entry in each public method at default level — leaks unit composition/coordinates. Low. Carried. | Low | S |

---

### Looks bad but is actually fine

- **`crownBalance.findUnique` outside tx in `changeStrategy`** — the pre-tx read *was* redundant, and E1 is a real bug. The crown balance check has now been moved inside the tx (this run's fix).
- **`updateProduction` in `CrownsService` reads balance inside tx** (`crowns.service.ts:133`) — correct; this path doesn't share the snapshot bug.
- **`ResourcesService.updateProduction` decrement** is done with absolute arithmetic (`newBalance = balance + production`), also inside a `$transaction` with a re-read — fine.
- **`expireStaleCards` wrapping `expireStaleCardsInTransaction`** in `retention.service.ts:393-408` — wrapper exists to allow calling the inner method either inside or outside a tx. Pattern is valid.
- **`village-strategy.service.ts:383-423` `getProductionRatesForStrategy`** — three sequential `worldConfig.getProductionRate` await calls, each reading from an in-memory config cache (`WorldConfigService`). No DB round-trips; not N+1.
- **`calculateChangeCosts` hardcodes the 4 strategy names** — enum-exhaustive mapping, not a risk; would need a type-safe `Object.values(VillageStrategy)` if strategies were added dynamically. Low/cosmetic.
- **Resource stock TOCTOU (E2)** — atomic `{ decrement }` means the worst case is a temporary negative balance (which existing validation guards handle elsewhere), not a silent overdraft. Distinct from E1 and lower risk. **Now fixed in commit `8580f25`** (same `updateMany WHERE` pattern).
- **`getStrategyInfo` double ownership check** (ownership.assertVillageOwnedBy + findUnique) — the service needs the full village object; the extra query is necessary. Not a finding.

---

### Selected theme: E1 — move crown balance check inside transaction in `changeStrategy`

**Why this over alternatives:**
- **E1 is the highest-severity new finding** and a correctness bug in a financial flow (crowns are spent, not just display state). Two concurrent requests can silently overdraft the crown balance.
- **Scope is minimal** (one file, ~5-line net change): move `crownBalance.findUnique` inside the `$transaction` lambda, change `balance: crownBalance.balance - changeCost.crowns` to `balance: { decrement: changeCost.crowns }`. No public API change, no Prisma migration, no gameplay rule change.
- **Fully verifiable**: existing `village-strategy.smoke.spec.ts` covers the happy path and the cooldown enforcement; `crowns.smoke.spec.ts` covers the crown read-back. Both green post-fix.

**Rejected:**
- **E2 (resource TOCTOU)**: Originally deferred — uses atomic `{ decrement }` already. CodeRabbit upgraded to Major in review; fixed in commit `8580f25` (same `updateMany WHERE` pattern).
- **B3 (outbox N+1)**: Medium effort, hot path, higher blast radius. Deferred (4th run running).
- **D4 (expedition.create dedup)**: Medium effort, 4 create sites diverge enough to risk obscuring intent.
- **B4/B5/B6/D5/D6**: Low severity; bundling with a correctness fix would muddy the diff.

### Result

- `village-strategy.service.ts`: moved `crownBalance.findUnique` inside the `$transaction` lambda; changed absolute `balance: crownBalance.balance - changeCost.crowns` to atomic `balance: { decrement: changeCost.crowns }`. The pre-tx snapshot that enabled the race is gone.
- `village-strategy.service.ts` (commit `8580f25`): also applied atomic `updateMany WHERE wood/stone/iron >= cost` pattern to resource debit (E2), prompted by CodeRabbit Major finding in review.
- No change to `CrownsService.createCrownsChangedEvent` — it already re-reads from the tx client, so it sees the correct decremented value.
- Cooldown check TOCTOU (E3) logged for next run — pre-existing, non-blocking, requires more complex upsert restructure.

### Verification

```shell
yarn static-check                                   → ✅ tsc (backend+pixi) + eslint --quiet, 0 errors
yarn workspace battleforthecrown-backend jest       → ✅ 240 passed, 22 suites
npx jest --config ./test/jest-smoke.json            →
  village-strategy.smoke.spec.ts                    → ✅ 2 passed (both commits)
  crowns.smoke.spec.ts                              → ✅ 3 passed
```

**CodeRabbit final review (commit `8580f25`):**
- Crown debit (lines 181-205): LGTM
- Resource debit (lines 207-234): LGTM
- Cooldown check (lines 157-163): Nitpick/Trivial, not blocking → logged as E3 for next run

### Docs impact

Aucun changement nécessaire — fix interne d'un service (frontière de transaction), pas de changement d'API REST, d'event WS, de modèle Prisma ni de règle gameplay.

---

## Run 2026-06-02 — branch `maint/refactor-backend/combat-service-dedup`

**Model:** claude-opus-4-8
**Scan commit:** `34b14a7`

---

### Prior findings status (Run 2026-05-31)

| ID | Status | Note |
|----|--------|------|
| B1 | **RESOLVED** | `handleCombatResolution` decomposed into 6 named steps (`combat.worker.ts:123-288`); the tx body is now a readable orchestration. |
| B2 | **RESOLVED** | Loot/loss branches unified in `applyLootToDefender` (`combat.worker.ts:296-354`); the only barbarian/PvP divergence is an explicit conditional. |
| B3 | **STILL OPEN** | `getUserIdByVillage` N+1 in outbox dispatch persists (`event-outbox.service.ts:534`, ~20 call-sites resolve villageId→userId one row at a time). Not selected — see rejected themes. |
| B4 | **STILL OPEN** | Verbose per-event `logger.log` (📦/📨/✅/🔔/⚔️/🛡️) in the hot dispatch loop still at default level (`event-outbox.service.ts:65-92` + 8 per-notify sites). Low. |
| B5 | **STILL OPEN** | Capture-duration tables still hardcoded in the worker (`combat.worker.ts:35-49`). Low. |
| B6 | **PARTIAL** | Named `DefenderVillage`/`OccupationDefense` types + `EMPTY_LOOT` added; `applyDefenderLosses`/`getCaptureDurationMs` still re-spell the inline `Prisma.VillageGetPayload<…>` literal (`combat.worker.ts:949-951,1064-1066`). Low. |

---

### Module structure (mental model)

`src/` = bounded contexts under `modules/` + cross-cutting `workers/`, `infra/`, `common/`. Layering is clean: only `health.controller.ts` touches Prisma (a liveness ping — the canonical exception); no other controller or gateway hits the DB. Zero `as any` / `: any` in production code, zero `console.*` outside `scripts/`, zero `@ts-ignore`. The combat module dominates by size **and** churn (`combat.worker.ts` 1389, `combat.service.ts` 907, `conquest.service.ts` 565) and is well sub-divided (`strategies/`, `loot/providers/`, `codecs/`, `*.presenter.ts`, `*-report.service.ts`). The `event/` module owns the Outbox→Socket.IO dispatch loop; `RetentionService`/`OnboardingService` are side-effect listeners hooked into dispatch. The two prior runs hollowed out `combat.worker.ts` (B1) and split `CombatReportService` out of `combat.service.ts` (C2), but `combat.service.ts` has since regrown 683 → 907 LOC as the four expedition-creation paths were added/extended, re-accumulating structural duplication.

---

### Findings

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| D1 | Duplication | `combat.service.ts:60,176,261` | **SELECTED** — owned-village lookup `tx.village.findFirst({ where: { id, userId } })` + `if (!village) throw NotFoundException` repeated verbatim across `initiateAttack`/`initiateScout`/`initiateReinforce` (and a 4th non-owning variant in `initiateRecall`). | Medium | S |
| D2 | Duplication | `combat.service.ts:100-108, 189-197` | **SELECTED** — fog-of-war gate (load config → if `fogOfWar.enabled` → `getVisionDisks` → `isInVision` → `ForbiddenException`) duplicated verbatim in `initiateAttack` and `initiateScout`; only the action verb in the message differs. ~10 LOC × 2. | Medium | S |
| D3 | Duplication | `combat.service.ts:155,239,331,462` | **SELECTED** — `boss.send('combat:resolve', { expeditionId }, { startAfter, singletonKey: \`combat:${id}\` })` block copied identically across all four EN_ROUTE expedition creators. | Medium | S |
| D4 | Duplication | `combat.service.ts:127,213,304,434` | `tx.expedition.create` data block (`worldId`/`attackerVillageId`/`units: encodeUnitMap`/`status: 'EN_ROUTE'`/`departAt`/`arrivalAt`/`outboundTravelMs`) repeated 4× — varies only by `kind`/`targetKind`/`targetRefId`/`targetX/Y` + optional reinforcement fields. | Medium | M |
| B3 | Performance | `event-outbox.service.ts:534` | `getUserIdByVillage` issues one `village.findUnique` per event in the ~1s dispatch loop — up to 100 sequential single-row queries per batch (~20 call-sites resolve villageId→userId individually). Batchable via one `findMany(where id in […])` per batch. Carried from B3/C4. | Medium | M |
| B4 | Observability | `event-outbox.service.ts:65-92` + per-notify | Hot dispatch loop logs 2–3 verbose `logger.log` lines **per event** at default level on every poll, plus 8 emoji per-notify sites — noise + serialization cost in steady state; should be `debug`. Carried. | Low | S |
| B5 | Config | `combat.worker.ts:35-49` | `BARBARIAN_CAPTURE_DURATIONS_MS` / `PVP_CAPTURE_DURATIONS_MS` are gameplay-balance tables hardcoded in the worker rather than world config. Carried. | Low | S |
| B6 | Type debt | `combat.worker.ts:949-951, 1064-1066` | `applyDefenderLosses` / `getCaptureDurationMs` re-spell the inline `Prisma.VillageGetPayload<{ include: { resourceStock; buildings } }>` literal instead of reusing the named `DefenderVillage` alias defined at line 58. Trivial. | Low | S |
| D5 | Duplication | `combat.worker.ts:842-866, 911-930` | `buildBarbarianDefender` and `buildPlayerDefender` share a near-identical garrison→participants aggregation loop (~25 LOC each); only the seed participant + resource source differ. Extractable to a shared `aggregateGarrisonParticipants` helper. | Low | M |
| D6 | Observability | `combat.service.ts:56,173,257,349,480` + worker | Every public combat method opens with a `logger.log` echoing the full `dto` at default level — leaks unit composition / coordinates into steady-state logs; belongs at `debug`. | Low | S |

---

### Looks bad but is actually fine

- **`combat.controller.ts` is 273 LOC** — over the 200-LOC controller threshold, but it's pure delegation: every handler is a one-liner forwarding to a service, the only logic is the `requireWorldId` guard (a routing-level 400). Length is a function of endpoint count, not misplaced logic. Not a finding.
- **`as Payload` casts in `event-outbox.service.ts` switch** — each `case` narrows a value already validated by `parseEventPayload` against `EVENT_PAYLOAD_SCHEMAS` (line 104). Typing bridge over a Zod-checked value with an exhaustive `never` default. Fine.
- **Outbox dispatch `catch` that only logs** (`event-outbox.service.ts:93-95`) — intentional: a failed dispatch leaves `dispatchedAt: null` so the next poll retries. Not swallowed.
- **`boss.send` outside the `$transaction`** (`combat.service.ts:559-569` `recallEnRoute`, `combat.worker.ts:704`) — deliberate, documented inline: avoids scheduling a job a rolled-back tx would orphan. The N+1 scheduleResolution sites (D3) are *inside* their tx by design (same reasoning inverted: they must not fire if the create rolls back) — the dedup keeps them in-tx.
- **`recallEnRoute` relies on the worker status guard instead of cancelling the pg-boss job** (`combat.service.ts:534-538`) — documented fallback; jobId isn't stored, worker no-ops on non-`EN_ROUTE`.
- **`process.env` reads** — confined to `main.ts`/`app.module.ts` bootstrap, `outbox.worker.ts` poll interval, and `join-world.use-case.ts:176` (`startingResourceAmount`, validated + defaulted). No unvalidated secret reads.
- **`resolveTargetVillage` double `worldId` check** (`combat.service.ts:646-656`) — redundant but harmless guard; not worth touching in a dedup PR.

---

### Selected theme: D1 + D2 + D3 — collapse the duplicated expedition-creation skeleton in `CombatService`

**Why this over alternatives:**
- **`combat.service.ts` is the #2 file by size and regrew 683 → 907 LOC** since the last run's split — the clearest "debt re-accumulated" signal in the backend, and it sits in the highest-churn module.
- **D1/D2/D3 are three facets of one root cause**: the four EN_ROUTE expedition creators (`initiateAttack`/`Scout`/`Reinforce`/`Recall`) were written by copy-paste, so ownership lookup, the fog-of-war gate, and the `combat:resolve` scheduling are each duplicated 2–4×. Folding them into named private helpers is one coherent theme, not three.
- **Pure behavior-preserving extraction** → fully covered by the existing smoke suite (`combat-attack`, `scouting`, `reinforcements`, `recall-en-route`, `combat-conquest-hook`) + `static-check`. No public-method signature change, no event/payload change, no Prisma migration, no gameplay rule change.
- **Measurable**: collapses 6 owned-village lookups → 1 helper, 2 fog-of-war gates → 1, and 4 `combat:resolve` scheduling blocks → 1. Net LOC is ~flat (the three helpers cost roughly what the inline duplication did) — the win is single-source-of-truth, not line count: a change to ownership semantics, the fog gate, or the resolution-queue contract now touches one site instead of 2–4.

**Rejected:**
- **B3 (outbox N+1):** real and now ~20 call-sites, but Medium effort on the realtime hot path — higher blast radius, and it deserves its own focused PR with a perf assertion rather than riding on a dedup change. Deferred (3rd run running).
- **D4 (`expedition.create` block):** tempting, but the four creates diverge on enough fields (`kind`, optional `reinforcementOriginVillageId`, `reinforcementRecallActorUserId`) that a single builder risks obscuring intent; left out to keep the diff a crisp, obviously-equivalent extraction. Candidate for a follow-up.
- **D5 (defender-builder dedup):** Medium effort, touches combat-resolution input construction — better isolated so a reviewer can reason about garrison aggregation alone.
- **B4/B5/B6/D6:** Low severity; bundling log-level or config-table changes into a structural dedup would muddy the diff and the review.

**Plan:** add three private helpers to `CombatService`, behavior-preserving:
1. `loadOwnedVillage(tx, villageId, userId, notFoundMessage?)` — owned-village lookup (D1), used in attack/scout/reinforce.
2. `assertTargetInVision(userId, worldId, point, action)` — fog-of-war gate (D2), used in attack/scout; `action` feeds the existing error verb.
3. `scheduleResolution(expeditionId, startAfter)` — wraps the `combat:resolve` `boss.send` (D3), used in all four creators.

### Result

- `combat.service.ts`: 3 new private helpers (`loadOwnedVillage`, `assertTargetInVision`, `scheduleResolution`) replace the duplicated skeleton in `initiateAttack`/`initiateScout`/`initiateReinforce`/`initiateRecall`.
- Owned-village lookup: 3 inline `findFirst`+throw blocks → `loadOwnedVillage` (custom not-found message preserved for the reinforce path).
- Fog-of-war gate: the two verbatim `getConfig`→`getVisionDisks`→`isInVision`→`ForbiddenException` blocks → `assertTargetInVision`, with the action verb (`attack`/`scout`) parameterised so the error messages are unchanged.
- `combat:resolve` scheduling: 4 identical `boss.send` blocks → `scheduleResolution`. The single `combat:return` send in `recallEnRoute` is genuinely single-use and left inline.
- No public-method signature, REST contract, WS event, payload, or Prisma change. Behavior-preserving. File LOC ~flat (907 → 911); the value is DRY, not line count.

### Verification

```shell
yarn static-check                                   → ✅ tsc (backend+pixi) + eslint --quiet, 0 errors
yarn test:backend (unit)                            → ✅ 236 passed, 22 suites
yarn test:smoke:run (combat-attack, scouting,       → ✅ 14 passed, 5 suites
  reinforcements, recall-en-route, conquest-hook)
```

Baseline (commit `34b14a7`): same suites green pre-refactor → green post-refactor. Behavior preserved.

### Docs impact

Aucun changement nécessaire — refactor interne d'un service (extraction de helpers privés), pas de changement d'API REST, d'event WS, de modèle Prisma ni de règle gameplay. Findings B3/B4/B5/B6/D4/D5/D6 restent ouverts (hors scope, documentés ci-dessus).



**Model:** claude-opus-4-8
**Scan commit:** `a086359`

> Branch note: current runs use the `maint/refactor-backend/<topic>` branch family, but this historical session was pinned by the harness to `claude/quirky-euler-JqDcx` (with an explicit "never push to a different branch" rule). The harness directive took precedence.

---

### Prior findings status (Run 2026-05-30)

| ID | Status | Note |
|----|--------|------|
| C1 | **STILL OPEN → SELECTED** | `handleCombatResolution` still ~435 LOC (worker now 1142 LOC). This run's theme. |
| C2 | RESOLVED | `CombatReportService` extracted; `combat.service.ts` 1132 → 906 LOC. |
| C3 | **STILL OPEN → ADDRESSED** | Barbarian/PvP loot-deduction branches still duplicated (`combat.worker.ts:169-257`). Folded into this run's extraction. |
| C4 | **STILL OPEN** | `getUserIdByVillage` N+1 in outbox dispatch (now 17 call-sites, `event-outbox.service.ts:530`). Not selected — see rejected themes. |
| C5 | **STILL OPEN** | Capture-duration tables still defined in worker (`combat.worker.ts:34-48`). Low. |
| C6 | RESOLVED | `resources.service.ts` recursive call no longer present at cited line. |

---

### Module structure (mental model)

`src/` = bounded contexts under `modules/` + cross-cutting `workers/`, `infra/`, `common/`. Layering is clean: only `health.controller.ts` imports `PrismaService` (a liveness ping — legitimate); no other controller touches the DB. Zero `any`, zero `console.*`, zero swallowed `catch`. The combat module dominates (`combat.worker.ts` 1142, `combat.service.ts` 906, `conquest.service.ts` 565) and is also the highest-churn area. The `event/` module owns the Outbox→Socket.IO dispatch loop; `RetentionService`/`OnboardingService` are side-effect listeners hooked into dispatch.

---

### Findings

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| B1 | Service design | `combat.worker.ts:109-544` | **SELECTED** — `handleCombatResolution` is a ~435 LOC god method inside a single `$transaction`: dispatches REINFORCE/SCOUT early returns, builds context, applies loot + losses (twice, see B2), creates the defender event, writes the combat report, opens the capture window, computes return loot/units, updates expedition, emits `battle.resolved`, schedules return. ~12 distinct responsibilities, no seams for testing sub-steps. | High | L |
| B2 | Duplication | `combat.worker.ts:169-257` | **ADDRESSED with B1** — BARBARIAN_VILLAGE and PLAYER_VILLAGE branches both: re-fetch `defenderVillage` with the same include, decrement looted `wood/stone/iron`, emit `resourcesChanged`, call `applyDefenderLosses`. Only real divergence: barbarian resets `lastUpdateTs` and looks up `occupationDefense`. ~50 near-identical LOC. | Medium | S |
| B3 | Performance | `event-outbox.service.ts:530` | `getUserIdByVillage` issues one `village.findUnique` per event in the dispatch loop — up to 100 sequential single-row queries per 1s batch (17 call-sites resolve villageId→userId individually). Batchable via a single `findMany(where id in […])` resolved once per batch. | Medium | M |
| B4 | Observability/perf | `event-outbox.service.ts:65-92` | Hot dispatch loop logs 2–3 verbose `logger.log` lines **per event** (`📦`/`📨`/`✅` with full payload echo) at default level on every ~1s poll. Noise + serialization cost in steady state; should be `debug`. | Low | S |
| B5 | Config | `combat.worker.ts:34-48` | `BARBARIAN_CAPTURE_DURATIONS_MS` / `PVP_CAPTURE_DURATIONS_MS` are gameplay-balance tables hardcoded in the worker rather than world config. (Carried from C5.) | Low | S |
| B6 | Type safety | `combat.worker.ts:159-166` | Inline anonymous types for `defenderVillage` / `occupationDefense` / `pendingConquest` repeated as ad-hoc `Prisma.VillageGetPayload<…>` literals; a named alias would cut repetition and let the extracted helpers share a signature. | Low | S |

---

### Looks bad but is actually fine

- **`as Payload` casts in `event-outbox.service.ts` switch** (lines 108-195): each `case` narrows on a validated `EventKind` and the payload was already `parseEventPayload`-validated against `EVENT_PAYLOAD_SCHEMAS` at line 104. The cast is a typing bridge over a Zod-validated value, not unsafe coercion. Exhaustive `never` default present.
- **Outbox error swallowing** (`event-outbox.service.ts:93-95`): intentional — a failed dispatch leaves `dispatchedAt: null`, so the next poll retries. Logged, not silenced.
- **pg-boss `.send` outside the `$transaction`** (`combat.worker.ts:534`, `combat.service.ts:558`): deliberate — avoids scheduling a job that a rolled-back tx would orphan. Documented inline.
- **`recallEnRoute` relies on the worker status guard instead of cancelling the pg-boss job** (`combat.service.ts:533-537`): documented fallback — the resolution worker no-ops on non-`EN_ROUTE` status. Correct given jobId isn't stored.
- **Empty `catch {}`-looking blocks**: none are actually empty — every catch logs and/or rethrows (verified all 18 sites).
- **`health.controller.ts` importing Prisma**: the one controller with DB access; it's a liveness probe, the canonical exception to the no-DB-in-controller rule.

---

### Selected theme: B1 + B2 — decompose `handleCombatResolution`

**Why this over alternatives:**
- **B1 is the single highest-severity structural finding** and sits in the largest + highest-churn file — every combat change pays the comprehension tax of a 435-LOC method.
- **B2 lives inside B1's body**, so folding the duplicated loot/loss branches into one helper is a natural by-product, not separate churn → one coherent theme.
- Fully verifiable with the **existing combat smoke suite** (15 tests exercising barbarian + PvP attack, conquest hook, reinforce, scout, recall, finalize) — all green at baseline. No gameplay rule change, no Prisma migration.

**Rejected:**
- **B3 (outbox N+1):** real, but Medium effort and touches the realtime hot path — higher blast radius, and at current scale (≤100 events/batch on a single node) it's not yet a felt bottleneck. Better as its own focused PR with a perf assertion. Deferred.
- **B4/B5/B6:** Low severity; would be padding bundled with a structural refactor and muddy the diff/review. B4 in particular changes log output and deserves isolated review.

**Plan:** extract cohesive private helpers from `handleCombatResolution` — `handleReinforcementArrival`/`handleScoutArrival` already exist; add `applyLootToDefender` (unifying the B2 branches), `emitVillageAttackedEvent`, `writeCombatReport`, `handleConquestOutcome` (capture window vs. noble-killed), `computeReturn` (return units/loot/at), `finalizeExpedition` (persist + `battle.resolved` + schedule return). The top-level method becomes a readable orchestration of named steps inside the same transaction — **behavior-preserving**, no signature changes to public methods or events.

### Result

- `handleCombatResolution` transaction body: **~435 LOC → ~166 LOC** orchestration of 6 named steps (`combat.worker.ts:123-289`).
- B2 duplication eliminated: the two ~50-LOC barbarian/PvP loot branches collapse into one `applyLootToDefender` (the only divergence — barbarian `lastUpdateTs` reset + occupation lookup — is now an explicit conditional).
- New named types `DefenderVillage` / `OccupationDefense` + `EMPTY_LOOT` constant remove repeated inline `Prisma.VillageGetPayload<…>` literals and `{ wood: 0, stone: 0, iron: 0 }` duplication (partially addresses B6).
- File total grew 1142 → 1313 LOC: the extraction trades inline tangle for explicit helper signatures + JSDoc. Net readability/testability win; no public surface change.

### Verification

```shell
yarn static-check                                   → ✅ tsc (backend+pixi) + eslint --quiet, 0 errors
yarn test (backend unit)                            → ✅ 232 passed, 21 suites
yarn test:smoke:run (combat-attack, conquest-hook,  → ✅ 20 passed, 8 suites
  reinforcements, scouting, recall-en-route,
  conquest-finalize, combat-reports-inbox, barbarians)
```

Baseline (pre-refactor, commit `a086359`): 232 unit + 15 combat smokes green → same green post-refactor (smoke set widened to 20 for coverage). Behavior preserved.

### Docs impact

Aucun changement nécessaire — refactor interne d'un worker, pas de changement d'API REST, d'event WS, de modèle Prisma ni de règle gameplay. Les durées de capture (B5) restent hardcodées (hors scope).

---

## Run 2026-05-30 — branch `claude/bftc-refactor-backend-combat-report-split`

**Model:** claude-sonnet-4-6

---

### Module structure (mental model)

`battleforthecrown-backend/src/` organized in bounded contexts under `modules/`. Combat is the largest: `CombatService` (initiation + queries + reports), `CombatWorker` (resolution), `ConquestService`, `ReturnWorker`. The `event/` module owns the Outbox dispatch loop. `RetentionService` and `OnboardingService` are side-effect listeners hooked into Outbox dispatch.

---

### Findings

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| C1 | Service design | `combat.worker.ts:109` | God method: `handleCombatResolution` 420+ LOC, dispatches 3 expedition kinds (ATTACK/REINFORCE/SCOUT) with early returns at lines 132 and 136 | High | L |
| C2 | Service design | `combat.service.ts` | **SELECTED** — 14 public methods across 4 unrelated domains in 1132 LOC | High | M |
| C3 | Duplication | `combat.worker.ts:169-257` | BARBARIAN_VILLAGE and PLAYER_VILLAGE branches duplicate loot deduction + `resourcesChanged` + `applyDefenderLosses`; single difference is barbarian resets `lastUpdateTs` | Medium | S |
| C4 | Performance | `event-outbox.service.ts:530-536` | `getUserIdByVillage` fires one `findUnique` per event in dispatch loop — up to 100 sequential DB queries per batch | Medium | S |
| C5 | Config | `combat.worker.ts:34-48` | Capture duration tables defined in worker — gameplay rules that belong in world config | Low | S |
| C6 | Readability | `resources.service.ts:50` | Recursive `this.getResources` tail call after production catchup — surprising pattern | Low | S |

---

### Looks bad but is actually fine

- **pg-boss outside transaction** (`combat.worker.ts:534-536`): intentional — avoids scheduling jobs when tx rolls back.
- **Outbox error swallowing** (`event-outbox.service.ts:93-95`): by design — poller retries on next cycle.
- **Retention/onboarding catches**: all check for Prisma P2002 and rethrow otherwise — correct idempotency.
- **Zero `any` types** across all production code.

---

### Selected theme: C2 — extract report management → `CombatReportService`

**Evidence:** `combat.service.ts` lines 909-1131 (report CRUD, 222 LOC) + 3 private helpers exclusively serving report methods. Entirely orthogonal to expedition initiation.

**Why over alternatives:**
- C1 (god method): requires gameplay understanding to split safely, higher risk.
- C3 (loot dedup): minimal LOC gain.
- C4 (N+1 outbox): low urgency at current game scale.

**Result:** `CombatService` 1132 → 683 LOC (−449). New `CombatReportService` (183 LOC) owns all combat + scout report read/write/delete. Controller delegates to the appropriate service.

---

### Files changed

- `src/modules/combat/combat-report.service.ts` — NEW
- `src/modules/combat/combat.service.ts` — removed 12 methods
- `src/modules/combat/combat.controller.ts` — injected `CombatReportService`
- `src/modules/combat/combat.module.ts` — registered `CombatReportService`

---

### Verification

```
yarn static-check              → ✅ 0 errors
jest --testPathPatterns=combat → ✅ 71 passed, 6 suites
```

---

### Docs impact

Aucun impact — pas de changement d'API, pas de nouveau contrat, pas de règle gameplay modifiée.
