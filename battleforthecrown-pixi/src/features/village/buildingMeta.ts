export interface BuildingMeta {
  label: string;
  emoji: string;
  description: string;
  /** Order shown in the grid. */
  sortKey: number;
}

export const BUILDING_META: Record<string, BuildingMeta> = {
  CASTLE: { label: 'Château', emoji: '🏰', description: 'Le cœur du village', sortKey: 0 },
  WOOD: { label: 'Camp de bûcherons', emoji: '🪓', description: 'Produit du bois', sortKey: 1 },
  STONE: { label: 'Carrière', emoji: '⛏️', description: 'Produit de la pierre', sortKey: 2 },
  IRON: { label: 'Mine de fer', emoji: '⚒️', description: 'Produit du fer', sortKey: 3 },
  WAREHOUSE: { label: 'Entrepôt', emoji: '📦', description: 'Augmente le plafond de stock', sortKey: 4 },
  FARM: { label: 'Moulin', emoji: '🌾', description: 'Augmente la population disponible', sortKey: 5 },
  BARRACKS: { label: 'Caserne', emoji: '🏛️', description: 'Permet de recruter des unités', sortKey: 6 },
  WATCHTOWER: { label: 'Tour de guet', emoji: '🗼', description: 'Améliore la défense', sortKey: 7 },
  WALL: { label: 'Rempart', emoji: '🧱', description: 'Protège le village', sortKey: 8 },
  HIDEOUT: { label: 'Cachette', emoji: '🕳️', description: 'Cache une partie du loot', sortKey: 9 },
};

export function metaFor(type: string): BuildingMeta {
  return BUILDING_META[type] ?? { label: type, emoji: '🏗️', description: '', sortKey: 99 };
}
