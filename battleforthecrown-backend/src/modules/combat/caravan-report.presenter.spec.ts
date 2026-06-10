import {
  presentCaravanReport,
  presentResource,
  presentResources,
} from './caravan-report.presenter';

type CaravanReportInput = Parameters<typeof presentCaravanReport>[0];

const baseReport: CaravanReportInput = {
  id: 'caravan-report-1',
  worldId: 'world-1',
  expeditionId: 'expedition-1',
  type: 'ARRIVED',
  originVillageId: 'origin-village',
  originVillageName: 'Aubefer',
  originX: 3,
  originY: 7,
  targetVillageId: 'target-village',
  targetVillageName: 'Hauterive',
  targetX: 10,
  targetY: 20,
  resources: { wood: 100, stone: 25, iron: 5 },
  credited: { wood: 90, stone: 25, iron: 5 },
  returned: { wood: 0, stone: 0, iron: 0 },
  lost: { wood: 10, stone: 0, iron: 0 },
  porters: 2,
  recalled: false,
  timestamp: new Date('2026-06-10T12:34:56.000Z'),
};

describe('presentCaravanReport', () => {
  it('maps report fields, resource buckets, read state, and timestamp', () => {
    expect(presentCaravanReport(baseReport, true)).toEqual({
      id: 'caravan-report-1',
      worldId: 'world-1',
      expeditionId: 'expedition-1',
      type: 'ARRIVED',
      originVillageId: 'origin-village',
      originVillageName: 'Aubefer',
      originX: 3,
      originY: 7,
      targetVillageId: 'target-village',
      targetVillageName: 'Hauterive',
      targetX: 10,
      targetY: 20,
      resources: { wood: 100, stone: 25, iron: 5 },
      credited: { wood: 90, stone: 25, iron: 5 },
      returned: { wood: 0, stone: 0, iron: 0 },
      lost: { wood: 10, stone: 0, iron: 0 },
      porters: 2,
      recalled: false,
      isRead: true,
      timestamp: '2026-06-10T12:34:56.000Z',
    });
  });

  it('normalizes malformed resource buckets in the report response', () => {
    const report: CaravanReportInput = {
      ...baseReport,
      type: 'RETURNED',
      resources: null,
      credited: undefined,
      returned: { wood: Number.POSITIVE_INFINITY, stone: 'bad', iron: 12 },
      lost: { wood: Number.NaN, stone: 4, iron: null },
      recalled: true,
    };

    expect(presentCaravanReport(report, false)).toMatchObject({
      type: 'RETURNED',
      resources: { wood: 0, stone: 0, iron: 0 },
      credited: { wood: 0, stone: 0, iron: 0 },
      returned: { wood: 0, stone: 0, iron: 12 },
      lost: { wood: 0, stone: 4, iron: 0 },
      recalled: true,
      isRead: false,
    });
  });
});

describe('presentResources', () => {
  it('returns empty resources for null, undefined, and non-object values', () => {
    expect(presentResources(null)).toEqual({ wood: 0, stone: 0, iron: 0 });
    expect(presentResources(undefined)).toEqual({ wood: 0, stone: 0, iron: 0 });
    expect(presentResources('bad')).toEqual({ wood: 0, stone: 0, iron: 0 });
  });

  it('maps finite numeric resource values and zeroes invalid values', () => {
    expect(
      presentResources({
        wood: 15,
        stone: Number.POSITIVE_INFINITY,
        iron: Number.NaN,
      }),
    ).toEqual({ wood: 15, stone: 0, iron: 0 });
  });
});

describe('presentResource', () => {
  it('keeps finite numbers and returns zero for non-finite or non-numeric values', () => {
    expect(presentResource(42)).toBe(42);
    expect(presentResource(Number.POSITIVE_INFINITY)).toBe(0);
    expect(presentResource(Number.NaN)).toBe(0);
    expect(presentResource('42')).toBe(0);
  });
});
