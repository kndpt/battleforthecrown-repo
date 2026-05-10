import type { UnitType } from '@battleforthecrown/shared/army';

interface UnitMeta {
  name: string;
  description: string;
  /** PNG asset path under /public, or null when no sprite is available. */
  iconPath: string | null;
  /** Emoji fallback when iconPath is null. */
  emoji: string;
}

export const UNIT_META: Record<UnitType, UnitMeta> = {
  MILITIA: {
    name: 'Milice de paysans',
    description:
      'Infanterie de base, faible mais économique. Idéale pour les premières défenses.',
    iconPath: '/assets/army/militia.png',
    emoji: '🪓',
  },
  SQUIRE: {
    name: 'Écuyer',
    description: 'Défense solide et polyvalente. Excellent pour protéger votre village.',
    iconPath: '/assets/army/squire.png',
    emoji: '🛡️',
  },
  WARRIOR: {
    name: 'Guerrier',
    description: 'Infanterie offensive aguerrie, efficace contre les troupes légères.',
    iconPath: null,
    emoji: '⚔️',
  },
  ARCHER: {
    name: 'Archer',
    description: "Attaque à distance efficace. Parfait pour affaiblir l'ennemi de loin.",
    iconPath: '/assets/army/archer.png',
    emoji: '🏹',
  },
  CAVALRY: {
    name: 'Cavalerie',
    description: 'Unité rapide et mobile. Excellente pour les raids éclair.',
    iconPath: null,
    emoji: '🐎',
  },
  TEMPLAR: {
    name: 'Templier',
    description: "Unité d'élite puissante. Redoutable au combat rapproché.",
    iconPath: '/assets/army/templar.png',
    emoji: '⚔️',
  },
  CATAPULT: {
    name: 'Catapulte',
    description: 'Arme de siège dévastatrice. Inflige des dégâts massifs aux défenses.',
    iconPath: null,
    emoji: '🪨',
  },
  SPY: {
    name: 'Espion',
    description: "Agent furtif spécialisé dans l'espionnage et la reconnaissance ennemie.",
    iconPath: null,
    emoji: '🕵️',
  },
  RAM: {
    name: 'Bélier',
    description: 'Unité de siège lourde, prévue pour briser les défenses fortifiées.',
    iconPath: null,
    emoji: '🪵',
  },
  NOBLE: {
    name: 'Noble',
    description: 'Noble de haut rang. Permet de conquérir des villages ennemis.',
    iconPath: null,
    emoji: '👑',
  },
};

export function unitMetaFor(type: string): UnitMeta {
  return (
    UNIT_META[type as UnitType] ?? {
      name: type,
      description: '',
      iconPath: null,
      emoji: '⚔️',
    }
  );
}
