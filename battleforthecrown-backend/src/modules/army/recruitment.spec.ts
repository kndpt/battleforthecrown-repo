import { canRecruitNoble } from '@battleforthecrown/shared/army';

describe('canRecruitNoble — pure logic (run 006, cap 1/village spec 10)', () => {
  it('autorise quand garrison vide et file vide', () => {
    expect(canRecruitNoble({ garrisonNobleCount: 0, hasNobleInQueue: false })).toEqual({
      allowed: true,
    });
  });

  it('refuse si Seigneur déjà en garnison (priorité GARRISON_FULL)', () => {
    expect(canRecruitNoble({ garrisonNobleCount: 1, hasNobleInQueue: false })).toEqual({
      allowed: false,
      reason: 'GARRISON_FULL',
    });
  });

  it('refuse si Seigneur déjà en file Trône', () => {
    expect(canRecruitNoble({ garrisonNobleCount: 0, hasNobleInQueue: true })).toEqual({
      allowed: false,
      reason: 'QUEUE_FULL',
    });
  });

  it('refuse avec reason GARRISON_FULL prioritaire si les deux sont occupés', () => {
    expect(canRecruitNoble({ garrisonNobleCount: 1, hasNobleInQueue: true })).toEqual({
      allowed: false,
      reason: 'GARRISON_FULL',
    });
  });
});
