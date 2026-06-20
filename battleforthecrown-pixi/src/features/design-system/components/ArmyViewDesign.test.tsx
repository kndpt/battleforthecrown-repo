import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ArmyContentDesign,
  ArmyRecruitPopup,
  type ArmyRecruitPopupLabels,
  type ArmyRecruitSheetProps,
  type ArmyRecruitStock,
  type ArmyTroop,
} from './ArmyViewDesign';

const militia: ArmyTroop = {
  attack: 12,
  category: 'Infanterie',
  cost: { iron: 10, stone: 10, wood: 10 },
  defense: 9,
  draggable: true,
  id: 'militia',
  inVillage: 12,
  name: 'Milice',
  pop: 1,
  power: 21,
  short: 'MIL',
  trainingTime: '00:30',
  unlocked: true,
};

const recruitSheet: ArmyRecruitSheetProps = {
  activeDropLabel: 'Relâcher',
  dropIdleLabel: 'Glisser ici',
  iconPath: 'M5 9 L12 2 L19 9 M12 2 v14',
  queue: [],
  summaryLabel: '0 en file',
  title: 'Recruter',
};

const recruitLabels: ArmyRecruitPopupLabels = {
  cancel: 'Annuler',
  max: 'Max',
  population: 'Population',
  recruit: 'Entraîner',
  resourceIron: 'Fer',
  resourceStone: 'Pierre',
  resourceWood: 'Bois',
};

const recruitStock: ArmyRecruitStock = {
  iron: 4_620,
  populationAvailable: 230,
  stone: 4_620,
  wood: 4_620,
};

function installPointerCaptureStubs() {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: vi.fn(() => true),
  });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
}

function renderArmyContent(overrides: Partial<Parameters<typeof ArmyContentDesign>[0]> = {}) {
  return render(
    <ArmyContentDesign
      activeFilterId="all"
      filters={[{ count: 1, id: 'all', label: 'Tout' }]}
      recruitSheet={recruitSheet}
      troops={[militia]}
      {...overrides}
    />,
  );
}

