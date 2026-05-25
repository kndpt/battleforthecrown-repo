import type { JoinedVillage, WorldMembership } from '@/api';

function membershipActivityTime(membership: WorldMembership): number {
  const raw = membership.lastLoginAt ?? membership.joinedAt;
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function pickLastPlayedMembership(
  memberships: readonly WorldMembership[],
): WorldMembership | null {
  return memberships.toSorted((a, b) => {
    const loginPriority = Number(Boolean(b.lastLoginAt)) - Number(Boolean(a.lastLoginAt));
    if (loginPriority !== 0) return loginPriority;
    return membershipActivityTime(b) - membershipActivityTime(a);
  })[0] ?? null;
}

export function pickDefaultVillage(villages: readonly JoinedVillage[]): JoinedVillage | null {
  return villages.find((village) => village.isCapital) ?? villages[0] ?? null;
}
