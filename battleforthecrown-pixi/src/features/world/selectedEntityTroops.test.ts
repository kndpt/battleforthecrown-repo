import { describe, expect, it } from 'vitest';
import type { ArmyUnitDto } from '@/api/queries';
import type { GarrisonLine } from '@/lib/types';
import { summarizePresentTroops } from './selectedEntityTroops';

function unit(type: string, quantity: number): ArmyUnitDto {
  return {
    id: `unit-${type}`,
    populationCost: 1,
    quantity,
    type,
  };
}

function garrisonLine(
  unitType: GarrisonLine['unitType'],
  quantity: number,
  direction: GarrisonLine['direction'] = 'INCOMING',
): GarrisonLine {
  return {
    direction,
    hostVillageName: 'Host',
    originVillageId: 'origin-1',
    originVillageName: 'Origin',
    quantity,
    unitType,
    villageId: 'village-1',
  };
}

describe('selected entity troops', () => {
  it('sums native troops and incoming garrison lines by unit type', () => {
    const rows = summarizePresentTroops(
      [unit('MILITIA', 12), unit('ARCHER', 3)],
      [
        garrisonLine('MILITIA', 8),
        garrisonLine('SQUIRE', 5),
        garrisonLine('MILITIA', 99, 'OUTGOING'),
      ],
    );

    expect(rows).toEqual([
      expect.objectContaining({ label: 'Archer', quantity: 3, unitType: 'ARCHER' }),
      expect.objectContaining({ label: 'Milice de paysans', quantity: 20, unitType: 'MILITIA' }),
      expect.objectContaining({ label: 'Écuyer', quantity: 5, unitType: 'SQUIRE' }),
    ]);
  });
});
