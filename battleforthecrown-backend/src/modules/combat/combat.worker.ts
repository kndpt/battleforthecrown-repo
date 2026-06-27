import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import {
  Expedition,
  Prisma,
  ExpeditionKind,
  PendingConquestStatus,
  RankingSignal,
  Village,
} from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from '../world/world-config.service';
import { BarbarianRuntimeService } from '../world/barbarian-runtime.service';
import { ResourcesService } from '../resources/resources.service';
import { BarbarianVillageStrategy } from './strategies/barbarian-village.strategy';
import { PlayerVillageStrategy } from './strategies/player-village.strategy';
import { ConquestService } from './conquest.service';
import PgBoss from 'pg-boss';
import { registerJobQueueWorker } from '../../infra/pg-boss/queue-worker.helper';
import {
  CombatContext,
  CombatParticipant,
} from './interfaces/combat-context.interface';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { createOutboxEvent } from '../event/event.utils';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import {
  calculateCasualtyStats,
  isVictoryForAttacker,
  distributeLossesProportionally,
} from './combat.utils';
import { parseUnitMap, encodeUnitMap, encodeLootResult } from './codecs';
import {
  caravanPortersFor,
  parseCaravanResources,
  subtractCaravanResources,
} from './caravan.utils';
import { withSerializableRetry } from '../../common/serializable-retry.utils';
import {
  findBuildingByType,
  getStrategyBonusValue,
} from '@battleforthecrown/shared/village';
import { calculateDistance } from '@battleforthecrown/shared/logic';
import { getWarehouseStorageLimit } from '@battleforthecrown/shared/resources';
import {
  calculateRawBattleValue,
  splitPointsByWeights,
} from '@battleforthecrown/shared/rankings';
import type { WorldTempo } from '@battleforthecrown/shared/world';
import type { CombatResolution } from '@battleforthecrown/shared/combat';
import {
  UNIT_COSTS,
  UNIT_TYPES,
  type UnitMap,
  type UnitType,
} from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';
import { getCaptureDurationMs } from './capture-duration';
import { RankingsService } from '../rankings/rankings.service';
import { RenownService } from '../renown/renown.service';
import { IntelService } from '../intel/intel.service';
import { NewbieShieldService } from '../world/newbie-shield.service';
import { FriendshipService } from '../friendship/friendship.service';
import { mergeGarrisonsIntoParticipants } from './garrison-merge.utils';
import {
  dedupedRecipientUserIds,
  loadReportVillageSnapshot,
} from './combat-report.utils';

interface PendingConquestToSchedule {
  id: string;
  captureUntil: Date;
}

interface ReturnJobToSchedule {
  expeditionId: string;
  returnAt: Date;
}

interface CombatPostCommitWork {
  pendingConquest?: PendingConquestToSchedule | null;
  returnJob?: ReturnJobToSchedule | null;
}

/** Defender village hydrated with the data combat resolution needs to mutate. */
type DefenderVillage = Prisma.VillageGetPayload<{
  include: { resourceStock: true; buildings: true };
}>;

/** Capture owner currently defending the target garrison during an open window. */
interface OccupationDefense {
  attackerUserId: string;
  attackerVillageId: string;
  originalOwnerUserId: string | null;
}

const EMPTY_LOOT = { wood: 0, stone: 0, iron: 0 } as const;

function addUnitLosses(target: UnitMap, losses: UnitMap): void {
  for (const [unitType, quantity] of typedEntries(losses)) {
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    target[unitType] = (target[unitType] ?? 0) + quantity;
  }
}

/**
 * Total population freed by a set of unit losses. The pop of a dead unit is
 * released back to the village's pool — see `docs/gameplay/02-economy-and-progression.md` § Population.
 */
function sumPopulationCost(losses: UnitMap): number {
  let total = 0;
  for (const [unitType, lossCount] of Object.entries(losses)) {
    const popCost = UNIT_COSTS[unitType as UnitType]?.population;
    if (popCost && lossCount) total += popCost * lossCount;
  }
  return total;
}

function hasSurvivingUnits(totalUnits: UnitMap, losses: UnitMap): boolean {
  return typedEntries(totalUnits).some(
    ([unitType, quantity]) => quantity - (losses[unitType] ?? 0) > 0,
  );
}

interface CombatJob {
  expeditionId: string;
}

@Injectable()
export class CombatWorker implements OnModuleInit {
  private readonly logger = new Logger(CombatWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
    private readonly barbarianRuntime: BarbarianRuntimeService,
    private readonly resources: ResourcesService,
    private readonly barbarianStrategy: BarbarianVillageStrategy,
    private readonly playerStrategy: PlayerVillageStrategy,
    private readonly outbox: OutboxPublisher,
    private readonly conquest: ConquestService,
    private readonly rankings: RankingsService,
    private readonly renown: RenownService,
    private readonly intelService: IntelService,
    private readonly newbieShield: NewbieShieldService,
    private readonly friendship: FriendshipService,
  ) {}

  async onModuleInit() {
    await registerJobQueueWorker<CombatJob>(
      this.boss,
      this.logger,
      { queueName: 'combat:resolve', displayName: 'Combat' },
      (data) => this.handleCombatResolution(data),
    );
  }

