import {
  barbarianVillageDataSchema,
  playerVillageDataSchema,
} from './world-entities-query.service';

/**
 * Anti-leak guard (spec 27 § « Révélation »): the world-entities payload is
 * served to ALL viewers without a viewer scope, so it must NEVER carry a
 * village's natural trait — that is scout-only intel. Zod's default object
 * parsing strips unknown keys; these tests lock that a `naturalTrait` injected
 * into the raw data is dropped from the emitted payload, catching any future
 * regression that adds the field to the schema.
 */
describe('world-entities natural trait anti-leak', () => {
  it('strips naturalTrait from the PLAYER_VILLAGE payload', () => {
    const parsed = playerVillageDataSchema.parse({
      userId: 'user-1',
      ownerDisplayName: 'Alice',
      name: 'Capital',
      villageId: 'village-1',
      castleLevel: 5,
      naturalTrait: 'IRON_VEIN',
    });
    expect(parsed).not.toHaveProperty('naturalTrait');
  });

  it('strips naturalTrait from the BARBARIAN_VILLAGE payload', () => {
    const parsed = barbarianVillageDataSchema.parse({
      tier: 'T3',
      name: 'Barb camp',
      villageId: 'village-2',
      naturalTrait: 'DENSE_FOREST',
    });
    expect(parsed).not.toHaveProperty('naturalTrait');
  });
});
