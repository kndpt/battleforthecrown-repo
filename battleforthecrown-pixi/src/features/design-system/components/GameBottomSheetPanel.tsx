import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type GameBottomSheetPanelVariant = 'default' | 'compact' | 'tabbed';

export interface GameBottomSheetPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  bodyClassName?: string;
  children: ReactNode;
  closeLabel?: string;
  eyebrow?: ReactNode;
  headerContent?: ReactNode;
  headerActions?: ReactNode;
  onClose?: () => void;
  scrollable?: boolean;
  tabs?: ReactNode;
  title?: ReactNode;
  variant?: GameBottomSheetPanelVariant;
}

const variantClass: Record<GameBottomSheetPanelVariant, string> = {
  compact: 'rounded-t-xl',
  default: 'rounded-t-2xl',
  tabbed: 'rounded-t-2xl',
};

export function GameBottomSheetPanel({
  bodyClassName,
  children,
  className,
  closeLabel: _closeLabel,
  eyebrow,
  headerContent,
  headerActions,
  onClose: _onClose,
  scrollable = true,
  tabs,
  title,
  variant = tabs ? 'tabbed' : 'default',
  ...props
}: GameBottomSheetPanelProps) {
  const hasHeader = Boolean(headerContent || eyebrow || title || headerActions);

  return (
    <div
      className={cn(
        'flex max-h-[inherit] min-w-0 w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f5e6d3,#e8d4a8)]',
        'border-t-[3px] border-t-[#3c2619] shadow-[0_-10px_28px_rgba(0,0,0,.45),inset_0_2px_0_rgba(255,255,255,.4)]',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      <div className="flex touch-none justify-center pb-0.5 pt-2" data-bottom-sheet-drag-region>
        <div className="h-1 w-[38px] rounded-full bg-[rgba(60,38,25,.32)]" />
      </div>

      {hasHeader ? (
        <div
          className={cn(
            'flex touch-none justify-between gap-2 px-3.5 pb-2 pt-1',
            headerContent ? 'items-center' : 'items-end',
          )}
          data-bottom-sheet-drag-region
        >
          {headerContent ? (
            <div className="min-w-0 flex-1">{headerContent}</div>
          ) : (
            <div className="min-w-0">
              {eyebrow ? (
                <div className="font-game text-[9.5px] font-bold uppercase tracking-[.28em] text-[#6d5838]">
                  {eyebrow}
                </div>
              ) : null}
              {title ? (
                <div className="truncate font-game text-[17px] font-extrabold leading-[1.1] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
                  {title}
                </div>
              ) : null}
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
          </div>
        </div>
      ) : null}

      {tabs ? (
        <div className="flex gap-1.5 border-b border-b-[rgba(60,38,25,.22)] px-3 pb-2">
          {tabs}
          <div className="flex-1" />
        </div>
      ) : null}

      <div
        className={cn(
          'min-h-0 flex-1 bg-[linear-gradient(180deg,#f5e6d3_0%,#f5e6d3_100%)]',
          scrollable ? 'touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain' : 'overflow-hidden',
          bodyClassName,
        )}
        data-bottom-sheet-scrollable={scrollable ? true : undefined}
        style={{ WebkitOverflowScrolling: scrollable ? 'touch' : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
