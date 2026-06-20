import { describe, expect, it } from 'vitest';
import { shieldEndsAt, isShieldActive } from './shield';

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
