import { Module } from '@nestjs/common';
import { EventModule } from '../event/event.module';
import { IntelService } from './intel.service';
import { IntelController } from './intel.controller';

@Module({
  imports: [EventModule],
  providers: [IntelService],
  controllers: [IntelController],
  exports: [IntelService],
})
export class IntelModule {}
