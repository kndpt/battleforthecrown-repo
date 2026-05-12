import type { ReactNode } from 'react';
import { BftcButton, type BftcButtonVariant } from './BftcButton';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type GameModalTone = 'warning' | 'success' | 'danger' | 'info';
export type GameModalVariant = 'default' | 'celebration';

export interface GameModalAction {
  label: string;
  onClick?: () => void;
  variant?: BftcButtonVariant;
}

export interface GameModalProps {
  actions?: GameModalAction[];
  children?: ReactNode;
  className?: string;
  icon?: string;
  onClose?: () => void;
  quote?: string;
  subtitle?: string;
  title: string;
  tone?: GameModalTone;
  variant?: GameModalVariant;
}

const toneBarClass: Record<GameModalTone, string> = {
  warning: 'bg-[linear-gradient(to_right,#f1c40f,#d4a017)]',
  success: 'bg-[linear-gradient(to_right,#6ebf49,#4a8c2a)]',
  danger: 'bg-[linear-gradient(to_right,#e74c3c,#c0392b)]',
  info: 'bg-[linear-gradient(to_right,#5b9bd5,#2e75b6)]',
};

const iconClass: Record<GameModalTone, string> = {
  warning: 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)]',
  success: 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] text-white text-lg font-extrabold [text-shadow:1px_1px_2px_rgba(0,0,0,.5)]',
  danger: 'border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)]',
  info: 'border-[#1f5288] bg-[linear-gradient(to_bottom,#5b9bd5,#2e75b6)]',
};

export function GameModal({
  actions = [],
  children,
  className,
  icon,
  onClose,
  quote,
  subtitle,
  title,
  tone = 'warning',
  variant = 'default',
}: GameModalProps) {
  const celebration = variant === 'celebration';

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[14px] border-4 border-[#5d4a32] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] shadow-[0_0_0_2px_#5d4a32,0_12px_32px_rgba(0,0,0,.55),inset_0_2px_0_rgba(255,255,255,.55)]',
        className,
      )}
    >
      <div className={cn('h-1.5', toneBarClass[tone])} />
      {celebration ? (
        <div className="px-3.5 py-[18px] text-center">
          {icon ? <img alt="" className="mx-auto my-1 size-20 drop-shadow-[0_4px_8px_rgba(0,0,0,.35)]" src={publicAsset(icon)} /> : null}
          <div className="font-game text-[34px] font-black uppercase tracking-[.06em] text-[#5a4400] [text-shadow:0_2px_0_#fff,0_3px_6px_rgba(0,0,0,.25)]">{title}</div>
          {subtitle ? <p className="font-game text-xs text-[#6d5838]">{subtitle}</p> : null}
        </div>
      ) : (
        <>
          <header className="flex items-center gap-2 px-3.5 pb-1 pt-2.5">
            <div className={cn('flex size-9 items-center justify-center rounded-full border-2', iconClass[tone])}>
              {icon ? <img alt="" className="size-6" src={publicAsset(icon)} /> : null}
            </div>
            <h3 className="font-game text-[15px] font-bold text-[#3d2f1f]">{title}</h3>
            {onClose ? (
              <button
                className="ml-auto flex size-6 items-center justify-center rounded-md border-2 border-[rgba(0,0,0,.2)] bg-[rgba(0,0,0,.12)] font-game font-bold leading-none text-[#3d2f1f]"
                onClick={onClose}
                type="button"
              >
                ×
              </button>
            ) : null}
          </header>
          <div className="px-3.5 py-1.5 font-game text-xs leading-[1.4] text-[#3d2f1f]">
            {children}
            {quote ? <div className="my-1.5 border-l-[3px] border-[#d4a017] pl-2 text-[11px] italic text-[#6d5838]">{quote}</div> : null}
          </div>
        </>
      )}
      {actions.length > 0 ? (
        <footer className={cn('flex gap-1.5 bg-[rgba(0,0,0,.04)] px-3.5 pb-3 pt-2', celebration ? 'justify-center' : 'justify-end')}>
          {actions.map((action) => (
            <BftcButton className="px-3 py-[5px] text-xs" key={action.label} onClick={action.onClick} variant={action.variant ?? 'neutral'}>
              {action.label}
            </BftcButton>
          ))}
        </footer>
      ) : null}
    </section>
  );
}
