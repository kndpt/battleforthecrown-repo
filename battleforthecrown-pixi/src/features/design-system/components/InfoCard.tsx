import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export interface InfoCardStat {
  label: string;
  value: string;
  hidden?: boolean;
}

export interface InfoCardProps {
  className?: string;
  dark?: boolean;
  flavor?: string;
  icon?: string;
  stats: InfoCardStat[];
  title: string;
}

export function InfoCard({ className, dark, flavor, icon, stats, title }: InfoCardProps) {
  return (
    <article
      className={cn(
        'min-w-40 rounded-[10px] border-2 p-2.5 font-game shadow-[0_6px_18px_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.55)]',
        dark ? 'border-[#0a0a0a] bg-gradient-to-b from-[#3d2f1f] to-[#1a1a1a] text-[#f5e6d3]' : 'border-[#5d4a32] bg-gradient-to-b from-[#fef9f0] to-[#f5e6d3] text-[#3d2f1f]',
        className,
      )}
    >
      <div className={cn('mb-1 flex items-center gap-1.5 text-[13px] font-bold', dark ? 'text-[#f6d57b]' : '')}>
        {icon ? <img alt="" className="size-5 object-contain" src={publicAsset(icon)} /> : null}
        {title}
      </div>
      <div className="grid grid-cols-[auto_auto] gap-x-2 gap-y-0.5 text-[10.5px]">
        {stats.map((stat) => (
          <div key={stat.label} className="contents">
            <span className={cn(dark ? 'text-[#cdb88a]' : 'text-[#6d5838]')}>{stat.label}</span>
            <span className={cn('text-right font-bold tabular-nums', stat.hidden ? 'blur-[3px] select-none' : '')}>{stat.value}</span>
          </div>
        ))}
      </div>
      {flavor ? <p className={cn('mt-1 text-[10px] italic leading-4', dark ? 'text-[#cdb88a]' : 'text-[#7d5a3a]')}>{flavor}</p> : null}
    </article>
  );
}
