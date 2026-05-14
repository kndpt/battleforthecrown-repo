'use client';

import { useEffect } from 'react';
import { Button } from '@/ui/buttons/Button';

export interface VictoryModalProps {
  isOpen: boolean;
  villageName: string;
  x: number;
  y: number;
  onClose: () => void;
  onViewVillage: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const VictoryModal = ({
  isOpen,
  villageName,
  x,
  y,
  onClose,
  onViewVillage,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: VictoryModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleOverlayClick}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleOverlayClick}
      >
        <div
          className="w-[90%] max-w-md overflow-hidden rounded-lg border-4 border-[#5d4a32] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] font-game shadow-[0_0_0_2px_#5d4a32,0_12px_32px_rgba(0,0,0,0.55)] transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="victory-modal-title"
        >
          <div className="h-1.5 bg-gradient-to-r from-game-green-light to-game-green-dark" />

          <div className="px-6 py-7 text-center">
            <img
              src="/assets/casual-icons/crown.png"
              alt=""
              className="mx-auto h-20 w-20 drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
            />
            <h2
              id="victory-modal-title"
              className="mt-2 font-cinzel text-4xl font-extrabold uppercase tracking-wider text-[#5a4400] [text-shadow:0_2px_0_#fff,0_3px_6px_rgba(0,0,0,0.25)]"
            >
              Victoire
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#6d5838]">
              Vous avez conquis <span className="font-bold text-[#3d2f1f]">{villageName}</span> !
              <br />
              <span className="text-xs text-[#8b6f47]">
                ({x}, {y})
              </span>
            </p>
          </div>

          <div className="flex justify-center gap-2 bg-black/5 px-6 py-3">
            <Button variant="success" size="md" onClick={onViewVillage}>
              Voir le village
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
