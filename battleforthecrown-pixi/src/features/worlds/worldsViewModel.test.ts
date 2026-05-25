import type { PublicWorld } from '@battleforthecrown/shared/world';
import { describe, expect, it } from 'vitest';
import {
  buildWorldTabCounts,
  filterWorldsByTab,
  toWorldCardViewModel,
} from './worldsViewModel';

const now = Date.parse('2026-05-25T12:00:00.000Z');

function makeWorld(overrides: Partial<PublicWorld> = {}): PublicWorld {
  return {
    id: 'world-open',
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
      inscriptionPhase: 'main',
      plannedOpenAt: null,
      startedAt: '2026-05-20T12:00:00.000Z',
      totalDays: 60,
    },
    status: 'OPEN',
    tempoProfile: 'standard',
    ...overrides,
  };
}

describe('worldsViewModel', () => {
  it('maps OPEN worlds to the inscription tab with a join CTA', () => {
    const model = toWorldCardViewModel(makeWorld(), new Set<string>(), now);

    expect(model.tab).toBe('open');
    expect(model.statusLabel).toBe('INSCRIPTION LIBRE');
    expect(model.ctaKind).toBe('join');
    expect(model.ctaLabel).toBe('Rejoindre le royaume');
    expect(model.dayLabel).toBe('J. 5 / 60');
    expect(model.joinedCountLabel).toBe('8 420');
    expect(model.tempoLabel).toBe('STANDARD');
    expect(model.tierLabel).toBe('DÉBUTANTS');
  });

  it('maps PLANNED worlds to the bientôt tab with countdown and notify CTA', () => {
    const model = toWorldCardViewModel(
      makeWorld({
        id: 'world-planned',
        lifecycle: {
          day: null,
          endsAt: null,
          inscriptionPhase: 'closed',
          plannedOpenAt: '2026-05-27T02:00:00.000Z',
          startedAt: null,
          totalDays: 60,
        },
        status: 'PLANNED',
      }),
      new Set<string>(),
      now,
    );

    expect(model.tab).toBe('planned');
    expect(model.statusLabel).toBe('PLANIFIÉ');
    expect(model.ctaKind).toBe('notify');
    expect(model.dayLabel).toBe('Ouvre dans 1j 14h');
    expect(model.lifecycleDay).toBeNull();
  });

  it('maps LOCKED worlds to the locked tab with uniform wording', () => {
    const model = toWorldCardViewModel(
      makeWorld({
        lifecycle: {
          day: 28,
          endsAt: '2026-06-26T12:00:00.000Z',
          inscriptionPhase: 'closed',
          plannedOpenAt: null,
          startedAt: '2026-04-27T12:00:00.000Z',
          totalDays: 60,
        },
        status: 'LOCKED',
      }),
      new Set<string>(),
      now,
    );

    expect(model.tab).toBe('locked');
    expect(model.statusLabel).toBe('INSCRIPTION CLOSE');
    expect(model.ctaKind).toBe('locked');
    expect(model.ctaLabel).toBe('Inscription close');
  });

  it('marks already joined worlds without changing tab counts', () => {
    const model = toWorldCardViewModel(makeWorld({ id: 'joined-world' }), new Set(['joined-world']), now);

    expect(model.tab).toBe('open');
    expect(model.isJoined).toBe(true);
    expect(model.ctaKind).toBe('joined');
    expect(model.ctaLabel).toBe('Entrer dans le royaume');
  });

  it('keeps legacy OPEN worlds explicit when lifecycle start dates are missing', () => {
    const model = toWorldCardViewModel(
      makeWorld({
        lifecycle: {
          day: null,
          endsAt: null,
          inscriptionPhase: 'closed',
          plannedOpenAt: null,
          startedAt: null,
          totalDays: 60,
        },
      }),
      new Set<string>(),
      now,
    );

    expect(model.dayLabel).toBe('J. ? / 60');
    expect(model.lifecycleDay).toBeNull();
  });

  it('builds tab counts and filters from client-side derived status groups', () => {
    const models = [
      toWorldCardViewModel(makeWorld({ id: 'open-1' }), new Set<string>(), now),
      toWorldCardViewModel(makeWorld({ id: 'planned-1', status: 'PLANNED' }), new Set<string>(), now),
      toWorldCardViewModel(makeWorld({ id: 'locked-1', status: 'LOCKED' }), new Set<string>(), now),
      toWorldCardViewModel(makeWorld({ id: 'open-2' }), new Set<string>(), now),
    ];

    expect(buildWorldTabCounts(models)).toEqual({ locked: 1, open: 2, planned: 1 });
    expect(filterWorldsByTab(models, 'open').map((world) => world.id)).toEqual(['open-1', 'open-2']);
    expect(filterWorldsByTab(models, 'planned').map((world) => world.id)).toEqual(['planned-1']);
    expect(filterWorldsByTab(models, 'locked').map((world) => world.id)).toEqual(['locked-1']);
  });
});
