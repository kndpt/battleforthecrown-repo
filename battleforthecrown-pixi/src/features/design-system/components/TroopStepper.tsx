import { BftcButton } from './BftcButton';
import { CostPill } from './CostRow';
import { publicAsset } from '@/lib/publicAsset';

export interface TroopStepperCost {
  icon: string;
  value: string;
}

export interface TroopStepperQuickValue {
  label: string;
  max?: boolean;
  value: number;
}

export interface TroopStepperProps {
  availableLabel: string;
  cancelLabel?: string;
  costs: TroopStepperCost[];
  icon: string;
  max: number;
  min?: number;
  name: string;
  onCancel?: () => void;
  onChange: (value: number) => void;
  onRecruit?: (value: number) => void;
  quickValues?: TroopStepperQuickValue[];
  recruitLabel?: string;
  stepDeltas?: [number, number, number, number];
  value: number;
}

export function TroopStepper({
  availableLabel,
  cancelLabel = 'Annuler',
  costs,
  icon,
  max,
  min = 0,
  name,
  onCancel,
  onChange,
  onRecruit,
  quickValues,
  recruitLabel,
  stepDeltas = [-10, -1, 1, 10],
  value,
}: TroopStepperProps) {
  const boundedValue = Math.max(min, Math.min(max, value));
  const boundedPercent = max > min ? ((boundedValue - min) / (max - min)) * 100 : 0;
  const displayedQuickValues = quickValues ?? [
    { label: String(min), value: min },
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: `MAX (${max})`, max: true, value: max },
  ];
  const resourceCosts = costs.slice(0, -1);
  const timeCost = costs.at(-1);
  const costLabelClass = 'pt-1 text-[10px] uppercase tracking-[0.12em] text-[#6d5838]';
  const setQuantity = (nextValue: number) => onChange(Math.max(min, Math.min(max, nextValue)));
  const formatDelta = (delta: number) => (delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`);
  const [largeDecrease, smallDecrease, smallIncrease, largeIncrease] = stepDeltas;
  const controlButtonClass = 'h-[38px] w-[38px] border-0 bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] font-game text-[15px] font-extrabold text-[#3d2f1f] disabled:cursor-not-allowed disabled:text-[#a8997c]';

  return (
    <div className="w-full rounded-[14px] border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className="flex size-11 items-center justify-center rounded-[10px] border-2 border-[rgba(0,0,0,.22)] bg-[rgba(0,0,0,.18)]">
          <img alt="" className="size-9 object-contain" src={publicAsset(icon)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-game text-sm font-bold text-[#3d2f1f]">{name}</div>
          <div className="font-game text-[11px] tabular-nums text-[#6d5838]">{availableLabel}</div>
        </div>
      </div>
      <div className="flex items-stretch overflow-hidden rounded-xl border-2 border-[#5d4a32] bg-[rgba(0,0,0,.12)]">
        <button className={`${controlButtonClass} border-r-2 border-[#5d4a32]`} disabled={boundedValue <= min} onClick={() => setQuantity(boundedValue + largeDecrease)} type="button">{formatDelta(largeDecrease)}</button>
        <button className={`${controlButtonClass} border-r-2 border-[#5d4a32]`} disabled={boundedValue <= min} onClick={() => setQuantity(boundedValue + smallDecrease)} type="button">{formatDelta(smallDecrease)}</button>
        <div className="flex flex-1 items-center justify-center bg-[#1a1a1a] font-game text-[22px] font-extrabold tabular-nums text-[#f6d57b] [text-shadow:0_0_8px_rgba(241,196,15,.5)]">{boundedValue}</div>
        <button className={`${controlButtonClass} border-l-2 border-[#5d4a32]`} disabled={boundedValue >= max} onClick={() => setQuantity(boundedValue + smallIncrease)} type="button">{formatDelta(smallIncrease)}</button>
        <button className={`${controlButtonClass} border-l-2 border-[#5d4a32]`} disabled={boundedValue >= max} onClick={() => setQuantity(boundedValue + largeIncrease)} type="button">{formatDelta(largeIncrease)}</button>
      </div>
      <div className="relative mt-2.5 h-[22px]">
        <div className="absolute left-0 right-0 top-1/2 h-3.5 -translate-y-1/2 overflow-hidden rounded-lg border-2 border-[#5d4a32] bg-[rgba(0,0,0,.22)]">
          <div className="h-full bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]" style={{ width: `${boundedPercent}%` }} />
        </div>
        <div className="absolute top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#3d2f1f] bg-[radial-gradient(circle_at_35%_30%,#fef9f0,#a67c52)] shadow-[0_2px_3px_rgba(0,0,0,.4)]" style={{ left: `${boundedPercent}%` }} />
        <input
          aria-label={`Quantité de ${name}`}
          className="absolute inset-0 cursor-pointer opacity-0"
          max={max}
          min={min}
          onChange={(event) => setQuantity(Number(event.currentTarget.value))}
          type="range"
          value={boundedValue}
        />
      </div>
      <div className="mt-2 flex gap-[5px]">
        {displayedQuickValues.map((quick) => (
          <button
            className={quick.max ? 'flex-1 rounded-lg border-2 border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] px-2 py-[5px] font-game text-[11px] font-bold text-[#5a4400] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]' : 'flex-1 rounded-lg border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#f5e6d3] px-2 py-[5px] font-game text-[14px] font-extrabold text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]'}
            key={quick.label}
            onClick={() => setQuantity(quick.value)}
            type="button"
          >
            {quick.label}
          </button>
        ))}
      </div>
      <div className="mt-2.5 grid grid-cols-[auto_1fr] items-start gap-x-2 gap-y-2 font-game text-xs tabular-nums text-[#3d2f1f]">
        <span className={costLabelClass}>Coût total ·</span>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            {resourceCosts.map((cost) => (
              <CostPill className="border-[#8b7355] [&_img]:size-4" icon={cost.icon} key={`${cost.icon}-${cost.value}`} value={cost.value} />
            ))}
          </div>
        </div>
        {timeCost ? (
          <>
            <span className={costLabelClass}>Temps estimé ·</span>
            <div className="flex justify-start">
              <CostPill className="border-[#8b7355] [&_img]:size-4" icon={timeCost.icon} value={timeCost.value} />
            </div>
          </>
        ) : null}
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <BftcButton className="flex-1 justify-center p-2 text-[13px]" onClick={onCancel} variant="neutral">{cancelLabel}</BftcButton>
        <BftcButton className="flex-1 justify-center p-2 text-[13px]" onClick={() => onRecruit?.(boundedValue)}>{recruitLabel ?? `RECRUTER ×${boundedValue}`}</BftcButton>
      </div>
    </div>
  );
}
