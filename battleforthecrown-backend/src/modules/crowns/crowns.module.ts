import { Module } from '@nestjs/common';
import { CrownsController } from './crowns.controller';
import { CrownsService } from './crowns.service';
import { PrismaModule } from '../../infra/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CrownsController],
  providers: [CrownsService],
  exports: [CrownsService],
})
export class CrownsModule {}
