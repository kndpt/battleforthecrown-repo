import { Controller, Get, Param } from '@nestjs/common';
import type { WorldFinalRankingsResponse } from '@battleforthecrown/shared/rankings';
import { Public } from '../../common/auth';
import { FinalRankingsService } from './final-rankings.service';

/**
 * Public consultation of a world's frozen final leaderboards (Hall of fame).
 * Mounted under /worlds/:worldId/rankings to keep the resource nested under the
 * world it belongs to, separate from the live /rankings summary endpoints.
 */
@Public()
@Controller('worlds/:worldId/rankings')
export class WorldRankingsController {
  constructor(private readonly finalRankingsService: FinalRankingsService) {}

  @Get('final')
  async getFinalRankings(
    @Param('worldId') worldId: string,
  ): Promise<WorldFinalRankingsResponse> {
    return this.finalRankingsService.getFinalRankings(worldId);
  }
}
