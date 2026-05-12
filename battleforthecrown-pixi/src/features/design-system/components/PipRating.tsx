import type { HTMLAttributes } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type PipRatingTone = 'gold' | 'silver' | 'red' | 'green';
export type PipRatingSize = 'sm' | 'md' | 'lg';
export type PipRatingVariant = 'pip' | 'star' | 'chevron';

export interface PipRatingProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange'> {
  max: number;
  onChange?: (value: number) => void;
  size?: PipRatingSize;
  tone?: PipRatingTone;
  value: number;
  variant?: PipRatingVariant;
}

export interface LevelChipProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: string;
  max?: number;
  tone?: 'default' | 'max';
  value?: number;
}

export interface BuildingLevelRowProps extends HTMLAttributes<HTMLDivElement> {
  icon: string;
  level: number;
  maxLevel: number;
  ratingTone?: PipRatingTone;
  subtitle: string;
  title: string;
}

const pipSizeClass: Record<PipRatingSize, string> = {
  sm: 'size-[7px] border',
  md: 'size-2.5 border-[1.5px]',
  lg: 'size-3.5 border-[1.5px]',
};

const pipToneClass: Record<PipRatingTone, string> = {
  gold: 'border-[#704c0a] bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#a87b25)] shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_0_4px_rgba(241,196,15,.5)]',
  silver: 'border-[#4d595e] bg-[radial-gradient(circle_at_30%_25%,#f7fafc,#7e8b91)] shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_0_3px_rgba(127,140,141,.5)]',
  red: 'border-[#a93226] bg-[radial-gradient(circle_at_30%_25%,#fbd5d0,#7a1d10)] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_0_4px_rgba(169,50,38,.5)]',
  green: 'border-[#3a6c1f] bg-[radial-gradient(circle_at_30%_25%,#d6ecc4,#1d4a1d)] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_0_4px_rgba(46,134,84,.5)]',
};

const starSizeClass: Record<Exclude<PipRatingSize, 'sm'>, string> = {
  md: 'size-[18px]',
  lg: 'size-6',
};

function range(max: number) {
  return Array.from({ length: max }, (_, index) => index + 1);
}

export function PipRating({
  className,
  max,
  onChange,
  size = 'md',
  tone = 'gold',
  value,
  variant = 'pip',
  ...props
}: PipRatingProps) {
  const boundedValue = Math.max(0, Math.min(max, value));

  if (variant === 'star') {
    const starSize = size === 'sm' ? 'md' : size;

    return (
      <span className={cn('inline-flex gap-[3px]', className)} {...props}>
        {range(max).map((pipValue) => {
          const on = pipValue <= boundedValue;
          const Tag = onChange ? 'button' : 'i';

          return (
            <Tag
              className={cn(
                'block [clip-path:polygon(50%_0,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]',
                starSizeClass[starSize],
                on ? 'bg-[linear-gradient(to_bottom,#fef0c6,#a87b25)] drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]' : 'bg-[rgba(0,0,0,.18)]',
                onChange ? 'cursor-pointer border-0 p-0' : '',
              )}
              key={pipValue}
              onClick={onChange ? () => onChange(pipValue) : undefined}
              type={onChange ? 'button' : undefined}
            />
          );
        })}
      </span>
    );
  }

  if (variant === 'chevron') {
    return (
      <span className={cn('inline-flex gap-0.5', className)} {...props}>
        {range(max).map((pipValue) => {
          const on = pipValue <= boundedValue;
          const Tag = onChange ? 'button' : 'i';

          return (
            <Tag
              className={cn(
                'h-0 w-0 border-x-[7px] border-b-[10px] border-x-transparent',
                on ? 'border-b-[#a87b25] drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]' : 'border-b-[rgba(0,0,0,.2)]',
                onChange ? 'cursor-pointer p-0' : '',
              )}
              key={pipValue}
              onClick={onChange ? () => onChange(pipValue) : undefined}
              type={onChange ? 'button' : undefined}
            />
          );
        })}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex gap-[3px]', className)} {...props}>
      {range(max).map((pipValue) => {
        const on = pipValue <= boundedValue;
        const Tag = onChange ? 'button' : 'i';

        return (
          <Tag
            className={cn(
              'rounded-full',
              pipSizeClass[size],
              on ? pipToneClass[tone] : 'border-[rgba(0,0,0,.3)] bg-[rgba(0,0,0,.15)] shadow-[inset_0_1px_1px_rgba(0,0,0,.2)]',
              onChange ? 'cursor-pointer p-0' : '',
            )}
            key={pipValue}
            onClick={onChange ? () => onChange(pipValue) : undefined}
            type={onChange ? 'button' : undefined}
          />
        );
      })}
    </span>
  );
}

export function LevelChip({ className, icon, max, tone = 'default', value, ...props }: LevelChipProps) {
  const maxTone = tone === 'max';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-[7px] rounded-full border-2 px-2.5 py-1 font-game text-xs font-extrabold text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]',
        maxTone ? 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] text-[#3a2a00]' : 'border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)]',
        className,
      )}
      {...props}
    >
      {maxTone ? '★ MAX' : (
        <>
          {icon ? <img alt="" className="size-3.5" src={publicAsset(icon)} /> : null}
          Niv.
          {value !== undefined ? <span className="tabular-nums">{value}</span> : null}
          {max !== undefined ? (
            <>
              <span className="opacity-[.4]">/</span>
              <span className="tabular-nums">{max}</span>
            </>
          ) : null}
        </>
      )}
    </span>
  );
}

export function BuildingLevelRow({
  className,
  icon,
  level,
  maxLevel,
  ratingTone = 'gold',
  subtitle,
  title,
  ...props
}: BuildingLevelRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[42px_1fr_auto_auto] items-center gap-2.5 rounded-xl border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_3px_0_rgba(0,0,0,.16)]',
        className,
      )}
      {...props}
    >
      <img alt="" className="size-[38px]" src={publicAsset(icon)} />
      <div>
        <div className="font-game text-[13px] font-bold text-[#3d2f1f]">{title}</div>
        <div className="font-game text-[11px] text-[#6d5838]">{subtitle}</div>
      </div>
      <PipRating max={maxLevel} size="lg" tone={ratingTone} value={level} />
      <LevelChip max={maxLevel} tone={level >= maxLevel ? 'max' : 'default'} value={level} />
    </div>
  );
}
