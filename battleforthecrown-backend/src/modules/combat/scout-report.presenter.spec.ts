import { presentScoutReport } from './scout-report.presenter';

type ScoutReportInput = Parameters<typeof presentScoutReport>[0];

const baseReport: ScoutReportInput = {
  id: 'scout-report-1',
  scoutVillageId: 'village-scout',
  targetVillageId: 'village-target',
  targetKind: 'PLAYER_VILLAGE',
  targetX: 12,
  targetY: 34,
  targetName: 'Fortress',
  targetTier: null,
  units: { MILITIA: 8, SPY: 3 },
  resources: { wood: 200, stone: 100, iron: 50 },
  strategy: 'AGGRESSIVE',
  details: null,
  isRead: false,
  timestamp: new Date('2026-06-07T10:00:00.000Z'),
};

describe('presentScoutReport', () => {
  it('maps all fields and serializes timestamp to ISO string', () => {
    expect(presentScoutReport(baseReport)).toEqual({
      id: 'scout-report-1',
      scoutVillageId: 'village-scout',
      targetVillageId: 'village-target',
      targetKind: 'PLAYER_VILLAGE',
      targetX: 12,
      targetY: 34,
      targetName: 'Fortress',
      targetTier: null,
      units: { MILITIA: 8, SPY: 3 },
      resources: { wood: 200, stone: 100, iron: 50 },
      strategy: 'AGGRESSIVE',
      details: undefined,
      isRead: false,
      timestamp: '2026-06-07T10:00:00.000Z',
    });
  });

  it('converts null targetVillageId to undefined', () => {
    const report = { ...baseReport, targetVillageId: null };
    expect(presentScoutReport(report).targetVillageId).toBeUndefined();
  });

  it('returns undefined details when details is null', () => {
    expect(
      presentScoutReport({ ...baseReport, details: null }).details,
    ).toBeUndefined();
  });

  it('returns undefined details when details is not an object', () => {
    expect(
      presentScoutReport({ ...baseReport, details: 'string-value' }).details,
    ).toBeUndefined();
    expect(
      presentScoutReport({ ...baseReport, details: 42 }).details,
    ).toBeUndefined();
  });

  it('includes wallLevel when present in details', () => {
    const report = { ...baseReport, details: { wallLevel: 5 } };
    expect(presentScoutReport(report).details).toEqual({ wallLevel: 5 });
  });

  it('includes scoutLosses when present in details', () => {
    const report = { ...baseReport, details: { scoutLosses: { SPY: 2 } } };
    expect(presentScoutReport(report).details).toEqual({
      scoutLosses: { SPY: 2 },
    });
  });

  it('includes scoutUnits when present in details', () => {
    const report = { ...baseReport, details: { scoutUnits: { SPY: 3 } } };
    expect(presentScoutReport(report).details).toEqual({
      scoutUnits: { SPY: 3 },
    });
  });

  it('includes castleLevel when present in details', () => {
    const report = { ...baseReport, details: { castleLevel: 6 } };
    expect(presentScoutReport(report).details).toEqual({ castleLevel: 6 });
  });

  it('omits castleLevel when it is not a number', () => {
    const report = { ...baseReport, details: { castleLevel: 'six' } };
    expect(presentScoutReport(report).details).toEqual({});
  });

  it('includes all detail fields when all are present', () => {
    const report = {
      ...baseReport,
      details: {
        scoutLosses: { SPY: 1 },
        scoutUnits: { SPY: 3 },
        wallLevel: 7,
        castleLevel: 8,
      },
    };
    expect(presentScoutReport(report).details).toEqual({
      scoutLosses: { SPY: 1 },
      scoutUnits: { SPY: 3 },
      wallLevel: 7,
      castleLevel: 8,
    });
  });

  it('omits detail fields that are not objects or numbers', () => {
    const report = {
      ...baseReport,
      details: {
        scoutLosses: 'not-an-object',
        scoutUnits: null,
        wallLevel: 'not-a-number',
      },
    };
    expect(presentScoutReport(report).details).toEqual({});
  });

  it('includes newbieShield (active) when present in details', () => {
    const report = {
      ...baseReport,
      details: {
        newbieShield: { active: true, endsAt: '2026-06-09T10:00:00.000Z' },
      },
    };
    expect(presentScoutReport(report).details).toEqual({
      newbieShield: { active: true, endsAt: '2026-06-09T10:00:00.000Z' },
    });
  });

  it('includes newbieShield (inactive) and normalizes a missing endsAt to null', () => {
    const report = {
      ...baseReport,
      details: { newbieShield: { active: false } },
    };
    expect(presentScoutReport(report).details).toEqual({
      newbieShield: { active: false, endsAt: null },
    });
  });

  it('omits newbieShield when active is not a boolean or shape is invalid', () => {
    expect(
      presentScoutReport({
        ...baseReport,
        details: { newbieShield: { active: 'yes', endsAt: 'x' } },
      }).details,
    ).toEqual({});
    expect(
      presentScoutReport({
        ...baseReport,
        details: { newbieShield: 'not-an-object' },
      }).details,
    ).toEqual({});
  });

  it('keeps only string names in defensiveFriendsDisplayNames', () => {
    const report = {
      ...baseReport,
      details: { defensiveFriendsDisplayNames: ['Alice', 42, null, 'Bob'] },
    };
    expect(presentScoutReport(report).details).toEqual({
      defensiveFriendsDisplayNames: ['Alice', 'Bob'],
    });
  });

  it('omits defensiveFriendsDisplayNames when the value is not an array', () => {
    const report = {
      ...baseReport,
      details: { defensiveFriendsDisplayNames: 'Alice' },
    };
    expect(presentScoutReport(report).details).toEqual({});
  });

  it('omits defensiveFriendsDisplayNames when no string names remain', () => {
    const report = {
      ...baseReport,
      details: { defensiveFriendsDisplayNames: [1, 2, null] },
    };
    expect(presentScoutReport(report).details).toEqual({});
  });

  it('includes inactivity when the owner was INACTIVE at scout time', () => {
    const report = {
      ...baseReport,
      details: { inactivity: { state: 'INACTIVE', sinceDays: 9 } },
    };
    expect(presentScoutReport(report).details).toEqual({
      inactivity: { state: 'INACTIVE', sinceDays: 9 },
    });
  });

  it('omits inactivity when the state is not INACTIVE or sinceDays is invalid', () => {
    expect(
      presentScoutReport({
        ...baseReport,
        details: { inactivity: { state: 'ACTIVE', sinceDays: 0 } },
      }).details,
    ).toEqual({});
    expect(
      presentScoutReport({
        ...baseReport,
        details: { inactivity: { state: 'INACTIVE', sinceDays: 'nope' } },
      }).details,
    ).toEqual({});
    expect(
      presentScoutReport({
        ...baseReport,
        details: { inactivity: 'not-an-object' },
      }).details,
    ).toEqual({});
  });

  it('defaults empty persisted resources to zeroes', () => {
    expect(
      presentScoutReport({ ...baseReport, resources: {} }).resources,
    ).toEqual({
      wood: 0,
      stone: 0,
      iron: 0,
    });
  });

  it('marks a barbarian scout report with null targetVillageId and targetTier', () => {
    const report: ScoutReportInput = {
      ...baseReport,
      targetVillageId: null,
      targetKind: 'BARBARIAN_VILLAGE',
      targetTier: 'T3',
      strategy: null,
    };
    const result = presentScoutReport(report);
    expect(result.targetVillageId).toBeUndefined();
    expect(result.targetTier).toBe('T3');
    expect(result.strategy).toBeNull();
  });
});
