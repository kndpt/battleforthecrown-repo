import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { multiVillageBottomSheetLabels } from '@/features/layout/multiVillageSheet';
import {
  MultiVillageBottomSheet,
  type MultiVillageFilter,
  type MultiVillageItem,
  type MultiVillageBottomSheetProps,
} from './MultiVillageBottomSheet';

const villages: MultiVillageItem[] = [
  { coords: '7:12', id: 'off', label: 'OFFENSIVE', name: 'Kelvinor' },
  { coords: '11:4', id: 'eco', label: 'ECONOMIC', name: "Vald'Or" },
  { coords: '2:18', id: 'none', label: null, name: 'Pierre-Noire' },
];

function renderSheet(overrides: Partial<MultiVillageBottomSheetProps> = {}) {
  return render(
    <MultiVillageBottomSheet
      filter="all"
      labels={multiVillageBottomSheetLabels}
      onFilterChange={() => undefined}
      villages={villages}
      {...overrides}
    />,
  );
}

describe('MultiVillageBottomSheet filtering', () => {
  it('shows the six default chips (segments + one per village label)', () => {
    renderSheet();

    for (const name of ['Tous', 'Actifs', 'Alertes', 'Offensif', 'Défensif', 'Économique']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('keeps every village visible under the default "all" filter', () => {
    renderSheet();

    expect(screen.getByText('Kelvinor')).toBeInTheDocument();
    expect(screen.getByText("Vald'Or")).toBeInTheDocument();
    expect(screen.getByText('Pierre-Noire')).toBeInTheDocument();
  });

  it('shows only OFFENSIVE villages under the "Offensif" chip and hides unlabelled', () => {
    renderSheet({ filter: 'OFFENSIVE' });

    expect(screen.getByText('Kelvinor')).toBeInTheDocument();
    expect(screen.queryByText("Vald'Or")).not.toBeInTheDocument();
    expect(screen.queryByText('Pierre-Noire')).not.toBeInTheDocument();
  });

  it('shows only ECONOMIC villages under the "Économique" chip', () => {
    renderSheet({ filter: 'ECONOMIC' });

    expect(screen.getByText("Vald'Or")).toBeInTheDocument();
    expect(screen.queryByText('Kelvinor')).not.toBeInTheDocument();
    expect(screen.queryByText('Pierre-Noire')).not.toBeInTheDocument();
  });

  it('renders the empty copy when a label filter matches no village', () => {
    renderSheet({ filter: 'DEFENSIVE' });

    expect(screen.getByText(multiVillageBottomSheetLabels.empty)).toBeInTheDocument();
    expect(screen.queryByText('Kelvinor')).not.toBeInTheDocument();
  });

  it('drives the visible list when a label chip is clicked (controlled wiring)', () => {
    function Harness() {
      const [filter, setFilter] = useState<MultiVillageFilter>('all');
      return (
        <MultiVillageBottomSheet
          filter={filter}
          labels={multiVillageBottomSheetLabels}
          onFilterChange={setFilter}
          villages={villages}
        />
      );
    }
    render(<Harness />);

    // all villages visible initially
    expect(screen.getByText("Vald'Or")).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Offensif' }));

    // chip click flows back through onFilterChange -> only OFFENSIVE remains
    expect(screen.getByText('Kelvinor')).toBeInTheDocument();
    expect(screen.queryByText("Vald'Or")).not.toBeInTheDocument();
    expect(screen.queryByText('Pierre-Noire')).not.toBeInTheDocument();
  });

  it('respects a restrictive availableFilters (no label chips)', () => {
    const availableFilters: MultiVillageFilter[] = ['all', 'active'];
    renderSheet({ availableFilters });

    expect(screen.getByRole('button', { name: 'Tous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actifs' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Offensif' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Alertes' })).not.toBeInTheDocument();
  });
});
