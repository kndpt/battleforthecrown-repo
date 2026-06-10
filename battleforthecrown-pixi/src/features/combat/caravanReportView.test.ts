import { describe, expect, it } from 'vitest';
import type { CaravanReportResponse } from '@battleforthecrown/shared/combat';
import {
  caravanReportPreview,
  caravanReportResourceTotal,
  caravanReportStateLabel,
  caravanReportSubject,
  caravanReportSummary,
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
    expect(caravanReportStateLabel(makeReport({ type: 'ARRIVED', lost: { iron: 0, stone: 0, wood: 0 } }))).toBe('Livraison réussie');
    expect(caravanReportStateLabel(makeReport({ type: 'ARRIVED' }))).toBe('Livraison partielle');
    expect(caravanReportStateLabel(makeReport({ type: 'RETURNED', recalled: true }))).toBe('Caravane rentrée');
  });

  it('uses village names first and coordinate fallback', () => {
    expect(caravanReportVillageLabel({ name: 'Aubefer', x: 3, y: 7 })).toBe('Aubefer');
    expect(caravanReportVillageLabel({ name: null, x: 10, y: 20 })).toBe('Village 10|20');
  });

  it('builds arrived preview and one clear resource summary', () => {
    const report = makeReport({});
    const summary = caravanReportSummary(report);

    expect(caravanReportResourceTotal(report.resources)).toBe(125);
    expect(caravanReportSubject(report)).toBe('Entrepôt plein');
    expect(caravanReportPreview(report)).toBe('115 livré · 10 perdues · Aubefer vers Hauterive');
    expect(summary).toMatchObject({
      body: "115 ressources ont été livrées. 10 n'ont pas pu entrer dans l'Entrepôt.",
      lostTotal: 10,
      primaryLabel: 'Livré',
      primaryTotal: 115,
      sentTotal: 125,
      title: 'Entrepôt plein',
    });
    expect(summary.resources.map((resource) => resource.primaryLabel)).toEqual([
      'Livré',
      'Livré',
      'Livré',
    ]);
  });

  it('uses a readable preview when the warehouse accepts nothing', () => {
    const report = makeReport({
      resources: { iron: 0, stone: 3_500, wood: 0 },
      credited: { iron: 0, stone: 0, wood: 0 },
      lost: { iron: 0, stone: 3_500, wood: 0 },
    });

    expect(caravanReportPreview(report)).toBe('Aucune ressource livrée · 3 500 perdues · Aubefer vers Hauterive');
  });

  it('builds recalled return direction with restored resources', () => {
    const report = makeReport({
      type: 'RETURNED',
      credited: { iron: 0, stone: 0, wood: 0 },
      returned: { iron: 5, stone: 20, wood: 100 },
      lost: { iron: 0, stone: 0, wood: 0 },
      recalled: true,
    });

    expect(caravanReportSubject(report)).toBe('Retour complet');
    expect(caravanReportPreview(report)).toBe('125 récupéré · Hauterive vers Aubefer');
    expect(caravanReportSummary(report)).toMatchObject({
      body: "125 ressources sont revenues au village d'origine.",
      lostTotal: 0,
      primaryLabel: 'Récupéré',
      primaryTotal: 125,
      sentTotal: 125,
      title: 'Retour complet',
    });
  });
});
