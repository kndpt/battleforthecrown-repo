import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type ArmyMovementSurface = 'dark' | 'parchment';
export type ArmyMovementTone = 'attack' | 'defend' | 'reinforce' | 'return' | 'scout' | 'conquest';

export interface ArmyMovementRowProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  clockIcon?: string;
  icon: string;
  incoming?: boolean;
  movementId: string;
  onRecall?: (movementId: string) => void;
  progress: number;
  recallLabel?: string;
  statusLabel?: ReactNode;
  surface?: ArmyMovementSurface;
  subtitle: ReactNode;
  time: string;
  title: ReactNode;
  tone: ArmyMovementTone;
}

export interface ArmyMovementListProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  movements: ArmyMovementRowProps[];
}

const movementToneClass: Record<ArmyMovementTone, string> = {
  attack: 'border-[#a93226] bg-[linear-gradient(to_bottom,rgba(231,76,60,.25),rgba(0,0,0,.4))]',
  conquest: 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,rgba(241,196,15,.28),rgba(0,0,0,.4))]',
  defend: 'border-[#1f5288] bg-[linear-gradient(to_bottom,rgba(91,155,213,.28),rgba(0,0,0,.4))]',
  reinforce: 'border-[#1f5288] bg-[linear-gradient(to_bottom,rgba(91,155,213,.28),rgba(0,0,0,.4))]',
  return: 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,rgba(110,191,73,.25),rgba(0,0,0,.4))]',
  scout: 'border-[#7f8c8d] bg-[linear-gradient(to_bottom,rgba(149,165,166,.22),rgba(0,0,0,.4))]',
};

const progressFillClass: Record<ArmyMovementTone, string> = {
  attack: 'bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)]',
  conquest: 'bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)]',
  defend: 'bg-[linear-gradient(to_bottom,#5b9bd5,#2e75b6)]',
  reinforce: 'bg-[linear-gradient(to_bottom,#5b9bd5,#2e75b6)]',
  return: 'bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]',
  scout: 'bg-[linear-gradient(to_bottom,#bdc3c7,#7f8c8d)]',
};

const parchmentStripeClass: Record<ArmyMovementTone, string> = {
  attack: 'border-r-[#a93226] bg-[linear-gradient(180deg,#e74c3c,#c0392b)]',
  conquest: 'border-r-[#9e7b0d] bg-[linear-gradient(180deg,#f1c40f,#d4a017)]',
  defend: 'border-r-[#1f5288] bg-[linear-gradient(180deg,#5b9bd5,#2e75b6)]',
  reinforce: 'border-r-[#1f5288] bg-[linear-gradient(180deg,#5b9bd5,#2e75b6)]',
  return: 'border-r-[#3a6c1f] bg-[linear-gradient(180deg,#6ebf49,#4a8c2a)]',
  scout: 'border-r-[#5d6d6e] bg-[linear-gradient(180deg,#95a5a6,#7f8c8d)]',
};

const parchmentPillClass: Record<ArmyMovementTone, string> = {
  attack: 'border-[#a93226] bg-[linear-gradient(180deg,#e74c3c,#c0392b)] text-white',
  conquest: 'border-[#9e7b0d] bg-[linear-gradient(180deg,#f1c40f,#d4a017)] text-[#3a2a00]',
  defend: 'border-[#1f5288] bg-[linear-gradient(180deg,#5b9bd5,#2e75b6)] text-white',
  reinforce: 'border-[#1f5288] bg-[linear-gradient(180deg,#5b9bd5,#2e75b6)] text-white',
  return: 'border-[#3a6c1f] bg-[linear-gradient(180deg,#6ebf49,#4a8c2a)] text-white',
  scout: 'border-[#5d6d6e] bg-[linear-gradient(180deg,#95a5a6,#7f8c8d)] text-white',
};

