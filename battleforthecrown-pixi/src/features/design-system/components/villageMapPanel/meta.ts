export type TroopCategory = 'inf' | 'tir' | 'spe' | 'eli';
export type VillageMapVariant = 'mine' | 'unscouted' | 'scouted' | 'barbare';
export type VillageMapTypeTag = 'player' | 'mine' | 'pvm' | 'barbare';
export type BarbarianTier = 1 | 2 | 3 | 4 | 5;

export interface ThemeColors { l: string; d: string; b: string }

// Couleur de tuile par catégorie de troupe (CATC du mockup, var→hex)
export const CATEGORY_COLORS: Record<TroopCategory, ThemeColors> = {
  inf: { l: '#bd9468', d: '#6b5436', b: '#3c2619' },
  tir: { l: '#5b9bd5', d: '#2e75b6', b: '#1f5288' },
  spe: { l: '#e74c3c', d: '#c0392b', b: '#a93226' },
  eli: { l: '#f1c40f', d: '#d4a017', b: '#9e7b0d' },
};

export interface StyleMeta extends ThemeColors { ink: string; ico: string }
export const STYLE_META: Record<string, StyleMeta> = {
  'Forteresse': { l: '#5b9bd5', d: '#2e75b6', b: '#1f5288', ink: '#fff', ico: '🛡' },
  'Raiders':    { l: '#e74c3c', d: '#c0392b', b: '#a93226', ink: '#fff', ico: '⚔' },
  'Économique': { l: '#6ebf49', d: '#4a8c2a', b: '#3a6c1f', ink: '#fff', ico: '🌾' },
  'Équilibré':  { l: '#f1c40f', d: '#d4a017', b: '#9e7b0d', ink: '#3a2a00', ico: '♛' },
};
// Fallback style inconnu (gris stone)
export const STYLE_FALLBACK: StyleMeta = { l: '#b0b8c0', d: '#7c8088', b: '#5d6d6e', ink: '#fff', ico: '—' };

export interface TierMeta extends ThemeColors { ink: string; label: string; desc: string }
export const TIER_META: Record<BarbarianTier, TierMeta> = {
  1: { l: '#6ebf49', d: '#4a8c2a', b: '#3a6c1f', ink: '#fff',     label: 'Campement',          desc: "Milice seule — cible d'entraînement" },
  2: { l: '#9bbf4e', d: '#6f8f2c', b: '#4d641d', ink: '#fff',     label: 'Avant-poste',        desc: 'Milice + archers à distance' },
  3: { l: '#f1c40f', d: '#d4a017', b: '#9e7b0d', ink: '#3a2a00', label: 'Garnison',            desc: 'Infanterie structurée — écuyers' },
  4: { l: '#df9140', d: '#a85e1c', b: '#723c0e', ink: '#fff',     label: 'Forteresse barbare',  desc: 'Templiers en garnison — tank' },
  5: { l: '#e74c3c', d: '#c0392b', b: '#a93226', ink: '#fff',     label: 'Garnison maximale',   desc: 'Compo complète, volume massif' },
};

// Catégorie visuelle par UnitType backend (best-effort, défaut 'inf')
const UNIT_CATEGORY: Record<string, TroopCategory> = {
  MILITIA: 'inf', SQUIRE: 'inf', WARRIOR: 'spe', ARCHER: 'tir',
  CAVALRY: 'spe', TEMPLAR: 'eli', NOBLE: 'eli', SPY: 'tir',
  CATAPULT: 'inf', RAM: 'inf',
};
export function unitCategoryFor(unitType: string): TroopCategory {
  return UNIT_CATEGORY[unitType] ?? 'inf';
}

export const frInt = (n: number): string => n.toLocaleString('fr-FR');
// Abréviation K/M pour puissances potentiellement grandes (1,2K · 3,4M)
export const frShort = (n: number): string => {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '').replace('.', ',') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '').replace('.', ',') + 'K';
  return frInt(n);
};
