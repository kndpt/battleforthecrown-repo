import {
  getClaimableDayKeys,
  getParisDailyKey,
  getPreviousParisDailyKey,
  getTaskProjection,
  isWithinClaimGrace,
} from './retention.service';

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
    ).toEqual({ villageId: 'village-1', type: 'RAID_BARBARIAN' });
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
