import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GameGateway } from './game.gateway';
import { EventOutboxService } from './event-outbox.service';
import { OutboxPublisher } from './outbox-publisher.service';
import { ResourcesModule } from '../resources/resources.module';
import { RetentionModule } from '../retention/retention.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    ResourcesModule,
    RetentionModule,
  ],
  providers: [GameGateway, EventOutboxService, OutboxPublisher],
  exports: [GameGateway, EventOutboxService, OutboxPublisher],
})
export class EventModule {}
