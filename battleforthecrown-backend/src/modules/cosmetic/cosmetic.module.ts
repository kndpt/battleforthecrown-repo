import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { CosmeticAwardController } from './cosmetic-award.controller';
import { CosmeticAwardService } from './cosmetic-award.service';

@Module({
  imports: [PrismaModule],
  controllers: [CosmeticAwardController],
  providers: [CosmeticAwardService],
  exports: [CosmeticAwardService],
})
export class CosmeticModule {}
