import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { createOutboxEvent } from './event.utils';

/**
 * Single domicile for writing into the EventOutbox.
 *
 * Writers (use cases, workers) inject this service instead of opening
 * `tx.eventOutbox.create()` inline. The Outbox pattern requires the event
 * to live in the same Prisma transaction as the mutation that produced it,
 * so each method takes an optional `tx` (Prisma transaction client). When
 * called outside a transaction, the publisher falls back to PrismaService.
 */
@Injectable()
export class OutboxPublisher {
  private readonly logger = new Logger(OutboxPublisher.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resourcesService: ResourcesService,
  ) {}

  async resourcesChanged(
    villageId: string,
    tx?: PrismaClientOrTx,
  ): Promise<void> {
    const client: PrismaClientOrTx = tx ?? this.prisma;

    const stock = await client.resourceStock.findUnique({
      where: { villageId },
    });

    if (!stock) {
      this.logger.warn(
        `[OutboxPublisher] resources.changed skipped: no stock for village ${villageId}`,
      );
      return;
    }

    const productionRates =
      await this.resourcesService.getProductionRates(villageId);

    await createOutboxEvent(client, 'resources.changed', villageId, {
      villageId,
      wood: stock.wood,
      stone: stock.stone,
      iron: stock.iron,
      maxPerType: stock.maxPerType,
      lastUpdateTs: stock.lastUpdateTs.toISOString(),
      productionRates,
    });
  }

  async buildingCompleted(
    payload: {
      buildingId: string;
      villageId: string;
      buildingType: string;
      level: number;
    },
    tx?: PrismaClientOrTx,
  ): Promise<void> {
    const client: PrismaClientOrTx = tx ?? this.prisma;
    await createOutboxEvent(
      client,
      'building.completed',
      payload.buildingId,
      payload,
    );
  }

  async unitTrainingCompleted(
    payload: {
      trainingId: string;
      villageId: string;
      unitType: string;
      completedQty: number;
      totalQty: number;
    },
    tx?: PrismaClientOrTx,
  ): Promise<void> {
    const client: PrismaClientOrTx = tx ?? this.prisma;
    await createOutboxEvent(
      client,
      'unit.training.completed',
      payload.villageId,
      payload,
    );
  }
}
