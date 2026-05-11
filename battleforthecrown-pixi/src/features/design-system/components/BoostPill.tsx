import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type BoostTone = 'production' | 'attack' | 'defense' | 'build' | 'vip' | 'debuff';

const toneClass: Record<BoostTone, string> = {
  production: 'border-[#3a6c1f] bg-gradient-to-b from-[#d6ecc4] to-[#a8d28d] text-[#1a4408]',
  attack: 'border-[#a93226] bg-gradient-to-b from-[#fbd5d0] to-[#e89c93] text-[#7a1d10]',
  defense: 'border-[#1f5288] bg-gradient-to-b from-[#cfe2f6] to-[#8eb2dc] text-[#102e58]',
  build: 'border-[#9e7b0d] bg-gradient-to-b from-[#fef0c6] to-[#e8c878] text-[#5a4400]',
  vip: 'border-[#1a052f] bg-gradient-to-b from-[#5b2c8a] to-[#2c0e4d] text-[#f6d57b] text-shadow-game',
  debuff: 'border-[#0a0a0a] bg-gradient-to-b from-[#3d2f1f] to-[#1a1a1a] text-[#e74c3c] text-shadow-game',
};

export interface BoostPillProps {
  className?: string;
  icon: string;
  label: string;
  time?: string;
  tone?: BoostTone;
}

export function BoostPill({ className, icon, label, time, tone = 'production' }: BoostPillProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border-2 py-0.5 pl-1 pr-2 font-game text-xs font-bold tabular-nums', toneClass[tone], className)}>
      <span className="grid size-5 place-items-center rounded-full bg-white/35">
        <img alt="" className="size-4 object-contain" src={publicAsset(icon)} />
      </span>
      {label}
      {time ? <span className="text-[10px] font-semibold opacity-85 before:mx-1 before:content-['·']">{time}</span> : null}
    </span>
  );
}

export interface ActiveBoostItem {
  icon: string;
  label: string;
  onRemove?: () => void;
  time?: string;
  tone?: BoostTone;
  value: string;
}

export interface ActiveBoostListProps {
  items: ActiveBoostItem[];
  title: string;
}

export function ActiveBoostList({ items, title }: ActiveBoostListProps) {
  return (
    <section className="flex flex-col gap-1.5 rounded-xl border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] p-2.5">
      <h4 className="font-game text-[10px] font-bold uppercase tracking-[0.14em] text-[#5d4a32]">{title}</h4>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-white/40 px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-2 font-game text-xs font-bold text-[#3d2f1f]">
            <img alt="" className="size-[22px] object-contain" src={publicAsset(item.icon)} />
            <span className="truncate">{item.label}</span>
            <BoostPill className="py-px text-[10px]" icon={item.icon} label={item.value} tone={item.tone} />
          </div>
          <div className="flex items-center gap-1.5">
            {item.time ? <span className="font-game text-[11px] font-bold tabular-nums text-[#6d5838]">⏱ {item.time}</span> : null}
            {item.onRemove ? (
              <button className="grid size-[22px] place-items-center rounded-md border border-black/20 bg-black/10" onClick={item.onRemove} type="button">
                <X size={12} />
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  );
}
