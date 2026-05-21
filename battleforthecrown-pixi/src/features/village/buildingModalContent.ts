import {
  BARRACKS_UNIT_TYPES,
  UNIT_COSTS,
  type BarracksUnitType,
} from '@battleforthecrown/shared/army';
import {
  BUILDING_DEFINITIONS,
  BARRACKS_TRAINING_SPEED_MULTIPLIER,
  BUILDING_UNLOCK_REQUIREMENTS,
  CASTLE_CONSTRUCTION_SPEED_BONUS,
  WATCHTOWER_VISION_LEVELS,
  type BuildingType,
} from '@battleforthecrown/shared/village/buildings';
import { getWarehouseStorageLimit } from '@battleforthecrown/shared/resources';

export interface BuildingLevelComparison {
  current: number | null;
  next: number | null;
}

export interface BarracksUnlockGroup {
  level: number;
  units: BarracksUnitType[];
}

export interface CastleUnlockGroup {
  level: number;
  buildings: BuildingType[];
}

export function getCastleConstructionSpeedComparison(level: number): BuildingLevelComparison {
  return {
    current: CASTLE_CONSTRUCTION_SPEED_BONUS[level] ?? null,
    next: CASTLE_CONSTRUCTION_SPEED_BONUS[level + 1] ?? null,
  };
}

export function getCastleUnlockGroups(currentLevel: number): CastleUnlockGroup[] {
  return Object.entries(BUILDING_UNLOCK_REQUIREMENTS)
    .map(([building, level]) => ({ buildings: [building as BuildingType], level }))
    .filter((group) => {
      const building = group.buildings[0];
      return group.level > currentLevel && Boolean(building && BUILDING_DEFINITIONS[building]?.enabled);
    })
    .sort((a, b) => a.level - b.level)
    .reduce<CastleUnlockGroup[]>((groups, group) => {
      const existing = groups.find((candidate) => candidate.level === group.level);
      if (existing) {
        existing.buildings.push(...group.buildings);
        return groups;
      }
      groups.push(group);
      return groups;
    }, []);
}

export function getWarehouseStorageComparison(level: number): BuildingLevelComparison {
  const nextLevel = BUILDING_DEFINITIONS.WAREHOUSE.levels[level + 1];
  return {
    current: level > 0 ? getWarehouseStorageLimit(level).wood : null,
    next: nextLevel ? getWarehouseStorageLimit(level + 1).wood : null,
  };
}

export function getBarracksTrainingSpeedComparison(level: number): BuildingLevelComparison {
  return {
    current: BARRACKS_TRAINING_SPEED_MULTIPLIER[level] ?? null,
    next: BARRACKS_TRAINING_SPEED_MULTIPLIER[level + 1] ?? null,
  };
}

export function getBarracksUnlockGroups(): BarracksUnlockGroup[] {
  return BARRACKS_UNIT_TYPES
    .map((unit) => ({ level: UNIT_COSTS[unit].requiredBarracksLevel, unit }))
    .filter(({ level }) => level <= 10)
    .sort((a, b) => a.level - b.level)
    .reduce<BarracksUnlockGroup[]>((groups, item) => {
      const existing = groups.find((group) => group.level === item.level);
      if (existing) {
        existing.units.push(item.unit);
        return groups;
      }
      groups.push({ level: item.level, units: [item.unit] });
      return groups;
    }, []);
}

export function getWatchtowerVisionComparison(level: number): BuildingLevelComparison {
  return {
    current: WATCHTOWER_VISION_LEVELS[level]?.visibilityRadius ?? null,
    next: WATCHTOWER_VISION_LEVELS[level + 1]?.visibilityRadius ?? null,
  };
}

export function formatSpeedBonus(multiplier: number | null): string {
  if (multiplier === null) return 'Aucun';
  const percent = Math.round((multiplier - 1) * 100);
  return percent > 0 ? `+${percent} %` : 'Neutre';
}

export function formatConstructionSpeed(factor: number | null): string {
  if (factor === null) return 'Aucun';
  return `×${(1 / factor).toFixed(2)}`;
}