  private async handleCombatResolution(data: CombatJob) {
    this.logger.debug(`Processing combat resolution: ${data.expeditionId}`);

    try {
      const postCommitWork = await withSerializableRetry(
        () =>
          this.prisma.$transaction(
            async (tx): Promise<CombatPostCommitWork | undefined> => {
              // 1. Get expedition with related data
              const expedition = await tx.expedition.findUnique({
                where: { id: data.expeditionId },
              });

              if (!expedition) {
                this.logger.warn(`Expedition ${data.expeditionId} not found`);
                return;
              }

              if (
                expedition.kind === ExpeditionKind.CARAVAN &&
                expedition.status === 'RETURNING'
              ) {
                if (!expedition.returnAt) {
                  this.logger.warn(
                    `Caravan expedition ${data.expeditionId} is RETURNING without returnAt`,
                  );
                  return;
                }
                return {
                  returnJob: {
                    expeditionId: expedition.id,
                    returnAt: expedition.returnAt,
                  },
                };
              }

              if (expedition.status !== 'EN_ROUTE') {
                const pendingConquest =
                  await this.findPendingConquestFinalizeJobToRecover(
                    tx,
                    expedition,
                  );
                if (pendingConquest) {
                  return { pendingConquest };
                }

                this.logger.warn(
                  `Expedition ${data.expeditionId} already resolved (${expedition.status})`,
                );
                return;
              }

              if (expedition.kind === ExpeditionKind.REINFORCE) {
                await this.handleReinforcementArrival(tx, expedition);
                return;
              }

              if (expedition.kind === ExpeditionKind.SCOUT) {
                await this.handleScoutArrival(tx, expedition);
                return;
              }

              if (expedition.kind === ExpeditionKind.CARAVAN) {
                const returnJob = await this.handleCaravanArrival(
                  tx,
                  expedition,
                );
                return { returnJob };
              }

              // 2. Build combat context
              const context = await this.buildCombatContext(tx, expedition);

              // 3. Select strategy based on target kind
              const strategy =
                expedition.targetKind === 'BARBARIAN_VILLAGE'
                  ? this.barbarianStrategy
                  : this.playerStrategy;

              if (!strategy) {
                throw new Error(
                  `No strategy found for target kind: ${expedition.targetKind}`,
                );
              }

              // 4. Resolve combat
              const resolution = await strategy.resolve(context);

              // 5. Apply loot + losses to the defender (barbarian or PvP village).
              const {
                defenderVillage,
                occupationDefense,
                reinforcementOriginVillageIds,
              } = await this.applyLootToDefender(
                tx,
                expedition,
                resolution,
                context,
              );

              // Release attacker population for dead units (always — PvP and barbarian raids).
              // Pop is freed at combat resolution, not at return — the units are dead now,
              // even if survivors are still on the road back. See docs/gameplay/02-economy-and-progression.md § Population.
              const popReleasedAttacker = sumPopulationCost(
                resolution.lossesAttacker,
              );
              if (popReleasedAttacker > 0) {
                await tx.population.update({
                  where: { villageId: expedition.attackerVillageId },
                  data: { used: { decrement: popReleasedAttacker } },
                });
              }

              // 6. Get attacker village for userId
              const attackerVillage = await tx.village.findUnique({
                where: { id: expedition.attackerVillageId },
              });

              if (!attackerVillage) {
                throw new Error('Attacker village not found');
              }

              // 7. Notify the defender (PvP owner, or occupation owner on a barbarian capture).
              await this.emitVillageAttackedEvent(tx, {
                expedition,
                resolution,
                context,
                defenderVillage,
                occupationDefense,
                attackerVillage,
                reinforcementOriginVillageIds,
              });

              // 8. Persist the combat report.
              const report = await this.writeCombatReport(tx, {
                expedition,
                resolution,
                context,
                defenderVillage,
                occupationDefense,
                attackerVillage,
              });

              // 9. Credit PvP glory ledgers before conquest side effects.
              await this.creditCombatGlory(tx, {
                expedition,
                resolution,
                context,
                defenderVillage,
                occupationDefense,
                attackerVillage,
                report,
              });

              // 10. Apply the conquest outcome (open capture window, or signal a dead noble).
              const originalUnits = parseUnitMap(
                expedition.units,
                'expedition.units',
              );
              const isVictory = isVictoryForAttacker(
                resolution.lossesAttacker,
                originalUnits,
              );
              const { pendingConquest, returningUnits, captureWindowOpened } =
                await this.handleConquestOutcome(tx, {
                  expedition,
                  resolution,
                  context,
                  defenderVillage,
                  attackerVillage,
                  report,
                  isVictory,
                });

              // 10b. Carnet d'intel : un combat offensif gagné révèle la cible côté attaquant.
              // Exclut combat perdu + occupation défensive (cf. run 055).
              if (isVictory && !occupationDefense && attackerVillage.userId) {
                await this.intelService.recordIntel(tx, {
                  userId: attackerVillage.userId,
                  worldId: expedition.worldId,
                  targetVillageId: expedition.targetRefId,
                  sourceKind: 'COMBAT_WIN',
                  sourceReportId: report.id,
                  units: context.defender.units ?? {},
                  // Observed stock, not the loot (which is capped by hauling
                  // capacity / lootFactor and would depend on the attacking army).
                  resources: context.defender.resources ?? EMPTY_LOOT,
                  wallLevel: null,
                  strategy: null,
                  targetName: defenderVillage?.name ?? null,
                  targetX: expedition.targetX,
                  targetY: expedition.targetY,
                  targetTier: defenderVillage?.tier ?? null,
                  seenAt: report.timestamp,
                });
              }

              // 11. Compute what returns home (units + loot withheld during a capture).
              const { returningLoot, expeditionLoot, returnAt } =
                this.computeReturn(
                  expedition,
                  resolution,
                  returningUnits,
                  captureWindowOpened,
                );

              // 12. Update expedition + emit battle.resolved + schedule the return.
              await this.finalizeExpedition(tx, {
                expedition,
                resolution,
                attackerVillage,
                defenderVillage,
                report,
                originalUnits,
                returningUnits,
                returningLoot,
                expeditionLoot,
                returnAt,
                isVictory,
              });

              this.logger.debug(
                `Combat resolved for expedition ${expedition.id}, victory=${isVictory}, returnAt=${returnAt?.toISOString() ?? 'none'}`,
              );
              return { pendingConquest };
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
          ),
        this.logger,
        'combat resolution',
      );

      if (postCommitWork?.pendingConquest) {
        await this.conquest.scheduleFinalizeJob(postCommitWork.pendingConquest);
      }

      if (postCommitWork?.returnJob) {
        await this.scheduleReturnJob(postCommitWork.returnJob);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process combat for ${data.expeditionId}:`,
        error,
      );
      throw error;
    }
  }

  private async findPendingConquestFinalizeJobToRecover(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ): Promise<PendingConquestToSchedule | null> {
    if (expedition.kind !== ExpeditionKind.ATTACK) return null;

    return tx.pendingConquest.findFirst({
      where: {
        attackerVillageId: expedition.attackerVillageId,
        targetVillageId: expedition.targetRefId,
        status: 'OPEN',
        finalizeJobId: null,
      },
      select: { id: true, captureUntil: true },
    });
  }

  private async scheduleReturnJob(job: ReturnJobToSchedule): Promise<void> {
    await this.boss.send(
      'combat:return',
      { expeditionId: job.expeditionId },
      {
        startAfter: job.returnAt,
        singletonKey: `return:${job.expeditionId}`,
      },
    );
  }

  /**
   * Step 5: deduct looted resources from the defender and apply unit losses.
   * Barbarian and PvP targets share the same ResourceStock model; the only
   * divergence is that a barbarian raid resets `lastUpdateTs` (production
   * catch-up baseline) and resolves the occupation owner for downstream events.
   */
  private async applyLootToDefender(
    tx: PrismaClientOrTx,
    expedition: Expedition,
    resolution: CombatResolution,
    context: CombatContext,
  ): Promise<{
    defenderVillage: DefenderVillage | null;
    occupationDefense: OccupationDefense | null;
    reinforcementOriginVillageIds: Set<string>;
  }> {
    const isBarbarian = expedition.targetKind === 'BARBARIAN_VILLAGE';
    const reinforcementOriginVillageIds = new Set<string>();

    const defenderVillage = await tx.village.findUnique({
      where: { id: expedition.targetRefId },
      include: { resourceStock: true, buildings: true },
    });

    const pendingCapture = await tx.pendingConquest.findFirst({
      where: { targetVillageId: expedition.targetRefId, status: 'OPEN' },
      select: { attackerUserId: true, attackerVillageId: true },
    });
    const occupationDefense = pendingCapture
      ? {
          ...pendingCapture,
          originalOwnerUserId:
            !isBarbarian && defenderVillage?.userId
              ? defenderVillage.userId
              : null,
        }
      : null;

    if (defenderVillage?.resourceStock) {
      const lootedResources = resolution.loot.resources ?? EMPTY_LOOT;
      await tx.resourceStock.update({
        where: { villageId: defenderVillage.id },
        data: {
          wood: { decrement: lootedResources.wood },
          stone: { decrement: lootedResources.stone },
          iron: { decrement: lootedResources.iron },
          // A barbarian raid rebases production catch-up; PvP leaves it untouched.
          ...(isBarbarian ? { lastUpdateTs: new Date() } : {}),
        },
      });
      await this.outbox.resourcesChanged(defenderVillage.id, tx);
    }

    if (defenderVillage) {
      const affectedOrigins = await this.applyDefenderLosses(
        tx,
        defenderVillage,
        context.defender.participants,
        context.defender.units || {},
        resolution.lossesDefender || {},
      );
      affectedOrigins.forEach((villageId) =>
        reinforcementOriginVillageIds.add(villageId),
      );
    }

    return {
      defenderVillage,
      occupationDefense,
      reinforcementOriginVillageIds,
    };
  }

  /**
   * Step 7: notify the defending player. PvP targets the village owner;
   * a barbarian capture targets the occupation owner. Skipped when the
   * defender resolves to the attacker (self-stationed reinforcements).
   */
  private async emitVillageAttackedEvent(
    tx: PrismaClientOrTx,
    args: {
      expedition: Expedition;
      resolution: CombatResolution;
      context: CombatContext;
      defenderVillage: DefenderVillage | null;
      occupationDefense: OccupationDefense | null;
      attackerVillage: Village;
      reinforcementOriginVillageIds: Set<string>;
    },
  ): Promise<void> {
    const {
      expedition,
      resolution,
      context,
      defenderVillage,
      occupationDefense,
      attackerVillage,
      reinforcementOriginVillageIds,
    } = args;

    const defenderUserId =
      occupationDefense?.attackerUserId ??
      (expedition.targetKind === 'PLAYER_VILLAGE'
        ? defenderVillage?.userId
        : null);
    const observerUserId = occupationDefense?.originalOwnerUserId;

    if (
      !defenderVillage ||
      !defenderUserId ||
      defenderUserId === attackerVillage.userId
    ) {
      return;
    }

    const lossesDefender = resolution.lossesDefender || {};
    const lootedResources = resolution.loot.resources ?? EMPTY_LOOT;
    const defenderStats = calculateCasualtyStats(
      context.defender.units || {},
      lossesDefender,
    );

    await createOutboxEvent(tx, 'village.attacked', defenderVillage.id, {
      defenderVillageId: defenderVillage.id,
      ...(occupationDefense || expedition.targetKind === 'BARBARIAN_VILLAGE'
        ? { defenderUserId }
        : {}),
      ...(observerUserId && observerUserId !== defenderUserId
        ? { observerUserId }
        : {}),
      attackerVillageId: expedition.attackerVillageId,
      attackerVillageName: attackerVillage.name,
      attackerX: attackerVillage.x,
      attackerY: attackerVillage.y,
      defenderVillageName: defenderVillage.name,
      isDefenseSuccessful: hasSurvivingUnits(
        context.defender.units || {},
        lossesDefender,
      ),
      losses: lossesDefender,
      reinforcementOriginVillageIds: [...reinforcementOriginVillageIds],
      casualtyRate: defenderStats.casualtyRate,
      resourcesLost: lootedResources,
      timestamp: new Date().toISOString(),
    });
  }

  /** Step 8: persist the combat report row. */
  private writeCombatReport(
    tx: PrismaClientOrTx,
    args: {
      expedition: Expedition;
      resolution: CombatResolution;
      context: CombatContext;
      defenderVillage: DefenderVillage | null;
      occupationDefense: OccupationDefense | null;
      attackerVillage: Village;
    },
  ) {
    const {
      expedition,
      resolution,
      context,
      defenderVillage,
      occupationDefense,
      attackerVillage,
    } = args;

    return tx.combatReport.create({
      data: {
        worldId: expedition.worldId,
        attackerVillageId: expedition.attackerVillageId,
        attackerVillageName: attackerVillage.name,
        attackerX: attackerVillage.x,
        attackerY: attackerVillage.y,
        attackerUserId: attackerVillage.userId!, // Guaranteed non-null for player attacks
        defenderVillageId:
          expedition.targetKind === 'PLAYER_VILLAGE' || occupationDefense
            ? expedition.targetRefId
            : null,
        defenderVillageName: defenderVillage?.name ?? null,
        defenderX: defenderVillage?.x ?? expedition.targetX,
        defenderY: defenderVillage?.y ?? expedition.targetY,
        defenderUserId:
          occupationDefense?.attackerUserId ??
          (expedition.targetKind === 'PLAYER_VILLAGE' && defenderVillage
            ? defenderVillage.userId
            : null),
        observerUserId:
          occupationDefense?.originalOwnerUserId &&
          occupationDefense.originalOwnerUserId !== attackerVillage.userId &&
          occupationDefense.originalOwnerUserId !==
            occupationDefense.attackerUserId
            ? occupationDefense.originalOwnerUserId
            : null,
        targetKind: expedition.targetKind,
        targetX: expedition.targetX,
        targetY: expedition.targetY,
        loot: encodeLootResult(resolution.loot),
        totalUnitsAttacker: encodeUnitMap(
          parseUnitMap(expedition.units, 'expedition.units'),
        ),
        totalUnitsDefender: encodeUnitMap(context.defender.units || {}),
        lossesAttacker: encodeUnitMap(resolution.lossesAttacker),
        lossesDefender: encodeUnitMap(resolution.lossesDefender || {}),
        details: {
          expeditionId: expedition.id,
          targetTier: defenderVillage?.tier ?? null,
          distance: context.config._distance,
          travelTime: context.config._travelTime,
          ...(occupationDefense
            ? {
                occupationDefense: {
                  attackerVillageId: occupationDefense.attackerVillageId,
                  defenderUserId: occupationDefense.attackerUserId,
                },
              }
            : {}),
        },
      },
    });
  }

  private async creditCombatGlory(
    tx: PrismaClientOrTx,
    args: {
      expedition: Expedition;
      resolution: CombatResolution;
      context: CombatContext;
      defenderVillage: DefenderVillage | null;
      occupationDefense: OccupationDefense | null;
      attackerVillage: Village;
      report: { id: string };
    },
  ): Promise<void> {
    const {
      expedition,
      resolution,
      context,
      defenderVillage,
      occupationDefense,
      attackerVillage,
      report,
    } = args;
    const attackerUserId = attackerVillage.userId;
    // Barbarian fights award no glory — unless a player garrison occupies the
    // village during a capture window: that fight is PvP against the occupier
    // (see docs/gameplay/24-rankings.md § Gloire du Rempart, capture window).
    // loadParticipantOwnerIds remaps the occupied barbarian village to the
    // occupier, so participant ownership already resolves to the player.
    const isUnoccupiedBarbarian =
      expedition.targetKind === 'BARBARIAN_VILLAGE' &&
      !occupationDefense?.attackerUserId;
    if (!attackerUserId || isUnoccupiedBarbarian) {
      return;
    }

    const participantOwnerByVillageId = await this.loadParticipantOwnerIds(
      tx,
      context.defender.participants,
      defenderVillage,
      occupationDefense,
    );
    const defenderPowerSnapshots = this.parsePowerSnapshots(
      expedition.defenderKingdomPowerSnapshots,
    );
    const defenderUnits = context.defender.units || {};
    const assaultLosses = resolution.lossesDefender || {};
    const assaultLossesByDefender = new Map<string, UnitMap>();

    for (const participant of context.defender.participants) {
      const defenderUserId = participantOwnerByVillageId.get(
        participant.villageId,
      );
      if (!defenderUserId || defenderUserId === attackerUserId) continue;

      const participantLosses = distributeLossesProportionally(
        assaultLosses,
        defenderUnits,
        participant.units,
      );
      const current = assaultLossesByDefender.get(defenderUserId) ?? {};
      addUnitLosses(current, participantLosses);
      assaultLossesByDefender.set(defenderUserId, current);
    }

    for (const [defenderUserId, participantLosses] of assaultLossesByDefender) {
      const assaultLedger = await this.rankings.creditGlory(tx, {
        worldId: expedition.worldId,
        signal: RankingSignal.ASSAULT_GLORY,
        scorerUserId: attackerUserId,
        opponentUserId: defenderUserId,
        combatReportId: report.id,
        losses: participantLosses,
        scorerPowerSnapshot: expedition.attackerKingdomPowerSnapshot,
        opponentPowerSnapshot: defenderPowerSnapshots[defenderUserId] ?? null,
      });
      if (assaultLedger) {
        await this.renown.creditCombat(tx, {
          userId: assaultLedger.scorerUserId,
          opponentUserId: assaultLedger.opponentUserId,
          gloryPoints: assaultLedger.points,
          combatReportId: assaultLedger.combatReportId,
          signal: assaultLedger.signal,
          worldId: assaultLedger.worldId,
        });
      }
    }

    const rampartRawPoints = calculateRawBattleValue(resolution.lossesAttacker);
    const rampartWeights = context.defender.participants.flatMap(
      (participant) => {
        const defenderUserId = participantOwnerByVillageId.get(
          participant.villageId,
        );
        if (!defenderUserId || defenderUserId === attackerUserId) return [];
        return [
          {
            id: defenderUserId,
            weight: calculateRawBattleValue(participant.units),
          },
        ];
      },
    );

    for (const split of splitPointsByWeights(
      rampartRawPoints,
      rampartWeights,
    )) {
      const rampartLedger = await this.rankings.creditGlory(tx, {
        worldId: expedition.worldId,
        signal: RankingSignal.RAMPART_GLORY,
        scorerUserId: split.id,
        opponentUserId: attackerUserId,
        combatReportId: report.id,
        rawPoints: split.points,
        scorerPowerSnapshot: defenderPowerSnapshots[split.id] ?? null,
        opponentPowerSnapshot: expedition.attackerKingdomPowerSnapshot,
      });
      if (rampartLedger) {
        await this.renown.creditCombat(tx, {
          userId: rampartLedger.scorerUserId,
          opponentUserId: rampartLedger.opponentUserId,
          gloryPoints: rampartLedger.points,
          combatReportId: rampartLedger.combatReportId,
          signal: rampartLedger.signal,
          worldId: rampartLedger.worldId,
        });
      }
    }
  }

  private async loadParticipantOwnerIds(
    tx: PrismaClientOrTx,
    participants: CombatParticipant[],
    defenderVillage: DefenderVillage | null,
    occupationDefense: OccupationDefense | null,
  ): Promise<Map<string, string>> {
    const participantVillageIds = [
      ...new Set(participants.map((participant) => participant.villageId)),
    ];
    const villages = participantVillageIds.length
      ? await tx.village.findMany({
          where: { id: { in: participantVillageIds } },
          select: { id: true, userId: true },
        })
      : [];
    const ownerByVillageId = new Map(
      villages.flatMap((village) =>
        village.userId ? [[village.id, village.userId] as const] : [],
      ),
    );

    if (
      defenderVillage &&
      occupationDefense?.attackerUserId &&
      (defenderVillage.isBarbarian || !defenderVillage.userId)
    ) {
      ownerByVillageId.set(
        defenderVillage.id,
        occupationDefense.attackerUserId,
      );
    }

    return ownerByVillageId;
  }

  private parsePowerSnapshots(raw: Prisma.JsonValue): Record<string, number> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

    return Object.fromEntries(
      Object.entries(raw).flatMap(([userId, value]) =>
        typeof value === 'number' && Number.isFinite(value)
          ? [[userId, value]]
          : [],
      ),
    );
  }

  /**
   * Step 10: when a victorious noble survives, open the capture window and
   * station the surviving escort in the target's garrison (removed from the
   * returning column). A dead noble emits `noble.killed` instead.
   */
  private async handleConquestOutcome(
    tx: PrismaClientOrTx,
    args: {
      expedition: Expedition;
      resolution: CombatResolution;
      context: CombatContext;
      defenderVillage: DefenderVillage | null;
      attackerVillage: Village;
      report: { id: string };
      isVictory: boolean;
    },
  ): Promise<{
    pendingConquest: PendingConquestToSchedule | null;
    returningUnits: UnitMap;
    captureWindowOpened: boolean;
  }> {
    const {
      expedition,
      resolution,
      context,
      defenderVillage,
      attackerVillage,
      report,
      isVictory,
    } = args;

    const originalUnits = parseUnitMap(expedition.units, 'expedition.units');
    const startedWithNoble = (originalUnits[UNIT_TYPES.NOBLE] ?? 0) > 0;
    const nobleSurvived =
      (resolution.survivingUnits[UNIT_TYPES.NOBLE] ?? 0) > 0;
    const returningUnits: UnitMap = { ...resolution.survivingUnits };

    if (!isVictory || !startedWithNoble || !defenderVillage) {
      return {
        pendingConquest: null,
        returningUnits,
        captureWindowOpened: false,
      };
    }

    if (!nobleSurvived) {
      await createOutboxEvent(tx, 'noble.killed', attackerVillage.id, {
        attackerVillageId: attackerVillage.id,
        attackerUserId: attackerVillage.userId!,
        combatId: report.id,
      });
      return {
        pendingConquest: null,
        returningUnits,
        captureWindowOpened: false,
      };
    }

    const captureUntil = new Date(
      Date.now() +
        this.getCaptureDurationMs(defenderVillage, context.config.tempo),
    );
    const pendingConquest = await this.conquest.openCaptureWindowInTx(tx, {
      attackerVillageId: expedition.attackerVillageId,
      targetVillageId: defenderVillage.id,
      attackerUserId: attackerVillage.userId!,
      captureUntil,
    });

    for (const [unitType, quantity] of typedEntries(
      resolution.survivingUnits,
    )) {
      if (!quantity || quantity <= 0) continue;

      await tx.garrison.upsert({
        where: {
          villageId_originVillageId_unitType: {
            villageId: defenderVillage.id,
            originVillageId: expedition.attackerVillageId,
            unitType,
          },
        },
        create: {
          villageId: defenderVillage.id,
          originVillageId: expedition.attackerVillageId,
          unitType,
          quantity,
        },
        update: {
          quantity: { increment: quantity },
        },
      });

      delete returningUnits[unitType];
    }

    return { pendingConquest, returningUnits, captureWindowOpened: true };
  }

  /**
   * Step 10: derive the returning loot/units. When a capture window opened the
   * loot stays in the new garrison, so nothing rides back. Reuses the outbound
   * duration so return speed cannot drift with config/style changes.
   */
  private computeReturn(
    expedition: Expedition,
    resolution: CombatResolution,
    returningUnits: UnitMap,
    captureWindowOpened: boolean,
  ): {
    returningLoot: { wood: number; stone: number; iron: number };
    expeditionLoot: CombatResolution['loot'];
    returnAt: Date | null;
  } {
    const resolvedLoot = resolution.loot.resources ?? EMPTY_LOOT;
    const returningLoot = captureWindowOpened
      ? { ...EMPTY_LOOT }
      : resolvedLoot;
    const expeditionLoot = captureWindowOpened
      ? {
          resources: returningLoot,
          metadata: {
            ...resolution.loot.metadata,
            totalCapacityUsed: 0,
            cappedByCapacity: false,
          },
        }
      : resolution.loot;

    const hasReturningUnits = typedEntries(returningUnits).some(
      ([, quantity]) => quantity > 0,
    );
    const hasReturningLoot =
      returningLoot.wood > 0 ||
      returningLoot.stone > 0 ||
      returningLoot.iron > 0;
    const returnAt =
      hasReturningUnits || hasReturningLoot
        ? new Date(Date.now() + expedition.outboundTravelMs)
        : null;

    return { returningLoot, expeditionLoot, returnAt };
  }

  /**
   * Step 11: persist the expedition outcome, emit `battle.resolved`, and
   * schedule the return worker when something is travelling home.
   */
  private async finalizeExpedition(
    tx: PrismaClientOrTx,
    args: {
      expedition: Expedition;
      resolution: CombatResolution;
      attackerVillage: Village;
      defenderVillage: DefenderVillage | null;
      report: { id: string };
      originalUnits: UnitMap;
      returningUnits: UnitMap;
      returningLoot: { wood: number; stone: number; iron: number };
      expeditionLoot: CombatResolution['loot'];
      returnAt: Date | null;
      isVictory: boolean;
    },
  ): Promise<void> {
    const {
      expedition,
      resolution,
      attackerVillage,
      defenderVillage,
      report,
      originalUnits,
      returningUnits,
      returningLoot,
      expeditionLoot,
      returnAt,
      isVictory,
    } = args;

    await tx.expedition.update({
      where: { id: expedition.id },
      data: {
        status: returnAt ? 'RETURNING' : 'RESOLVED',
        reportId: report.id,
        returnAt,
        survivingUnits: encodeUnitMap(returningUnits),
        loot: encodeLootResult(expeditionLoot),
      },
    });

    const attackerStats = calculateCasualtyStats(
      originalUnits,
      resolution.lossesAttacker,
    );

    await createOutboxEvent(
      tx,
      'battle.resolved',
      expedition.attackerVillageId,
      {
        expeditionId: expedition.id,
        reportId: report.id,
        villageId: expedition.attackerVillageId,
        villageName: attackerVillage.name,
        targetKind: expedition.targetKind,
        targetName: defenderVillage?.name || '',
        targetTier:
          expedition.targetKind === 'BARBARIAN_VILLAGE'
            ? (defenderVillage?.tier ?? null)
            : null,
        targetOriginKind:
          expedition.targetKind === 'BARBARIAN_VILLAGE'
            ? (defenderVillage?.originKind ?? 'STANDARD')
            : undefined,
        targetX: expedition.targetX,
        targetY: expedition.targetY,
        isVictory,
        loot: { resources: returningLoot },
        lossesAttacker: resolution.lossesAttacker,
        casualtyRate: attackerStats.casualtyRate,
        survivingUnits: returningUnits,
        returnAt: returnAt?.toISOString() ?? null,
      },
    );

    if (returnAt) {
      await this.boss.send(
        'combat:return',
        { expeditionId: expedition.id },
        {
          startAfter: returnAt,
          singletonKey: `return:${expedition.id}`,
        },
      );
    }
  }

  private async buildCombatContext(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ): Promise<CombatContext> {
    const config = await this.worldConfig.getConfig(expedition.worldId);

    // Récupérer les villages avec leurs configurations de stratégie
    const [attackerVillage, attackerStrategyConfig, defenderStrategyConfig] =
      await Promise.all([
        tx.village.findUnique({
          where: { id: expedition.attackerVillageId },
        }),
        tx.villageStrategyConfig.findUnique({
          where: { villageId: expedition.attackerVillageId },
        }),
        expedition.targetKind === 'PLAYER_VILLAGE'
          ? tx.villageStrategyConfig.findUnique({
              where: { villageId: expedition.targetRefId },
            })
          : Promise.resolve(null),
      ]);

    if (!attackerVillage) throw new Error('Attacker village not found');

    // Appliquer les bonus de stratégie à la configuration
    const modifiedConfig = { ...config };

    // Bonus d'attaque de l'attaquant
    if (attackerStrategyConfig) {
      const strategy = attackerStrategyConfig.strategy;
      const attackBonus = getStrategyBonusValue(strategy, 'attackBonus');
      if (attackBonus) {
        modifiedConfig.combat = {
          ...modifiedConfig.combat,
          attackBonus: modifiedConfig.combat.attackBonus * attackBonus,
        };
      }

      // Bonus de pillage de l'attaquant
      const lootBonus = getStrategyBonusValue(strategy, 'lootBonus');
      if (lootBonus) {
        modifiedConfig.combat = {
          ...modifiedConfig.combat,
          lootFactor: modifiedConfig.combat.lootFactor * lootBonus,
        };
      }
    }

    const defender =
      expedition.targetKind === 'BARBARIAN_VILLAGE'
        ? await this.buildBarbarianDefender(
            tx,
            expedition.targetRefId,
            config.tempo,
          )
        : await this.buildPlayerDefender(tx, expedition.targetRefId);

    // Bonus de défense du défenseur (seulement pour les villages joueurs)
    if (expedition.targetKind === 'PLAYER_VILLAGE' && defenderStrategyConfig) {
      const defenseBonus = getStrategyBonusValue(
        defenderStrategyConfig.strategy,
        'defenseBonus',
      );
      if (defenseBonus) {
        modifiedConfig.combat = {
          ...modifiedConfig.combat,
          defenseBonus: modifiedConfig.combat.defenseBonus * defenseBonus,
        };
      }
    }

    const distance = calculateDistance(
      attackerVillage.x,
      attackerVillage.y,
      expedition.targetX,
      expedition.targetY,
    );

    const expeditionUnits = parseUnitMap(expedition.units, 'expedition.units');

    return {
      worldId: expedition.worldId,
      expedition,
      attacker: {
        village: attackerVillage,
        units: expeditionUnits,
      },
      defender,
      config: {
        ...modifiedConfig,
        _distance: distance,
        _travelTime: await this.worldConfig.getTravelTimeForArmy(
          expedition.worldId,
          distance,
          expeditionUnits,
          attackerStrategyConfig?.strategy,
        ),
      },
      attackerStrategyConfig,
    };
  }

  private async buildBarbarianDefender(
    tx: PrismaClientOrTx,
    villageId: string,
    tempo: WorldTempo,
  ) {
    const village = await tx.village.findUniqueOrThrow({
      where: { id: villageId },
      include: { resourceStock: true, buildings: true },
    });

    const { units, resources } = await this.barbarianRuntime.catchUpVillage(
      tx,
      villageId,
      tempo,
    );

    const garrisons = await tx.garrison.findMany({
      where: { villageId },
      include: {
        originVillage: {
          include: { strategyConfig: true },
        },
      },
    });

    const participants: CombatParticipant[] = [
      { villageId: village.id, units, strategy: undefined },
    ];
    const totalUnits: UnitMap = { ...units };

    mergeGarrisonsIntoParticipants(garrisons, participants, totalUnits);

    return {
      kind: 'BARBARIAN_VILLAGE' as const,
      village,
      units: totalUnits,
      resources,
      participants,
    };
  }

  private async buildPlayerDefender(tx: PrismaClientOrTx, villageId: string) {
    const village = await tx.village.findUniqueOrThrow({
      where: { id: villageId },
      include: {
        resourceStock: true,
        unitInventory: true,
        strategyConfig: true,
      },
    });

    // Get reinforcements stationned in this village
    const garrisons = await tx.garrison.findMany({
      where: { villageId },
      include: {
        originVillage: {
          include: { strategyConfig: true },
        },
      },
    });

    const localUnits: UnitMap = Object.fromEntries(
      village.unitInventory.map((inv) => [inv.unitType, inv.quantity]),
    );

    const participants: CombatParticipant[] = [
      {
        villageId: village.id,
        units: localUnits,
        strategy: village.strategyConfig?.strategy || undefined,
      },
    ];

    const totalUnits: UnitMap = { ...localUnits };

    mergeGarrisonsIntoParticipants(garrisons, participants, totalUnits);

    return {
      kind: 'PLAYER_VILLAGE' as const,
      village,
      units: totalUnits,
      resources: village.resourceStock
        ? {
            wood: village.resourceStock.wood,
            stone: village.resourceStock.stone,
            iron: village.resourceStock.iron,
          }
        : { wood: 0, stone: 0, iron: 0 },
      participants,
    };
  }

  private async applyDefenderLosses(
    tx: PrismaClientOrTx,
    defenderVillage: DefenderVillage,
    participants: CombatParticipant[],
    totalDefenderUnits: UnitMap,
    lossesDefender: UnitMap,
  ): Promise<string[]> {
    const affectedReinforcementOrigins = new Set<string>();
    const pending = await tx.pendingConquest.findFirst({
      where: { targetVillageId: defenderVillage.id, status: 'OPEN' },
      select: { attackerVillageId: true },
    });

    for (const participant of participants) {
      const participantLosses = distributeLossesProportionally(
        lossesDefender,
        totalDefenderUnits,
        participant.units,
      );
      const hasParticipantLosses = Object.values(participantLosses).some(
        (losses) => losses > 0,
      );

      if (participant.villageId === defenderVillage.id) {
        for (const [unitType, losses] of Object.entries(participantLosses)) {
          if (losses <= 0) continue;
          await tx.unitInventory.update({
            where: {
              villageId_unitType: {
                villageId: defenderVillage.id,
                unitType,
              },
            },
            data: {
              quantity: { decrement: losses },
            },
          });
        }

        const popReleasedLocal = sumPopulationCost(participantLosses);
        if (popReleasedLocal > 0 && !defenderVillage.isBarbarian) {
          await tx.population.update({
            where: { villageId: defenderVillage.id },
            data: { used: { decrement: popReleasedLocal } },
          });
        }
        continue;
      }

      if (hasParticipantLosses) {
        affectedReinforcementOrigins.add(participant.villageId);
      }

      for (const [unitType, losses] of Object.entries(participantLosses)) {
        if (losses <= 0) continue;
        await tx.garrison.update({
          where: {
            villageId_originVillageId_unitType: {
              villageId: defenderVillage.id,
              originVillageId: participant.villageId,
              unitType,
            },
          },
          data: {
            quantity: { decrement: losses },
          },
        });
      }

      const popReleasedOrigin = sumPopulationCost(participantLosses);
      if (popReleasedOrigin > 0) {
        await tx.population.update({
          where: { villageId: participant.villageId },
          data: { used: { decrement: popReleasedOrigin } },
        });
      }

      if (
        pending?.attackerVillageId === participant.villageId &&
        (participantLosses[UNIT_TYPES.NOBLE] ?? 0) > 0
      ) {
        await this.conquest.interruptCaptureWindowInTx(
          tx,
          defenderVillage.id,
          'noble-killed-during-window',
        );
        continue;
      }

      if (pending?.attackerVillageId === participant.villageId) {
        const occupation = await tx.garrison.findMany({
          where: {
            villageId: defenderVillage.id,
            originVillageId: participant.villageId,
          },
          select: { unitType: true, quantity: true },
        });
        const hasEscortAlive = occupation.some(
          (line) => line.unitType !== UNIT_TYPES.NOBLE && line.quantity > 0,
        );

        if (!hasEscortAlive) {
          await this.conquest.interruptCaptureWindowInTx(
            tx,
            defenderVillage.id,
            'occupation-escort-destroyed-during-window',
          );
        }
      }
    }

    return [...affectedReinforcementOrigins];
  }

  private getCaptureDurationMs(
    targetVillage: DefenderVillage,
    tempo: WorldTempo,
  ): number {
    const castleLevel = targetVillage.isBarbarian
      ? null
      : (findBuildingByType(targetVillage.buildings, 'CASTLE')?.level ?? null);

    return getCaptureDurationMs({
      castleLevel,
      isBarbarian: targetVillage.isBarbarian,
      tempo,
      tier: targetVillage.tier,
    });
  }

  private async handleReinforcementArrival(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ) {
    this.logger.debug(`Processing reinforcement arrival: ${expedition.id}`);

    const units = parseUnitMap(expedition.units, 'expedition.units');
    const originVillageId =
      expedition.reinforcementOriginVillageId || expedition.attackerVillageId;
    const isReturningHome = expedition.targetRefId === originVillageId;

    // A capture window may have opened on the host between dispatch and arrival.
    // Defensive friends must never prop up an occupation garrison (cf.
    // docs/gameplay/14-pvp-conquest.md § Acteurs autorisés). The dispatch guard
    // (combat.service) only covers send-time, so re-check on arrival and bounce
    // in-flight reinforcements back home instead of stationing them.
    if (!isReturningHome) {
      const openConquest = await tx.pendingConquest.findFirst({
        where: {
          targetVillageId: expedition.targetRefId,
          status: PendingConquestStatus.OPEN,
        },
        select: { id: true },
      });
      if (openConquest) {
        await this.bounceReinforcementFromCaptureWindow(
          tx,
          expedition,
          units,
          originVillageId,
        );
        return;
      }
    }

    if (isReturningHome) {
      this.logger.debug(`Reinforcement returning home to ${originVillageId}`);
      // Back to home inventory
      for (const [unitType, quantity] of Object.entries(units)) {
        if (quantity <= 0) continue;
        await tx.unitInventory.upsert({
          where: {
            villageId_unitType: {
              villageId: originVillageId,
              unitType,
            },
          },
          create: {
            villageId: originVillageId,
            unitType,
            quantity,
          },
          update: {
            quantity: { increment: quantity },
          },
        });
      }
    } else {
      this.logger.debug(
        `Reinforcement arriving at ${expedition.targetRefId} from ${originVillageId}`,
      );
      // Transfer units to Garrison
      for (const [unitType, quantity] of Object.entries(units)) {
        if (quantity <= 0) continue;

        await tx.garrison.upsert({
          where: {
            villageId_originVillageId_unitType: {
              villageId: expedition.targetRefId,
              originVillageId: originVillageId,
              unitType,
            },
          },
          create: {
            villageId: expedition.targetRefId,
            originVillageId: originVillageId,
            unitType,
            quantity,
          },
          update: {
            quantity: { increment: quantity },
          },
        });
      }
    }

    // 2. Update expedition status
    await tx.expedition.update({
      where: { id: expedition.id },
      data: { status: 'RESOLVED' },
    });

    // 3. Create event
    if (isReturningHome) {
      await createOutboxEvent(
        tx,
        'reinforcement.returned',
        expedition.targetRefId,
        {
          expeditionId: expedition.id,
          villageId: expedition.targetRefId,
          originVillageId: originVillageId,
          hostVillageId: expedition.attackerVillageId,
          units,
        },
      );
    } else {
      await createOutboxEvent(tx, 'garrison.added', expedition.targetRefId, {
        villageId: expedition.targetRefId,
        originVillageId: originVillageId,
        units,
      });
    }

    // 4. Create ReinforcementReport + InboxEntry per recipient
    const reportType = isReturningHome ? 'RETURNED' : 'STATIONED';
    const reportActorUserId = isReturningHome
      ? (expedition.reinforcementRecallActorUserId ?? null)
      : null;

    // STATIONED: origin = originVillageId, host = targetRefId
    // RETURNED:  origin = targetRefId (home), host = attackerVillageId (B)
    const reportOriginVillageId = isReturningHome
      ? expedition.targetRefId
      : originVillageId;
    const reportHostVillageId = isReturningHome
      ? expedition.attackerVillageId
      : expedition.targetRefId;

    const [originVillageSnap, hostVillageSnap] = await Promise.all([
      loadReportVillageSnapshot(tx, reportOriginVillageId),
      loadReportVillageSnapshot(tx, reportHostVillageId),
    ]);

    if (!originVillageSnap) {
      throw new Error(
        `Reinforcement report origin village not found: originVillageId=${reportOriginVillageId}, worldId=${expedition.worldId}`,
      );
    }
    if (!hostVillageSnap) {
      throw new Error(
        `Reinforcement report host village not found: hostVillageId=${reportHostVillageId}, worldId=${expedition.worldId}`,
      );
    }

    const report = await tx.reinforcementReport.create({
      data: {
        worldId: expedition.worldId,
        type: reportType,
        originVillageId: reportOriginVillageId,
        originVillageName: originVillageSnap.name,
        originX: originVillageSnap.x,
        originY: originVillageSnap.y,
        hostVillageId: reportHostVillageId,
        hostVillageName: hostVillageSnap.name,
        hostX: hostVillageSnap.x,
        hostY: hostVillageSnap.y,
        units: encodeUnitMap(units),
        actorUserId: reportActorUserId,
      },
    });

    const recipientIds = dedupedRecipientUserIds(
      originVillageSnap.userId,
      hostVillageSnap.userId,
    );

    for (const recipientUserId of recipientIds) {
      await tx.inboxEntry.create({
        data: {
          userId: recipientUserId,
          worldId: expedition.worldId,
          kind: 'REINFORCEMENT',
          reinforcementReportId: report.id,
        },
      });
    }

    this.logger.debug(
      `ReinforcementReport ${report.id} (${reportType}) created, ${recipientIds.length} inbox entries for expedition ${expedition.id}`,
    );

    this.logger.debug(
      `Reinforcement ${isReturningHome ? 'returned' : 'stationed'}: ${expedition.id}`,
    );
  }

  /**
   * The host slammed an OPEN capture window shut while these reinforcements were
   * in flight. Refuse delivery: the troops turn back at the gates and are
   * returned to their origin village immediately (pop stays consumed at origin —
   * the units are alive and home). A RETURNED report tells the troop owner why.
   */
  private async bounceReinforcementFromCaptureWindow(
    tx: PrismaClientOrTx,
    expedition: Expedition,
    units: UnitMap,
    originVillageId: string,
  ): Promise<void> {
    this.logger.debug(
      `Reinforcement ${expedition.id} bounced: host ${expedition.targetRefId} under an open capture window`,
    );

    for (const [unitType, quantity] of Object.entries(units)) {
      if (quantity <= 0) continue;
      await tx.unitInventory.upsert({
        where: {
          villageId_unitType: { villageId: originVillageId, unitType },
        },
        create: { villageId: originVillageId, unitType, quantity },
        update: { quantity: { increment: quantity } },
      });
    }

    await tx.expedition.update({
      where: { id: expedition.id },
      data: { status: 'RESOLVED' },
    });

    await createOutboxEvent(tx, 'reinforcement.returned', originVillageId, {
      expeditionId: expedition.id,
      villageId: originVillageId,
      originVillageId,
      hostVillageId: expedition.targetRefId,
      units,
    });

    const [originVillageSnap, hostVillageSnap] = await Promise.all([
      loadReportVillageSnapshot(tx, originVillageId),
      loadReportVillageSnapshot(tx, expedition.targetRefId),
    ]);
    if (!originVillageSnap) {
      throw new Error(
        `Bounced reinforcement origin village not found: originVillageId=${originVillageId}, worldId=${expedition.worldId}`,
      );
    }
    if (!hostVillageSnap) {
      throw new Error(
        `Bounced reinforcement host village not found: hostVillageId=${expedition.targetRefId}, worldId=${expedition.worldId}`,
      );
    }

    const report = await tx.reinforcementReport.create({
      data: {
        worldId: expedition.worldId,
        type: 'RETURNED',
        originVillageId,
        originVillageName: originVillageSnap.name,
        originX: originVillageSnap.x,
        originY: originVillageSnap.y,
        hostVillageId: expedition.targetRefId,
        hostVillageName: hostVillageSnap.name,
        hostX: hostVillageSnap.x,
        hostY: hostVillageSnap.y,
        units: encodeUnitMap(units),
        actorUserId: null,
      },
    });

    const recipientIds = dedupedRecipientUserIds(
      originVillageSnap.userId,
      hostVillageSnap.userId,
    );
    for (const recipientUserId of recipientIds) {
      await tx.inboxEntry.create({
        data: {
          userId: recipientUserId,
          worldId: expedition.worldId,
          kind: 'REINFORCEMENT',
          reinforcementReportId: report.id,
        },
      });
    }
  }

  private async handleScoutArrival(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ) {
    this.logger.debug(`Processing scout arrival: ${expedition.id}`);

    const [attackerVillage, targetVillage] = await Promise.all([
      tx.village.findUnique({
        where: { id: expedition.attackerVillageId },
      }),
      tx.village.findUnique({
        where: { id: expedition.targetRefId },
        include: {
          buildings: true,
          resourceStock: true,
          unitInventory: true,
          strategyConfig: true,
        },
      }),
    ]);

    if (!attackerVillage?.userId) {
      throw new Error('Scout origin village not found');
    }
    if (!targetVillage) {
      throw new Error('Scout target village not found');
    }

    const snapshot =
      expedition.targetKind === 'BARBARIAN_VILLAGE'
        ? await this.barbarianRuntime.catchUpVillage(
            tx,
            expedition.targetRefId,
            (await this.worldConfig.getConfig(expedition.worldId)).tempo,
          )
        : {
            units: Object.fromEntries(
              targetVillage.unitInventory.map((unit) => [
                unit.unitType,
                unit.quantity,
              ]),
            ) as UnitMap,
            resources: targetVillage.resourceStock
              ? {
                  wood: targetVillage.resourceStock.wood,
                  stone: targetVillage.resourceStock.stone,
                  iron: targetVillage.resourceStock.iron,
                }
              : { wood: 0, stone: 0, iron: 0 },
          };
    const wallLevel =
      findBuildingByType(targetVillage.buildings, 'WALL')?.level ?? 0;
    // Snapshot du niveau de Château au moment du scout → dérive la fenêtre de
    // capture PvP côté UI (preview). Cibles barbares : pas de Château hérité.
    const castleLevel =
      expedition.targetKind === 'PLAYER_VILLAGE'
        ? (findBuildingByType(targetVillage.buildings, 'CASTLE')?.level ??
          undefined)
        : undefined;
    // Snapshot du bouclier débutant du propriétaire de la cible au moment du
    // scout (PLAYER only) → badge figé sur le rapport. Barbares : pas de
    // bouclier (champ absent). Cohérent avec wallLevel/castleLevel : la valeur
    // reste figée même si le bouclier expire après le scout.
    const newbieShieldSnapshot =
      expedition.targetKind === 'PLAYER_VILLAGE' && targetVillage.userId
        ? await this.newbieShield.getMembershipShieldState(
            targetVillage.userId,
            expedition.worldId,
            new Date(),
            tx,
          )
        : null;
    // Snapshot des amis défensifs ACTIVE du propriétaire de la cible au moment
    // du scout (PLAYER only) → un attaquant jauge le risque de renfort. Figé
    // comme wallLevel/newbieShield : non recalculé live après le scout.
    const defensiveFriendsDisplayNames =
      expedition.targetKind === 'PLAYER_VILLAGE' && targetVillage.userId
        ? await this.friendship.listActiveFriendDisplayNames(
            expedition.worldId,
            targetVillage.userId,
            tx,
          )
        : [];

    const report = await tx.scoutReport.create({
      data: {
        worldId: expedition.worldId,
        scoutVillageId: expedition.attackerVillageId,
        scoutUserId: attackerVillage.userId,
        targetVillageId: targetVillage.id,
        targetKind: expedition.targetKind,
        targetX: expedition.targetX,
        targetY: expedition.targetY,
        targetName: targetVillage.name,
        targetTier: targetVillage.tier,
        units: encodeUnitMap(snapshot.units),
        resources: snapshot.resources,
        strategy:
          expedition.targetKind === 'PLAYER_VILLAGE'
            ? targetVillage.strategyConfig?.strategy
            : null,
        details: {
          expeditionId: expedition.id,
          scoutLosses: {},
          scoutUnits: parseUnitMap(expedition.units, 'expedition.units'),
          wallLevel,
          ...(castleLevel !== undefined ? { castleLevel } : {}),
          ...(newbieShieldSnapshot
            ? {
                newbieShield: {
                  active: newbieShieldSnapshot.active,
                  endsAt: newbieShieldSnapshot.endsAt,
                },
              }
            : {}),
          ...(defensiveFriendsDisplayNames.length > 0
            ? { defensiveFriendsDisplayNames }
            : {}),
        },
      },
    });

    await this.intelService.recordIntel(tx, {
      userId: attackerVillage.userId,
      worldId: expedition.worldId,
      targetVillageId: targetVillage.id,
      sourceKind: 'SCOUT',
      sourceReportId: report.id,
      units: snapshot.units,
      resources: snapshot.resources,
      wallLevel,
      strategy:
        expedition.targetKind === 'PLAYER_VILLAGE'
          ? (targetVillage.strategyConfig?.strategy ?? null)
          : null,
      targetName: targetVillage.name,
      targetX: expedition.targetX,
      targetY: expedition.targetY,
      targetTier: targetVillage.tier,
      seenAt: report.timestamp,
    });

    const returnAt = new Date(Date.now() + expedition.outboundTravelMs);
    const survivingUnits = parseUnitMap(expedition.units, 'expedition.units');

    await tx.expedition.update({
      where: { id: expedition.id },
      data: {
        status: 'RETURNING',
        scoutReportId: report.id,
        returnAt,
        survivingUnits: encodeUnitMap(survivingUnits),
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
      },
    });

    await createOutboxEvent(
      tx,
      'scout.reported',
      expedition.attackerVillageId,
      {
        expeditionId: expedition.id,
        reportId: report.id,
        villageId: expedition.attackerVillageId,
        targetKind: expedition.targetKind,
        targetName: targetVillage.name,
        targetX: expedition.targetX,
        targetY: expedition.targetY,
        returnAt: returnAt.toISOString(),
      },
    );

    await this.boss.send(
      'combat:return',
      { expeditionId: expedition.id },
      {
        startAfter: returnAt,
        singletonKey: `return:${expedition.id}`,
      },
    );

    this.logger.debug(
      `Scout resolved for expedition ${expedition.id}, report=${report.id}, returns at ${returnAt.toISOString()}`,
    );
  }

  private async handleCaravanArrival(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ): Promise<ReturnJobToSchedule> {
    this.logger.debug(`Processing caravan arrival: ${expedition.id}`);

    const targetVillage = await tx.village.findUnique({
      where: { id: expedition.targetRefId },
      include: {
        buildings: { select: { type: true, level: true } },
        resourceStock: true,
        strategyConfig: true,
      },
    });
    if (!targetVillage?.resourceStock) {
      throw new Error(
        `Caravan target stock not found: ${expedition.targetRefId}`,
      );
    }

    const carried = parseCaravanResources(expedition);
    const warehouseLevel =
      findBuildingByType(targetVillage.buildings, 'WAREHOUSE')?.level ?? 1;
    const limits = getWarehouseStorageLimit(warehouseLevel);
    const now = new Date();
    const currentStock = await this.resources.calculateCurrentResources({
      worldId: targetVillage.worldId,
      resourceStock: targetVillage.resourceStock,
      buildings: targetVillage.buildings,
      strategy: targetVillage.strategyConfig?.strategy,
    });
    const credited = {
      wood: Math.min(
        carried.wood,
        Math.max(0, limits.wood - currentStock.wood),
      ),
      stone: Math.min(
        carried.stone,
        Math.max(0, limits.stone - currentStock.stone),
      ),
      iron: Math.min(
        carried.iron,
        Math.max(0, limits.iron - currentStock.iron),
      ),
    };
    const lost = subtractCaravanResources(carried, credited);
    const returnAt = new Date(Date.now() + expedition.outboundTravelMs);

    await tx.resourceStock.update({
      where: { villageId: expedition.targetRefId },
      data: {
        wood: currentStock.wood + credited.wood,
        stone: currentStock.stone + credited.stone,
        iron: currentStock.iron + credited.iron,
        lastUpdateTs: now,
      },
    });
    await this.outbox.resourcesChanged(expedition.targetRefId, tx);

    await tx.expedition.update({
      where: { id: expedition.id },
      data: {
        status: 'RETURNING',
        returnAt,
      },
    });

    const originVillage = await loadReportVillageSnapshot(
      tx,
      expedition.attackerVillageId,
    );
    if (!originVillage?.userId) {
      throw new Error(
        `Caravan report origin village not found: originVillageId=${expedition.attackerVillageId}, worldId=${expedition.worldId}`,
      );
    }

    const report = await tx.caravanReport.upsert({
      where: {
        expeditionId_type: {
          expeditionId: expedition.id,
          type: 'ARRIVED',
        },
      },
      create: {
        worldId: expedition.worldId,
        expeditionId: expedition.id,
        type: 'ARRIVED',
        originVillageId: originVillage.id,
        originVillageName: originVillage.name,
        originX: originVillage.x,
        originY: originVillage.y,
        targetVillageId: targetVillage.id,
        targetVillageName: targetVillage.name,
        targetX: targetVillage.x,
        targetY: targetVillage.y,
        resources: carried,
        credited,
        returned: EMPTY_LOOT,
        lost,
        porters: caravanPortersFor(carried),
        recalled: false,
      },
      update: {},
    });

    const recipientIds = dedupedRecipientUserIds(
      originVillage.userId,
      targetVillage.userId,
    );

    for (const recipientUserId of recipientIds) {
      await tx.inboxEntry.upsert({
        where: {
          userId_caravanReportId: {
            userId: recipientUserId,
            caravanReportId: report.id,
          },
        },
        create: {
          userId: recipientUserId,
          worldId: expedition.worldId,
          kind: 'CARAVAN',
          caravanReportId: report.id,
        },
        update: {},
      });
    }

    await createOutboxEvent(tx, 'caravan.arrived', expedition.targetRefId, {
      expeditionId: expedition.id,
      villageId: expedition.attackerVillageId,
      targetVillageId: expedition.targetRefId,
      credited,
      lost,
      returnAt: returnAt.toISOString(),
    });

    this.logger.debug(
      `Caravan arrived for expedition ${expedition.id}, credited=${JSON.stringify(credited)}, lost=${JSON.stringify(lost)}`,
    );

    return { expeditionId: expedition.id, returnAt };
  }
}
