import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResourceBuildingDetailModal } from './ResourceBuildingDetailModal';

describe('ResourceBuildingDetailModal', () => {
  it('keeps the Quarter housing gauge based on runtime population max', () => {
    const { container } = render(
      <ResourceBuildingDetailModal
        building={{
          endTime: null,
          id: 'quarter-1',
          isUnderConstruction: false,
          level: 7,
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
        lockState={{ castleLevel: 7, requiredCastleLevel: 1, state: 'available' }}
        name="Quartier"
        nextCost={{ iron: 0, population: 0, stone: 0, timeSeconds: 1, wood: 0 }}
        onCancelConstruction={vi.fn()}
        onClose={vi.fn()}
        onUpgrade={vi.fn()}
        population={{ max: 999, used: 320 }}
        progress={{ inProgress: false, percent: 0, remainingMs: 0 }}
        queueLength={0}
        upgradePending={false}
      />,
    );

    expect(container).toHaveTextContent('480');
    expect(container).toHaveTextContent('535');
    expect(container).toHaveTextContent('320 / 999');
  });
});
