import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Expedition, Prisma, ExpeditionKind, Village } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from '../world/world-config.service';
import { BarbarianRuntimeService } from '../world/barbarian-runtime.service';
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
import { getStrategyBonusValue } from '@battleforthecrown/shared/village';
import { calculateDistance } from '@battleforthecrown/shared/logic';
import { TempoService, type WorldTempo } from '@battleforthecrown/shared/world';
import type { CombatResolution } from '@battleforthecrown/shared/combat';
import {
  UNIT_COSTS,
  UNIT_TYPES,
  type UnitMap,
  type UnitType,
} from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';

const BARBARIAN_CAPTURE_DURATIONS_MS: Record<string, number> = {
  T1: 2 * 60 * 60 * 1000,
  T2: 4 * 60 * 60 * 1000,
  T3: 6 * 60 * 60 * 1000,
  T4: 9 * 60 * 60 * 1000,
  T5: 12 * 60 * 60 * 1000,
};

const PVP_CAPTURE_DURATIONS_MS = [
  { minCastleLevel: 9, durationMs: 18 * 60 * 60 * 1000 },
  { minCastleLevel: 7, durationMs: 12 * 60 * 60 * 1000 },
  { minCastleLevel: 5, durationMs: 9 * 60 * 60 * 1000 },
  { minCastleLevel: 3, durationMs: 6 * 60 * 60 * 1000 },
  { minCastleLevel: 1, durationMs: 4 * 60 * 60 * 1000 },
];
const MIN_CAPTURE_DURATION_MS = 1000;

interface PendingConquestToSchedule {
  id: string;
  captureUntil: Date;
}

/** Defender village hydrated with the data combat resolution needs to mutate. */
type DefenderVillage = Prisma.VillageGetPayload<{
  include: { resourceStock: true; buildings: true };
}>;

/** Occupation owner currently holding a barbarian village (PvP defender on capture). */
interface OccupationDefense {
  attackerUserId: string;
  attackerVillageId: string;
}

const EMPTY_LOOT = { wood: 0, stone: 0, iron: 0 } as const;

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
    this.logger.log(`Processing combat resolution: ${data.expeditionId}`);

    try {
      const pendingConquestToSchedule = await this.prisma.$transaction(
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

          this.logger.log(
            `Combat resolved for expedition ${expedition.id}, victory=${isVictory}, returnAt=${returnAt?.toISOString() ?? 'none'}`,
          );
          return pendingConquest;
        },
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

    const occupationDefense = isBarbarian
      ? await tx.pendingConquest.findFirst({
          where: { targetVillageId: expedition.targetRefId, status: 'OPEN' },
          select: { attackerUserId: true, attackerVillageId: true },
        })
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
      expedition.targetKind === 'PLAYER_VILLAGE'
        ? defenderVillage?.userId
        : occupationDefense?.attackerUserId;

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
      ...(expedition.targetKind === 'BARBARIAN_VILLAGE'
        ? { defenderUserId }
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
        attackerUserId: attackerVillage.userId!, // Guaranteed non-null for player attacks
        defenderVillageId:
          expedition.targetKind === 'PLAYER_VILLAGE' || occupationDefense
            ? expedition.targetRefId
            : null,
        defenderUserId:
          expedition.targetKind === 'PLAYER_VILLAGE' && defenderVillage
            ? defenderVillage.userId
            : (occupationDefense?.attackerUserId ?? null),
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
    let baseDurationMs: number;

    if (targetVillage.isBarbarian) {
      baseDurationMs =
        BARBARIAN_CAPTURE_DURATIONS_MS[targetVillage.tier ?? ''] ??
        BARBARIAN_CAPTURE_DURATIONS_MS.T1;
    } else {
      const castleLevel =
        targetVillage.buildings.find((building) => building.type === 'CASTLE')
          ?.level ?? 1;

      baseDurationMs =
        PVP_CAPTURE_DURATIONS_MS.find(
          (entry) => castleLevel >= entry.minCastleLevel,
        )?.durationMs ?? PVP_CAPTURE_DURATIONS_MS.at(-1)!.durationMs;
    }

    return Math.max(
      MIN_CAPTURE_DURATION_MS,
      Math.round(
        TempoService.applyDuration(baseDurationMs, tempo, 'captureWindow'),
      ),
    );
  }

  private async handleReinforcementArrival(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ) {
    this.logger.log(`Processing reinforcement arrival: ${expedition.id}`);

    const units = parseUnitMap(expedition.units, 'expedition.units');
    const originVillageId =
      expedition.reinforcementOriginVillageId || expedition.attackerVillageId;
    const isReturningHome = expedition.targetRefId === originVillageId;

    if (isReturningHome) {
      this.logger.log(`Reinforcement returning home to ${originVillageId}`);
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
      this.logger.log(
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

    this.logger.log(
      `Reinforcement ${isReturningHome ? 'returned' : 'stationed'}: ${expedition.id}`,
    );
  }

  private async handleScoutArrival(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ) {
    this.logger.log(`Processing scout arrival: ${expedition.id}`);

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

    this.logger.log(
      `Scout resolved for expedition ${expedition.id}, report=${report.id}, returns at ${returnAt.toISOString()}`,
    );
  }
}
