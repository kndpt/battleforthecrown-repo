import { forwardRef, HTMLAttributes, useState } from 'react';
import { Delete } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button } from '../buttons';
import { cn } from '@/lib/cn';

const keypadVariants = cva(['flex flex-col w-full'], {
  variants: {
    size: {
      md: 'gap-2',
      lg: 'gap-3',
    },
  },
  defaultVariants: { size: 'lg' },
});

type KeypadVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export interface NumericKeypadProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof keypadVariants> {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  variant?: KeypadVariant;
  showMaxButton?: boolean;
  unitLabel?: string;
  /**
   * Si true, la première frappe d'un chiffre remplace la valeur courante au lieu d'append.
   * Toute autre interaction (⌫, MAX) marque le pavé comme « engagé » sans remplacer.
   * Re-monter le composant via une `key` réactive pour réarmer ce comportement.
   */
  clearOnFirstDigit?: boolean;
}

const buttonSizeFor = (size: 'md' | 'lg' | undefined) => (size === 'md' ? 'md' : 'lg');

export const NumericKeypad = forwardRef<HTMLDivElement, NumericKeypadProps>(
  (
    {
      value,
      onChange,
      min = 0,
      max,
      variant = 'info',
      size = 'lg',
      showMaxButton = true,
      unitLabel,
      clearOnFirstDigit = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [pristine, setPristine] = useState(clearOnFirstDigit);

    const clamp = (n: number) => {
      const lower = Math.max(min, n);
      return max !== undefined ? Math.min(max, lower) : lower;
    };

    const handleDigit = (digit: number) => {
      const atCeiling = max !== undefined && value >= max;
      if (pristine || atCeiling) {
        if (pristine) setPristine(false);
        onChange(clamp(digit));
        return;
      }
      const next = value === 0 ? digit : value * 10 + digit;
      onChange(clamp(next));
    };

    const handleBackspace = () => {
      if (pristine) setPristine(false);
      onChange(clamp(Math.floor(value / 10)));
    };

    const handleMax = () => {
      if (max === undefined) return;
      if (pristine) setPristine(false);
      onChange(clamp(max));
    };

    const isLocked = max !== undefined && max <= 0;
    const btnSize = buttonSizeFor(size ?? 'lg');
    const maxLabel = max !== undefined ? `/ ${max.toLocaleString('fr-FR')}` : null;

    return (
      <div ref={ref} className={cn(keypadVariants({ size }), className)} {...props}>
        <div className="flex flex-col items-center justify-center py-3">
          <span
            data-testid="keypad-value"
            className="font-cinzel font-bold text-4xl text-kingdom-900 text-shadow-game leading-none"
          >
            {value.toLocaleString('fr-FR')}
          </span>
          {(unitLabel ?? maxLabel) && (
            <span className="font-game text-sm text-kingdom-600 mt-1">
              {unitLabel ?? maxLabel}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <Button
              key={digit}
              type="button"
              variant={variant}
              size={btnSize}
              onClick={() => handleDigit(digit)}
              disabled={isLocked}
              className="font-cinzel text-xl"
            >
              {digit}
            </Button>
          ))}
          <Button
            type="button"
            variant="neutral"
            size={btnSize}
            onClick={handleBackspace}
            disabled={isLocked || value === min}
            aria-label="Effacer"
            className="flex items-center justify-center"
          >
            <Delete size={20} strokeWidth={2.5} aria-hidden />
          </Button>
          <Button
            type="button"
            variant={variant}
            size={btnSize}
            onClick={() => handleDigit(0)}
            disabled={isLocked}
            className="font-cinzel text-xl"
          >
            0
          </Button>
          {showMaxButton && max !== undefined ? (
            <Button
              type="button"
              variant="warning"
              size={btnSize}
              onClick={handleMax}
              disabled={isLocked || value === max}
              className="font-cinzel text-base"
            >
              MAX
            </Button>
          ) : (
            <span aria-hidden />
          )}
        </div>
      </div>
    );
  },
);

NumericKeypad.displayName = 'NumericKeypad';
