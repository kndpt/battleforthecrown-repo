import { describe, expect, it } from 'vitest';
import type { ScoutReportDto } from '@/api/queries';
import {
  buildScoutReportCardProps,
  scoutReportResourceTotal,
  scoutReportStrategyLabel,
  scoutReportTargetLabel,
  scoutReportTitle,
  scoutReportUnitTotal,
} from './scoutReportView';

const report: ScoutReportDto = {
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
    const wounded: ScoutReportDto = {
      ...report,
      details: { scoutLosses: { SPY: 7 }, scoutUnits: { SPY: 20 }, wallLevel: 6 },
    };
    const props = buildScoutReportCardProps(wounded, undefined, false);
    expect(props.sections[0].items[0]).toEqual(
      expect.objectContaining({ label: 'Espion', troopBar: { sent: 20, lost: 7 } }),
    );
  });

  it('exposes scout losses through the troopBar payload (wiped)', () => {
    const wiped: ScoutReportDto = {
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
    const barbarianReport: ScoutReportDto = {
      ...report,
      targetKind: 'BARBARIAN_VILLAGE',
      targetName: null,
      targetTier: 'T2',
    };

    expect(scoutReportTargetLabel(barbarianReport)).toBe('Village barbare T2');
    expect(buildScoutReportCardProps(barbarianReport, undefined, false).sections).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Style stratégique' })]),
    );
  });
});
