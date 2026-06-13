import { VillageStrategy } from '@prisma/client';
import type { CombatParticipant } from './interfaces/combat-context.interface';
import {
  mergeGarrisonsIntoParticipants,
  type GarrisonWithStrategy,
} from './garrison-merge.utils';

function makeGarrison(
  originVillageId: string,
  unitType: string,
  quantity: number,
  strategy?: VillageStrategy,
): GarrisonWithStrategy {
  return {
    unitType,
    quantity,
    originVillageId,
    originVillage: strategy
      ? { strategyConfig: { strategy } }
      : { strategyConfig: null },
  } as unknown as GarrisonWithStrategy;
}

describe('mergeGarrisonsIntoParticipants', () => {
  it('does nothing for empty garrisons', () => {
    const participants: CombatParticipant[] = [
      { villageId: 'v1', units: { MILITIA: 5 } },
    ];
    const totalUnits = { MILITIA: 5 };

    mergeGarrisonsIntoParticipants([], participants, totalUnits);

    expect(participants).toHaveLength(1);
    expect(totalUnits).toEqual({ MILITIA: 5 });
  });

  it('adds a new participant for an unknown origin', () => {
    const participants: CombatParticipant[] = [
      { villageId: 'defender', units: { MILITIA: 3 } },
    ];
    const totalUnits = { MILITIA: 3 };

    mergeGarrisonsIntoParticipants(
      [makeGarrison('origin-a', 'SPEARMAN', 10)],
      participants,
      totalUnits,
    );

    expect(participants).toHaveLength(2);
    expect(participants[1]).toEqual({
      villageId: 'origin-a',
      units: { SPEARMAN: 10 },
      strategy: undefined,
    });
    expect(totalUnits).toEqual({ MILITIA: 3, SPEARMAN: 10 });
  });

  it('merges units into an existing participant', () => {
    const participants: CombatParticipant[] = [
      { villageId: 'origin-a', units: { MILITIA: 4 } },
    ];
    const totalUnits = { MILITIA: 4 };

    mergeGarrisonsIntoParticipants(
      [makeGarrison('origin-a', 'MILITIA', 6)],
      participants,
      totalUnits,
    );

    expect(participants).toHaveLength(1);
    expect(participants[0].units).toEqual({ MILITIA: 10 });
    expect(totalUnits).toEqual({ MILITIA: 10 });
  });

  it('carries the strategy from the garrison origin village', () => {
    const participants: CombatParticipant[] = [
      { villageId: 'defender', units: {} },
    ];
    const totalUnits = {};

    mergeGarrisonsIntoParticipants(
      [makeGarrison('origin-b', 'NOBLE', 1, VillageStrategy.RAIDERS)],
      participants,
      totalUnits,
    );

    expect(participants[1].strategy).toBe(VillageStrategy.RAIDERS);
  });

  it('handles multiple garrisons from multiple origins', () => {
    const participants: CombatParticipant[] = [
      { villageId: 'defender', units: { MILITIA: 2 } },
    ];
    const totalUnits = { MILITIA: 2 };

    mergeGarrisonsIntoParticipants(
      [
        makeGarrison('a', 'MILITIA', 5),
        makeGarrison('b', 'SPEARMAN', 3),
        makeGarrison('a', 'SPEARMAN', 7),
      ],
      participants,
      totalUnits,
    );

    expect(participants).toHaveLength(3);
    const pa = participants.find((p) => p.villageId === 'a')!;
    expect(pa.units).toEqual({ MILITIA: 5, SPEARMAN: 7 });
    const pb = participants.find((p) => p.villageId === 'b')!;
    expect(pb.units).toEqual({ SPEARMAN: 3 });
    expect(totalUnits).toEqual({ MILITIA: 7, SPEARMAN: 10 });
  });
});
