import { Controller, Get, Param } from '@nestjs/common';
import type { PublicPlayerProfileResponse } from '@battleforthecrown/shared';
import { PublicProfileService } from './public-profile.service';

/**
 * JWT-protected (no `@Public`): the precise shield `endsAt` is an exploitable
 * signal, so the public profile is only readable by authenticated players —
 * aligned with spec 09 § Visibilité ("no free info to scrapers"). The route is
 * world-scoped because the newbie shield is per `WorldMembership`.
 */
@Controller('worlds/:worldId/users/:userId')
export class PublicProfileController {
  constructor(private readonly publicProfileService: PublicProfileService) {}

  @Get('public-profile')
  getPublicProfile(
    @Param('worldId') worldId: string,
    @Param('userId') userId: string,
  ): Promise<PublicPlayerProfileResponse> {
    return this.publicProfileService.getPublicProfile(userId, worldId);
  }
}
