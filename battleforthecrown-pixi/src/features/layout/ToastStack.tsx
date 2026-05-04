import { useEffect } from 'react';
import { useUiStore } from '@/stores/ui';

const TONE_CLASS: Record<string, string> = {
  info: 'border-game-blue-border bg-game-blue-dark/60',
  success: 'border-game-green-border bg-game-green-dark/60',
  warning: 'border-game-gold-border bg-game-gold-dark/60',
  error: 'border-game-red-border bg-game-red-dark/60',
};

export function ToastStack() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);

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
    <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-full max-w-xs flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto rounded-md border-2 px-3 py-2 text-sm text-white shadow-game-inset ${
            TONE_CLASS[toast.tone] ?? TONE_CLASS.info
          }`}
        >
          <p className="font-game text-xs uppercase tracking-widest">{toast.title}</p>
          {toast.description && <p className="mt-0.5 text-xs text-parchment">{toast.description}</p>}
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="absolute right-2 top-1.5 text-xs text-parchment/70 hover:text-white"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
