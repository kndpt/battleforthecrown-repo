import { Controller, Get, Param } from '@nestjs/common';
import type {
  RankingCyclesCurrentResponse,
  WorldFinalRankingsResponse,
} from '@battleforthecrown/shared/rankings';
import { Public } from '../../common/auth';
import { FinalRankingsService } from './final-rankings.service';
import { RankingsCycleService } from './rankings-cycle.service';

/**
 * Public consultation of a world's frozen final leaderboards (Hall of fame) and
 * its live weekly Glory cycle. Mounted under /worlds/:worldId/rankings to keep
 * the resource nested under the world it belongs to, separate from the live
 * /rankings summary endpoints.
 */
@Public()
@Controller('worlds/:worldId/rankings')
export class WorldRankingsController {
  constructor(
    private readonly finalRankingsService: FinalRankingsService,
    private readonly rankingsCycleService: RankingsCycleService,
  ) {}

  @Get('final')
  async getFinalRankings(
    @Param('worldId') worldId: string,
  ): Promise<WorldFinalRankingsResponse> {
    return this.finalRankingsService.getFinalRankings(worldId);
  }

  @Get('cycles/current')
  async getCurrentCycles(
    @Param('worldId') worldId: string,
  ): Promise<RankingCyclesCurrentResponse> {
    return this.rankingsCycleService.getCurrentCycles(worldId);
  }
}
