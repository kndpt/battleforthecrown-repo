import { useCombatReportsQuery } from '@/api/queries';
import { useAuthStore } from '@/stores/auth';

/**
 * Returns the number of unread combat reports for the current user.
 * Used by the bottom navigation bar to show a red bubble on the Messages tab.
 */
export function useUnreadReportsCount(): number {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const reports = useCombatReportsQuery(userId);
  if (!reports.data) return 0;
  return reports.data.filter((r) => !r.isRead).length;
}
