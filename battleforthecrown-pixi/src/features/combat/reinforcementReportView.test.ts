import { describe, expect, it } from 'vitest';
import type { ReinforcementReportResponse } from '@battleforthecrown/shared/combat';
import {
  reinforcementReportTypeLabel,
  reinforcementReportUnitTotal,
  reinforcementReportSubject,
  reinforcementReportPreview,
} from './reinforcementReportView';

function makeReport(overrides: Partial<ReinforcementReportResponse>): ReinforcementReportResponse {
  return {
    id: 'rpt-1',
    worldId: 'world-1',
    type: 'STATIONED',
    originVillageId: 'v-origin',
    originVillageName: null,
    originX: 3,
    originY: 7,
    hostVillageId: 'v-host',
    hostVillageName: null,
    hostX: 10,
    hostY: 20,
    units: {},
    actorUserId: 'u-1',
    isRead: false,
    timestamp: '2026-05-31T10:00:00.000Z',
    ...overrides,
  } as ReinforcementReportResponse;
}

describe('reinforcementReportView', () => {
  describe('reinforcementReportTypeLabel', () => {
    it('returns "Arrivé en soutien" for STATIONED', () => {
      expect(reinforcementReportTypeLabel('STATIONED')).toBe('Arrivé en soutien');
    });

    it('returns "Retour au village" for RETURNED', () => {
      expect(reinforcementReportTypeLabel('RETURNED')).toBe('Retour au village');
    });
  });

  describe('reinforcementReportUnitTotal', () => {
    it('sums a mixed unit map correctly', () => {
      const report = makeReport({ units: { MILITIA: 10, ARCHER: 5 } });
      expect(reinforcementReportUnitTotal(report)).toBe(15);
    });

    it('returns 0 for an empty unit map', () => {
      const report = makeReport({ units: {} });
      expect(reinforcementReportUnitTotal(report)).toBe(0);
    });
  });

  describe('reinforcementReportSubject', () => {
    it('STATIONED uses host village name when present', () => {
      const report = makeReport({ type: 'STATIONED', hostVillageName: 'Castleford', hostX: 10, hostY: 20 });
      expect(reinforcementReportSubject(report)).toBe('Renfort · Castleford');
    });

    it('STATIONED falls back to host coords when name is absent', () => {
      const report = makeReport({ type: 'STATIONED', hostVillageName: null, hostX: 10, hostY: 20 });
      expect(reinforcementReportSubject(report)).toBe('Renfort · (10, 20)');
    });

    it('RETURNED uses origin village name when present', () => {
      const report = makeReport({ type: 'RETURNED', originVillageName: 'Ironhold', originX: 3, originY: 7 });
      expect(reinforcementReportSubject(report)).toBe('Retour · Ironhold');
    });

    it('RETURNED falls back to origin coords when name is absent', () => {
      const report = makeReport({ type: 'RETURNED', originVillageName: null, originX: 3, originY: 7 });
      expect(reinforcementReportSubject(report)).toBe('Retour · (3, 7)');
    });
  });

  describe('reinforcementReportPreview', () => {
    it('contains unit total and "de … → …" with names when present', () => {
      const report = makeReport({
        units: { MILITIA: 10, ARCHER: 5 },
        originVillageName: 'Ironhold',
        hostVillageName: 'Castleford',
      });
      const preview = reinforcementReportPreview(report);
      expect(preview).toContain('15');
      expect(preview).toContain('de Ironhold → Castleford');
    });

    it('falls back to coords when names are absent', () => {
      const report = makeReport({
        units: { MILITIA: 8 },
        originVillageName: null,
        originX: 3,
        originY: 7,
        hostVillageName: null,
        hostX: 10,
        hostY: 20,
      });
      const preview = reinforcementReportPreview(report);
      expect(preview).toContain('8');
      expect(preview).toContain('de (3, 7) → (10, 20)');
    });

    it('uses host to origin direction for returned reports', () => {
      const report = makeReport({
        type: 'RETURNED',
        originVillageName: 'Ironhold',
        hostVillageName: 'Castleford',
        units: { MILITIA: 3 },
      });

      expect(reinforcementReportPreview(report)).toContain(
        'de Castleford → Ironhold',
      );
    });
  });
});
