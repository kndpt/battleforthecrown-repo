import { UNIT_TYPES, UnitCost, UnitStats, UnitsConfig, UnitType } from './types';

const seconds = (value: number) => value;

export const UNIT_COSTS: Record<UnitType, UnitCost> = {
  [UNIT_TYPES.MILITIA]: {
    wood: 50,
    stone: 30,
    iron: 10,
    population: 1,
    time: seconds(30),
    requiredBarracksLevel: 1,
  },
  [UNIT_TYPES.SQUIRE]: {
    wood: 80,
    stone: 50,
    iron: 30,
    population: 1,
    time: seconds(60),
    requiredBarracksLevel: 2,
  },
  [UNIT_TYPES.ARCHER]: {
    wood: 60,
    stone: 40,
    iron: 30,
    population: 1,
    time: seconds(90),
    requiredBarracksLevel: 3,
  },
  [UNIT_TYPES.TEMPLAR]: {
    wood: 200,
    stone: 150,
    iron: 120,
    population: 2,
    time: seconds(180),
    requiredBarracksLevel: 4,
  },
  [UNIT_TYPES.CAVALRY]: {
    wood: 200,
    stone: 100,
    iron: 150,
    population: 3,
    time: seconds(240),
    requiredBarracksLevel: 5,
  },
  [UNIT_TYPES.SPY]: {
    wood: 50,
    stone: 50,
    iron: 20,
    population: 1,
    time: seconds(90),
    requiredBarracksLevel: 5,
  },
  [UNIT_TYPES.CATAPULT]: {
    wood: 400,
    stone: 600,
    iron: 300,
    population: 5,
    time: seconds(480),
    requiredBarracksLevel: 8,
  },
  [UNIT_TYPES.NOBLE]: {
    wood: 1000,
    stone: 800,
    iron: 500,
    population: 5,
    time: seconds(600),
    requiredBarracksLevel: 10,
  },
};

const defense = (value: number): Pick<UnitStats, 'defenseInfantry' | 'defenseCavalry' | 'defenseArcher'> => ({
  defenseInfantry: value,
  defenseCavalry: value,
  defenseArcher: value,
});

export const UNIT_STATS: Record<UnitType, UnitStats> = {
  [UNIT_TYPES.MILITIA]: {
    attack: 5,
    ...defense(5),
    speed: 10,
    carryCapacity: 25,
  },
  [UNIT_TYPES.SQUIRE]: {
    attack: 10,
    ...defense(10),
    speed: 15,
    carryCapacity: 50,
  },
  [UNIT_TYPES.ARCHER]: {
    attack: 12,
    ...defense(6),
    speed: 12,
    carryCapacity: 20,
  },
  [UNIT_TYPES.TEMPLAR]: {
    attack: 10,
    ...defense(23),
    speed: 10,
    carryCapacity: 10,
  },
  [UNIT_TYPES.CAVALRY]: {
    attack: 15,
    ...defense(8),
    speed: 8,
    carryCapacity: 100,
  },
  [UNIT_TYPES.SPY]: {
    attack: 8,
    ...defense(2),
    speed: 100,
    carryCapacity: 0,
  },
  [UNIT_TYPES.CATAPULT]: {
    attack: 80,
    ...defense(5),
    speed: 3,
    carryCapacity: 0,
  },
  [UNIT_TYPES.NOBLE]: {
    attack: 500,
    ...defense(500),
    speed: 5,
    carryCapacity: 0,
  },
};

export const UNIT_CATALOG: UnitsConfig = {
  costs: UNIT_COSTS,
  stats: UNIT_STATS,
};
