---
title: "Shared package — pure types and formulas"
scope: "file"
path: ["packages/shared/**/*.ts"]
severity_min: "high"
languages: ["jsts"]
buckets: ["style-conventions", "error-handling"]
enabled: true
---

@kody-sync

## Instructions

**Shared package rules**

- NO imports from `battleforthecrown-backend/` or `battleforthecrown-pixi/`.
  Shared is read-only from consumers; it must not depend on either workspace.
- NO side effects: no `console.log`, no `fetch`, no DOM access, no Node.js APIs.
- All exported functions must be pure (same input → same output, no mutation of arguments).
- All formulas encoding a game rule (resource production, combat power, travel time, population caps)
  require a matching test in a co-located `*.spec.ts` or `__tests__/` directory.
- Explicit return types mandatory on all exported functions.

## Examples

### Bad example

```typescript
import type { Village } from '../../battleforthecrown-backend/src/village/village.entity';

export function combatPower(village: Village) {
  console.log('computing', village.id);
  return village.troops * 1.2;
}
```

### Good example

```typescript
export function combatPower(troops: number, bonus: number): number {
  return troops * bonus;
}
```
