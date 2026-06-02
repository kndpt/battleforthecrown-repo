import { afterEach, describe, expect, it } from 'vitest';
import { useUiStore } from '@/stores/ui';
import { buildRefundToastItems, pushRefundToast } from './refundToast';

describe('buildRefundToastItems', () => {
  afterEach(() => {
    useUiStore.getState().clearToasts();
  });

  it('keeps only positive refund amounts in display order', () => {
    expect(
      buildRefundToastItems({
        wood: 235,
        stone: 0,
        iron: 95,
        population: 6,
        crowns: 50,
      }),
    ).toEqual([
      { resource: 'wood', amount: 235 },
      { resource: 'iron', amount: 95 },
      { resource: 'population', amount: 6 },
      { resource: 'crowns', amount: 50 },
    ]);
  });

  it('returns no toast items when the refund is fully empty', () => {
    expect(
      buildRefundToastItems({
        wood: 0,
        stone: 0,
        iron: 0,
        population: 0,
        crowns: 0,
      }),
    ).toEqual([]);
  });

  it('does not push a toast when the refund is fully empty', () => {
    pushRefundToast('Construction annulée', {
      wood: 0,
      stone: 0,
      iron: 0,
      population: 0,
      crowns: 0,
    });

    expect(useUiStore.getState().toasts).toEqual([]);
  });
});
