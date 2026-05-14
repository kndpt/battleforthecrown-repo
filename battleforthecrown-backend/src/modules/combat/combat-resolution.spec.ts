import {
  UNIT_STATS,
  UNIT_TYPES,
  type UnitMap,
} from '@battleforthecrown/shared/army';
import {
  calculateCombatOutcome,
  calculateNobleLossChance,
  getDefenseStatForAttackerUnit,
  getDefenseStatWeights,
  getWeightedDefensePower,
} from './combat-resolution';
import { CombatContext } from './interfaces/combat-context.interface';

function createCombatContext(
  attackerUnits: UnitMap,
  defenderUnits: UnitMap,
): CombatContext {
  return {
    worldId: 'world-1',
    expedition: {
      id: 'exp-1',
      attackerVillageId: 'v1',
      targetKind: 'BARBARIAN_VILLAGE',
      targetRefId: 'barb-1',
      targetX: 1,
      targetY: 0,
      units: attackerUnits,
      status: 'EN_ROUTE',
      departAt: new Date(),
      arrivalAt: new Date(),
      returnAt: null,
      reportId: null,
      worldId: 'world-1',
    } as any,
    attacker: {
      village: {
        id: 'v1',
        name: 'Origin',
        x: 0,
        y: 0,
        userId: 'u1',
        isBarbarian: false,
      },
      units: attackerUnits,
    },
    defender: {
      kind: 'BARBARIAN_VILLAGE',
      village: {
        id: 'barb-1',
        name: 'Target',
        x: 1,
        y: 0,
        userId: null,
        isBarbarian: true,
      },
      units: defenderUnits,
      participants: [{ villageId: 'barb-1', units: defenderUnits }],
    },
    config: {
      combat: { attackBonus: 1, defenseBonus: 1, lootFactor: 0.5 },
      units: { stats: {} },
      _distance: 1,
      _travelTime: 1000,
    } as any,
  };
}

function createConquestContext(): CombatContext {
  return createCombatContext({ MILITIA: 99, NOBLE: 1 }, { MILITIA: 101 });
}

describe('combat resolution', () => {
  describe('calculateNobleLossChance', () => {
    it.each([
      [0.49, 0],
      [0.5, 0.01],
      [0.55, 0.05],
      [0.6, 0.1],
      [0.65, 0.2],
      [0.7, 0.3],
      [0.75, 0.4],
      [0.8, 0.5],
      [0.85, 0.6],
      [0.9, 0.7],
      [0.95, 0.8],
      [1, 1],
    ])('returns %p loss ratio -> %p chance', (lossRatio, expected) => {
      expect(calculateNobleLossChance(lossRatio)).toBeCloseTo(expected);
    });

    it('linearly interpolates between configured thresholds', () => {
      expect(calculateNobleLossChance(0.525)).toBeCloseTo(0.03);
      expect(calculateNobleLossChance(0.625)).toBeCloseTo(0.15);
      expect(calculateNobleLossChance(0.975)).toBeCloseTo(0.9);
    });
  });

  it('kills the noble on a costly attacker victory when the roll is fatal', () => {
    const result = calculateCombatOutcome(createConquestContext(), () => 0);

    expect(result.lossesAttacker).toEqual({ MILITIA: 50, NOBLE: 1 });
    expect(result.survivingAttacker).toEqual({ MILITIA: 49 });
    expect(result.lossesDefender).toEqual({ MILITIA: 101 });
  });

  it('spares the noble on a costly attacker victory when the roll misses', () => {
    const result = calculateCombatOutcome(createConquestContext(), () => 0.01);

    expect(result.lossesAttacker).toEqual({ MILITIA: 50, NOBLE: 0 });
    expect(result.survivingAttacker).toEqual({ MILITIA: 49, NOBLE: 1 });
  });

  it('uses defenseCavalry when cavalry attacks archers', () => {
    const result = calculateCombatOutcome(
      createCombatContext({ CAVALRY: 10 }, { ARCHER: 10 }),
    );

    expect(result.lossesAttacker).toEqual({ CAVALRY: 10 });
    expect(result.lossesDefender).toEqual({ ARCHER: 7 });
    expect(result.survivingDefender).toEqual({ ARCHER: 3 });
  });

  it('uses defenseInfantry when infantry attacks archers', () => {
    const result = calculateCombatOutcome(
      createCombatContext({ WARRIOR: 10 }, { ARCHER: 10 }),
    );

    expect(result.lossesAttacker).toEqual({ WARRIOR: 3 });
    expect(result.lossesDefender).toEqual({ ARCHER: 10 });
    expect(result.survivingAttacker).toEqual({ WARRIOR: 7 });
  });

  it('routes archer attacks to defenseArcher', () => {
    expect(getDefenseStatForAttackerUnit(UNIT_TYPES.ARCHER)).toBe(
      'defenseArcher',
    );
    expect(
      getWeightedDefensePower(
        UNIT_STATS[UNIT_TYPES.TEMPLAR],
        getDefenseStatWeights({ ARCHER: 10 }),
      ),
    ).toBe(UNIT_STATS[UNIT_TYPES.TEMPLAR].defenseArcher);
  });
});
