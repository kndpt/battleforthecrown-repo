import { describe, expect, it } from 'vitest';
import { breakdownSeconds, formatCompact, formatDuration, formatIntFr } from './formatters';

describe('breakdownSeconds', () => {
  it('splits hours, minutes and seconds', () => {
    expect(breakdownSeconds(3661)).toEqual({ hours: 1, minutes: 1, seconds: 1 });
  });

  it('returns zero parts for zero', () => {
    expect(breakdownSeconds(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });

  it('handles sub-hour and sub-minute values', () => {
    expect(breakdownSeconds(59)).toEqual({ hours: 0, minutes: 0, seconds: 59 });
    expect(breakdownSeconds(125)).toEqual({ hours: 0, minutes: 2, seconds: 5 });
  });

  it('carries multi-hour totals', () => {
    expect(breakdownSeconds(7325)).toEqual({ hours: 2, minutes: 2, seconds: 5 });
  });

  it('floors fractional seconds', () => {
    expect(breakdownSeconds(90.9)).toEqual({ hours: 0, minutes: 1, seconds: 30 });
  });

  it('clamps negatives to zero', () => {
    expect(breakdownSeconds(-42)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });
});

describe('formatDuration', () => {
  it('formats zero as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats sub-minute durations', () => {
    expect(formatDuration(45_000)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(245_000)).toBe('4:05');
  });

  it('drops seconds in hours mode by default', () => {
    expect(formatDuration(3_661_000)).toBe('1:01');
  });

  it('shows full seconds when showFullSeconds is true', () => {
    expect(formatDuration(3_661_000, { showFullSeconds: true })).toBe('1:01:01');
    expect(formatDuration(3_600_000, { showFullSeconds: true })).toBe('1:00:00');
  });

  it('clamps negative values to 0:00', () => {
    expect(formatDuration(-5_000)).toBe('0:00');
  });

  it('truncates sub-second precision', () => {
    expect(formatDuration(61_999)).toBe('1:01');
  });
});

describe('formatCompact', () => {
  describe('default (nonzero decimals, upper, en)', () => {
    it('renders values < 1K as floored integers', () => {
      expect(formatCompact(0)).toBe('0');
      expect(formatCompact(42)).toBe('42');
      expect(formatCompact(999.9)).toBe('999');
    });

    it('abbreviates thousands with 1 decimal, strips .0', () => {
      expect(formatCompact(1000)).toBe('1K');
      expect(formatCompact(1200)).toBe('1.2K');
      expect(formatCompact(8300)).toBe('8.3K');
      expect(formatCompact(10_500)).toBe('10.5K');
    });

    it('abbreviates millions with 1 decimal, strips .0', () => {
      expect(formatCompact(1_000_000)).toBe('1M');
      expect(formatCompact(1_500_000)).toBe('1.5M');
      expect(formatCompact(3_400_000)).toBe('3.4M');
    });

    it('promotes K to M when rounding crosses the boundary', () => {
      expect(formatCompact(999_999)).toBe('1M');
      expect(formatCompact(999_950)).toBe('1M');
      expect(formatCompact(999_949)).toBe('999.9K');
    });
  });

  describe('decimals: always', () => {
    const opts = { decimals: 'always' as const };

    it('keeps trailing .0 on K/M values', () => {
      expect(formatCompact(1000, opts)).toBe('1.0K');
      expect(formatCompact(1_000_000, opts)).toBe('1.0M');
    });

    it('shows 1 decimal on non-round values', () => {
      expect(formatCompact(1200, opts)).toBe('1.2K');
      expect(formatCompact(1_500_000, opts)).toBe('1.5M');
    });
  });

  describe('decimals: none', () => {
    const opts = { decimals: 'none' as const };

    it('floors K/M values to integer', () => {
      expect(formatCompact(1200, opts)).toBe('1K');
      expect(formatCompact(1999, opts)).toBe('1K');
      expect(formatCompact(1_500_000, opts)).toBe('1M');
      expect(formatCompact(1_999_999, opts)).toBe('1M');
    });

    it('does not promote K→M when floor stays below 1000', () => {
      expect(formatCompact(999_999, opts)).toBe('999K');
    });
  });

  describe('case: lower', () => {
    it('uses lowercase k/m suffixes', () => {
      expect(formatCompact(1200, { case: 'lower' })).toBe('1.2k');
      expect(formatCompact(1_500_000, { case: 'lower' })).toBe('1.5m');
    });
  });

  describe('locale: fr', () => {
    it('uses comma as decimal separator', () => {
      expect(formatCompact(1200, { locale: 'fr' })).toBe('1,2K');
      expect(formatCompact(1_500_000, { locale: 'fr' })).toBe('1,5M');
    });

    it('formats sub-1K with toLocaleString fr-FR', () => {
      expect(formatCompact(42, { locale: 'fr' })).toBe('42');
    });
  });

  describe('combined options', () => {
    it('none + lower (header preset)', () => {
      expect(formatCompact(1200, { decimals: 'none', case: 'lower' })).toBe('1k');
      expect(formatCompact(1_500_000, { decimals: 'none', case: 'lower' })).toBe('1m');
      expect(formatCompact(500, { decimals: 'none', case: 'lower' })).toBe('500');
    });
  });
});

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
