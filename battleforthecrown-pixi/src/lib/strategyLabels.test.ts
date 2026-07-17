import { describe, expect, it } from 'vitest';
import { STRATEGY_LABELS } from './strategyLabels';
import { villageStyleOptions } from '@/features/design-system/components/villageStyleData';

describe('STRATEGY_LABELS', () => {
  it('maps every villageStyleOption id to its name', () => {
    for (const option of villageStyleOptions) {
      expect(STRATEGY_LABELS[option.id]).toBe(option.name);
    }
  });

  it('contains exactly the same number of entries as villageStyleOptions', () => {
    expect(Object.keys(STRATEGY_LABELS)).toHaveLength(villageStyleOptions.length);
  });

  it('includes keys used by scout, profile and intel views', () => {
    expect(STRATEGY_LABELS).toHaveProperty('FORTRESS', 'Forteresse');
    expect(STRATEGY_LABELS).toHaveProperty('BALANCED', 'Équilibré');
  });
});
