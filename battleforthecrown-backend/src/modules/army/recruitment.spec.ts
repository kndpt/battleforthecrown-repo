import { canRecruitNoble } from '@battleforthecrown/shared/army';

const base = {
  garrisonNobleCount: 0,
  hasNobleInQueue: false,
  nobleInFlightCount: 0,
  nobleOccupyingCount: 0,
} as const;

describe('canRecruitNoble — pure logic (run 006 + 097, cap 1/village spec 10)', () => {
  it('autorise quand aucun Seigneur nulle part', () => {
    expect(canRecruitNoble({ ...base })).toEqual({ allowed: true });
  });

  it('refuse si Seigneur déjà en garnison (priorité GARRISON_FULL)', () => {
    expect(canRecruitNoble({ ...base, garrisonNobleCount: 1 })).toEqual({
      allowed: false,
      reason: 'GARRISON_FULL',
    });
  });

  it('refuse si Seigneur déjà en file Trône', () => {
    expect(canRecruitNoble({ ...base, hasNobleInQueue: true })).toEqual({
      allowed: false,
      reason: 'QUEUE_FULL',
    });
  });

  it('refuse si Seigneur en vol/retour (IN_FLIGHT)', () => {
    expect(canRecruitNoble({ ...base, nobleInFlightCount: 1 })).toEqual({
      allowed: false,
      reason: 'IN_FLIGHT',
    });
  });

  it('refuse si Seigneur en occupation (OCCUPYING)', () => {
    expect(canRecruitNoble({ ...base, nobleOccupyingCount: 1 })).toEqual({
      allowed: false,
      reason: 'OCCUPYING',
    });
  });

  it('priorité GARRISON_FULL > QUEUE_FULL > IN_FLIGHT > OCCUPYING', () => {
    expect(
      canRecruitNoble({
        garrisonNobleCount: 1,
        hasNobleInQueue: true,
        nobleInFlightCount: 1,
        nobleOccupyingCount: 1,
      }),
    ).toEqual({ allowed: false, reason: 'GARRISON_FULL' });

    expect(
      canRecruitNoble({
        garrisonNobleCount: 0,
        hasNobleInQueue: true,
        nobleInFlightCount: 1,
        nobleOccupyingCount: 1,
      }),
    ).toEqual({ allowed: false, reason: 'QUEUE_FULL' });

    expect(
      canRecruitNoble({
        garrisonNobleCount: 0,
        hasNobleInQueue: false,
        nobleInFlightCount: 1,
        nobleOccupyingCount: 1,
      }),
    ).toEqual({ allowed: false, reason: 'IN_FLIGHT' });
  });
});
