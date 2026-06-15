export function formatCoord(x?: number, y?: number): string {
  return typeof x === 'number' && typeof y === 'number' ? `${x}|${y}` : '—';
}

export function shortReportId(reportId: string): string {
  return `#${reportId.slice(0, 6).toUpperCase()}`;
}
