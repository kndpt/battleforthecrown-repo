import { getOnboardingProjection } from './onboarding.utils';

describe('getOnboardingProjection', () => {
  it('maps scripted onboarding facts to the matching sequential steps', () => {
    expect(
      getOnboardingProjection('building.completed', {
        buildingId: 'castle',
        villageId: 'v1',
        buildingType: 'CASTLE',
        level: 2,
      }),
    ).toEqual({ villageId: 'v1', step: 'UPGRADE_CASTLE_LEVEL_2' });
    expect(
      getOnboardingProjection('building.completed', {
        buildingId: 'castle',
        villageId: 'v1',
        buildingType: 'CASTLE',
        level: 3,
      }),
    ).toEqual({ villageId: 'v1', step: 'UPGRADE_CASTLE_LEVEL_3' });
    expect(
      getOnboardingProjection('building.completed', {
        buildingId: 'barracks',
        villageId: 'v1',
        buildingType: 'BARRACKS',
        level: 1,
      }),
    ).toEqual({ villageId: 'v1', step: 'BUILD_BARRACKS' });
    expect(
      getOnboardingProjection('unit.trained', {
        trainingId: 'training',
        villageId: 'v1',
        unitType: 'MILITIA',
        completedQty: 1,
        totalQty: 1,
      }),
    ).toEqual({ villageId: 'v1', step: 'TRAIN_TROOPS' });
    expect(
      getOnboardingProjection('unit.trained', {
        trainingId: 'training',
        villageId: 'v1',
        unitType: 'SQUIRE',
        completedQty: 1,
        totalQty: 1,
      }),
    ).toBeNull();
    expect(
      getOnboardingProjection('building.completed', {
        buildingId: 'watchtower',
        villageId: 'v1',
        buildingType: 'WATCHTOWER',
        level: 1,
      }),
    ).toEqual({ villageId: 'v1', step: 'BUILD_WATCHTOWER' });
    expect(
      getOnboardingProjection('battle.resolved', {
        expeditionId: 'battle',
        reportId: 'report',
        villageId: 'v1',
        villageName: 'Home',
        targetKind: 'BARBARIAN_VILLAGE',
        targetName: 'Barbares',
        targetX: 1,
        targetY: 2,
        isVictory: true,
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
        lossesAttacker: {},
        casualtyRate: 0,
        survivingUnits: {},
        returnAt: null,
      }),
    ).toEqual({ villageId: 'v1', step: 'ATTACK_BARBARIAN' });
  });

  it('ignores non-scripted or failed facts', () => {
    expect(
      getOnboardingProjection('building.completed', {
        buildingId: 'wood',
        villageId: 'v1',
        buildingType: 'WOOD',
        level: 2,
      }),
    ).toBeNull();
    expect(
      getOnboardingProjection('battle.resolved', {
        expeditionId: 'battle',
        reportId: 'report',
        villageId: 'v1',
        villageName: 'Home',
        targetKind: 'PLAYER_VILLAGE',
        targetName: 'Enemy',
        targetX: 1,
        targetY: 2,
        isVictory: true,
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
        lossesAttacker: {},
        casualtyRate: 0,
        survivingUnits: {},
        returnAt: null,
      }),
    ).toBeNull();
  });
});
