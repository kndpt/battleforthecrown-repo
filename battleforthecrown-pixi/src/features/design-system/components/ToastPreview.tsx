import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type ToastTone = 'success' | 'info' | 'warning' | 'danger';

export interface ToastPreviewProps {
  className?: string;
  icon: string;
  onClose?: () => void;
  subtitle: string;
  title: string;
  tone?: ToastTone;
}

const toneClass: Record<ToastTone, string> = {
  success: 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a] text-white',
  info: 'border-[#1f5288] bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6] text-white',
  warning: 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00] [&_.toast-text]:[text-shadow:none]',
  danger: 'border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b] text-white',
};

export function ToastPreview({ className, icon, onClose, subtitle, title, tone = 'success' }: ToastPreviewProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 shadow-[0_4px_14px_rgba(0,0,0,.4)]',
        toneClass[tone],
        className,
      )}
    >
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] border-2 border-[rgba(0,0,0,.18)] bg-[rgba(0,0,0,.18)]">
        <img alt="" className="size-6 object-contain" src={publicAsset(icon)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="toast-text font-game text-[13px] font-bold leading-tight [text-shadow:1px_1px_2px_rgba(0,0,0,.5)]">{title}</div>
        <div className="toast-text mt-0.5 font-game text-[11px] leading-tight opacity-[.85] [text-shadow:1px_1px_2px_rgba(0,0,0,.5)]">{subtitle}</div>
      </div>
      <button
        className="flex size-6 items-center justify-center rounded-md border-2 border-[rgba(0,0,0,.25)] bg-[rgba(0,0,0,.15)] font-game font-bold leading-none text-inherit"
        onClick={onClose}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
