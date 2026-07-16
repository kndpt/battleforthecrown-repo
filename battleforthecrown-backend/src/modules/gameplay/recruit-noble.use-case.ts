import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import PgBoss from 'pg-boss';
import {
  ExpeditionKind,
  ExpeditionStatus,
  PendingConquestStatus,
  Prisma,
  type UnitTraining,
} from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldService } from '../world/world.service';
import { WorldAccessService } from '../world/world-access.service';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { VillageStrategyService } from '../strategy/village-strategy.service';
import { applyPopulationBonus } from '../population/population-capacity';
import { CrownsService } from '../crowns/crowns.service';
import { withSerializableRetry } from '../../common/serializable-retry.utils';
import {
  canRecruitNoble,
  UnitMapSchema,
  UNIT_CATALOG,
  UNIT_TYPES,
  type CanRecruitNobleReason,
} from '@battleforthecrown/shared/army';
import { calculateTrainingTime } from '@battleforthecrown/shared/logic';
import { MS_PER_SECOND } from '@battleforthecrown/shared/time';
import { TempoService } from '@battleforthecrown/shared/world';
import { hasSufficientResources } from '@battleforthecrown/shared/resources';

/** Reason → message HTTP renvoyé quand le cap « 1 Seigneur » bloque. */
const NOBLE_GATE_MESSAGES: Record<CanRecruitNobleReason, string> = {
  GARRISON_FULL: 'A noble is already in garrison',
  QUEUE_FULL: 'A noble is already in training',
  IN_FLIGHT: 'A noble is already on campaign',
  OCCUPYING: 'A noble is already occupying a conquered village',
};

/** Compte les Seigneurs dans une colonne JSON `units`/`survivingUnits`. */
const nobleQuantityInJson = (raw: Prisma.JsonValue | null): number => {
  if (raw == null) return 0;
  const parsed = UnitMapSchema.safeParse(raw);
  return parsed.success ? (parsed.data[UNIT_TYPES.NOBLE] ?? 0) : 0;
};

@Injectable()
export class RecruitNobleUseCase {
  private readonly logger = new Logger(RecruitNobleUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly worldService: WorldService,
    private readonly worldAccess: WorldAccessService,
    private readonly outbox: OutboxPublisher,
    private readonly villageStrategy: VillageStrategyService,
    private readonly crowns: CrownsService,
    @Inject('PG_BOSS') private readonly boss: PgBoss,
  ) {}

