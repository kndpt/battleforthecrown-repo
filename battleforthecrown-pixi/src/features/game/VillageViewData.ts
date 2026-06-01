import type { BuildingDto } from '@/api';
import { getBuildingLockState } from '@/features/village/buildingLockState';
import { BUILDING_TYPES } from '@battleforthecrown/shared/village/buildings';

export type VillageBuildingCategoryKey = 'centre' | 'military' | 'resources' | 'governance';

export interface VillageBuildingCategoryDef {
  countBg: string;
  countBorder: string;
  countText: string;
  dividerColor: string;
  gemBorder: string;
  gemDark: string;
  gemLight: string;
  key: VillageBuildingCategoryKey;
  label: string;
}

export const villageBuildingCategories: VillageBuildingCategoryDef[] = [
  {
    key: 'centre',
    label: 'Centre',
    gemLight: '#f6d57b',
    gemDark: '#c9900c',
    gemBorder: '#7a5200',
    countBorder: 'rgba(166,124,82,.35)',
    countBg: 'rgba(93,74,50,.15)',
    countText: '#cdb88a',
    dividerColor: 'rgba(93,74,50,.5)',
  },
  {
    key: 'military',
    label: 'Militaire',
    gemLight: '#5b9bd5',
    gemDark: '#2e75b6',
    gemBorder: '#1f5288',
    countBorder: 'rgba(91,155,213,.38)',
    countBg: 'rgba(46,117,182,.12)',
    countText: '#5b9bd5',
    dividerColor: 'rgba(46,117,182,.4)',
  },
  {
    key: 'resources',
    label: 'Ressources',
    gemLight: '#b08040',
    gemDark: '#7a5a32',
    gemBorder: '#5a3e20',
    countBorder: 'rgba(176,128,64,.35)',
    countBg: 'rgba(122,90,50,.12)',
    countText: '#b08040',
    dividerColor: 'rgba(122,90,50,.4)',
  },
  {
    key: 'governance',
    label: 'Gouvernance',
    gemLight: '#9b8bc8',
    gemDark: '#6a5a98',
    gemBorder: '#4a3a78',
    countBorder: 'rgba(155,139,200,.35)',
    countBg: 'rgba(106,90,152,.1)',
    countText: '#9b8bc8',
    dividerColor: 'rgba(106,90,152,.4)',
  },
];

const buildingTypeToCategory: Partial<Record<string, VillageBuildingCategoryKey>> = {
  [BUILDING_TYPES.CASTLE]: 'centre',
  [BUILDING_TYPES.THRONE_HALL]: 'centre',
  [BUILDING_TYPES.BARRACKS]: 'military',
  [BUILDING_TYPES.WATCHTOWER]: 'military',
  [BUILDING_TYPES.WALL]: 'military',
  [BUILDING_TYPES.WOOD]: 'resources',
  [BUILDING_TYPES.STONE]: 'resources',
  [BUILDING_TYPES.IRON]: 'resources',
  [BUILDING_TYPES.WAREHOUSE]: 'resources',
  [BUILDING_TYPES.QUARTER]: 'resources',
  [BUILDING_TYPES.COUNCIL_HALL]: 'governance',
  [BUILDING_TYPES.HIDEOUT]: 'governance',
};

export function categorizeVillageBuildings(buildings: BuildingDto[], castleLevel: number) {
  const lockedBuildings: BuildingDto[] = [];
  const byCategory: Record<VillageBuildingCategoryKey, BuildingDto[]> = {
    centre: [],
    military: [],
    resources: [],
    governance: [],
  };

  for (const building of buildings) {
    const lockState = getBuildingLockState(building, castleLevel);
    if (lockState.state === 'unbuilt-locked') {
      lockedBuildings.push(building);
      continue;
    }
    const category = buildingTypeToCategory[building.type] ?? 'governance';
    byCategory[category].push(building);
  }

  return { byCategory, lockedBuildings };
}
