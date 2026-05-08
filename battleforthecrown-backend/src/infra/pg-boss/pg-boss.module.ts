import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PgBoss from 'pg-boss';

@Global()
@Module({
  providers: [
    {
      provide: 'PG_BOSS',
      useFactory: async (config: ConfigService) => {
        const logger = new Logger('PgBoss');
        const boss = new PgBoss({
          connectionString: config.get<string>('DATABASE_URL')!,
          // ⚠️ CRITICAL: These settings control delayed job processing
          maintenanceIntervalSeconds: 1, // Check delayed jobs every 1 second (default is 120)
          superviseIntervalSeconds: 1, // Supervise workers every 1 second
          monitorIntervalSeconds: 1, // Monitor queues every 1 second
        });

        logger.log('Starting pg-boss');
        await boss.start();
        logger.log('pg-boss started');

        boss.on('error', (error) => {
          logger.error('pg-boss error', error);
        });

        return boss;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['PG_BOSS'],
})
export class PgBossModule {}
