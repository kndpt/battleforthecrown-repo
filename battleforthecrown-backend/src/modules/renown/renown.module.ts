import { Module } from '@nestjs/common';
import { RenownController } from './renown.controller';
import { RenownService } from './renown.service';

@Module({
  controllers: [RenownController],
  providers: [RenownService],
  exports: [RenownService],
})
export class RenownModule {}
