// Typed wrapper around Object.entries that preserves key types.
// Object.entries on Record<K, V> is typed [string, V] by TS — this helper
// recovers the K narrowing when the runtime contract is known.
export const typedEntries = <K extends string, V>(
  obj: Partial<Record<K, V>>,
): [K, V][] => Object.entries(obj) as [K, V][];
