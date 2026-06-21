import { MS_PER_DAY } from '../time';
import {
  DEFAULT_WORLD_LIFECYCLE_CONFIG,
  type WorldLifecycleConfig,
} from './schemas';

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

/**
 * Human FR label for how long ago a world launched, relative to `now`.
 * `< 1j` → « Lancé aujourd'hui », `= 1j` → « Lancé hier », `> 1j` → « Lancé il y a {N} j ».
 * Returns `null` when the world has not started yet (null/future `startedAt`).
 */
export function formatWorldLaunchAgeFr(
  startedAt: Date | string | null,
  now: Date,
): string | null {
  const startedAtMs = toTimeMs(startedAt);
  if (startedAtMs === null) {
    return null;
  }

  const elapsedMs = now.getTime() - startedAtMs;
  if (elapsedMs < 0) {
    return null;
  }

  const days = Math.floor(elapsedMs / MS_PER_DAY);
  if (days < 1) {
    return "Lancé aujourd'hui";
  }
  if (days === 1) {
    return 'Lancé hier';
  }
  return `Lancé il y a ${days} j`;
}

/** Minimal shape needed to rank a candidate world by launch freshness. */
export interface WorldFreshnessCandidate {
  id: string;
  startedAt: Date | string | null;
  inscriptionPhase: InscriptionPhase;
  /** Optional public status; when present only `OPEN` worlds are eligible. */
  status?: string;
}

/**
 * Picks the freshest still-`main` world to suggest as an alternative to a
 * late-phase world. Returns the eligible candidate with the most recent
 * `startedAt` (descending), excluding `currentWorld`, or `null` when no
 * candidate is in the `main` phase (all `late`/`closed`) or the list is empty.
 * Candidates with no `startedAt` or a future `startedAt` (relative to `now`)
 * are ignored.
 */
export function pickFreshAlternativeWorld(
  currentWorld: { id: string },
  candidates: readonly WorldFreshnessCandidate[],
  now: Date,
): string | null {
  const nowMs = now.getTime();

  const ranked = candidates
    .filter((candidate) => candidate.id !== currentWorld.id)
    .filter((candidate) => candidate.inscriptionPhase === InscriptionPhase.MAIN)
    .filter(
      (candidate) =>
        candidate.status === undefined || candidate.status === 'OPEN',
    )
    .map((candidate) => ({
      id: candidate.id,
      startedAtMs: toTimeMs(candidate.startedAt),
    }))
    .filter(
      (candidate): candidate is { id: string; startedAtMs: number } =>
        candidate.startedAtMs !== null && candidate.startedAtMs <= nowMs,
    )
    .sort((a, b) => b.startedAtMs - a.startedAtMs);

  return ranked[0]?.id ?? null;
}
