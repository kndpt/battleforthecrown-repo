import { Module } from '@nestjs/common';
import { ResourcesModule } from '../resources/resources.module';
import { RetentionController } from './retention.controller';
import { RetentionService } from './retention.service';
import { OyezProducerService } from './oyez-producer.service';

@Module({
  imports: [ResourcesModule],
  controllers: [RetentionController],
  providers: [RetentionService, OyezProducerService],
  exports: [RetentionService, OyezProducerService],
})
export class RetentionModule {}
