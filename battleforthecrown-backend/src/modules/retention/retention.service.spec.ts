import {
  getClaimableDayKeys,
  getParisDailyKey,
  getPreviousParisDailyKey,
  calculateTaskProgressUpdate,
  getPlayerMaxCastleLevel,
  getTaskProjection,
  isWithinClaimGrace,
} from './retention.utils';

describe('getTaskProjection', () => {
  it('projects a victorious barbarian battle as the daily barbarian task', () => {
    expect(
      getTaskProjection('battle.resolved', {
        expeditionId: 'expedition-1',
        reportId: 'report-1',
        villageId: 'village-1',
        villageName: 'Village',
        targetKind: 'BARBARIAN_VILLAGE',
        targetName: 'Barbarian Village',
        targetX: 10,
        targetY: 11,
        isVictory: true,
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
        lossesAttacker: {},
        casualtyRate: 0,
        survivingUnits: {},
        returnAt: null,
      }),
    ).toEqual({
      villageId: 'village-1',
      type: 'RAID_BARBARIAN',
      completedQty: 1,
      targetTier: null,
    });
  });

  it('projects the barbarian target tier when present', () => {
    expect(
      getTaskProjection('battle.resolved', {
        expeditionId: 'expedition-1',
        reportId: 'report-1',
        villageId: 'village-1',
        villageName: 'Village',
        targetKind: 'BARBARIAN_VILLAGE',
        targetName: 'Barbarian Village',
        targetTier: 'T3',
        targetX: 10,
        targetY: 11,
        isVictory: true,
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
        lossesAttacker: {},
        casualtyRate: 0,
        survivingUnits: {},
        returnAt: null,
      }),
    ).toMatchObject({ targetTier: 'T3' });
  });

  it('progresses by completed quantity and gates barbarian tiers by floor', () => {
    const raidTask = {
      progress: 0,
      target: 2,
      metadata: { completedQty: 1, minTargetTier: 'T3' },
    } as const;

    expect(calculateTaskProgressUpdate(raidTask, 1, 'T2')).toBeNull();
    expect(calculateTaskProgressUpdate(raidTask, 1, 'T3')).toEqual({
      progress: 1,
      isComplete: false,
    });
    expect(
      calculateTaskProgressUpdate({ ...raidTask, progress: 1 }, 1, 'T4'),
    ).toEqual({ progress: 2, isComplete: true });

    expect(
      calculateTaskProgressUpdate(
        { progress: 0, target: 5, metadata: {} },
        3,
        null,
      ),
    ).toEqual({ progress: 3, isComplete: false });
  });

  it('does not project sending a barbarian attack before victory is known', () => {
    expect(
      getTaskProjection('battle.sent', {
        expeditionId: 'expedition-1',
        villageId: 'village-1',
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: 10,
        targetY: 11,
        arrivalAt: new Date().toISOString(),
      }),
    ).toBeNull();
  });

  it('ignores event kinds that are no longer daily task templates', () => {
    expect(
      getTaskProjection('scout.reported', {
        expeditionId: 'scout-1',
        reportId: 'report-1',
        villageId: 'village-1',
        targetKind: 'BARBARIAN_VILLAGE',
        targetName: 'Barbarian Village',
        targetX: 10,
        targetY: 11,
        returnAt: new Date().toISOString(),
      }),
    ).toBeNull();
    expect(
      getTaskProjection('reinforcement.sent', {
        expeditionId: 'reinforcement-1',
        villageId: 'village-1',
        targetVillageId: 'target-village-1',
        arrivalAt: new Date().toISOString(),
      }),
    ).toBeNull();
    expect(
      getTaskProjection('garrison.added', {
        villageId: 'host-village-1',
        originVillageId: 'origin-village-1',
        units: { MILITIA: 1 },
      }),
    ).toBeNull();
  });
});

describe('daily card reset helpers', () => {
  it('switches the Paris daily key at 04:00 Europe/Paris', () => {
    expect(getParisDailyKey(new Date('2026-06-02T01:30:00.000Z'))).toBe(
      '2026-06-01',
    );
    expect(getParisDailyKey(new Date('2026-06-02T02:30:00.000Z'))).toBe(
      '2026-06-02',
    );
  });

  it('allows only the current and previous daily keys for claim grace', () => {
    const now = new Date('2026-06-02T02:30:00.000Z');

    expect(getPreviousParisDailyKey(now)).toBe('2026-06-01');
    expect(getClaimableDayKeys(now)).toEqual(['2026-06-02', '2026-06-01']);
    expect(isWithinClaimGrace('2026-06-02', now)).toBe(true);
    expect(isWithinClaimGrace('2026-06-01', now)).toBe(true);
    expect(isWithinClaimGrace('2026-05-31', now)).toBe(false);
  });

  it('derives the previous daily key by Paris calendar day across DST shifts', () => {
    const springForwardAfterReset = new Date('2026-03-29T02:30:00.000Z');

    expect(getParisDailyKey(springForwardAfterReset)).toBe('2026-03-29');
    expect(getPreviousParisDailyKey(springForwardAfterReset)).toBe(
      '2026-03-28',
    );
  });
});

describe('getPlayerMaxCastleLevel', () => {
  it('returns the max castle level among all villages in the world, fallback 1', async () => {
    const aggregate = jest
      .fn()
      .mockResolvedValueOnce({ _max: { level: 7 } })
      .mockResolvedValueOnce({ _max: { level: null } });
    const prisma = { building: { aggregate } };

    await expect(
      getPlayerMaxCastleLevel(prisma, 'user-1', 'world-1'),
    ).resolves.toBe(7);
    await expect(
      getPlayerMaxCastleLevel(prisma, 'user-1', 'world-1'),
    ).resolves.toBe(1);
    expect(aggregate).toHaveBeenCalledWith({
      where: {
        type: 'CASTLE',
        village: { userId: 'user-1', worldId: 'world-1' },
      },
      _max: { level: true },
    });
  });
});
