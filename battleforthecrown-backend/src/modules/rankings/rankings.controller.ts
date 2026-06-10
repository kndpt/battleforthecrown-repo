import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import type {
  RankingSignal,
  RankingsLeaderboardResponse,
} from '@battleforthecrown/shared/rankings';
import { z } from 'zod';
import { Public } from '../../common/auth';
import { RankingsService } from './rankings.service';

const limitSchema = z.coerce.number().int().min(1).max(100).default(20);
const periodSchema = z.enum(['WEEKLY', 'ALL_TIME']).default('WEEKLY');
const signalSchema = z.enum(['POWER', 'ASSAULT_GLORY', 'RAMPART_GLORY']);

@Public()
@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  async getSummary(
    @Query('worldId') worldId?: string,
    @Query('limit') limit?: string,
  ): Promise<{ leaderboards: RankingsLeaderboardResponse[] }> {
    if (!worldId) throw new BadRequestException('worldId is required');
    return this.rankingsService.getRankingsSummary(
      worldId,
      this.parseLimit(limit),
    );
  }

  @Get(':signal')
  async getLeaderboard(
    @Param('signal') signalParam: string,
    @Query('worldId') worldId?: string,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ): Promise<RankingsLeaderboardResponse> {
    if (!worldId) throw new BadRequestException('worldId is required');
    return this.rankingsService.getLeaderboard(
      worldId,
      this.parseSignal(signalParam),
      this.parsePeriod(period),
      this.parseLimit(limit),
    );
  }

  private parseSignal(signal: string): RankingSignal {
    const parsed = signalSchema.safeParse(signal);
    if (!parsed.success)
      throw new BadRequestException('Invalid ranking signal');
    return parsed.data;
  }

  private parseLimit(limit?: string): number {
    const parsed = limitSchema.safeParse(limit);
    if (!parsed.success) throw new BadRequestException('Invalid ranking limit');
    return parsed.data;
  }

  private parsePeriod(period?: string): 'WEEKLY' | 'ALL_TIME' {
    const parsed = periodSchema.safeParse(period);
    if (!parsed.success)
      throw new BadRequestException('Invalid ranking period');
    return parsed.data;
  }
}
