import {
  useCaravanReportsQuery,
  useCombatReportsQuery,
  useReinforcementReportsQuery,
  useScoutReportsQuery,
} from '@/api/queries';

/**
 * Returns the number of unread combat reports for the current user.
 * Used by the bottom navigation bar to show a red bubble on the Messages tab.
 */
export function useUnreadReportsCount(): number {
  const combatReports = useCombatReportsQuery();
  const scoutReports = useScoutReportsQuery();
  const reinforcementReports = useReinforcementReportsQuery();
  const caravanReports = useCaravanReportsQuery();
  return (
    (combatReports.data ?? []).filter((r) => !r.isRead).length +
    (scoutReports.data ?? []).filter((r) => !r.isRead).length +
    (reinforcementReports.data ?? []).filter((r) => !r.isRead).length +
    (caravanReports.data ?? []).filter((r) => !r.isRead).length
  );
}
