import { BftcButton } from './BftcButton';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export interface DailyRewardDay {
  amount: string;
  day: string;
  done?: boolean;
  icon: string;
  jackpot?: boolean;
  today?: boolean;
}

export interface DailyRewardProps {
  actionLabel?: string;
  days: DailyRewardDay[];
  eyebrow: string;
  onClaim?: () => void;
  subtitle?: string;
  title: string;
}

export function DailyReward({ actionLabel, days, eyebrow, onClaim, subtitle, title }: DailyRewardProps) {
  return (
    <section className="rounded-[14px] border-[3px] border-[#704c0a] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] p-3.5 text-[#3d2f1f] shadow-[0_6px_14px_rgba(0,0,0,.3),inset_0_2px_0_rgba(255,255,255,.5)]">
      <header className="mb-2.5 text-center">
        <div className="font-game text-[10px] font-bold uppercase tracking-[0.2em] text-[#704c0a]">{eyebrow}</div>
        <h3 className="font-game text-lg font-extrabold text-[#3a2a00]">{title}</h3>
        {subtitle ? <p className="font-game text-[11px] italic text-[#6d5838]">{subtitle}</p> : null}
      </header>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <div
            key={day.day}
            className={cn(
              'relative rounded-[10px] border-2 px-1 py-2 text-center',
              day.done ? 'border-[#3a6c1f] bg-gradient-to-b from-[#d6ecc4] to-[#a8d28d] opacity-85 after:absolute after:right-1 after:top-0.5 after:font-game after:text-xs after:font-black after:text-[#3a6c1f] after:content-["✓"]' : 'border-[#8b7355] bg-gradient-to-b from-[#fff8e8] to-[#e8d4a8]',
              day.today ? 'z-[1] -translate-y-1 border-[#9e7b0d] bg-gradient-to-b from-[#fef0c6] to-[#e8c878] shadow-[0_0_0_3px_rgba(241,196,15,.4),0_0_14px_rgba(241,196,15,.45)] before:absolute before:-top-2.5 before:left-1/2 before:-translate-x-1/2 before:whitespace-nowrap before:rounded-full before:border-2 before:border-[#9e7b0d] before:bg-gradient-to-b before:from-[#f1c40f] before:to-[#d4a017] before:px-1.5 before:py-px before:font-game before:text-[8px] before:font-extrabold before:text-[#3a2a00] before:content-["AUJOURD’HUI"]' : '',
              day.jackpot ? 'border-[3px] border-[#704c0a] bg-gradient-to-b from-white to-[#f6d57b] before:absolute before:-top-2.5 before:left-1/2 before:-translate-x-1/2 before:whitespace-nowrap before:rounded-full before:border before:border-[#704c0a] before:bg-gradient-to-b before:from-[#3d2f1f] before:to-[#1a1a1a] before:px-1.5 before:py-px before:font-game before:text-[8px] before:font-extrabold before:text-[#f6d57b] before:content-["★_7_JOURS"]' : '',
            )}
          >
            <div className="mb-1 font-game text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#6d5838]">{day.day}</div>
            <img alt="" className={cn('mx-auto size-8 object-contain', day.jackpot ? 'size-10' : '', day.done ? 'grayscale' : '')} src={publicAsset(day.icon)} />
            <div className={cn('mt-0.5 font-game text-[11px] font-extrabold tabular-nums text-[#3d2f1f]', day.jackpot ? 'text-[13px] text-[#704c0a]' : '')}>{day.amount}</div>
          </div>
        ))}
      </div>
      {actionLabel ? <div className="mt-3 flex justify-center"><BftcButton onClick={onClaim}>{actionLabel}</BftcButton></div> : null}
    </section>
  );
}
