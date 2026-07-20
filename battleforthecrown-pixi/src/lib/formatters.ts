export const NUMBER_FMT = new Intl.NumberFormat('fr-FR');

export function formatIntFr(n: number): string {
  return NUMBER_FMT.format(Math.floor(n));
}

export const INTEGER_FMT = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

export const REPORT_DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatCompact(n: number, opts: {
  decimals?: 'always' | 'nonzero' | 'none';
  case?: 'upper' | 'lower';
  locale?: 'en' | 'fr';
} = {}): string {
  const { decimals = 'nonzero', case: c = 'upper', locale = 'en' } = opts;

  const fmt = (val: number): string => {
    let s: string;
    if (decimals === 'none') {
      s = String(Math.floor(val));
    } else {
      s = val.toFixed(1);
      if (decimals === 'nonzero') s = s.replace(/\.0$/, '');
    }
    if (locale === 'fr') s = s.replace('.', ',');
    return s;
  };

  const sfx = (u: string) => (c === 'lower' ? u.toLowerCase() : u);

  if (n >= 1_000_000) return fmt(n / 1_000_000) + sfx('M');
  if (n >= 1_000) {
    const kRounded = decimals === 'none' ? Math.floor(n / 1_000) : Number((n / 1_000).toFixed(1));
    if (kRounded >= 1000) return fmt(n / 1_000_000) + sfx('M');
    return fmt(n / 1_000) + sfx('K');
  }

  const base = Math.floor(n);
  return locale === 'fr' ? base.toLocaleString('fr-FR') : String(base);
}

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;

export interface HmsBreakdown {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Decompose a whole-second count into hours/minutes/seconds parts.
 * Callers own their own rounding (floor vs ceil) and string formatting;
 * this only centralizes the arithmetic and the 3600/60 magic numbers.
 */
export function breakdownSeconds(totalSeconds: number): HmsBreakdown {
  const total = Math.max(0, Math.floor(totalSeconds));
  return {
    hours: Math.floor(total / SECONDS_PER_HOUR),
    minutes: Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: total % SECONDS_PER_MINUTE,
  };
}

export function formatDuration(ms: number, opts?: { showFullSeconds?: boolean }): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const { hours: h, minutes: m, seconds: s } = breakdownSeconds(totalSec);
  if (h > 0) {
    return opts?.showFullSeconds
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${h}:${m.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatReportTimestamp(value: string, includeTimeOnPastDays = false): string {
  const parsed = new Date(value);
  const isSameDay = parsed.toDateString() === new Date().toDateString();
  if (isSameDay) {
    return parsed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
  if (includeTimeOnPastDays) {
    opts.hour = '2-digit';
    opts.minute = '2-digit';
  }
  return parsed.toLocaleDateString('fr-FR', opts);
}
