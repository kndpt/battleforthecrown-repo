import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldAccessService } from '../world/world-access.service';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { ResourcesService } from '../resources/resources.service';
import { withSerializableRetry } from '../../common/serializable-retry.utils';
import { getParisDailyKey } from '../retention/retention.utils';
import {
  RESOURCE_CONVERSION_DAILY_CAP,
  convertResourceAmount,
  resourceTypeToKey,
  type ConvertResourcesCommand,
  type ResourceType,
} from '@battleforthecrown/shared/resources';

export interface ConvertResourcesResult {
  villageId: string;
  sourceType: ResourceType;
  destinationType: ResourceType;
  spent: number;
  credited: number;
  dayKey: string;
}

/** Maps a source `ResourceType` to its daily-tracking column on the row. */
function convertedColumn(
  type: ResourceType,
): 'woodConverted' | 'stoneConverted' | 'ironConverted' {
  switch (type) {
    case 'WOOD':
      return 'woodConverted';
    case 'STONE':
      return 'stoneConverted';
    case 'IRON':
      return 'ironConverted';
  }
}

/**
 * Royal resource exchange — intra-village conversion of wood ↔ stone ↔ iron at
 * an unfavorable rate (see shared `convertResourceAmount`), capped per Paris day.
 *
 * Server-authoritative: the front is never the authority on availability. The
 * whole mutation runs under Serializable isolation with retry (same guarantee as
 * `initiate-extraction`), the destination capacity is verified BEFORE any debit
 * (a full destination is rejected 4xx — value is never burned), and the daily
 * cap is enforced with an idempotent row upsert + a conditional `updateMany`
 * (the extraction population-lock idiom) so parallel requests can neither
 * overspend the cap nor race the row creation.
 */
@Injectable()
export class ConvertResourcesUseCase {
  private readonly logger = new Logger(ConvertResourcesUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly worldAccess: WorldAccessService,
    private readonly resources: ResourcesService,
    private readonly outbox: OutboxPublisher,
  ) {}

  async execute(
    userId: string,
    command: ConvertResourcesCommand,
  ): Promise<ConvertResourcesResult> {
    const { villageId, sourceType, destinationType, amount } = command;

    if (sourceType === destinationType) {
      throw new BadRequestException(
        'sourceType and destinationType must differ',
      );
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive integer');
    }

    await this.ownership.assertVillageOwnedBy(villageId, userId);

    const credited = convertResourceAmount(amount);
    if (credited <= 0) {
      // Below the rate: flooring yields 0 destination → would burn source for
      // nothing. Reject before touching any stock.
      throw new BadRequestException(
        'Amount too small to convert at the current rate',
      );
    }

    // Persist production catch-up on a possibly stale stock BEFORE the tx, so the
    // debit and the destination-capacity check operate on real, clamped values
    // (same idiom as `getResources`). Kept outside the serializable tx: it opens
    // its own. GameplayModule → ResourcesModule is a safe (acyclic) direction;
    // the reverse (ResourcesModule → GameplayModule) would cycle via EventModule.
    await this.resources.updateProduction(villageId);

    const sourceKey = resourceTypeToKey(sourceType);
    const destKey = resourceTypeToKey(destinationType);
    const convertedCol = convertedColumn(sourceType);

    return withSerializableRetry(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            const village = await tx.village.findFirst({
              where: { id: villageId, userId },
              select: { worldId: true },
            });
            if (!village) {
              throw new NotFoundException('Village not found or not owned');
            }
            const worldId = village.worldId;
            await this.worldAccess.assertWorldWritable(worldId, tx);

            const stock = await tx.resourceStock.findUnique({
              where: { villageId },
            });
            if (!stock) {
              throw new NotFoundException('Resource stock not found');
            }

            // (a) Source must cover the spend.
            if (stock[sourceKey] < amount) {
              throw new BadRequestException(
                `Insufficient ${sourceType.toLowerCase()}: have ${stock[sourceKey]}, need ${amount}`,
              );
            }

            // (b) Destination capacity checked BEFORE debit — never clamp/burn
            // value after crediting a full destination.
            if (stock[destKey] + credited > stock.maxPerType) {
              throw new BadRequestException(
                `Destination storage full: crediting ${credited} ${destinationType.toLowerCase()} would exceed the ${stock.maxPerType} cap`,
              );
            }

            // (c) Daily cap on the SOURCE spent, per (village, dayKey). Ensure
            // the row exists idempotently (no P2002 on concurrent inserts), then
            // increment only if within the cap. count === 0 ⇒ cap reached.
            const dayKey = getParisDailyKey(new Date());
            await tx.$executeRaw`
              INSERT INTO resource_conversion_daily
                (id, village_id, day_key, updated_at)
              VALUES (${randomUUID()}, ${villageId}, ${dayKey}, now())
              ON CONFLICT (village_id, day_key) DO NOTHING
            `;
            const capUpdate = await tx.resourceConversionDaily.updateMany({
              where: {
                villageId,
                dayKey,
                [convertedCol]: { lte: RESOURCE_CONVERSION_DAILY_CAP - amount },
              },
              data: { [convertedCol]: { increment: amount } },
            });
            if (capUpdate.count === 0) {
              throw new BadRequestException(
                `Daily conversion cap reached for ${sourceType.toLowerCase()} (max ${RESOURCE_CONVERSION_DAILY_CAP}/day)`,
              );
            }

            // (d) Debit source / credit destination atomically.
            const stockUpdate: Prisma.ResourceStockUpdateInput = {
              [sourceKey]: { decrement: amount },
              [destKey]: { increment: credited },
            };
            await tx.resourceStock.update({
              where: { villageId },
              data: stockUpdate,
            });

            // (e) Outbox event in the same tx (owner-only routing via the
            // shared `resources.changed` contract).
            await this.outbox.resourcesChanged(villageId, tx);

            return {
              villageId,
              sourceType,
              destinationType,
              spent: amount,
              credited,
              dayKey,
            } satisfies ConvertResourcesResult;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      this.logger,
      'resource conversion transaction',
    );
  }
}