export function ArmyMovementRow({
  className,
  clockIcon = '/assets/clock.png',
  icon,
  incoming = false,
  movementId,
  onRecall,
  progress,
  recallLabel,
  statusLabel,
  surface = 'dark',
  subtitle,
  time,
  title,
  tone,
  ...props
}: ArmyMovementRowProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  if (surface === 'parchment') {
    return (
      <article
        className={cn(
          'relative w-full min-w-0 overflow-hidden rounded-xl border-2 border-[#8b7355] bg-[linear-gradient(180deg,#fef9f0,#f9f3e8)]',
          'font-game shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_2px_0_rgba(0,0,0,.14)]',
          incoming ? 'border-[#a93226] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_0_0_2px_rgba(231,76,60,.22),0_4px_10px_rgba(0,0,0,.18)]' : '',
          className,
        )}
        {...props}
      >
        <div className={cn('absolute bottom-0 left-0 top-0 w-1.5 border-r shadow-[inset_0_1px_0_rgba(255,255,255,.5)]', parchmentStripeClass[tone])} />
        <div className="grid grid-cols-[36px_1fr_auto] items-center gap-2.5 px-3 pb-2.5 pl-4 pt-2.5">
          <div className="flex size-9 items-center justify-center rounded-[10px] border-2 border-[#8b7355] bg-[linear-gradient(180deg,#f5e6d3,#e8d4a8)] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_rgba(0,0,0,.16)]">
            <img alt="" className="size-[23px] object-contain" src={publicAsset(icon)} />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-extrabold uppercase tracking-[.04em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.55)]">
                {title}
              </span>
              {statusLabel ? (
                <span className={cn('inline-flex shrink-0 rounded-full border-[1.5px] px-2 py-[2px] text-[8.5px] font-extrabold uppercase tracking-[.12em] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]', parchmentPillClass[tone])}>
                  {statusLabel}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[10.5px] font-semibold text-[#6d5838] [&_b]:font-extrabold [&_b]:text-[#3d2f1f] [&_b]:tabular-nums">
              {subtitle}
            </div>
          </div>
          <div className="flex flex-col items-end gap-[3px]">
            <div className="flex items-center gap-1 text-[13px] font-black tabular-nums text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.6)]">
              <img alt="" className="size-[13px] object-contain" src={publicAsset(clockIcon)} />
              {time}
            </div>
            {recallLabel ? (
              <button
                className="cursor-pointer rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(180deg,#b6a78a,#a67c52)] px-2 py-[3px] text-[10px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.16)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
                onClick={() => onRecall?.(movementId)}
                type="button"
              >
                {recallLabel}
              </button>
            ) : null}
          </div>
          <div className="col-span-full h-[5px] overflow-hidden rounded-full border border-[rgba(60,38,25,.22)] bg-[rgba(60,38,25,.16)] shadow-[inset_0_1px_1px_rgba(0,0,0,.18)]">
            <div className={cn('h-full shadow-[inset_0_1px_0_rgba(255,255,255,.5),inset_0_-2px_4px_rgba(0,0,0,.18)]', progressFillClass[tone])} style={{ width: `${clampedProgress}%` }} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'grid grid-cols-[36px_1fr_auto] items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 text-[#f5e6d3] shadow-[inset_0_1px_0_rgba(255,255,255,.18)]',
        movementToneClass[tone],
        incoming ? 'border-[#e74c3c] animate-[bftc-army-flash_1.5s_ease-in-out_infinite]' : '',
        className,
      )}
      {...props}
    >
      <div className="flex size-9 items-center justify-center rounded-full border-2 border-[rgba(0,0,0,.3)] bg-[rgba(0,0,0,.25)]">
        <img alt="" className="size-6 object-contain" src={publicAsset(icon)} />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="font-game text-[12.5px] font-bold leading-[1.1] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.5)]">{title}</div>
        <div className="flex flex-wrap items-center gap-x-2 font-game text-[10.5px] text-[#e0d4b8] [&_b]:font-bold [&_b]:text-white [&_b]:tabular-nums">
          {subtitle}
        </div>
      </div>
      <div className="flex flex-col items-end gap-[3px]">
        <div className="flex items-center gap-1 font-game text-[13px] font-bold tabular-nums text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]">
          <img alt="" className="size-[13px] object-contain" src={publicAsset(clockIcon)} />
          {time}
        </div>
        {recallLabel ? (
          <button
            className="cursor-pointer rounded-lg border-2 border-[#5d6d6e] bg-[linear-gradient(to_bottom,#bfc7cb,#7f8c8d)] px-2 py-[3px] font-game text-[10px] font-bold text-[#1f2933]"
            onClick={() => onRecall?.(movementId)}
            type="button"
          >
            {recallLabel}
          </button>
        ) : null}
      </div>
      <div className="col-span-full mt-1 h-[5px] overflow-hidden rounded-[3px] border border-[rgba(0,0,0,.5)] bg-[rgba(0,0,0,.4)]">
        <div className={cn('h-full', progressFillClass[tone])} style={{ width: `${clampedProgress}%` }} />
      </div>
    </article>
  );
}

export function ArmyMovementList({ className, label, movements, ...props }: ArmyMovementListProps) {
  return (
    <div className={cn('flex w-full flex-col items-stretch', className)} {...props}>
      <span className="mb-1 font-mono text-[10px] text-[#cdb88a]">{label}</span>
      <div className="flex w-full flex-col gap-1.5">
        {movements.map((movement) => (
          <ArmyMovementRow key={movement.movementId} {...movement} />
        ))}
      </div>
    </div>
  );
}
