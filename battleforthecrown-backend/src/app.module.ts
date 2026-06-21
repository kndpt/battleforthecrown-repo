import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './infra/prisma/prisma.module';
import { PgBossModule } from './infra/pg-boss/pg-boss.module';
import { AuthContextModule, JwtAuthGuard } from './common/auth';
import { AuthModule } from './modules/auth/auth.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { VillageModule } from './modules/village/village.module';
import { ArmyModule } from './modules/army/army.module';
import { WorldModule } from './modules/world/world.module';
import { WorldAccessModule } from './modules/world/world-access.module';
import { PowerModule } from './modules/power/power.module';
import { PopulationModule } from './modules/population/population.module';
import { StrategyModule } from './modules/strategy/strategy.module';
import { GameplayModule } from './modules/gameplay/gameplay.module';
import { EventModule } from './modules/event/event.module';
import { CombatModule } from './modules/combat/combat.module';
import { CrownsModule } from './modules/crowns/crowns.module';
import { RetentionModule } from './modules/retention/retention.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { RankingsModule } from './modules/rankings/rankings.module';
import { IntelModule } from './modules/intel/intel.module';
import { WorkersModule } from './workers/workers.module';
import { HealthController } from './health.controller';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        serializers: {
          req: () => undefined,
          res: () => undefined,
          context: () => undefined,
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'HH:MM:ss',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        // Disable auto-logging to use our custom middleware
        autoLogging: false,
      },
    }),
    TerminusModule,
    PrismaModule,
    PgBossModule,
    AuthContextModule,
    WorkersModule,
    AuthModule,
    ResourcesModule,
    VillageModule,
    ArmyModule,
    WorldModule,
    WorldAccessModule,
    PowerModule,
    PopulationModule,
    StrategyModule,
    GameplayModule,
    EventModule,
    CombatModule,
    CrownsModule,
    RetentionModule,
    OnboardingModule,
    RankingsModule,
    IntelModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
