import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Expedition, Prisma, ExpeditionKind, Village } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from '../world/world-config.service';
import { BarbarianRuntimeService } from '../world/barbarian-runtime.service';
import { ResourcesService } from '../resources/resources.service';
import { BarbarianVillageStrategy } from './strategies/barbarian-village.strategy';
import { PlayerVillageStrategy } from './strategies/player-village.strategy';
import { ConquestService } from './conquest.service';
import PgBoss from 'pg-boss';
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
import { parseCombatLoot } from './codecs';
import { getStrategyBonusValue } from '@battleforthecrown/shared/village';
import { calculateDistance } from '@battleforthecrown/shared/logic';
import { getWarehouseStorageLimit } from '@battleforthecrown/shared/resources';
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

interface PendingConquestToSchedule {
  id: string;
  captureUntil: Date;
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
type ResourceBundle = { wood: number; stone: number; iron: number };

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
  ) {}

  async onModuleInit() {
    try {
      await this.boss.createQueue('combat:resolve');
      await this.boss.work('combat:resolve', async (jobs) => {
        const job = Array.isArray(jobs) ? jobs[0] : jobs;
        return this.handleCombatResolution(job.data as CombatJob);
      });

      this.logger.log('Combat worker initialized');
    } catch (error) {
      this.logger.error('Failed to initialize combat worker:', error);
      throw error;
    }
  }

  private async handleCombatResolution(data: CombatJob) {
    this.logger.debug(`Processing combat resolution: ${data.expeditionId}`);

    try {
      const pendingConquestToSchedule = await this.withSerializableRetry(() =>
        this.prisma.$transaction(
          async (tx) => {
            // 1. Get expedition with related data
            const expedition = await tx.expedition.findUnique({
              where: { id: data.expeditionId },
            });

            if (!expedition) {
              this.logger.warn(`Expedition ${data.expeditionId} not found`);
              return;
            }

            if (expedition.status !== 'EN_ROUTE') {
              this.logger.warn(
                `Expedition ${data.expeditionId} already resolved (${expedition.status})`,
              );
              return;
            }

            if (expedition.kind === ExpeditionKind.REINFORCE) {
              return this.handleReinforcementArrival(tx, expedition);
            }

            if (expedition.kind === ExpeditionKind.SCOUT) {
              return this.handleScoutArrival(tx, expedition);
            }

            if (expedition.kind === ExpeditionKind.CARAVAN) {
              return this.handleCaravanArrival(tx, expedition);
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

            // 9. Apply the conquest outcome (open capture window, or signal a dead noble).
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

            // 10. Compute what returns home (units + loot withheld during a capture).
            const { returningLoot, expeditionLoot, returnAt } =
              this.computeReturn(
                expedition,
                resolution,
                returningUnits,
                captureWindowOpened,
              );

            // 11. Update expedition + emit battle.resolved + schedule the return.
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
            return pendingConquest;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      if (pendingConquestToSchedule) {
        await this.conquest.scheduleFinalizeJob(pendingConquestToSchedule);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process combat for ${data.expeditionId}:`,
        error,
      );
      throw error;
    }
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

  /**
   * Step 9: when a victorious noble survives, open the capture window and
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

    for (const g of garrisons) {
      const gUnits: UnitMap = { [g.unitType as UnitType]: g.quantity };
      const existingParticipant = participants.find(
        (p) => p.villageId === g.originVillageId,
      );

      if (existingParticipant) {
        existingParticipant.units[g.unitType as UnitType] =
          (existingParticipant.units[g.unitType as UnitType] ?? 0) + g.quantity;
      } else {
        participants.push({
          villageId: g.originVillageId,
          units: gUnits,
          strategy: g.originVillage?.strategyConfig?.strategy,
        });
      }

      totalUnits[g.unitType as UnitType] =
        (totalUnits[g.unitType as UnitType] ?? 0) + g.quantity;
    }

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

    for (const g of garrisons) {
      const gUnits: UnitMap = { [g.unitType as UnitType]: g.quantity };
      const existingParticipant = participants.find(
        (p) => p.villageId === g.originVillageId,
      );

      if (existingParticipant) {
        existingParticipant.units[g.unitType as UnitType] =
          (existingParticipant.units[g.unitType as UnitType] ?? 0) + g.quantity;
      } else {
        participants.push({
          villageId: g.originVillageId,
          units: gUnits,
          strategy: g.originVillage?.strategyConfig?.strategy,
        });
      }

      totalUnits[g.unitType as UnitType] =
        (totalUnits[g.unitType as UnitType] ?? 0) + g.quantity;
    }

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
    defenderVillage: Prisma.VillageGetPayload<{
      include: { resourceStock: true; buildings: true };
    }>,
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
    targetVillage: Prisma.VillageGetPayload<{
      include: { resourceStock: true; buildings: true };
    }>,
    tempo: WorldTempo,
  ): number {
    const castleLevel = targetVillage.isBarbarian
      ? null
      : targetVillage.buildings.find((building) => building.type === 'CASTLE')
          ?.level;

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
      tx.village.findUnique({
        where: { id: reportOriginVillageId },
        select: { id: true, name: true, x: true, y: true, userId: true },
      }),
      tx.village.findUnique({
        where: { id: reportHostVillageId },
        select: { id: true, name: true, x: true, y: true, userId: true },
      }),
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

    const recipientIds = [
      ...new Set(
        [originVillageSnap.userId, hostVillageSnap.userId].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    ];

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
      targetVillage.buildings.find((building) => building.type === 'WALL')
        ?.level ?? 0;

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
        },
      },
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
  ) {
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
      targetVillage.buildings.find((building) => building.type === 'WAREHOUSE')
        ?.level ?? 1;
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
    const lost = subtractResources(carried, credited);
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

    await createOutboxEvent(tx, 'caravan.arrived', expedition.targetRefId, {
      expeditionId: expedition.id,
      villageId: expedition.attackerVillageId,
      targetVillageId: expedition.targetRefId,
      credited,
      lost,
      returnAt: returnAt.toISOString(),
    });

    await this.boss.send(
      'combat:return',
      { expeditionId: expedition.id },
      {
        startAfter: returnAt,
        singletonKey: `return:${expedition.id}`,
      },
    );

    this.logger.debug(
      `Caravan arrived for expedition ${expedition.id}, credited=${JSON.stringify(credited)}, lost=${JSON.stringify(lost)}`,
    );
  }

  private async withSerializableRetry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (!this.isSerializationFailure(error) || attempt === maxAttempts) {
          throw error;
        }
        this.logger.warn(
          `Retrying serialized combat resolution after conflict (${attempt}/${maxAttempts})`,
        );
      }
    }

    throw new Error('Unreachable serializable retry state');
  }

  private isSerializationFailure(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2034'
    );
  }
}

function normalizeResources(
  resources: Partial<ResourceBundle>,
): ResourceBundle {
  return {
    wood: Math.max(0, Math.floor(resources.wood ?? 0)),
    stone: Math.max(0, Math.floor(resources.stone ?? 0)),
    iron: Math.max(0, Math.floor(resources.iron ?? 0)),
  };
}

function subtractResources(
  left: ResourceBundle,
  right: ResourceBundle,
): ResourceBundle {
  return {
    wood: Math.max(0, left.wood - right.wood),
    stone: Math.max(0, left.stone - right.stone),
    iron: Math.max(0, left.iron - right.iron),
  };
}

function parseCaravanResources(expedition: Expedition): ResourceBundle {
  if (expedition.loot === null) return normalizeResources(EMPTY_LOOT);
  return normalizeResources(
    parseCombatLoot(expedition.loot).resources ?? EMPTY_LOOT,
  );
}
