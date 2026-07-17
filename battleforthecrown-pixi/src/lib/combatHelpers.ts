import { formatDuration } from './formatters';

export function formatTravelTime(ms: number): string {
  return formatDuration(ms, { showFullSeconds: true });
}
