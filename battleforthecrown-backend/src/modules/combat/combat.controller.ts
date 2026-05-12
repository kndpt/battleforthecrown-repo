import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { CombatService } from './combat.service';
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
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';

@Controller('combat')
export class CombatController {
  constructor(private readonly combatService: CombatService) {}

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

  @Get(':villageId/active')
  async getActiveExpeditions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    return this.combatService.getActiveExpeditions(user.id, villageId);
  }

  @Get(':villageId/garrison')
  async getGarrison(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
  ) {
    return this.combatService.getGarrison(user.id, villageId);
  }

  @Get('reports')
  async getAllReports(@CurrentUser() user: AuthenticatedUser) {
    return this.combatService.getAllReports(user.id);
  }

  @Get('scout-reports')
  async getAllScoutReports(@CurrentUser() user: AuthenticatedUser) {
    return this.combatService.getAllScoutReports(user.id);
  }

  @Get('scout-report/:reportId')
  async getScoutReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
  ) {
    return this.combatService.getScoutReport(user.id, reportId);
  }

  @Patch('scout-report/:reportId/read')
  async markScoutReportAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
  ) {
    return this.combatService.markScoutReportAsRead(user.id, reportId);
  }

  @Delete('scout-report/:reportId')
  async deleteScoutReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
  ) {
    return this.combatService.deleteScoutReport(user.id, reportId);
  }

  @Get('report/:reportId')
  async getReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
  ) {
    return this.combatService.getReport(user.id, reportId);
  }

  @Patch('report/:reportId/read')
  async markReportAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
  ) {
    return this.combatService.markReportAsRead(user.id, reportId);
  }

  @Delete('report/:reportId')
  async deleteReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
  ) {
    return this.combatService.deleteReport(user.id, reportId);
  }
}
