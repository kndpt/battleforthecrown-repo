import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export interface ShopTileProps {
  badge?: string;
  className?: string;
  currencyIcon: string;
  icon: string;
  name: string;
  onBuy?: () => void;
  price: string;
  quantity?: string;
  soldOut?: boolean;
  tone?: 'cash' | 'crown';
}

export function ShopTile({ badge, className, currencyIcon, icon, name, onBuy, price, quantity, soldOut, tone = 'crown' }: ShopTileProps) {
  return (
    <article className={cn('relative rounded-xl border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] px-2 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(0,0,0,.16)]', soldOut ? 'opacity-55 grayscale after:absolute after:inset-0 after:grid after:place-items-center after:rounded-[10px] after:bg-black/40 after:font-game after:text-sm after:font-black after:tracking-[0.15em] after:text-white after:content-["ÉPUISÉ"]' : '', className)}>
      {badge ? <span className="absolute right-0 top-0 rounded-bl-md rounded-tr-[10px] bg-gradient-to-b from-[#e74c3c] to-[#c0392b] px-1.5 py-px font-game text-[9px] font-extrabold text-white text-shadow-game">{badge}</span> : null}
      {quantity ? <span className="absolute left-1.5 top-1.5 rounded-full border border-[#704c0a] bg-gradient-to-b from-[#3d2f1f] to-[#1a1a1a] px-1.5 py-px font-game text-[11px] font-extrabold text-[#f6d57b]">{quantity}</span> : null}
      <div className="mx-auto mb-1 grid size-[60px] place-items-center rounded-full border-2 border-black/20 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.5),rgba(0,0,0,.1))]">
        <img alt="" className="size-[46px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,.3)]" src={publicAsset(icon)} />
      </div>
      <h3 className="min-h-7 font-game text-[11.5px] font-bold leading-tight text-[#3d2f1f]">{name}</h3>
      <button
        className={cn('mt-1 inline-flex items-center gap-1 rounded-full border-2 py-0.5 pl-1 pr-2 font-game text-xs font-extrabold tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_2px_0_rgba(0,0,0,.18)]', tone === 'cash' ? 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a] text-white text-shadow-game' : 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00]')}
        disabled={soldOut}
        onClick={onBuy}
        type="button"
      >
        <img alt="" className="size-3.5" src={publicAsset(currencyIcon)} />
        {price}
      </button>
    </article>
  );
}
