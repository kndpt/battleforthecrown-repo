import { MS_PER_DAY } from '../time';

/**
 * Indicateur d'inactivité pré-abandon, dérivé en **lecture seule** de
 * `WorldMembership.lastLoginAt`. Source de vérité unique partagée backend
 * (`PublicProfileService`) ↔ frontend (libellé badge).
 *
 * Spec `docs/gameplay/18-inactivity-and-abandonment.md` § « Questions à
 * trancher » → « Affichage carte » : marquer visuellement les comptes inactifs
 * **avant** tout basculement vers la barbarie. Aucun effet gameplay ici.
 *
 * Seuil = {@link INACTIVITY_THRESHOLD_DAYS} jours, aligné **intentionnellement**
 * sur le filtre joueurs actifs de `crown-production.worker.ts` (7 j). La spec 18
 * fixe 14 j = abandon ; l'indicateur vit dans la fenêtre J+7 → J+14 (« à
 * risque », non destructif). Le basculement J+14 reste hors scope.
 */
export const INACTIVITY_THRESHOLD_DAYS = 7;

export type InactivityState = 'ACTIVE' | 'INACTIVE';

export interface InactivityStatus {
  state: InactivityState;
  /** Jours pleins (floor) écoulés depuis `lastLoginAt` ; 0 si jamais connecté. */
  sinceDays: number;
}

/**
 * Dérive l'état d'inactivité d'un membre à partir de son dernier login.
 *
 * `lastLoginAt = null` (membre n'ayant jamais déclenché de heartbeat) → `ACTIVE`
 * pour ne **jamais** produire de faux positif. Le calcul est server-authoritatif :
 * le backend fige `sinceDays`, le client ne recalcule pas (pas de leak de
 * `lastLoginAt` brut, pas de dérive d'horloge).
 */
export function computeInactivityState(
  lastLoginAt: Date | string | null | undefined,
  now: Date,
): InactivityStatus {
  if (lastLoginAt == null) {
    return { state: 'ACTIVE', sinceDays: 0 };
  }

  const lastMs =
    typeof lastLoginAt === 'string'
      ? Date.parse(lastLoginAt)
      : lastLoginAt.getTime();

  if (Number.isNaN(lastMs)) {
    return { state: 'ACTIVE', sinceDays: 0 };
  }

  const sinceDays = Math.max(
    0,
    Math.floor((now.getTime() - lastMs) / MS_PER_DAY),
  );

  return {
    state: sinceDays >= INACTIVITY_THRESHOLD_DAYS ? 'INACTIVE' : 'ACTIVE',
    sinceDays,
  };
}

/** Libellé FR du badge : « Inactif depuis N j » (N = jours pleins). */
export function formatInactivityLabel(sinceDays: number): string {
  return `Inactif depuis ${sinceDays} j`;
}
