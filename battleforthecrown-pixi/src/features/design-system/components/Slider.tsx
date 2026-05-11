import { cn } from '@/lib/cn';

export interface SliderProps {
  ariaLabel: string;
  className?: string;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}

export function Slider({
  ariaLabel,
  className,
  max,
  min = 0,
  onChange,
  step = 1,
  value,
}: SliderProps) {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={cn('relative h-3.5 rounded-lg border-2 border-[#5d4a32] bg-black/20', className)}>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 rounded-l-md bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        style={{ width: `${percent}%` }}
      />
      <input
        aria-label={ariaLabel}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        type="range"
        value={value}
      />
      <div
        className="pointer-events-none absolute top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#3d2f1f] bg-[radial-gradient(circle_at_35%_30%,#fef9f0,#a67c52)] shadow-[0_2px_3px_rgba(0,0,0,0.4)]"
        style={{ left: `${percent}%` }}
      />
    </div>
  );
}
