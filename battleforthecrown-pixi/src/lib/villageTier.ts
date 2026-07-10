const THRESHOLDS: readonly [number, number][] = [
  [5000, 6],
  [2500, 5],
  [1500, 4],
  [800, 3],
  [300, 2],
];

export function villageTierFromPower(power: number): number {
  for (const [min, tier] of THRESHOLDS) {
    if (power >= min) return tier;
  }
  return 1;
}

export function parseAndTierFromPower(formatted: string): number {
  const n = Number.parseInt(String(formatted).replace(/\D/g, ''), 10) || 0;
  return villageTierFromPower(n);
}
