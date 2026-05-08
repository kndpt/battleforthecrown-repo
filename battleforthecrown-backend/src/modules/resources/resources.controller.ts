import { Controller, Get, Post, Param } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import {
  CurrentUser,
  OwnershipService,
  type AuthenticatedUser,
} from '../../common/auth';

@Controller('resources')
export class ResourcesController {
  constructor(
    private resourcesService: ResourcesService,
    private ownership: OwnershipService,
  ) {}

  @Get(':villageId')
  getResources(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    return this.resourcesService.getResources(villageId, user.id);
  }

  @Post(':villageId/produce')
  async updateProduction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    await this.ownership.assertVillageOwnedBy(villageId, user.id);
    return this.resourcesService.updateProduction(villageId);
  }
}
