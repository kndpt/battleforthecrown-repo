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

import type { NewbieShieldState } from '../world/dtos';

/**
 * Build the wire-shaped shield state observed by attackers and the owner.
 * Single source of truth for the three places that previously rebuilt this
 * object inline (world.service, world-entities-query.service,
 * newbie-shield.service) from {@link shieldEndsAt} + {@link isShieldActive}.
 */
export function buildShieldState({ joinedAt, brokenAt, newbieShieldHours, now }: ShieldActiveInput): NewbieShieldState {
  const endsAt = shieldEndsAt({ joinedAt, newbieShieldHours }).toISOString();
  const brokenAtIso =
    brokenAt == null
      ? null
      : brokenAt instanceof Date
        ? brokenAt.toISOString()
        : new Date(brokenAt).toISOString();
  const active = isShieldActive({ joinedAt, brokenAt, newbieShieldHours, now });
  return { endsAt, brokenAt: brokenAtIso, active };
}
