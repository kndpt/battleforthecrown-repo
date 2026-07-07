export const NUMBER_FMT = new Intl.NumberFormat('fr-FR');

export const INTEGER_FMT = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

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
