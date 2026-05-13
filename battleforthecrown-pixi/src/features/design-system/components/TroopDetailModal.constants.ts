import type { TroopDetailLabels, TroopDetailStats } from './TroopDetailModal';

export const TROOP_DETAIL_FIELD_MAX: TroopDetailStats = {
  attack: 20,
  carryCapacity: 100,
  defenseArcher: 15,
  defenseCavalry: 20,
  defenseInfantry: 15,
  speed: 35,
};

export const TROOP_DETAIL_LABELS_FR: TroopDetailLabels = {
  attack: 'Attaque',
  carryCapacity: 'Capacité de pillage',
  characteristics: 'Caractéristiques',
  cost: 'Coût (×1)',
  costMultiplier: 'Par unité',
  defenseArcher: 'vs Archers',
  defenseCavalry: 'vs Cavalerie',
  defenseGroup: 'Défense',
  defenseInfantry: 'vs Infanterie',
  population: 'Population',
  speed: 'Vitesse',
  tiers: {
    correct: 'Correct',
    excellent: 'Excellent',
    faible: 'Faible',
    mediocre: 'Médiocre',
    solide: 'Solide',
  },
  training: 'Formation',
};
