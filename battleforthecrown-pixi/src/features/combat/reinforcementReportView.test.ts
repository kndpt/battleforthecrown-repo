import { describe, expect, it } from 'vitest';
import type { ReinforcementReportResponse } from '@battleforthecrown/shared/combat';
import {
  buildReinforcementReportModalProps,
  reinforcementReportUnits,
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
    it('returns "Soutien arrivé" for STATIONED', () => {
      expect(reinforcementReportTypeLabel('STATIONED')).toBe('Soutien arrivé');
    });

    it('returns "Troupes rentrées" for RETURNED', () => {
      expect(reinforcementReportTypeLabel('RETURNED')).toBe('Troupes rentrées');
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
      expect(reinforcementReportSubject(report)).toBe('Soutien arrivé · Castleford');
    });

    it('STATIONED falls back to host coords when name is absent', () => {
      const report = makeReport({ type: 'STATIONED', hostVillageName: null, hostX: 10, hostY: 20 });
      expect(reinforcementReportSubject(report)).toBe('Soutien arrivé · Village 10|20');
    });

    it('RETURNED uses origin village name when present', () => {
      const report = makeReport({ type: 'RETURNED', originVillageName: 'Ironhold', originX: 3, originY: 7 });
      expect(reinforcementReportSubject(report)).toBe('Retour de renfort · Ironhold');
    });

    it('RETURNED falls back to origin coords when name is absent', () => {
      const report = makeReport({ type: 'RETURNED', originVillageName: null, originX: 3, originY: 7 });
      expect(reinforcementReportSubject(report)).toBe('Retour de renfort · Village 3|7');
    });
  });

  describe('reinforcementReportPreview', () => {
    it('contains localized total and route with names when present', () => {
      const report = makeReport({
        units: { MILITIA: 10, ARCHER: 5 },
        originVillageName: 'Ironhold',
        hostVillageName: 'Castleford',
      });
      const preview = reinforcementReportPreview(report);
      expect(preview).toContain('15 troupes');
      expect(preview).toContain('Ironhold vers Castleford');
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
      expect(preview).toContain('8 troupes');
      expect(preview).toContain('Village 3|7 vers Village 10|20');
    });

    it('uses host to origin direction for returned reports', () => {
      const report = makeReport({
        type: 'RETURNED',
        originVillageName: 'Ironhold',
        hostVillageName: 'Castleford',
        units: { MILITIA: 3 },
      });

      expect(reinforcementReportPreview(report)).toContain(
        'Castleford vers Ironhold',
      );
    });
  });

  describe('reinforcementReportUnits', () => {
    it('uses canonical unit labels and assets', () => {
      const report = makeReport({ units: { SQUIRE: 14 } });

      expect(reinforcementReportUnits(report)).toEqual([
        { icon: '/assets/army/squire.png', label: 'Écuyers', quantity: '14' },
      ]);
    });
  });

  describe('buildReinforcementReportModalProps', () => {
    it('builds a stationed report as a green support movement', () => {
      const report = makeReport({
        id: 'reinforcement-report-1',
        originVillageName: 'Ruined Fort',
        hostVillageName: 'Royaume de airstyle59',
        units: { SQUIRE: 14 },
      });

      expect(buildReinforcementReportModalProps(report, [])).toMatchObject({
        banner: 'SOUTIEN ARRIVÉ',
        destination: {
          coord: '10|20',
          icon: '/assets/defense.png',
          label: 'Garnison',
          name: 'Royaume de airstyle59',
        },
        heroIcon: '/assets/defense.png',
        origin: {
          coord: '3|7',
          icon: '/assets/position.png',
          label: 'Départ',
          name: 'Ruined Fort',
        },
        reportId: '#REINFO',
        roleLabel: 'Soutien',
        tone: 'stationed',
      });
    });

    it('builds a returned report in host to origin direction', () => {
      const report = makeReport({
        type: 'RETURNED',
        originVillageName: 'Ironhold',
        hostVillageName: 'Castleford',
        units: { MILITIA: 1 },
      });

      expect(buildReinforcementReportModalProps(report, [])).toMatchObject({
        banner: 'TROUPES RENTRÉES',
        destination: {
          coord: '3|7',
          label: "Village d'origine",
          name: 'Ironhold',
        },
        origin: {
          coord: '10|20',
          label: 'Garnison',
          name: 'Castleford',
        },
        roleLabel: 'Retour',
        tone: 'returned',
      });
    });
  });
});
