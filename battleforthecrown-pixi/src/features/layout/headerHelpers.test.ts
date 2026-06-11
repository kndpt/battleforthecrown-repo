import { describe, expect, it } from 'vitest';
import type { PublicWorld } from '@battleforthecrown/shared/world';
import { formatWorldPhase, getPlayerInitials, toResultMap } from './headerHelpers';

// ── toResultMap ────────────────────────────────────────────────────────────────

describe('toResultMap', () => {
  it('maps ids to query data, skipping undefined results', () => {
    const result = toResultMap(
      ['a', 'b', 'c'],
      [{ data: 1 }, { data: undefined }, { data: 3 }],
    );
    expect(result.size).toBe(2);
    expect(result.get('a')).toBe(1);
    expect(result.has('b')).toBe(false);
    expect(result.get('c')).toBe(3);
  });

  it('returns an empty map for empty inputs', () => {
    expect(toResultMap([], []).size).toBe(0);
  });

  it('returns an empty map when all results are undefined', () => {
    expect(toResultMap(['x', 'y'], [{}, {}]).size).toBe(0);
  });

  it('maps all ids when every result has data', () => {
    const result = toResultMap(['p', 'q'], [{ data: 'foo' }, { data: 'bar' }]);
    expect(result.get('p')).toBe('foo');
    expect(result.get('q')).toBe('bar');
  });
});

// ── getPlayerInitials ──────────────────────────────────────────────────────────

describe('getPlayerInitials', () => {
  it('returns — for null, undefined or empty string', () => {
    expect(getPlayerInitials(null)).toBe('—');
    expect(getPlayerInitials(undefined)).toBe('—');
    expect(getPlayerInitials('')).toBe('—');
    expect(getPlayerInitials('   ')).toBe('—');
  });

  it('uses first two chars for a single-word display name', () => {
    expect(getPlayerInitials('Kelvin')).toBe('KE');
    expect(getPlayerInitials('ab')).toBe('AB');
  });

  it('uses first char of first two words', () => {
    expect(getPlayerInitials('Sire Kelvin')).toBe('SK');
    expect(getPlayerInitials('Jean  Luc')).toBe('JL');
  });

  it('handles single-char display name', () => {
    expect(getPlayerInitials('K')).toBe('K');
  });
});

// ── formatWorldPhase ───────────────────────────────────────────────────────────

function stubWorld(
  status: PublicWorld['status'],
  inscriptionPhase: PublicWorld['lifecycle']['inscriptionPhase'],
): PublicWorld {
  return { status, lifecycle: { inscriptionPhase } } as unknown as PublicWorld;
}

describe('formatWorldPhase', () => {
  it('returns — for undefined', () => {
    expect(formatWorldPhase(undefined)).toBe('—');
  });

  it('returns Planifié for PLANNED status', () => {
    expect(formatWorldPhase(stubWorld('PLANNED', 'closed'))).toBe('Planifié');
  });

  it('returns Verrouillé for LOCKED status', () => {
    expect(formatWorldPhase(stubWorld('LOCKED', 'closed'))).toBe('Verrouillé');
  });

  it('returns Inscription ouverte for main phase', () => {
    expect(formatWorldPhase(stubWorld('OPEN', 'main'))).toBe('Inscription ouverte');
  });

  it('returns Retardataires for late phase', () => {
    expect(formatWorldPhase(stubWorld('OPEN', 'late'))).toBe('Retardataires');
  });

  it('returns Inscriptions closes for closed phase', () => {
    expect(formatWorldPhase(stubWorld('OPEN', 'closed'))).toBe('Inscriptions closes');
  });
});
