import { useUiStore, type ToastRefundItem, type ToastRefundResource } from '@/stores/ui';

export interface RefundToastPayload {
  wood: number;
  stone: number;
  iron: number;
  population: number;
  crowns?: number;
}

const REFUND_TOAST_RESOURCE_ORDER = [
  'wood',
  'stone',
  'iron',
  'population',
  'crowns',
] as const satisfies readonly ToastRefundResource[];

export function buildRefundToastItems(refunded: RefundToastPayload): ToastRefundItem[] {
  return REFUND_TOAST_RESOURCE_ORDER.flatMap((resource) => {
    const amount = refunded[resource] ?? 0;
    if (amount <= 0) return [];
    return [{ resource, amount }];
  });
}

export function pushRefundToast(title: string, refunded: RefundToastPayload) {
  const refundItems = buildRefundToastItems(refunded);
  if (refundItems.length === 0) return;

  useUiStore.getState().pushToast({
    description: 'Remboursement ajouté au stock.',
    refundItems,
    title,
    tone: 'success',
    ttlMs: 4500,
  });
}