describe('ArmyViewDesign mobile troop drag', () => {
  beforeEach(() => installPointerCaptureStubs());

  it('starts a touch drag immediately after the movement threshold without long-press', () => {
    const onTroopDragStart = vi.fn();
    const onTroopDragEnd = vi.fn();
    renderArmyContent({ onTroopDragEnd, onTroopDragStart });

    const tile = screen.getByRole('button', { name: /MIL\s+12/ });
    expect(tile).toHaveStyle({ touchAction: 'none' });

    fireEvent.pointerDown(tile, { clientX: 10, clientY: 10, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(tile, { clientX: 22, clientY: 12, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(tile, { clientX: 22, clientY: 12, pointerId: 1, pointerType: 'touch' });

    expect(onTroopDragStart).toHaveBeenCalledTimes(1);
    expect(onTroopDragStart).toHaveBeenCalledWith(militia);
    expect(onTroopDragEnd).toHaveBeenCalledTimes(1);
    expect(onTroopDragEnd).toHaveBeenCalledWith(militia);
  });

  it('keeps vertical touch movement as grid scroll when the list can scroll', () => {
    const onTroopDragStart = vi.fn();
    const onTroopDragEnd = vi.fn();
    const { container } = renderArmyContent({ onTroopDragEnd, onTroopDragStart });

    const scrollContainer = container.querySelector<HTMLElement>('[class*="overflow-y-auto"]');
    if (!scrollContainer) throw new Error('Missing scroll container');

    Object.defineProperty(scrollContainer, 'clientHeight', { configurable: true, value: 120 });
    Object.defineProperty(scrollContainer, 'scrollHeight', { configurable: true, value: 360 });
    Object.defineProperty(scrollContainer, 'scrollTop', { configurable: true, value: 40, writable: true });
    const scrollBy = vi.fn(function scrollBy(
      this: HTMLElement,
      options?: number | ScrollToOptions,
      y?: number,
    ) {
      const top = typeof options === 'number' ? Number(y ?? 0) : Number(options?.top ?? 0);
      this.scrollTop += top;
    });
    Object.defineProperty(scrollContainer, 'scrollBy', { configurable: true, value: scrollBy });

    const tile = screen.getByRole('button', { name: /MIL\s+12/ });
    fireEvent.pointerDown(tile, { clientX: 10, clientY: 60, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(tile, { clientX: 10, clientY: 72, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(tile, { clientX: 10, clientY: 72, pointerId: 1, pointerType: 'touch' });

    expect(scrollBy).toHaveBeenCalledWith({ top: -12 });
    expect(onTroopDragStart).not.toHaveBeenCalled();
    expect(onTroopDragEnd).not.toHaveBeenCalled();
  });
});

describe('ArmyViewDesign training queue', () => {
  it('exposes a cancel action on queue chips with the selected training id', () => {
    const onCancelQueueItem = vi.fn();
    const queueItem = {
      active: true,
      id: 'training-1',
      progress: 0.42,
      quantity: 12,
      troopId: militia.id,
    };

    renderArmyContent({
      recruitSheet: {
        ...recruitSheet,
        onCancelQueueItem,
        queue: [queueItem],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Annuler la formation Milice ×12' }));

    expect(onCancelQueueItem).toHaveBeenCalledTimes(1);
    expect(onCancelQueueItem).toHaveBeenCalledWith(queueItem);
  });
});

describe('ArmyViewDesign onboarding drag hint', () => {
  it('renders the looping drag hint when an onboarding troop id is provided', () => {
    const { container } = renderArmyContent({ onboardingDragHintTroopId: militia.id });
    expect(container.querySelector('[data-drag-hint]')).not.toBeNull();
  });

  it('does not render the drag hint without the onboarding prop', () => {
    const { container } = renderArmyContent();
    expect(container.querySelector('[data-drag-hint]')).toBeNull();
  });
});

describe('ArmyRecruitPopup onboarding "5 or nothing" gate', () => {
  function renderPopup(value: number, onRecruit = vi.fn()) {
    return {
      onRecruit,
      ...render(
        <ArmyRecruitPopup
          embedded
          labels={recruitLabels}
          max={5}
          onChange={vi.fn()}
          onRecruit={onRecruit}
          quickValues={[{ label: '5', value: 5 }]}
          requiredValue={5}
          showHandle={false}
          stock={recruitStock}
          troop={militia}
          value={value}
        />,
      ),
    };
  }

  it('disables the recruit button below the required value and shows the guide', () => {
    const { container } = renderPopup(3);
    expect(screen.getByRole('button', { name: /Entraîner/ })).toBeDisabled();
    expect(container.querySelector('[data-onboarding-recruit-guide]')).not.toBeNull();
  });

  it('enables the recruit button at exactly the required value and recruits 5', () => {
    const { onRecruit, container } = renderPopup(5);
    const button = screen.getByRole('button', { name: /Entraîner/ });
    expect(button).toBeEnabled();
    expect(container.querySelector('[data-onboarding-recruit-guide]')).toBeNull();
    fireEvent.click(button);
    expect(onRecruit).toHaveBeenCalledWith(5);
  });
});

describe('ArmyRecruitPopup embedded sheet content', () => {
  it('lets the shared bottom sheet own the surface and swipe header', () => {
    const { container } = render(
      <ArmyRecruitPopup
        embedded
        labels={recruitLabels}
        max={100}
        onChange={vi.fn()}
        quickValues={[{ label: '10', value: 10 }]}
        showHandle={false}
        stock={recruitStock}
        troop={militia}
        value={1}
      />,
    );

    const dragRegion = container.querySelector('[data-bottom-sheet-drag-region]');
    expect(container.firstElementChild).toHaveStyle({ background: 'transparent' });
    expect(dragRegion).toHaveTextContent('Milice');
    expect(dragRegion).toHaveClass('touch-none');
  });
});
