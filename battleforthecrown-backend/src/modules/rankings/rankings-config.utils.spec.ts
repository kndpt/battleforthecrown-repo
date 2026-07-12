import { RankingSignal } from '@prisma/client';
import {
  DEFAULT_WORLD_CONFIG,
  DEFAULT_WORLD_RANKINGS_CONFIG,
} from '@battleforthecrown/shared/world';
import { GLORY_SIGNALS, resolveRankingsConfig } from './rankings-config.utils';

describe('rankings-config.utils — pure config resolution', () => {
  describe('GLORY_SIGNALS', () => {
    it('is the assault-then-rampart ordered pair', () => {
      expect(GLORY_SIGNALS).toEqual([
        RankingSignal.ASSAULT_GLORY,
        RankingSignal.RAMPART_GLORY,
      ]);
    });
  });

  describe('resolveRankingsConfig', () => {
    it('reads reset day/hour + snapshot size from a valid world config', () => {
      const result = resolveRankingsConfig({
        ...DEFAULT_WORLD_CONFIG,
        rankings: {
          weeklyCycleResetDayUtc: 3,
          weeklyCycleResetHourUtc: 12,
          snapshotEntriesPerCycle: 50,
        },
      });
      expect(result).toEqual({
        reset: { resetDayUtc: 3, resetHourUtc: 12 },
        snapshotEntries: 50,
      });
    });

    it('falls back to defaults when config is not parseable (null / partial / wrong shape)', () => {
      const fromNull = resolveRankingsConfig(null);
      // Partial config: a valid `rankings` block but missing the other
      // sections `WorldConfigSchema` requires → strictObject parse fails →
      // canonical fallback, same as null / garbage.
      const fromPartial = resolveRankingsConfig({
        rankings: DEFAULT_WORLD_RANKINGS_CONFIG,
      });
      const fromGarbage = resolveRankingsConfig('nope');
      const expected = {
        reset: {
          resetDayUtc: DEFAULT_WORLD_RANKINGS_CONFIG.weeklyCycleResetDayUtc,
          resetHourUtc: DEFAULT_WORLD_RANKINGS_CONFIG.weeklyCycleResetHourUtc,
        },
        snapshotEntries: DEFAULT_WORLD_RANKINGS_CONFIG.snapshotEntriesPerCycle,
      };
      expect(fromNull).toEqual(expected);
      expect(fromPartial).toEqual(expected);
      expect(fromGarbage).toEqual(expected);
    });
  });
});
