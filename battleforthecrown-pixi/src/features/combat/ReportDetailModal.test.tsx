import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api';
import type { CombatReportDto } from '@/api/queries';
import type { CaravanReportResponse } from '@battleforthecrown/shared/combat';
import { useUiStore } from '@/stores/ui';
import { ReportDetailModal } from './ReportDetailModal';
import { useReportLifecycle } from './useReportLifecycle';

const mocks = vi.hoisted(() => ({
  deleteReport: vi.fn(),
  markCaravanRead: vi.fn(),
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

const caravanReport: CaravanReportResponse = {
  id: 'caravan-report-123456',
  worldId: 'world-1',
  expeditionId: 'expedition-1',
  type: 'ARRIVED',
  originVillageId: 'v-origin',
  originVillageName: 'Aubefer',
  originX: 10,
  originY: 20,
  targetVillageId: 'v-target',
  targetVillageName: 'Hauterive',
  targetX: 12,
  targetY: 34,
  resources: { iron: 0, stone: 25, wood: 75 },
  credited: { iron: 0, stone: 25, wood: 70 },
  returned: { iron: 0, stone: 0, wood: 0 },
  lost: { iron: 0, stone: 0, wood: 5 },
  porters: 2,
  recalled: false,
  timestamp: '2026-05-12T10:00:00.000Z',
  isRead: false,
};

vi.mock('@/api/queries', () => ({
  useCaravanReportQuery: () => ({ data: caravanReport, error: null, isLoading: false }),
  useCombatReportQuery: () => ({ data: combatReport, error: null, isLoading: false }),
  useDeleteCaravanReportMutation: () => ({ mutateAsync: mocks.deleteReport }),
  useDeleteReportMutation: () => ({ mutateAsync: mocks.deleteReport }),
  useDeleteReinforcementReportMutation: () => ({ mutateAsync: mocks.deleteReport }),
  useDeleteScoutReportMutation: () => ({ mutateAsync: mocks.deleteReport }),
  useMarkCaravanReportReadMutation: () => ({ mutate: mocks.markCaravanRead }),
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
  useUiStore.getState().clearToasts();
});

describe('useReportLifecycle', () => {
  it('calls markRead only when isRead is false', () => {
    const markRead = vi.fn();
    const opts = {
      reportId: 'r1',
      isRead: false as boolean | undefined,
      markRead,
      deleteAsync: vi.fn(),
      onClose: vi.fn(),
      deleteErrorLabel: 'err',
    };

    const { rerender } = renderHook(
      (props) => useReportLifecycle(props),
      { initialProps: opts },
    );
    expect(markRead).toHaveBeenCalledWith({ reportId: 'r1' });

    markRead.mockClear();
    rerender({ ...opts, isRead: true });
    expect(markRead).not.toHaveBeenCalled();

    markRead.mockClear();
    rerender({ ...opts, isRead: undefined });
    expect(markRead).not.toHaveBeenCalled();
  });

  it('calls onClose after successful delete', async () => {
    const onClose = vi.fn();
    const deleteAsync = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useReportLifecycle({
        reportId: 'r1',
        isRead: true,
        markRead: vi.fn(),
        deleteAsync,
        onClose,
        deleteErrorLabel: 'err',
      }),
    );

    await act(() => result.current.handleDelete());

    expect(deleteAsync).toHaveBeenCalledWith({ reportId: 'r1' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(result.current.isDeleting).toBe(false);
  });

  it('pushes error toast and resets isDeleting on delete failure', async () => {
    const onClose = vi.fn();
    const deleteAsync = vi.fn().mockRejectedValue(new ApiError('Not found', 404));
    const { result } = renderHook(() =>
      useReportLifecycle({
        reportId: 'r1',
        isRead: true,
        markRead: vi.fn(),
        deleteAsync,
        onClose,
        deleteErrorLabel: 'Suppression échouée',
      }),
    );

    await act(() => result.current.handleDelete());

    expect(onClose).not.toHaveBeenCalled();
    expect(result.current.isDeleting).toBe(false);
    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].tone).toBe('error');
    expect(toasts[0].description).toBe('Not found');
  });

  it('uses fallback label when error is not ApiError', async () => {
    const deleteAsync = vi.fn().mockRejectedValue(new Error('network'));
    const { result } = renderHook(() =>
      useReportLifecycle({
        reportId: 'r1',
        isRead: true,
        markRead: vi.fn(),
        deleteAsync,
        onClose: vi.fn(),
        deleteErrorLabel: 'Fallback message',
      }),
    );

    await act(() => result.current.handleDelete());

    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].description).toBe('Fallback message');
  });
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

  it('renders a caravan report without raw identifiers and uses caravan actions', async () => {
    const onClose = vi.fn();
    mocks.deleteReport.mockResolvedValue(undefined);

    render(<ReportDetailModal reportId={caravanReport.id} reportKind="caravan" onClose={onClose} />);

    expect(await screen.findByText('Livraison partielle')).toBeInTheDocument();
    expect(screen.queryByText('Rapport caravane')).not.toBeInTheDocument();
    expect(screen.queryByText('Livraison vers Hauterive')).not.toBeInTheDocument();
    expect(screen.getByText('Bilan des ressources')).toBeInTheDocument();
    expect(screen.getByText('Entrepôt plein')).toBeInTheDocument();
    expect(screen.getByText("95 ressources ont été livrées. 5 n'ont pas pu entrer dans l'Entrepôt.")).toBeInTheDocument();
    expect(screen.getByText('5 perdues')).toBeInTheDocument();
    expect(screen.queryByText('Créditées')).not.toBeInTheDocument();
    expect(screen.queryByText('Envoyées')).not.toBeInTheDocument();
    expect(screen.queryByText(caravanReport.id)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.markCaravanRead).toHaveBeenCalledWith({ reportId: caravanReport.id });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le rapport de caravane' }));

    await waitFor(() => {
      expect(mocks.deleteReport).toHaveBeenCalledWith({ reportId: caravanReport.id });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows an error toast when caravan report deletion fails', async () => {
    const onClose = vi.fn();
    mocks.deleteReport.mockRejectedValue(new ApiError('Rapport introuvable', 404));

    render(<ReportDetailModal reportId={caravanReport.id} reportKind="caravan" onClose={onClose} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Supprimer le rapport de caravane' }));

    await waitFor(() => {
      expect(mocks.deleteReport).toHaveBeenCalledWith({ reportId: caravanReport.id });
      expect(onClose).not.toHaveBeenCalled();
      const toasts = useUiStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].tone).toBe('error');
      expect(toasts[0].title).toBe('Suppression impossible');
      expect(toasts[0].description).toBe('Rapport introuvable');
    });
  });
});
