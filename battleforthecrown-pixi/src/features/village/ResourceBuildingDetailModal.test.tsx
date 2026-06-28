import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResourceBuildingDetailModal } from './ResourceBuildingDetailModal';

describe('ResourceBuildingDetailModal', () => {
  it('shows Quarter available population projected against effective runtime capacity', () => {
    // Le contenu est porté dans <body> via ModalOverlay → interroger baseElement.
    const { baseElement } = render(
      <ResourceBuildingDetailModal
        building={{
          endTime: null,
          id: 'quarter-1',
          isUnderConstruction: false,
          level: 5,
          maxLevel: 10,
          populationCost: 0,
          startTime: null,
          type: 'QUARTER',
        }}
        canAfford
        cancelPending={false}
        crownsBalance={0}
        displayResources={null}
        effectiveTimeMs={1_000}
        error={null}
        isMaxLevel={false}
        isQueueFull={false}
        lockState={{ castleLevel: 5, requiredCastleLevel: 1, state: 'available' }}
        name="Quartier"
        nextCost={{ iron: 0, population: 0, stone: 0, timeSeconds: 1, wood: 0 }}
        onCancelConstruction={vi.fn()}
        onClose={vi.fn()}
        onUpgrade={vi.fn()}
        population={{ max: 423, used: 282 }}
        progress={{ inProgress: false, percent: 0, remainingMs: 0 }}
        queueLength={0}
        upgradePending={false}
      />,
    );

    expect(baseElement).toHaveTextContent('Villageois disponibles');
    expect(baseElement).toHaveTextContent('141 / 423');
    expect(baseElement).toHaveTextContent('191 / 473');
    expect(baseElement).toHaveTextContent('+50 villageois');
    expect(baseElement).not.toHaveTextContent('282 / 423');
  });

  it('labels level 0 available resource buildings as construction', () => {
    render(
      <ResourceBuildingDetailModal
        building={{
          endTime: null,
          id: 'wood-1',
          isUnderConstruction: false,
          level: 0,
          maxLevel: 10,
          populationCost: 0,
          startTime: null,
          type: 'WOOD',
        }}
        canAfford
        cancelPending={false}
        crownsBalance={0}
        displayResources={{ iron: 500, maxPerType: 1_000, stone: 500, wood: 500 }}
        effectiveTimeMs={58_000}
        error={null}
        isMaxLevel={false}
        isQueueFull={false}
        lockState={{ castleLevel: 5, requiredCastleLevel: 1, state: 'unbuilt-available' }}
        name="Camp de bûcherons"
        nextCost={{ iron: 120, population: 8, stone: 120, timeSeconds: 58, wood: 120 }}
        onCancelConstruction={vi.fn()}
        onClose={vi.fn()}
        onUpgrade={vi.fn()}
        population={{ max: 20, used: 0 }}
        progress={{ inProgress: false, percent: 0, remainingMs: 0 }}
        queueLength={0}
        upgradePending={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Construire' })).toBeEnabled();
    expect(screen.getByText(/Construire · Niv\. 0 → 1/)).toBeInTheDocument();
  });
});
