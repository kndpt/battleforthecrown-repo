import { subtractCaravanResources } from './caravan-resources';

describe('subtractCaravanResources', () => {
  it('subtracts each resource without going below zero', () => {
    expect(
      subtractCaravanResources(
        { wood: 120, stone: 50, iron: 0 },
        { wood: 20, stone: 80, iron: 10 },
      ),
    ).toEqual({ wood: 100, stone: 0, iron: 0 });
  });
});
