import { describe, expect, it } from 'vitest';
import { isDescendantOf, isMapBackgroundTap } from './worldMapBackgroundTap';

type MockNode = { parent: MockNode | null };

function node(): MockNode {
  return { parent: null };
}

function childOf(parent: MockNode): MockNode {
  const child = node();
  child.parent = parent;
  return child;
}

describe('isDescendantOf', () => {
  it('returns true when node is the ancestor', () => {
    const ancestor = node();
    expect(isDescendantOf(ancestor, ancestor)).toBe(true);
  });

  it('returns true for a direct child', () => {
    const ancestor = node();
    const child = childOf(ancestor);
    expect(isDescendantOf(child, ancestor)).toBe(true);
  });

  it('returns true for a nested descendant', () => {
    const ancestor = node();
    const mid = childOf(ancestor);
    const leaf = childOf(mid);
    expect(isDescendantOf(leaf, ancestor)).toBe(true);
  });

  it('returns false for an unrelated node', () => {
    const ancestor = node();
    const other = node();
    expect(isDescendantOf(other, ancestor)).toBe(false);
  });
});

describe('isMapBackgroundTap', () => {
  const viewport = node();
  const mapGroundLayer = node();
  const fogContainer = node();
  const entityContainer = node();

  it('returns true when the target is the viewport', () => {
    expect(isMapBackgroundTap(viewport, viewport, mapGroundLayer, fogContainer)).toBe(true);
  });

  it('returns true when the target is the map ground layer', () => {
    expect(isMapBackgroundTap(mapGroundLayer, viewport, mapGroundLayer, fogContainer)).toBe(true);
  });

  it('returns true when the target is a descendant of the map ground layer', () => {
    const continentTile = childOf(mapGroundLayer);
    expect(isMapBackgroundTap(continentTile, viewport, mapGroundLayer, fogContainer)).toBe(true);
  });

  it('returns true when the target is the fog container', () => {
    expect(isMapBackgroundTap(fogContainer, viewport, mapGroundLayer, fogContainer)).toBe(true);
  });

  it('returns true when the target is a descendant of the fog container', () => {
    const fogHole = childOf(fogContainer);
    expect(isMapBackgroundTap(fogHole, viewport, mapGroundLayer, fogContainer)).toBe(true);
  });

  it('returns false for an entity container so selection is not cleared', () => {
    expect(isMapBackgroundTap(entityContainer, viewport, mapGroundLayer, fogContainer)).toBe(false);
  });
});
