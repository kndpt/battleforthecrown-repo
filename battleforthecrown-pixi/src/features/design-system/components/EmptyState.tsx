import { BftcButton } from './BftcButton';
import { PanelSurface } from './PanelSurface';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export interface EmptyStateProps {
  actionLabel?: string;
  actionVariant?: 'success' | 'warning';
  icon: string;
  mutedIcon?: boolean;
  onAction?: () => void;
  quote: string;
  title: string;
}

export function EmptyState({
  actionLabel,
  actionVariant = 'success',
  icon,
  mutedIcon = false,
  onAction,
  quote,
  title,
}: EmptyStateProps) {
  return (
    <PanelSurface className="px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
      <img
        alt=""
        className={cn('mx-auto mb-2 size-16 object-contain opacity-45 grayscale-[0.4]', mutedIcon && 'grayscale')}
        src={publicAsset(icon)}
      />
      <h3 className="mb-1.5 font-game text-sm font-bold text-[#3d2f1f]">{title}</h3>
      <p className="mx-auto mb-2.5 max-w-60 font-game text-[11.5px] italic leading-[1.45] text-[#6d5838]">
        « {quote} »
      </p>
      {actionLabel ? (
        <BftcButton onClick={onAction} size="xs" variant={actionVariant}>
          {actionLabel}
        </BftcButton>
      ) : null}
    </PanelSurface>
  );
}
