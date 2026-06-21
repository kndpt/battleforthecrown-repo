import { describe, expect, it } from 'vitest';
import { shieldEndsAt, isShieldActive, buildShieldState } from './shield';

const JOINED_AT = new Date('2026-01-01T00:00:00.000Z');
const HOURS_48 = 48;
const MS_48H = 48 * 3600 * 1000; // 172800000

describe('shieldEndsAt', () => {
  it('returns joinedAt + newbieShieldHours×3600×1000 ms exactly', () => {
    const result = shieldEndsAt({ joinedAt: JOINED_AT, newbieShieldHours: HOURS_48 });
    expect(result.getTime()).toBe(JOINED_AT.getTime() + MS_48H);
  });
});

describe('isShieldActive', () => {
  it('returns true when now < endsAt and brokenAt is null', () => {
    const now = new Date(JOINED_AT.getTime() + MS_48H - 1);
    expect(
      isShieldActive({ joinedAt: JOINED_AT, brokenAt: null, newbieShieldHours: HOURS_48, now }),
    ).toBe(true);
  });

  it('returns false when now > endsAt (expired naturally)', () => {
    const now = new Date(JOINED_AT.getTime() + MS_48H + 1);
    expect(
      isShieldActive({ joinedAt: JOINED_AT, brokenAt: null, newbieShieldHours: HOURS_48, now }),
    ).toBe(false);
  });

  it('returns false when brokenAt is set even if now < endsAt', () => {
    const now = new Date(JOINED_AT.getTime() + 1000); // still within shield window
    const brokenAt = new Date(JOINED_AT.getTime() + 500);
    expect(
      isShieldActive({ joinedAt: JOINED_AT, brokenAt, newbieShieldHours: HOURS_48, now }),
    ).toBe(false);
  });

  it('returns false at the exact boundary (now === endsAt, strict <)', () => {
    const now = new Date(JOINED_AT.getTime() + MS_48H);
    expect(
      isShieldActive({ joinedAt: JOINED_AT, brokenAt: null, newbieShieldHours: HOURS_48, now }),
    ).toBe(false);
  });
});

describe('buildShieldState', () => {
  it('returns active state with iso endsAt and null brokenAt before expiry', () => {
    const now = new Date(JOINED_AT.getTime() + 1000);
    const state = buildShieldState({
      joinedAt: JOINED_AT,
      brokenAt: null,
      newbieShieldHours: HOURS_48,
      now,
    });
    expect(state).toEqual({
      endsAt: new Date(JOINED_AT.getTime() + MS_48H).toISOString(),
      brokenAt: null,
      active: true,
    });
  });

  it('serialises brokenAt to iso and reports active=false', () => {
    const brokenAt = new Date(JOINED_AT.getTime() + 500);
    const now = new Date(JOINED_AT.getTime() + 1000);
    const state = buildShieldState({
      joinedAt: JOINED_AT,
      brokenAt,
      newbieShieldHours: HOURS_48,
      now,
    });
    expect(state.brokenAt).toBe(brokenAt.toISOString());
    expect(state.active).toBe(false);
    expect(state.endsAt).toBe(new Date(JOINED_AT.getTime() + MS_48H).toISOString());
  });

  it('reports active=false past the expiry window when brokenAt is null', () => {
    const now = new Date(JOINED_AT.getTime() + MS_48H + 1);
    const state = buildShieldState({
      joinedAt: JOINED_AT,
      brokenAt: null,
      newbieShieldHours: HOURS_48,
      now,
    });
    expect(state.active).toBe(false);
    expect(state.brokenAt).toBeNull();
  });

  it('accepts string inputs for joinedAt and brokenAt', () => {
    const brokenAtIso = new Date(JOINED_AT.getTime() + 250).toISOString();
    const now = new Date(JOINED_AT.getTime() + 1000);
    const state = buildShieldState({
      joinedAt: JOINED_AT.toISOString(),
      brokenAt: brokenAtIso,
      newbieShieldHours: HOURS_48,
      now,
    });
    expect(state.brokenAt).toBe(brokenAtIso);
    expect(state.active).toBe(false);
  });
});
