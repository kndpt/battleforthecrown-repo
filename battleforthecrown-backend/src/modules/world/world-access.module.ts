import { Global, Module } from '@nestjs/common';
import { WorldAccessService } from './world-access.service';

@Global()
@Module({
  providers: [WorldAccessService],
  exports: [WorldAccessService],
})
export class WorldAccessModule {}
