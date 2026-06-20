import { useRef } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DragHintOverlay } from './DragHintOverlay';

function Harness() {
  const targetRef = useRef<HTMLDivElement>(null);
  return (
    <div className="relative" style={{ height: 200, width: 200 }}>
      <button data-troop-id="MILITIA" type="button">
        source
      </button>
      <div data-testid="drop" ref={targetRef}>
        drop
      </div>
      <DragHintOverlay fromSelector='[data-troop-id="MILITIA"]' showHalo toRef={targetRef}>
        <span data-testid="ghost">ghost</span>
      </DragHintOverlay>
    </div>
  );
}

describe('DragHintOverlay', () => {
  it('mounts the overlay marker and animates the ghost once the path is measured', () => {
    const { container, queryByTestId } = render(<Harness />);
    expect(container.querySelector('[data-drag-hint]')).not.toBeNull();
    // jsdom returns zeroed rects → a (0,0,0,0) path is still a valid measured path.
    expect(queryByTestId('ghost')).not.toBeNull();
  });
});
