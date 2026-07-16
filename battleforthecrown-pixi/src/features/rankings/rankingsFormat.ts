import { NUMBER_FMT } from '@/lib/formatters';

export function formatScore(score: number): string {
  return NUMBER_FMT.format(score);
}
