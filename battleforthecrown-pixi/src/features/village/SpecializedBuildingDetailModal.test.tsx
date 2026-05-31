import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpecializedBuildingDetailModal } from './SpecializedBuildingDetailModal';
import { metaFor } from './buildingMeta';

describe('SpecializedBuildingDetailModal', () => {
  it('labels level 0 available specialized buildings as construction', () => {
    render(
      <SpecializedBuildingDetailModal
        availablePopulation={20}
        building={{
          endTime: null,
          id: 'barracks-1',
          isUnderConstruction: false,
          level: 0,
          maxLevel: 10,
          populationCost: 0,
          startTime: null,
          type: 'BARRACKS',
        }}
        canAfford
        canAffordNoble={false}
        cancelConstructionPending={false}
        cancelTrainingPending={false}
        crownsBalance={0}
        displayResources={{ iron: 500, maxPerType: 1_000, stone: 500, wood: 500 }}
        effectiveTimeMs={58_000}
        error={null}
        isMaxLevel={false}
        isQueueFull={false}
        lockState={{ castleLevel: 5, requiredCastleLevel: 1, state: 'unbuilt-available' }}
        meta={metaFor('BARRACKS')}
        nextCost={{ iron: 160, population: 8, stone: 120, timeSeconds: 58, wood: 120 }}
        nobleInGarrison={false}
        nobleTimeMs={60_000}
        nobleTraining={undefined}
        now={0}
        onCancelConstruction={vi.fn()}
        onCancelNobleTraining={vi.fn()}
        onClose={vi.fn()}
        onRecruitNoble={vi.fn()}
        onUpgrade={vi.fn()}
        progress={{ inProgress: false, percent: 0, remainingMs: 0 }}
        queueLength={0}
        recruitNoblePending={false}
        upgradePending={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Construire' })).toBeEnabled();
    expect(screen.getByText(/Construire · Niv\. 0 → 1/)).toBeInTheDocument();
  });
});
