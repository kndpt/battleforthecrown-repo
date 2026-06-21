import { MS_PER_HOUR, MS_PER_MINUTE } from '../time';

/**
 * Durée de capture PvP selon le niveau du Château de la cible.
 * Courbe figée par `docs/gameplay/14-pvp-conquest.md` § Période de capture variable.
 * Source de vérité unique : importée par le backend (`modules/combat/capture-duration.ts`)
 * et le frontend (preview panneau d'info + rapport scout).
 *
 * IMPORTANT : ces valeurs sont des durées **de base**. Le tempo monde est appliqué
 * uniquement côté backend (`getCaptureDurationMs` via `TempoService`). Les previews
 * frontend affichent la durée de base, comme le preview barbare.
 */
export const PVP_CAPTURE_DURATIONS_MS = [
  { minCastleLevel: 9, durationMs: 4.5 * MS_PER_HOUR },
  { minCastleLevel: 7, durationMs: 3 * MS_PER_HOUR },
  { minCastleLevel: 5, durationMs: 2.25 * MS_PER_HOUR },
  { minCastleLevel: 3, durationMs: 1.5 * MS_PER_HOUR },
  { minCastleLevel: 1, durationMs: 1 * MS_PER_HOUR },
] as const;

/**
 * Durée de capture PvP de base (sans tempo) pour un niveau de Château donné.
 * Lève si `castleLevel` est inconnu : un village joueur conquis a toujours un Château.
 */
export function getPvpCaptureDurationMs(castleLevel?: number | null): number {
  if (castleLevel == null) {
    throw new Error(
      'castleLevel is required for player-village capture duration',
    );
  }

  const lowest = PVP_CAPTURE_DURATIONS_MS[PVP_CAPTURE_DURATIONS_MS.length - 1];
  return (
    PVP_CAPTURE_DURATIONS_MS.find((entry) => castleLevel >= entry.minCastleLevel)
      ?.durationMs ?? lowest.durationMs
  );
}

/**
 * Formate une durée de capture en libellé court `XhYY` (ex `4h30`, `2h15`, `3h`).
 */
export function formatCaptureDuration(ms: number): string {
  const totalMinutes = Math.round(ms / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

/**
 * Libellé preview de la fenêtre de capture PvP de base pour l'UI.
 * Renvoie `null` quand le niveau du Château est inconnu (la cible n'a pas été
 * observée) → l'UI affiche alors `Inconnue`.
 */
export function getPvpCaptureDurationLabel(
  castleLevel?: number | null,
): string | null {
  if (castleLevel == null) return null;
  return formatCaptureDuration(getPvpCaptureDurationMs(castleLevel));
}
