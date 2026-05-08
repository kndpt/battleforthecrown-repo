import { MS_PER_SECOND } from '../time';

export function calculateTrainingTime(
  unitTimeSeconds: number,
  speedMultiplier: number,
  trainingSpeedBonus = 1,
): number {
  const finalSpeedMultiplier = speedMultiplier * trainingSpeedBonus;
  return Math.max(
    MS_PER_SECOND,
    Math.round((unitTimeSeconds / finalSpeedMultiplier) * MS_PER_SECOND),
  );
}
