import type { WorldDetailLabels } from './WorldDetailDesign';
import type { SeasonVariant, WorldsSelectionLabels } from './WorldsSelectionDesign';

export const defaultSeasonVariants: SeasonVariant[] = [
  { duration: '60 j', id: 'standard', label: 'Standard', tempo: '×1' },
  { disabled: true, duration: '30 j', id: 'speed', label: 'Speed', tempo: '×2' },
  { disabled: true, duration: 'TBD', id: 'hardcore', label: 'Hardcore', tempo: '?' },
];

export const worldsSelectionLabels: WorldsSelectionLabels = {
  back: 'Retour',
  details: 'Détails',
  empty: {
    locked: 'Aucun royaume verrouillé.',
    open: 'Aucun royaume ouvert.',
    planned: 'Aucun royaume planifié.',
  },
  seasonVariants: 'Variantes de saison',
  subtitle: 'Choisissez votre saison — chaque royaume, son tempo',
  tempoHint: '',
  title: 'ROYAUMES',
};

export const worldDetailLabels: WorldDetailLabels = {
  back: 'Royaumes',
  guardrailsTitle: 'Garde-fous absolus',
  joinedStatsTitle: 'Votre royaume',
  lifecycleTitle: 'Cycle du royaume',
  mapTitle: 'Carte',
  notFound: 'Royaume introuvable.',
  tempoTitle: 'Rythme du monde',
};
