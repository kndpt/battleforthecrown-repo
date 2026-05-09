/**
 * Helpers unifiés pour les calculs de combat
 * Formules et calculs côté client pour les expéditions
 *
 * @author Kelvin Dupont
 * @version 1.0.0
 * @date 2025-10-18
 */

/**
 * Calcule la distance euclidienne entre deux points du monde
 * Formule : distance = √((targetX - villageX)² + (targetY - villageY)²)
 *
 * @param villageX - Coordonnée X du village attaquant
 * @param villageY - Coordonnée Y du village attaquant
 * @param targetX - Coordonnée X de la cible
 * @param targetY - Coordonnée Y de la cible
 * @returns Distance en cases (nombre de tuiles)
 *
 * @example
 * const distance = calculateDistance(144, 249, 140, 231);
 * console.log(distance); // ~18.44 cases
 */
import {
  calculateDistance as sharedCalculateDistance,
  calculateTravelTime as sharedCalculateTravelTime,
  findSlowestUnitSpeed as sharedFindSlowestUnitSpeed,
} from '@battleforthecrown/shared/logic';

/**
 * Calcule la distance euclidienne entre deux points du monde
 * Formule : distance = √((targetX - villageX)² + (targetY - villageY)²)
 */
export function calculateDistance(
  villageX: number,
  villageY: number,
  targetX: number,
  targetY: number
): number {
  return sharedCalculateDistance(villageX, villageY, targetX, targetY);
}

/**
 * Calcule le temps de trajet en millisecondes en fonction de la distance et de la vitesse.
 * Formule serveur-autoritative (échelle directe : speed plus haut = plus rapide) :
 *   travelMs = (distance × REFERENCE_SPEED / (armySpeed × worldTravelSpeed)) × 60 × 1000
 *
 * @param distance - Distance en cases
 * @param armySpeed - Vitesse de l'armée (= speed de l'unité la plus lente du groupe)
 * @param worldTravelSpeed - Multiplicateur global de vitesse du monde (config.gameSpeed.travel)
 * @returns Temps de trajet en millisecondes
 */
export function calculateTravelTime(
  distance: number,
  armySpeed: number,
  worldTravelSpeed: number
): number {
  return sharedCalculateTravelTime(distance, worldTravelSpeed, armySpeed);
}

/**
 * Trouve la vitesse de l'unité la plus lente parmi une sélection d'unités.
 * Convention : speed plus haut = unité plus rapide. Donc la "plus lente" = min(speed).
 *
 * @param selectedUnits - Record de types d'unités et quantités sélectionnées
 * @param unitStatsMap - Map de types d'unités vers leurs stats (avec vitesse)
 * @returns Vitesse de l'unité la plus lente, ou 0 si aucune unité sélectionnée
 */
export function findSlowestUnitSpeed(
  selectedUnits: Record<string, number>,
  unitStatsMap: Record<string, { speed: number }>
): number {
  return sharedFindSlowestUnitSpeed(selectedUnits, unitStatsMap);
}

/**
 * Calcule le temps de trajet complet pour une expédition
 * Combine distance, unités sélectionnées et configuration globale
 *
 * @param villageX - Coordonnée X du village attaquant
 * @param villageY - Coordonnée Y du village attaquant
 * @param targetX - Coordonnée X de la cible
 * @param targetY - Coordonnée Y de la cible
 * @param selectedUnits - Record de types d'unités et quantités
 * @param unitStatsMap - Map de stats des unités (vitesse)
 * @param worldTravelSpeed - Config globale de vitesse de trajet
 * @returns Temps de trajet en ms, ou 0 si calcul impossible
 *
 * @example
 * const travelMs = calculateExpeditionTravelTime(
 *   144, 249, 140, 231,
 *   { MILITIA: 10, ARCHER: 5 },
 *   { MILITIA: { speed: 20 }, ARCHER: { speed: 18 } },
 *   99
 * );
 */
export function calculateExpeditionTravelTime(
  villageX: number,
  villageY: number,
  targetX: number,
  targetY: number,
  selectedUnits: Record<string, number>,
  unitStatsMap: Record<string, { speed: number }>,
  worldTravelSpeed: number
): number {
  // Valider les paramètres
  if (Object.keys(selectedUnits).length === 0 || worldTravelSpeed === 0) {
    return 0;
  }

  const distance = calculateDistance(villageX, villageY, targetX, targetY);
  const slowestSpeed = findSlowestUnitSpeed(selectedUnits, unitStatsMap);

  if (slowestSpeed === 0) {
    return 0;
  }

  return calculateTravelTime(distance, slowestSpeed, worldTravelSpeed);
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
