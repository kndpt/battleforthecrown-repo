'use client';

import { useEffect } from 'react';
import { Button } from '@/ui/buttons/Button';
import type { DefeatModalItem } from '@/stores/ui';
import { villageAssetSrcFromCastleLevel } from '@/features/world/villageAsset';

export interface DefeatModalProps {
  isOpen: boolean;
  items: DefeatModalItem[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onAcknowledge: (item: DefeatModalItem) => void;
  onViewVillage: (item: DefeatModalItem) => void;
  closeOnEscape?: boolean;
}

export const DefeatModal = ({
  isOpen,
  items,
  activeIndex,
  onIndexChange,
  onAcknowledge,
  onViewVillage,
  closeOnEscape = true,
}: DefeatModalProps) => {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Clamp defensively: the active item may have just been acknowledged.
  const safeIndex = Math.max(0, Math.min(activeIndex, items.length - 1));
  const current = items[safeIndex];

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && current) onAcknowledge(current);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, current, onAcknowledge]);

  if (!isOpen || !current) return null;

  const total = items.length;
  const hasMultiple = total > 1;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-[90%] max-w-md overflow-hidden rounded-lg border-4 border-[#5d4a32] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] font-game shadow-[0_0_0_2px_#5d4a32,0_12px_32px_rgba(0,0,0,0.55)] transition-all duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="defeat-modal-title"
        >
          <div className="h-1.5 bg-gradient-to-r from-game-red-light to-game-red-dark" />

          <div className="px-6 py-7 text-center">
            <h2
              id="defeat-modal-title"
              className="font-cinzel text-4xl font-extrabold uppercase tracking-wider text-[#7a1f1f] [text-shadow:0_2px_0_#fff,0_3px_6px_rgba(0,0,0,0.25)]"
            >
              Village perdu
            </h2>

            <img
              src={villageAssetSrcFromCastleLevel(current.castleLevel)}
              alt={current.villageName}
              className="mx-auto mt-4 h-28 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] grayscale-[0.35]"
              loading="lazy"
              decoding="async"
            />

            <p className="mt-4 text-sm leading-relaxed text-[#6d5838]">
              <span className="font-bold text-[#3d2f1f]">{current.villageName}</span>{' '}
              est tombé aux mains de{' '}
              <span className="font-bold text-[#7a1f1f]">{current.newOwnerName}</span>.
              <br />
              <span className="text-xs text-[#8b6f47]">
                ({current.x}, {current.y})
              </span>
            </p>

            {hasMultiple && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  aria-label="Village précédent"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#5d4a32] bg-[#fef9f0] text-[#5d4a32] disabled:opacity-40"
                  disabled={safeIndex === 0}
                  onClick={() => onIndexChange(safeIndex - 1)}
                >
                  ‹
                </button>
                <div className="flex items-center gap-1.5" aria-hidden>
                  {items.map((item, i) => (
                    <span
                      key={item.id}
                      className={`h-2 w-2 rounded-full ${
                        i === safeIndex ? 'bg-[#7a1f1f]' : 'bg-[#c9b48a]'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Village suivant"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#5d4a32] bg-[#fef9f0] text-[#5d4a32] disabled:opacity-40"
                  disabled={safeIndex === total - 1}
                  onClick={() => onIndexChange(safeIndex + 1)}
                >
                  ›
                </button>
              </div>
            )}

            {hasMultiple && (
              <p className="mt-2 text-xs text-[#8b6f47]">
                {safeIndex + 1} / {total}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-2 bg-black/5 px-6 py-3">
            <Button
              variant="neutral"
              size="md"
              onClick={() => onViewVillage(current)}
            >
              Voir sur la carte
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => onAcknowledge(current)}
            >
              Valider
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
