/**
 * Configuration centralisée des ressources
 * Utilisée dans toute l'application pour garantir la cohérence
 * 
 * @author Kelvin Dupont
 * @version 1.0.0
 * @date 2025-01-06
 */

// ===================================
// TYPES
// ===================================

export type ResourceType = 'wood' | 'stone' | 'iron' | 'gold' | 'food' | 'population' | 'crowns';

export interface ResourceConfig {
  id: ResourceType;
  name: string;
  nameCapitalized: string;
  icon: string; // Emoji par défaut
  assetPath: string; // Chemin vers l'image PNG
  color: {
    text: string; // Couleur de texte (Tailwind)
    bg: string; // Couleur de fond (Tailwind)
    border: string; // Couleur de bordure (Tailwind)
    gradient: string; // Dégradé CSS
  };
  unit: {
    short: string; // ex: "B", "P", "F"
    long: string; // ex: "Bois", "Pierre", "Fer"
  };
}

// ===================================
// CONFIGURATION PRINCIPALE
// ===================================

export const RESOURCE_CONFIG: Record<ResourceType, ResourceConfig> = {
  wood: {
    id: 'wood',
    name: 'bois',
    nameCapitalized: 'Bois',
    icon: '🪵',
    assetPath: '/assets/resources/wood.png',
    color: {
      text: 'text-white',
      bg: 'bg-gray-100/20',
      border: 'border-gray-600',
      gradient: 'from-gray-200 to-gray-400',
    },
    unit: {
      short: 'B',
      long: 'Bois',
    },
  },
  
  stone: {
    id: 'stone',
    name: 'pierre',
    nameCapitalized: 'Pierre',
    icon: '🪨',
    assetPath: '/assets/resources/stone.png',
    color: {
      text: 'text-white',
      bg: 'bg-gray-100/20',
      border: 'border-gray-600',
      gradient: 'from-gray-200 to-gray-400',
    },
    unit: {
      short: 'P',
      long: 'Pierre',
    },
  },
  
  iron: {
    id: 'iron',
    name: 'fer',
    nameCapitalized: 'Fer',
    icon: '⛏️',
    assetPath: '/assets/resources/iron.png',
    color: {
      text: 'text-white',
      bg: 'bg-gray-100/20',
      border: 'border-gray-600',
      gradient: 'from-gray-200 to-gray-400',
    },
    unit: {
      short: 'F',
      long: 'Fer',
    },
  },
  
  gold: {
    id: 'gold',
    name: 'or',
    nameCapitalized: 'Or',
    icon: '💰',
    assetPath: '/assets/resources/gold.png',
    color: {
      text: 'text-yellow-200',
      bg: 'bg-yellow-100/20',
      border: 'border-yellow-600',
      gradient: 'from-yellow-200 to-yellow-400',
    },
    unit: {
      short: 'O',
      long: 'Or',
    },
  },
  
  food: {
    id: 'food',
    name: 'nourriture',
    nameCapitalized: 'Nourriture',
    icon: '🍖',
    assetPath: '/assets/resources/food.png',
    color: {
      text: 'text-red-200',
      bg: 'bg-red-100/20',
      border: 'border-red-600',
      gradient: 'from-red-200 to-red-400',
    },
    unit: {
      short: 'N',
      long: 'Nourriture',
    },
  },

  population: {
    id: 'population',
    name: 'population',
    nameCapitalized: 'Population',
    icon: '👥',
    assetPath: '/assets/resources/population.png',
    color: {
      text: 'text-blue-200',
      bg: 'bg-blue-100/20',
      border: 'border-blue-600',
      gradient: 'from-blue-200 to-blue-400',
    },
    unit: {
      short: 'P',
      long: 'Population',
    },
  },

  crowns: {
    id: 'crowns',
    name: 'couronnes',
    nameCapitalized: 'Couronnes',
    icon: '👑',
    assetPath: '/assets/crown.png',
    color: {
      text: 'text-yellow-200',
      bg: 'bg-yellow-100/20',
      border: 'border-yellow-600',
      gradient: 'from-yellow-200 to-yellow-400',
    },
    unit: {
      short: 'C',
      long: 'Couronnes',
    },
  },
};

// ===================================
// DERIVED MAPS — primary resources (wood / stone / iron)
// ===================================

export type PrimaryResourceKey = 'wood' | 'stone' | 'iron';

export const PRIMARY_RESOURCE_KEYS: readonly PrimaryResourceKey[] = ['wood', 'stone', 'iron'] as const;

export const RESOURCE_ICON_PATHS = {
  wood: RESOURCE_CONFIG.wood.assetPath,
  stone: RESOURCE_CONFIG.stone.assetPath,
  iron: RESOURCE_CONFIG.iron.assetPath,
} as const satisfies Record<PrimaryResourceKey, string>;

export const RESOURCE_DISPLAY_LABELS = {
  wood: RESOURCE_CONFIG.wood.nameCapitalized,
  stone: RESOURCE_CONFIG.stone.nameCapitalized,
  iron: RESOURCE_CONFIG.iron.nameCapitalized,
} as const satisfies Record<PrimaryResourceKey, string>;

export const RESOURCE_BAR_FILL = {
  wood: 'bg-[linear-gradient(90deg,#7a5a32,#b08040)]',
  stone: 'bg-[linear-gradient(90deg,#7a7a7a,#a0a0a0)]',
  iron: 'bg-[linear-gradient(90deg,#4a6070,#6a90a8)]',
} as const satisfies Record<PrimaryResourceKey, string>;

// ===================================
// HELPERS & UTILITIES
// ===================================

/**
 * Obtenir la configuration d'une ressource par son ID
 */
export const getResourceConfig = (resourceType: ResourceType): ResourceConfig => {
  return RESOURCE_CONFIG[resourceType];
};

/**
 * Vérifier si un type de ressource est valide
 */
export const isValidResourceType = (type: string): type is ResourceType => {
  return type in RESOURCE_CONFIG;
};

import { formatCompact } from './formatters';

export const formatResourceAmount = (amount: number): string =>
  formatCompact(amount, { decimals: 'always' });

export const formatHeaderCompactAmount = (amount: number): string => {
  const value = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  return formatCompact(value, { decimals: 'none', case: 'lower' });
};

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return formatCompact(n);
  if (n >= 10_000) {
    const rounded = Math.round(n / 1000);
    return rounded >= 1000 ? formatCompact(n) : `${rounded}K`;
  }
  return formatCompact(n);
}

