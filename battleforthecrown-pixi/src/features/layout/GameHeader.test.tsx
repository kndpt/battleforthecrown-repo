import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, type JoinedVillage } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useCrownsStore } from '@/stores/crowns';
import { useGameStore } from '@/stores/game';
import { useResourcesStore } from '@/stores/resources';
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
const defaultPopulationByVillageId = {
  v1: { available: 78, max: 120, used: 42 },
  v2: { available: 88, max: 180, used: 92 },
};
let populationByVillageId: typeof defaultPopulationByVillageId;

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
    if (path === '/world/me/memberships') {
      return [
        {
          joinedAt: new Date(now - 3_600_000).toISOString(),
          lastLoginAt: new Date(now).toISOString(),
          role: 'PLAYER',
          villageCount: 2,
          worldId: 'w1',
          worldName: 'Avalon Test',
        },
      ];
    }
    if (path === '/worlds/public') {
      return [
        {
          id: 'w1',
          identity: {
            displayName: 'Solstice',
            sigil: 'star',
            tagline: 'Le royaume vient d’ouvrir ses portes.',
            themeColor: 'azure',
            tier: 'DEBUTANTS',
          },
          joinedCount: 1,
          lifecycle: {
            day: 1,
            endsAt: new Date(now + 60 * 86_400_000).toISOString(),
            inscriptionPhase: 'main',
            plannedOpenAt: null,
            startedAt: new Date(now - 3_600_000).toISOString(),
            totalDays: 60,
          },
          map: {
            gridHeight: 500,
            gridWidth: 500,
          },
          status: 'OPEN',
          tempoProfile: 'standard',
        },
      ];
    }
    if (path === '/population') {
      const id = (options as { query?: { villageId?: string } } | undefined)?.query?.villageId;
      return id === 'v2' ? populationByVillageId.v2 : populationByVillageId.v1;
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

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location-path">{location.pathname}</div>;
}

function renderHeader(initialPath = '/game') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={makeQueryClient()}>
        <GameHeader />
        <LocationProbe />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function installPointerCaptureStubs() {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: vi.fn(() => true),
  });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
}

beforeEach(() => {
  installPointerCaptureStubs();
  populationByVillageId = {
    v1: { ...defaultPopulationByVillageId.v1 },
    v2: { ...defaultPopulationByVillageId.v2 },
  };
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
  useCrownsStore.getState().clear();
  useResourcesStore.getState().clear();
});

