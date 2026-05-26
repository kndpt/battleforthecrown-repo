import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get()
  getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('worldId') worldId: string,
  ) {
    return this.onboarding.getSummary(user.id, worldId);
  }
}
