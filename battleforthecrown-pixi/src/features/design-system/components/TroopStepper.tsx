import { BftcButton } from './BftcButton';
import { CostPill, CostRow } from './CostRow';
import { IconTile } from './IconTile';
import { NumberStepper } from './NumberStepper';
import { PanelSurface } from './PanelSurface';
import { Slider } from './Slider';

export interface TroopStepperCost {
  icon: string;
  value: string;
}

export interface TroopStepperQuickValue {
  label: string;
  value: number;
  isMax?: boolean;
}

export interface TroopStepperProps {
  availableLabel: string;
  cancelLabel?: string;
  costLabel?: string;
  costs: TroopStepperCost[];
  icon: string;
  max: number;
  name: string;
  onCancel?: () => void;
  onQuantityChange: (quantity: number) => void;
  onConfirm?: () => void;
  quantity: number;
  quickValues: TroopStepperQuickValue[];
  stepDeltas?: [number, number, number, number];
  submitLabel: string;
}

export function TroopStepper({
  availableLabel,
  cancelLabel = 'Annuler',
  costLabel = 'Coût total ·',
  costs,
  icon,
  max,
  name,
  onCancel,
  onQuantityChange,
  onConfirm,
  quantity,
  quickValues,
  stepDeltas = [-10, -1, 1, 10],
  submitLabel,
}: TroopStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(0, next));
  const commit = (next: number) => onQuantityChange(clamp(next));

  return (
    <PanelSurface className="p-3">
      <div className="mb-2.5 flex items-center gap-2.5">
        <IconTile icon={icon} />
        <div className="min-w-0 flex-1">
          <div className="font-game text-sm font-bold text-[#3d2f1f]">{name}</div>
          <div className="font-game text-[11px] tabular-nums text-[#6d5838]">
            {availableLabel}
          </div>
        </div>
      </div>
      <NumberStepper
        ariaLabel={`Quantité ${name}`}
        max={max}
        onChange={commit}
        stepDeltas={stepDeltas}
        value={quantity}
      />
      <Slider
        ariaLabel={`Quantité ${name}`}
        className="mt-2.5"
        max={max}
        onChange={commit}
        value={quantity}
      />
      <div className="mt-2 flex gap-1.5">
        {quickValues.map(({ label, value, isMax }) => (
          <button
            key={`${label}-${value}`}
            className={
              isMax
                ? 'flex-1 rounded-lg border-2 border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] px-2 py-1 font-game text-[11px] font-bold text-[#5a4400]'
                : 'flex-1 rounded-lg border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#f5e6d3] px-2 py-1 font-game text-[11px] font-bold text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]'
            }
            onClick={() => commit(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="font-game text-[10px] uppercase tracking-[0.12em] text-[#6d5838]">
          {costLabel}
        </span>
        <CostRow className="flex-1">
          {costs.map((cost) => (
            <CostPill key={`${cost.icon}-${cost.value}`} icon={cost.icon} value={cost.value} />
          ))}
        </CostRow>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <BftcButton className="flex-1 justify-center py-2 text-[13px]" onClick={onCancel} variant="neutral">
          {cancelLabel}
        </BftcButton>
        <BftcButton className="flex-1 justify-center py-2 text-[13px]" onClick={onConfirm}>
          {submitLabel}
        </BftcButton>
      </div>
    </PanelSurface>
  );
}
