import { describe, expect, it } from 'vitest';
import type { ScoutReportResponse } from '@battleforthecrown/shared/combat';
import {
  buildScoutReportCardProps,
  getNewbieShieldStatus,
  scoutReportResourceTotal,
  scoutReportStrategyLabel,
  scoutReportTargetLabel,
  scoutReportTitle,
  scoutReportUnitTotal,
} from './scoutReportView';

const report: ScoutReportResponse = {
  id: 'sr1',
  scoutVillageId: 'v1',
  targetVillageId: 'target-1',
  targetKind: 'PLAYER_VILLAGE',
  targetX: 12,
  targetY: 34,
  targetName: 'Roc-d-Acier',
  targetTier: null,
  units: { MILITIA: 12, SPY: 2 },
  resources: { wood: 100, stone: 50, iron: 25 },
  strategy: 'FORTRESS',
  details: { scoutLosses: { SPY: 0 }, scoutUnits: { SPY: 20 }, wallLevel: 6 },
  isRead: false,
  timestamp: '2026-05-12T10:00:00.000Z',
};

describe('scoutReportView', () => {
  it('maps the report snapshot totals and strategy label', () => {
    expect(scoutReportUnitTotal(report)).toBe(14);
    expect(scoutReportResourceTotal(report)).toBe(175);
    expect(scoutReportStrategyLabel(report.strategy)).toBe('Forteresse');
    expect(scoutReportTargetLabel(report)).toBe('Village joueur');
    expect(scoutReportTitle(report)).toBe('Roc-d-Acier');
  });

  it('builds card props from backend scout data without hiding revealed fields', () => {
    const props = buildScoutReportCardProps(report, undefined, false);

    expect(props.metaLabel).toBeUndefined();
    expect(props.verdicts).toEqual([
      expect.objectContaining({ label: 'Pillage estimé', value: '175' }),
      expect.objectContaining({ label: 'Menace · mur', value: 'Niv. 6' }),
    ]);
    expect(props.targetPrefix).toBe('Cible');
    expect(props.villageLabel).toBe('Village joueur · 12|34');
    expect(props.sections[0]).toEqual(
      expect.objectContaining({
        title: 'Espions',
        items: [expect.objectContaining({ label: 'Espion', troopBar: { sent: 20, lost: 0 } })],
      }),
    );
  });

  it('exposes scout losses through the troopBar payload (partial losses)', () => {
    const wounded: ScoutReportResponse = {
      ...report,
      details: { scoutLosses: { SPY: 7 }, scoutUnits: { SPY: 20 }, wallLevel: 6 },
    };
    const props = buildScoutReportCardProps(wounded, undefined, false);
    expect(props.sections[0].items[0]).toEqual(
      expect.objectContaining({ label: 'Espion', troopBar: { sent: 20, lost: 7 } }),
    );
  });

  it('exposes scout losses through the troopBar payload (wiped)', () => {
    const wiped: ScoutReportResponse = {
      ...report,
      details: { scoutLosses: { SPY: 20 }, scoutUnits: { SPY: 20 }, wallLevel: 6 },
    };
    const props = buildScoutReportCardProps(wiped, undefined, false);
    expect(props.sections[0].items[0]).toEqual(
      expect.objectContaining({ label: 'Espion', troopBar: { sent: 20, lost: 20 } }),
    );
    expect(props.sections[1].items).toEqual([
      expect.objectContaining({ label: 'Milice de paysans', value: '12' }),
      expect.objectContaining({ label: 'Espion', value: '2' }),
    ]);
    expect(props.sections[3].items[0]).toEqual(
      expect.objectContaining({ label: 'Style', value: 'Forteresse' }),
    );
  });

  it('keeps barbarian tier visible in the target label', () => {
    const barbarianReport: ScoutReportResponse = {
      ...report,
      targetKind: 'BARBARIAN_VILLAGE',
      targetName: null,
      targetTier: 'T2',
    };

    expect(scoutReportTargetLabel(barbarianReport)).toBe('Village barbare T2');
    const barbarianSections = buildScoutReportCardProps(
      barbarianReport,
      undefined,
      false,
    ).sections;
    expect(barbarianSections).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Style stratégique' })]),
    );
    expect(barbarianSections).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Fenêtre de capture' })]),
    );
  });

  it('derives the PvP capture window from the scouted castle level', () => {
    const withCastle: ScoutReportResponse = {
      ...report,
      details: { ...report.details, castleLevel: 6 },
    };
    expect(
      buildScoutReportCardProps(withCastle, undefined, false).sections,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Fenêtre de capture',
          items: [expect.objectContaining({ label: 'Durée', value: '2h15' })],
        }),
      ]),
    );
  });

  it('shows the capture window as Inconnue when the castle level is unknown', () => {
    expect(
      buildScoutReportCardProps(report, undefined, false).sections,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Fenêtre de capture',
          items: [expect.objectContaining({ label: 'Durée', value: 'Inconnue' })],
        }),
      ]),
    );
  });

  describe('newbie shield badge', () => {
    const withShield = (newbieShield: {
      active: boolean;
      endsAt: string | null;
    }): ScoutReportResponse => ({
      ...report,
      details: { ...report.details, newbieShield },
    });

    it('derives an active status with a frozen remaining label (endsAt - scout time)', () => {
      const status = getNewbieShieldStatus(
        withShield({ active: true, endsAt: '2026-05-14T10:00:00.000Z' }),
      );
      expect(status).toEqual({
        active: true,
        endsAt: '2026-05-14T10:00:00.000Z',
        remainingLabel: '48h 00m',
      });
    });

    it('exposes the shield badge on card props when active', () => {
      const props = buildScoutReportCardProps(
        withShield({ active: true, endsAt: '2026-05-14T10:00:00.000Z' }),
        undefined,
        false,
      );
      expect(props.shieldBadge).toEqual({
        label: 'Bouclier débutant',
        remaining: '48h 00m',
      });
    });

    it('drops the remaining label when endsAt already passed at scout time', () => {
      const status = getNewbieShieldStatus(
        withShield({ active: true, endsAt: '2026-05-10T10:00:00.000Z' }),
      );
      expect(status).toEqual({
        active: true,
        endsAt: '2026-05-10T10:00:00.000Z',
        remainingLabel: null,
      });
    });

    it('hides the badge when the shield was inactive at scout time', () => {
      const inactive = withShield({ active: false, endsAt: null });
      expect(getNewbieShieldStatus(inactive)).toEqual({
        active: false,
        endsAt: null,
        remainingLabel: null,
      });
      expect(
        buildScoutReportCardProps(inactive, undefined, false).shieldBadge,
      ).toBeUndefined();
    });

    it('returns null status and no badge when the shield field is absent', () => {
      expect(getNewbieShieldStatus(report)).toBeNull();
      expect(
        buildScoutReportCardProps(report, undefined, false).shieldBadge,
      ).toBeUndefined();
    });

    it('returns null status for a barbarian target (no shield field)', () => {
      const barbarianReport: ScoutReportResponse = {
        ...report,
        targetKind: 'BARBARIAN_VILLAGE',
        targetTier: 'T2',
        details: { wallLevel: 0 },
      };
      expect(getNewbieShieldStatus(barbarianReport)).toBeNull();
      expect(
        buildScoutReportCardProps(barbarianReport, undefined, false).shieldBadge,
      ).toBeUndefined();
    });
  });

  describe('defensive friends section', () => {
    function sectionTitled(report: ScoutReportResponse, title: string) {
      return buildScoutReportCardProps(report, undefined, false).sections.find(
        (section) => section.title === title,
      );
    }

    it('renders the revealed friends as a compact section', () => {
      const withFriends: ScoutReportResponse = {
        ...report,
        details: { ...report.details, defensiveFriendsDisplayNames: ['Arthur', 'Lancelot'] },
      };
      const section = sectionTitled(withFriends, 'Amis défensifs');
      expect(section).toEqual(
        expect.objectContaining({
          title: 'Amis défensifs',
          items: [
            expect.objectContaining({ label: '2 amis', value: 'Arthur, Lancelot' }),
          ],
        }),
      );
    });

    it('singularizes the label for a lone friend', () => {
      const withFriend: ScoutReportResponse = {
        ...report,
        details: { ...report.details, defensiveFriendsDisplayNames: ['Arthur'] },
      };
      expect(sectionTitled(withFriend, 'Amis défensifs')?.items[0]).toEqual(
        expect.objectContaining({ label: '1 ami', value: 'Arthur' }),
      );
    });

    it('omits the section when the field is absent or empty', () => {
      expect(sectionTitled(report, 'Amis défensifs')).toBeUndefined();
      const empty: ScoutReportResponse = {
        ...report,
        details: { ...report.details, defensiveFriendsDisplayNames: [] },
      };
      expect(sectionTitled(empty, 'Amis défensifs')).toBeUndefined();
    });

    it('never renders for a barbarian target', () => {
      const barbarianWithFriends: ScoutReportResponse = {
        ...report,
        targetKind: 'BARBARIAN_VILLAGE',
        targetTier: 'T2',
        details: { wallLevel: 0, defensiveFriendsDisplayNames: ['Ghost'] },
      };
      expect(sectionTitled(barbarianWithFriends, 'Amis défensifs')).toBeUndefined();
    });
  });
});
