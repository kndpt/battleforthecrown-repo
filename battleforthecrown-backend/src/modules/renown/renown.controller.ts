import { Controller, Get } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import { RenownService } from './renown.service';

@Controller('users/me')
export class RenownController {
  constructor(private readonly renownService: RenownService) {}

  @Get('renown')
  getRenown(@CurrentUser() user: AuthenticatedUser) {
    return this.renownService.getStatus(user.id);
  }
}
