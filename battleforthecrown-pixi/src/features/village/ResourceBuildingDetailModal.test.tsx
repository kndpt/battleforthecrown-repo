import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResourceBuildingDetailModal } from './ResourceBuildingDetailModal';

describe('ResourceBuildingDetailModal', () => {
  it('shows Quarter available population projected against effective runtime capacity', () => {
    const { container } = render(
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

    expect(container).toHaveTextContent('Villageois disponibles');
    expect(container).toHaveTextContent('141 / 423');
    expect(container).toHaveTextContent('191 / 473');
    expect(container).toHaveTextContent('+50 villageois');
    expect(container).not.toHaveTextContent('282 / 423');
  });
});
