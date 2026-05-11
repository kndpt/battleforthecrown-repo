import { cn } from '@/lib/cn';

export interface NumberStepperProps {
  ariaLabel: string;
  className?: string;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  stepDeltas?: [number, number, number, number];
  value: number;
}

export function NumberStepper({
  ariaLabel,
  className,
  max,
  min = 0,
  onChange,
  stepDeltas = [-10, -1, 1, 10],
  value,
}: NumberStepperProps) {
  const [largeDown, smallDown, smallUp, largeUp] = stepDeltas;
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const commit = (next: number) => onChange(clamp(next));

  return (
    <div
      aria-label={ariaLabel}
      className={cn('flex items-stretch overflow-hidden rounded-xl border-2 border-[#5d4a32] bg-black/10', className)}
      role="group"
    >
      {[largeDown, smallDown].map((delta) => (
        <button
          key={delta}
          className="h-[38px] w-[42px] border-r-2 border-[#5d4a32] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] font-game text-lg font-extrabold text-[#3d2f1f] disabled:opacity-45"
          disabled={value <= min}
          onClick={() => commit(value + delta)}
          type="button"
        >
          {delta}
        </button>
      ))}
      <input
        aria-label={ariaLabel}
        className="h-[38px] min-w-0 flex-1 bg-[#1a1a1a] text-center font-game text-[22px] font-extrabold tabular-nums text-[#f6d57b] outline-none [text-shadow:0_0_8px_rgba(241,196,15,0.5)]"
        max={max}
        min={min}
        onChange={(event) => commit(Number(event.currentTarget.value || min))}
        type="number"
        value={value}
      />
      {[smallUp, largeUp].map((delta) => (
        <button
          key={delta}
          className="h-[38px] w-[42px] border-l-2 border-[#5d4a32] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] font-game text-lg font-extrabold text-[#3d2f1f] disabled:opacity-45"
          disabled={value >= max}
          onClick={() => commit(value + delta)}
          type="button"
        >
          +{delta}
        </button>
      ))}
    </div>
  );
}
