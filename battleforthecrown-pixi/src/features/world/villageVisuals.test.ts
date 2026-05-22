import { describe, expect, it } from 'vitest';
import { villageVisualTierFromCastleLevel } from '@battleforthecrown/shared/world';
import { villageSpriteAliasForEntity, type MapEntity } from '@/api/world-types';

describe('villageVisualTierFromCastleLevel', () => {
  it('maps castle levels 1..10 to the canonical six village visual tiers', () => {
    expect(
      Array.from({ length: 10 }, (_, index) =>
        villageVisualTierFromCastleLevel(index + 1),
      ),
    ).toEqual([1, 1, 2, 2, 3, 3, 4, 5, 6, 6]);
  });

  it('clamps out-of-bounds and non-finite values', () => {
    expect(villageVisualTierFromCastleLevel(-10)).toBe(1);
    expect(villageVisualTierFromCastleLevel(0)).toBe(1);
    expect(villageVisualTierFromCastleLevel(11)).toBe(6);
    expect(villageVisualTierFromCastleLevel(Number.POSITIVE_INFINITY)).toBe(1);
  });

  it('resolves the Pixi village sprite alias from castle level', () => {
    const entity: MapEntity = {
      id: 'v1',
      kind: 'PLAYER_VILLAGE',
      isMine: false,
      x: 1,
      y: 2,
      name: 'Castle 10',
      tier: null,
      castleLevel: 10,
    };

    expect(villageSpriteAliasForEntity(entity)).toBe('world.village.t6');
  });
});
