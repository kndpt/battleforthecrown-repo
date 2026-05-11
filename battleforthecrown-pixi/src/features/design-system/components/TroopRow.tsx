import { BftcButton } from './BftcButton';
import { IconTile } from './IconTile';
import { PanelSurface } from './PanelSurface';
import { cn } from '@/lib/cn';

export interface TroopStat {
  label: string;
  tone?: 'attack' | 'defense' | 'neutral';
  value: string;
}

export interface TroopRowProps {
  actionLabel: string;
  actionVariant?: 'success' | 'info' | 'neutral';
  icon: string;
  locked?: boolean;
  name: string;
  onAction?: () => void;
  quantity: string;
  stats: TroopStat[];
}

const statToneClass: Record<NonNullable<TroopStat['tone']>, string> = {
  attack: 'text-[#a93226]',
  defense: 'text-[#1f5288]',
  neutral: 'text-[#6d5838]',
};

export function TroopRow({
  actionLabel,
  actionVariant = 'success',
  icon,
  locked = false,
  name,
  onAction,
  quantity,
  stats,
}: TroopRowProps) {
  return (
    <PanelSurface
      className={cn(
        'grid grid-cols-[54px_1fr_auto_auto] items-center gap-2.5 rounded-xl px-2.5 py-1.5',
        locked && 'opacity-55 grayscale-[0.7]',
      )}
    >
      <IconTile icon={icon} size="lg" />
      <div className="min-w-0">
        <div className="truncate font-game text-[13px] font-bold text-[#3d2f1f]">{name}</div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 font-game text-[11px] tabular-nums text-[#6d5838]">
          {stats.map((stat) => (
            <span key={`${stat.label}-${stat.value}`} className={statToneClass[stat.tone ?? 'neutral']}>
              {stat.label} <b className="font-bold text-[#3d2f1f]">{stat.value}</b>
            </span>
          ))}
        </div>
      </div>
      <div className="font-game text-lg font-extrabold leading-none tabular-nums text-[#3d2f1f]">
        {quantity}
        {quantity !== '—' ? (
          <small className="block text-right text-[9.5px] font-semibold text-[#6d5838]">casernées</small>
        ) : null}
      </div>
      <BftcButton className="px-2.5 py-1 text-[11px]" onClick={onAction} variant={actionVariant}>
        {actionLabel}
      </BftcButton>
    </PanelSurface>
  );
}
