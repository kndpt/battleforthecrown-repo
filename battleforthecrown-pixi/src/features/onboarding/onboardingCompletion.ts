import { useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/auth';

/**
 * One-shot acknowledgement of the post-victory onboarding completion modal.
 * Keyed `userId × worldId`, persisted in `sessionStorage` so a refresh/rejoin
 * within the same browser session never re-triggers the closing screen
 * (cf. ticket 078). The backend stays the source of truth for `status`; this
 * flag is purely a front-only "the player has dismissed the loot screen" mark.
 */
function ackKey(userId: string, worldId: string): string {
  return `bftc:onboarding:completion-ack:${userId}:${worldId}`;
}

export function isOnboardingCompletionAcknowledged(
  userId: string | null,
  worldId: string | null,
): boolean {
  if (!userId || !worldId || typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(ackKey(userId, worldId)) === '1';
  } catch {
    return false;
  }
}

export interface OnboardingCompletionAck {
  acknowledged: boolean;
  acknowledge: () => void;
}

export function useOnboardingCompletionAck(worldId: string | null): OnboardingCompletionAck {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [ackedKey, setAckedKey] = useState<string | null>(null);

  const acknowledged =
    isOnboardingCompletionAcknowledged(userId, worldId) ||
    (userId !== null && worldId !== null && ackedKey === ackKey(userId, worldId));

  const acknowledge = useCallback(() => {
    if (!userId || !worldId) return;
    const key = ackKey(userId, worldId);
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(key, '1');
      } catch {
        // sessionStorage unavailable (private mode / quota) — fall back to
        // in-memory state so the modal still dismisses for this session.
      }
    }
    setAckedKey(key);
  }, [userId, worldId]);

  return { acknowledged, acknowledge };
}
