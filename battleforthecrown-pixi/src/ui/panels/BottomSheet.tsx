import {
  forwardRef,
  HTMLAttributes,
  PointerEvent,
  ReactNode,
  TransitionEvent,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export interface BottomSheetProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string; // ex: '50vh', '75vh', '600px'
  /**
   * z-index du sheet. Défaut 50 : au-dessus de la BottomNavigationBar (40) et
   * des overlays de modals (40). Monter à 60+ uniquement pour empiler un sheet
   * par-dessus un autre sheet déjà ouvert (ex: PlayerProfileSheet sur MultiVillage).
   */
  zIndex?: number;
}

const SWIPE_HANDLE_HEIGHT = 76;
const SWIPE_CLOSE_DISTANCE = 96;
const SWIPE_CLOSE_VELOCITY = 0.45;
const SWIPE_INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"], [data-bottom-sheet-no-drag]';
const SWIPE_DRAG_REGION_SELECTOR = '[data-bottom-sheet-drag-region]';
const SWIPE_SCROLL_REGION_SELECTOR = '[data-bottom-sheet-scrollable]';

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
  ({ isOpen, onClose, children, maxHeight = '75vh', zIndex = 50, className = '', style, ...props }, ref) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<DragStart | null>(null);
    const [dragY, setDragY] = useState(0);

    // Animation enter/exit : `isRendered` garde le sheet dans le DOM le temps de
    // l'animation de sortie ; `isVisible` pilote la position (translateY 100% →
    // 0) et l'opacité de l'overlay. Sans cet état intermédiaire, le panel serait
    // monté directement à sa position finale et démonté instantanément → aucune
    // transition CSS déclenchée.
    const [isRendered, setIsRendered] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    // Conserve le dernier contenu rendu pendant l'animation de sortie : certains
    // parents passent un enfant conditionnel (ex. ArmyScreen `{recruitTroop ? …}`)
    // qui se démonte instantanément à la fermeture, faisant glisser un panneau
    // vide. On rejoue le dernier contenu connu tant que le sheet s'anime.
    const lastChildrenRef = useRef<ReactNode>(children);
    if (isOpen) lastChildrenRef.current = children;

    useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    if (isOpen && !isRendered) setIsRendered(true);

    // Entrée : une fois le panneau monté à sa position fermée (translateY 100%),
    // forcer un reflow pour que le navigateur enregistre cette frame de départ,
    // puis basculer en ouvert. Sans ce reflow, le passage 100% → 0% est coalescé
    // en un seul style et la transition est sautée (apparition « d'un coup »).
    useLayoutEffect(() => {
      if (!isOpen || !isRendered) {
        if (!isOpen) setIsVisible(false);
        return;
      }
      // Lecture de layout = flush du transform fermé avant le flip.
      void panelRef.current?.getBoundingClientRect();
      setIsVisible(true);
    }, [isOpen, isRendered]);

    const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
      if (!isOpen) setIsRendered(false);
    };

    const releasePointerCapture = (element: HTMLDivElement, pointerId: number) => {
      if (!element.hasPointerCapture(pointerId)) return;
      element.releasePointerCapture(pointerId);
    };

    const resetDrag = (element?: HTMLDivElement) => {
      const start = dragStartRef.current;
      if (element && start) releasePointerCapture(element, start.pointerId);
      dragStartRef.current = null;
      setDragY(0);
    };

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
      if (!isOpen || (event.pointerType === 'mouse' && event.button !== 0)) return;

      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(SWIPE_INTERACTIVE_SELECTOR)) return;
      const startsInDragRegion = Boolean(target?.closest(SWIPE_DRAG_REGION_SELECTOR));
      if (!startsInDragRegion && target?.closest(SWIPE_SCROLL_REGION_SELECTOR)) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const localY = event.clientY - rect.top;
      if (!startsInDragRegion && localY > SWIPE_HANDLE_HEIGHT) return;

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

      event.preventDefault();
      setDragY(Math.max(0, event.clientY - start.y));
    };

    const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
      const start = dragStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;

      const distance = Math.max(0, event.clientY - start.y);
      const elapsed = Math.max(1, performance.now() - start.time);
      const velocity = distance / elapsed;
      resetDrag(event.currentTarget);

      if (distance >= SWIPE_CLOSE_DISTANCE || velocity >= SWIPE_CLOSE_VELOCITY) {
        onClose();
      }
    };

    const isDragging = dragStartRef.current !== null;

    if (!isRendered) {
      return null;
    }

    return (
      <div
        ref={rootRef}
        className="pointer-events-auto fixed inset-0"
        style={{ zIndex, ...style }}
        {...props}
      >
        {/* Overlay - Fade uniquement */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isVisible ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Panel Container - Slide uniquement */}
        <div
          ref={panelRef}
          className={`absolute bottom-0 left-0 right-0 z-10 touch-pan-y select-none transform transition-transform ${
            isDragging ? 'duration-0' : 'duration-300'
          } ${className}`}
          onPointerCancel={(event) => resetDrag(event.currentTarget)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onTransitionEnd={handleTransitionEnd}
          style={{
            maxHeight,
            // Ouvert : suit le drag (translateY px). Fermé : hors écran
            // (translateY 100% de la hauteur du panel) pour l'animation slide.
            transform: isVisible ? `translateY(${dragY}px)` : 'translateY(100%)',
          }}
        >
          {isOpen ? children : lastChildrenRef.current}
        </div>
      </div>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';
