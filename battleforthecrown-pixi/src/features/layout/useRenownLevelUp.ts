import { useCallback, useState } from 'react';
import type { RenownStatus } from '@battleforthecrown/shared';
import { useRenownQuery } from '@/api/queries';
import { useAuthStore } from '@/stores/auth';

const LS_PREFIX = 'bftc.renown.lastSeenLevel';

/** Clé localStorage scopée par compte (évite la fuite d'état entre comptes). */
function lsKey(userId: string | null): string {
  return `${LS_PREFIX}.${userId ?? 'anon'}`;
}

function readLastSeen(userId: string | null): number | null {
  try {
    const raw = localStorage.getItem(lsKey(userId));
    if (raw === null) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeLastSeen(userId: string | null, level: number): void {
  try {
    localStorage.setItem(lsKey(userId), String(level));
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
 * dernière valeur persistée dans localStorage (clé scopée par compte).
 *
 * `justLeveledUp` est vrai tant que `acknowledge()` n'a pas été appelé.
 * `acknowledge()` écrit le niveau courant dans localStorage, met à jour la
 * baseline locale et reset le flag.
 */
export function useRenownLevelUp(): UseRenownLevelUpResult {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { data: renown } = useRenownQuery();
  // State (init lazy depuis localStorage) plutôt que ref : la baseline ne
  // change qu'à l'acknowledge, donc pas de boucle de re-render, et aucune
  // lecture de ref pendant le render.
  const [lastSeen, setLastSeen] = useState<number | null>(() =>
    readLastSeen(userId),
  );
  // Re-synchronise la baseline si le compte change sur le même montage,
  // via l'ajustement d'état pendant le render (pattern React recommandé,
  // sans effect — voir react.dev « storing information from previous renders »).
  const [seenForUserId, setSeenForUserId] = useState(userId);
  if (seenForUserId !== userId) {
    setSeenForUserId(userId);
    setLastSeen(readLastSeen(userId));
  }

  const justLeveledUp =
    renown !== undefined && lastSeen !== null && renown.level > lastSeen;

  const acknowledge = useCallback(() => {
    if (renown === undefined) return;
    writeLastSeen(userId, renown.level);
    setLastSeen(renown.level);
  }, [renown, userId]);

  return { renown, justLeveledUp, acknowledge };
}
