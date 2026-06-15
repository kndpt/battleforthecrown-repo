import {
  ONBOARDING_INITIAL_REWARD,
  getNextStep,
  getOnboardingProjection,
  mapOnboardingState,
} from './onboarding.utils';

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

describe('getNextStep', () => {
  it('advances each step to the next one in the scripted order', () => {
    expect(getNextStep('UPGRADE_CASTLE_LEVEL_2')).toBe('BUILD_BARRACKS');
    expect(getNextStep('BUILD_BARRACKS')).toBe('TRAIN_TROOPS');
    expect(getNextStep('TRAIN_TROOPS')).toBe('UPGRADE_CASTLE_LEVEL_3');
    expect(getNextStep('UPGRADE_CASTLE_LEVEL_3')).toBe('BUILD_WATCHTOWER');
    expect(getNextStep('BUILD_WATCHTOWER')).toBe('ATTACK_BARBARIAN');
  });

  it('returns null after the final step', () => {
    expect(getNextStep('ATTACK_BARBARIAN')).toBeNull();
  });
});

describe('mapOnboardingState', () => {
  it('exposes currentStep and ISO dates for an ACTIVE state', () => {
    const appliedAt = new Date('2026-06-15T10:00:00Z');
    const stepAt = new Date('2026-06-15T10:30:00Z');

    expect(
      mapOnboardingState({
        worldId: 'w1',
        firstVillageId: 'v1',
        status: 'ACTIVE',
        currentStep: 'BUILD_BARRACKS',
        initialRewardApplied: true,
        initialRewardAppliedAt: appliedAt,
        completedAt: null,
        steps: [{ step: 'UPGRADE_CASTLE_LEVEL_2', completedAt: stepAt }],
      }),
    ).toEqual({
      worldId: 'w1',
      firstVillageId: 'v1',
      status: 'ACTIVE',
      currentStep: 'BUILD_BARRACKS',
      completedSteps: [
        { step: 'UPGRADE_CASTLE_LEVEL_2', completedAt: stepAt.toISOString() },
      ],
      initialRewardApplied: true,
      initialRewardAppliedAt: appliedAt.toISOString(),
      initialReward: ONBOARDING_INITIAL_REWARD,
      completedAt: null,
    });
  });

  it('suppresses currentStep and serialises completedAt for a COMPLETED state', () => {
    const completedAt = new Date('2026-06-15T12:00:00Z');

    expect(
      mapOnboardingState({
        worldId: 'w1',
        firstVillageId: 'v1',
        status: 'COMPLETED',
        currentStep: 'ATTACK_BARBARIAN',
        initialRewardApplied: true,
        initialRewardAppliedAt: null,
        completedAt,
        steps: [],
      }),
    ).toMatchObject({
      status: 'COMPLETED',
      currentStep: null,
      completedAt: completedAt.toISOString(),
      initialRewardAppliedAt: null,
    });
  });
});
