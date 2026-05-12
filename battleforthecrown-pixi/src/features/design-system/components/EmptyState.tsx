import { BftcButton, type BftcButtonVariant } from './BftcButton';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  actionLabel?: string;
  actionVariant?: BftcButtonVariant;
  className?: string;
  grayscale?: boolean;
  icon: string;
  onAction?: () => void;
  quote: string;
  title: string;
}

export function EmptyState({
  actionLabel,
  actionVariant = 'success',
  className,
  grayscale = false,
  icon,
  onAction,
  quote,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-[14px] border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.45)]',
        className,
      )}
    >
      <img
        alt=""
        className={cn('mx-auto mb-2 size-16 opacity-[.45]', grayscale ? 'grayscale' : 'grayscale-[.4]')}
        src={publicAsset(icon)}
      />
      <h3 className="mb-1.5 font-game text-sm font-bold text-[#3d2f1f]">{title}</h3>
      <p className="mx-auto mb-2.5 max-w-60 font-game text-[11.5px] italic leading-[1.45] text-[#6d5838]">« {quote} »</p>
      {actionLabel ? (
        <BftcButton className="px-3.5 py-1.5 text-xs" onClick={onAction} variant={actionVariant}>
          {actionLabel}
        </BftcButton>
      ) : null}
    </div>
  );
}
