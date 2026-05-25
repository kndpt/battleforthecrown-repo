import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { PowerService } from './power.service';
import { CurrentUser, Public, type AuthenticatedUser } from '../../common/auth';

const leaderboardTypeSchema = z.enum(['total', 'kingdom', 'army']);
type LeaderboardType = z.infer<typeof leaderboardTypeSchema>;

@Controller('power')
export class PowerController {
  constructor(private readonly powerService: PowerService) {}

  @Get()
  getVillagePower(
    @CurrentUser() user: AuthenticatedUser,
    @Query('villageId') villageId?: string,
  ) {
    if (!villageId) {
      throw new BadRequestException('villageId query parameter is required');
    }
    return this.powerService.getVillagePower(villageId, user.id);
  }

  @Public()
  @Get('village/:villageId/public')
  getPublicVillagePower(@Param('villageId') villageId: string) {
    return this.powerService.getPublicVillagePower(villageId);
  }

  @Public()
  @Get('leaderboard')
  getLeaderboard(
    @Query('type') type = 'total',
    @Query('limit') limit = '20',
    @Query('worldId') worldId?: string,
  ) {
    const parsed = leaderboardTypeSchema.safeParse(type);
    if (!parsed.success) {
      throw new BadRequestException('Invalid leaderboard type');
    }
    const safeType: LeaderboardType = parsed.data;
    return this.powerService.getLeaderboard(
      safeType,
      parseInt(limit, 10) || 20,
      this.requireWorldId(worldId),
    );
  }

  @Get('kingdom')
  getKingdomPower(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-world-id') worldId?: string,
  ) {
    return this.powerService.getKingdomPower(
      user.id,
      this.requireWorldId(worldId),
    );
  }

  @Public()
  @Get('kingdom/:userId/public')
  getPublicKingdomPower(
    @Param('userId') userId: string,
    @Query('worldId') worldId?: string,
  ) {
    return this.powerService.getPublicKingdomPower(
      userId,
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
