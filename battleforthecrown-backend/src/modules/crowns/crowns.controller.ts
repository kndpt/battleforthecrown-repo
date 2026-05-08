import { Controller, Get, Post, Param } from '@nestjs/common';
import { CrownsService } from './crowns.service';
import {
  CurrentUser,
  OwnershipService,
  type AuthenticatedUser,
} from '../../common/auth';

@Controller('crowns')
export class CrownsController {
  constructor(
    private crownsService: CrownsService,
    private ownership: OwnershipService,
  ) {}

  @Get(':worldId')
  async getCrowns(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
  ) {
    return this.crownsService.getCrownBalance(user.id, worldId);
  }

  @Post(':worldId/produce')
  async updateProduction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
  ) {
    await this.ownership.assertWorldMember(worldId, user.id);
    return this.crownsService.updateProduction(user.id, worldId, true);
  }
}
