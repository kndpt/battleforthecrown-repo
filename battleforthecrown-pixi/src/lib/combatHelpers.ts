import {
  calculateDistance,
  calculateTravelTime,
  findSlowestUnitSpeed,
} from '@battleforthecrown/shared/logic';

export function calculateExpeditionTravelTime(
  villageX: number,
  villageY: number,
  targetX: number,
  targetY: number,
  selectedUnits: Record<string, number>,
  unitStatsMap: Record<string, { speed: number }>,
  worldTravelSpeed: number
): number {
  if (Object.keys(selectedUnits).length === 0 || worldTravelSpeed === 0) {
    return 0;
  }

  const distance = calculateDistance(villageX, villageY, targetX, targetY);
  const slowestSpeed = findSlowestUnitSpeed(selectedUnits, unitStatsMap);

  if (slowestSpeed === 0) {
    return 0;
  }

  return calculateTravelTime(distance, worldTravelSpeed, slowestSpeed);
}

/**
 * Formate un temps en millisecondes en format H:MM:SS
 * Utile pour afficher le temps de trajet dans l'UI
 *
 * @param ms - Temps en millisecondes
 * @returns Chaîne formatée (ex: "4:05:30" ou "5:30")
 *
 * @example
 * formatTravelTime(245855); // "4:05"
 * formatTravelTime(3661000); // "1:01:01"
 */
export function formatTravelTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
