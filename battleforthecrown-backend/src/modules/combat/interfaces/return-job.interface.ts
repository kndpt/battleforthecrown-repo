/**
 * A `combat:return` job the caller must schedule on pg-boss AFTER the
 * resolution transaction commits. Emitted by arrival handlers that flip an
 * expedition to RETURNING (caravan) so the worker owns post-commit scheduling.
 */
export interface ReturnJobToSchedule {
  expeditionId: string;
  returnAt: Date;
}
