import type { DailyCardTaskType } from '@prisma/client';
import {
  OYEZ_THEMES,
  type OyezTheme,
} from '@battleforthecrown/shared/retention';
import { MS_PER_DAY } from '@battleforthecrown/shared/time';
import type { ScaledTaskTemplate } from './retention-scaling';

export interface OyezCatalogueEntry {
  theme: OyezTheme;
  title: string;
  description: string;
  /** Daily card task type appended to the day card while this Oyez is active. */
  taskType: DailyCardTaskType;
  taskLabel: string;
}

/**
 * Catalogue of the four Oyez themes. Titles/descriptions follow
 * `docs/gameplay/05-daily-cards-and-oyez.md` § Exemples. Each theme maps onto a
 * runtime event already wired in `getTaskProjection` so the thematic task is
 * verifiable end-to-end.
 */
export const OYEZ_CATALOGUE: Record<OyezTheme, OyezCatalogueEntry> = {
  BUILDERS: {
    theme: 'BUILDERS',
    title: 'Jour des bâtisseurs',
    description: 'La construction est légèrement favorisée aujourd’hui.',
    taskType: 'COMPLETE_BUILDING',
    taskLabel: 'Terminer une construction supplémentaire',
  },
  MARCH: {
    theme: 'MARCH',
    title: 'Marche forcée',
    description: 'Les expéditions sont légèrement favorisées aujourd’hui.',
    taskType: 'SEND_REINFORCEMENT',
    taskLabel: 'Envoyer un renfort',
  },
  WATCH: {
    theme: 'WATCH',
    title: 'Oeil du Guet',
    description: 'L’exploration est favorisée aujourd’hui.',
    taskType: 'SCOUT_TARGET',
    taskLabel: 'Scouter une cible',
  },
  BARBARIANS: {
    theme: 'BARBARIANS',
    title: 'Jour des barbares',
    description: 'Le PVM barbare est favorisé aujourd’hui.',
    taskType: 'RAID_BARBARIAN',
    taskLabel: 'Vaincre un village barbare',
  },
};

/**
 * The thematic task appended under an active Oyez. Reward weight is 0: the card
 * reward stays capped by the 3 natural scaling tasks (run 046 #9 — Oyez never
 * stacks a reward bonus).
 */
export function getOyezThematicTask(theme: OyezTheme): ScaledTaskTemplate {
  const entry = OYEZ_CATALOGUE[theme];
  return {
    type: entry.taskType,
    label: entry.taskLabel,
    target: 1,
    metadata: {},
    rewardWeight: 0,
  };
}

/**
 * Deterministic Oyez scheduler. Given a world and a Paris day key
 * (`YYYY-MM-DD`), decides whether an Oyez fires today and which theme.
 *
 * `weeklyCadence` distinct weekdays are picked per ISO week from a seed derived
 * from `worldId` + ISO year/week, guaranteeing exactly `weeklyCadence` Oyez per
 * week per world. The day key is already Paris-resolved, so the result is
 * DST-stable (no wall-clock arithmetic here).
 */
export function selectOyezForDay(
  worldId: string,
  dayKey: string,
  weeklyCadence: number,
): OyezTheme | null {
  if (weeklyCadence <= 0) return null;
  const cadence = Math.min(7, Math.max(0, Math.floor(weeklyCadence)));
  const { isoYear, isoWeek, weekdayIndex } = isoWeekParts(dayKey);

  const weekSeed = hashString(`${worldId}:${isoYear}:${isoWeek}`);
  const oyezWeekdays = pickWeekdays(weekSeed, cadence);
  if (!oyezWeekdays.has(weekdayIndex)) return null;

  const themeIndex = hashString(`${worldId}:${dayKey}`) % OYEZ_THEMES.length;
  return OYEZ_THEMES[themeIndex];
}

/** Deterministic subset of weekday indices (0=Monday..6=Sunday). */
function pickWeekdays(seed: number, count: number): Set<number> {
  const indices = [0, 1, 2, 3, 4, 5, 6];
  // Fisher–Yates with a seeded LCG for reproducibility.
  let state = seed || 1;
  for (let i = indices.length - 1; i > 0; i -= 1) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const j = state % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, count));
}

/** ISO-8601 week parts from a `YYYY-MM-DD` calendar key (UTC arithmetic). */
function isoWeekParts(dayKey: string): {
  isoYear: number;
  isoWeek: number;
  weekdayIndex: number;
} {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // 0=Sunday..6=Saturday → 0=Monday..6=Sunday.
  const weekdayIndex = (date.getUTCDay() + 6) % 7;
  // Thursday of the current ISO week determines the ISO year.
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() - weekdayIndex + 3);
  const isoYear = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstWeekday = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstWeekday + 3);
  const isoWeek =
    1 +
    Math.round(
      (thursday.getTime() - firstThursday.getTime()) / (7 * MS_PER_DAY),
    );
  return { isoYear, isoWeek, weekdayIndex };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
