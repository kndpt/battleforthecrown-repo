import { type ReactNode } from 'react';
import { ModalOverlay } from './ModalOverlay';

interface ModalBackdropProps {
  children: ReactNode;
  onClose: () => void;
}

/**
 * ModalBackdrop — wrapper de compatibilité au-dessus de {@link ModalOverlay}.
 *
 * Historiquement le backdrop centré du jeu (portail + fond assombri). Ses
 * consommateurs le montent conditionnellement (`{open && <ModalBackdrop/>}`),
 * d'où `isOpen` forcé à `true`. Déléguer à `ModalOverlay` leur apporte
 * gratuitement l'animation « pop », Échap, le verrou de scroll et le focus.
 *
 * Pour tout nouveau code, préférer `ModalOverlay` directement.
 */
export function ModalBackdrop({ children, onClose }: ModalBackdropProps) {
  return (
    <ModalOverlay isOpen onClose={onClose}>
      <div className="flex w-full justify-center">{children}</div>
    </ModalOverlay>
  );
}

export type { ModalBackdropProps };
