import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WorldCardViewModel } from '@/features/worlds/worldsViewModel';
import { WorldDetailDesign } from './WorldDetailDesign';
import { worldDetailLabels } from './worldDetailConfig';

function makeWorld(overrides: Partial<WorldCardViewModel> = {}): WorldCardViewModel {
  return {
    ctaKind: 'join',
    ctaLabel: "S'inscrire",
    dayLabel: 'J. 5 / 60',
    displayName: 'Aubeforge',
    freshAlternativeWorldId: null,
    id: 'world-open',
    inscriptionPhase: 'main',
    isJoined: false,
    joinedCountLabel: '8 420',
    launchAgeLabel: null,
    lifecycleDay: 5,
    lifecycleInscriptionLateDays: 3,
    lifecycleInscriptionMainDays: 7,
    lifecycleTotalDays: 60,
    mapSizeLabel: '500 × 500',
    opensInLabel: null,
    personalStats: null,
    shieldLabel: '72 h',
    sigilGlyph: '♔',
    statusLabel: 'INSCRIPTIONS OUVERTES',
    tab: 'open',
    tagline: 'Où les vassaux bâtissent leur légende',
    tempoLabel: 'STANDARD',
    theme: { border: '#3a6c1f', dark: '#2f5b1c', glow: 'rgba(110,191,73,.45)', light: '#5a8f3a' },
    themeColor: 'green',
    tierLabel: 'DÉBUTANTS',
    ...overrides,
  };
}

describe('WorldDetailDesign', () => {
  it('renders sourced public world data and no prototype-only fixtures', () => {
    const { container } = render(
      <WorldDetailDesign
        labels={worldDetailLabels}
        onBack={() => undefined}
        onEnter={() => undefined}
        onJoin={() => undefined}
        onNotify={() => undefined}
        world={makeWorld()}
      />,
    );

    expect(screen.getByText('Aubeforge')).toBeInTheDocument();
    expect(screen.getByText('J. 5 / 60')).toBeInTheDocument();
    expect(screen.getByText('8 420')).toBeInTheDocument();
    expect(screen.getByText('500 × 500')).toBeInTheDocument();
    expect(screen.getByText('72 h')).toBeInTheDocument();
    expect(screen.queryByText(/Seigneur fondateur/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PvP/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Coalitions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pillage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Densité/i)).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Sire Aldric|capitale|classement|récompense/i);
  });

  it('renders personal stats only when they are loaded', () => {
    const { rerender } = render(
      <WorldDetailDesign
        labels={worldDetailLabels}
        onBack={() => undefined}
        onEnter={() => undefined}
        onJoin={() => undefined}
        onNotify={() => undefined}
        world={makeWorld({
          isJoined: true,
          personalStats: {
            kingdomPowerLabel: '1 234 567',
            villageCountLabel: '2 villages',
          },
        })}
      />,
    );

    expect(screen.getByText('Votre royaume')).toBeInTheDocument();
    expect(screen.getByText('2 villages')).toBeInTheDocument();
    expect(screen.getByText('1 234 567')).toBeInTheDocument();

    rerender(
      <WorldDetailDesign
        labels={worldDetailLabels}
        onBack={() => undefined}
        onEnter={() => undefined}
        onJoin={() => undefined}
        onNotify={() => undefined}
        world={makeWorld({ isJoined: true, personalStats: null })}
      />,
    );

    expect(screen.queryByText('Votre royaume')).not.toBeInTheDocument();
    expect(screen.queryByText('2 villages')).not.toBeInTheDocument();
  });

  it('keeps the primary CTA behavior controlled by props', () => {
    const onJoin = vi.fn();
    render(
      <WorldDetailDesign
        labels={worldDetailLabels}
        onBack={() => undefined}
        onEnter={() => undefined}
        onJoin={onJoin}
        onNotify={() => undefined}
        world={makeWorld()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(onJoin).toHaveBeenCalledWith(expect.objectContaining({ id: 'world-open' }));
  });

  it('routes already joined worlds through the enter CTA instead of join', () => {
    const onEnter = vi.fn();
    const onJoin = vi.fn();
    render(
      <WorldDetailDesign
        labels={worldDetailLabels}
        onBack={() => undefined}
        onEnter={onEnter}
        onJoin={onJoin}
        onNotify={() => undefined}
        world={makeWorld({
          ctaKind: 'joined',
          ctaLabel: 'Entrer dans le royaume',
          isJoined: true,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Entrer dans le royaume' }));

    expect(onEnter).toHaveBeenCalledWith(expect.objectContaining({ id: 'world-open' }));
    expect(onJoin).not.toHaveBeenCalled();
  });

  it('hides the CTA when inscriptions are closed and the player is not joined', () => {
    render(
      <WorldDetailDesign
        labels={worldDetailLabels}
        onBack={() => undefined}
        onEnter={() => undefined}
        onJoin={() => undefined}
        onNotify={() => undefined}
        world={makeWorld({
          ctaKind: 'locked',
          ctaLabel: 'Inscriptions closes',
          statusLabel: 'INSCRIPTIONS CLOSES',
          tab: 'locked',
        })}
      />,
    );

    expect(screen.queryByRole('button', { name: /inscription/i })).not.toBeInTheDocument();
  });

});
