import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { PowerModule } from '../power/power.module';
import { RankingsController } from './rankings.controller';
import { WorldRankingsController } from './world-rankings.controller';
import { RankingsService } from './rankings.service';

@Module({
  imports: [PrismaModule, PowerModule],
  controllers: [RankingsController, WorldRankingsController],
  providers: [RankingsService],
  exports: [RankingsService],
})
export class RankingsModule {}
