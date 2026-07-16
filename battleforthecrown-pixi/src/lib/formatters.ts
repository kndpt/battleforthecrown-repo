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
