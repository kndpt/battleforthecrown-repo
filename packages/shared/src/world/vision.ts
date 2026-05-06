export interface VisionDisk {
  x: number;
  y: number;
  /** `null` means unlimited (e.g. watchtower level 10). */
  radius: number | null;
}

export function isPointInVisionDisk(
  point: { x: number; y: number },
  disk: VisionDisk,
): boolean {
  if (disk.radius === null) return true;
  const dx = point.x - disk.x;
  const dy = point.y - disk.y;
  return dx * dx + dy * dy <= disk.radius * disk.radius;
}

export function isPointInAnyVisionDisk(
  point: { x: number; y: number },
  disks: readonly VisionDisk[],
): boolean {
  for (const disk of disks) {
    if (isPointInVisionDisk(point, disk)) return true;
  }
  return false;
}
