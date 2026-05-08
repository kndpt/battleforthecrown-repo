import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { PowerController } from './power.controller';
import { PowerService } from './power.service';

@Module({
  imports: [PrismaModule],
  controllers: [PowerController],
  providers: [PowerService],
  exports: [PowerService],
})
export class PowerModule {}
