import { BftcButton } from './BftcButton';
import { ProgressBar } from './ProgressBar';
import { Timer } from './Timer';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

type QueueKind = 'construction' | 'training' | 'idle';

export interface BuildQueueCardProps {
  accelerateAriaLabel?: string;
  accelerateIcon?: string;
  accelerateCost?: string;
  cancelAriaLabel?: string;
  icon: string;
  kind?: QueueKind;
  onAccelerate?: () => void;
  onCancel?: () => void;
  progress?: number;
  title: string;
  time?: string;
}

const rowClass: Record<QueueKind, string> = {
  construction: 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8]',
  training: 'border-[#1f5288] bg-gradient-to-b from-[#c7dffb] to-[#8fb6e0]',
  idle: 'border-[#7d5a3a] bg-gradient-to-b from-[#e8e0cf] to-[#cdbf9a] opacity-70',
};

export function BuildQueueCard({
  accelerateAriaLabel = 'Accélérer',
  accelerateIcon = '/assets/casual-icons/crown.png',
  accelerateCost,
  cancelAriaLabel = 'Annuler',
  icon,
  kind = 'construction',
  onAccelerate,
  onCancel,
  progress = 0,
  title,
  time,
}: BuildQueueCardProps) {
  const isIdle = kind === 'idle';

  return (
    <div
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_3px_0_rgba(0,0,0,0.18)]',
        rowClass[kind],
      )}
    >
      <div className={cn('flex size-[46px] shrink-0 items-center justify-center rounded-lg border-2 border-black/25 bg-black/20', isIdle && 'opacity-50')}>
        <img
          alt=""
          className="size-[38px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
          src={publicAsset(icon)}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-1.5">
          <span
            className={cn(
              'truncate font-game text-[13px] font-bold leading-[1.1] text-[#3d2f1f]',
              isIdle && 'font-medium italic text-[#6d5838]',
            )}
          >
            {title}
          </span>
          {time ? (
            <Timer className="shrink-0 border-0 bg-none p-0 shadow-none" showIcon size="sm" variant="gold">
              {time}
            </Timer>
          ) : (
            <span className="font-game text-xs font-bold text-[#3d2f1f]">—</span>
          )}
        </div>
        {!isIdle ? (
          <ProgressBar
            className="[&>div:last-child]:h-2 [&>div:last-child]:rounded-[5px] [&>div:last-child]:border"
            shimmer
            value={progress}
            variant={kind === 'training' ? 'blue' : 'gold'}
          />
        ) : null}
      </div>
      {!isIdle && accelerateCost ? (
        <BftcButton
          aria-label={accelerateAriaLabel}
          className="shrink-0 gap-[3px] rounded-lg px-1.5 py-1 text-[10px]"
          onClick={onAccelerate}
          variant="warning"
        >
          <img alt="" className="size-3" src={publicAsset(accelerateIcon)} />
          {accelerateCost}
        </BftcButton>
      ) : null}
      {!isIdle ? (
        <BftcButton
          aria-label={cancelAriaLabel}
          className="size-7 shrink-0 rounded-lg p-0 text-base"
          onClick={onCancel}
          variant="danger"
        >
          ×
        </BftcButton>
      ) : null}
    </div>
  );
}
