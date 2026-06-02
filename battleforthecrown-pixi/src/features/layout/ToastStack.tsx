import { useEffect, useRef } from 'react';
import { GAME_SOUND_URLS, playGameSound } from '@/features/audio/gameSounds';
import { useUiStore, type ToastRefundItem } from '@/stores/ui';
import type { ToastTone } from '@/features/design-system/components/ToastPreview';
import { ToastPreview } from '@/features/design-system/components/ToastPreview';
import { ResourceIcon } from '@/ui';
import { formatResourceAmount } from '@/lib/resourceConfig';
import { TOAST_ICON_BY_TONE } from './toastIcons';

const TONE_MAP: Record<string, ToastTone> = {
  error: 'danger',
  info: 'info',
  success: 'success',
  warning: 'warning',
};

const RESOURCE_REFUND_TYPES = new Set<ToastRefundItem['resource']>([
  'wood',
  'stone',
  'iron',
]);

export function ToastStack() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);
  const playedToastIds = useRef(new Set<string>());

  useEffect(() => {
    for (const toast of toasts) {
      if (playedToastIds.current.has(toast.id)) continue;
      playedToastIds.current.add(toast.id);
      playGameSound(GAME_SOUND_URLS.notificationReceived, 0.55);
    }
  }, [toasts]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts
      .filter((toast) => typeof toast.ttlMs === 'number' && toast.ttlMs > 0)
      .map((toast) => window.setTimeout(() => dismiss(toast.id), toast.ttlMs));
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [toasts, dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-28 z-50 flex w-[min(21rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0">
      {toasts.map((toast) => {
        const tone = TONE_MAP[toast.tone] ?? 'info';
        return (
          <div key={toast.id} role="status" className="pointer-events-auto">
            <ToastPreview
              icon={TOAST_ICON_BY_TONE[tone]}
              onClose={() => dismiss(toast.id)}
              subtitle={toast.description}
              title={toast.title}
              tone={tone}
            >
              {toast.refundItems ? (
                <RefundItems items={toast.refundItems} />
              ) : null}
            </ToastPreview>
          </div>
        );
      })}
    </div>
  );
}

function RefundItems({ items }: { items: ToastRefundItem[] }) {
  const visibleItems = items.filter((item) => item.amount > 0);
  if (visibleItems.length === 0) return null;

  const resources = visibleItems.filter((item) =>
    RESOURCE_REFUND_TYPES.has(item.resource),
  );
  const special = visibleItems.filter(
    (item) => !RESOURCE_REFUND_TYPES.has(item.resource),
  );

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {resources.length > 0 ? (
        <RefundItemRow ariaLabel="Ressources remboursées" items={resources} />
      ) : null}
      {special.length > 0 ? (
        <RefundItemRow
          ariaLabel="Population et couronnes remboursées"
          isSpecial
          items={special}
        />
      ) : null}
    </div>
  );
}

function RefundItemRow({
  ariaLabel,
  isSpecial = false,
  items,
}: {
  ariaLabel: string;
  isSpecial?: boolean;
  items: ToastRefundItem[];
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={
        isSpecial
          ? 'flex flex-wrap gap-1.5 border-t border-white/25 pt-1.5'
          : 'flex flex-wrap gap-1.5'
      }
    >
      {items.map((item) => (
        <span
          key={item.resource}
          className={
            isSpecial
              ? 'inline-flex items-center gap-1 rounded-md border border-[#f4d47c]/45 bg-[#3f2a0f]/30 px-1.5 py-0.5 font-game text-[11px] font-bold text-[#ffe7a2]'
              : 'inline-flex items-center gap-1 rounded-md bg-[rgba(255,255,255,.18)] px-1.5 py-0.5 font-game text-[11px] font-bold text-white'
          }
        >
          <ResourceIcon
            fallbackToEmoji
            resource={item.resource}
            showTooltip
            size={14}
          />
          {`+${formatResourceAmount(item.amount)}`}
        </span>
      ))}
    </div>
  );
}
