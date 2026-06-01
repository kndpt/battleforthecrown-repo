import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { GameShellLayout } from './GameShellLayout';

vi.mock('@/features/combat/useUnreadReportsCount', () => ({
  useUnreadReportsCount: () => 7,
}));

vi.mock('@/features/power/PowerBottomSheet', () => ({
  PowerBottomSheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="power-sheet" /> : null,
}));

vi.mock('./GameHeader', () => ({
  GameHeader: ({
    onPowerClick,
  }: {
    onPowerClick?: () => void;
  }) => (
    <header data-testid="game-header">
      <button onClick={onPowerClick} type="button">
        power
      </button>
    </header>
  ),
}));

vi.mock('./BottomNavigationBar', () => ({
  BottomNavigationBar: ({
    activeTab,
    onArmyClick,
    onBuildingsClick,
    onMessagesClick,
    onWorldClick,
    unreadCount,
  }: {
    activeTab?: string;
    onArmyClick?: () => void;
    onBuildingsClick: () => void;
    onMessagesClick?: () => void;
    onWorldClick?: () => void;
    unreadCount?: number;
  }) => (
    <nav data-active-tab={activeTab} data-testid="bottom-nav" data-unread={unreadCount}>
      <button onClick={onBuildingsClick} type="button">
        buildings
      </button>
      <button onClick={onArmyClick} type="button">
        army
      </button>
      <button onClick={onMessagesClick} type="button">
        messages
      </button>
      <button onClick={onWorldClick} type="button">
        world
      </button>
    </nav>
  ),
}));

vi.mock('./ToastStack', () => ({
  ToastStack: () => <div data-testid="toast-stack" />,
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderGameShell(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<GameShellLayout />}>
          <Route path="/game" element={<LocationProbe />} />
          <Route path="/game/world" element={<LocationProbe />} />
          <Route path="/game/army" element={<LocationProbe />} />
          <Route path="/game/messages" element={<LocationProbe />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('GameShellLayout', () => {
  it('renders one shared chrome host with the active tab and unread badge', () => {
    renderGameShell('/game/messages');

    expect(screen.getAllByTestId('game-header')).toHaveLength(1);
    expect(screen.getAllByTestId('bottom-nav')).toHaveLength(1);
    expect(screen.getAllByTestId('toast-stack')).toHaveLength(1);
    expect(screen.getByTestId('bottom-nav')).toHaveAttribute('data-active-tab', 'messages');
    expect(screen.getByTestId('bottom-nav')).toHaveAttribute('data-unread', '7');
  });

  it('leaves village chrome to the village view without shared header or nav', () => {
    renderGameShell('/game?foo=1');

    expect(screen.getByTestId('location')).toHaveTextContent('/game?foo=1');
    expect(screen.queryByTestId('game-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument();
  });

  it('returns to the village without opening a panel from another tab', () => {
    renderGameShell('/game/army');

    fireEvent.click(screen.getByRole('button', { name: 'buildings' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/game');
  });

  it('keeps the power sheet in the shared layout', () => {
    renderGameShell('/game/world');

    fireEvent.click(screen.getByRole('button', { name: 'power' }));

    expect(screen.getByTestId('power-sheet')).toBeInTheDocument();
  });
});
