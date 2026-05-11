import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface GameInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  helper?: string;
  label: string;
  onChange: (value: string) => void;
  tone?: 'default' | 'parchment' | 'error';
  value: string;
}

export function GameInput({ className, helper, label, onChange, tone = 'default', value, ...props }: GameInputProps) {
  return (
    <label className="flex min-w-[200px] flex-1 flex-col gap-1">
      <span className="font-game text-xs font-semibold text-[#3d2f1f]">{label}</span>
      <input
        className={cn(
          'w-full rounded-xl border-4 px-4 py-2.5 font-serif text-sm text-[#1f2937] shadow-[inset_0_2px_4px_rgba(0,0,0,.1)] outline-none placeholder:text-[#9ca3af]',
          tone === 'parchment' ? 'border-[#d4c094] bg-[#fef9f0]' : 'border-[#8b6f47] bg-white/90',
          tone === 'error' ? 'border-[#a93226]' : '',
          className,
        )}
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
        {...props}
      />
      {helper ? (
        <span className={cn('font-game text-[10px]', tone === 'error' ? 'text-[#a93226]' : 'text-[#5d4a32]')}>
          {helper}
        </span>
      ) : null}
    </label>
  );
}
