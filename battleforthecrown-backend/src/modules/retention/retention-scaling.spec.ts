import {
  getDailyCardScaling,
  getRewardCapPerResource,
} from './retention-scaling';

describe('daily card scaling', () => {
  it('scales tasks and rewards by max castle band', () => {
    const early = getDailyCardScaling(1);
    const late = getDailyCardScaling(8);

    expect(early.reward.wood).toBeLessThan(late.reward.wood);
    expect(early.tasks).not.toEqual(late.tasks);
    expect(
      late.tasks.find((task) => task.type === 'RAID_BARBARIAN'),
    ).toMatchObject({
      target: 1,
      metadata: { minTargetTier: 'T4' },
    });
  });

  it('caps the total daily resource reward at 12% of the band gross production', () => {
    for (let castleLevel = 1; castleLevel <= 10; castleLevel += 1) {
      const scaling = getDailyCardScaling(castleLevel);
      const cap = getRewardCapPerResource(castleLevel);

      expect(scaling.reward.wood).toBeLessThanOrEqual(cap);
      expect(scaling.reward.stone).toBeLessThanOrEqual(cap);
      expect(scaling.reward.iron).toBeLessThanOrEqual(cap);
    }
  });

  it('keeps construction targets completable within one daily session', () => {
    for (let castleLevel = 1; castleLevel <= 10; castleLevel += 1) {
      const construction = getDailyCardScaling(castleLevel).tasks.find(
        (task) => task.type === 'COMPLETE_BUILDING',
      );

      expect(construction).toMatchObject({ target: 1 });
    }
  });
});
