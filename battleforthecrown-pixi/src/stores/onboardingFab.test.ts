import { beforeEach, describe, expect, it } from 'vitest';
import { useOnboardingFabStore } from './onboardingFab';

const get = () => useOnboardingFabStore.getState();

describe('useOnboardingFabStore', () => {
  beforeEach(() => {
    localStorage.clear();
    get().reset();
  });

  it('defaults to a zero offset', () => {
    expect(get().offset).toEqual({ x: 0, y: 0 });
  });

  it('setOffset() stores the dragged position', () => {
    get().setOffset({ x: 12, y: -34 });
    expect(get().offset).toEqual({ x: 12, y: -34 });
  });

  it('reset() restores the default offset (e.g. on logout)', () => {
    get().setOffset({ x: 50, y: 50 });
    get().reset();
    expect(get().offset).toEqual({ x: 0, y: 0 });
  });
});
