import { describe, expect, it } from 'vitest';
import {
  isBuildingsPanelSearchOpen,
  withBuildingsPanelSearch,
  withoutBuildingsPanelSearch,
} from './gamePanelSearch';

describe('game panel search helpers', () => {
  it('opens the buildings panel while preserving unrelated params', () => {
    const next = withBuildingsPanelSearch(new URLSearchParams('foo=1'));

    expect(next.get('foo')).toBe('1');
    expect(next.get('panel')).toBe('buildings');
    expect(isBuildingsPanelSearchOpen(next)).toBe(true);
  });

  it('removes only the buildings panel param on close', () => {
    const next = withoutBuildingsPanelSearch(new URLSearchParams('foo=1&panel=buildings'));

    expect(next.get('foo')).toBe('1');
    expect(next.has('panel')).toBe(false);
    expect(isBuildingsPanelSearchOpen(next)).toBe(false);
  });

  it('does not remove another panel value by accident', () => {
    const next = withoutBuildingsPanelSearch(new URLSearchParams('foo=1&panel=other'));

    expect(next.get('foo')).toBe('1');
    expect(next.get('panel')).toBe('other');
  });
});
