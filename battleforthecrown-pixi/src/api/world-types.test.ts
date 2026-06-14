import { describe, expect, it } from 'vitest';
import { normalizeTier } from '@battleforthecrown/shared/world';

describe('normalizeTier', () => {
  it.each(['T1', 'T2', 'T3', 'T4', 'T5'] as const)(
    'returns exact tier literal %s',
    (tier) => {
      expect(normalizeTier(tier)).toBe(tier);
    },
  );

  it.each([
    ['tier-1', 'T1'],
    ['Level 2', 'T2'],
    ['barbarian_t3', 'T3'],
    ['T4-extra', 'T4'],
    ['phase-5', 'T5'],
  ] as const)('maps fuzzy string %s to %s', (input, expected) => {
    expect(normalizeTier(input)).toBe(expected);
  });

  it.each([null, undefined, 42, 'T6', '', 'tier-6'])(
    'returns null for unsupported value %j',
    (value) => {
      expect(normalizeTier(value)).toBeNull();
    },
  );
});
