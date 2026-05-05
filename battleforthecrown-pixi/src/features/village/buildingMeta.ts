export interface BuildingMeta {
  label: string;
  emoji: string;
  /** PNG asset under /public, or null when no sprite is available yet. */
  iconPath: string | null;
  description: string;
  /** Order shown in the grid. */
  sortKey: number;
}

export const BUILDING_META: Record<string, BuildingMeta> = {
  CASTLE: {
    label: 'Château',
    emoji: '🏰',
    iconPath: '/assets/castle.png',
    description: 'Le cœur du village',
    sortKey: 0,
  },
  WOOD: {
    label: 'Camp de bûcherons',
    emoji: '🪓',
    iconPath: '/assets/resources/wood.png',
    description: 'Produit du bois',
    sortKey: 1,
  },
  STONE: {
    label: 'Carrière',
    emoji: '⛏️',
    iconPath: '/assets/stone.png',
    description: 'Produit de la pierre',
    sortKey: 2,
  },
  IRON: {
    label: 'Mine de fer',
    emoji: '⚒️',
    iconPath: '/assets/iron.png',
    description: 'Produit du fer',
    sortKey: 3,
  },
  WAREHOUSE: {
    label: 'Entrepôt',
    emoji: '📦',
    iconPath: '/assets/warehouse.png',
    description: 'Augmente le plafond de stock',
    sortKey: 4,
  },
  FARM: {
    label: 'Moulin',
    emoji: '🌾',
    iconPath: '/assets/farm.png',
    description: 'Augmente la population disponible',
    sortKey: 5,
  },
  BARRACKS: {
    label: 'Caserne',
    emoji: '🏛️',
    iconPath: '/assets/barracks.png',
    description: 'Permet de recruter des unités',
    sortKey: 6,
  },
  WATCHTOWER: {
    label: 'Tour de guet',
    emoji: '🗼',
    iconPath: '/assets/watchtower.png',
    description: 'Améliore la défense',
    sortKey: 7,
  },
  WALL: {
    label: 'Rempart',
    emoji: '🧱',
    iconPath: null,
    description: 'Protège le village',
    sortKey: 8,
  },
  HIDEOUT: {
    label: 'Cachette',
    emoji: '🕳️',
    iconPath: null,
    description: 'Cache une partie du loot',
    sortKey: 9,
  },
};

export function metaFor(type: string): BuildingMeta {
  return (
    BUILDING_META[type] ?? {
      label: type,
      emoji: '🏗️',
      iconPath: null,
      description: '',
      sortKey: 99,
    }
  );
}
