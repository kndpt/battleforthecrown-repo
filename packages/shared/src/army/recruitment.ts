/**
 * Helpers de pré-validation pour le recrutement d'unités.
 *
 * Pure-logic, aucune dépendance Prisma / pg-boss / réseau. Les callers
 * (use-cases backend) lisent l'état (`UnitInventory.NOBLE.quantity`,
 * `UnitTraining.unitType === 'NOBLE'`) et délèguent la décision ici.
 */

export type CanRecruitNobleReason =
  | 'GARRISON_FULL'
  | 'QUEUE_FULL'
  | 'IN_FLIGHT'
  | 'OCCUPYING';

export interface CanRecruitNobleInput {
  /** Nombre de Seigneurs déjà en garnison du village. */
  garrisonNobleCount: number;
  /** Vrai s'il existe déjà un entraînement de Seigneur en file Trône du village. */
  hasNobleInQueue: boolean;
  /**
   * Nombre de Seigneurs partis du village et non encore résolus : expédition
   * EN_ROUTE (aller) ou RETURNING (retour d'une conquête échouée/interrompue).
   * Le Seigneur n'est plus en garnison mais appartient toujours au village.
   */
  nobleInFlightCount: number;
  /**
   * Nombre de Seigneurs de ce village en occupation sur une cible : fenêtre de
   * capture ouverte (`PendingConquest` OPEN). Le Seigneur est stationné sur la
   * cible tant que la conquête n'est pas résolue (COMPLETED/INTERRUPTED).
   */
  nobleOccupyingCount: number;
}

export interface CanRecruitNobleResult {
  allowed: boolean;
  reason?: CanRecruitNobleReason;
}

/**
 * Cap 1 Seigneur par village (spec 10 § Cap : 1 Seigneur par village).
 *
 * Le cap couvre **tout le cycle de vie** du Seigneur tant qu'il appartient au
 * village : garnison, file Trône, expédition en vol/retour, et occupation d'une
 * cible pendant la fenêtre de capture. Le re-recrutement n'est possible qu'une
 * fois le Seigneur sorti du village d'origine : installé dans la cible
 * (COMPLETED) ou détruit (INTERRUPTED). Un Seigneur revenu en garnison, lui,
 * continue de bloquer (GARRISON_FULL) jusqu'à sa réutilisation ou sa perte.
 */
export const canRecruitNoble = (input: CanRecruitNobleInput): CanRecruitNobleResult => {
  if (input.garrisonNobleCount > 0) {
    return { allowed: false, reason: 'GARRISON_FULL' };
  }
  if (input.hasNobleInQueue) {
    return { allowed: false, reason: 'QUEUE_FULL' };
  }
  if (input.nobleInFlightCount > 0) {
    return { allowed: false, reason: 'IN_FLIGHT' };
  }
  if (input.nobleOccupyingCount > 0) {
    return { allowed: false, reason: 'OCCUPYING' };
  }
  return { allowed: true };
};
