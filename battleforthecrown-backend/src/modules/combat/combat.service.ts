import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from '../world/world-config.service';
import {
  type CaravanResources,
  addCaravanResources,
  caravanPortersFor,
  emptyCaravanResources,
  normalizeCaravanResources,
  parseCaravanResources,
  sumCaravanResources,
} from './caravan.utils';
import { withSerializableRetry } from '../../common/serializable-retry.utils';
import { VisionService } from '../world/vision.service';
import {
  calculateDistance,
  CARAVAN_SPEED,
  getCaravanResourceCapacity,
} from '@battleforthecrown/shared/logic';
import { getWarehouseStorageLimit } from '@battleforthecrown/shared/resources';
import { UNIT_TYPES } from '@battleforthecrown/shared/army';
import { isAttackAllowedByPowerRatio } from '@battleforthecrown/shared';
import type {
  OpenConquestDto,
  OpenExpeditionDto,
  TargetKind,
} from '@battleforthecrown/shared/combat';
import type { AttackCommandDto } from './dto/attack-command.schema';
import type { ReinforceCommandDto } from './dto/reinforce-command.schema';
import type { RecallCommandDto } from './dto/recall-command.schema';
import type { ScoutCommandDto } from './dto/scout-command.schema';
import type { CaravanCommandDto } from './dto/caravan-command.schema';
import {
  Expedition,
  ExpeditionKind,
  PendingConquestStatus,
  Prisma,
} from '@prisma/client';
import { encodeCombatLoot, encodeUnitMap, parseUnitMap } from './codecs';
import PgBoss from 'pg-boss';
import { createOutboxEvent } from '../event/event.utils';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { OwnershipService } from '../../common/auth';
import { PowerService } from '../power/power.service';
import { ResourcesService } from '../resources/resources.service';
import { WorldAccessService } from '../world/world-access.service';
import { NewbieShieldService } from '../world/newbie-shield.service';
import { FriendshipService } from '../friendship/friendship.service';

export interface GarrisonLineDto {
  villageId: string;
  hostVillageName: string | null;
  hostPlayerName: string | null;
  originVillageId: string;
  originVillageName: string | null;
  originPlayerName: string | null;
  direction: 'INCOMING' | 'OUTGOING';
  unitType: string;
  quantity: number;
}

type CaptureTierDto = OpenConquestDto['targetTier'];

@Injectable()
export class CombatService {
  private readonly logger = new Logger(CombatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
    private readonly visionService: VisionService,
    private readonly ownership: OwnershipService,
    private readonly powerService: PowerService,
    private readonly outbox: OutboxPublisher,
    private readonly resourcesService: ResourcesService,
    private readonly worldAccess: WorldAccessService,
    private readonly newbieShield: NewbieShieldService,
    private readonly friendship: FriendshipService,
    @Inject('PG_BOSS') private readonly boss: PgBoss,
  ) {}

