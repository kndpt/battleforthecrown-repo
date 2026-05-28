import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ArmyContentDesign,
  type ArmyRecruitSheetProps,
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
