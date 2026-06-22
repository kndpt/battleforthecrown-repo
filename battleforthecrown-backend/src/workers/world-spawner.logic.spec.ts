import {
  DEFAULT_WORLD_CONFIG,
  WorldConfigSchema,
  WorldSigilSchema,
  WorldThemeColorSchema,
} from '@battleforthecrown/shared/world';
import { MS_PER_DAY } from '@battleforthecrown/shared/time';
import {
  computeNextPlannedOpenAt,
  deriveAutoWorldIdentity,
} from './world-spawner.logic';

const CADENCE = 7;
const NOW = new Date('2026-06-22T12:00:00.000Z');

describe('computeNextPlannedOpenAt', () => {
  it('bootstrap (no world ever started) returns now', () => {
    expect(computeNextPlannedOpenAt(null, CADENCE, NOW)).toEqual(NOW);
  });

  it('cadence not elapsed returns null (skip, nothing written)', () => {
    const lastStarted = new Date(NOW.getTime() - 3 * MS_PER_DAY); // 3 < 7
    expect(computeNextPlannedOpenAt(lastStarted, CADENCE, NOW)).toBeNull();
  });

  it('exactly at the cadence boundary returns now (due)', () => {
    const lastStarted = new Date(NOW.getTime() - CADENCE * MS_PER_DAY);
    expect(computeNextPlannedOpenAt(lastStarted, CADENCE, NOW)).toEqual(NOW);
  });

  it('overdue by several cadences still returns now (no accumulation)', () => {
    const lastStarted = new Date(NOW.getTime() - 30 * MS_PER_DAY); // > 4 cadences
    expect(computeNextPlannedOpenAt(lastStarted, CADENCE, NOW)).toEqual(NOW);
  });
});

describe('deriveAutoWorldIdentity', () => {
  it('derives a 1-based name and rotates sigil/color deterministically', () => {
    const first = deriveAutoWorldIdentity(0);
    expect(first.name).toBe('Royaume 1');
    expect(first.identity.displayName).toBe('Royaume 1');
    expect(first.identity.sigil).toBe(WorldSigilSchema.options[0]);
    expect(first.identity.themeColor).toBe(WorldThemeColorSchema.options[0]);

    const third = deriveAutoWorldIdentity(2);
    expect(third.name).toBe('Royaume 3');
    expect(third.identity.sigil).toBe(WorldSigilSchema.options[2]);
  });

  it('wraps the rotation past the enum length', () => {
    const len = WorldSigilSchema.options.length;
    const wrapped = deriveAutoWorldIdentity(len);
    expect(wrapped.identity.sigil).toBe(WorldSigilSchema.options[0]);
    expect(wrapped.name).toBe(`Royaume ${len + 1}`);
  });

  it('produces an identity accepted by WorldIdentitySchema (valid config)', () => {
    const { identity } = deriveAutoWorldIdentity(5);
    const parsed = WorldConfigSchema.safeParse({
      ...DEFAULT_WORLD_CONFIG,
      identity,
    });
    expect(parsed.success).toBe(true);
  });
});

describe('DEFAULT_WORLD_CONFIG', () => {
  it('is a valid canonical world config (drift guard vs seed)', () => {
    const parsed = WorldConfigSchema.safeParse(DEFAULT_WORLD_CONFIG);
    expect(parsed.success).toBe(true);
  });
});
