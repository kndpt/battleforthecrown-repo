import {
  loadUserDisplayNames,
  resolvePublicPlayerName,
  resolveWorldDisplayName,
  resolveWorldDisplayNameFromData,
} from './display-names';
import { DEFAULT_WORLD_CONFIG } from '@battleforthecrown/shared/world';
import type { PrismaClientOrTx } from './prisma.types';

function makeUserReader(users: Array<{ id: string; displayName: string }>) {
  const findMany = jest.fn().mockResolvedValue(users);
  const reader = { user: { findMany } } as unknown as PrismaClientOrTx;
  return { reader, findMany };
}

function makeWorldReader(row: { name: string; config: unknown } | null) {
  const findUnique = jest.fn().mockResolvedValue(row);
  const reader = {
    world: { findUnique },
  } as unknown as PrismaClientOrTx;
  return { reader, findUnique };
}

describe('loadUserDisplayNames', () => {
  it('returns an empty map and skips the DB on empty input', async () => {
    const { reader, findMany } = makeUserReader([]);
    const map = await loadUserDisplayNames(reader, []);
    expect(map.size).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('keys results by user id', async () => {
    const { reader } = makeUserReader([
      { id: 'u1', displayName: 'Alice' },
      { id: 'u2', displayName: 'Bob' },
    ]);
    const map = await loadUserDisplayNames(reader, ['u1', 'u2', 'missing']);
    expect(map.get('u1')).toBe('Alice');
    expect(map.get('u2')).toBe('Bob');
    expect(map.has('missing')).toBe(false);
  });

  it('queries with the deduped id set passed by the caller', async () => {
    const { reader, findMany } = makeUserReader([]);
    await loadUserDisplayNames(reader, ['u1', 'u2']);
    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: ['u1', 'u2'] } },
      select: { id: true, displayName: true },
    });
  });
});

describe('resolvePublicPlayerName', () => {
  it('returns the real display name when present', () => {
    expect(resolvePublicPlayerName('u1', new Map([['u1', 'Alice']]))).toBe(
      'Alice',
    );
  });

  it('falls back to anonymous label when id is unknown', () => {
    expect(resolvePublicPlayerName('user_abcdef123456', new Map())).toBe(
      'Joueur 123456',
    );
  });

  it('falls back to the missing-id placeholder when id is null', () => {
    expect(resolvePublicPlayerName(null, new Map())).toBe('Joueur ?');
  });
});

describe('resolveWorldDisplayNameFromData', () => {
  it('returns the parsed identity display name when config is valid', () => {
    expect(
      resolveWorldDisplayNameFromData(
        {
          name: 'fallback-name',
          config: {
            ...DEFAULT_WORLD_CONFIG,
            identity: { displayName: 'Royaume' },
          },
        },
        'world-1',
      ),
    ).toBe('Royaume');
  });

  it('falls back to world.name when config is invalid', () => {
    expect(
      resolveWorldDisplayNameFromData(
        { name: 'fallback-name', config: { broken: true } },
        'world-1',
      ),
    ).toBe('fallback-name');
  });

  it('falls back to the world id when the row is missing', () => {
    expect(resolveWorldDisplayNameFromData(null, 'world-1')).toBe('world-1');
  });
});

describe('resolveWorldDisplayName', () => {
  it('returns the parsed identity display name when config is valid', async () => {
    const { reader } = makeWorldReader({
      name: 'fallback-name',
      config: { ...DEFAULT_WORLD_CONFIG, identity: { displayName: 'Royaume' } },
    });
    await expect(resolveWorldDisplayName(reader, 'world-1')).resolves.toBe(
      'Royaume',
    );
  });

  it('falls back to world.name when config is invalid', async () => {
    const { reader } = makeWorldReader({
      name: 'fallback-name',
      config: { broken: true },
    });
    await expect(resolveWorldDisplayName(reader, 'world-1')).resolves.toBe(
      'fallback-name',
    );
  });

  it('falls back to the world id when no row is found', async () => {
    const { reader } = makeWorldReader(null);
    await expect(resolveWorldDisplayName(reader, 'world-1')).resolves.toBe(
      'world-1',
    );
  });
});
