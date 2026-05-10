import {
  BadRequestException,
  Controller,
  Get,
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
  getLeaderboard(@Query('type') type = 'total', @Query('limit') limit = '20') {
    const parsed = leaderboardTypeSchema.safeParse(type);
    if (!parsed.success) {
      throw new BadRequestException('Invalid leaderboard type');
    }
    const safeType: LeaderboardType = parsed.data;
    return this.powerService.getLeaderboard(
      safeType,
      parseInt(limit, 10) || 20,
    );
  }

  @Get('kingdom')
  getKingdomPower(@CurrentUser() user: AuthenticatedUser) {
    return this.powerService.getKingdomPower(user.id);
  }

  @Public()
  @Get('kingdom/:userId/public')
  getPublicKingdomPower(@Param('userId') userId: string) {
    return this.powerService.getPublicKingdomPower(userId);
  }
}
