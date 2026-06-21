import { useCallback, useState } from 'react';
import type { RenownStatus } from '@battleforthecrown/shared';
import { useRenownQuery } from '@/api/queries';

const LS_KEY = 'bftc.renown.lastSeenLevel';

function readLastSeen(): number | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeLastSeen(level: number): void {
  try {
    localStorage.setItem(LS_KEY, String(level));
  } catch {
    // localStorage indisponible — silencieux
  }
}

export interface UseRenownLevelUpResult {
  renown: RenownStatus | undefined;
  justLeveledUp: boolean;
  acknowledge: () => void;
}

/**
 * Detecte une montée de niveau Renommée en comparant `renown.level` à la
 * dernière valeur persistée dans localStorage (`bftc.renown.lastSeenLevel`).
 *
 * `justLeveledUp` est vrai tant que `acknowledge()` n'a pas été appelé.
 * `acknowledge()` écrit le niveau courant dans localStorage, met à jour la
 * baseline locale et reset le flag.
 */
export function useRenownLevelUp(): UseRenownLevelUpResult {
  const { data: renown } = useRenownQuery();
  // State (init lazy depuis localStorage) plutôt que ref : la baseline ne
  // change qu'à l'acknowledge, donc pas de boucle de re-render, et aucune
  // lecture de ref pendant le render.
  const [lastSeen, setLastSeen] = useState<number | null>(() => readLastSeen());

  const justLeveledUp =
    renown !== undefined && lastSeen !== null && renown.level > lastSeen;

  const acknowledge = useCallback(() => {
    if (renown === undefined) return;
    writeLastSeen(renown.level);
    setLastSeen(renown.level);
  }, [renown]);

  return { renown, justLeveledUp, acknowledge };
}
