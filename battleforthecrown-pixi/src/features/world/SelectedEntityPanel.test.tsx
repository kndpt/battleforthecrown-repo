import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { apiClient } from '@/api';
import type { MapEntity } from '@/api/world-types';
import { SelectedEntityPanel } from './SelectedEntityPanel';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderPanel(
  entity: MapEntity,
  currentVillageId = 'active-village',
  overrides: Partial<ComponentProps<typeof SelectedEntityPanel>> = {},
) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <SelectedEntityPanel
        currentVillageId={currentVillageId}
        entity={entity}
        onAttack={() => undefined}
        {...overrides}
      />
    </QueryClientProvider>,
  );
}

function playerVillage(overrides: Partial<MapEntity> = {}): MapEntity {
  return {
    id: 'village-1',
    isMine: true,
    kind: 'PLAYER_VILLAGE',
    name: 'Boisjoli',
    tier: null,
    x: 10,
    y: 20,
    ...overrides,
  };
}

function mockTroopApi({
  garrison = [],
  inventory = [],
}: {
  garrison?: unknown[];
  inventory?: unknown[];
}) {
  return vi.spyOn(apiClient, 'get').mockImplementation(async (path) => {
    if (path === '/army/village-1/inventory') return inventory;
    if (path === '/combat/village-1/garrison') return garrison;
    throw new Error(`Unexpected GET ${path}`);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SelectedEntityPanel owned village troops', () => {
  it('shows native troops plus incoming reinforcements on an owned inactive village', async () => {
    mockTroopApi({
      inventory: [{ id: 'militia-1', type: 'MILITIA', quantity: 12, populationCost: 1 }],
      garrison: [
        {
          direction: 'INCOMING',
          hostVillageName: 'Boisjoli',
          originVillageId: 'origin-1',
          originVillageName: 'Origin',
          quantity: 8,
          unitType: 'MILITIA',
          villageId: 'village-1',
        },
      ],
    });

    renderPanel(playerVillage(), 'another-village');

    expect(await screen.findByText('Milice de paysans')).toBeInTheDocument();
    expect(screen.getByText('Troupes présentes')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Renforcer/i })).toBeInTheDocument();
  });

  it('shows a go-to action on an owned inactive village', async () => {
    const onGoToVillage = vi.fn();
    mockTroopApi({});

    renderPanel(playerVillage(), 'another-village', { onGoToVillage });

    const button = await screen.findByRole('button', { name: /Aller à ce village/i });
    fireEvent.click(button);

    expect(onGoToVillage).toHaveBeenCalledWith(expect.objectContaining({ id: 'village-1' }));
  });

  it('shows troops on the active village without the reinforce action', async () => {
    mockTroopApi({
      inventory: [{ id: 'archer-1', type: 'ARCHER', quantity: 4, populationCost: 1 }],
    });

    renderPanel(playerVillage(), 'village-1', { onGoToVillage: vi.fn() });

    expect(await screen.findByText('Archer')).toBeInTheDocument();
    expect(screen.getByText('Troupes présentes')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Renforcer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aller à ce village/i })).not.toBeInTheDocument();
  });

  it('shows an explicit empty state for an owned empty village', async () => {
    mockTroopApi({});

    renderPanel(playerVillage());

    expect(await screen.findByText('Aucune troupe')).toBeInTheDocument();
  });

  it('does not fetch or show troop sections for a village the player does not own', async () => {
    const getSpy = vi.spyOn(apiClient, 'get');

    renderPanel(playerVillage({ id: 'enemy-1', isMine: false }), 'village-1', { onGoToVillage: vi.fn() });

    expect(screen.queryByText('Troupes présentes')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aller à ce village/i })).not.toBeInTheDocument();
    await waitFor(() => expect(getSpy).not.toHaveBeenCalled());
  });
});
