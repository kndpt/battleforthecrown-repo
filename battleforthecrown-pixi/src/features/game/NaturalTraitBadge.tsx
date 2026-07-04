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
      <button
        aria-label={ariaLabel}
        className={cn(
          'flex shrink-0 items-center gap-1 rounded-full border border-[rgba(120,200,140,.4)] bg-[rgba(30,60,35,.45)] px-2 py-1 text-[9.5px] font-bold tracking-[.06em] text-[#a9d9b3]',
          className,
        )}
        onClick={handleClick}
        type="button"
      >
        <img alt="" className="size-[14px] shrink-0 object-contain" src={info.iconAsset} />
        {variant === 'full' ? <span className="min-w-0 truncate">{info.label}</span> : null}
      </button>
      {open ? <NaturalTraitModal onClose={() => setOpen(false)} trait={trait} /> : null}
    </>
  );
}
