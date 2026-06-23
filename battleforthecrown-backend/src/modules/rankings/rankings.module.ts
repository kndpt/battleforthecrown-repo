import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { PowerModule } from '../power/power.module';
import { RankingsController } from './rankings.controller';
import { WorldRankingsController } from './world-rankings.controller';
import { RankingsService } from './rankings.service';
import { FinalRankingsService } from './final-rankings.service';

@Module({
  imports: [PrismaModule, PowerModule],
  controllers: [RankingsController, WorldRankingsController],
  providers: [RankingsService, FinalRankingsService],
  exports: [RankingsService],
})
export class RankingsModule {}
