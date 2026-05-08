import { Module } from '@nestjs/common';
import { ArmyController } from './army.controller';
import { ArmyService } from './army.service';
import { GameplayModule } from '../gameplay/gameplay.module';

@Module({
  imports: [GameplayModule],
  controllers: [ArmyController],
  providers: [ArmyService],
  exports: [ArmyService],
})
export class ArmyModule {}
