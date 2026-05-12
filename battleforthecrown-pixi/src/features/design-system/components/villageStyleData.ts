import type { VillageStyleCost, VillageStyleOption } from './VillageStyleModal';

export const villageStyleOptions: VillageStyleOption[] = [
  {
    bonuses: [
      { label: 'Défense unité', value: '+25%' },
      { label: 'Stockage', value: '+10%' },
    ],
    color: { border: '#1f3e66', dark: '#2e5a88', light: '#5b8fbf' },
    cost: { crowns: 80, iron: 50, stone: 100, wood: 200 },
    glyph: '🛡',
    id: 'FORTRESS',
    maluses: [{ label: 'Vitesse de déplacement', value: '−20%' }],
    name: 'Forteresse',
    tagline: 'Murs hauts, portes lourdes.',
  },
  {
    bonuses: [
      { label: 'Vitesse de déplacement', value: '+15%' },
      { label: 'Pillage', value: '+10%' },
    ],
    color: { border: '#a93226', dark: '#c0392b', light: '#e74c3c' },
    cost: { crowns: 80, iron: 200, stone: 100, wood: 50 },
    glyph: '⚔',
    id: 'RAIDERS',
    maluses: [{ label: 'Défense', value: '−10%' }],
    name: 'Raiders',
    tagline: 'Légers, rapides, sans pitié.',
  },
  {
    bonuses: [
      { label: 'Production', value: '+20%' },
      { label: 'Population max', value: '+10%' },
    ],
    color: { border: '#3a6c1f', dark: '#4a8c2a', light: '#6ebf49' },
    cost: { crowns: 60, iron: 50, stone: 200, wood: 100 },
    glyph: '⚙',
    id: 'ECONOMIC',
    maluses: [
      { label: 'Attaque', value: '−10%' },
      { label: 'Défense', value: '−10%' },
    ],
    name: 'Économique',
    tagline: 'Plus de bras, plus de récolte.',
  },
  {
    bonuses: [],
    color: { border: '#5d4a32', dark: '#7d5a3a', light: '#b89968' },
    cost: { crowns: 80, iron: 100, stone: 100, wood: 100 },
    glyph: '⚖',
    id: 'BALANCED',
    maluses: [],
    name: 'Équilibré',
    tagline: 'Aucun engagement. Aucune faveur.',
  },
];

export function scaleVillageStyleCost(cost: VillageStyleCost, castleLevel: number): VillageStyleCost {
  const multiplier = Math.pow(1.25, Math.max(0, castleLevel - 4));

  return {
    crowns: Math.floor(cost.crowns * multiplier),
    iron: Math.floor(cost.iron * multiplier),
    stone: Math.floor(cost.stone * multiplier),
    wood: Math.floor(cost.wood * multiplier),
  };
}
