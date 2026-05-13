export interface VisionDisk {
  x: number;
  y: number;
  radius: number;
}

export function isPointInVisionDisk(
  point: { x: number; y: number },
  disk: VisionDisk,
): boolean {
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
