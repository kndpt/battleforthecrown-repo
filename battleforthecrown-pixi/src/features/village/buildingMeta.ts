import { publicAsset } from '@/lib/publicAsset';

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
    iconPath: publicAsset('/assets/castle.png'),
    emoji: '🏰',
    cardVariant: 'parchment',
    sortKey: 0,
  },
  WOOD: {
    label: 'Camp de bûcherons',
    description: 'Produit du bois en continu. Essentiel pour toute construction.',
    iconPath: publicAsset('/assets/wood.png'),
    emoji: '🪓',
    cardVariant: 'wood',
    sortKey: 1,
  },
  STONE: {
    label: 'Carrière de pierre',
    description:
      'Extrait de la pierre pour vos fortifications et bâtiments avancés.',
    iconPath: publicAsset('/assets/stone.png'),
    emoji: '⛏️',
    cardVariant: 'stone',
    sortKey: 2,
  },
  IRON: {
    label: 'Mine de fer',
    description:
      'Mine du fer précieux pour forger armes et équipements militaires.',
    iconPath: publicAsset('/assets/iron.png'),
    emoji: '⚒️',
    cardVariant: 'stone',
    sortKey: 3,
  },
  WAREHOUSE: {
    label: 'Entrepôt',
    description: 'Augmente la capacité de stockage de toutes vos ressources.',
    iconPath: publicAsset('/assets/warehouse.png'),
    emoji: '📦',
    cardVariant: 'wood',
    sortKey: 4,
  },
  QUARTER: {
    label: 'Quartier',
    description:
      "Extension du tissu urbain du village. Augmente la population disponible pour vos constructions et armées.",
    iconPath: publicAsset('/assets/quarter.png'),
    emoji: '🏘️',
    cardVariant: 'parchment',
    sortKey: 5,
  },
  BARRACKS: {
    label: 'Caserne',
    description: "Permet d'entraîner des unités militaires.",
    iconPath: publicAsset('/assets/barracks.png'),
    emoji: '🏛️',
    cardVariant: 'stone',
    sortKey: 6,
  },
  WATCHTOWER: {
    label: 'Tour de guet',
    description:
      'Débloque la carte du monde et étend votre vision sur les territoires voisins.',
    iconPath: publicAsset('/assets/watchtower.png'),
    emoji: '🗼',
    cardVariant: 'stone',
    sortKey: 7,
  },
  COUNCIL_HALL: {
    label: 'Salle du Conseil',
    description:
      'Débloque les styles stratégiques du village et permet de choisir une voie spécialisée.',
    iconPath: null,
    emoji: '🧑‍⚖️',
    cardVariant: 'parchment',
    sortKey: 8,
  },
  THRONE_HALL: {
    label: 'Salle du Trône',
    description:
      'Permet de recruter un Seigneur pour lancer des conquêtes.',
    iconPath: null,
    emoji: '👑',
    cardVariant: 'parchment',
    sortKey: 9,
  },
  WALL: {
    label: 'Rempart',
    description: 'Renforce les défenses de votre village contre les attaques.',
    iconPath: null,
    emoji: '🧱',
    cardVariant: 'stone',
    sortKey: 10,
  },
  HIDEOUT: {
    label: 'Cachette',
    description:
      'Protège une partie de vos ressources contre les pillages ennemis.',
    iconPath: null,
    emoji: '🕳️',
    cardVariant: 'stone',
    sortKey: 11,
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
