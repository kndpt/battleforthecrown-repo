import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import PgBoss from 'pg-boss';
import { createOutboxEvent } from '../event/event.utils';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { parseUnitMap, parseCombatLoot } from './codecs';
import { ExpeditionKind, type Expedition } from '@prisma/client';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { CARRY_PER_PORTER } from '@battleforthecrown/shared/logic';
import type { UnitMap } from '@battleforthecrown/shared/army';

interface ReturnJob {
  expeditionId: string;
}

type CaravanResources = { wood: number; stone: number; iron: number };

@Injectable()
export class ReturnWorker implements OnModuleInit {
  private readonly logger = new Logger(ReturnWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxPublisher,
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
    this.logger.debug(`Processing troops return: ${data.expeditionId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Get expedition
        const expedition = await tx.expedition.findUnique({
          where: { id: data.expeditionId },
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

        if (expedition.kind === ExpeditionKind.CARAVAN) {
          await this.handleCaravanReturn(tx, expedition);
          return;
        }

        if (
          !expedition.recalled &&
          (!expedition.survivingUnits || !expedition.loot)
        ) {
          this.logger.warn(
            `Expedition ${expedition.id} has no return snapshot, skipping return.`,
          );
          return;
        }

        // 2. Determine surviving units and loot
        let survivingUnits: UnitMap = {};
        let lootedResources = { wood: 0, stone: 0, iron: 0 };
        const reportId: string | null =
          expedition.kind === 'SCOUT'
            ? expedition.scoutReportId
            : expedition.reportId;

        if (expedition.recalled) {
          this.logger.debug(
            `Expedition ${data.expeditionId} was recalled, skipping report check`,
          );
          survivingUnits = parseUnitMap(expedition.units, 'expedition.units');
        } else {
          survivingUnits = parseUnitMap(
            expedition.survivingUnits,
            'expedition.survivingUnits',
          );
          const loot = parseCombatLoot(expedition.loot);
          lootedResources = loot.resources || lootedResources;
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
        if (
          lootedResources.wood > 0 ||
          lootedResources.stone > 0 ||
          lootedResources.iron > 0
        ) {
          await tx.resourceStock.update({
            where: { villageId: expedition.attackerVillageId },
            data: {
              wood: { increment: lootedResources.wood },
              stone: { increment: lootedResources.stone },
              iron: { increment: lootedResources.iron },
            },
          });

          await this.outbox.resourcesChanged(expedition.attackerVillageId, tx);
        }

        // 6. Delete expedition (cleanup)
        await tx.expedition.delete({
          where: { id: expedition.id },
        });

        // 7. Create event
        await createOutboxEvent(
          tx,
          expedition.recalled
            ? 'expedition.returned'
            : expedition.kind === 'SCOUT'
              ? 'scout.returned'
              : 'battle.returned',
          expedition.attackerVillageId,
          expedition.kind === 'SCOUT' && !expedition.recalled
            ? {
                expeditionId: expedition.id,
                reportId,
                villageId: expedition.attackerVillageId,
                survivingUnits,
              }
            : {
                expeditionId: expedition.id,
                reportId,
                villageId: expedition.attackerVillageId,
                survivingUnits,
                loot: { resources: lootedResources },
              },
        );

        this.logger.debug(
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

  private async handleCaravanReturn(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ) {
    const resources = this.parseCaravanResources(expedition);
    const porters = this.getPorters(resources);

    if (expedition.recalled && this.sumResources(resources) > 0) {
      await tx.resourceStock.update({
        where: { villageId: expedition.attackerVillageId },
        data: {
          wood: { increment: resources.wood },
          stone: { increment: resources.stone },
          iron: { increment: resources.iron },
        },
      });
      await this.outbox.resourcesChanged(expedition.attackerVillageId, tx);
    }

    if (porters > 0) {
      const population = await tx.population.findUnique({
        where: { villageId: expedition.attackerVillageId },
      });
      if (population) {
        await tx.population.update({
          where: { villageId: expedition.attackerVillageId },
          data: { used: Math.max(0, population.used - porters) },
        });
      }
    }

    await tx.expedition.delete({
      where: { id: expedition.id },
    });

    await createOutboxEvent(
      tx,
      'caravan.returned',
      expedition.attackerVillageId,
      {
        expeditionId: expedition.id,
        villageId: expedition.attackerVillageId,
        targetVillageId: expedition.targetRefId,
        resources: expedition.recalled
          ? resources
          : { wood: 0, stone: 0, iron: 0 },
        porters,
        recalled: expedition.recalled,
      },
    );

    this.logger.debug(
      `Caravan returned for expedition ${expedition.id}: recalled=${expedition.recalled}, porters=${porters}`,
    );
  }

  private parseCaravanResources(expedition: Expedition): CaravanResources {
    if (expedition.loot === null) return { wood: 0, stone: 0, iron: 0 };
    const resources = parseCombatLoot(expedition.loot).resources;
    return {
      wood: Math.max(0, Math.floor(resources?.wood ?? 0)),
      stone: Math.max(0, Math.floor(resources?.stone ?? 0)),
      iron: Math.max(0, Math.floor(resources?.iron ?? 0)),
    };
  }

  private getPorters(resources: CaravanResources): number {
    const total = this.sumResources(resources);
    return total > 0 ? Math.ceil(total / CARRY_PER_PORTER) : 0;
  }

  private sumResources(resources: CaravanResources): number {
    return resources.wood + resources.stone + resources.iron;
  }
}
