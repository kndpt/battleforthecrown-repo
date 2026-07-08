import { describe, expect, it } from 'vitest';
import type { JoinedVillage, QueueEntryDto } from '@/api';
import type { ArmyTrainingDto, ResourcesPayload } from '@/api/queries';
import {
  buildMultiVillageSheetItems,
  buildSortedMultiVillageSheetItems,
  deriveVillageStateAlert,
  VILLAGE_STATE_ALERT_MESSAGES,
} from './multiVillageSheet';

function village(id: string, name: string): JoinedVillage {
  return { id, name, x: 0, y: 0, worldId: 'world-1' };
}

function resources(overrides: Partial<ResourcesPayload> = {}): ResourcesPayload {
  return {
    iron: 0,
    lastUpdateTs: '2026-01-01T00:00:00.000Z',
    maxPerType: 1000,
    productionRates: { iron: 0, stone: 0, wood: 0 },
    stone: 0,
    wood: 0,
    ...overrides,
  };
}

function training(remaining: number): ArmyTrainingDto {
  return {
    completedQty: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    id: 't1',
    nextUnitEta: '2026-01-01T00:00:00.000Z',
    timePerUnitMs: 1000,
    totalQty: remaining,
    unitType: 'SWORDSMAN',
    villageId: 'v1',
  };
}

function queueEntry(): QueueEntryDto {
  return {
    endTime: '2026-01-01T01:00:00.000Z',
    id: 'q1',
    level: 2,
    startTime: '2026-01-01T00:00:00.000Z',
    type: 'CASTLE',
  };
}

describe('buildSortedMultiVillageSheetItems', () => {
  // Names chosen to exercise French collation (accents, case-insensitivity).
  const villages = [village('a', 'Élan'), village('b', 'azur'), village('c', 'Bois')];

  it('sorts by name ascending using French locale (accent/case insensitive)', () => {
    const items = buildSortedMultiVillageSheetItems(villages, 'a', {}, true);
    expect(items.map((item) => item.name)).toEqual(['azur', 'Bois', 'Élan']);
  });

  it('sorts by name descending when sortAscending is false', () => {
    const items = buildSortedMultiVillageSheetItems(villages, 'a', {}, false);
    expect(items.map((item) => item.name)).toEqual(['Élan', 'Bois', 'azur']);
  });

  it('flags the active village and is non-mutating', () => {
    const input = [...villages];
    const items = buildSortedMultiVillageSheetItems(input, 'c', {}, true);
    expect(items.find((item) => item.id === 'c')?.active).toBe(true);
    expect(items.filter((item) => item.active)).toHaveLength(1);
    // original order preserved (toSorted does not mutate the source array)
    expect(input.map((v) => v.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('deriveVillageStateAlert', () => {
  it('emits a "warehouse full" warning when a resource reaches its cap', () => {
    const alert = deriveVillageStateAlert({
      queue: [queueEntry()], // building → not idle, isolates the warehouse branch
      resources: resources({ maxPerType: 1000, stone: 1000 }),
      training: [training(3)],
    });
    expect(alert).toEqual({
      eta: '—',
      kind: 'warning',
      msg: VILLAGE_STATE_ALERT_MESSAGES.warehouseFull,
    });
  });

  it('does not flag warehouse full below the cap', () => {
    const alert = deriveVillageStateAlert({
      queue: [queueEntry()],
      resources: resources({ iron: 999, maxPerType: 1000, stone: 999, wood: 999 }),
      training: [training(3)],
    });
    expect(alert).toBeNull();
  });

  it('emits an "idle queue" warning when nothing builds and nothing trains', () => {
    const alert = deriveVillageStateAlert({
      queue: [],
      resources: resources(),
      training: [],
    });
    expect(alert).toEqual({
      eta: '—',
      kind: 'warning',
      msg: VILLAGE_STATE_ALERT_MESSAGES.idleQueue,
    });
  });

  it('treats a fully-completed training row as idle', () => {
    const alert = deriveVillageStateAlert({
      queue: [],
      resources: resources(),
      training: [training(0)], // totalQty === completedQty → nothing forming
    });
    expect(alert?.msg).toBe(VILLAGE_STATE_ALERT_MESSAGES.idleQueue);
  });

  it('is not idle while a lord (noble) is still training', () => {
    const noble: ArmyTrainingDto = { ...training(1), id: 'noble', unitType: 'NOBLE' };
    const alert = deriveVillageStateAlert({
      queue: [],
      resources: resources(),
      training: [noble],
    });
    expect(alert).toBeNull();
  });

  it('is not idle while a construction is queued', () => {
    const alert = deriveVillageStateAlert({
      queue: [queueEntry()],
      resources: resources(),
      training: [],
    });
    expect(alert).toBeNull();
  });

  it('prioritises warehouse full over idle queue when both hold', () => {
    const alert = deriveVillageStateAlert({
      queue: [],
      resources: resources({ maxPerType: 1000, wood: 1000 }),
      training: [],
    });
    expect(alert?.msg).toBe(VILLAGE_STATE_ALERT_MESSAGES.warehouseFull);
  });

  it('returns null when no state data is available (no invented alert)', () => {
    expect(deriveVillageStateAlert({})).toBeNull();
  });

  it('does not conclude idle while queue/training data is still loading', () => {
    // resources present but queue+training undefined → cannot assert idleness
    expect(deriveVillageStateAlert({ resources: resources() })).toBeNull();
  });

  it('never emits kind "attack"', () => {
    const inputs = [
      { queue: [], resources: resources({ maxPerType: 1000, wood: 1000 }), training: [] },
      { queue: [], resources: resources(), training: [] },
      {},
    ];
    for (const input of inputs) {
      expect(deriveVillageStateAlert(input)?.kind).not.toBe('attack');
    }
  });
});

describe('buildMultiVillageSheetItems alert wiring', () => {
  it('populates village.alert from the state derivation', () => {
    const items = buildMultiVillageSheetItems([village('v1', 'Fort')], 'v1', {
      queueByVillageId: new Map([['v1', []]]),
      resourcesByVillageId: new Map([['v1', resources({ maxPerType: 1000, wood: 1000 })]]),
      trainingByVillageId: new Map([['v1', []]]),
    });
    expect(items[0]?.alert?.msg).toBe(VILLAGE_STATE_ALERT_MESSAGES.warehouseFull);
    expect(items[0]?.alert?.kind).toBe('warning');
  });

  it('leaves alert null when no per-village state data is provided', () => {
    const items = buildMultiVillageSheetItems([village('v1', 'Fort')], 'v1', {});
    expect(items[0]?.alert).toBeNull();
  });
});

describe('buildMultiVillageSheetItems label propagation', () => {
  it('forwards the raw enum label so the list filter can compare it', () => {
    const items = buildMultiVillageSheetItems(
      [
        { ...village('off', 'Kelvinor'), label: 'OFFENSIVE' },
        { ...village('eco', "Vald'Or"), label: 'ECONOMIC' },
        { ...village('none', 'Pierre-Noire') },
      ],
      'off',
      {},
    );

    expect(items.map((item) => item.label)).toEqual(['OFFENSIVE', 'ECONOMIC', null]);
    // badge stays the French display string, decoupled from the enum value
    expect(items.find((item) => item.id === 'off')?.badge).toBe('Offensif');
  });
});
