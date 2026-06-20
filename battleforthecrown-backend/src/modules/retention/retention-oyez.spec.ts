import {
  OYEZ_CATALOGUE,
  getOyezThematicTask,
  selectOyezForDay,
} from './retention-oyez';
import { getParisDailyKey } from './retention.utils';
import { OYEZ_THEMES } from '@battleforthecrown/shared/retention';

/** The 7 Paris day keys (Mon→Sun) of the ISO week containing the given date. */
function isoWeekDayKeys(year: number, month: number, day: number): string[] {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekdayIndex = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - weekdayIndex);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

describe('selectOyezForDay', () => {
  it('returns null when cadence is 0', () => {
    for (const dayKey of isoWeekDayKeys(2026, 6, 15)) {
      expect(selectOyezForDay('world-a', dayKey, 0)).toBeNull();
    }
  });

  it('fires every day when cadence is 7', () => {
    for (const dayKey of isoWeekDayKeys(2026, 6, 15)) {
      const theme = selectOyezForDay('world-a', dayKey, 7);
      expect(theme).not.toBeNull();
      expect(OYEZ_THEMES).toContain(theme);
    }
  });

  it('fires exactly `weeklyCadence` days per ISO week per world (default 2)', () => {
    const weeks = [
      isoWeekDayKeys(2026, 1, 5),
      isoWeekDayKeys(2026, 6, 15),
      isoWeekDayKeys(2026, 12, 21),
    ];
    for (const worldId of ['world-a', 'world-b', 'world-c']) {
      for (const week of weeks) {
        const fired = week.filter(
          (dayKey) => selectOyezForDay(worldId, dayKey, 2) !== null,
        );
        expect(fired).toHaveLength(2);
      }
    }
  });

  it('is deterministic for the same inputs', () => {
    const dayKey = '2026-06-17';
    const first = selectOyezForDay('world-a', dayKey, 2);
    const second = selectOyezForDay('world-a', dayKey, 2);
    expect(second).toBe(first);
  });

  it('every catalogue theme maps to a thematic task with no reward weight', () => {
    for (const theme of OYEZ_THEMES) {
      const entry = OYEZ_CATALOGUE[theme];
      const task = getOyezThematicTask(theme);
      expect(task.type).toBe(entry.taskType);
      expect(task.target).toBe(1);
      expect(task.rewardWeight).toBe(0);
    }
  });

  // Acceptance #10: the 04:00 Europe/Paris reset boundary must hold across the
  // spring-forward DST change (2026-03-29, 02:00 CET → 03:00 CEST).
  it('keeps the 04:00 Paris reset boundary stable across DST spring-forward', () => {
    // 01:30 UTC = 03:30 Paris (CEST, already shifted) → before reset.
    expect(getParisDailyKey(new Date('2026-03-29T01:30:00Z'))).toBe(
      '2026-03-28',
    );
    // 02:00 UTC = 04:00 Paris → at/after reset.
    expect(getParisDailyKey(new Date('2026-03-29T02:00:00Z'))).toBe(
      '2026-03-29',
    );
    // The scheduler stays deterministic for that day key.
    const theme = selectOyezForDay('world-a', '2026-03-29', 7);
    expect(OYEZ_THEMES).toContain(theme);
  });

  // DST fall-back (2026-10-25, 03:00 CEST → 02:00 CET): the reset boundary is
  // symmetric, so 04:00 Paris must still resolve correctly either side.
  it('keeps the 04:00 Paris reset boundary stable across DST fall-back', () => {
    // 02:30 UTC = 03:30 Paris (CET, after fall-back) → before reset.
    expect(getParisDailyKey(new Date('2026-10-25T02:30:00Z'))).toBe(
      '2026-10-24',
    );
    // 03:00 UTC = 04:00 Paris (CET) → at/after reset.
    expect(getParisDailyKey(new Date('2026-10-25T03:00:00Z'))).toBe(
      '2026-10-25',
    );
  });
});
