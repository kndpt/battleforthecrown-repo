import { describe, expect, it } from 'vitest';
import {
  buildWorldMapFocusPath,
  buildWorldMapFocusSearch,
  clearWorldMapFocusSearch,
  parseWorldMapFocusSearch,
} from './worldMapNavigation';

describe('worldMapNavigation', () => {
  it('builds a readable world map focus URL', () => {
    expect(buildWorldMapFocusPath({ x: 12, y: 34 })).toBe('/game/world?focusX=12&focusY=34');
  });

  it('preserves unrelated query params while replacing focus coordinates', () => {
    const params = buildWorldMapFocusSearch({ x: 45, y: 67 }, '?tab=reports&focusX=1&focusY=2');

    expect(params.toString()).toBe('tab=reports&focusX=45&focusY=67');
  });

  it('parses finite focus coordinates and rejects partial or invalid coordinates', () => {
    expect(parseWorldMapFocusSearch('?focusX=12&focusY=34')).toEqual({ x: 12, y: 34 });
    expect(parseWorldMapFocusSearch('?focusX=12')).toBeNull();
    expect(parseWorldMapFocusSearch('?focusX=12&focusY=NaN')).toBeNull();
    expect(parseWorldMapFocusSearch('?focusX=Infinity&focusY=34')).toBeNull();
  });

  it('clears only focus query params after consumption', () => {
    const params = clearWorldMapFocusSearch('?tab=reports&focusX=12&focusY=34');

    expect(params.toString()).toBe('tab=reports');
  });
});
