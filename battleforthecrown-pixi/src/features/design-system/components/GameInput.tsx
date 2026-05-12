import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type GameInputTone = 'default' | 'parchment' | 'error';

export interface GameInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  errorText?: string;
  helperText?: string;
  label: string;
  onChange: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  tone?: GameInputTone;
  value: string;
}

const toneClass: Record<GameInputTone, string> = {
  default: 'border-[#8b6f47] bg-[rgba(255,255,255,.9)]',
  parchment: 'border-[#d4c094] bg-[#fef9f0]',
  error: 'border-[#a93226] bg-[rgba(255,255,255,.9)]',
};

export function GameInput({
  className,
  errorText,
  helperText,
  id,
  label,
  onChange,
  tone = errorText ? 'error' : 'default',
  value,
  ...props
}: GameInputProps) {
  const inputId = id ?? `game-input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const helperId = helperText || errorText ? `${inputId}-helper` : undefined;

  return (
    <label className={cn('flex min-w-[200px] flex-1 flex-col gap-1', className)} htmlFor={inputId}>
      <span className="font-game text-xs font-semibold text-[#1f2937]">{label}</span>
      <input
        aria-describedby={helperId}
        aria-invalid={tone === 'error'}
        className={cn(
          'w-full rounded-xl border-4 px-4 py-2.5 font-game text-sm text-[#1f2937] shadow-[inset_0_2px_4px_rgba(0,0,0,.1)] outline-none placeholder:text-[#9ca3af]',
          toneClass[tone],
        )}
        id={inputId}
        onChange={(event) => onChange(event.target.value, event)}
        value={value}
        {...props}
      />
      {helperId ? (
        <span className={cn('font-game text-[10px] text-[#5d4a32]', errorText ? 'text-[#c0392b]' : '')} id={helperId}>
          {errorText ?? helperText}
        </span>
      ) : null}
    </label>
  );
}
