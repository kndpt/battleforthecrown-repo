import type { PublicWorld } from '@battleforthecrown/shared/world';
import { toWorldCardViewModel } from '@/features/worlds/worldsViewModel';

const previewNow = Date.parse('2026-05-25T12:00:00.000Z');

export const publicWorldPreviewFixtures: PublicWorld[] = [
  {
    id: 'W214',
    identity: {
      displayName: 'Aubeforge',
      sigil: 'crown',
      tagline: 'Où les vassaux bâtissent leur légende',
      themeColor: 'green',
      tier: 'DEBUTANTS',
    },
    joinedCount: 8420,
    lifecycle: {
      day: 5,
      endsAt: '2026-07-19T12:00:00.000Z',
      inscriptionLateDays: 3,
      inscriptionMainDays: 7,
      inscriptionPhase: 'main',
      plannedOpenAt: null,
      startedAt: '2026-05-20T12:00:00.000Z',
      totalDays: 60,
    },
    map: { width: 500, height: 500 },
    status: 'OPEN',
    tempoProfile: 'standard',
  },
  {
    id: 'W216',
    identity: {
      displayName: 'Mont-Vermeil',
      sigil: 'flame',
      tagline: "L'étendard vermeil flotte déjà",
      themeColor: 'crimson',
      tier: 'DEBUTANTS',
    },
    joinedCount: 1840,
    lifecycle: {
      day: 8,
      endsAt: '2026-07-16T12:00:00.000Z',
      inscriptionLateDays: 3,
      inscriptionMainDays: 7,
      inscriptionPhase: 'late',
      plannedOpenAt: null,
      startedAt: '2026-05-17T12:00:00.000Z',
      totalDays: 60,
    },
    map: { width: 500, height: 500 },
    status: 'OPEN',
    tempoProfile: 'standard',
  },
  {
    id: 'W217',
    identity: {
      displayName: 'Ombre-Pourpre',
      sigil: 'cross',
      tagline: 'La bannière est encore pliée',
      themeColor: 'purple',
      tier: 'DEBUTANTS',
    },
    joinedCount: 0,
    lifecycle: {
      day: null,
      endsAt: null,
      inscriptionLateDays: 3,
      inscriptionMainDays: 7,
      inscriptionPhase: 'closed',
      plannedOpenAt: '2026-05-27T02:00:00.000Z',
      startedAt: null,
      totalDays: 60,
    },
    map: { width: 500, height: 500 },
    status: 'PLANNED',
    tempoProfile: 'standard',
  },
  {
    id: 'W215',
    identity: {
      displayName: 'Cendre-Noire',
      sigil: 'tower',
      tagline: 'Cité brûlée, ferveur intacte',
      themeColor: 'onyx',
      tier: 'CLASSED',
    },
    joinedCount: 4210,
    lifecycle: {
      day: 28,
      endsAt: '2026-06-26T12:00:00.000Z',
      inscriptionLateDays: 3,
      inscriptionMainDays: 7,
      inscriptionPhase: 'closed',
      plannedOpenAt: null,
      startedAt: '2026-04-27T12:00:00.000Z',
      totalDays: 60,
    },
    map: { width: 500, height: 500 },
    status: 'LOCKED',
    tempoProfile: 'standard',
  },
];

export const worldPreviewModels = publicWorldPreviewFixtures.map((world) =>
  toWorldCardViewModel(world, new Set<string>(), previewNow),
);
