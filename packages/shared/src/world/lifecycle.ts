import {
  DEFAULT_WORLD_LIFECYCLE_CONFIG,
  type WorldLifecycleConfig,
} from './schemas';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const InscriptionPhase = {
  MAIN: 'main',
  LATE: 'late',
  CLOSED: 'closed',
} as const;

export type InscriptionPhase =
  (typeof InscriptionPhase)[keyof typeof InscriptionPhase];

export interface WorldLifecycleSource {
  startedAt: Date | string | null;
  endsAt?: Date | string | null;
  config: {
    lifecycle?: Partial<WorldLifecycleConfig> | null;
  } | null;
}

export interface WorldDayCounter {
  day: number;
  totalDays: number;
}

export function resolveWorldLifecycleConfig(
  lifecycle?: Partial<WorldLifecycleConfig> | null,
): WorldLifecycleConfig {
  return {
    ...DEFAULT_WORLD_LIFECYCLE_CONFIG,
    ...lifecycle,
  };
}

export function deriveInscriptionPhase(
  world: WorldLifecycleSource,
  now: Date,
): InscriptionPhase {
  const startedAtMs = toTimeMs(world.startedAt);
  if (startedAtMs === null || now.getTime() < startedAtMs) {
    return InscriptionPhase.CLOSED;
  }

  const lifecycle = resolveWorldLifecycleConfig(world.config?.lifecycle);
  const elapsedDays = Math.floor((now.getTime() - startedAtMs) / MS_PER_DAY);

  if (elapsedDays < lifecycle.inscriptionMainDays) {
    return InscriptionPhase.MAIN;
  }

  if (
    elapsedDays <
    lifecycle.inscriptionMainDays + lifecycle.inscriptionLateDays
  ) {
    return InscriptionPhase.LATE;
  }

  return InscriptionPhase.CLOSED;
}

export function deriveWorldDayCounter(
  world: WorldLifecycleSource,
  now: Date,
): WorldDayCounter {
  const lifecycle = resolveWorldLifecycleConfig(world.config?.lifecycle);
  const startedAtMs = toTimeMs(world.startedAt);
  if (startedAtMs === null || now.getTime() < startedAtMs) {
    return { day: 0, totalDays: lifecycle.worldDuration };
  }

  const currentDay = Math.floor((now.getTime() - startedAtMs) / MS_PER_DAY) + 1;
  return {
    day: Math.min(currentDay, lifecycle.worldDuration),
    totalDays: lifecycle.worldDuration,
  };
}

function toTimeMs(value: Date | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const timeMs = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(timeMs) ? null : timeMs;
}
