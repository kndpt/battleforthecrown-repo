---
title: "Test quality policy"
scope: "file"
path: ["**/*.spec.ts", "**/*.test.ts", "**/*.spec.tsx", "**/*.test.tsx"]
severity_min: "medium"
languages: ["jsts"]
buckets: ["style-conventions"]
enabled: true
---

@kody-sync

## Instructions

**Test quality (bftc-tests-policy)**

- Inline literal fixtures and seed values (resource amounts, ids, coords, names) are EXPECTED.
  Do NOT flag magic numbers / hardcoded strings or request named constants in test files.
- Tests must assert behavior (output given input), NOT implementation (mock call chain order).
- BLOCK `it.skip` or `xit` without a `// TODO: reason — <ticket or issue>` comment.
- No `as any` to silence TypeScript — type fixtures properly.
- No mocking of Prisma, pg-boss, or `setInterval` in unit tests.
  If infrastructure is required, it's an integration test and must be labeled as such.

## Examples

### Bad example

```typescript
it.skip('computes combat power');
expect(mockPrisma.village.findUnique).toHaveBeenCalledBefore(mockPrisma.battle.create);
```

### Good example

```typescript
it('computes combat power from troop count and bonus', () => {
  expect(combatPower(100, 1.2)).toBe(120);
});
```
