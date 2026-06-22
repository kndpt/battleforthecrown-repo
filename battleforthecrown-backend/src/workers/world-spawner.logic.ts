import {
  DEFAULT_WORLD_IDENTITY_CONFIG,
  WorldSigilSchema,
  WorldThemeColorSchema,
  type WorldIdentityConfig,
} from '@battleforthecrown/shared/world';
import { MS_PER_DAY } from '@battleforthecrown/shared/time';

/**
 * Pure-logic du spawner de mondes (run 064). Décide la date d'ouverture planifiée
 * d'un nouveau monde joignable « frais » et dérive son identité de façon
 * déterministe. Aucune dépendance Prisma/pg-boss — testable en unit.
 */

/**
 * Calcule la `plannedOpenAt` d'un nouveau monde, ou `null` si rien ne doit être
 * créé ce tick.
 *
 * - `lastStartedAt === null` (bootstrap, aucun monde n'a jamais ouvert) → `now`.
 * - cadence non échue (`now < lastStartedAt + cadence`) → `null` (skip).
 * - cadence échue, même en retard de plusieurs cycles → `now`. On n'accumule
 *   jamais : l'invariant amont `count(PLANNED) === 0` plafonne à un seul monde
 *   d'avance, donc un retard de N cadences ne crée qu'un monde, ouvert tout de
 *   suite par `openPlannedWorlds` dans le même tick.
 */
export function computeNextPlannedOpenAt(
  lastStartedAt: Date | null,
  newWorldEverydays: number,
  now: Date,
): Date | null {
  if (lastStartedAt === null) {
    return now;
  }
  const nextDue = lastStartedAt.getTime() + newWorldEverydays * MS_PER_DAY;
  if (now.getTime() < nextDue) {
    return null;
  }
  return now;
}

const SIGILS = WorldSigilSchema.options;
const THEME_COLORS = WorldThemeColorSchema.options;

export interface AutoWorldIdentity {
  /** Valeur de la colonne `world.name`. */
  name: string;
  /** Sous-objet `config.identity`. */
  identity: WorldIdentityConfig;
}

/**
 * Dérive nom + identité d'un monde auto-créé à partir du nombre de mondes déjà
 * existants (`worldCount`, 0-based). Déterministe : sigil et couleur tournent sur
 * les énums partagés, le nom porte un suffixe 1-based lisible.
 */
export function deriveAutoWorldIdentity(worldCount: number): AutoWorldIdentity {
  const ordinal = worldCount + 1;
  const sigil = SIGILS[worldCount % SIGILS.length];
  const themeColor = THEME_COLORS[worldCount % THEME_COLORS.length];
  const name = `Royaume ${ordinal}`;
  return {
    name,
    identity: {
      displayName: name,
      tagline: DEFAULT_WORLD_IDENTITY_CONFIG.tagline,
      sigil,
      themeColor,
      tier: DEFAULT_WORLD_IDENTITY_CONFIG.tier,
    },
  };
}
