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
  const now = Date.now();
  const inOneMinute = new Date(now + 60_000).toISOString();
  const inTwoMinutes = new Date(now + 120_000).toISOString();

  vi.spyOn(apiClient, 'get').mockImplementation(async (path, options) => {
    if (path === '/village') return villages;
    if (path === '/population') {
      const id = (options as { query?: { villageId?: string } } | undefined)?.query?.villageId;
      return id === 'v2' ? { available: 88, max: 180, used: 92 } : { available: 78, max: 120, used: 42 };
    }
    if (path === '/resources/v1') {
      return {
        iron: 3200,
        lastUpdateTs: new Date(now).toISOString(),
        maxPerType: 5000,
        productionRates: { iron: 10, stone: 10, wood: 10 },
        stone: 2500,
        wood: 4500,
      };
    }
    if (path === '/resources/v2') {
      return {
        iron: 1400,
        lastUpdateTs: new Date(now).toISOString(),
        maxPerType: 3000,
        productionRates: { iron: 10, stone: 10, wood: 10 },
        stone: 1850,
        wood: 2200,
      };
    }
    if (path === '/village/buildings') {
      const id = (options as { query?: { villageId?: string } } | undefined)?.query?.villageId;
      return [
        {
          endTime: null,
          id: `castle-${id}`,
          isUnderConstruction: false,
          level: id === 'v2' ? 3 : 5,
          maxLevel: 10,
          populationCost: 0,
          startTime: null,
          type: 'CASTLE',
        },
      ];
    }
    if (path === '/village/queue') {
      const id = (options as { query?: { villageId?: string } } | undefined)?.query?.villageId;
      return id === 'v1'
        ? [{ endTime: inOneMinute, id: 'queue-1', level: 4, startTime: new Date(now - 60_000).toISOString(), type: 'WOOD' }]
        : [];
    }
    if (path === '/village/strategy') {
      const id = (options as { query?: { villageId?: string } } | undefined)?.query?.villageId;
      return {
        canChange: true,
        changeCost: 0,
        changeCosts: {},
        cooldownEndsAt: null,
        currentStrategy: id === 'v2' ? 'ECONOMIC' : 'FORTRESS',
        hasCouncilHall: true,
        lastChangedAt: new Date(now).toISOString(),
        strategies: {},
      };
    }
    if (path === '/army/v1/training') {
      return [
        {
          completedQty: 0,
          createdAt: new Date(now - 60_000).toISOString(),
          id: 'training-1',
          nextUnitEta: inTwoMinutes,
          timePerUnitMs: 180_000,
          totalQty: 3,
          unitType: 'MILITIA',
          villageId: 'v1',
        },
      ];
    }
    if (path === '/army/v2/training') {
      return [
        {
          completedQty: 0,
          createdAt: new Date(now - 60_000).toISOString(),
          id: 'training-2',
          nextUnitEta: inTwoMinutes,
          timePerUnitMs: 180_000,
          totalQty: 1,
          unitType: 'NOBLE',
          villageId: 'v2',
        },
      ];
    }
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
    expect(await screen.findByText('10:12')).toBeInTheDocument();
    expect(await screen.findByText('220')).toBeInTheDocument();
    expect(await screen.findByText('4.5K')).toBeInTheDocument();
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(await screen.findByTitle('Forteresse')).toBeInTheDocument();
    expect(await screen.findByTitle(/Chantier · 1:00/)).toBeInTheDocument();
    expect(await screen.findByTitle(/Formation · 8:00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trier' })).toBeInTheDocument();

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
