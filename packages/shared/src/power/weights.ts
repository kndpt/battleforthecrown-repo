import type { PowerConfig } from '../world';

export const BUILDING_POWER_WEIGHTS = Object.freeze({
  CASTLE: 40,
  WOOD: 15,
  STONE: 15,
  IRON: 15,
  WAREHOUSE: 20,
  FARM: 25,
  BARRACKS: 35,
  WALL: 38,
  WATCHTOWER: 30,
  HIDEOUT: 28,
  COUNCIL_HALL: 25,
  THRONE_HALL: 35,
});

export const UNIT_POWER_WEIGHTS = Object.freeze({
  MILITIA: 5,
  SQUIRE: 8,
  ARCHER: 9,
  CAVALRY: 15,
  TEMPLAR: 20,
  CATAPULT: 30,
  SPY: 4,
  NOBLE: 50,
});

const DEFAULT_BUILDING_POWER_WEIGHT = 5;
const DEFAULT_UNIT_POWER_WEIGHT = 1;

export const getBuildingPowerWeight = (type: string): number =>
  BUILDING_POWER_WEIGHTS[type as keyof typeof BUILDING_POWER_WEIGHTS] ??
  DEFAULT_BUILDING_POWER_WEIGHT;

export const getUnitPowerWeight = (type: string): number =>
  UNIT_POWER_WEIGHTS[type as keyof typeof UNIT_POWER_WEIGHTS] ??
  DEFAULT_UNIT_POWER_WEIGHT;

export const POWER_PROFILE: PowerConfig = {
  buildingWeights: BUILDING_POWER_WEIGHTS,
  unitSoftCapThreshold: 100,
  unitSoftCapDecay: 0.98,
  defaultWeights: {
    kingdom: 1,
    army: 1,
  },
};
