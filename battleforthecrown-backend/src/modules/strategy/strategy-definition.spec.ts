import { getStrategyDefinition } from '@battleforthecrown/shared/village';

describe('getStrategyDefinition', () => {
  it('returns the FORTRESS definition with display metadata and bonuses', () => {
    const definition = getStrategyDefinition('FORTRESS');

    expect(definition).toMatchObject({
      strategy: 'FORTRESS',
      displayName: 'Forteresse',
      bonuses: {
        armySpeedBonus: 0.8,
        defenseBonus: 1.25,
        storageBonus: 1.1,
      },
    });
  });

  it('returns BALANCED with empty bonus overrides', () => {
    const definition = getStrategyDefinition('BALANCED');

    expect(definition.strategy).toBe('BALANCED');
    expect(definition.bonuses).toEqual({});
  });

  it('falls back to BALANCED when the runtime strategy key is unknown', () => {
    const definition = getStrategyDefinition('UNKNOWN' as 'BALANCED');

    expect(definition.strategy).toBe('BALANCED');
    expect(definition.displayName).toBe('Équilibré');
  });
});
