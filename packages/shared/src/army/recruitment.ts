/**
 * Helpers de pré-validation pour le recrutement d'unités.
 *
 * Pure-logic, aucune dépendance Prisma / pg-boss / réseau. Les callers
 * (use-cases backend) lisent l'état (`UnitInventory.NOBLE.quantity`,
 * `UnitTraining.unitType === 'NOBLE'`) et délèguent la décision ici.
 */

export type CanRecruitNobleReason = 'GARRISON_FULL' | 'QUEUE_FULL';

export interface CanRecruitNobleInput {
  /** Nombre de Seigneurs déjà en garnison du village. */
  garrisonNobleCount: number;
  /** Vrai s'il existe déjà un entraînement de Seigneur en file Trône du village. */
  hasNobleInQueue: boolean;
}

export interface CanRecruitNobleResult {
  allowed: boolean;
  reason?: CanRecruitNobleReason;
}

/**
 * Cap 1 Seigneur par village (spec 10 § Cap : 1 Seigneur par village).
 * Le cap inclut **garnison ET file** : un joueur ne peut pas mettre 1 Seigneur
 * en file s'il en a déjà 1 en garnison ou un autre en file.
 */
export const canRecruitNoble = (input: CanRecruitNobleInput): CanRecruitNobleResult => {
  if (input.garrisonNobleCount > 0) {
    return { allowed: false, reason: 'GARRISON_FULL' };
  }
  if (input.hasNobleInQueue) {
    return { allowed: false, reason: 'QUEUE_FULL' };
  }
  return { allowed: true };
};
