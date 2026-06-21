/**
 * Renommée — bonus de classement de fin de monde (fonction pure).
 *
 * Crédité par signal (POWER / ASSAULT_GLORY / RAMPART_GLORY) à la transition
 * `LOCKED→ENDED`, par palier de rang. Spec : docs/gameplay/25-account-renown.md §3.
 */
import { RENOWN_RANKING_BONUS } from './constants';

/** Bonus de Renommée pour un rang final (1-indexé) dans un signal donné. */
export const renownRankingBonus = (rank: number): number => {
  if (!Number.isFinite(rank) || rank < 1) return 0;
  if (rank === 1) return RENOWN_RANKING_BONUS.top1;
  if (rank <= 10) return RENOWN_RANKING_BONUS.top10;
  if (rank <= 100) return RENOWN_RANKING_BONUS.top100;
  return RENOWN_RANKING_BONUS.participation;
};
