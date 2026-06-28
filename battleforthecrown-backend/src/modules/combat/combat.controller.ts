import {
  BadRequestException,
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Delete,
  Query,
  Headers,
} from '@nestjs/common';
import { CombatService } from './combat.service';
import { CombatReportService } from './combat-report.service';
import { ReinforcementReportService } from './reinforcement-report.service';
import { CaravanReportService } from './caravan-report.service';
import {
  attackCommandSchema,
  type AttackCommandDto,
} from './dto/attack-command.schema';
import {
  reinforceCommandSchema,
  type ReinforceCommandDto,
} from './dto/reinforce-command.schema';
import {
  recallCommandSchema,
  type RecallCommandDto,
} from './dto/recall-command.schema';
import {
  scoutCommandSchema,
  type ScoutCommandDto,
} from './dto/scout-command.schema';
import {
  caravanCommandSchema,
  type CaravanCommandDto,
} from './dto/caravan-command.schema';
import type {
  CaravanReportResponse,
  ReinforcementReportResponse,
} from '@battleforthecrown/shared/combat';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';

@Controller('combat')
export class CombatController {
  constructor(
    private readonly combatService: CombatService,
    private readonly reportService: CombatReportService,
    private readonly reinforcementReportService: ReinforcementReportService,
    private readonly caravanReportService: CaravanReportService,
  ) {}

  @Post('attack')
  attack(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(attackCommandSchema)) dto: AttackCommandDto,
  ) {
    return this.combatService.initiateAttack(user.id, dto);
  }

  @Post('scout')
  scout(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(scoutCommandSchema)) dto: ScoutCommandDto,
  ) {
    return this.combatService.initiateScout(user.id, dto);
  }

  @Post('reinforce')
  reinforce(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(reinforceCommandSchema))
    dto: ReinforceCommandDto,
  ) {
    return this.combatService.initiateReinforce(user.id, dto);
  }

  @Post('caravan')
  caravan(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(caravanCommandSchema))
    dto: CaravanCommandDto,
  ) {
    return this.combatService.initiateCaravan(user.id, dto);
  }

  @Post('recall')
  recall(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(recallCommandSchema)) dto: RecallCommandDto,
  ) {
    return this.combatService.initiateRecall(user.id, dto);
  }

  @Post('recall/:expeditionId')
  recallEnRoute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('expeditionId') expeditionId: string,
  ) {
    return this.combatService.recallEnRoute(user.id, expeditionId);
  }

  @Get('conquests/open')
  async getOpenConquests(
    @CurrentUser() user: AuthenticatedUser,
    @Query('worldId') worldId?: string,
  ) {
    return this.combatService.getOpenConquests(user.id, worldId);
  }

  @Get('expeditions/open')
  async getOpenExpeditions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('worldId') worldId?: string,
  ) {
    return this.combatService.getOpenExpeditions(user.id, worldId);
  }

  @Get(':villageId/active')
  async getActiveExpeditions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    return this.combatService.getActiveExpeditions(user.id, villageId);
  }

  @Get(':villageId/incoming')
  async getIncomingAttacks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    return this.combatService.getIncomingAttacks(user.id, villageId);
  }

  @Get(':villageId/garrison')
  async getGarrison(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    return this.combatService.getGarrison(user.id, villageId);
  }

  @Get('reports')
  async getAllReports(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-world-id') worldId?: string,
  ) {
    return this.reportService.getAllReports(
      user.id,
      this.requireWorldId(worldId),
    );
  }

  @Get('scout-reports')
  async getAllScoutReports(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-world-id') worldId?: string,
  ) {
    return this.reportService.getAllScoutReports(
      user.id,
      this.requireWorldId(worldId),
    );
  }

  @Get('scout-report/:reportId')
  async getScoutReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ) {
    return this.reportService.getScoutReport(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Patch('scout-report/:reportId/read')
  async markScoutReportAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ) {
    return this.reportService.markScoutReportAsRead(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Delete('scout-report/:reportId')
  async deleteScoutReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ) {
    return this.reportService.deleteScoutReport(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Get('reinforcement-reports')
  async getAllReinforcementReports(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-world-id') worldId?: string,
  ): Promise<ReinforcementReportResponse[]> {
    return this.reinforcementReportService.getAllReinforcementReports(
      user.id,
      this.requireWorldId(worldId),
    );
  }

  @Get('reinforcement-report/:reportId')
  async getReinforcementReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ): Promise<ReinforcementReportResponse> {
    return this.reinforcementReportService.getReinforcementReport(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Patch('reinforcement-report/:reportId/read')
  async markReinforcementReportAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ): Promise<ReinforcementReportResponse> {
    return this.reinforcementReportService.markReinforcementReportAsRead(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Delete('reinforcement-report/:reportId')
  async deleteReinforcementReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ): Promise<{ message: string }> {
    return this.reinforcementReportService.deleteReinforcementReport(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Get('caravan-reports')
  async getAllCaravanReports(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-world-id') worldId?: string,
  ): Promise<CaravanReportResponse[]> {
    return this.caravanReportService.getAllCaravanReports(
      user.id,
      this.requireWorldId(worldId),
    );
  }

  @Get('caravan-report/:reportId')
  async getCaravanReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ): Promise<CaravanReportResponse> {
    return this.caravanReportService.getCaravanReport(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Patch('caravan-report/:reportId/read')
  async markCaravanReportAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ): Promise<CaravanReportResponse> {
    return this.caravanReportService.markCaravanReportAsRead(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Delete('caravan-report/:reportId')
  async deleteCaravanReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ): Promise<{ message: string }> {
    return this.caravanReportService.deleteCaravanReport(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Get('report/:reportId')
  async getReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ) {
    return this.reportService.getReport(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Patch('report/:reportId/read')
  async markReportAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ) {
    return this.reportService.markReportAsRead(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  @Delete('report/:reportId')
  async deleteReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Headers('x-world-id') worldId?: string,
  ) {
    return this.reportService.deleteReport(
      user.id,
      reportId,
      this.requireWorldId(worldId),
    );
  }

  private requireWorldId(worldId?: string) {
    if (!worldId) {
      throw new BadRequestException('worldId is required');
    }
    return worldId;
  }
}
