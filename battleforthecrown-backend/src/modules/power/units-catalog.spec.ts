import {
  UNIT_TYPES,
  UNIT_COSTS,
  UNIT_STATS,
  type UnitType,
} from '@battleforthecrown/shared/army';
import {
  UNIT_POWER_WEIGHTS,
  getUnitPowerWeight,
} from '@battleforthecrown/shared/power';

describe('units catalog — pure logic (run 003 regression)', () => {
  it('expose les 10 unités spec (MILICE→SEIGNEUR)', () => {
    expect(Object.keys(UNIT_TYPES).sort()).toEqual(
      [
        'ARCHER',
        'CATAPULT',
        'CAVALRY',
        'MILITIA',
        'NOBLE',
        'RAM',
        'SPY',
        'SQUIRE',
        'TEMPLAR',
        'WARRIOR',
      ].sort(),
    );
  });

  it('UNIT_POWER_WEIGHTS aligne la spec pour les 10 unités (aucun retombement sur le fallback 1)', () => {
    const expected: Record<UnitType, number> = {
      MILITIA: 2,
      SQUIRE: 8,
      WARRIOR: 12,
      ARCHER: 6,
      TEMPLAR: 12,
      CAVALRY: 15,
      SPY: 10,
      RAM: 30,
      CATAPULT: 40,
      NOBLE: 100,
    };

    for (const [type, weight] of Object.entries(expected) as [
      UnitType,
      number,
    ][]) {
      expect(getUnitPowerWeight(type)).toBe(weight);
      expect(UNIT_POWER_WEIGHTS[type as keyof typeof UNIT_POWER_WEIGHTS]).toBe(
        weight,
      );
    }
  });

  it('UNIT_COSTS[WARRIOR] aligne la spec (wood 120, stone 80, iron 50, pop 2, time 180s, barracks 3, pas de throneHall)', () => {
    const cost = UNIT_COSTS[UNIT_TYPES.WARRIOR];
    expect(cost.wood).toBe(120);
    expect(cost.stone).toBe(80);
    expect(cost.iron).toBe(50);
    expect(cost.population).toBe(2);
    expect(cost.time).toBe(180);
    expect(cost.requiredBarracksLevel).toBe(3);
    expect(cost.requiredThroneHallLevel).toBeUndefined();
  });

  it('UNIT_COSTS[RAM] aligne la spec + désactivé MVP (requiredBarracksLevel 99)', () => {
    const cost = UNIT_COSTS[UNIT_TYPES.RAM];
    expect(cost.wood).toBe(300);
    expect(cost.stone).toBe(400);
    expect(cost.iron).toBe(200);
    expect(cost.population).toBe(4);
    expect(cost.time).toBe(360);
    expect(cost.requiredBarracksLevel).toBe(99);
  });

  it('UNIT_COSTS[NOBLE] aligne spec 10 (5000×3 + 5000 crowns + 15 pop + 8h + Throne Hall L1)', () => {
    const cost = UNIT_COSTS[UNIT_TYPES.NOBLE];
    expect(cost.wood).toBe(5000);
    expect(cost.stone).toBe(5000);
    expect(cost.iron).toBe(5000);
    expect(cost.crowns).toBe(5000);
    expect(cost.population).toBe(15);
    expect(cost.time).toBe(28800);
    expect(cost.requiredThroneHallLevel).toBe(1);
    expect(cost.requiredBarracksLevel).toBe(99); // sentinel — gating réel via Throne Hall
  });

  it('UNIT_STATS[WARRIOR] et UNIT_STATS[RAM] alignent la spec avec leurs passifs respectifs', () => {
    expect(UNIT_STATS[UNIT_TYPES.WARRIOR]).toMatchObject({
      attack: 20,
      defenseInfantry: 5,
      defenseCavalry: 5,
      defenseArcher: 5,
      speed: 20,
      carryCapacity: 35,
      passive: { kind: 'attackOnRaid', bonus: 0.1 },
    });

    expect(UNIT_STATS[UNIT_TYPES.RAM]).toMatchObject({
      attack: 50,
      defenseInfantry: 10,
      defenseCavalry: 10,
      defenseArcher: 10,
      speed: 5,
      carryCapacity: 0,
      passive: { kind: 'attackVsWall', bonus: 0.5 },
    });
  });
});
