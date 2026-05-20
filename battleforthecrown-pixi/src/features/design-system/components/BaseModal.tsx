import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BaseModalTone = 'blue' | 'brown' | 'gold' | 'gray' | 'green' | 'red';

export const BASE_MODAL_DEFAULT_MAX_HEIGHT = 'min(720px, calc(100dvh - 24px))';
export const BASE_MODAL_DEFAULT_WIDTH = 360;

export interface BaseModalProps {
  accentColor?: string;
  accentLightColor?: string;
  bodyClassName?: string;
  children?: ReactNode;
  className?: string;
  closeLabel?: string;
  footer?: ReactNode;
  footerClassName?: string;
  headerClassName?: string;
  maxHeight?: number | string;
  onClose?: () => void;
  title?: ReactNode;
  tone?: BaseModalTone;
  width?: number | string;
}

const toneBarClass: Record<BaseModalTone, string> = {
  blue: 'bg-[linear-gradient(to_right,#5b9bd5,#2e75b6)]',
  brown: 'bg-[linear-gradient(to_right,#8b7355,#5d4a32)]',
  gold: 'bg-[linear-gradient(to_right,#f1c40f,#d4a017)]',
  gray: 'bg-[linear-gradient(to_right,#95a5a6,#7f8c8d)]',
  green: 'bg-[linear-gradient(to_right,#6ebf49,#4a8c2a)]',
  red: 'bg-[linear-gradient(to_right,#e74c3c,#c0392b)]',
};

const toneRingClass: Record<BaseModalTone, string> = {
  blue: 'shadow-[0_0_0_2px_#2e75b6,0_12px_32px_rgba(0,0,0,.6),inset_0_2px_0_rgba(255,255,255,.55)]',
  brown: 'shadow-[0_0_0_2px_#5d4a32,0_12px_32px_rgba(0,0,0,.6),inset_0_2px_0_rgba(255,255,255,.55)]',
  gold: 'shadow-[0_0_0_2px_#d4a017,0_12px_32px_rgba(0,0,0,.6),inset_0_2px_0_rgba(255,255,255,.55)]',
  gray: 'shadow-[0_0_0_2px_#7f8c8d,0_12px_32px_rgba(0,0,0,.6),inset_0_2px_0_rgba(255,255,255,.55)]',
  green: 'shadow-[0_0_0_2px_#4a8c2a,0_12px_32px_rgba(0,0,0,.6),inset_0_2px_0_rgba(255,255,255,.55)]',
  red: 'shadow-[0_0_0_2px_#c0392b,0_12px_32px_rgba(0,0,0,.6),inset_0_2px_0_rgba(255,255,255,.55)]',
};

export function BaseModal({
  accentColor,
  accentLightColor,
  bodyClassName,
  children,
  className,
  closeLabel = 'Fermer',
  footer,
  footerClassName,
  headerClassName,
  maxHeight = BASE_MODAL_DEFAULT_MAX_HEIGHT,
  onClose,
  title,
  tone = 'brown',
  width = BASE_MODAL_DEFAULT_WIDTH,
}: BaseModalProps) {
  const hasHeader = Boolean(title || onClose);
  const accentStyle =
    accentColor && accentLightColor
      ? {
          background: `linear-gradient(to right, ${accentLightColor}, ${accentColor})`,
        }
      : undefined;
  const shellStyle =
    accentColor && accentLightColor
      ? {
          boxShadow: `0 0 0 2px ${accentColor}, 0 12px 32px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.55)`,
          maxHeight,
          width,
        }
      : { maxHeight, width };

  return (
    <section
      className={cn(
        'relative flex max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border-4 border-[#3c2619] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)]',
        toneRingClass[tone],
        className,
      )}
      style={shellStyle}
    >
      <div className={cn('h-2 shrink-0 border-b border-[rgba(0,0,0,.25)]', toneBarClass[tone])} style={accentStyle} />

      {hasHeader ? (
        <>
          <header className={cn('flex shrink-0 items-center gap-2 px-3.5 pb-1.5 pt-2.5', headerClassName)}>
            {title ? (
              <div className="min-w-0 flex-1 font-game text-base font-extrabold tracking-[.02em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
                {title}
              </div>
            ) : (
              <div className="min-w-0 flex-1" />
            )}
            {onClose ? (
              <button
                aria-label={closeLabel}
                className="size-7 shrink-0 cursor-pointer rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#b6a78a,#8b7355)] font-game text-sm font-extrabold leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
                onClick={onClose}
                type="button"
              >
                ×
              </button>
            ) : null}
          </header>
          <div className="mx-3.5 h-px shrink-0 bg-[rgba(93,74,50,.35)]" />
        </>
      ) : null}

      <div className={cn('min-h-0 flex-1 px-3.5 py-3', bodyClassName)}>{children}</div>

      {footer ? (
        <footer
          className={cn(
            'shrink-0 border-t-2 border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(93,74,50,.95),rgba(60,38,25,.97))] px-3.5 pb-3 pt-2.5',
            footerClassName,
          )}
        >
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
