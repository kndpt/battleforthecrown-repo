/** Minimal parent-linked node for hit-target ancestry checks (Pixi Container-compatible). */
interface ParentLinked {
  parent: ParentLinked | null;
}

export function isDescendantOf(node: unknown, ancestor: ParentLinked): boolean {
  let current = node as ParentLinked | null;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}

/** True when a pointer tap should clear entity selection (viewport, ground, or fog). */
export function isMapBackgroundTap(
  target: unknown,
  viewport: unknown,
  mapGroundLayer: ParentLinked,
  fogContainer: ParentLinked,
): boolean {
  if (target === viewport || target === mapGroundLayer) return true;
  if (isDescendantOf(target, mapGroundLayer)) return true;
  return target === fogContainer || isDescendantOf(target, fogContainer);
}
