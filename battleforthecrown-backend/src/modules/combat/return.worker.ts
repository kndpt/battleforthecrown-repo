import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import PgBoss from 'pg-boss';
import { createOutboxEvent } from '../event/event.utils';
import { parseUnitMap, parseCombatLoot } from './codecs';
import type { UnitMap } from '@battleforthecrown/shared/army';

interface ReturnJob {
  expeditionId: string;
}

@Injectable()
export class ReturnWorker implements OnModuleInit {
  private readonly logger = new Logger(ReturnWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      await this.boss.createQueue('combat:return');
      await this.boss.work('combat:return', async (jobs) => {
        const job = Array.isArray(jobs) ? jobs[0] : jobs;
        return this.handleReturn(job.data as ReturnJob);
      });

      this.logger.log('Return worker initialized');
    } catch (error) {
      this.logger.error('Failed to initialize return worker:', error);
      throw error;
    }
  }

  private async handleReturn(data: ReturnJob) {
    this.logger.log(`Processing troops return: ${data.expeditionId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Get expedition
        const expedition = await tx.expedition.findUnique({
          where: { id: data.expeditionId },
          include: { report: true },
        });

        if (!expedition) {
          this.logger.warn(`Expedition ${data.expeditionId} not found`);
          return;
        }

        if (expedition.status !== 'RETURNING') {
          this.logger.warn(
            `Expedition ${data.expeditionId} not in RETURNING state (${expedition.status})`,
          );
          return;
        }

        // 2. Get combat report to determine surviving units and loot
        const report = expedition.report;
        if (!report) {
          throw new Error(
            `Combat report not found for expedition ${data.expeditionId}`,
          );
        }

        const lossesAttacker = parseUnitMap(
          report.lossesAttacker,
          'combatReport.lossesAttacker',
        );
        const loot = parseCombatLoot(report.loot);

        // 3. Calculate surviving units
        const originalUnits = parseUnitMap(
          expedition.units,
          'expedition.units',
        );
        const survivingUnits: UnitMap = {};

        for (const [unitType, originalQty] of Object.entries(originalUnits)) {
          const losses = lossesAttacker[unitType as keyof UnitMap] ?? 0;
          const survived = (originalQty ?? 0) - losses;
          if (survived > 0) {
            survivingUnits[unitType as keyof UnitMap] = survived;
          }
        }

        // 4. Return surviving units to inventory
        for (const [unitType, quantity] of Object.entries(survivingUnits)) {
          if (quantity === undefined) continue;
          await tx.unitInventory.upsert({
            where: {
              villageId_unitType: {
                villageId: expedition.attackerVillageId,
                unitType,
              },
            },
            create: {
              villageId: expedition.attackerVillageId,
              unitType,
              quantity,
            },
            update: {
              quantity: { increment: quantity },
            },
          });
        }

        // 5. Add looted resources to attacker's stock
        const lootedResources = loot.resources || {
          wood: 0,
          stone: 0,
          iron: 0,
        };

        await tx.resourceStock.update({
          where: { villageId: expedition.attackerVillageId },
          data: {
            wood: { increment: lootedResources.wood },
            stone: { increment: lootedResources.stone },
            iron: { increment: lootedResources.iron },
          },
        });

        // 6. Delete expedition (cleanup)
        await tx.expedition.delete({
          where: { id: expedition.id },
        });

        // 7. Create event
        await createOutboxEvent(
          tx,
          'battle.returned',
          expedition.attackerVillageId,
          {
            expeditionId: expedition.id,
            reportId: report.id,
            villageId: expedition.attackerVillageId,
            survivingUnits,
            loot: { resources: lootedResources },
          },
        );

        this.logger.log(
          `Troops returned for expedition ${data.expeditionId}: ` +
            `${JSON.stringify(survivingUnits)}, looted ${JSON.stringify(lootedResources)}`,
        );
      });
    } catch (error) {
      this.logger.error(
        `Failed to process return for ${data.expeditionId}:`,
        error,
      );
      throw error;
    }
  }
}
