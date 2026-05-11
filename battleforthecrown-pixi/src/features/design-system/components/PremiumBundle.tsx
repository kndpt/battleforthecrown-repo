import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export interface PremiumBundleLine {
  icon?: string;
  label: string;
  value: string;
}

export interface PremiumBundleProps {
  badge?: string;
  className?: string;
  eyebrow: string;
  featured?: boolean;
  icon: string;
  lines: PremiumBundleLine[];
  oldPrice?: string;
  onBuy?: () => void;
  price: string;
  royal?: boolean;
  title: string;
}

export function PremiumBundle({ badge, className, eyebrow, featured, icon, lines, oldPrice, onBuy, price, royal, title }: PremiumBundleProps) {
  return (
    <article
      className={cn(
        'relative flex min-h-[360px] min-w-0 flex-col overflow-hidden rounded-[14px] border-[3px] p-0 shadow-[0_6px_14px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.5)]',
        royal
          ? 'border-[#1a052f] bg-gradient-to-b from-[#5b2c8a] to-[#2c0e4d] text-[#f6d57b]'
          : featured
            ? 'border-[#704c0a] bg-gradient-to-b from-[#fff5d8] to-[#f0c860] text-[#3d2f1f] shadow-[0_0_0_3px_rgba(241,196,15,.35),0_10px_22px_rgba(0,0,0,.45)]'
            : 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] text-[#3d2f1f]',
        className,
      )}
    >
      {badge ? (
        <span className="absolute right-[-34px] top-3 z-10 rotate-[36deg] border border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b] px-9 py-0.5 font-game text-[9px] font-extrabold tracking-[0.08em] text-white text-shadow-game">
          {badge}
        </span>
      ) : null}
      <div className="px-2.5 pb-2 pt-3 text-center">
        <div className={cn('font-game text-[9px] font-bold uppercase tracking-[0.16em] opacity-75', royal ? 'text-[#f6d57b]' : '')}>
          {eyebrow}
        </div>
        <h3 className="mx-auto mt-0.5 min-h-[38px] max-w-[11rem] text-balance font-game text-[18px] font-extrabold leading-[1.05]">
          {title}
        </h3>
        <div
          className={cn(
            'mx-auto my-2 grid size-[78px] place-items-center rounded-full border-[3px] border-current bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.5),rgba(0,0,0,.18))]',
            royal ? 'border-[#704c0a] bg-[radial-gradient(circle_at_30%_25%,#f6d57b,#2c0e4d)]' : '',
          )}
        >
          <img alt="" className="size-[58px] object-contain" src={publicAsset(icon)} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-2.5 pb-2">
        {lines.map((line) => (
          <div
            key={line.label}
            className={cn(
              'flex min-h-[32px] min-w-0 items-center gap-1.5 rounded-lg border border-black/10 bg-black/[0.05] px-2 py-1 font-game text-[11px] leading-tight tabular-nums',
              royal ? 'border-[#f6d57b]/20 bg-white/[0.06]' : '',
            )}
          >
            {line.icon ? <img alt="" className="size-[18px] shrink-0 object-contain" src={publicAsset(line.icon)} /> : null}
            <span className="min-w-0 flex-1 truncate">{line.label}</span>
            <b className="shrink-0 whitespace-nowrap font-extrabold">{line.value}</b>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1 px-2.5 pb-3">
        {oldPrice ? <span className="font-game text-[11px] tabular-nums line-through opacity-55">{oldPrice}</span> : null}
        <span className={cn('whitespace-nowrap font-game text-[22px] font-black tabular-nums text-[#a93226]', royal ? 'text-[#f6d57b] text-shadow-game' : '')}>
          {price}
        </span>
        <button
          className={cn(
            'w-full rounded-[10px] border-2 px-3 py-2 font-game text-[13px] font-extrabold shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(0,0,0,.22)]',
            royal ? 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00]' : 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a] text-white text-shadow-game',
          )}
          onClick={onBuy}
          type="button"
        >
          Acheter
        </button>
      </div>
    </article>
  );
}
