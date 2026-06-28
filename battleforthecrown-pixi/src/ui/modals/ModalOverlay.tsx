import { type ReactNode, type MouseEvent, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEnterExitTransition, useRetainedChildren } from '@/ui/panels/useEnterExitTransition';

export interface ModalOverlayProps {
  /** Ouvre/ferme la modale. Anime à l'entrée comme à la sortie. */
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Ferme au clic sur le fond. Défaut: true. */
  closeOnOverlayClick?: boolean;
  /** Ferme sur la touche Échap. Défaut: true. */
  closeOnEscape?: boolean;
  /**
   * z-index du calque. Échelle: 50 = modale standard ; 60 = modale empilée
   * au-dessus d'une autre ; 80 = surface haute (widgets plein écran).
   */
  zIndex?: number;
  /** Libellé accessible de la boîte de dialogue. */
  ariaLabel?: string;
  /** Classes supplémentaires sur le wrapper animé (rarement nécessaire). */
  panelClassName?: string;
}

/**
 * ModalOverlay — parent unique de toutes les modales centrées du jeu.
 *
 * Fournit, en un seul endroit : portail vers `<body>`, fond assombri + flou,
 * centrage, fermeture au clic extérieur / Échap, verrou de scroll, focus
 * initial + restauration, et l'**animation « pop spring »** mobile-game
 * (scale .8→1 avec overshoot à l'entrée, repli + fade à la sortie).
 *
 * Le contenu attendu est une boîte stylée (ex. `BaseModal`) ; ModalOverlay ne
 * gère que l'orchestration et l'animation, pas l'apparence du panneau.
 *
 * @example
 * ```tsx
 * <ModalOverlay isOpen={isOpen} onClose={close} ariaLabel="Rapport">
 *   <BaseModal title="Rapport" onClose={close}>…</BaseModal>
 * </ModalOverlay>
 * ```
 */
export function ModalOverlay({
  isOpen,
  onClose,
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  zIndex = 50,
  ariaLabel,
  panelClassName = '',
}: ModalOverlayProps) {
  // On écoute la transition `opacity` (et non `transform`) : sous
  // prefers-reduced-motion le scale est neutralisé, mais l'opacité reste
  // animée — garantit que `transitionend` se déclenche et démonte la modale.
  const { isRendered, isVisible, panelRef, handleTransitionEnd } = useEnterExitTransition(isOpen, {
    property: 'opacity',
  });
  const renderedChildren = useRetainedChildren(isOpen, children);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Échap + verrou de scroll pendant l'ouverture.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Focus initial sur la boîte, restauration de l'élément précédent à la fermeture.
  useEffect(() => {
    if (!isOpen) return undefined;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => previouslyFocused.current?.focus?.({ preventScroll: true });
    // panelRef est stable (issu du hook) ; on ne veut rejouer qu'au toggle isOpen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isRendered) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) onClose();
  };
  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  // Portail vers <body> : sinon un ancêtre transformé (ex. wrapper
  // `-translate-x-1/2`) devient containing block du `position: fixed`.
  return createPortal(
    <div className="pointer-events-auto fixed inset-0" style={{ zIndex }}>
      {/* Fond assombri + flou — fade seul */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-[rgba(0,0,0,.62)] [backdrop-filter:blur(3px)] transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Calque de centrage — capte les clics extérieurs */}
      <div className="absolute inset-0 grid place-items-center p-3" onClick={handleOverlayClick}>
        {/* Wrapper animé « pop spring » */}
        <div
          ref={panelRef}
          aria-label={ariaLabel}
          aria-modal="true"
          className={`max-w-full transition-[transform,opacity] motion-reduce:!scale-100 ${
            isVisible
              ? 'scale-100 opacity-100'
              : `opacity-0 ${isOpen ? 'scale-[.8]' : 'scale-[.92]'}`
          } ${isOpen ? 'duration-[260ms] ease-modal-pop' : 'duration-[180ms] ease-in'} ${panelClassName}`}
          onClick={stopPropagation}
          onTransitionEnd={handleTransitionEnd}
          role="dialog"
          tabIndex={-1}
        >
          {renderedChildren}
        </div>
      </div>
    </div>,
    document.body,
  );
}
