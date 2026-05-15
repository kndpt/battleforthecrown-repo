import { getTaskProjection } from './retention.service';

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
