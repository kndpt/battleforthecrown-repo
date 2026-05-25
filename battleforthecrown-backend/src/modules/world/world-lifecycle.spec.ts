import {
  InscriptionPhase,
  deriveInscriptionPhase,
  deriveWorldDayCounter,
  type WorldLifecycleConfig,
  type WorldLifecycleSource,
} from '@battleforthecrown/shared/world';

const STARTED_AT = new Date('2026-01-01T00:00:00.000Z');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('world lifecycle helpers', () => {
  describe('deriveInscriptionPhase', () => {
    it.each([
      ['missing start', world(null), dateAtDay(0), InscriptionPhase.CLOSED],
      [
        'before start',
        world(STARTED_AT),
        dateAtDay(-1),
        InscriptionPhase.CLOSED,
      ],
      ['opening day', world(STARTED_AT), dateAtDay(0), InscriptionPhase.MAIN],
      ['last main day', world(STARTED_AT), dateAtDay(6), InscriptionPhase.MAIN],
      [
        'first late day',
        world(STARTED_AT),
        dateAtDay(7),
        InscriptionPhase.LATE,
      ],
      [
        'after late window',
        world(STARTED_AT),
        dateAtDay(10),
        InscriptionPhase.CLOSED,
      ],
      [
        'custom late boundary',
        world(STARTED_AT, { inscriptionMainDays: 2, inscriptionLateDays: 1 }),
        dateAtDay(2),
        InscriptionPhase.LATE,
      ],
    ])('%s', (_label, source, now, expected) => {
      expect(deriveInscriptionPhase(source, now)).toBe(expected);
    });
  });

  describe('deriveWorldDayCounter', () => {
    it.each([
      ['missing start', world(null), dateAtDay(0), { day: 0, totalDays: 60 }],
      [
        'before start',
        world(STARTED_AT),
        dateAtDay(-1),
        { day: 0, totalDays: 60 },
      ],
      [
        'opening day',
        world(STARTED_AT),
        dateAtDay(0),
        { day: 1, totalDays: 60 },
      ],
      ['fifth day', world(STARTED_AT), dateAtDay(4), { day: 5, totalDays: 60 }],
      [
        'clamped after end',
        world(STARTED_AT),
        dateAtDay(90),
        { day: 60, totalDays: 60 },
      ],
      [
        'custom duration',
        world(STARTED_AT, { worldDuration: 30 }),
        dateAtDay(40),
        { day: 30, totalDays: 30 },
      ],
    ])('%s', (_label, source, now, expected) => {
      expect(deriveWorldDayCounter(source, now)).toEqual(expected);
    });
  });
});

function world(
  startedAt: Date | null,
  lifecycle?: Partial<WorldLifecycleConfig>,
): WorldLifecycleSource {
  return {
    startedAt,
    config: { lifecycle },
  };
}

function dateAtDay(day: number): Date {
  return new Date(STARTED_AT.getTime() + day * MS_PER_DAY);
}
