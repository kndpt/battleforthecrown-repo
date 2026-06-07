import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CombatReportDto } from '@/api/queries';
import { ReportDetailModal } from './ReportDetailModal';

const mocks = vi.hoisted(() => ({
  deleteReport: vi.fn(),
  markCombatRead: vi.fn(),
  markReinforcementRead: vi.fn(),
  markScoutRead: vi.fn(),
  navigateToWorldMapFocus: vi.fn(),
}));

const combatReport: CombatReportDto = {
  id: 'abcdef123456',
  worldId: 'world-1',
  attackerVillageId: 'v-attacker',
  attackerVillageName: 'Aubefer',
  attackerX: 10,
  attackerY: 20,
  attackerUserId: 'u-attacker',
  defenderVillageId: 'v-defender',
  defenderVillageName: 'Hauterive',
  defenderX: 12,
  defenderY: 34,
  defenderUserId: 'u-defender',
  targetKind: 'PLAYER_VILLAGE',
  targetX: 12,
  targetY: 34,
  loot: {
    remainingResources: { iron: 0, stone: 50, wood: 100 },
    resources: { iron: 0, stone: 25, wood: 75 },
  },
  totalUnitsAttacker: { ARCHER: 10, WARRIOR: 20 },
  totalUnitsDefender: { MILITIA: 15 },
  lossesAttacker: { ARCHER: 2, WARRIOR: 20 },
  lossesDefender: { MILITIA: 15 },
  details: { targetTier: null },
  isRead: false,
  isAttacker: true,
  timestamp: '2026-05-12T10:00:00.000Z',
  createdAt: '2026-05-12T10:00:00.000Z',
};

vi.mock('@/api/queries', () => ({
  useCombatReportQuery: () => ({ data: combatReport, error: null, isLoading: false }),
  useDeleteReportMutation: () => ({ mutateAsync: mocks.deleteReport }),
  useDeleteReinforcementReportMutation: () => ({ mutateAsync: mocks.deleteReport }),
  useDeleteScoutReportMutation: () => ({ mutateAsync: mocks.deleteReport }),
  useMarkReinforcementReportReadMutation: () => ({ mutate: mocks.markReinforcementRead }),
  useMarkReportReadMutation: () => ({ mutate: mocks.markCombatRead }),
  useMarkScoutReportReadMutation: () => ({ mutate: mocks.markScoutRead }),
  useReinforcementReportQuery: () => ({ data: null, error: null, isLoading: false }),
  useScoutReportQuery: () => ({ data: null, error: null, isLoading: false }),
}));

vi.mock('@/features/world/worldMapNavigation', () => ({
  useWorldMapNavigation: () => ({
    navigateToWorldMapFocus: mocks.navigateToWorldMapFocus,
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('ReportDetailModal', () => {
  it('opens the world map focused on the combat report target', async () => {
    const onClose = vi.fn();

    render(<ReportDetailModal reportId={combatReport.id} reportKind="combat" onClose={onClose} />);

    expect(screen.queryByRole('button', { name: 'Carte' })).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', {
      name: 'Voir Hauterive en 12|34',
    }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mocks.navigateToWorldMapFocus).toHaveBeenCalledWith({ x: 12, y: 34 });
    await waitFor(() => {
      expect(mocks.markCombatRead).toHaveBeenCalledWith({ reportId: combatReport.id });
    });
  });
});
