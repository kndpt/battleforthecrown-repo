import { Controller, Get, Param } from '@nestjs/common';
import type { VillageIntelDto } from '@battleforthecrown/shared/world';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import { IntelService } from './intel.service';

@Controller('worlds/:worldId/intel')
export class IntelController {
  constructor(private readonly intelService: IntelService) {}

  @Get(':villageId')
  getVillageIntel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
    @Param('villageId') villageId: string,
  ): Promise<VillageIntelDto | null> {
    return this.intelService.getIntel(user.id, worldId, villageId);
  }
}
