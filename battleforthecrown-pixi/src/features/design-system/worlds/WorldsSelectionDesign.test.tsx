import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WorldCardViewModel } from '@/features/worlds/worldsViewModel';
import { WorldCard, WorldEntryOverlay, WorldsSelectionDesign } from './WorldsSelectionDesign';
import { defaultSeasonVariants, worldsSelectionLabels } from './worldsSelectionConfig';

function makeCard(overrides: Partial<WorldCardViewModel> = {}): WorldCardViewModel {
  return {
    ctaKind: 'join',
    ctaLabel: 'Rejoindre le royaume',
    dayLabel: 'J. 5 / 60',
    displayName: 'Aubeforge',
    id: 'world-open',
    inscriptionPhase: 'main',
    isJoined: false,
    joinedCountLabel: '8 420',
    lifecycleDay: 5,
    lifecycleInscriptionLateDays: 3,
    lifecycleInscriptionMainDays: 7,
    lifecycleTotalDays: 60,
    mapSizeLabel: '500 × 500',
    opensInLabel: null,
    personalStats: null,
    sigilGlyph: '♔',
    statusLabel: 'INSCRIPTION LIBRE',
    tab: 'open',
    tagline: 'Où les vassaux bâtissent leur légende',
    tempoLabel: 'STANDARD',
    theme: { border: '#3a6c1f', dark: '#2f5b1c', glow: 'rgba(110,191,73,.45)', light: '#5a8f3a' },
    themeColor: 'green',
    tierLabel: 'DÉBUTANTS',
    ...overrides,
  };
}

function normalizedText(container: HTMLElement): string {
  return container.textContent?.replace(/\s/g, ' ') ?? '';
}

describe('WorldCard', () => {
  it.each([
    {
      expectedButton: 'Rejoindre le royaume',
      expectedDay: 'J. 5 / 60',
      expectedStatus: 'INSCRIPTION LIBRE',
      phase: 'main' as const,
      title: 'OPEN main',
    },
    {
      expectedButton: 'Rejoindre le royaume',
      expectedDay: 'J. 8 / 60',
      expectedStatus: 'INSCRIPTION LIBRE',
      phase: 'late' as const,
      title: 'OPEN late',
    },
    {
      expectedButton: "Me prévenir à l'ouverture",
      expectedDay: 'Ouvre dans 1j 14h',
      expectedStatus: 'PLANIFIÉ',
      phase: 'closed' as const,
      title: 'PLANNED',
    },
    {
      expectedButton: 'Inscription close',
      expectedDay: 'J. 28 / 60',
      expectedStatus: 'INSCRIPTION CLOSE',
      phase: 'closed' as const,
      title: 'LOCKED',
    },
  ])('renders the $title state without exposing raw inscriptionPhase', (scenario) => {
    render(
      <WorldCard
        onDetails={() => undefined}
        onJoin={() => undefined}
        onNotify={() => undefined}
        world={makeCard({
          ctaKind: scenario.expectedButton === "Me prévenir à l'ouverture"
            ? 'notify'
            : scenario.expectedButton === 'Inscription close'
              ? 'locked'
              : 'join',
          ctaLabel: scenario.expectedButton,
          dayLabel: scenario.expectedDay,
          inscriptionPhase: scenario.phase,
          lifecycleDay: scenario.expectedStatus === 'PLANIFIÉ' ? null : 5,
          statusLabel: scenario.expectedStatus,
          tab: scenario.expectedStatus === 'PLANIFIÉ'
            ? 'planned'
            : scenario.expectedStatus === 'INSCRIPTION CLOSE'
              ? 'locked'
              : 'open',
        })}
      />,
    );

    expect(screen.getByText('Aubeforge')).toBeInTheDocument();
    expect(screen.getByText('♔')).toBeInTheDocument();
    expect(screen.getByText(scenario.expectedStatus)).toBeInTheDocument();
    expect(screen.getByText(scenario.expectedDay)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: scenario.expectedButton })).toBeInTheDocument();
    expect(screen.queryByText('main')).not.toBeInTheDocument();
    expect(screen.queryByText('late')).not.toBeInTheDocument();
    expect(screen.queryByText('closed')).not.toBeInTheDocument();
  });

  it('lets an already joined world enter the game instead of disabling the CTA', () => {
    const onJoin = vi.fn();
    render(
      <WorldCard
        onDetails={() => undefined}
        onJoin={onJoin}
        onNotify={() => undefined}
        world={makeCard({
          ctaKind: 'joined',
          ctaLabel: 'Entrer dans le royaume',
          isJoined: true,
        })}
      />,
    );

    const button = screen.getByRole('button', { name: 'Entrer dans le royaume' });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onJoin).toHaveBeenCalledWith(expect.objectContaining({ id: 'world-open' }));
  });

  it('renders personal stats and the canonical power asset only when provided', () => {
    const { container, rerender } = render(
      <WorldCard
        onDetails={() => undefined}
        onJoin={() => undefined}
        onNotify={() => undefined}
        world={makeCard({
          personalStats: {
            kingdomPowerLabel: '1 234 567',
            villageCountLabel: '2 villages',
          },
        })}
      />,
    );

    expect(screen.getByText('2 villages')).toBeInTheDocument();
    expect(screen.getByText('Votre royaume')).toBeInTheDocument();
    expect(screen.queryByText('Présent')).not.toBeInTheDocument();
    expect(screen.queryByText('Villages')).not.toBeInTheDocument();
    expect(screen.getByText('Puissance')).toBeInTheDocument();
    expect(normalizedText(container)).toContain('1 234 567');
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/assets/army-power.png');

    rerender(
      <WorldCard
        onDetails={() => undefined}
        onJoin={() => undefined}
        onNotify={() => undefined}
        world={makeCard({ personalStats: null })}
      />,
    );

    expect(screen.queryByText('2 villages')).not.toBeInTheDocument();
    expect(screen.queryByText('Votre royaume')).not.toBeInTheDocument();
    expect(normalizedText(container)).not.toContain('1 234 567');
    expect(container.querySelector('img[src="/assets/army-power.png"]')).not.toBeInTheDocument();
  });

  it('keeps the details action separate from the join CTA', () => {
    const onDetails = vi.fn();
    const onJoin = vi.fn();
    render(<WorldCard onDetails={onDetails} onJoin={onJoin} onNotify={() => undefined} world={makeCard()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Détails' }));

    expect(onDetails).toHaveBeenCalledWith(expect.objectContaining({ id: 'world-open' }));
    expect(onJoin).not.toHaveBeenCalled();
  });

});

describe('WorldsSelectionDesign', () => {
  it('keeps cards visible when a non-blocking notice is shown', () => {
    render(
      <WorldsSelectionDesign
        activeTab="open"
        counts={{ locked: 0, open: 1, planned: 0 }}
        labels={worldsSelectionLabels}
        noticeMessage="Inscription au monde impossible"
        onDetails={vi.fn()}
        onJoin={vi.fn()}
        onNotify={vi.fn()}
        onTabChange={vi.fn()}
        totalCount={1}
        variants={defaultSeasonVariants}
        worlds={[makeCard()]}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Inscription au monde impossible');
    expect(screen.getByText('Aubeforge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rejoindre le royaume' })).toBeInTheDocument();
  });

  it('renders the full-screen entry transition for a world', () => {
    const world = makeCard({ displayName: 'Solstice', sigilGlyph: '✦' });

    render(<WorldEntryOverlay world={world} />);

    expect(screen.getByRole('status')).toHaveTextContent('Entrée dans');
    expect(screen.getByRole('status')).toHaveTextContent('Solstice');
  });
});
