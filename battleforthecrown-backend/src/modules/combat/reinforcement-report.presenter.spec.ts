import { presentReinforcementReport } from './reinforcement-report.presenter';

type ReinforcementReportInput = Parameters<
  typeof presentReinforcementReport
>[0];

const baseReport: ReinforcementReportInput = {
  id: 'reinforcement-report-1',
  worldId: 'world-1',
  type: 'RETURNED',
  originVillageId: 'origin-village',
  originVillageName: 'Ironhold',
  originX: 3,
  originY: 7,
  hostVillageId: 'host-village',
  hostVillageName: 'Castleford',
  hostX: 10,
  hostY: 20,
  units: { MILITIA: 12, ARCHER: 4 },
  actorUserId: 'actor-user',
  timestamp: new Date('2026-05-31T12:34:56.000Z'),
};

describe('presentReinforcementReport', () => {
  it('maps report fields and serializes timestamp', () => {
    expect(presentReinforcementReport(baseReport, true)).toEqual({
      id: baseReport.id,
      worldId: baseReport.worldId,
      type: 'RETURNED',
      originVillageId: baseReport.originVillageId,
      originVillageName: baseReport.originVillageName,
      originX: baseReport.originX,
      originY: baseReport.originY,
      hostVillageId: baseReport.hostVillageId,
      hostVillageName: baseReport.hostVillageName,
      hostX: baseReport.hostX,
      hostY: baseReport.hostY,
      units: { MILITIA: 12, ARCHER: 4 },
      actorUserId: baseReport.actorUserId,
      isRead: true,
      timestamp: baseReport.timestamp.toISOString(),
    });
  });

  it('projects unread state from the inbox entry', () => {
    expect(presentReinforcementReport(baseReport, false).isRead).toBe(false);
  });
});
