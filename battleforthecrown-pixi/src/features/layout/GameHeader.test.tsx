import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, type JoinedVillage } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { GameHeader } from './GameHeader';

const villages: JoinedVillage[] = [
  {
    id: 'v1',
    isCapital: true,
    name: 'Haute Cour',
    userId: 'u1',
    worldId: 'w1',
    x: 10,
    y: 12,
  },
  {
    id: 'v2',
    label: 'DEFENSIVE',
    name: 'Marche Nord',
    userId: 'u1',
    worldId: 'w1',
    x: 13,
    y: 15,
  },
];

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function mockApi() {
  vi.spyOn(apiClient, 'get').mockImplementation(async (path) => {
    if (path === '/village') return villages;
    if (path === '/population') return { max: 120, used: 42 };
    if (path === '/power/kingdom') {
      return {
        kingdomPower: 320,
        totalArmy: 120,
        totalBuildings: 200,
        userId: 'u1',
        villageCount: 2,
        villages: [
          {
            army: 20,
            buildings: 200,
            total: 220,
            villageId: 'v1',
            villageName: 'Haute Cour',
          },
          {
            army: 30,
            buildings: 70,
            total: 100,
            villageId: 'v2',
            villageName: 'Marche Nord',
          },
        ],
      };
    }
    throw new Error(`Unexpected GET ${path}`);
  });
}

function renderHeader() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <GameHeader />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockApi();
  useAuthStore.getState().setSession({
    accessToken: 'access',
    refreshToken: 'refresh',
    user: { id: 'u1', email: 'u@example.test' },
  });
  useGameStore.getState().setContext({ worldId: 'w1', villageId: 'v1' });
});

afterEach(() => {
  vi.restoreAllMocks();
  useAuthStore.getState().clearSession();
  useGameStore.getState().clear();
});

describe('GameHeader multi-village selector', () => {
  it('opens the bottom sheet from the village name and selects a village without rendering the old inline menu', async () => {
    renderHeader();

    const selector = await screen.findByRole('button', { name: 'Choisir le village actif' });
    fireEvent.click(selector);

    expect(screen.getByText('Mes villages')).toBeInTheDocument();
    expect(screen.getByText('Haute Cour')).toBeInTheDocument();
    expect(screen.getByText('Marche Nord')).toBeInTheDocument();
    expect(screen.getByText('Capitale')).toBeInTheDocument();
    expect(screen.getByText('Défensif')).toBeInTheDocument();
    expect(screen.getByText('10:12')).toBeInTheDocument();
    expect(screen.getByText('220')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trier' })).toBeInTheDocument();
    expect(screen.queryByText('Construction')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Marche Nord/i }));

    await waitFor(() => {
      expect(useGameStore.getState().villageId).toBe('v2');
    });
    await waitFor(() => {
      expect(selector).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('keeps arrows as direct village switches and does not open the bottom sheet', async () => {
    renderHeader();

    const selector = await screen.findByRole('button', { name: 'Choisir le village actif' });
    fireEvent.click(await screen.findByRole('button', { name: 'Village suivant' }));

    await waitFor(() => {
      expect(useGameStore.getState().villageId).toBe('v2');
    });
    expect(selector).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Village précédent' }));

    await waitFor(() => {
      expect(useGameStore.getState().villageId).toBe('v1');
    });
    expect(selector).toHaveAttribute('aria-expanded', 'false');
  });
});
