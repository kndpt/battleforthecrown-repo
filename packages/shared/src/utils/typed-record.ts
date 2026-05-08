// Typed wrappers around Object.entries / Object.keys that preserve key types.
// Object.entries on Record<K, V> is typed [string, V] by TS — these helpers
// recover the K narrowing when the runtime contract is known.
export const typedEntries = <K extends string, V>(
  obj: Partial<Record<K, V>>,
): [K, V][] => Object.entries(obj) as [K, V][];

export const typedKeys = <K extends string>(
  obj: Partial<Record<K, unknown>>,
): K[] => Object.keys(obj) as K[];
