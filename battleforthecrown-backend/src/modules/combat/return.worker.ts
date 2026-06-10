import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import PgBoss from 'pg-boss';
import { createOutboxEvent } from '../event/event.utils';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { parseUnitMap, parseCombatLoot } from './codecs';
import { ExpeditionKind, type Expedition } from '@prisma/client';
import { PrismaClientOrTx } from '../../common/prisma.types';
import type { UnitMap } from '@battleforthecrown/shared/army';
import { ResourcesService } from '../resources/resources.service';
import {
  type CaravanResources,
  caravanPortersFor,
  parseCaravanResources,
  sumCaravanResources,
} from './caravan.utils';

interface ReturnJob {
  expeditionId: string;
}

@Injectable()
export class ReturnWorker implements OnModuleInit {
  private readonly logger = new Logger(ReturnWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxPublisher,
    private readonly resourcesService: ResourcesService,
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
    const resources = parseCaravanResources(expedition);
    let returnedResources: CaravanResources = { wood: 0, stone: 0, iron: 0 };
    const porters = caravanPortersFor(resources);

    if (expedition.recalled && sumCaravanResources(resources) > 0) {
      const originVillage = await tx.village.findUnique({
        where: { id: expedition.attackerVillageId },
        include: {
          buildings: { select: { type: true, level: true } },
          resourceStock: true,
          strategyConfig: true,
        },
      });
      if (!originVillage?.resourceStock) {
        throw new Error(`Caravan origin stock not found for ${expedition.id}`);
      }

      const now = new Date();
      const currentStock =
        await this.resourcesService.calculateCurrentResources({
          worldId: originVillage.worldId,
          resourceStock: originVillage.resourceStock,
          buildings: originVillage.buildings,
          strategy: originVillage.strategyConfig?.strategy,
        });
      const maxPerType = originVillage.resourceStock.maxPerType;
      returnedResources = {
        wood: Math.min(
          resources.wood,
          Math.max(0, maxPerType - currentStock.wood),
        ),
        stone: Math.min(
          resources.stone,
          Math.max(0, maxPerType - currentStock.stone),
        ),
        iron: Math.min(
          resources.iron,
          Math.max(0, maxPerType - currentStock.iron),
        ),
      };
      await tx.resourceStock.update({
        where: { villageId: expedition.attackerVillageId },
        data: {
          wood: currentStock.wood + returnedResources.wood,
          stone: currentStock.stone + returnedResources.stone,
          iron: currentStock.iron + returnedResources.iron,
          lastUpdateTs: now,
        },
      });
      await this.outbox.resourcesChanged(expedition.attackerVillageId, tx);
    }

    if (porters > 0) {
      const populationRelease = await tx.population.updateMany({
        where: {
          villageId: expedition.attackerVillageId,
          used: { gte: porters },
        },
        data: { used: { decrement: porters } },
      });
      if (populationRelease.count === 0) {
        throw new Error(
          `Failed to release caravan population for ${expedition.id}`,
        );
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
        resources: returnedResources,
        porters,
        recalled: expedition.recalled,
      },
    );

    this.logger.debug(
      `Caravan returned for expedition ${expedition.id}: recalled=${expedition.recalled}, porters=${porters}`,
    );
  }
}
