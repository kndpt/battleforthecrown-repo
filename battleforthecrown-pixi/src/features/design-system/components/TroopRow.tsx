import { BftcButton, type BftcButtonVariant } from './BftcButton';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export interface TroopStat {
  label: string;
  tone?: 'attack' | 'defense' | 'neutral' | 'locked';
  value?: string;
}

export interface TroopRowProps {
  actionLabel: string;
  actionVariant?: BftcButtonVariant;
  className?: string;
  icon: string;
  locked?: boolean;
  name: string;
  onAction?: () => void;
  quantity: string;
  quantityLabel?: string;
  stats: TroopStat[];
}

const statToneClass: Record<NonNullable<TroopStat['tone']>, string> = {
  attack: 'text-[#a93226]',
  defense: 'text-[#1f5288]',
  neutral: 'text-[#6d5838]',
  locked: 'text-[#7f8c8d]',
};

export function TroopRow({
  actionLabel,
  actionVariant = 'success',
  className,
  icon,
  locked = false,
  name,
  onAction,
  quantity,
  quantityLabel,
  stats,
}: TroopRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[54px_1fr_auto_auto] items-center gap-2.5 rounded-xl border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] py-1.5 pl-1.5 pr-2.5 shadow-[0_3px_0_rgba(0,0,0,.18)]',
        locked ? 'opacity-[.55] grayscale-[.7]' : '',
        className,
      )}
    >
      <div className="flex size-[54px] items-center justify-center rounded-[10px] border-2 border-[rgba(0,0,0,.25)] bg-[rgba(0,0,0,.18)]">
        <img alt="" className="size-11 object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,.4)]" src={publicAsset(icon)} />
      </div>
      <div className="min-w-0">
        <div className="font-game text-[13px] font-bold text-[#3d2f1f]">{name}</div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 font-game text-[11px] tabular-nums text-[#6d5838]">
          {stats.map((stat) => (
            <span className={statToneClass[stat.tone ?? 'neutral']} key={`${stat.label}-${stat.value ?? ''}`}>
              {stat.label}
              {stat.value ? <> <b className="font-bold text-[#3d2f1f]">{stat.value}</b></> : null}
            </span>
          ))}
        </div>
      </div>
      <div className="font-game text-lg font-extrabold leading-none tabular-nums text-[#3d2f1f]">
        {quantity}
        {quantityLabel ? <small className="block text-right text-[9.5px] font-semibold text-[#6d5838]">{quantityLabel}</small> : null}
      </div>
      <BftcButton className="px-2.5 py-[5px] text-[11px]" onClick={onAction} variant={actionVariant}>
        {actionLabel}
      </BftcButton>
    </div>
  );
}