describe('GameHeader multi-village selector', () => {
  it('renders header resources and available population with compact lowercase values', async () => {
    const now = Date.now();
    populationByVillageId.v1 = { available: 13000000, max: 15000000, used: 2000000 };
    useCrownsStore.getState().setCrowns({
      balance: 12000,
      lastUpdateTs: now,
      productionRate: 0,
      userId: 'u1',
      worldId: 'w1',
    });
    useResourcesStore.getState().setResources({
      iron: 120000,
      lastUpdateTs: now,
      maxPerType: 200000,
      productionRates: { iron: 0, stone: 0, wood: 0 },
      stone: 12000,
      villageId: 'v1',
      wood: 1499,
    });

    renderHeader();

    expect(await screen.findByLabelText('Bois 1k')).toBeInTheDocument();
    expect(await screen.findByLabelText('Pierre 12k')).toBeInTheDocument();
    expect(await screen.findByLabelText('Fer 120k')).toBeInTheDocument();
    expect(await screen.findByLabelText('Population 13m')).toBeInTheDocument();
    expect(await screen.findByLabelText(/^Couronnes 12\s000$/u)).toBeInTheDocument();
    expect(screen.queryByLabelText('Population 2m')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Population 15m')).not.toBeInTheDocument();

    act(() => {
      useResourcesStore.getState().setResources({
        iron: 120000,
        lastUpdateTs: now,
        maxPerType: 2000000,
        productionRates: { iron: 0, stone: 0, wood: 0 },
        stone: 12000,
        villageId: 'v1',
        wood: 1000000,
      });
    });

    expect(await screen.findByLabelText('Bois 1m')).toBeInTheDocument();
  });

  it('renders population as available in the header', async () => {
    renderHeader();

    expect(await screen.findByLabelText('Population 78')).toBeInTheDocument();
    expect(screen.queryByLabelText('Population 42/120')).not.toBeInTheDocument();
  });

  it('opens the bottom sheet from the village name and selects a village without rendering the old inline menu', async () => {
    const { container } = renderHeader();

    const selector = await screen.findByRole('button', { name: 'Choisir le village actif' });
    fireEvent.click(selector);

    expect(screen.getByText('Mes villages')).toBeInTheDocument();
    expect(container.querySelector('[style*="max-height: 68vh"]')).toBeInTheDocument();
    expect(screen.getAllByText('Haute Cour').length).toBeGreaterThan(0);
    expect(screen.getByText('Marche Nord')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ouvrir Capitale' })).not.toBeInTheDocument();
    expect(screen.getByText('Défensif')).toBeInTheDocument();
    expect(await screen.findByText('10:12')).toBeInTheDocument();
    expect(await screen.findByText((content, element) =>
      content === '220' && element?.tagName.toLowerCase() === 'b',
    )).toBeInTheDocument();
    expect(await screen.findByText('4.5K')).toBeInTheDocument();
    expect((await screen.findAllByText('78')).length).toBeGreaterThan(0);
    expect(await screen.findByTitle('Forteresse')).toBeInTheDocument();
    expect(await screen.findByTitle(/Chantier · 1:00/)).toBeInTheDocument();
    expect(await screen.findByTitle(/Formation · 8:00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trier' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir Marche Nord' }));

    await waitFor(() => {
      expect(useGameStore.getState().villageId).toBe('v2');
    });
    await waitFor(() => {
      expect(selector).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('closes the multi-village sheet from a swipe on its header', async () => {
    renderHeader();

    const selector = await screen.findByRole('button', { name: 'Choisir le village actif' });
    fireEvent.click(selector);

    const dragRegion = await screen.findByText('Domaines du royaume');
    fireEvent.pointerDown(dragRegion, { clientY: 20, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(dragRegion, { clientY: 150, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(dragRegion, { clientY: 150, pointerId: 1, pointerType: 'touch' });

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

  it('opens the matching view when an activity timer is clicked', async () => {
    renderHeader('/game/army');

    fireEvent.click(await screen.findByRole('button', { name: 'Choisir le village actif' }));
    fireEvent.click(await screen.findByRole('button', { name: /Chantier · 1:00/ }));

    await waitFor(() => {
      expect(useGameStore.getState().villageId).toBe('v1');
    });
    await waitFor(() => {
      expect(screen.getByTestId('location-path')).toHaveTextContent('/game');
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Choisir le village actif' }));
    fireEvent.click(await screen.findByRole('button', { name: /Seigneur · 2:00/ }));

    await waitFor(() => {
      expect(useGameStore.getState().villageId).toBe('v2');
    });
    await waitFor(() => {
      expect(screen.getByTestId('location-path')).toHaveTextContent('/game/army');
    });
  });
});

describe('GameHeader player profile sheet', () => {
  it('opens and closes the player profile from the avatar without changing route or active village', async () => {
    const { container } = renderHeader('/game/army');

    const profileButton = await screen.findByRole('button', { name: 'Profil joueur' });

    expect(profileButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(profileButton).toHaveAttribute('aria-expanded', 'true');
    });
    expect(container.querySelector('[style*="max-height: 64vh"]')).toBeInTheDocument();
    expect(await screen.findByText('u@example.test')).toBeInTheDocument();
    expect(await screen.findByText('Solstice')).toBeInTheDocument();
    expect(await screen.findByText('Inscription ouverte')).toBeInTheDocument();
    expect(await screen.findByText('✦')).toBeInTheDocument();
    expect(await screen.findByText((_content, element) =>
      element?.textContent === 'J+1 / 60',
    )).toBeInTheDocument();
    expect(await screen.findByText((_content, element) =>
      element?.tagName.toLowerCase() === 'span'
        && (element.textContent?.includes('Sans tribu') ?? false),
    )).toBeInTheDocument();
    expect(screen.getAllByText('À venir').length).toBeGreaterThan(0);
    expect(apiClient.get).not.toHaveBeenCalledWith('/village/buildings', expect.anything());

    const overlays = container.querySelectorAll('.fixed > .absolute.inset-0.bg-black');
    fireEvent.click(overlays[overlays.length - 1] as Element);

    await waitFor(() => {
      expect(profileButton).toHaveAttribute('aria-expanded', 'false');
    });
    expect(useGameStore.getState().villageId).toBe('v1');
    expect(screen.getByTestId('location-path')).toHaveTextContent('/game/army');
  });

  it('closes the player profile sheet from a swipe on its header', async () => {
    renderHeader();

    const profileButton = await screen.findByRole('button', { name: 'Profil joueur' });
    fireEvent.click(profileButton);

    const dragRegion = await screen.findByText('u@example.test');
    fireEvent.pointerDown(dragRegion, { clientY: 20, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(dragRegion, { clientY: 150, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(dragRegion, { clientY: 150, pointerId: 1, pointerType: 'touch' });

    await waitFor(() => {
      expect(profileButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('selects an owned village from the profile villages tab', async () => {
    renderHeader();

    const profileButton = await screen.findByRole('button', { name: 'Profil joueur' });
    fireEvent.click(profileButton);
    fireEvent.click(await screen.findByRole('button', { name: 'Villages' }));
    const marcheNord = await screen.findByRole('button', { name: 'Sélectionner Marche Nord' });

    expect(marcheNord).toHaveTextContent('Défensif');
    fireEvent.click(marcheNord);

    await waitFor(() => {
      expect(useGameStore.getState().villageId).toBe('v2');
    });
    await waitFor(() => {
      expect(profileButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('opens the worlds selection screen from the profile world block', async () => {
    renderHeader('/game');

    const profileButton = await screen.findByRole('button', { name: 'Profil joueur' });
    fireEvent.click(profileButton);
    fireEvent.click(await screen.findByRole('button', { name: 'Voir les royaumes depuis Solstice' }));

    await waitFor(() => {
      expect(screen.getByTestId('location-path')).toHaveTextContent('/worlds');
    });
    await waitFor(() => {
      expect(profileButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('logs out from the profile settings using the existing session cleanup', async () => {
    renderHeader();

    fireEvent.click(await screen.findByRole('button', { name: 'Profil joueur' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Réglages' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quitter la session' }));

    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull();
      expect(useGameStore.getState().worldId).toBeNull();
      expect(useGameStore.getState().villageId).toBeNull();
    });
  });
});
