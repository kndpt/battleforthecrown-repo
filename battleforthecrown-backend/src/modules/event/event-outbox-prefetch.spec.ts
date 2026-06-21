import {
  collectVillageIdsFromOutboxEvents,
  isInvalidEventPayloadError,
  resolveVillageUserIdCache,
} from './event-outbox-prefetch';

describe('isInvalidEventPayloadError', () => {
  it('returns true for Zod decode failures from parseEventPayload', () => {
    expect(
      isInvalidEventPayloadError(
        new Error(
          'Invalid EventOutbox payload for kind "building.completed": ...',
        ),
      ),
    ).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isInvalidEventPayloadError(new Error('database unavailable'))).toBe(
      false,
    );
    expect(isInvalidEventPayloadError('not an error')).toBe(false);
  });
});

describe('collectVillageIdsFromOutboxEvents', () => {
  it('collects village ids from valid outbox events', () => {
    expect(
      collectVillageIdsFromOutboxEvents([
        {
          kind: 'building.completed',
          payload: {
            buildingId: 'b1',
            villageId: 'v1',
            buildingType: 'woodcutter',
            level: 1,
            ownerId: 'u1',
            worldId: 'w1',
          },
        },
      ]),
    ).toEqual(['v1']);
  });

  it('skips malformed payloads without propagating the error', () => {
    expect(
      collectVillageIdsFromOutboxEvents([
        {
          kind: 'building.completed',
          payload: { villageId: 'v1' },
        },
        {
          kind: 'building.completed',
          payload: {
            buildingId: 'b2',
            villageId: 'v2',
            buildingType: 'woodcutter',
            level: 2,
            ownerId: 'u1',
            worldId: 'w1',
          },
        },
      ]),
    ).toEqual(['v2']);
  });

  it('rethrows unexpected errors', () => {
    expect(() =>
      collectVillageIdsFromOutboxEvents(
        [
          {
            kind: 'building.completed',
            payload: {
              buildingId: 'b1',
              villageId: 'v1',
              buildingType: 'woodcutter',
              level: 1,
            },
          },
        ],
        () => {
          throw new Error('unexpected parse failure');
        },
      ),
    ).toThrow('unexpected parse failure');
  });
});

describe('resolveVillageUserIdCache', () => {
  it('returns the prefetch result on success', async () => {
    const cache = new Map([['v1', 'user-1']]);

    await expect(
      resolveVillageUserIdCache(() => Promise.resolve(cache)),
    ).resolves.toBe(cache);
  });

  it('falls back to an empty map when prefetch rejects', async () => {
    const onError = jest.fn();

    const result = await resolveVillageUserIdCache(
      () => Promise.reject(new Error('prefetch query failed')),
      onError,
    );

    expect(result).toEqual(new Map());
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
