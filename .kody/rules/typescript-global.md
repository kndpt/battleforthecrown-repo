---
title: "TypeScript strict and documentation"
scope: "file"
path: ["**/*.ts"]
severity_min: "high"
languages: ["jsts"]
buckets: ["style-conventions", "error-handling", "documentation"]
enabled: true
---

@kody-sync

## Instructions

**TypeScript strict (conventions.md)**

- BLOCK `as any` and `: any` parameter types. Require proper typing (generics, narrowing, type guards).
- BLOCK untyped return values on public methods/functions.
- BLOCK `eslint-disable` comments without an inline justification comment explaining why and when it can be removed.
- BLOCK `npm` references; this project uses `yarn` exclusively.

**Tests**

- Any new function computing a formula, applying a rule, or transforming data requires a test.
- FLAG new non-test source files in `services/`, `stores/`, `lib/`, `view-model*/` with zero
  co-located tests (a `*.test.*` / `*.spec.*` file does not itself need its own test).

**Documentation (docs.md)**

- If the change affects gameplay mechanics, API contracts, data model, or architecture decisions,
  a corresponding update in `docs/` is mandatory. Flag if missing.
- When existing `docs/` gameplay documentation defines the behavior touched by the PR,
  verify that the implementation still matches that documented rule. Flag mismatches as
  correctness issues, not documentation nitpicks.

## Examples

### Bad example

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePayload(data: any) {
  return data as any;
}
```

### Good example

```typescript
function parsePayload(data: unknown): PlayerPayload {
  const parsed = playerPayloadSchema.parse(data);
  return parsed;
}
```
