import { describe, expect, it } from 'vitest';
import type { JoinedVillage, WorldMembership } from '@/api';
import { pickDefaultVillage, pickLastPlayedMembership } from './worldResume';

function membership(overrides: Partial<WorldMembership>): WorldMembership {
  return {
    joinedAt: '2026-05-01T10:00:00.000Z',
    lastLoginAt: null,
    role: 'PLAYER',
    status: 'OPEN',
    villageCount: 1,
    worldId: 'world-a',
    worldName: 'Aubeforge',
    ...overrides,
  };
}

function village(overrides: Partial<JoinedVillage>): JoinedVillage {
  return {
    id: 'village-a',
    isCapital: false,
    name: 'Village',
    userId: 'user-a',
    worldId: 'world-a',
    x: 0,
    y: 0,
    ...overrides,
  };
}

describe('worldResume', () => {
  it('selects the membership with the latest login timestamp first', () => {
    const selected = pickLastPlayedMembership([
      membership({ lastLoginAt: '2026-05-20T10:00:00.000Z', worldId: 'old' }),
      membership({ lastLoginAt: '2026-05-24T10:00:00.000Z', worldId: 'latest' }),
      membership({ joinedAt: '2026-05-25T10:00:00.000Z', worldId: 'never-played' }),
    ]);

    expect(selected?.worldId).toBe('latest');
  });

  it('falls back to joinedAt when a membership was never entered', () => {
    const selected = pickLastPlayedMembership([
      membership({ joinedAt: '2026-05-20T10:00:00.000Z', worldId: 'older' }),
      membership({ joinedAt: '2026-05-24T10:00:00.000Z', worldId: 'newer' }),
    ]);

    expect(selected?.worldId).toBe('newer');
  });

  it('selects the capital village before other villages', () => {
    const selected = pickDefaultVillage([
      village({ id: 'secondary' }),
      village({ id: 'capital', isCapital: true }),
    ]);

    expect(selected?.id).toBe('capital');
  });
});
