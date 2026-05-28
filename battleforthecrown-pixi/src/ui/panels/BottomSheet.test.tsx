import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameBottomSheetPanel } from '@/features/design-system/components/GameBottomSheetPanel';
import { BottomSheet } from './BottomSheet';

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

function renderSheet(onClose = vi.fn()) {
  const result = render(
    <BottomSheet className="sheet-panel-test" isOpen maxHeight="80vh" onClose={onClose}>
      <GameBottomSheetPanel
        headerActions={<button type="button">Action header</button>}
        title="Ordres"
      >
        <button type="button">Action contenu</button>
        <div>Contenu scrollable</div>
      </GameBottomSheetPanel>
    </BottomSheet>,
  );

  const panel = result.container.querySelector<HTMLElement>('.sheet-panel-test');
  if (!panel) throw new Error('Missing sheet panel');
  panel.getBoundingClientRect = () => ({
    bottom: 800,
    height: 400,
    left: 0,
    right: 400,
    top: 0,
    width: 400,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

  return { ...result, onClose, panel };
}

describe('BottomSheet mobile gestures', () => {
  beforeEach(() => installPointerCaptureStubs());

  it('closes on a downward swipe started from the drag region', () => {
    const { onClose, panel } = renderSheet();
    const title = screen.getByText('Ordres');

    fireEvent.pointerDown(title, { clientY: 20, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(title, { clientY: 140, pointerId: 1, pointerType: 'touch' });
    expect(panel.style.transform).toBe('translateY(120px)');

    fireEvent.pointerUp(title, { clientY: 140, pointerId: 1, pointerType: 'touch' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not start swipe-to-close from interactive controls', () => {
    const { onClose, panel } = renderSheet();
    const button = screen.getByRole('button', { name: 'Action header' });

    fireEvent.pointerDown(button, { clientY: 20, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(button, { clientY: 150, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(button, { clientY: 150, pointerId: 1, pointerType: 'touch' });

    expect(panel.style.transform).toBe('translateY(0px)');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not intercept vertical gestures from scrollable sheet content', () => {
    const { onClose, panel } = renderSheet();
    const scrollBody = panel.querySelector<HTMLElement>('[data-bottom-sheet-scrollable]');

    if (!scrollBody) throw new Error('Missing scrollable body');
    fireEvent.pointerDown(scrollBody, { clientY: 40, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(scrollBody, { clientY: 160, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(scrollBody, { clientY: 160, pointerId: 1, pointerType: 'touch' });

    expect(panel.style.transform).toBe('translateY(0px)');
    expect(onClose).not.toHaveBeenCalled();
  });
});
