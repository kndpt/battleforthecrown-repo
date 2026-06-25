import { Controller, Get } from '@nestjs/common';
import type { RankingTitlesResponse } from '@battleforthecrown/shared/rankings';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import { RankingsCycleService } from './rankings-cycle.service';

/**
 * JWT-protected (global guard, no `@Public`): a player reads only their own
 * weekly championship titles, active and historical. Public display of another
 * player's titles is out of scope at MVP (run 068 § Hors scope).
 */
@Controller('users/me/ranking-titles')
export class RankingTitlesController {
  constructor(private readonly rankingsCycle: RankingsCycleService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<RankingTitlesResponse> {
    return this.rankingsCycle.getTitlesForUser(user.id);
  }
}
