import { describe, expect, it } from 'vitest';
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  DISPLAY_NAME_PATTERN,
  displayNameSchema,
  formatAnonymousPlayerName,
  normalizeDisplayName,
} from './display-name';

describe('normalizeDisplayName', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeDisplayName('  Kelvin  ')).toBe('Kelvin');
  });

  it('collapses internal whitespace runs', () => {
    expect(normalizeDisplayName('Jean   Luc')).toBe('Jean Luc');
    expect(normalizeDisplayName('  A  \t B  ')).toBe('A B');
  });
});

describe('displayNameSchema', () => {
  it('accepts valid names within length bounds after normalization', () => {
    expect(displayNameSchema.parse('Kelvin')).toBe('Kelvin');
    expect(displayNameSchema.parse('  Sir Kelvin  ')).toBe('Sir Kelvin');
    expect(displayNameSchema.parse('a'.repeat(DISPLAY_NAME_MIN_LENGTH))).toHaveLength(
      DISPLAY_NAME_MIN_LENGTH,
    );
    expect(displayNameSchema.parse('a'.repeat(DISPLAY_NAME_MAX_LENGTH))).toHaveLength(
      DISPLAY_NAME_MAX_LENGTH,
    );
  });

  it('rejects empty-after-trim input', () => {
    expect(() => displayNameSchema.parse('   ')).toThrow();
  });

  it('rejects names shorter than DISPLAY_NAME_MIN_LENGTH after trim', () => {
    expect(() => displayNameSchema.parse('ab')).toThrow(
      `Nom : ${DISPLAY_NAME_MIN_LENGTH} caractères minimum`,
    );
  });

  it('rejects names longer than DISPLAY_NAME_MAX_LENGTH after trim', () => {
    expect(() => displayNameSchema.parse('a'.repeat(DISPLAY_NAME_MAX_LENGTH + 1))).toThrow(
      `Nom : ${DISPLAY_NAME_MAX_LENGTH} caractères maximum`,
    );
  });

  it('rejects invalid characters', () => {
    expect(DISPLAY_NAME_PATTERN.test('bad@name')).toBe(false);
    expect(() => displayNameSchema.parse('bad@name')).toThrow(
      "Caractères autorisés : lettres, chiffres, espace, _ ' -",
    );
  });

  it('allows underscore, apostrophe and hyphen', () => {
    expect(displayNameSchema.parse("O'Brien-Lord_1")).toBe("O'Brien-Lord_1");
  });
});

describe('formatAnonymousPlayerName', () => {
  it('takes the last 6 chars of the user id', () => {
    expect(formatAnonymousPlayerName('user_abcdef123456')).toBe('Joueur 123456');
  });

  it('handles ids shorter than 6 chars by surfacing the whole id', () => {
    expect(formatAnonymousPlayerName('ab')).toBe('Joueur ab');
  });

  it('falls back to a question mark for null or undefined', () => {
    expect(formatAnonymousPlayerName(null)).toBe('Joueur ?');
    expect(formatAnonymousPlayerName(undefined)).toBe('Joueur ?');
  });

  it('falls back to a question mark for an empty string', () => {
    expect(formatAnonymousPlayerName('')).toBe('Joueur ?');
  });
});
