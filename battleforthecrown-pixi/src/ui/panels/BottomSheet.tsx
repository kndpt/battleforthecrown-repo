import {
  forwardRef,
  HTMLAttributes,
  PointerEvent,
  ReactNode,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

export interface BottomSheetProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string; // ex: '50vh', '75vh', '600px'
  zIndex?: number;
}

const SWIPE_HANDLE_HEIGHT = 76;
const SWIPE_CLOSE_DISTANCE = 96;
const SWIPE_CLOSE_VELOCITY = 0.45;
const CLOSED_SHEET_SHADOW_OFFSET = 40;
const SWIPE_INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"], [data-bottom-sheet-no-drag]';

interface DragStart {
  pointerId: number;
  time: number;
  y: number;
}

/**
 * BottomSheet - Composant de base pour créer des panels qui slide depuis le bas
 * 
 * Gère automatiquement :
 * - L'overlay avec fade in/out
 * - L'animation slide up/down du panel
 * - La séparation correcte des animations (overlay fade, panel slide)
 * - Les pointer-events pour éviter les clics quand fermé
 * 
 * @example
 * ```tsx
 * <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} maxHeight="75vh">
 *   <Panel variant="parchment">
 *     <PanelHeader>Header</PanelHeader>
 *     <PanelBody>Content</PanelBody>
 *   </Panel>
 * </BottomSheet>
 * ```
 */
export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(
  ({ isOpen, onClose, children, maxHeight = '75vh', zIndex = 40, className = '', style, ...props }, ref) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<DragStart | null>(null);
    const [dragY, setDragY] = useState(0);

    useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    const resetDrag = () => {
      dragStartRef.current = null;
      setDragY(0);
    };

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
      if (!isOpen || (event.pointerType === 'mouse' && event.button !== 0)) return;
      if (event.target instanceof Element && event.target.closest(SWIPE_INTERACTIVE_SELECTOR)) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const localY = event.clientY - rect.top;
      if (localY > SWIPE_HANDLE_HEIGHT) return;

      dragStartRef.current = {
        pointerId: event.pointerId,
        time: performance.now(),
        y: event.clientY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
      const start = dragStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;

      setDragY(Math.max(0, event.clientY - start.y));
    };

    const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
      const start = dragStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;

      const distance = Math.max(0, event.clientY - start.y);
      const elapsed = Math.max(1, performance.now() - start.time);
      const velocity = distance / elapsed;
      resetDrag();

      if (distance >= SWIPE_CLOSE_DISTANCE || velocity >= SWIPE_CLOSE_VELOCITY) {
        onClose();
      }
    };

    const isDragging = dragStartRef.current !== null;

    return (
      <div
        ref={rootRef}
        className={`fixed inset-0 ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{ zIndex, ...style }}
        {...props}
      >
        {/* Overlay - Fade uniquement */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Panel Container - Slide uniquement */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-10 touch-pan-y select-none transform transition-transform ${
            isDragging ? 'duration-0' : 'duration-300'
          } ${className}`}
          onPointerCancel={resetDrag}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          style={{
            maxHeight,
            transform: isOpen
              ? `translateY(${dragY}px)`
              : `translateY(calc(100% + ${CLOSED_SHEET_SHADOW_OFFSET}px))`,
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';
