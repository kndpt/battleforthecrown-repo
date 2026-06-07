import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useWorldMapStore } from '@/stores/worldMap';
import { useUiStore } from '@/stores/ui';
import { VictoryModalHost } from './VictoryModalHost';

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

beforeEach(() => {
  useUiStore.getState().clearVictoryModals();
  useWorldMapStore.getState().setPendingFocus(null);
});

afterEach(() => {
  useUiStore.getState().clearVictoryModals();
  useWorldMapStore.getState().setPendingFocus(null);
});

describe('VictoryModalHost', () => {
  it('dismisses the conquest modal and navigates to the focused world map', async () => {
    act(() => {
      useUiStore.getState().pushVictoryModal({
        buildingsKept: 5,
        previousTier: 'T2',
        villageId: 'v-target',
        villageName: 'Cravia',
        x: 45,
        y: 67,
      });
    });

    render(
      <MemoryRouter initialEntries={['/game/reports?tab=combat']}>
        <VictoryModalHost />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Voir le village' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/game/world?focusX=45&focusY=67');
    });
    expect(useWorldMapStore.getState().pendingFocus).toEqual({ x: 45, y: 67 });
    expect(useUiStore.getState().victoryModals).toHaveLength(0);
  });
});
