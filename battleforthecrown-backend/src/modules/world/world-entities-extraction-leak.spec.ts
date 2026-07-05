import { extractionSiteDataSchema } from './world-entities-query.service';

/**
 * Anti-leak guard (spec V11/B2 — viewer-scope, run 091 T2): the
 * RESOURCE_EXTRACTION_SITE payload must NEVER expose `remainingCapacity`,
 * `initialCapacity`, `occupant` or `userId` — only `resourceType` and
 * `activity`. Zod's default object parsing strips unknown keys; these tests
 * lock that any such field injected into the raw data is dropped from the
 * emitted payload, catching a future regression that widens the schema.
 */
describe('world-entities extraction site anti-leak', () => {
  it('keeps only resourceType and activity for a valid payload', () => {
    const parsed = extractionSiteDataSchema.parse({
      resourceType: 'IRON',
      activity: 'IDLE',
    });
    expect(parsed).toEqual({ resourceType: 'IRON', activity: 'IDLE' });
  });

  it('strips remainingCapacity/initialCapacity/occupant/userId if injected', () => {
    const parsed = extractionSiteDataSchema.parse({
      resourceType: 'WOOD',
      activity: 'EXPLOITING',
      remainingCapacity: 4200,
      initialCapacity: 12000,
      occupant: 'village-1',
      userId: 'user-1',
    });
    expect(parsed).toEqual({ resourceType: 'WOOD', activity: 'EXPLOITING' });
    expect(parsed).not.toHaveProperty('remainingCapacity');
    expect(parsed).not.toHaveProperty('initialCapacity');
    expect(parsed).not.toHaveProperty('occupant');
    expect(parsed).not.toHaveProperty('userId');
  });

  it('rejects an unknown resourceType', () => {
    expect(() =>
      extractionSiteDataSchema.parse({
        resourceType: 'GOLD',
        activity: 'IDLE',
      }),
    ).toThrow();
  });

  it('rejects an unknown activity', () => {
    expect(() =>
      extractionSiteDataSchema.parse({
        resourceType: 'STONE',
        activity: 'DEPLETED',
      }),
    ).toThrow();
  });
});
