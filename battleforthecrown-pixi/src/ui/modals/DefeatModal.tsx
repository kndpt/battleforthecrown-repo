'use client';

import { useEffect } from 'react';
import type { DefeatModalItem } from '@/stores/ui';
import { Button } from '@/ui/buttons/Button';
import { villageImageSrcForVisualTier } from '@/api/world-types';

export interface DefeatModalProps {
  items: DefeatModalItem[];
  activeIndex: number;
  onSelectIndex: (i: number) => void;
  onAcknowledge: (item: DefeatModalItem) => void;
  onViewVillage: (item: DefeatModalItem) => void;
}

export const DefeatModal = ({
  items,
  activeIndex,
  onSelectIndex,
  onAcknowledge,
  onViewVillage,
}: DefeatModalProps) => {
  const item = items[activeIndex] ?? null;
  const total = items.length;

  // Acquittement explicite obligatoire : pas de fermeture par Escape ni clic overlay
  // (la victime doit « Valider » pour persister `readByDefender`). On verrouille juste
  // le scroll de fond tant que la modal est montée.
  useEffect(() => {
    if (!item) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [item]);

  if (!item) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-[90%] max-w-md overflow-hidden rounded-lg border-4 border-[#3a1a1a] bg-gradient-to-b from-[#2a1010] to-[#1a0808] font-game shadow-[0_0_0_2px_#5a1a1a,0_12px_32px_rgba(0,0,0,0.75)] transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="defeat-modal-title"
        >
          {/* Bandeau rouge sombre */}
          <div className="h-1.5 bg-gradient-to-r from-[#8b0000] to-[#c0392b]" />

          <div className="px-6 py-7 text-center">
            {/* Image du village perdu */}
            <img
              src={villageImageSrcForVisualTier(item.visualTier)}
              alt={item.villageName}
              className="mx-auto h-20 w-20 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] grayscale"
            />

            <h2
              id="defeat-modal-title"
              className="mt-2 font-cinzel text-3xl font-extrabold uppercase tracking-wider text-[#e05050] [text-shadow:0_2px_0_rgba(0,0,0,0.5),0_3px_6px_rgba(0,0,0,0.4)]"
            >
              Village perdu
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-[#c9a0a0]">
              <span className="font-bold text-[#e8c8c8]">{item.villageName}</span> a été conquis
              par{' '}
              <span className="font-bold text-[#e05050]">{item.conquerorName}</span>.
              <br />
              <span className="text-xs text-[#9a7070]">
                ({item.x}, {item.y})
              </span>
            </p>

            {/* Navigation carrousel */}
            {total > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => onSelectIndex(activeIndex - 1)}
                  disabled={activeIndex === 0}
                  aria-label="Village précédent"
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#5a2020] bg-[#3a1010] text-[#c9a0a0] transition hover:bg-[#5a1010] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>

                <div className="flex gap-1">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectIndex(i)}
                      aria-label={`Village ${i + 1}`}
                      className={`h-2 w-2 rounded-full transition-all ${
                        i === activeIndex
                          ? 'scale-125 bg-[#e05050]'
                          : 'bg-[#5a2020] hover:bg-[#8a3030]'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => onSelectIndex(activeIndex + 1)}
                  disabled={activeIndex === total - 1}
                  aria-label="Village suivant"
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#5a2020] bg-[#3a1010] text-[#c9a0a0] transition hover:bg-[#5a1010] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>

                <span className="ml-1 text-xs text-[#9a7070]">
                  {activeIndex + 1} / {total}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-2 bg-black/30 px-6 py-3">
            <Button variant="neutral" size="md" onClick={() => onViewVillage(item)}>
              Pointer sur la carte
            </Button>
            <Button variant="danger" size="md" onClick={() => onAcknowledge(item)}>
              Valider
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
