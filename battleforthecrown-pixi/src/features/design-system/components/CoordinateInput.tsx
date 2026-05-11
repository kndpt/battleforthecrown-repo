import { MapPin } from 'lucide-react';
import { BftcButton } from './BftcButton';
import { Badge } from './Badge';
import { cn } from '@/lib/cn';

export interface CoordinateValue {
  x: number;
  y: number;
}

export interface CoordinateHistoryItem extends CoordinateValue {
  label: string;
}

export interface CoordinateInputProps {
  className?: string;
  error?: string;
  history?: CoordinateHistoryItem[];
  label?: string;
  max?: number;
  min?: number;
  onChange: (value: CoordinateValue) => void;
  onHistorySelect?: (value: CoordinateHistoryItem) => void;
  onSubmit?: (value: CoordinateValue) => void;
  submitLabel?: string;
  value: CoordinateValue;
}

export function CoordinateInput({
  className,
  error,
  history = [],
  label = 'Coordonnées',
  max = 999,
  min = 0,
  onChange,
  onHistorySelect,
  onSubmit,
  submitLabel = 'Aller',
  value,
}: CoordinateInputProps) {
  const changeAxis = (axis: keyof CoordinateValue, next: number) => {
    onChange({ ...value, [axis]: Math.min(max, Math.max(min, next)) });
  };

  return (
    <div className={cn('rounded-[14px] border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-game text-xs font-bold uppercase tracking-[0.15em] text-[#5d4a32]">{label}</span>
        <Badge tone={error ? 'danger' : 'info'}>{value.x}|{value.y}</Badge>
      </div>
      <div className="flex items-center gap-2">
        {(['x', 'y'] as const).map((axis) => (
          <label key={axis} className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border-2 border-[#b8a082] bg-white/55 px-2 py-1.5">
            <span className="font-game text-xs font-bold uppercase text-[#6d5838]">{axis}</span>
            <input
              aria-label={`Coordonnée ${axis}`}
              className="min-w-0 flex-1 bg-transparent text-center font-game text-lg font-extrabold tabular-nums text-[#1f2937] outline-none"
              max={max}
              min={min}
              onChange={(event) => changeAxis(axis, Number(event.currentTarget.value))}
              type="number"
              value={value[axis]}
            />
          </label>
        ))}
        <BftcButton onClick={() => onSubmit?.(value)} size="xs" variant={error ? 'danger' : 'info'}>
          <MapPin size={14} />
          {submitLabel}
        </BftcButton>
      </div>
      {error ? <p className="mt-1.5 font-game text-[11px] font-bold text-[#a93226]">{error}</p> : null}
      {history.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {history.map((item) => (
            <button
              key={`${item.label}-${item.x}-${item.y}`}
              className="rounded-full border-2 border-[#8b7355] bg-[#f5e6d3] px-2 py-0.5 font-game text-[10px] font-bold text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
              onClick={() => {
                onChange(item);
                onHistorySelect?.(item);
              }}
              type="button"
            >
              {item.label} · {item.x}|{item.y}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
