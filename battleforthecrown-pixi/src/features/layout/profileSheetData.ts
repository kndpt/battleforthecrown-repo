import type { PlayerProfileSheetProps } from '@/features/design-system/components/PlayerProfileSheet';

export const profileSheetIcons: PlayerProfileSheetProps['icons'] = {
  armyPower: '/assets/army-power.png',
  castle: '/assets/castle.png',
  crown: '/assets/casual-icons/crown.png',
  defense: '/assets/hand-silver.png',
  position: '/assets/position.png',
  raids: '/assets/hand-red.png',
};

export const profileSheetLabels: PlayerProfileSheetProps['labels'] = {
  close: 'Fermer',
  history: 'Historique',
  logout: 'Quitter la session',
  phase: 'Phase',
  tabs: {
    profile: 'Profil',
    settings: 'Réglages',
    villages: 'Villages',
  },
  villageHint: 'Styles et niveaux affichés uniquement quand les données existent.',
  world: 'Monde',
};

export const profileSheetSettings: PlayerProfileSheetProps['settings'] = [
  { icon: '—', id: 'notifications', label: 'Notifications', value: 'À venir' },
  { icon: '—', id: 'sound', label: 'Son et musique', value: 'À venir' },
  { icon: '—', id: 'language', label: 'Langue', value: 'À venir' },
];
