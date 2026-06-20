export interface ShieldTimingInput {
  joinedAt: Date | string;
  newbieShieldHours: number;
}

export function shieldEndsAt({ joinedAt, newbieShieldHours }: ShieldTimingInput): Date {
  const start = joinedAt instanceof Date ? joinedAt : new Date(joinedAt);
  return new Date(start.getTime() + newbieShieldHours * 3600 * 1000);
}

export interface ShieldActiveInput extends ShieldTimingInput {
  brokenAt: Date | string | null;
  now: Date;
}

export function isShieldActive({ joinedAt, brokenAt, newbieShieldHours, now }: ShieldActiveInput): boolean {
  if (brokenAt != null) return false;
  return now.getTime() < shieldEndsAt({ joinedAt, newbieShieldHours }).getTime();
}
