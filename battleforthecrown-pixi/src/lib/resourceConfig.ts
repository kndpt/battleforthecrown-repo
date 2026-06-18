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

/**
 * Formater un nombre de ressources (1K, 1.5M, etc.)
 */
export const formatResourceAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return Math.floor(amount).toString();
};

export const formatHeaderCompactAmount = (amount: number): string => {
  const value = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;

  if (value >= 1000000) {
    return `${Math.floor(value / 1000000)}m`;
  }
  if (value >= 1000) {
    return `${Math.floor(value / 1000)}k`;
  }
  return value.toString();
};

export function formatCompactNumber(n: number): string {
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.floor(n));
}

