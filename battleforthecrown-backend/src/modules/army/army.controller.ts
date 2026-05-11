import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ArmyService } from './army.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import { trainUnitsSchema, type TrainUnitsDto } from './dto/train-units.dto';
import {
  recruitNobleSchema,
  type RecruitNobleDto,
} from './dto/recruit-noble.dto';
import { RecruitTroopsUseCase } from '../gameplay/recruit-troops.use-case';
import { RecruitNobleUseCase } from '../gameplay/recruit-noble.use-case';
import { CancelRecruitmentUseCase } from '../gameplay/cancel-recruitment.use-case';

@Controller('army')
export class ArmyController {
  constructor(
    private readonly armyService: ArmyService,
    private readonly recruitTroops: RecruitTroopsUseCase,
    private readonly recruitNoble: RecruitNobleUseCase,
    private readonly cancelRecruitment: CancelRecruitmentUseCase,
  ) {}

  @Get(':villageId/inventory')
  getInventory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    return this.armyService.getInventory(villageId, user.id);
  }

  @Get(':villageId/training')
  getTraining(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    return this.armyService.getTraining(villageId, user.id);
  }

  @Post(':villageId/train')
  train(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
    @Body(new ZodValidationPipe(trainUnitsSchema)) dto: TrainUnitsDto,
  ) {
    return this.recruitTroops.execute(
      villageId,
      dto.unitType,
      dto.quantity,
      user.id,
    );
  }

  @Post(':villageId/throne/recruit-noble')
  recruitNobleAtThrone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
    @Body(new ZodValidationPipe(recruitNobleSchema)) dto: RecruitNobleDto,
  ) {
    void dto;
    return this.recruitNoble.execute(villageId, user.id);
  }

  @Delete(':villageId/training/:trainingId/cancel')
  cancelTraining(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
    @Param('trainingId') trainingId: string,
  ) {
    return this.cancelRecruitment.execute(villageId, trainingId, user.id);
  }
}
