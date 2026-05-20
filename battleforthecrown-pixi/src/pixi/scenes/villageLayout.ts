export interface BuildingPlacement {
  type: string;
  x: number;
  y: number;
  zIndex: number;
}

/**
 * Fixed layout of the player's village in Pixi-space pixels.
 * Coordinates assume a 1500×2000 portrait village. Picked once for Phase 5
 * so the Pixi scene is reproducible and tests can assert positions.
 */
export const VILLAGE_BOUNDS = { width: 1500, height: 2000 };

export const VILLAGE_LAYOUT: BuildingPlacement[] = [
  { type: 'CASTLE', x: 750, y: 800, zIndex: 30 },
  { type: 'BARRACKS', x: 350, y: 1000, zIndex: 20 },
  { type: 'WAREHOUSE', x: 1150, y: 1000, zIndex: 20 },
  { type: 'QUARTER', x: 750, y: 1300, zIndex: 18 },
  { type: 'WOOD', x: 350, y: 1500, zIndex: 15 },
  { type: 'STONE', x: 1150, y: 1500, zIndex: 15 },
  { type: 'IRON', x: 750, y: 1700, zIndex: 15 },
  { type: 'WATCHTOWER', x: 200, y: 400, zIndex: 25 },
  { type: 'HIDEOUT', x: 1300, y: 400, zIndex: 12 },
  { type: 'WALL', x: 750, y: 200, zIndex: 8 },
];

export function placementFor(type: string): BuildingPlacement {
  const found = VILLAGE_LAYOUT.find((p) => p.type === type);
  if (found) return found;
  // Fallback: spread unknown types in a row at the bottom.
  return { type, x: 750, y: 1900, zIndex: 5 };
}
