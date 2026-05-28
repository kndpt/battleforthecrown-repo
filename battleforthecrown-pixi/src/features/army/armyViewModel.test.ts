import { describe, expect, it } from 'vitest';
import { UNIT_COSTS } from '@battleforthecrown/shared/army';
import { getUnitPowerWeight } from '@battleforthecrown/shared/power';
import { computeArmyRecruitMax } from '@/features/design-system/components';
import type { ArmyTrainingDto, ArmyUnitDto } from '@/api/queries';
import type { GarrisonLine } from '@/lib/types';
import {
  buildArmyRecruitQuickValues,
  buildArmyRecruitStock,
  buildArmyViewModel,
} from './armyViewModel';

const nowMs = Date.parse('2026-05-27T10:00:30Z');

const units: ArmyUnitDto[] = [
  { id: 'unit-militia', populationCost: 1, quantity: 12, type: 'MILITIA' },
  { id: 'unit-squire', populationCost: 1, quantity: 0, type: 'SQUIRE' },
  { id: 'unit-noble', populationCost: 15, quantity: 1, type: 'NOBLE' },
];

const garrison: GarrisonLine[] = [
  {
    direction: 'INCOMING',
    hostVillageName: 'Capital',
    originVillageId: 'ally-1',
    originVillageName: 'Ally Keep',
    quantity: 7,
    unitType: 'ARCHER',
    villageId: 'village-1',
  },
  {
    direction: 'OUTGOING',
    hostVillageName: 'Distant Keep',
    hostPlayerName: 'ally@example.test',
    originVillageId: 'village-1',
    originVillageName: 'Capital',
    originPlayerName: 'me@example.test',
    quantity: 3,
    unitType: 'SQUIRE',
    villageId: 'distant-1',
  },
  {
    direction: 'OUTGOING',
    hostVillageName: 'Distant Keep',
    hostPlayerName: 'ally@example.test',
    originVillageId: 'village-1',
    originVillageName: 'Capital',
    originPlayerName: 'me@example.test',
    quantity: 5,
    unitType: 'ARCHER',
    villageId: 'distant-1',
  },
  {
    direction: 'OUTGOING',
    hostVillageName: 'Border Fort',
    hostPlayerName: 'frontier@example.test',
    originVillageId: 'village-1',
    originVillageName: 'Capital',
    originPlayerName: 'me@example.test',
    quantity: 10,
    unitType: 'MILITIA',
    villageId: 'distant-2',
  },
];

const training: ArmyTrainingDto = {
  completedQty: 0,
  createdAt: '2026-05-27T10:00:00Z',
  id: 'training-1',
  nextUnitEta: '2026-05-27T10:01:00Z',
  timePerUnitMs: 60_000,
  totalQty: 2,
  unitType: 'MILITIA',
  villageId: 'village-1',
};

