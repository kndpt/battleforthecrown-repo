import { describe, expect, it } from 'vitest';
import {
  INACTIVITY_THRESHOLD_DAYS,
  computeInactivityState,
  formatInactivityLabel,
} from './inactivity';

const MS_PER_DAY = 86_400_000;
const NOW = new Date('2026-06-30T12:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * MS_PER_DAY);
}

describe('computeInactivityState', () => {
  it('lastLoginAt null → ACTIVE, sinceDays 0 (jamais de faux positif)', () => {
    expect(computeInactivityState(null, NOW)).toEqual({
      state: 'ACTIVE',
      sinceDays: 0,
    });
    expect(computeInactivityState(undefined, NOW)).toEqual({
      state: 'ACTIVE',
      sinceDays: 0,
    });
  });

  it('date invalide → ACTIVE (défensif, pas de NaN propagé)', () => {
    expect(computeInactivityState('not-a-date', NOW)).toEqual({
      state: 'ACTIVE',
      sinceDays: 0,
    });
  });

  it('juste sous le seuil → ACTIVE', () => {
    const result = computeInactivityState(
      daysAgo(INACTIVITY_THRESHOLD_DAYS - 1),
      NOW,
    );
    expect(result.state).toBe('ACTIVE');
    expect(result.sinceDays).toBe(INACTIVITY_THRESHOLD_DAYS - 1);
  });

  it('pile au seuil → INACTIVE', () => {
    const result = computeInactivityState(daysAgo(INACTIVITY_THRESHOLD_DAYS), NOW);
    expect(result.state).toBe('INACTIVE');
    expect(result.sinceDays).toBe(INACTIVITY_THRESHOLD_DAYS);
  });

  it('au-delà du seuil → INACTIVE avec sinceDays correct', () => {
    const result = computeInactivityState(daysAgo(20), NOW);
    expect(result.state).toBe('INACTIVE');
    expect(result.sinceDays).toBe(20);
  });

  it('sinceDays = jours pleins (floor), pas d arrondi', () => {
    // 9 jours et 23 h depuis le login → 9 jours pleins
    const lastLogin = new Date(NOW.getTime() - (9 * MS_PER_DAY + 23 * 3_600_000));
    expect(computeInactivityState(lastLogin, NOW).sinceDays).toBe(9);
  });

  it('accepte une string ISO', () => {
    expect(
      computeInactivityState(daysAgo(10).toISOString(), NOW).state,
    ).toBe('INACTIVE');
  });

  it('login dans le futur (dérive horloge) → ACTIVE, sinceDays clamp 0', () => {
    const result = computeInactivityState(
      new Date(NOW.getTime() + MS_PER_DAY),
      NOW,
    );
    expect(result).toEqual({ state: 'ACTIVE', sinceDays: 0 });
  });
});

describe('formatInactivityLabel', () => {
  it('libellé FR « Inactif depuis N j »', () => {
    expect(formatInactivityLabel(7)).toBe('Inactif depuis 7 j');
    expect(formatInactivityLabel(14)).toBe('Inactif depuis 14 j');
  });
});
