import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Expedition, Prisma, ExpeditionKind } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from '../world/world-config.service';
import { ResourcesService } from '../resources/resources.service';
import { BarbarianVillageStrategy } from './strategies/barbarian-village.strategy';
import { PlayerVillageStrategy } from './strategies/player-village.strategy';
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
import {
  UNIT_COSTS,
  type UnitMap,
  type UnitType,
} from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';

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
    private readonly resourcesService: ResourcesService,
    private readonly barbarianStrategy: BarbarianVillageStrategy,
    private readonly playerStrategy: PlayerVillageStrategy,
    private readonly outbox: OutboxPublisher,
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
      await this.prisma.$transaction(async (tx) => {
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

        // 5. Apply loot to defender (deduct resources)
        let defenderVillage: Prisma.VillageGetPayload<{
          include: { resourceStock: true };
        }> | null = null;

        if (expedition.targetKind === 'BARBARIAN_VILLAGE') {
          // For barbarians: deduct from Village.resourceStock (same as player villages)
          defenderVillage = await tx.village.findUnique({
            where: { id: expedition.targetRefId },
            include: { resourceStock: true },
          });

          if (defenderVillage?.resourceStock) {
            const lootedResources = resolution.loot.resources || {
              wood: 0,
              stone: 0,
              iron: 0,
            };

            // Deduct looted resources and reset timestamp for production
            await tx.resourceStock.update({
              where: { villageId: defenderVillage.id },
              data: {
                wood: { decrement: lootedResources.wood },
                stone: { decrement: lootedResources.stone },
                iron: { decrement: lootedResources.iron },
                lastUpdateTs: new Date(), // Reset production timestamp
              },
            });

            await this.outbox.resourcesChanged(defenderVillage.id, tx);
          }
        } else {
          // For player villages: deduct from ResourceStock

          defenderVillage = await tx.village.findUnique({
            where: { id: expedition.targetRefId },
            include: { resourceStock: true },
          });

          if (defenderVillage) {
            const lootedResources = resolution.loot.resources || {
              wood: 0,
              stone: 0,
              iron: 0,
            };

            if (defenderVillage.resourceStock) {
              // Deduct looted resources from defender
              await tx.resourceStock.update({
                where: { villageId: defenderVillage.id },
                data: {
                  wood: { decrement: lootedResources.wood },
                  stone: { decrement: lootedResources.stone },
                  iron: { decrement: lootedResources.iron },
                },
              });

              await this.outbox.resourcesChanged(defenderVillage.id, tx);
            }

            // Update defender participants (apply losses)
            const lossesDefender = resolution.lossesDefender || {};
            const totalDefenderUnits = context.defender.units || {};

            for (const participant of context.defender.participants) {
              const participantLosses = distributeLossesProportionally(
                lossesDefender,
                totalDefenderUnits,
                participant.units,
              );

              if (participant.villageId === defenderVillage.id) {
                // Local units losses
                for (const [unitType, losses] of Object.entries(
                  participantLosses,
                )) {
                  if (losses > 0) {
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
                }

                // Release local population
                const popReleasedLocal = sumPopulationCost(participantLosses);
                if (popReleasedLocal > 0) {
                  await tx.population.update({
                    where: { villageId: defenderVillage.id },
                    data: { used: { decrement: popReleasedLocal } },
                  });
                }
              } else {
                // Garrison units losses
                for (const [unitType, losses] of Object.entries(
                  participantLosses,
                )) {
                  if (losses > 0) {
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
                }

                // Release origin population
                const popReleasedOrigin = sumPopulationCost(participantLosses);
                if (popReleasedOrigin > 0) {
                  await tx.population.update({
                    where: { villageId: participant.villageId },
                    data: { used: { decrement: popReleasedOrigin } },
                  });
                }
              }
            }
          }
        }

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

        // 7. Create event for defender (if PvP)
        if (expedition.targetKind === 'PLAYER_VILLAGE' && defenderVillage) {
          const lossesDefender = resolution.lossesDefender || {};
          const lootedResources = resolution.loot.resources || {
            wood: 0,
            stone: 0,
            iron: 0,
          };

          // Check if defender survived (at least one unit)
          const defenderSurvived = typedEntries(
            resolution.lossesDefender || {},
          ).some(([unitType, loss]) => {
            const originalQty = context.defender.units?.[unitType] ?? 0;
            return originalQty - loss > 0;
          });

          const defenderStats = calculateCasualtyStats(
            context.defender.units || {},
            lossesDefender,
          );

          await createOutboxEvent(tx, 'village.attacked', defenderVillage.id, {
            defenderVillageId: defenderVillage.id,
            attackerVillageId: expedition.attackerVillageId,
            attackerVillageName: attackerVillage.name,
            attackerX: attackerVillage.x,
            attackerY: attackerVillage.y,
            defenderVillageName: defenderVillage.name,
            isDefenseSuccessful: defenderSurvived,
            losses: lossesDefender,
            casualtyRate: defenderStats.casualtyRate,
            resourcesLost: lootedResources,
            timestamp: new Date().toISOString(),
          });
        }

        // 8. Create combat report
        const report = await tx.combatReport.create({
          data: {
            worldId: expedition.worldId,
            attackerVillageId: expedition.attackerVillageId,
            attackerUserId: attackerVillage.userId!, // Guaranteed non-null for player attacks
            defenderVillageId:
              expedition.targetKind === 'PLAYER_VILLAGE'
                ? expedition.targetRefId
                : null,
            defenderUserId:
              expedition.targetKind === 'PLAYER_VILLAGE' && defenderVillage
                ? defenderVillage.userId
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

              distance: context.config._distance,

              travelTime: context.config._travelTime,
            },
          },
        });

        // 9. Calculate return time
        const distance = calculateDistance(
          attackerVillage.x,
          attackerVillage.y,
          expedition.targetX,
          expedition.targetY,
        );
        const travelTimeMs = await this.worldConfig.getTravelTimeForArmy(
          expedition.worldId,
          distance,
          parseUnitMap(expedition.units, 'expedition.units'),
          context.attackerStrategyConfig?.strategy,
        );
        const returnAt = new Date(Date.now() + travelTimeMs);

        // 10. Update expedition
        await tx.expedition.update({
          where: { id: expedition.id },
          data: {
            status: 'RETURNING',
            reportId: report.id,
            returnAt,
            survivingUnits: encodeUnitMap(resolution.survivingUnits),
            loot: encodeLootResult(resolution.loot),
          },
        });

        // 11. Determine victory status and calculate stats
        const originalUnits = parseUnitMap(
          expedition.units,
          'expedition.units',
        );
        const isVictory = isVictoryForAttacker(
          resolution.lossesAttacker,
          originalUnits,
        );

        const attackerStats = calculateCasualtyStats(
          originalUnits,
          resolution.lossesAttacker,
        );

        // Get target name
        const targetName = defenderVillage?.name || '';

        // 12. Create event
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
            targetName,
            targetX: expedition.targetX,
            targetY: expedition.targetY,
            isVictory,
            loot: {
              resources: resolution.loot.resources || {
                wood: 0,
                stone: 0,
                iron: 0,
              },
            },
            lossesAttacker: resolution.lossesAttacker,
            casualtyRate: attackerStats.casualtyRate,
            survivingUnits: resolution.survivingUnits,
            returnAt: returnAt.toISOString(),
          },
        );

        // 13. Schedule return worker
        await this.boss.send(
          'combat:return',
          { expeditionId: expedition.id },
          {
            startAfter: returnAt,
            singletonKey: `return:${expedition.id}`,
          },
        );

        this.logger.log(
          `Combat resolved for expedition ${expedition.id}, victory=${isVictory}, troops returning at ${returnAt.toISOString()}`,
        );
      });
    } catch (error) {
      this.logger.error(
        `Failed to process combat for ${data.expeditionId}:`,
        error,
      );
      throw error;
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
            expedition.worldId,
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
    worldId: string,
  ) {
    const village = await tx.village.findUniqueOrThrow({
      where: { id: villageId },
      include: { resourceStock: true, buildings: true },
    });

    const resources = village.resourceStock
      ? await this.resourcesService.calculateCurrentResources({
          worldId,
          resourceStock: village.resourceStock,
          buildings: village.buildings,
        })
      : { wood: 0, stone: 0, iron: 0 };

    const units: UnitMap = {};

    return {
      kind: 'BARBARIAN_VILLAGE' as const,
      village,
      units,
      resources,
      participants: [{ villageId: village.id, units, strategy: undefined }],
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
}
