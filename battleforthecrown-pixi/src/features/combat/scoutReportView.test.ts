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

    expect(props.metaLabel).toBe('Nouveau');
    expect(props.verdicts.map((verdict) => verdict.value)).toEqual(['14', '175']);
    expect(props.sections[0].items).toEqual([
      expect.objectContaining({ label: 'Milice de paysans', value: '12' }),
      expect.objectContaining({ label: 'Espion', value: '2' }),
    ]);
    expect(props.sections[2].items[0]).toEqual(
      expect.objectContaining({ label: 'Style', value: 'Forteresse' }),
    );
  });

  it('keeps barbarian tier visible in the target label', () => {
    expect(
      scoutReportTargetLabel({
        ...report,
        targetKind: 'BARBARIAN_VILLAGE',
        targetName: null,
        targetTier: 'T2',
      }),
    ).toBe('Village barbare T2');
  });
});
