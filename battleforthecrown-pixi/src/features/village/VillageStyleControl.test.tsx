import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_VILLAGE_STRATEGY,
  getVillageStrategyChangeCost,
  type VillageStrategyType,
} from '@battleforthecrown/shared/village';
import { apiClient, type BuildingDto } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { VillageStyleControl } from './VillageStyleControl';

const councilHall: BuildingDto = {
  id: 'council-1',
  type: 'COUNCIL_HALL',
  level: 1,
  maxLevel: 1,
  populationCost: 4,
  isUnderConstruction: false,
  startTime: null,
  endTime: null,
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderControl(queryClient = makeQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <VillageStyleControl villageId="v1" buildings={[councilHall]} />
    </QueryClientProvider>,
  );
}

function mockApi(stock: { crowns: number; iron: number; stone: number; wood: number }) {
  let currentStrategy: VillageStrategyType = 'BALANCED';

  vi.spyOn(apiClient, 'get').mockImplementation(async (path) => {
    if (path === '/village/strategy') {
      return {
        currentStrategy,
        lastChangedAt: '2026-05-12T10:00:00.000Z',
        cooldownEndsAt: null,
        canChange: true,
        changeCost: 80,
        changeCosts: {
          FORTRESS: getVillageStrategyChangeCost('FORTRESS', 4),
          RAIDERS: getVillageStrategyChangeCost('RAIDERS', 4),
          ECONOMIC: getVillageStrategyChangeCost('ECONOMIC', 4),
          BALANCED: getVillageStrategyChangeCost('BALANCED', 4),
        },
        hasCouncilHall: true,
        strategies: DEFAULT_VILLAGE_STRATEGY.strategies,
      };
    }
    if (path === '/resources/v1') {
      return {
        wood: stock.wood,
        stone: stock.stone,
        iron: stock.iron,
        maxPerType: 1000,
        lastUpdateTs: '2026-05-12T10:00:00.000Z',
        productionRates: { wood: 60, stone: 60, iron: 60 },
      };
    }
    if (path === '/crowns/w1') {
      return { balance: stock.crowns, productionRate: 1 };
    }
    throw new Error(`Unexpected GET ${path}`);
  });

  vi.spyOn(apiClient, 'post').mockImplementation(async (_path, body) => {
    currentStrategy = (body as { strategy: VillageStrategyType }).strategy;
    return {
      success: true,
      newStrategy: currentStrategy,
      cost: getVillageStrategyChangeCost(currentStrategy, 4),
      cooldownEndsAt: '2026-05-13T10:00:00.000Z',
      message: 'Strategy changed',
    };
  });
}

beforeEach(() => {
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

describe('VillageStyleControl', () => {
  it('renders backend strategy costs and blocks unaffordable targets', async () => {
    mockApi({ crowns: 60, iron: 180, stone: 940, wood: 1820 });
    renderControl();

    fireEvent.click(await screen.findByRole('button', { name: /voie du village/i }));
    fireEvent.click(screen.getByLabelText('Voie suivante'));
    fireEvent.click(screen.getByLabelText('Voie suivante'));

    expect(await screen.findAllByText('Raiders')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: /Adopter — Raiders/i })).toBeDisabled();
    expect(screen.getByText('Ressources insuffisantes')).toBeInTheDocument();
  });

  it('updates the selected style after a successful backend mutation and reloads from API state', async () => {
    mockApi({ crowns: 500, iron: 500, stone: 500, wood: 500 });
    const firstClient = makeQueryClient();
    const { unmount } = renderControl(firstClient);

    fireEvent.click(await screen.findByRole('button', { name: /voie du village/i }));
    fireEvent.click(screen.getByLabelText('Voie précédente'));
    fireEvent.click(await screen.findByRole('button', { name: /Adopter — Économique/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Économique/i })).toBeInTheDocument();
    });
    expect(apiClient.post).toHaveBeenCalledWith('/village/v1/strategy', { strategy: 'ECONOMIC' });

    unmount();
    renderControl(makeQueryClient());

    expect(await screen.findByRole('button', { name: /Économique/i })).toBeInTheDocument();
  });
});
