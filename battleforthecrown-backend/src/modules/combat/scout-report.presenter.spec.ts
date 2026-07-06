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
  // 10 espions → palier PRECISE (parité historique : compo/stock/style exacts).
  details: { scoutUnits: { SPY: 10 } },
  isRead: false,
  timestamp: new Date('2026-06-07T10:00:00.000Z'),
};

describe('presentScoutReport', () => {
  it('maps all fields exactly at the PRECISE tier and serializes timestamp', () => {
    expect(presentScoutReport(baseReport)).toEqual({
      id: 'scout-report-1',
      scoutVillageId: 'village-scout',
      targetVillageId: 'village-target',
      targetKind: 'PLAYER_VILLAGE',
      targetX: 12,
      targetY: 34,
      targetName: 'Fortress',
      targetTier: null,
      precision: 'PRECISE',
      units: { MILITIA: 8, SPY: 3 },
      resources: { wood: 200, stone: 100, iron: 50 },
      strategy: 'AGGRESSIVE',
      details: { scoutUnits: { SPY: 10 } },
      isRead: false,
      timestamp: '2026-06-07T10:00:00.000Z',
    });
  });

  describe('precision scales with spy count (run 090)', () => {
    it('VAGUE (1 spy): withholds exact composition, stock and strategy', () => {
      const result = presentScoutReport({
        ...baseReport,
        details: { scoutUnits: { SPY: 1 } },
      });
      expect(result.precision).toBe('VAGUE');
      expect(result.units).toBeNull();
      expect(result.resources).toBeNull();
      expect(result.strategy).toBeNull();
      expect(result.unitRanges).toBeUndefined();
      // total army 11 (8+3) → LOW ; total stock 350 → LOW.
      expect(result.armyBand).toBe('LOW');
      expect(result.resourceBand).toBe('LOW');
    });

    it('RANGED (3 spies): exposes deterministic ranges, not exact values', () => {
      const result = presentScoutReport({
        ...baseReport,
        details: { scoutUnits: { SPY: 3 } },
      });
      expect(result.precision).toBe('RANGED');
      expect(result.units).toBeNull();
      expect(result.resources).toBeNull();
      // MILITIA 8 → step 5 → [5,10] ; SPY 3 → [0,5].
      expect(result.unitRanges).toEqual({
        MILITIA: { min: 5, max: 10 },
        SPY: { min: 0, max: 5 },
      });
      // wood 200 → step 250 → [0,250] ; stone 100 → [0,250] ; iron 50 → step 50 → [50,100].
      expect(result.resourceRanges).toEqual({
        wood: { min: 0, max: 250 },
        stone: { min: 0, max: 250 },
        iron: { min: 50, max: 100 },
      });
      // Style revealed from RANGED upward.
      expect(result.strategy).toBe('AGGRESSIVE');
      expect(result.armyBand).toBeUndefined();
    });

    it('falls back to VAGUE (no crash) when scoutUnits is absent from details', () => {
      const result = presentScoutReport({
        ...baseReport,
        details: { wallLevel: 3 },
      });
      expect(result.precision).toBe('VAGUE');
      expect(result.units).toBeNull();
      expect(result.resources).toBeNull();
    });

    it('never crashes on a corrupted scoutUnits payload (falls back to VAGUE)', () => {
      // Non-enum key, float and negative counts would throw the strict codec —
      // the presenter must stay defensive like every other details extractor.
      const corrupted = presentScoutReport({
        ...baseReport,
        details: { scoutUnits: { NOT_A_UNIT: 5, SPY: -3, MILITIA: 2.5 } },
      });
      expect(corrupted.precision).toBe('VAGUE');
      expect(corrupted.units).toBeNull();
      // Le scoutUnits corrompu n'est pas réémis brut (sinon le .parse() client
      // échouerait → rapport legacy illisible). Il est omis des details.
      expect(corrupted.details?.scoutUnits).toBeUndefined();
    });

    it('blurs legacy reports retroactively from their scoutUnits count', () => {
      // An old persisted report scouted with a single spy → still blurred.
      const legacy = presentScoutReport({
        ...baseReport,
        details: { scoutUnits: { SPY: 2 }, wallLevel: 4 },
      });
      expect(legacy.precision).toBe('VAGUE');
      expect(legacy.units).toBeNull();
      // wallLevel stays exact (structural) and survives in details.
      expect(legacy.details).toEqual(expect.objectContaining({ wallLevel: 4 }));
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
        details: { inactivity: { state: 'INACTIVE', sinceDays: -1 } },
      }).details,
    ).toEqual({});
    expect(
      presentScoutReport({
        ...baseReport,
        details: { inactivity: { state: 'INACTIVE', sinceDays: 2.5 } },
      }).details,
    ).toEqual({});
    expect(
      presentScoutReport({
        ...baseReport,
        details: { inactivity: 'not-an-object' },
      }).details,
    ).toEqual({});
  });

  it('includes naturalTrait when a valid trait is present in details', () => {
    const report = { ...baseReport, details: { naturalTrait: 'IRON_VEIN' } };
    expect(presentScoutReport(report).details).toEqual({
      naturalTrait: 'IRON_VEIN',
    });
  });

  it('omits naturalTrait when the value is not a known trait', () => {
    expect(
      presentScoutReport({
        ...baseReport,
        details: { naturalTrait: 'MOUNTAIN' },
      }).details,
    ).toEqual({});
    expect(
      presentScoutReport({
        ...baseReport,
        details: { naturalTrait: 42 },
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