describe('buildArmyViewModel', () => {
  it('maps only barracks units and keeps locked states based on barracks level', () => {
    const model = buildArmyViewModel({
      activeFilterId: 'all',
      barracksLevel: 2,
      garrisonLines: [],
      nowMs,
      population: { available: 10, max: 30, used: 20 },
      resources: { iron: 500, maxPerType: 2_000, stone: 500, wood: 500 },
      trainings: [],
      units,
    });

    expect(model.troops.map((troop) => troop.id)).not.toContain('NOBLE');
    expect(model.troops.find((troop) => troop.id === 'SQUIRE')).toMatchObject({
      requiredLevel: UNIT_COSTS.SQUIRE.requiredBarracksLevel,
      unlocked: true,
    });
    expect(model.troops.find((troop) => troop.id === 'WARRIOR')).toMatchObject({
      requiredLevel: UNIT_COSTS.WARRIOR.requiredBarracksLevel,
      unlocked: false,
    });
  });

  it('uses garrison lines for allies and sent filters without inventing preview data', () => {
    const model = buildArmyViewModel({
      activeFilterId: 'all',
      barracksLevel: 5,
      garrisonLines: garrison,
      nowMs,
      population: { available: 10, max: 30, used: 20 },
      resources: { iron: 500, maxPerType: 2_000, stone: 500, wood: 500 },
      trainings: [],
      units,
    });

    expect(model.troops.find((troop) => troop.id === 'ARCHER')?.fromAllies).toBe(7);
    expect(model.troops.find((troop) => troop.id === 'SQUIRE')?.supportingElsewhere).toBe(3);
    expect(model.filters.map((filter) => filter.label)).toEqual([
      'Village',
      'Alliés',
      'Envoyés',
      'Toutes',
    ]);
    expect(model.filters.find((filter) => filter.id === 'mine')?.count).toBe(12);
    expect(model.filters.find((filter) => filter.id === 'allies')?.count).toBe(7);
    expect(model.filters.find((filter) => filter.id === 'sent')?.count).toBe(18);
    expect(model.filters.find((filter) => filter.id === 'all')?.count).toBe(19);
    expect(model.barracksTroops.find((troop) => troop.id === 'SQUIRE')).toMatchObject({
      displayQuantity: 3,
    });
    expect(model.barracksTroops.find((troop) => troop.id === 'ARCHER')).toMatchObject({
      displayQuantity: 5,
    });
    const villagePower = (
      12 * getUnitPowerWeight('MILITIA') +
      7 * getUnitPowerWeight('ARCHER')
    ).toLocaleString('fr-FR');
    const awayPower = (
      3 * getUnitPowerWeight('SQUIRE') +
      5 * getUnitPowerWeight('ARCHER') +
      10 * getUnitPowerWeight('MILITIA')
    ).toLocaleString('fr-FR');

    expect(model.armySections).toMatchObject([
      {
        id: 'village',
        summary: villagePower,
        summaryIcon: '/assets/army-power.png',
        villageRows: expect.arrayContaining([
          expect.objectContaining({
            alliedQuantity: 0,
            id: 'MILITIA',
            ownQuantity: 12,
            totalQuantity: 12,
          }),
          expect.objectContaining({
            alliedQuantity: 7,
            id: 'ARCHER',
            ownQuantity: 0,
            power: 7 * getUnitPowerWeight('ARCHER'),
            totalQuantity: 7,
          }),
        ]),
        troops: expect.arrayContaining([
          expect.objectContaining({ displayQuantity: 12, id: 'MILITIA' }),
          expect.objectContaining({ displayQuantity: 7, id: 'ARCHER' }),
        ]),
      },
      {
        id: 'away',
        summary: awayPower,
        summaryIcon: '/assets/army-power.png',
        supportRows: expect.arrayContaining([
          expect.objectContaining({
            id: 'distant-1',
            power:
              3 * getUnitPowerWeight('SQUIRE') +
              5 * getUnitPowerWeight('ARCHER'),
            subtitle: 'ally@example.test · Depuis : —',
            title: 'Distant Keep',
            totalQuantity: 8,
            units: expect.arrayContaining([
              expect.objectContaining({ id: 'ARCHER', quantity: 5 }),
              expect.objectContaining({ id: 'SQUIRE', quantity: 3 }),
            ]),
          }),
          expect.objectContaining({
            id: 'distant-2',
            title: 'Border Fort',
            totalQuantity: 10,
            units: [expect.objectContaining({ id: 'MILITIA', quantity: 10 })],
          }),
        ]),
      },
    ]);

    const allies = buildArmyViewModel({
      activeFilterId: 'allies',
      barracksLevel: 5,
      garrisonLines: garrison,
      nowMs,
      population: { available: 10, max: 30, used: 20 },
      resources: { iron: 500, maxPerType: 2_000, stone: 500, wood: 500 },
      trainings: [],
      units,
    });
    expect(allies.visibleTroops).toMatchObject([
      { displayQuantity: 7, id: 'ARCHER' },
    ]);

    const sent = buildArmyViewModel({
      activeFilterId: 'sent',
      barracksLevel: 5,
      garrisonLines: garrison,
      nowMs,
      population: { available: 10, max: 30, used: 20 },
      resources: { iron: 500, maxPerType: 2_000, stone: 500, wood: 500 },
      trainings: [],
      units,
    });
    expect(sent.visibleTroops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ displayQuantity: 10, id: 'MILITIA' }),
        expect.objectContaining({ displayQuantity: 3, id: 'SQUIRE' }),
        expect.objectContaining({ displayQuantity: 5, id: 'ARCHER' }),
      ]),
    );
  });

  it('builds recruit stock and quick values from real resources and population', () => {
    const stock = buildArmyRecruitStock(
      { iron: 500, maxPerType: 2_000, stone: 500, wood: 500 },
      { available: 4, max: 20, used: 16 },
    );
    const troop = buildArmyViewModel({
      activeFilterId: 'all',
      barracksLevel: 1,
      garrisonLines: [],
      nowMs,
      population: { available: 4, max: 20, used: 16 },
      resources: { iron: 99.9, maxPerType: 2_000, stone: 90.5, wood: 120.8 },
      trainings: [],
      units,
    }).troops.find((candidate) => candidate.id === 'MILITIA');

    expect(stock).toEqual({ iron: 500, populationAvailable: 4, stone: 500, wood: 500 });
    expect(troop ? computeArmyRecruitMax(troop, stock) : null).toBe(4);
    expect(buildArmyRecruitQuickValues(4).at(-1)).toEqual({
      label: 'MAX',
      tone: 'gold',
      value: 4,
    });
  });

  it('keeps effective training durations and queue progress in the design model', () => {
    const model = buildArmyViewModel({
      activeFilterId: 'all',
      barracksLevel: 5,
      garrisonLines: [],
      nowMs,
      population: { available: 10, max: 30, used: 20 },
      resources: { iron: 500, maxPerType: 2_000, stone: 500, wood: 500 },
      trainings: [training],
      units,
      worldTempo: { global: 1, overrides: { unitTrainingSpeed: 0.5 } },
    });

    expect(model.troops.find((troop) => troop.id === 'MILITIA')?.trainingTime).toBe('4s');
    expect(model.recruitSheet.queue).toMatchObject([
      { active: true, id: 'training-1', progress: 0.25, quantity: 2, troopId: 'MILITIA' },
    ]);
    expect(model.recruitSheet.summaryLabel).toContain('2 en formation');
  });
});
