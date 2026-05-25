import { useEffect, useRef } from 'react';
import { GAME_SOUND_URLS, playGameSound } from '@/features/audio/gameSounds';
import { useUiStore } from '@/stores/ui';
import type { ToastTone } from '@/features/design-system/components/ToastPreview';
import { ToastPreview } from '@/features/design-system/components/ToastPreview';

const TONE_MAP: Record<string, ToastTone> = {
  error: 'danger',
  info: 'info',
  success: 'success',
  warning: 'warning',
};

const ICON_MAP: Record<ToastTone, string> = {
  danger: 'assets/ui/icons/warning.svg',
  info: 'assets/ui/icons/quest.svg',
  success: 'assets/ui/icons/check.svg',
  warning: 'assets/ui/icons/warning.svg',
};

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
              icon={ICON_MAP[tone]}
              onClose={() => dismiss(toast.id)}
              subtitle={toast.description}
              title={toast.title}
              tone={tone}
            />
          </div>
        );
      })}
    </div>
  );
}
