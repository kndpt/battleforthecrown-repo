import { describe, expect, it } from 'vitest';
import {
  formatWorldLaunchAgeFr,
  pickFreshAlternativeWorld,
  type WorldFreshnessCandidate,
} from './lifecycle';

const NOW = new Date('2026-05-25T12:00:00.000Z');
const MS_PER_DAY = 86_400_000;

describe('formatWorldLaunchAgeFr', () => {
  it("returns « Lancé aujourd'hui » when started less than a day ago", () => {
    const startedAt = new Date(NOW.getTime() - 3 * 3_600_000);
    expect(formatWorldLaunchAgeFr(startedAt, NOW)).toBe("Lancé aujourd'hui");
  });

  it("returns « Lancé aujourd'hui » exactly at launch (0 elapsed)", () => {
    expect(formatWorldLaunchAgeFr(NOW, NOW)).toBe("Lancé aujourd'hui");
  });

  it('returns « Lancé hier » for exactly one elapsed day', () => {
    const startedAt = new Date(NOW.getTime() - MS_PER_DAY);
    expect(formatWorldLaunchAgeFr(startedAt, NOW)).toBe('Lancé hier');
  });

  it('returns « Lancé il y a {N} j » for more than one day (floor)', () => {
    const startedAt = new Date(NOW.getTime() - (3 * MS_PER_DAY + 5 * 3_600_000));
    expect(formatWorldLaunchAgeFr(startedAt, NOW)).toBe('Lancé il y a 3 j');
  });

  it('accepts ISO string startedAt', () => {
    expect(formatWorldLaunchAgeFr('2026-05-20T12:00:00.000Z', NOW)).toBe(
      'Lancé il y a 5 j',
    );
  });

  it('returns null for a null startedAt', () => {
    expect(formatWorldLaunchAgeFr(null, NOW)).toBeNull();
  });

  it('returns null for a future startedAt', () => {
    const startedAt = new Date(NOW.getTime() + MS_PER_DAY);
    expect(formatWorldLaunchAgeFr(startedAt, NOW)).toBeNull();
  });
});

describe('pickFreshAlternativeWorld', () => {
  function candidate(
    overrides: Partial<WorldFreshnessCandidate> & { id: string },
  ): WorldFreshnessCandidate {
    return {
      startedAt: '2026-05-24T12:00:00.000Z',
      inscriptionPhase: 'main',
      status: 'OPEN',
      ...overrides,
    };
  }

  it('returns the main candidate with the most recent startedAt', () => {
    const result = pickFreshAlternativeWorld(
      { id: 'current-late' },
      [
        candidate({ id: 'older', startedAt: '2026-05-21T12:00:00.000Z' }),
        candidate({ id: 'freshest', startedAt: '2026-05-24T18:00:00.000Z' }),
        candidate({ id: 'mid', startedAt: '2026-05-23T12:00:00.000Z' }),
      ],
      NOW,
    );
    expect(result).toBe('freshest');
  });

  it('excludes the current world from candidates', () => {
    const result = pickFreshAlternativeWorld(
      { id: 'self' },
      [candidate({ id: 'self', startedAt: '2026-05-24T18:00:00.000Z' })],
      NOW,
    );
    expect(result).toBeNull();
  });

  it('ignores late and closed phase candidates', () => {
    const result = pickFreshAlternativeWorld(
      { id: 'current' },
      [
        candidate({ id: 'late-one', inscriptionPhase: 'late' }),
        candidate({ id: 'closed-one', inscriptionPhase: 'closed' }),
      ],
      NOW,
    );
    expect(result).toBeNull();
  });

  it('ignores non-OPEN candidates when status is provided', () => {
    const result = pickFreshAlternativeWorld(
      { id: 'current' },
      [candidate({ id: 'planned', status: 'PLANNED' })],
      NOW,
    );
    expect(result).toBeNull();
  });

  it('ignores candidates with null or future startedAt', () => {
    const result = pickFreshAlternativeWorld(
      { id: 'current' },
      [
        candidate({ id: 'no-start', startedAt: null }),
        candidate({ id: 'future', startedAt: '2026-05-26T12:00:00.000Z' }),
      ],
      NOW,
    );
    expect(result).toBeNull();
  });

  it('returns null for an empty candidate list', () => {
    expect(pickFreshAlternativeWorld({ id: 'current' }, [], NOW)).toBeNull();
  });
});
