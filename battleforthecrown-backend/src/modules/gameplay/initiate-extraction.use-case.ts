import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import PgBoss from 'pg-boss';
import type { Expedition } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldAccessService } from '../world/world-access.service';
import { VisionService } from '../world/vision.service';
import { WorldConfigService } from '../world/world-config.service';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { createOutboxEvent } from '../event/event.utils';
import { withSerializableRetry } from '../../common/serializable-retry.utils';
import { Prisma } from '@prisma/client';
import type { ExtractionCommand } from '@battleforthecrown/shared/extraction';
import {
  EXTRACTION_ESCORT_UNIT_CAP,
  EXTRACTION_MIN_VILLAGERS,
  EXTRACTION_MAX_VILLAGERS,
} from '@battleforthecrown/shared/extraction';
import {
  calculateDistance,
  CARAVAN_SPEED,
} from '@battleforthecrown/shared/logic';

@Injectable()
export class InitiateExtractionUseCase {
  private readonly logger = new Logger(InitiateExtractionUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly worldAccess: WorldAccessService,
    private readonly visionService: VisionService,
    private readonly worldConfig: WorldConfigService,
    private readonly outbox: OutboxPublisher,
    @Inject('PG_BOSS') private readonly boss: PgBoss,
  ) {}

  async execute(
    userId: string,
    command: ExtractionCommand,
  ): Promise<Expedition> {
    await this.ownership.assertVillageOwnedBy(command.villageId, userId);

    if (
      command.villagers < EXTRACTION_MIN_VILLAGERS ||
      command.villagers > EXTRACTION_MAX_VILLAGERS
    ) {
      throw new BadRequestException(
        `Villagers must be between ${EXTRACTION_MIN_VILLAGERS} and ${EXTRACTION_MAX_VILLAGERS}`,
      );
    }
    const escortUnits = command.escortUnits ?? {};
    const escortTotal = Object.values(escortUnits).reduce(
      (sum, qty) => sum + (qty ?? 0),
      0,
    );
    if (escortTotal > EXTRACTION_ESCORT_UNIT_CAP) {
      throw new BadRequestException(
        `Escort exceeds the cap: have ${escortTotal}, max ${EXTRACTION_ESCORT_UNIT_CAP}`,
      );
    }

    const expedition = await withSerializableRetry(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            const village = await tx.village.findFirst({
              where: { id: command.villageId, userId },
            });
            if (!village) {
              throw new NotFoundException('Village not found or not owned');
            }
            const worldId = village.worldId;
            await this.worldAccess.assertWorldWritable(worldId, tx);

            // (a) Site exists, same world, ACTIVE.
            const site = await tx.resourceExtractionSite.findUnique({
              where: { id: command.siteId },
            });
            if (!site || site.worldId !== worldId) {
              throw new NotFoundException('Extraction site not found');
            }
            if (site.state !== 'ACTIVE') {
              throw new BadRequestException('Extraction site is not active');
            }

            // (b) Site must be within the caller's vision (never targetable blind).
            const disks = await this.visionService.getVisionDisks(
              userId,
              worldId,
            );
            if (
              !this.visionService.isInVision({ x: site.x, y: site.y }, disks)
            ) {
              throw new ForbiddenException(
                'Site is outside your vision — extend your watchtower to send a team.',
              );
            }

            // (c) Site must be free: no active EXTRACTION expedition on it.
            const siteBusy = await tx.expedition.findFirst({
              where: {
                extractionSiteId: site.id,
                kind: 'EXTRACTION',
                status: { in: ['EN_ROUTE', 'EXPLOITING'] },
              },
              select: { id: true },
            });
            if (siteBusy) {
              throw new BadRequestException(
                'Extraction site is already occupied',
              );
            }

            // (d) One active extraction max per player across this world's villages.
            const userVillages = await tx.village.findMany({
              where: { worldId, userId },
              select: { id: true },
            });
            const userVillageIds = userVillages.map((v) => v.id);
            const existingExtraction = await tx.expedition.findFirst({
              where: {
                kind: 'EXTRACTION',
                status: { in: ['EN_ROUTE', 'EXPLOITING', 'RETURNING'] },
                attackerVillageId: { in: userVillageIds },
              },
              select: { id: true },
            });
            if (existingExtraction) {
              throw new BadRequestException(
                'You already have an active extraction team',
              );
            }

            // (e) Population lock, copied from the caravan mechanism.
            const population = await tx.population.findUnique({
              where: { villageId: command.villageId },
            });
            if (!population) {
              throw new NotFoundException('Population not found');
            }
            const freePopulation = population.max - population.used;
            if (freePopulation < command.villagers) {
              throw new BadRequestException(
                `Insufficient free population: have ${freePopulation}, need ${command.villagers}`,
              );
            }
            const populationLockResult = await tx.population.updateMany({
              where: {
                villageId: command.villageId,
                used: { lte: population.max - command.villagers },
              },
              data: { used: { increment: command.villagers } },
            });
            if (populationLockResult.count === 0) {
              throw new BadRequestException(
                `Insufficient free population: have ${freePopulation}, need ${command.villagers}`,
              );
            }

            // (f) Optional escort: cap already asserted above; decrement
            // UnitInventory conditionally, same pattern as initiateCaravan's
            // unit deduction (verifyAndDeductUnits) — check-then-conditional
            // update, no pessimistic lock.
            if (escortTotal > 0) {
              const inventories = await tx.unitInventory.findMany({
                where: { villageId: command.villageId },
              });
              const available = Object.fromEntries(
                inventories.map((inv) => [inv.unitType, inv.quantity]),
              );
              for (const [unitType, qty] of Object.entries(escortUnits)) {
                const quantity = qty ?? 0;
                if (quantity <= 0) continue;
                if ((available[unitType] ?? 0) < quantity) {
                  throw new BadRequestException(
                    `Insufficient ${unitType}: have ${available[unitType] ?? 0}, need ${quantity}`,
                  );
                }
              }
              for (const [unitType, qty] of Object.entries(escortUnits)) {
                const quantity = qty ?? 0;
                if (quantity <= 0) continue;
                await tx.unitInventory.update({
                  where: {
                    villageId_unitType: {
                      villageId: command.villageId,
                      unitType,
                    },
                  },
                  data: { quantity: { decrement: quantity } },
                });
              }
            }

            // (g) Travel time village → site, same speed as the caravan (V1).
            const distance = calculateDistance(
              village.x,
              village.y,
              site.x,
              site.y,
            );
            const outboundTravelMs =
              await this.worldConfig.getTravelTimeForSpeed(
                worldId,
                distance,
                CARAVAN_SPEED,
              );
            const now = new Date();
            const arrivalAt = new Date(now.getTime() + outboundTravelMs);
            const extractionDurationMs = command.durationHours * 3_600_000;

            // (h) Create the outbound EXTRACTION expedition.
            const expedition = await tx.expedition.create({
              data: {
                worldId,
                attackerVillageId: command.villageId,
                kind: 'EXTRACTION',
                targetKind: 'EXTRACTION_SITE',
                targetRefId: site.id,
                targetX: site.x,
                targetY: site.y,
                units: escortUnits,
                status: 'EN_ROUTE',
                departAt: now,
                arrivalAt,
                outboundTravelMs,
                extractionSiteId: site.id,
                extractionDurationMs,
                extractionVillagers: command.villagers,
              },
            });

            // (i) Outbox event, same transaction.
            await createOutboxEvent(
              tx,
              'extraction.started',
              command.villageId,
              {
                expeditionId: expedition.id,
                worldId,
                villageId: command.villageId,
                siteId: site.id,
                resourceType: site.resourceType,
                arrivalAt: arrivalAt.toISOString(),
                durationMs: extractionDurationMs,
              },
            );
            await this.outbox.resourcesChanged(command.villageId, tx);

            return expedition;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      this.logger,
      'extraction transaction',
    );

    // (j) Schedule the arrival job — same queue/shape as the
    // caravan/combat resolution so the T4 worker can route by expedition
    // kind. Kept OUTSIDE the serializable transaction: a serialization retry
    // replaying this callback after an earlier attempt already enqueued the
    // job would otherwise leave an orphaned job pointing at a rolled-back
    // expedition.
    await this.boss.send(
      'combat:resolve',
      { expeditionId: expedition.id },
      {
        startAfter: expedition.arrivalAt,
        singletonKey: `combat:${expedition.id}`,
      },
    );

    this.logger.debug(
      `Extraction expedition created: ${expedition.id}, arrives at ${expedition.arrivalAt.toISOString()}`,
    );

    return expedition;
  }
}