  async execute(villageId: string, userId: string): Promise<UnitTraining> {
    await this.ownership.assertVillageOwnedBy(villageId, userId);

    const worldId = await this.worldService.getWorldIdFromVillage(villageId);
    const config = await this.worldService.getWorldConfig(worldId);
    const unitCost = UNIT_CATALOG.costs[UNIT_TYPES.NOBLE];
    const requiredThroneHallLevel = unitCost.requiredThroneHallLevel ?? 1;
    const requiredCrowns = unitCost.crowns ?? 0;

    // Serializable + retry: the noble cap now reads cross-entity conquest state
    // (outgoing expeditions, open capture windows) that is mutated by the combat
    // subsystem — which itself runs Serializable (combat.service launch,
    // combat.worker capture-open, return.worker credit). READ COMMITTED here
    // would let the gate observe a torn hand-off (e.g. expedition already
    // resolved but PendingConquest not yet visible) and recruit a 2nd noble.
    // Serializable makes the whole gate a single snapshot; SSI aborts (40001)
    // any interleaving that would break the "1 noble per village" invariant and
    // withSerializableRetry replays it (run 097).
    return withSerializableRetry(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            // Read-only world guard inside the tx so a concurrent LOCKED → ENDED
            // transition can't commit a recruit after the world ended (run 061).
            await this.worldAccess.assertWorldWritable(worldId, tx);
            // Serialize concurrent noble recruits on the Throne Hall: the dropped
            // @@unique([villageId, building]) used to block a 2nd THRONE_HALL row
            // at the DB; this advisory lock (released at tx end) keeps
            // same-village recruits cheap (no serialization retry) so at most one
            // noble training exists (run 062).
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`training:${villageId}:THRONE_HALL`}))`;

            const [
              village,
              throneHall,
              stock,
              population,
              nobleInventory,
              activeNobleTraining,
              crownBalance,
              outgoingNobleExpeditions,
              occupyingNobleCount,
            ] = await Promise.all([
              tx.village.findUnique({ where: { id: villageId } }),
              tx.building.findFirst({
                where: { villageId, type: 'THRONE_HALL' },
              }),
              tx.resourceStock.findUnique({ where: { villageId } }),
              tx.population.findUnique({ where: { villageId } }),
              tx.unitInventory.findUnique({
                where: {
                  villageId_unitType: {
                    villageId,
                    unitType: UNIT_TYPES.NOBLE,
                  },
                },
              }),
              tx.unitTraining.findFirst({
                where: {
                  villageId,
                  unitType: UNIT_TYPES.NOBLE,
                  building: 'THRONE_HALL',
                },
              }),
              tx.crownBalance.findUnique({
                where: { userId_worldId: { userId, worldId } },
              }),
              // Seigneurs partis du village et non résolus : aller (EN_ROUTE)
              // ou retour d'une conquête ratée (RETURNING). Le NOBLE n'est plus
              // en garnison mais appartient toujours au village.
              tx.expedition.findMany({
                where: {
                  attackerVillageId: villageId,
                  kind: ExpeditionKind.ATTACK,
                  status: {
                    in: [ExpeditionStatus.EN_ROUTE, ExpeditionStatus.RETURNING],
                  },
                },
                select: { status: true, units: true, survivingUnits: true },
              }),
              // Seigneurs en occupation : fenêtre de capture ouverte lancée
              // depuis ce village. Le NOBLE est stationné sur la cible tant que
              // la conquête n'est pas résolue.
              tx.pendingConquest.count({
                where: {
                  attackerVillageId: villageId,
                  status: PendingConquestStatus.OPEN,
                },
              }),
            ]);

            if (!village) throw new NotFoundException('Village not found');
            if (!throneHall) {
              throw new BadRequestException('Throne Hall not found');
            }
            if (throneHall.level < requiredThroneHallLevel) {
              throw new BadRequestException(
                `Throne Hall level ${requiredThroneHallLevel} required`,
              );
            }
            if (!stock) throw new NotFoundException('Resource stock not found');
            if (!population) {
              throw new NotFoundException('Population not found');
            }
            if (!crownBalance) {
              throw new NotFoundException('Crown balance not found');
            }

            // A returning expedition carries its survivors in `survivingUnits`
            // (recalled ones keep the noble in `units`); the outbound leg uses
            // `units`. A dead noble drops out of `survivingUnits`, so re-recruit
            // reopens as soon as the loss is recorded.
            const nobleInFlightCount = outgoingNobleExpeditions.reduce(
              (total, expedition) => {
                const source =
                  expedition.status === ExpeditionStatus.RETURNING
                    ? (expedition.survivingUnits ?? expedition.units)
                    : expedition.units;
                return total + nobleQuantityInJson(source);
              },
              0,
            );

            const nobleGate = canRecruitNoble({
              garrisonNobleCount: nobleInventory?.quantity ?? 0,
              hasNobleInQueue: Boolean(activeNobleTraining),
              nobleInFlightCount,
              nobleOccupyingCount: occupyingNobleCount,
            });

            if (!nobleGate.allowed) {
              throw new BadRequestException(
                NOBLE_GATE_MESSAGES[nobleGate.reason!],
              );
            }

            if (!hasSufficientResources(stock, unitCost)) {
              throw new BadRequestException('Insufficient resources');
            }

            const populationStrategyBonus =
              await this.villageStrategy.getStrategyBonus(
                villageId,
                'population',
              );
            const availablePopulation =
              applyPopulationBonus(population.max, populationStrategyBonus) -
              population.used;
            if (availablePopulation < unitCost.population) {
              throw new BadRequestException('Insufficient population');
            }

            if (crownBalance.balance < requiredCrowns) {
              throw new BadRequestException('Insufficient crowns');
            }

            const strategyBonus = await this.villageStrategy.getStrategyBonus(
              villageId,
              'training',
            );
            const trainingSpeedBonus =
              typeof strategyBonus?.trainingSpeedBonus === 'number'
                ? strategyBonus.trainingSpeedBonus
                : 1;
            const timePerUnitMs = Math.max(
              MS_PER_SECOND,
              Math.round(
                TempoService.applyDuration(
                  calculateTrainingTime(unitCost.time, 1, trainingSpeedBonus),
                  config.tempo,
                  'lordTrainingSpeed',
                ),
              ),
            );
            const now = new Date();
            const nextUnitEta = new Date(now.getTime() + timePerUnitMs);

            await tx.resourceStock.update({
              where: { villageId },
              data: {
                wood: { decrement: unitCost.wood },
                stone: { decrement: unitCost.stone },
                iron: { decrement: unitCost.iron },
              },
            });

            await tx.population.update({
              where: { villageId },
              data: { used: { increment: unitCost.population } },
            });

            await tx.crownBalance.update({
              where: { userId_worldId: { userId, worldId } },
              data: {
                balance: { decrement: requiredCrowns },
                lastUpdateTs: now,
              },
            });

            const training = await tx.unitTraining.create({
              data: {
                villageId,
                building: 'THRONE_HALL',
                unitType: UNIT_TYPES.NOBLE,
                totalQty: 1,
                completedQty: 0,
                timePerUnitMs,
                nextUnitEta,
              },
            });

            // pg-boss runs on its own pool (not this tx). On a serialization
            // retry the aborted attempt's training row is rolled back, so any
            // job it enqueued references a non-existent trainingId and the
            // training worker no-ops — harmless.
            await this.boss.send(
              'training:tick',
              {
                trainingId: training.id,
                villageId,
                unitType: UNIT_TYPES.NOBLE,
              },
              {
                startAfter: nextUnitEta,
                singletonKey: `training:${training.id}`,
              },
            );

            await this.outbox.resourcesChanged(villageId, tx);
            await this.crowns.createCrownsChangedEvent(userId, worldId, tx);

            return training;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      this.logger,
      'recruit-noble',
    );
  }
}
