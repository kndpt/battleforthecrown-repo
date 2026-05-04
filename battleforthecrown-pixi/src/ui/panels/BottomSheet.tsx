import { forwardRef, HTMLAttributes, ReactNode } from 'react';

export interface BottomSheetProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string; // ex: '50vh', '75vh', '600px'
  zIndex?: number;
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
  ({ isOpen, onClose, children, maxHeight = '75vh', zIndex = 40, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`fixed inset-0 ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{ zIndex }}
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
          className={`absolute bottom-0 left-0 right-0 transform transition-transform duration-300 ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          } ${className}`}
          style={{ maxHeight }}
        >
          {children}
        </div>
      </div>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';
