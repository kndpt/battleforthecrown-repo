import { describe, expect, it } from 'vitest';
import type { CaravanReportResponse } from '@battleforthecrown/shared/combat';
import {
  caravanReportPreview,
  caravanReportResourceSections,
  caravanReportResourceTotal,
  caravanReportStateLabel,
  caravanReportSubject,
  caravanReportTypeLabel,
  caravanReportVillageLabel,
} from './caravanReportView';

function makeReport(overrides: Partial<CaravanReportResponse>): CaravanReportResponse {
  return {
    id: 'caravan-report-1',
    worldId: 'world-1',
    expeditionId: 'expedition-1',
    type: 'ARRIVED',
    originVillageId: 'origin-1',
    originVillageName: 'Aubefer',
    originX: 3,
    originY: 7,
    targetVillageId: 'target-1',
    targetVillageName: 'Hauterive',
    targetX: 10,
    targetY: 20,
    resources: { iron: 5, stone: 20, wood: 100 },
    credited: { iron: 5, stone: 20, wood: 90 },
    returned: { iron: 0, stone: 0, wood: 0 },
    lost: { iron: 0, stone: 0, wood: 10 },
    porters: 2,
    recalled: false,
    timestamp: '2026-06-10T10:00:00.000Z',
    isRead: false,
    ...overrides,
  };
}

describe('caravanReportView', () => {
  it('labels arrived and returned reports without combat wording', () => {
    expect(caravanReportTypeLabel('ARRIVED')).toBe('Caravane arrivée');
    expect(caravanReportTypeLabel('RETURNED')).toBe('Caravane rappelée');
    expect(caravanReportStateLabel(makeReport({ type: 'ARRIVED' }))).toBe('Livraison arrivée');
    expect(caravanReportStateLabel(makeReport({ type: 'RETURNED', recalled: true }))).toBe('Retour rappelé');
  });

  it('uses village names first and coordinate fallback', () => {
    expect(caravanReportVillageLabel({ name: 'Aubefer', x: 3, y: 7 })).toBe('Aubefer');
    expect(caravanReportVillageLabel({ name: null, x: 10, y: 20 })).toBe('Village 10|20');
  });

  it('builds arrived preview and sections with credited and lost resources', () => {
    const report = makeReport({});

    expect(caravanReportResourceTotal(report.resources)).toBe(125);
    expect(caravanReportSubject(report)).toBe('Caravane arrivée · Hauterive');
    expect(caravanReportPreview(report)).toBe('115 ressources · Aubefer vers Hauterive');
    expect(caravanReportResourceSections(report).map((section) => section.id)).toEqual([
      'resources',
      'credited',
      'lost',
    ]);
  });

  it('builds recalled return direction with restored resources', () => {
    const report = makeReport({
      type: 'RETURNED',
      credited: { iron: 0, stone: 0, wood: 0 },
      returned: { iron: 5, stone: 20, wood: 100 },
      lost: { iron: 0, stone: 0, wood: 0 },
      recalled: true,
    });

    expect(caravanReportSubject(report)).toBe('Caravane rappelée · Aubefer');
    expect(caravanReportPreview(report)).toBe('125 ressources · Hauterive vers Aubefer');
    expect(caravanReportResourceSections(report).map((section) => section.id)).toEqual([
      'resources',
      'returned',
    ]);
  });
});
