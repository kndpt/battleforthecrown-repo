import { beforeEach, describe, expect, it } from 'vitest';
import { usePendingBuildingModalStore } from './pendingBuildingModal';

const get = () => usePendingBuildingModalStore.getState();

describe('usePendingBuildingModalStore', () => {
  beforeEach(() => get().consume());

  it('starts with no pending building', () => {
    expect(get().buildingType).toBeNull();
  });

  it('request() queues the requested building type', () => {
    get().request('CASTLE');
    expect(get().buildingType).toBe('CASTLE');
  });

  it('request() overwrites a previous pending type', () => {
    get().request('CASTLE');
    get().request('WATCHTOWER');
    expect(get().buildingType).toBe('WATCHTOWER');
  });

  it('consume() clears the pending request', () => {
    get().request('BARRACKS');
    get().consume();
    expect(get().buildingType).toBeNull();
  });
});
