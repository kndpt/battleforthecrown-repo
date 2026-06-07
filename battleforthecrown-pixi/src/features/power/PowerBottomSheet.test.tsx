import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '@/stores/game';
import { useKingdomPowerQuery, useVillagePowerQuery } from '@/api/queries';
import { PowerBottomSheet } from './PowerBottomSheet';

vi.mock('@/api/queries', () => ({
  useKingdomPowerQuery: vi.fn(),
  useVillagePowerQuery: vi.fn(),
}));

const mockKingdomPowerQuery = vi.mocked(useKingdomPowerQuery);
const mockVillagePowerQuery = vi.mocked(useVillagePowerQuery);

function expectTextContent(pattern: RegExp) {
  expect(
    screen.getAllByText((_content, element) => pattern.test(element?.textContent ?? '')).length,
  ).toBeGreaterThan(0);
}

beforeEach(() => {
  useGameStore.getState().setContext({ villageId: 'v1', worldId: 'w1' });
  mockKingdomPowerQuery.mockReturnValue({
    data: {
      kingdomPower: 6948,
      totalArmy: 2808,
      totalBuildings: 4140,
      userId: 'u1',
      villageCount: 4,
      villages: [
        {
          army: 1492,
          buildings: 1185,
          total: 2677,
          villageId: 'v1',
          villageName: 'Haute Cour',
        },
      ],
    },
    isLoading: false,
  } as ReturnType<typeof useKingdomPowerQuery>);
  mockVillagePowerQuery.mockReturnValue({
    data: {
      army: 1492,
      buildings: 1185,
      total: 2677,
    },
    isLoading: false,
  } as ReturnType<typeof useVillagePowerQuery>);
});

describe('PowerBottomSheet', () => {
  it('explains kingdom power separately from the active village power', () => {
    const { container } = render(<PowerBottomSheet isOpen onClose={() => undefined} />);

    expect(screen.getByText('Puissance du royaume')).toBeInTheDocument();
    expect(screen.getByText('Force cumulée')).toBeInTheDocument();
    expect(screen.getByText('4 villages dans ce monde')).toBeInTheDocument();
    expectTextContent(/^6\s?948$/u);

    expect(screen.getAllByText('Bâtiments').length).toBeGreaterThan(0);
    expectTextContent(/^4\s?140$/u);

    expect(screen.getAllByText('Armée').length).toBeGreaterThan(0);
    expectTextContent(/^2\s?808$/u);

    expect(screen.getByText('Village actif')).toBeInTheDocument();
    expect(screen.getByText('Haute Cour')).toBeInTheDocument();
    expectTextContent(/^2\s?677$/u);
    expectTextContent(/^1\s?185$/u);
    expectTextContent(/^1\s?492$/u);
    expect(container.querySelector('img[src="/assets/power.png"]')).toBeInTheDocument();
    expect(container.querySelector('img[src="/assets/army-power.png"]')).toBeInTheDocument();

    expect(screen.queryByText(/\+1\s?185/u)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+1\s?492/u)).not.toBeInTheDocument();
    expect(screen.queryByText('Niveaux construits')).not.toBeInTheDocument();
    expect(screen.queryByText('Troupes rattachées')).not.toBeInTheDocument();
    expect(screen.queryByText(/% du total/u)).not.toBeInTheDocument();
    expect(screen.queryByText(/% royaume/u)).not.toBeInTheDocument();
    expect(screen.queryByText('Royaume = bâtiments + armée')).not.toBeInTheDocument();
    expect(screen.queryByText('Total village')).not.toBeInTheDocument();
    expect(screen.queryByText(/^sur /u)).not.toBeInTheDocument();
    expect(screen.queryByText(/Le royaume additionne tous vos villages/u)).not.toBeInTheDocument();
    expect(mockVillagePowerQuery).toHaveBeenCalledWith('v1');
  });
});
