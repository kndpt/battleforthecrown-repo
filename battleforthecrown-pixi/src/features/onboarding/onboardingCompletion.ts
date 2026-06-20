import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { apiClient } from '@/api';
import { queryKeys } from '@/api/queries';

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

/** True if the player already dismissed the completion modal for this `userId × worldId`. */
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
  /** Whether the completion modal has been dismissed for the current identity. */
  acknowledged: boolean;
  /** Dismiss the completion modal one-shot (persists in `sessionStorage`). */
  acknowledge: () => void;
}

/**
 * React binding around the completion acknowledgement: reads the current
 * `userId` from the auth store and exposes `acknowledged` / `acknowledge` for
 * the current `worldId`. Falls back to in-memory state if `sessionStorage`
 * writes fail so the modal still dismisses for the session.
 */
export function useOnboardingCompletionAck(
  worldId: string | null,
  villageId?: string | null,
): OnboardingCompletionAck {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const queryClient = useQueryClient();
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
    // Credit the guaranteed completion loot on the CTA (idempotent server-side),
    // then refetch resources so the player sees it land. Cf. 15-onboarding.md.
    void apiClient
      .post('/onboarding/claim-completion-reward', undefined, { query: { worldId } })
      .then(() => {
        if (villageId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
        }
        queryClient.invalidateQueries({
          queryKey: queryKeys.onboardingSummary(userId, worldId),
        });
      })
      .catch(() => {
        // Idempotent claim — a transient failure can be retried by reopening the
        // completion screen (the ack does not gate the credit server-side).
      });
  }, [queryClient, userId, villageId, worldId]);

  return { acknowledged, acknowledge };
}
