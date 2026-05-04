import { useEffect, useState } from 'react';

/**
 * Returns a `Date.now()` value that re-renders every `intervalMs` ms.
 * Use to drive interpolation displays without re-implementing setInterval per consumer.
 */
export function useTickingNow(intervalMs = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
