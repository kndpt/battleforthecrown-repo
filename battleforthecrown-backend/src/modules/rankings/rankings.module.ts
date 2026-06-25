import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { PowerModule } from '../power/power.module';
import { RankingsController } from './rankings.controller';
import { WorldRankingsController } from './world-rankings.controller';
import { RankingTitlesController } from './ranking-titles.controller';
import { RankingsService } from './rankings.service';
import { FinalRankingsService } from './final-rankings.service';
import { RankingsCycleService } from './rankings-cycle.service';

@Module({
  imports: [PrismaModule, PowerModule],
  controllers: [
    RankingsController,
    WorldRankingsController,
    RankingTitlesController,
  ],
  providers: [RankingsService, FinalRankingsService, RankingsCycleService],
  exports: [RankingsService, RankingsCycleService],
})
export class RankingsModule {}
