import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";

export function invalidateArmyMutationQueries(
  qc: QueryClient,
  villageId: string,
): void {
  qc.invalidateQueries({ queryKey: queryKeys.armyTraining(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.population(villageId) });
}

export function invalidateBuildingMutationQueries(
  qc: QueryClient,
  villageId: string,
): void {
  qc.invalidateQueries({ queryKey: queryKeys.queue(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.buildings(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.population(villageId) });
}

export function invalidateCombatDispatchQueries(
  qc: QueryClient,
  villageId: string,
  userId: string | null,
  worldId: string | null,
): void {
  qc.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.activeExpeditions(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.openExpeditions(userId, worldId) });
  qc.invalidateQueries({ queryKey: queryKeys.population(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.villagePower(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.kingdomPowerPrefix(userId) });
}

export function invalidateTroopMovementQueries(
  qc: QueryClient,
  villageIds: string[],
  userId: string | null,
  worldId: string | null,
): void {
  for (const vid of new Set(villageIds)) {
    qc.invalidateQueries({ queryKey: queryKeys.armyInventory(vid) });
    qc.invalidateQueries({ queryKey: queryKeys.activeExpeditions(vid) });
    qc.invalidateQueries({ queryKey: queryKeys.garrison(vid) });
    qc.invalidateQueries({ queryKey: queryKeys.population(vid) });
    qc.invalidateQueries({ queryKey: queryKeys.villagePower(vid) });
  }
  qc.invalidateQueries({ queryKey: queryKeys.openExpeditions(userId, worldId) });
  qc.invalidateQueries({ queryKey: queryKeys.kingdomPowerPrefix(userId) });
}
