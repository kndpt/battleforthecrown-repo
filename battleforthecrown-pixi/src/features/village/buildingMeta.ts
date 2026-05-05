export type BuildingCardVariant = 'parchment' | 'wood' | 'stone';

export interface BuildingMeta {
  /** French label as used in the legacy. */
  label: string;
  /** Full description shown in the BuildingDetailModal. */
  description: string;
  /** PNG asset under /public, or null when no sprite is available yet. */
  iconPath: string | null;
  /** Emoji fallback when iconPath is null. */
  emoji: string;
  /** Card variant matching the legacy BUILDING_CARD_VARIANTS table. */
  cardVariant: BuildingCardVariant;
  /** Order shown in the grid (Castle first). */
  sortKey: number;
}

export const BUILDING_META: Record<string, BuildingMeta> = {
  CASTLE: {
    label: 'Château',
    description:
      'Le cœur de votre royaume. Son niveau augmente la vitesse de construction de tous les bâtiments.',
    iconPath: '/assets/castle.png',
    emoji: '🏰',
    cardVariant: 'parchment',
    sortKey: 0,
  },
  WOOD: {
    label: 'Camp de bûcherons',
    description: 'Produit du bois en continu. Essentiel pour toute construction.',
    iconPath: '/assets/wood.png',
    emoji: '🪓',
    cardVariant: 'wood',
    sortKey: 1,
  },
  STONE: {
    label: 'Carrière de pierre',
    description:
      'Extrait de la pierre pour vos fortifications et bâtiments avancés.',
    iconPath: '/assets/stone.png',
    emoji: '⛏️',
    cardVariant: 'stone',
    sortKey: 2,
  },
  IRON: {
    label: 'Mine de fer',
    description:
      'Mine du fer précieux pour forger armes et équipements militaires.',
    iconPath: '/assets/iron.png',
    emoji: '⚒️',
    cardVariant: 'stone',
    sortKey: 3,
  },
  WAREHOUSE: {
    label: 'Entrepôt',
    description: 'Augmente la capacité de stockage de toutes vos ressources.',
    iconPath: '/assets/warehouse.png',
    emoji: '📦',
    cardVariant: 'wood',
    sortKey: 4,
  },
  FARM: {
    label: 'Moulin',
    description:
      'Augmente la population de villageois disponibles pour vos constructions et armées.',
    iconPath: '/assets/farm.png',
    emoji: '🌾',
    cardVariant: 'parchment',
    sortKey: 5,
  },
  BARRACKS: {
    label: 'Caserne',
    description: "Permet d'entraîner des unités militaires.",
    iconPath: '/assets/barracks.png',
    emoji: '🏛️',
    cardVariant: 'stone',
    sortKey: 6,
  },
  WATCHTOWER: {
    label: 'Tour de guet',
    description:
      'Débloque la carte du monde et étend votre vision sur les territoires voisins.',
    iconPath: '/assets/watchtower.png',
    emoji: '🗼',
    cardVariant: 'stone',
    sortKey: 7,
  },
  WALL: {
    label: 'Rempart',
    description: 'Renforce les défenses de votre village contre les attaques.',
    iconPath: null,
    emoji: '🧱',
    cardVariant: 'stone',
    sortKey: 8,
  },
  HIDEOUT: {
    label: 'Cachette',
    description:
      'Protège une partie de vos ressources contre les pillages ennemis.',
    iconPath: null,
    emoji: '🕳️',
    cardVariant: 'stone',
    sortKey: 9,
  },
};

export function metaFor(type: string): BuildingMeta {
  return (
    BUILDING_META[type] ?? {
      label: type,
      description: '',
      iconPath: null,
      emoji: '🏗️',
      cardVariant: 'stone',
      sortKey: 99,
    }
  );
}
