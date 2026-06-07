import { presentCombatReport } from './combat-report.presenter';

const baseReport = {
  id: 'report-1',
  attackerUserId: 'attacker-1',
  targetKind: 'BARBARIAN_VILLAGE',
  loot: {
    resources: { wood: 10, stone: 20, iron: 30 },
    remainingResources: { wood: 40, stone: 50, iron: 60 },
  },
  totalUnitsAttacker: { MILITIA: 10 },
  totalUnitsDefender: { MILITIA: 5 },
  lossesAttacker: { MILITIA: 10 },
  lossesDefender: { MILITIA: 1 },
  details: {
    targetTier: 'T2',
    distance: 4,
    travelTime: 1000,
  },
};

describe('presentCombatReport', () => {
  it('hides barbarian defender and resource details after attacker defeat', () => {
    expect(presentCombatReport(baseReport, 'attacker-1')).toEqual({
      ...baseReport,
      isAttacker: true,
      isRead: false,
      recipientRole: 'attacker',
      loot: {},
      totalUnitsDefender: {},
      lossesDefender: {},
      details: { targetTier: 'T2' },
    });
  });

  it('keeps full barbarian report details when at least one attacker survives', () => {
    const report = {
      ...baseReport,
      lossesAttacker: { MILITIA: 9 },
    };

    expect(presentCombatReport(report, 'attacker-1')).toEqual({
      ...report,
      isAttacker: true,
      isRead: false,
      recipientRole: 'attacker',
    });
  });

  it('does not hide non-attacker reports', () => {
    expect(presentCombatReport(baseReport, 'other-user')).toEqual({
      ...baseReport,
      isAttacker: false,
      isRead: false,
      recipientRole: null,
    });
  });

  it('presents self-attacks against an occupied capture as defense reports', () => {
    const report = {
      ...baseReport,
      defenderUserId: 'attacker-1',
      details: {
        ...baseReport.details,
        occupationDefense: {
          attackerVillageId: 'origin-village',
          defenderUserId: 'attacker-1',
        },
      },
    };

    expect(presentCombatReport(report, 'attacker-1')).toEqual({
      ...report,
      isAttacker: false,
      isRead: false,
      recipientRole: 'defender',
    });
  });

  it('projects observer read state independently', () => {
    const report = {
      ...baseReport,
      defenderUserId: 'defender-1',
      observerUserId: 'observer-1',
      readByObserver: true,
    };

    expect(presentCombatReport(report, 'observer-1')).toEqual(
      expect.objectContaining({
        isAttacker: false,
        isRead: true,
        recipientRole: 'observer',
      }),
    );
  });

  it('projects read state for the requesting participant only', () => {
    const report = {
      ...baseReport,
      defenderUserId: 'defender-1',
      readByAttacker: true,
      readByDefender: false,
      lossesAttacker: { MILITIA: 9 },
    };

    expect(presentCombatReport(report, 'attacker-1').isRead).toBe(true);
    expect(presentCombatReport(report, 'defender-1').isRead).toBe(false);
  });
});
