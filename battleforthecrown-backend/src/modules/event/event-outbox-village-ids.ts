const VILLAGE_ID_KEYS = [
  'villageId',
  'defenderVillageId',
  'attackerVillageId',
  'targetVillageId',
  'hostVillageId',
  'originVillageId',
] as const;

const VILLAGE_ID_ARRAY_KEYS = ['reinforcementOriginVillageIds'] as const;

export function collectVillageIdsFromPayload(
  payload: Record<string, unknown>,
): string[] {
  const ids: string[] = [];

  for (const key of VILLAGE_ID_KEYS) {
    const value = payload[key];
    if (typeof value === 'string' && value.length > 0) {
      ids.push(value);
    }
  }

  for (const key of VILLAGE_ID_ARRAY_KEYS) {
    const value = payload[key];
    if (!Array.isArray(value)) continue;
    for (const id of value) {
      if (typeof id === 'string' && id.length > 0) {
        ids.push(id);
      }
    }
  }

  return ids;
}
