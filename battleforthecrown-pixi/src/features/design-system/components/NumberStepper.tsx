import { cn } from '@/lib/cn';

export type NumberStepperSize = 'sm' | 'md' | 'lg';

export interface NumberStepperControl {
  disabled?: boolean;
  label: string;
  onClick?: () => void;
}

export interface NumberStepperProps {
  className?: string;
  leftControls?: NumberStepperControl[];
  max?: number;
  min?: number;
  onChange?: (value: number) => void;
  rightControls?: NumberStepperControl[];
  size?: NumberStepperSize;
  step?: number;
  value: number | string;
  valueTone?: 'default' | 'danger';
}

const buttonSizeClass: Record<NumberStepperSize, string> = {
  sm: 'w-6 text-[13px]',
  md: 'w-[30px] text-base',
  lg: 'w-9 text-lg',
};

const signedNumberButtonSizeClass: Record<NumberStepperSize, string> = {
  sm: 'text-[11px]',
  md: 'text-[12px]',
  lg: 'text-[13px]',
};

const valueSizeClass: Record<NumberStepperSize, string> = {
  sm: 'min-w-[42px] px-1.5 py-[3px] text-xs',
  md: 'min-w-[62px] px-2 py-[5px] text-sm',
  lg: 'min-w-[78px] px-2.5 py-[7px] text-base',
};

export function NumberStepper({
  className,
  leftControls = [{ label: '−' }],
  max = Number.POSITIVE_INFINITY,
  min = Number.NEGATIVE_INFINITY,
  onChange,
  rightControls = [{ label: '+' }],
  size = 'md',
  step = 1,
  value,
  valueTone = 'default',
}: NumberStepperProps) {
  const getControlTextClass = (label: string) => (/^[+−-]\d/.test(label) ? signedNumberButtonSizeClass[size] : undefined);
  const numericValue = typeof value === 'number' ? value : undefined;
  const parseDelta = (label: string) => {
    if (label === '+') return step;
    if (label === '−' || label === '-') return -step;
    return Number(label.replace('−', '-'));
  };
  const handleControlClick = (control: NumberStepperControl) => {
    if (control.onClick) {
      control.onClick();
      return;
    }
    if (numericValue === undefined || !onChange) return;
    const delta = parseDelta(control.label);
    if (Number.isNaN(delta)) return;
    onChange(Math.max(min, Math.min(max, numericValue + delta)));
  };

  return (
    <div
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-[10px] border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_rgba(0,0,0,.18)]',
        className,
      )}
    >
      {leftControls.map((control) => (
        <button
          className={cn(
            'cursor-pointer appearance-none border-0 border-r-[1.5px] border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#cdb88a] font-game font-extrabold text-[#3d2f1f] disabled:cursor-not-allowed disabled:text-[#bfb29a]',
            buttonSizeClass[size],
            getControlTextClass(control.label),
          )}
          disabled={control.disabled}
          key={`left-${control.label}`}
          onClick={() => handleControlClick(control)}
          type="button"
        >
          {control.label}
        </button>
      ))}
      <span
        className={cn(
          'self-center bg-[rgba(255,255,255,.4)] text-center font-game font-extrabold tabular-nums',
          valueTone === 'danger' ? 'text-[#a93226]' : 'text-[#3d2f1f]',
          valueSizeClass[size],
        )}
      >
        {value}
      </span>
      {rightControls.map((control, index) => (
        <button
          className={cn(
            'cursor-pointer appearance-none border-0 bg-gradient-to-b from-[#fef9f0] to-[#cdb88a] font-game font-extrabold text-[#3d2f1f] disabled:cursor-not-allowed disabled:text-[#bfb29a]',
            index === 0 ? 'border-l-[1.5px] border-[#8b7355]' : 'border-l-[1.5px] border-[#8b7355]',
            buttonSizeClass[size],
            getControlTextClass(control.label),
          )}
          disabled={control.disabled}
          key={`right-${control.label}`}
          onClick={() => handleControlClick(control)}
          type="button"
        >
          {control.label}
        </button>
      ))}
    </div>
  );
}
