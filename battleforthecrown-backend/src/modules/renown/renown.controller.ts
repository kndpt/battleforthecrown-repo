import { Controller, Get } from '@nestjs/common';
import type { RenownStatus } from '@battleforthecrown/shared';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import { RenownService } from './renown.service';

@Controller('users/me')
export class RenownController {
  constructor(private readonly renownService: RenownService) {}

  @Get('renown')
  getRenown(@CurrentUser() user: AuthenticatedUser): Promise<RenownStatus> {
    return this.renownService.getStatus(user.id);
  }
}
