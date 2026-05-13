import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { VillageService } from './village.service';
import { VillageStrategyService } from '../strategy/village-strategy.service';
import { UpgradeBuildingUseCase } from '../gameplay/upgrade-building.use-case';
import { CancelConstructionUseCase } from '../gameplay/cancel-construction.use-case';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import {
  upgradeBuildingSchema,
  type UpgradeBuildingDto,
} from './dto/upgrade-building.dto';
import {
  changeStrategySchema,
  type ChangeStrategyDto,
} from './dto/strategy.dto';
import {
  updateVillageLabelSchema,
  type UpdateVillageLabelDto,
} from './dto/village-label.dto';

@Controller('village')
export class VillageController {
  constructor(
    private villageService: VillageService,
    private villageStrategyService: VillageStrategyService,
    private upgradeBuilding: UpgradeBuildingUseCase,
    private cancelConstructionUseCase: CancelConstructionUseCase,
  ) {}

  @Get()
  getVillages(
    @CurrentUser() user: AuthenticatedUser,
    @Query('worldId') worldId: string,
  ) {
    return this.villageService.getVillages(worldId, user.id);
  }

  @Get('buildings')
  getBuildingsQueryString(
    @CurrentUser() user: AuthenticatedUser,
    @Query('villageId') villageId: string,
  ) {
    return this.villageService.getBuildings(villageId, user.id);
  }

  @Get('queue')
  getQueueQueryString(
    @CurrentUser() user: AuthenticatedUser,
    @Query('villageId') villageId: string,
  ) {
    return this.villageService.getQueue(villageId, user.id);
  }

  @Get(':villageId/buildings')
  getBuildingsPathParam(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    return this.villageService.getBuildings(villageId, user.id);
  }

  @Get(':villageId/queue')
  getQueuePathParam(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    return this.villageService.getQueue(villageId, user.id);
  }

  @Patch(':villageId/label')
  updateLabel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
    @Body(new ZodValidationPipe(updateVillageLabelSchema))
    dto: UpdateVillageLabelDto,
  ) {
    return this.villageService.updateLabel(villageId, user.id, dto.label);
  }

  @Post(':villageId/upgrade')
  upgrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
    @Body(new ZodValidationPipe(upgradeBuildingSchema)) dto: UpgradeBuildingDto,
  ) {
    return this.upgradeBuilding.execute(villageId, dto.buildingType, user.id);
  }

  @Delete(':villageId/buildings/:buildingId/cancel')
  cancelConstruction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
    @Param('buildingId') buildingId: string,
  ) {
    return this.cancelConstructionUseCase.execute(
      villageId,
      buildingId,
      user.id,
    );
  }

  @Get('strategy')
  getStrategyInfo(
    @CurrentUser() user: AuthenticatedUser,
    @Query('villageId') villageId: string,
  ) {
    return this.villageStrategyService.getStrategyInfo(villageId, user.id);
  }

  @Post(':villageId/strategy')
  changeStrategy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
    @Body(new ZodValidationPipe(changeStrategySchema)) dto: ChangeStrategyDto,
  ) {
    return this.villageStrategyService.changeStrategy(
      villageId,
      dto.strategy,
      user.id,
    );
  }

  @Get('strategy/recommendations')
  getStrategyRecommendations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('villageId') villageId: string,
  ) {
    return this.villageStrategyService.getStrategyRecommendations(
      villageId,
      user.id,
    );
  }
}
