import { collectVillageIdsFromPayload } from './event-outbox-village-ids';

describe('collectVillageIdsFromPayload', () => {
  it('collects scalar village id fields', () => {
    expect(
      collectVillageIdsFromPayload({
        villageId: 'v1',
        targetVillageId: 'v2',
        hostVillageId: 'v3',
      }),
    ).toEqual(['v1', 'v2', 'v3']);
  });

  it('collects defender and attacker village ids for village.attacked', () => {
    expect(
      collectVillageIdsFromPayload({
        defenderVillageId: 'def',
        attackerVillageId: 'atk',
        reinforcementOriginVillageIds: ['r1', 'r2'],
      }),
    ).toEqual(['def', 'atk', 'r1', 'r2']);
  });

  it('ignores empty strings and non-string values', () => {
    expect(
      collectVillageIdsFromPayload({
        villageId: '',
        targetVillageId: 42,
        hostVillageId: null,
      }),
    ).toEqual([]);
  });
});
