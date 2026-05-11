import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { BftcButton, type BftcButtonProps } from './BftcButton';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type GameModalTone = 'default' | 'success' | 'danger' | 'info' | 'warning';

const barClass: Record<GameModalTone, string> = {
  default: 'from-[#f1c40f] to-[#d4a017]',
  success: 'from-[#6ebf49] to-[#4a8c2a]',
  danger: 'from-[#e74c3c] to-[#c0392b]',
  info: 'from-[#5b9bd5] to-[#2e75b6]',
  warning: 'from-[#f1c40f] to-[#d4a017]',
};

const iconClass: Record<GameModalTone, string> = {
  default: 'bg-black/20 border-black/20',
  success: 'bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a] border-[#3a6c1f]',
  danger: 'bg-gradient-to-b from-[#e74c3c] to-[#c0392b] border-[#a93226]',
  info: 'bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6] border-[#1f5288]',
  warning: 'bg-gradient-to-b from-[#f1c40f] to-[#d4a017] border-[#9e7b0d]',
};

export interface GameModalAction {
  label: string;
  onClick?: () => void;
  variant?: BftcButtonProps['variant'];
}

export interface GameModalProps {
  actions?: GameModalAction[];
  children?: ReactNode;
  className?: string;
  icon?: string;
  onClose?: () => void;
  quote?: string;
  title: string;
  tone?: GameModalTone;
}

export function GameModal({ actions = [], children, className, icon, onClose, quote, title, tone = 'default' }: GameModalProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[14px] border-4 border-[#5d4a32] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] text-[#3d2f1f]',
        'shadow-[0_0_0_2px_#5d4a32,0_12px_32px_rgba(0,0,0,.45),inset_0_2px_0_rgba(255,255,255,.55)]',
        className,
      )}
    >
      <div className={cn('h-1.5 bg-gradient-to-r', barClass[tone])} />
      <header className="flex items-center gap-2 px-3.5 pb-1 pt-2.5">
        {icon ? (
          <span className={cn('grid size-9 place-items-center rounded-full border-2', iconClass[tone])}>
            <img alt="" className="size-6 object-contain" src={publicAsset(icon)} />
          </span>
        ) : null}
        <h3 className="font-game text-[15px] font-bold text-[#3d2f1f]">{title}</h3>
        {onClose ? (
          <button
            aria-label="Fermer"
            className="ml-auto grid size-6 place-items-center rounded-md border-2 border-black/20 bg-black/10 font-bold"
            onClick={onClose}
            type="button"
          >
            <X size={14} />
          </button>
        ) : null}
      </header>
      <div className="px-3.5 py-1.5 font-game text-xs leading-5 text-[#3d2f1f]">
        {children}
        {quote ? <div className="my-1.5 border-l-[3px] border-[#d4a017] pl-2 text-[11px] italic text-[#6d5838]">{quote}</div> : null}
      </div>
      {actions.length > 0 ? (
        <footer className="flex justify-end gap-1.5 bg-black/[0.04] px-3.5 py-2">
          {actions.map((action) => (
            <BftcButton key={action.label} onClick={action.onClick} size="xs" variant={action.variant ?? 'neutral'}>
              {action.label}
            </BftcButton>
          ))}
        </footer>
      ) : null}
    </section>
  );
}
