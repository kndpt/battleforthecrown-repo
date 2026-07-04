import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { VillageNaturalTrait } from '@battleforthecrown/shared/village';
import { naturalTraitInfo } from './naturalTraitInfo';
import { NaturalTraitModal } from './NaturalTraitModal';

export type NaturalTraitBadgeVariant = 'icon-only' | 'full';

export interface NaturalTraitBadgeProps {
  className?: string;
  onClick?: () => void;
  trait: VillageNaturalTrait;
  variant: NaturalTraitBadgeVariant;
}

/**
 * Badge cliquable du trait naturel d'un village. Deux variantes (spec 093
 * § « Variantes d'affichage du badge ») : `icon-only` (header `/game`, place
 * contrainte) et `full` (rapport scout, panneau carte). Ouvre `NaturalTraitModal`
 * en interne sauf si un parent fournit `onClick` (override explicite).
 */
export function NaturalTraitBadge({
  className,
  onClick,
  trait,
  variant,
}: NaturalTraitBadgeProps) {
  const [open, setOpen] = useState(false);
  const info = naturalTraitInfo(trait);
  const ariaLabel = `${info.label} — ${info.bonusLabel}`;

  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }
    setOpen(true);
  }

  return (
    <>
      {variant === 'icon-only' ? (
        // Header `/game` — HUD sombre : pilule translucide alignée sur le chip
        // stratégie voisin (bordure parchemin, fond noir .38), icône seule.
        <button
          aria-label={ariaLabel}
          className={cn(
            'flex shrink-0 items-center rounded-full border border-[rgba(205,184,138,.35)] bg-[rgba(0,0,0,.38)] p-1 transition-colors hover:bg-[rgba(0,0,0,.52)]',
            className,
          )}
          onClick={handleClick}
          type="button"
        >
          <img alt="" className="size-[15px] shrink-0 object-contain" src={info.iconAsset} />
        </button>
      ) : (
        // Scout report / panneau carte — parchemin : stat-chip aligné sur
        // `StyleStat`/`WallStat` (carré icône + label 2 lignes), cliquable.
        <button
          aria-label={ariaLabel}
          className={cn(
            'group flex min-w-0 shrink-0 items-center gap-[9px] self-start rounded-xl px-1.5 py-1 font-game transition-colors hover:bg-[rgba(93,74,50,.08)]',
            className,
          )}
          onClick={handleClick}
          type="button"
        >
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] border-[1.5px] border-[#5d4a32] bg-[linear-gradient(to_bottom,#cdb88a,#8b7355)] shadow-[inset_0_1px_0_rgba(255,255,255,.35)]">
            <img alt="" className="size-[24px] object-contain" src={info.iconAsset} />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-[8.5px] font-bold uppercase tracking-[.16em] text-[#6d5838]">
              Trait naturel
            </span>
            <span className="block truncate text-[15px] font-extrabold text-[#3d2f1f]">
              {info.label}
            </span>
          </span>
        </button>
      )}
      <NaturalTraitModal isOpen={open} onClose={() => setOpen(false)} trait={trait} />
    </>
  );
}
