import { Module } from '@nestjs/common';
import { CrownsController } from './crowns.controller';
import { CrownsService } from './crowns.service';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { WorldModule } from '../world/world.module';
import { WorldAccessModule } from '../world/world-access.module';

@Module({
  imports: [PrismaModule, WorldModule, WorldAccessModule],
  controllers: [CrownsController],
  providers: [CrownsService],
  exports: [CrownsService],
})
export class CrownsModule {}
