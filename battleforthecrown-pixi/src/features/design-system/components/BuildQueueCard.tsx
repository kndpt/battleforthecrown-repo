import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type BuildQueueCardTone = 'build' | 'training' | 'idle';

export interface BuildQueueCardProps {
  accelerateCost?: string;
  className?: string;
  icon: string;
  onAccelerate?: () => void;
  onCancel?: () => void;
  progress?: number;
  time?: string;
  title: string;
  tone?: BuildQueueCardTone;
}

const toneClass: Record<BuildQueueCardTone, string> = {
  build: 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8]',
  training: 'border-[#1f5288] bg-gradient-to-b from-[#c7dffb] to-[#8fb6e0]',
  idle: 'border-[#7d5a3a] bg-gradient-to-b from-[#e8e0cf] to-[#cdbf9a] opacity-[.7]',
};

export function BuildQueueCard({
  accelerateCost,
  className,
  icon,
  onAccelerate,
  onCancel,
  progress = 0,
  time = '—',
  title,
  tone = 'build',
}: BuildQueueCardProps) {
  const idle = tone === 'idle';
  const boundedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 pl-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_3px_0_rgba(0,0,0,.18)]',
        toneClass[tone],
        className,
      )}
    >
      <div
        className={cn(
          'flex size-[46px] shrink-0 items-center justify-center rounded-lg border-2 border-[rgba(0,0,0,.25)] bg-[rgba(0,0,0,.18)]',
          idle ? 'opacity-[.5]' : '',
        )}
      >
        <img alt="" className="size-[38px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,.4)]" src={publicAsset(icon)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-1.5">
          <span className={cn('font-game text-[13px] font-bold leading-tight text-[#3d2f1f]', idle ? 'font-medium italic text-[#6d5838]' : '')}>
            {title}
          </span>
          <span className="flex items-center gap-[3px] font-game text-xs font-bold tabular-nums text-[#3d2f1f]">
            {time !== '—' ? <img alt="" className="size-3 object-contain" src={publicAsset('/assets/clock.png')} /> : null}
            {time}
          </span>
        </div>
        {!idle ? (
          <div className="relative h-2 overflow-hidden rounded-[5px] border border-[rgba(0,0,0,.25)] bg-[rgba(0,0,0,.22)]">
            <div
              className={cn(
                'relative h-full overflow-hidden',
                tone === 'training'
                  ? 'bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6]'
                  : 'bg-gradient-to-b from-[#f1c40f] to-[#d4a017]',
              )}
              style={{ width: `${boundedProgress}%` }}
            >
              <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(to_right,transparent,rgba(255,255,255,.4),transparent)]" />
            </div>
          </div>
        ) : null}
      </div>
      {!idle && accelerateCost ? (
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <button
            className="flex cursor-pointer items-center gap-[3px] rounded-lg border-2 border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] px-1.5 py-1 font-game text-[10px] font-bold text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_2px_0_rgba(0,0,0,.2)]"
            onClick={onAccelerate}
            type="button"
          >
            <img alt="" className="size-3 object-contain" src={publicAsset('/assets/casual-icons/crown.png')} />
            {accelerateCost}
          </button>
        </div>
      ) : null}
      {!idle ? (
        <button
          className="size-7 rounded-lg border-2 border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b] font-game font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_2px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]"
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
