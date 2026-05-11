import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type PipTone = 'gold' | 'silver' | 'red' | 'green';
export type PipVariant = 'pip' | 'star' | 'chevron';

const pipToneClass: Record<PipTone, string> = {
  gold: 'border-[#704c0a] bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#a87b25)] shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_0_4px_rgba(241,196,15,.5)]',
  silver: 'border-[#4d595e] bg-[radial-gradient(circle_at_30%_25%,#f7fafc,#7e8b91)] shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_0_3px_rgba(127,140,141,.5)]',
  red: 'border-[#a93226] bg-[radial-gradient(circle_at_30%_25%,#fbd5d0,#7a1d10)] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_0_4px_rgba(169,50,38,.5)]',
  green: 'border-[#3a6c1f] bg-[radial-gradient(circle_at_30%_25%,#d6ecc4,#1d4a1d)] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_0_4px_rgba(46,134,84,.5)]',
};

export interface PipRatingProps {
  className?: string;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  tone?: PipTone;
  value: number;
  variant?: PipVariant;
}

export function PipRating({ className, max = 5, size = 'md', tone = 'gold', value, variant = 'pip' }: PipRatingProps) {
  const sizeClass = size === 'sm' ? 'size-[7px] border' : size === 'lg' ? 'size-3.5' : 'size-2.5';
  const starSize = size === 'lg' ? 'size-6' : 'size-[18px]';

  return (
    <span className={cn('inline-flex gap-[3px]', className)}>
      {Array.from({ length: max }, (_, index) => {
        const on = index < value;
        if (variant === 'star') {
          return <i key={index} className={cn('block [clip-path:polygon(50%_0,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]', starSize, on ? 'bg-gradient-to-b from-[#fef0c6] to-[#a87b25] drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]' : 'bg-black/20')} />;
        }
        if (variant === 'chevron') {
          return <i key={index} className={cn('h-0 w-0 border-x-[7px] border-b-[10px] border-x-transparent', on ? 'border-b-[#a87b25] drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]' : 'border-b-black/20')} />;
        }
        return <i key={index} className={cn('block rounded-full border-[1.5px]', sizeClass, on ? pipToneClass[tone] : 'border-black/30 bg-black/15 shadow-[inset_0_1px_1px_rgba(0,0,0,.2)]')} />;
      })}
    </span>
  );
}

export interface LevelChipProps {
  icon?: string;
  max?: number;
  value: number | 'MAX';
}

export function LevelChip({ icon, max, value }: LevelChipProps) {
  const isMax = value === 'MAX';
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 font-game text-xs font-extrabold text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]', isMax ? 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00]' : 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8]')}>
      {icon ? <img alt="" className="size-3.5" src={publicAsset(icon)} /> : null}
      {isMax ? '★ MAX' : <>Niv. <span className="tabular-nums">{value}</span>{max ? <><span className="opacity-40">/</span><span className="tabular-nums">{max}</span></> : null}</>}
    </span>
  );
}
