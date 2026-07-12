import { describe, expect, it } from 'vitest';
import { formatIntFr } from './formatters';

describe('formatIntFr', () => {
  it('formats an integer with French locale', () => {
    expect(formatIntFr(1234)).toBe('1 234');
  });

  it('floors fractional values before formatting', () => {
    expect(formatIntFr(1234.9)).toBe('1 234');
  });

  it('formats large numbers with group separators', () => {
    expect(formatIntFr(1_500_000)).toBe('1 500 000');
  });

  it('returns "0" for zero', () => {
    expect(formatIntFr(0)).toBe('0');
  });
});