  async initiateAttack(
    userId: string,
    dto: AttackCommandDto,
  ): Promise<Expedition> {
    this.logger.debug(`Attack initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify ownership and get village
      const village = await this.loadOwnedVillage(tx, dto.villageId, userId);

      const worldId = village.worldId;
      await this.worldAccess.assertWorldWritable(worldId, tx);

      // 2. Resolve target (validates kind/world/coords match the live row)
      const target = await this.resolveTargetVillage(tx, worldId, dto);

      // 3. Enforce fog of war: a target seen as a blip cannot be attacked.
      await this.assertTargetInVision(
        userId,
        worldId,
        { x: target.x, y: target.y },
        'attack',
      );

      // 3b. Newbie shield: block PvP attack against a protected defender.
      if (dto.targetKind === 'PLAYER_VILLAGE' && target.userId) {
        await this.newbieShield.assertCanAttackTarget(
          target.userId,
          worldId,
          tx,
        );
      }

      // 4. Snapshot kingdom power before the outbound army mutates inventory.
      const attackerKingdomPowerSnapshot =
        await this.powerService.getKingdomPowerValue(userId, worldId, tx);
      const defenderPowerSnapshot = await this.snapshotDefenderKingdomPowers(
        tx,
        worldId,
        target.id,
        target.userId,
      );

      // 4b. Anti-snowball power guard (spec 14 §2): a PvP attack (raid or
      // conquest) is forbidden when the defender's kingdom power is below 1/3 of
      // the attacker's. The "defender" is the village *owner* (spec §2), which is
      // also what the client pre-check uses (entity.ownerId) — keeping both sides
      // consistent. Reuses the snapshot value when the owner is already computed
      // (no extra DB read in the common case); only reads when absent, e.g. an
      // open capture window snapshots the conqueror, not the owner. Barbarian
      // villages are out of scope. Checked at launch only, never re-evaluated.
      if (dto.targetKind === 'PLAYER_VILLAGE' && target.userId) {
        const defenderOwnerPower =
          defenderPowerSnapshot.values[target.userId] ??
          (await this.powerService.getKingdomPowerValue(
            target.userId,
            worldId,
            tx,
          ));
        this.assertAttackAllowedByPower(
          attackerKingdomPowerSnapshot,
          defenderOwnerPower,
        );
      }

      // 5. Verify and deduct units
      await this.verifyAndDeductUnits(tx, dto.villageId, dto.units);

      // 6. Calculate timing + create the EN_ROUTE expedition row.
      const { expedition, arrivalAt, now } =
        await this.createOutboundExpedition(tx, {
          village,
          target,
          units: dto.units,
          kind: ExpeditionKind.ATTACK,
          targetKind: dto.targetKind,
          extraData: {
            attackerKingdomPowerSnapshot,
            defenderKingdomPowerSnapshot: defenderPowerSnapshot.primaryValue,
            defenderKingdomPowerSnapshots: defenderPowerSnapshot.values,
          },
        });

      // 7. Create event
      await createOutboxEvent(tx, 'battle.sent', dto.villageId, {
        expeditionId: expedition.id,
        villageId: dto.villageId,
        targetX: target.x,
        targetY: target.y,
        targetKind: dto.targetKind,
        arrivalAt: arrivalAt.toISOString(),
      });

      // 8. Break attacker's newbie shield if active (PvP only).
      if (dto.targetKind === 'PLAYER_VILLAGE') {
        await this.newbieShield.breakAttackerShieldIfActive(
          userId,
          worldId,
          tx,
          now,
        );
      }

      // 9. Schedule combat resolution worker
      await this.scheduleResolution(expedition.id, arrivalAt);

      this.logger.debug(
        `Attack expedition created: ${expedition.id}, arrives at ${arrivalAt.toISOString()}`,
      );

      return expedition;
    });
  }

  async initiateScout(
    userId: string,
    dto: ScoutCommandDto,
  ): Promise<Expedition> {
    this.logger.debug(`Scout initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      const village = await this.loadOwnedVillage(tx, dto.villageId, userId);

      this.assertScoutUnitsOnly(dto.units);

      const worldId = village.worldId;
      await this.worldAccess.assertWorldWritable(worldId, tx);
      const target = await this.resolveTargetVillage(tx, worldId, dto);

      await this.assertTargetInVision(
        userId,
        worldId,
        { x: target.x, y: target.y },
        'scout',
      );

      await this.verifyAndDeductUnits(tx, dto.villageId, dto.units);

      const { expedition, arrivalAt } = await this.createOutboundExpedition(
        tx,
        {
          village,
          target,
          units: dto.units,
          kind: ExpeditionKind.SCOUT,
          targetKind: dto.targetKind,
        },
      );

      await createOutboxEvent(tx, 'scout.sent', dto.villageId, {
        expeditionId: expedition.id,
        villageId: dto.villageId,
        targetX: target.x,
        targetY: target.y,
        targetKind: dto.targetKind,
        arrivalAt: arrivalAt.toISOString(),
      });

      await this.scheduleResolution(expedition.id, arrivalAt);

      this.logger.debug(
        `Scout expedition created: ${expedition.id}, arrives at ${arrivalAt.toISOString()}`,
      );

      return expedition;
    });
  }

  async initiateReinforce(
    userId: string,
    dto: ReinforceCommandDto,
  ): Promise<Expedition> {
    this.logger.debug(`Reinforcement initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify ownership of origin village
      const village = await this.loadOwnedVillage(
        tx,
        dto.villageId,
        userId,
        'Origin village not found or not owned',
      );

      const worldId = village.worldId;
      await this.worldAccess.assertWorldWritable(worldId, tx);

      // 2. Verify target village exists
      const targetVillage = await tx.village.findUnique({
        where: { id: dto.targetVillageId },
      });

      if (!targetVillage || targetVillage.worldId !== worldId) {
        throw new BadRequestException('Target village not found');
      }

      // 3. Target must be owned by the caller OR by an ACTIVE defensive friend
      // on this world (cf. docs/gameplay/20-defensive-friends.md). Pop stays
      // consumed by the origin village regardless of the host's owner.
      if (targetVillage.userId !== userId) {
        const isFriendVillage =
          targetVillage.userId != null &&
          (await this.friendship.areActiveFriends(
            worldId,
            userId,
            targetVillage.userId,
            tx,
          ));
        if (!isFriendVillage) {
          throw new ForbiddenException(
            'You can only reinforce your own villages or those of your defensive friends',
          );
        }
      }

      // 3b. A village under an OPEN capture window is closed to reinforcements:
      // the occupation garrison cannot be propped up by allies — defensive
      // friends do NOT unlock this (aligned with 14-pvp-conquest § Acteurs
      // autorisés à attaquer pendant la fenêtre).
      const openConquest = await tx.pendingConquest.findFirst({
        where: {
          targetVillageId: targetVillage.id,
          status: PendingConquestStatus.OPEN,
        },
        select: { id: true },
      });
      if (openConquest) {
        throw new ForbiddenException(
          'This village is under an open capture window and cannot be reinforced',
        );
      }

      // 4. Verify and deduct units
      await this.verifyAndDeductUnits(tx, dto.villageId, dto.units);

      // 5. Calculate timing + create the EN_ROUTE expedition row.
      const { expedition, arrivalAt } = await this.createOutboundExpedition(
        tx,
        {
          village,
          target: targetVillage,
          units: dto.units,
          kind: ExpeditionKind.REINFORCE,
          targetKind: 'PLAYER_VILLAGE',
          extraData: { reinforcementOriginVillageId: dto.villageId },
        },
      );

      // 6. Create event
      await createOutboxEvent(tx, 'reinforcement.sent', dto.villageId, {
        expeditionId: expedition.id,
        villageId: dto.villageId,
        targetVillageId: targetVillage.id,
        arrivalAt: arrivalAt.toISOString(),
      });

      // 7. Schedule worker (combat:resolve handles REINFORCE)
      await this.scheduleResolution(expedition.id, arrivalAt);

      this.logger.debug(
        `Reinforcement expedition created: ${expedition.id}, arrives at ${arrivalAt.toISOString()}`,
      );

      return expedition;
    });
  }

  async initiateCaravan(
    userId: string,
    dto: CaravanCommandDto,
  ): Promise<Expedition> {
    this.logger.debug(`Caravan initiated by user ${userId}`, { dto });

    const expedition = await withSerializableRetry(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            // Pessimistic lock on the origin stock row: concurrent caravan sends
            // from the same village serialize here in FIFO order instead of
            // racing under SSI (which can abort *both* txns symmetrically and
            // livelock the serializable retry). One holder runs the capacity
            // check at a time → deterministic 201 then 400.
            await this.lockOriginResourceStock(tx, dto.villageId);

            const village = await this.loadOwnedVillage(
              tx,
              dto.villageId,
              userId,
              'Origin village not found or not owned',
            );
            const worldId = village.worldId;
            await this.worldAccess.assertWorldWritable(worldId, tx);

            if (dto.targetVillageId === dto.villageId) {
              throw new BadRequestException('Target village must be different');
            }

            const targetVillage = await tx.village.findUnique({
              where: { id: dto.targetVillageId },
            });
            if (!targetVillage || targetVillage.worldId !== worldId) {
              throw new BadRequestException('Target village not found');
            }
            if (targetVillage.userId !== userId) {
              throw new ForbiddenException(
                'You can only send caravans to your own villages',
              );
            }

            const resources = normalizeCaravanResources(dto.resources);
            const totalVolume = sumCaravanResources(resources);
            if (totalVolume <= 0) {
              throw new BadRequestException('Caravan must carry resources');
            }

            const porters = caravanPortersFor(resources);
            const [
              originStock,
              population,
              originBuildings,
              originStrategyConfig,
            ] = await Promise.all([
              tx.resourceStock.findUnique({
                where: { villageId: dto.villageId },
              }),
              tx.population.findUnique({ where: { villageId: dto.villageId } }),
              tx.building.findMany({
                where: { villageId: dto.villageId },
                select: { type: true, level: true },
              }),
              tx.villageStrategyConfig.findUnique({
                where: { villageId: dto.villageId },
                select: { strategy: true },
              }),
            ]);
            if (!originStock) {
              throw new BadRequestException('Origin resource stock not found');
            }
            if (!population) {
              throw new BadRequestException('Origin population not found');
            }

            const currentOriginStock =
              await this.resourcesService.calculateCurrentResources({
                worldId,
                resourceStock: originStock,
                buildings: originBuildings,
                strategy: originStrategyConfig?.strategy,
              });
            if (
              currentOriginStock.wood < resources.wood ||
              currentOriginStock.stone < resources.stone ||
              currentOriginStock.iron < resources.iron
            ) {
              throw new BadRequestException(
                'Insufficient resources for caravan',
              );
            }

            const freePopulation = population.max - population.used;
            if (freePopulation < porters) {
              throw new BadRequestException(
                `Insufficient free population: have ${freePopulation}, need ${porters}`,
              );
            }
            const originWarehouse = originBuildings.find(
              (building) => building.type === 'WAREHOUSE',
            );
            const caravanCapacity = getCaravanResourceCapacity(
              getWarehouseStorageLimit(originWarehouse?.level ?? 1),
            );

            const distance = calculateDistance(
              village.x,
              village.y,
              targetVillage.x,
              targetVillage.y,
            );
            const travelTimeMs = await this.worldConfig.getTravelTimeForSpeed(
              worldId,
              distance,
              CARAVAN_SPEED,
            );
            const now = new Date();
            const arrivalAt = new Date(now.getTime() + travelTimeMs);

            await tx.resourceStock.update({
              where: { villageId: dto.villageId },
              data: {
                wood: currentOriginStock.wood - resources.wood,
                stone: currentOriginStock.stone - resources.stone,
                iron: currentOriginStock.iron - resources.iron,
                lastUpdateTs: now,
              },
            });

            const activeCaravanResources =
              await this.sumActiveOutgoingCaravanResources(tx, dto.villageId);
            const reservedWithRequest = addCaravanResources(
              activeCaravanResources,
              resources,
            );
            if (
              reservedWithRequest.wood > caravanCapacity.wood ||
              reservedWithRequest.stone > caravanCapacity.stone ||
              reservedWithRequest.iron > caravanCapacity.iron
            ) {
              throw new BadRequestException('Caravan capacity exceeded');
            }

            const populationLockResult = await tx.population.updateMany({
              where: {
                villageId: dto.villageId,
                used: { lte: population.max - porters },
              },
              data: { used: { increment: porters } },
            });
            if (populationLockResult.count === 0) {
              throw new BadRequestException(
                `Insufficient free population: have ${freePopulation}, need ${porters}`,
              );
            }

            const expedition = await tx.expedition.create({
              data: {
                worldId,
                attackerVillageId: dto.villageId,
                kind: ExpeditionKind.CARAVAN,
                targetKind: 'PLAYER_VILLAGE',
                targetRefId: targetVillage.id,
                targetX: targetVillage.x,
                targetY: targetVillage.y,
                units: encodeUnitMap({}),
                status: 'EN_ROUTE',
                departAt: now,
                arrivalAt,
                outboundTravelMs: travelTimeMs,
                loot: encodeCombatLoot({ resources }),
              },
            });

            await createOutboxEvent(tx, 'caravan.sent', dto.villageId, {
              expeditionId: expedition.id,
              villageId: dto.villageId,
              targetVillageId: targetVillage.id,
              targetX: targetVillage.x,
              targetY: targetVillage.y,
              resources,
              porters,
              arrivalAt: arrivalAt.toISOString(),
            });
            await this.outbox.resourcesChanged(dto.villageId, tx);

            await this.scheduleResolution(expedition.id, arrivalAt);

            this.logger.debug(
              `Caravan expedition created: ${expedition.id}, arrives at ${arrivalAt.toISOString()}`,
            );

            return expedition;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      this.logger,
      'caravan transaction',
    );

    return expedition;
  }

  async initiateRecall(
    userId: string,
    dto: RecallCommandDto,
  ): Promise<Expedition> {
    this.logger.debug(`Recall initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify both villages and allow either recall-from-origin or send-back-from-host.
      const [originVillage, currentVillage] = await Promise.all([
        tx.village.findUnique({
          where: { id: dto.originVillageId },
        }),
        tx.village.findUnique({
          where: { id: dto.villageId },
        }),
      ]);

      if (!originVillage) {
        throw new BadRequestException('Origin village not found');
      }

      const worldId = originVillage.worldId;

      if (!currentVillage || currentVillage.worldId !== worldId) {
        throw new BadRequestException('Current village not found');
      }

      if (originVillage.userId !== userId && currentVillage.userId !== userId) {
        throw new ForbiddenException(
          'Cannot recall reinforcement from villages not owned by user',
        );
      }

      // 3. Verify units in Garrison
      const garrisons = await tx.garrison.findMany({
        where: {
          villageId: dto.villageId,
          originVillageId: dto.originVillageId,
        },
      });

      const availableUnits = Object.fromEntries(
        garrisons.map((g) => [g.unitType, g.quantity]),
      );

      for (const [unitType, quantity] of Object.entries(dto.units)) {
        if (quantity === undefined || quantity <= 0) continue;
        if ((availableUnits[unitType] || 0) < quantity) {
          throw new BadRequestException(
            `Insufficient ${unitType} in garrison: have ${availableUnits[unitType] || 0}, need ${quantity}`,
          );
        }
      }

      // 4. Deduct units from Garrison
      for (const [unitType, quantity] of Object.entries(dto.units)) {
        if (quantity === undefined || quantity <= 0) continue;
        await tx.garrison.update({
          where: {
            villageId_originVillageId_unitType: {
              villageId: dto.villageId,
              originVillageId: dto.originVillageId,
              unitType,
            },
          },
          data: {
            quantity: { decrement: quantity },
          },
        });
      }

      // 5. Calculate timing
      // Re-calculate timing with origin village strategy
      const {
        travelTimeMs,
        arrivalAt: arrivalAtOrigin,
        now,
      } = await this.calculateExpeditionTiming(
        tx,
        worldId,
        currentVillage.x,
        currentVillage.y,
        originVillage.x,
        originVillage.y,
        dto.units,
        dto.originVillageId, // Strategy of origin follows the troupe
      );

      // 6. Create expedition
      const expedition = await tx.expedition.create({
        data: {
          worldId,
          attackerVillageId: dto.villageId, // From B
          kind: ExpeditionKind.REINFORCE,
          reinforcementOriginVillageId: dto.originVillageId, // To A (Home)
          targetKind: 'PLAYER_VILLAGE',
          targetRefId: originVillage.id,
          targetX: originVillage.x,
          targetY: originVillage.y,
          units: encodeUnitMap(dto.units),
          status: 'EN_ROUTE',
          departAt: now,
          arrivalAt: arrivalAtOrigin,
          outboundTravelMs: travelTimeMs,
          reinforcementRecallActorUserId: userId,
        },
      });

      // 7. Create event
      await createOutboxEvent(tx, 'reinforcement.recalled', dto.villageId, {
        expeditionId: expedition.id,
        villageId: dto.villageId,
        originVillageId: dto.originVillageId,
        arrivalAt: arrivalAtOrigin.toISOString(),
      });

      // 8. Schedule worker
      await this.scheduleResolution(expedition.id, arrivalAtOrigin);

      this.logger.debug(
        `Recall expedition created: ${expedition.id}, arrives at ${arrivalAtOrigin.toISOString()}`,
      );

      return expedition;
    });
  }

  async recallEnRoute(
    userId: string,
    expeditionId: string,
  ): Promise<Expedition> {
    this.logger.debug(
      `Recall en-route requested for expedition ${expeditionId} by user ${userId}`,
    );

    const result = await withSerializableRetry(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            // 1. Get expedition
            const expedition = await tx.expedition.findUnique({
              where: { id: expeditionId },
            });

            if (!expedition) {
              throw new NotFoundException('Expedition not found');
            }

            // Serialize against concurrent caravan sends from the same origin
            // (both mutate this stock row); see lockOriginResourceStock.
            await this.lockOriginResourceStock(
              tx,
              expedition.attackerVillageId,
            );

            // 2. Verify ownership (attacker village must be owned by user)
            const village = await tx.village.findFirst({
              where: { id: expedition.attackerVillageId, userId },
            });

            if (!village) {
              throw new ForbiddenException(
                'You do not own the origin village of this expedition',
              );
            }

            // 3. Verify status
            if (expedition.status !== 'EN_ROUTE') {
              throw new BadRequestException(
                `Expedition cannot be recalled (status: ${expedition.status})`,
              );
            }

            // 4. Verify timing (cannot recall if already arrived, even if worker hasn't run yet)
            const now = new Date();
            if (now >= expedition.arrivalAt) {
              throw new BadRequestException(
                'Expedition has already arrived at target',
              );
            }

            // 5. Calculate return time (time elapsed since departure)
            const elapsedMs = now.getTime() - expedition.departAt.getTime();
            const returnAt = new Date(now.getTime() + elapsedMs);

            // 6. Claim the EN_ROUTE row before applying any recall side effects.
            const claimed = await tx.expedition.updateMany({
              where: {
                id: expeditionId,
                status: 'EN_ROUTE',
                arrivalAt: { gt: now },
              },
              data: {
                status: 'RETURNING',
                recalled: true,
                returnAt,
              },
            });
            if (claimed.count === 0) {
              throw new BadRequestException('Expedition cannot be recalled');
            }
            const updated = await tx.expedition.findUniqueOrThrow({
              where: { id: expeditionId },
            });

            // 7. Attempt to cancel combat resolution job
            // Fallback: the job will still trigger but handleCombatResolution
            // will skip it because the status is no longer EN_ROUTE.
            // PgBoss.cancel requires a jobId, which we don't store.
            // We rely on the status guard in the worker.

            // 8. Create event
            if (expedition.kind === ExpeditionKind.CARAVAN) {
              const resources = parseCaravanResources(expedition);
              const porters = caravanPortersFor(resources);
              await createOutboxEvent(
                tx,
                'caravan.recalled',
                expedition.attackerVillageId,
                {
                  expeditionId: expedition.id,
                  villageId: expedition.attackerVillageId,
                  targetVillageId: expedition.targetRefId,
                  resources,
                  porters,
                  returnAt: returnAt.toISOString(),
                },
              );
            } else {
              await createOutboxEvent(
                tx,
                'expedition.recalled',
                expedition.attackerVillageId,
                {
                  expeditionId: expedition.id,
                  villageId: expedition.attackerVillageId,
                  returnAt: returnAt.toISOString(),
                },
              );
            }

            this.logger.debug(
              `Expedition ${expeditionId} recalled, returns at ${returnAt.toISOString()}`,
            );

            return updated;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      this.logger,
      'recall transaction',
    );

    // 9. Schedule return job (OUTSIDE transaction to avoid race condition with worker)
    if (result.returnAt) {
      await this.boss.send(
        'combat:return',
        { expeditionId: expeditionId },
        {
          startAfter: result.returnAt,
          singletonKey: `return:${expeditionId}`,
        },
      );
    }

    return result;
  }

  private async verifyAndDeductUnits(
    tx: PrismaClientOrTx,
    villageId: string,
    units: Record<string, number>,
  ) {
    const unitInventories = await tx.unitInventory.findMany({
      where: { villageId },
    });

    const availableUnits = Object.fromEntries(
      unitInventories.map((inv) => [inv.unitType, inv.quantity]),
    );

    for (const [unitType, qty] of Object.entries(units)) {
      const quantity = qty;
      if (quantity === undefined || quantity <= 0) continue;
      if ((availableUnits[unitType] || 0) < quantity) {
        throw new BadRequestException(
          `Insufficient ${unitType}: have ${availableUnits[unitType] || 0}, need ${quantity}`,
        );
      }
    }

    for (const [unitType, qty] of Object.entries(units)) {
      const quantity = qty;
      if (quantity === undefined || quantity <= 0) continue;
      await tx.unitInventory.update({
        where: {
          villageId_unitType: {
            villageId,
            unitType,
          },
        },
        data: {
          quantity: { decrement: quantity },
        },
      });
    }
  }

  private assertScoutUnitsOnly(units: Record<string, number>) {
    if ((units[UNIT_TYPES.SPY] ?? 0) <= 0) {
      throw new BadRequestException('Scout missions require at least one SPY');
    }

    const hasNonSpy = Object.entries(units).some(
      ([unitType, quantity]) =>
        unitType !== UNIT_TYPES.SPY && quantity !== undefined && quantity > 0,
    );
    if (hasNonSpy) {
      throw new BadRequestException(
        'Scout missions must contain SPY units only',
      );
    }
  }

  private async resolveTargetVillage(
    tx: PrismaClientOrTx,
    worldId: string,
    dto: Pick<
      ScoutCommandDto | AttackCommandDto,
      'targetKind' | 'targetRefId' | 'targetX' | 'targetY'
    >,
  ) {
    const targetVillage = await tx.village.findUnique({
      where: { id: dto.targetRefId },
    });

    if (dto.targetKind === 'BARBARIAN_VILLAGE') {
      if (!targetVillage || !targetVillage.isBarbarian) {
        throw new BadRequestException('Barbarian village not found');
      }
    } else if (
      !targetVillage ||
      targetVillage.worldId !== worldId ||
      targetVillage.isBarbarian
    ) {
      throw new BadRequestException('Target village not found');
    }

    if (targetVillage.worldId !== worldId) {
      throw new BadRequestException('Target village not found');
    }

    if (targetVillage.x !== dto.targetX || targetVillage.y !== dto.targetY) {
      throw new BadRequestException('Target coordinates do not match target');
    }

    return targetVillage;
  }

  private async calculateExpeditionTiming(
    tx: PrismaClientOrTx,
    worldId: string,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    units: Record<string, number>,
    originVillageId: string,
  ) {
    const distance = calculateDistance(startX, startY, targetX, targetY);

    const travelTimeMs = await this.worldConfig.getTravelTimeForArmy(
      worldId,
      distance,
      units,
      (
        await tx.villageStrategyConfig.findUnique({
          where: { villageId: originVillageId },
        })
      )?.strategy,
    );

    const now = new Date();
    const arrivalAt = new Date(now.getTime() + travelTimeMs);

    return { travelTimeMs, arrivalAt, now };
  }

  /**
   * Compute outbound timing and insert the EN_ROUTE Expedition row shared by
   * `initiateAttack` / `initiateScout` / `initiateReinforce`. The base fields
   * (worldId, attacker, kind, target*, units, status, departAt, arrivalAt,
   * outboundTravelMs) are always set by the helper; `extraData` carries
   * variant-only columns (attack: kingdom power snapshots; reinforce:
   * reinforcementOriginVillageId).
   *
   * Does NOT emit the outbox event, schedule the resolution job, or run any
   * variant side-effect — callers stay responsible for those so the original
   * tx ordering (create → outbox → side-effect → schedule) is preserved.
   */
  private async createOutboundExpedition(
    tx: PrismaClientOrTx,
    params: {
      village: { id: string; worldId: string; x: number; y: number };
      target: { id: string; x: number; y: number };
      units: Record<string, number>;
      kind: ExpeditionKind;
      targetKind: TargetKind;
      extraData?: Partial<
        Omit<
          Prisma.ExpeditionUncheckedCreateInput,
          | 'worldId'
          | 'attackerVillageId'
          | 'kind'
          | 'targetKind'
          | 'targetRefId'
          | 'targetX'
          | 'targetY'
          | 'units'
          | 'status'
          | 'departAt'
          | 'arrivalAt'
          | 'outboundTravelMs'
        >
      >;
    },
  ): Promise<{
    expedition: Expedition;
    arrivalAt: Date;
    travelTimeMs: number;
    now: Date;
  }> {
    const { village, target, units, kind, targetKind, extraData } = params;

    const { travelTimeMs, arrivalAt, now } =
      await this.calculateExpeditionTiming(
        tx,
        village.worldId,
        village.x,
        village.y,
        target.x,
        target.y,
        units,
        village.id,
      );

    const expedition = await tx.expedition.create({
      data: {
        worldId: village.worldId,
        attackerVillageId: village.id,
        kind,
        targetKind,
        targetRefId: target.id,
        targetX: target.x,
        targetY: target.y,
        units: encodeUnitMap(units),
        status: 'EN_ROUTE',
        departAt: now,
        arrivalAt,
        outboundTravelMs: travelTimeMs,
        ...extraData,
      },
    });

    return { expedition, arrivalAt, travelTimeMs, now };
  }

  /** Load a village the caller must own, or throw. Shared by the expedition creators. */
  /**
   * Acquires a row-level exclusive lock on the origin village's resource stock.
   * Forces concurrent caravan sends from the same origin to serialize at this
   * point (FIFO) rather than racing under serializable snapshot isolation, which
   * can abort both transactions and exhaust the serializable retry budget.
   */
  private async lockOriginResourceStock(
    tx: PrismaClientOrTx,
    villageId: string,
  ): Promise<void> {
    await tx.$queryRaw`
      SELECT 1 FROM resource_stock WHERE village_id = ${villageId} FOR UPDATE
    `;
  }

  private async loadOwnedVillage(
    tx: PrismaClientOrTx,
    villageId: string,
    userId: string,
    notFoundMessage = 'Village not found or not owned',
  ) {
    const village = await tx.village.findFirst({
      where: { id: villageId, userId },
    });

    if (!village) {
      throw new NotFoundException(notFoundMessage);
    }

    return village;
  }

  /**
   * Anti-snowball guard (spec 14 §2). Throws `POWER_RATIO_FORBIDDEN` when the
   * defender's kingdom power is strictly below 1/3 of the attacker's. Only the
   * attacker is bounded (heroic asymmetry). A null defender power (no resolvable
   * owner) is treated as 0 so an attack on an empty target stays blocked unless
   * the attacker is also at 0.
   */
  private assertAttackAllowedByPower(
    attackerPower: number,
    defenderPower: number | null,
  ): void {
    const allowed = isAttackAllowedByPowerRatio({
      attackerPower,
      defenderPower: defenderPower ?? 0,
    });
    if (!allowed) {
      throw new ForbiddenException('POWER_RATIO_FORBIDDEN');
    }
  }

  private async snapshotDefenderKingdomPowers(
    tx: PrismaClientOrTx,
    worldId: string,
    targetVillageId: string,
    primaryDefenderUserId: string | null,
  ): Promise<{
    primaryUserId: string | null;
    primaryValue: number | null;
    values: Record<string, number>;
  }> {
    const userIds = new Set<string>();

    const [garrisons, pendingCapture] = await Promise.all([
      tx.garrison.findMany({
        where: { villageId: targetVillageId, quantity: { gt: 0 } },
        select: { originVillage: { select: { userId: true } } },
      }),
      tx.pendingConquest.findFirst({
        where: { targetVillageId, status: PendingConquestStatus.OPEN },
        select: { attackerUserId: true },
      }),
    ]);

    const primaryUserId =
      pendingCapture?.attackerUserId ?? primaryDefenderUserId;
    if (primaryUserId) userIds.add(primaryUserId);

    for (const garrison of garrisons) {
      if (garrison.originVillage.userId) {
        userIds.add(garrison.originVillage.userId);
      }
    }

    const snapshots: Record<string, number> = {};
    for (const defenderUserId of userIds) {
      snapshots[defenderUserId] = await this.powerService.getKingdomPowerValue(
        defenderUserId,
        worldId,
        tx,
      );
    }
    const primaryValue = primaryUserId
      ? (snapshots[primaryUserId] ?? null)
      : null;
    return { primaryUserId, primaryValue, values: snapshots };
  }

  /**
   * Enforce fog of war: a target seen only as a blip cannot be targeted.
   * No-op when the world has fog disabled.
   * Cf. ADR-11 + docs/gameplay/01-overview.md ("Blip non-cliquable").
   */
  private async assertTargetInVision(
    userId: string,
    worldId: string,
    point: { x: number; y: number },
    action: string,
  ) {
    const config = await this.worldConfig.getConfig(worldId);
    if (!config.fogOfWar?.enabled) return;

    const disks = await this.visionService.getVisionDisks(userId, worldId);
    if (!this.visionService.isInVision(point, disks)) {
      throw new ForbiddenException(
        `Target is outside your vision — extend your watchtower to ${action}.`,
      );
    }
  }

  /** Schedule the combat resolution worker for a freshly created EN_ROUTE expedition. */
  private async scheduleResolution(expeditionId: string, startAfter: Date) {
    await this.boss.send(
      'combat:resolve',
      { expeditionId },
      {
        startAfter,
        singletonKey: `combat:${expeditionId}`,
      },
    );
  }

  async getActiveExpeditions(userId: string, villageId: string) {
    // Verify ownership
    const village = await this.prisma.village.findFirst({
      where: { id: villageId, userId },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    return this.prisma.expedition.findMany({
      where: {
        attackerVillageId: villageId,
        status: { in: ['EN_ROUTE', 'RETURNING'] },
      },
      orderBy: { departAt: 'desc' },
    });
  }

  async getOpenConquests(
    userId: string,
    worldId?: string,
  ): Promise<OpenConquestDto[]> {
    const conquests = await this.prisma.pendingConquest.findMany({
      where: {
        attackerUserId: userId,
        status: PendingConquestStatus.OPEN,
        ...(worldId ? { worldId } : {}),
      },
      include: {
        attackerVillage: { select: { id: true, name: true } },
        targetVillage: {
          select: {
            buildings: {
              select: { level: true, type: true },
              where: { type: 'CASTLE' },
            },
            id: true,
            isBarbarian: true,
            name: true,
            tier: true,
            x: true,
            y: true,
          },
        },
      },
      orderBy: { captureUntil: 'asc' },
    });

    return conquests.map((conquest) => ({
      pendingConquestId: conquest.id,
      attackerVillageId: conquest.attackerVillageId,
      attackerVillageName: conquest.attackerVillage.name,
      targetVillageId: conquest.targetVillageId,
      targetName: conquest.targetVillage.name,
      targetX: conquest.targetVillage.x,
      targetY: conquest.targetVillage.y,
      targetKind: conquest.targetVillage.isBarbarian
        ? 'BARBARIAN_VILLAGE'
        : 'PLAYER_VILLAGE',
      targetCastleLevel: conquest.targetVillage.isBarbarian
        ? null
        : (conquest.targetVillage.buildings[0]?.level ?? 1),
      targetTier: this.toCaptureTier(conquest.targetVillage.tier),
      captureStartedAt: conquest.openedAt.toISOString(),
      captureUntil: conquest.captureUntil.toISOString(),
      status: 'OPEN',
    }));
  }

  async getOpenExpeditions(
    userId: string,
    worldId?: string,
  ): Promise<OpenExpeditionDto[]> {
    const attackerVillages = await this.prisma.village.findMany({
      where: {
        userId,
        ...(worldId ? { worldId } : {}),
      },
      select: { id: true, name: true },
    });
    const attackerVillageById = new Map(
      attackerVillages.map((village) => [village.id, village]),
    );
    const attackerVillageIds = attackerVillages.map((village) => village.id);
    if (!attackerVillageIds.length) return [];

    const expeditions = await this.prisma.expedition.findMany({
      where: {
        attackerVillageId: { in: attackerVillageIds },
        status: { in: ['EN_ROUTE', 'RETURNING'] },
        ...(worldId ? { worldId } : {}),
      },
    });
    const targetIds = [
      ...new Set(expeditions.map((expedition) => expedition.targetRefId)),
    ];
    const targets = targetIds.length
      ? await this.prisma.village.findMany({
          where: { id: { in: targetIds } },
          select: { id: true, name: true },
        })
      : [];
    const targetById = new Map(targets.map((target) => [target.id, target]));

    return expeditions
      .map((expedition) => {
        const attackerVillage = attackerVillageById.get(
          expedition.attackerVillageId,
        );
        const target = targetById.get(expedition.targetRefId);
        const units = parseUnitMap(expedition.units, 'expedition.units');

        return {
          expeditionId: expedition.id,
          kind: expedition.kind,
          isConquest: (units.NOBLE ?? 0) > 0,
          attackerVillageId: expedition.attackerVillageId,
          attackerVillageName: attackerVillage?.name ?? '',
          targetVillageId: target?.id ?? null,
          targetName: target?.name ?? null,
          targetX: expedition.targetX,
          targetY: expedition.targetY,
          targetKind: expedition.targetKind,
          departAt: expedition.departAt.toISOString(),
          arrivalAt: expedition.arrivalAt.toISOString(),
          returnAt: expedition.returnAt?.toISOString() ?? null,
          status: expedition.status,
          recalled: expedition.recalled,
          resources:
            expedition.kind === ExpeditionKind.CARAVAN && expedition.loot
              ? parseCaravanResources(expedition)
              : undefined,
        };
      })
      .sort((left, right) => {
        const leftDue =
          left.status === 'RETURNING' && left.returnAt
            ? left.returnAt
            : left.arrivalAt;
        const rightDue =
          right.status === 'RETURNING' && right.returnAt
            ? right.returnAt
            : right.arrivalAt;

        return leftDue.localeCompare(rightDue);
      });
  }

  async getGarrison(
    userId: string,
    villageId: string,
  ): Promise<GarrisonLineDto[]> {
    const village = await this.prisma.village.findFirst({
      where: { id: villageId, userId },
      select: { id: true },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const garrisons = await this.prisma.garrison.findMany({
      where: {
        quantity: { gt: 0 },
        OR: [
          { villageId },
          { originVillageId: villageId, villageId: { not: villageId } },
        ],
      },
      select: {
        villageId: true,
        originVillageId: true,
        unitType: true,
        quantity: true,
      },
      orderBy: [
        { villageId: 'asc' },
        { originVillageId: 'asc' },
        { unitType: 'asc' },
      ],
    });

    const villageIds = [
      ...new Set(
        garrisons.flatMap((garrison) => [
          garrison.villageId,
          garrison.originVillageId,
        ]),
      ),
    ];
    const villages = villageIds.length
      ? await this.prisma.village.findMany({
          where: { id: { in: villageIds } },
          select: {
            id: true,
            name: true,
            user: { select: { displayName: true } },
          },
        })
      : [];
    const villageNames = new Map(
      villages.map((village) => [village.id, village.name]),
    );
    const playerNames = new Map(
      villages.map((village) => [
        village.id,
        village.user?.displayName ?? null,
      ]),
    );

    return garrisons.map((garrison) => ({
      villageId: garrison.villageId,
      hostVillageName: villageNames.get(garrison.villageId) ?? null,
      hostPlayerName: playerNames.get(garrison.villageId) ?? null,
      originVillageId: garrison.originVillageId,
      originVillageName: villageNames.get(garrison.originVillageId) ?? null,
      originPlayerName: playerNames.get(garrison.originVillageId) ?? null,
      direction: garrison.villageId === villageId ? 'INCOMING' : 'OUTGOING',
      unitType: garrison.unitType,
      quantity: garrison.quantity,
    }));
  }

  private toCaptureTier(tier: string | null): CaptureTierDto {
    if (
      tier === 'T1' ||
      tier === 'T2' ||
      tier === 'T3' ||
      tier === 'T4' ||
      tier === 'T5'
    ) {
      return tier;
    }

    return null;
  }

  private async sumActiveOutgoingCaravanResources(
    tx: PrismaClientOrTx,
    villageId: string,
  ): Promise<CaravanResources> {
    const caravans = await tx.expedition.findMany({
      where: {
        attackerVillageId: villageId,
        kind: ExpeditionKind.CARAVAN,
        status: 'EN_ROUTE',
      },
      select: { loot: true },
    });

    return caravans.reduce(
      (total, caravan) =>
        addCaravanResources(total, parseCaravanResources(caravan)),
      emptyCaravanResources(),
    );
  }
}
