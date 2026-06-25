import { Controller, Get } from '@nestjs/common';
import type { CosmeticAwardResponse } from '@battleforthecrown/shared';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import { CosmeticAwardService } from './cosmetic-award.service';

/**
 * JWT-protected (global guard, no `@Public`): a player reads only their own
 * permanent cosmetic titles. Public display of another player's awards is
 * out of scope at MVP (run 067 § Hors scope).
 */
@Controller('users/me/cosmetic-awards')
export class CosmeticAwardController {
  constructor(private readonly cosmeticAwards: CosmeticAwardService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CosmeticAwardResponse[]> {
    return this.cosmeticAwards.getAwardsForUser(user.id);
  }
}
