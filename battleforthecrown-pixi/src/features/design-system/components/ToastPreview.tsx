import { BftcButton } from './BftcButton';
import { IconTile } from './IconTile';
import { cn } from '@/lib/cn';

type ToastTone = 'success' | 'info' | 'warning' | 'danger';

const toneClass: Record<ToastTone, string> = {
  success: 'border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a] text-white',
  info: 'border-[#1f5288] bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6] text-white',
  warning: 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00]',
  danger: 'border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b] text-white',
};

export interface ToastPreviewProps {
  closeLabel?: string;
  icon: string;
  onClose?: () => void;
  showClose?: boolean;
  subtitle: string;
  title: string;
  tone?: ToastTone;
}

export function ToastPreview({
  closeLabel = 'Fermer',
  icon,
  onClose,
  showClose = true,
  subtitle,
  title,
  tone = 'success',
}: ToastPreviewProps) {
  const isWarning = tone === 'warning';

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_14px_rgba(0,0,0,0.4)]',
        toneClass[tone],
      )}
    >
      <IconTile icon={icon} size="sm" />
      <div className="min-w-0 flex-1">
        <div className={cn('font-game text-[13px] font-bold leading-[1.1]', !isWarning && 'text-shadow-game')}>
          {title}
        </div>
        <div className={cn('mt-0.5 font-game text-[11px] leading-[1.2] opacity-85', !isWarning && 'text-shadow-game')}>
          {subtitle}
        </div>
      </div>
      {showClose ? (
        <BftcButton
          aria-label={closeLabel}
          className="size-6 rounded-md border-black/25 bg-black/15 p-0 text-sm shadow-none"
          onClick={onClose}
          variant={isWarning ? 'warning' : 'neutral'}
        >
          ×
        </BftcButton>
      ) : null}
    </div>
  );
}
