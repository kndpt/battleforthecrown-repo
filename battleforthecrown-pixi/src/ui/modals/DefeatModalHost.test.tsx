import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CombatReportDto } from '@/api/queries';
import { useUiStore } from '@/stores/ui';
import { useWorldMapStore } from '@/stores/worldMap';
import { DefeatModalHost } from './DefeatModalHost';

// --- Mocks hoistés ---

const mocks = vi.hoisted(() => ({
  markRead: vi.fn(),
  navigateToWorldMapFocus: vi.fn(),
  reports: [] as CombatReportDto[],
  refetchReports: [] as CombatReportDto[],
}));

vi.mock('@/api/queries', () => ({
  useCombatReportsQuery: () => ({
    data: mocks.reports,
    refetch: () => Promise.resolve({ data: mocks.refetchReports }),
  }),
  useMarkReportReadMutation: () => ({ mutate: mocks.markRead }),
}));

vi.mock('@/features/world/worldMapNavigation', () => ({
  useWorldMapNavigation: () => ({
    navigateToWorldMapFocus: (target: { x: number; y: number }) => {
      // Reproduit le comportement réel : met à jour le store worldMap pour que le test
      // puisse vérifier pendingFocus sans dépendre du routing.
      useWorldMapStore.getState().setPendingFocus(target);
      mocks.navigateToWorldMapFocus(target);
    },
  }),
}));

// --- Fixture report défaite non lu ---

const defeatReport: CombatReportDto = {
  id: 'report-defeat-001',
  worldId: 'world-1',
  attackerVillageId: 'v-attacker',
  attackerVillageName: 'Aubefer',
  attackerX: 10,
  attackerY: 20,
  attackerUserId: 'u-attacker',
  defenderVillageId: 'v-lost-village',
  defenderVillageName: 'Hauterive',
  defenderX: 42,
  defenderY: 58,
  defenderUserId: 'u-defender',
  targetKind: 'PLAYER_VILLAGE',
  targetX: 42,
  targetY: 58,
  loot: { remainingResources: { iron: 0, stone: 0, wood: 0 }, resources: { iron: 0, stone: 0, wood: 0 } },
  totalUnitsAttacker: { WARRIOR: 20 },
  totalUnitsDefender: { MILITIA: 15 },
  lossesAttacker: { WARRIOR: 5 },
  lossesDefender: { MILITIA: 15 },
  details: {
    captureFinalized: {
      villageId: 'v-lost-village',
      villageName: 'Hauterive',
      conquerorName: 'Seigneur Noir',
      visualTier: 3,
      outcome: 'CONQUERED',
    },
  },
  isRead: false,
  isAttacker: false,
  recipientRole: 'defender',
  timestamp: '2026-06-20T10:00:00.000Z',
  createdAt: '2026-06-20T10:00:00.000Z',
};

// --- Setup / teardown ---

beforeEach(() => {
  mocks.reports = [];
  mocks.refetchReports = [];
  mocks.markRead.mockReset();
  mocks.navigateToWorldMapFocus.mockReset();
  useUiStore.getState().clearDefeatItems();
  useWorldMapStore.getState().setPendingFocus(null);
});

afterEach(() => {
  useUiStore.getState().clearDefeatItems();
  useWorldMapStore.getState().setPendingFocus(null);
});

// --- Tests ---

describe('DefeatModalHost', () => {
  it('(a) hydratation boot : affiche le nom du village et le pseudo du conquérant', async () => {
    mocks.reports = [defeatReport];

    render(
      <MemoryRouter>
        <DefeatModalHost />
      </MemoryRouter>,
    );

    // La modal doit apparaître avec le nom du village et le conquérant
    expect(await screen.findByText('Hauterive')).toBeInTheDocument();
    expect(await screen.findByText(/Seigneur Noir/)).toBeInTheDocument();
  });

  it('(b) acquittement : clic Valider → markRead + item retiré du store', async () => {
    mocks.reports = [defeatReport];

    render(
      <MemoryRouter>
        <DefeatModalHost />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Valider' }));

    await waitFor(() => {
      expect(mocks.markRead).toHaveBeenCalledWith({ reportId: 'report-defeat-001' });
    });

    await waitFor(() => {
      expect(useUiStore.getState().defeatItems).toHaveLength(0);
    });
  });

  it('(c) pointer sur la carte : clic CTA → navigateToWorldMapFocus avec x/y du village perdu', async () => {
    mocks.reports = [defeatReport];

    render(
      <MemoryRouter>
        <DefeatModalHost />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Pointer sur la carte' }));

    await waitFor(() => {
      expect(useWorldMapStore.getState().pendingFocus).toEqual({ x: 42, y: 58 });
    });

    // La modal reste ouverte (pas d'acquittement auto sur "Pointer sur la carte")
    expect(useUiStore.getState().defeatItems).toHaveLength(1);
  });

  it('ne rend rien quand defeatItems est vide', () => {
    mocks.reports = [];

    const { container } = render(
      <MemoryRouter>
        <DefeatModalHost />
      </MemoryRouter>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('(a bis) item live poussé manuellement est complété par le reportId au boot', async () => {
    // Simule un item live déjà présent sans reportId
    act(() => {
      useUiStore.getState().pushDefeatItem({
        villageId: 'v-lost-village',
        villageName: 'Hauterive',
        x: 42,
        y: 58,
        conquerorName: 'Seigneur Noir',
        visualTier: 3,
        // pas de reportId → sera fusionné par le boot
      });
    });

    mocks.reports = [defeatReport];

    render(
      <MemoryRouter>
        <DefeatModalHost />
      </MemoryRouter>,
    );

    // Après hydratation, l'item doit avoir le reportId fusionné
    await waitFor(() => {
      const item = useUiStore.getState().defeatItems.find((d) => d.villageId === 'v-lost-village');
      expect(item?.reportId).toBe('report-defeat-001');
    });

    // Un seul item dans le store (dédup par villageId)
    expect(useUiStore.getState().defeatItems).toHaveLength(1);
  });

  it('(d) acquittement d\'un item live sans reportId : refetch résout le reportId puis markRead', async () => {
    // Item live poussé par l'event WS, mais le report n'est PAS encore dans le cache
    // au moment de l'hydratation (reports vides). Un refetch impératif le résout au clic.
    act(() => {
      useUiStore.getState().pushDefeatItem({
        villageId: 'v-lost-village',
        villageName: 'Hauterive',
        x: 42,
        y: 58,
        conquerorName: 'Seigneur Noir',
        visualTier: 3,
        // pas de reportId
      });
    });
    mocks.reports = []; // hydratation ne trouve rien
    mocks.refetchReports = [defeatReport]; // mais le report existe en DB → refetch le trouve

    render(
      <MemoryRouter>
        <DefeatModalHost />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Valider' }));

    await waitFor(() => {
      expect(mocks.markRead).toHaveBeenCalledWith({ reportId: 'report-defeat-001' });
    });
    await waitFor(() => {
      expect(useUiStore.getState().defeatItems).toHaveLength(0);
    });
  });
});
