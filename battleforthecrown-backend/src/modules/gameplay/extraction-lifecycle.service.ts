import { Injectable, Logger, Inject } from '@nestjs/common';
import { Prisma, type ResourceExtractionSite } from '@prisma/client';
import PgBoss from 'pg-boss';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { createOutboxEvent } from '../event/event.utils';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import {
  encodeCombatLoot,
  encodeUnitMap,
  parseUnitMap,
} from '../combat/codecs';
import { parseCaravanResources } from '../combat/caravan.utils';
import { withSerializableRetry } from '../../common/serializable-retry.utils';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { ExtractionSiteSeedingService } from '../world/extraction-site-seeding.service';
import {
  computeExtractedAmount,
  EXTRACTION_STEAL_RATIO,
} from '@battleforthecrown/shared/extraction';
import type { ExtractionResourceType } from '@battleforthecrown/shared/extraction';
import { calculateCombatOutcome } from '../combat/combat-resolution';
import {
  isVictoryForAttacker,
  sumPopulationCost,
} from '../combat/combat.utils';
import { getUnitStats, type UnitMap } from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';
import { WorldConfigService } from '../world/world-config.service';
import type { CombatContext } from '../combat/interfaces/combat-context.interface';

/** Extraction team completion job queue — arrival schedules this, distinct from `combat:resolve`. */
export const EXTRACTION_COMPLETE_QUEUE = 'extraction:complete';

/**
 * ADR-12: all extraction lifecycle mutations (arrival → exploitation →
 * completion/depletion/respawn → return + credit) live here, one transaction
 * per step with an idempotency guard. Workers (`combat.worker`,
 * `extraction.worker`, `return.worker`) only route by expedition kind/status.
 */
@Injectable()
export class ExtractionLifecycleService {
  private readonly logger = new Logger(ExtractionLifecycleService.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxPublisher,
    private readonly siteSeeding: ExtractionSiteSeedingService,
    private readonly worldConfig: WorldConfigService,
  ) {}

  /**
   * Arrival: EN_ROUTE → EXPLOITING, stamps `exploitationEndsAt`, and (after
   * commit) schedules the completion job. No Outbox event at this step.
   */
  async handleArrival(expeditionId: string): Promise<void> {
    const exploitationEndsAt = await withSerializableRetry(
      () =>
        this.prisma.$transaction(
          async (tx): Promise<Date | undefined> => {
            const expedition = await tx.expedition.findUnique({
              where: { id: expeditionId },
            });
            if (!expedition) {
              this.logger.warn(`Expedition ${expeditionId} not found`);
              return undefined;
            }
            if (
              expedition.kind !== 'EXTRACTION' ||
              expedition.status !== 'EN_ROUTE'
            ) {
              this.logger.debug(
                `Extraction arrival no-op: expedition ${expeditionId} kind=${expedition.kind} status=${expedition.status}`,
              );
              return undefined;
            }
            if (!expedition.extractionDurationMs) {
              throw new Error(
                `Extraction expedition ${expeditionId} missing extractionDurationMs`,
              );
            }

            const endsAt = new Date(
              Date.now() + expedition.extractionDurationMs,
            );
            await tx.expedition.update({
              where: { id: expeditionId },
              data: { status: 'EXPLOITING', exploitationEndsAt: endsAt },
            });
            return endsAt;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      this.logger,
      'extraction-arrival',
    );

    if (!exploitationEndsAt) return;

    await this.boss.send(
      EXTRACTION_COMPLETE_QUEUE,
      { expeditionId },
      {
        startAfter: exploitationEndsAt,
        singletonKey: `extraction-complete:${expeditionId}`,
        expireInSeconds: 60,
      },
    );

    this.logger.debug(
      `Extraction ${expeditionId} now EXPLOITING, completion scheduled at ${exploitationEndsAt.toISOString()}`,
    );
  }

  /**
   * Completion: EXPLOITING → RETURNING. Computes the extracted amount
   * (clamped by `remainingCapacity`), decrements the site, depletes +
   * respawns when the site runs dry, and schedules the return job exactly
   * like the caravan return (same queue/shape/singletonKey).
   */
  async handleCompletion(expeditionId: string): Promise<void> {
    const returnAt = await withSerializableRetry(
      () =>
        this.prisma.$transaction(
          async (tx): Promise<Date | undefined> => {
            const expedition = await tx.expedition.findUnique({
              where: { id: expeditionId },
            });
            if (!expedition) {
              this.logger.warn(`Expedition ${expeditionId} not found`);
              return undefined;
            }
            if (expedition.status !== 'EXPLOITING') {
              this.logger.debug(
                `Extraction completion no-op: expedition ${expeditionId} status=${expedition.status}`,
              );
              return undefined;
            }
            if (
              !expedition.extractionSiteId ||
              !expedition.extractionDurationMs ||
              !expedition.extractionVillagers
            ) {
              throw new Error(
                `Extraction expedition ${expeditionId} missing extraction fields`,
              );
            }

            const site = await tx.resourceExtractionSite.findUnique({
              where: { id: expedition.extractionSiteId },
            });
            if (!site) {
              throw new Error(
                `Extraction site ${expedition.extractionSiteId} not found for expedition ${expeditionId}`,
              );
            }

            const amount = computeExtractedAmount({
              villagers: expedition.extractionVillagers,
              elapsedMs: expedition.extractionDurationMs,
              remainingCapacity: site.remainingCapacity,
            });

            const updatedSite = await tx.resourceExtractionSite.update({
              where: { id: site.id },
              data: { remainingCapacity: { decrement: amount } },
            });

            await this.depleteAndRespawnIfExhausted(tx, updatedSite);

            const returnAt = new Date(Date.now() + expedition.outboundTravelMs);
            const loot = encodeCombatLoot({
              resources: this.resourceLoot(site.resourceType, amount),
            });

            await tx.expedition.update({
              where: { id: expeditionId },
              data: {
                status: 'RETURNING',
                returnAt,
                loot,
              },
            });

            return returnAt;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      this.logger,
      'extraction-completion',
    );

    if (!returnAt) return;

    await this.boss.send(
      'combat:return',
      { expeditionId },
      {
        startAfter: returnAt,
        singletonKey: `return:${expeditionId}`,
      },
    );

    this.logger.debug(
      `Extraction ${expeditionId} completed, returning at ${returnAt.toISOString()}`,
    );
  }

  /**
   * Return: RETURNING → deleted. Credits extracted resources (direct
   * increment, mirrors caravan/raid — no warehouse cap at credit), restores
   * escort units to `UnitInventory`, releases the locked villagers, emits
   * `extraction.returned`.
   */
  async handleReturn(expeditionId: string): Promise<void> {
    await withSerializableRetry(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            const expedition = await tx.expedition.findUnique({
              where: { id: expeditionId },
            });
            if (!expedition) {
              this.logger.warn(`Expedition ${expeditionId} not found`);
              return;
            }
            if (
              expedition.kind !== 'EXTRACTION' ||
              expedition.status !== 'RETURNING'
            ) {
              this.logger.debug(
                `Extraction return no-op: expedition ${expeditionId} kind=${expedition.kind} status=${expedition.status}`,
              );
              return;
            }

            const resources = parseCaravanResources(expedition);
            if (
              resources.wood > 0 ||
              resources.stone > 0 ||
              resources.iron > 0
            ) {
              await tx.resourceStock.update({
                where: { villageId: expedition.attackerVillageId },
                data: {
                  wood: { increment: resources.wood },
                  stone: { increment: resources.stone },
                  iron: { increment: resources.iron },
                },
              });
              await this.outbox.resourcesChanged(
                expedition.attackerVillageId,
                tx,
              );
            }

            const escortUnits = parseUnitMap(
              expedition.units,
              'expedition.units',
            );
            for (const [unitType, quantity] of Object.entries(escortUnits)) {
              if (!quantity || quantity <= 0) continue;
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
                update: { quantity: { increment: quantity } },
              });
            }

            if (expedition.extractionVillagers) {
              await tx.population.update({
                where: { villageId: expedition.attackerVillageId },
                data: { used: { decrement: expedition.extractionVillagers } },
              });
            }

            await tx.expedition.delete({ where: { id: expeditionId } });

            await createOutboxEvent(
              tx,
              'extraction.returned',
              expedition.attackerVillageId,
              {
                expeditionId: expedition.id,
                worldId: expedition.worldId,
                villageId: expedition.attackerVillageId,
                resources,
              },
            );

            this.logger.debug(
              `Extraction ${expeditionId} returned, credited ${JSON.stringify(resources)}`,
            );
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      this.logger,
      'extraction-return',
    );
  }

  /**
   * Interception (T6): an ATTACK expedition targeting an EXTRACTION_SITE
   * arrives. Routed here by `combat.worker` — no CombatStrategy, no
   * CombatContext extension (ADR: sites stay out of glory/reports/conquest).
   *
   * - Empty site (no EXPLOITING victim on it): attacker returns home
   *   bredouille, no Outbox event.
   * - Victim present: resolve attacker vs escort via the shared
   *   `calculateCombatOutcome` helper (combat-resolution.ts), with the
   *   world's real config (`combat.attackBonus`/`defenseBonus`/etc. via
   *   `WorldConfigService`) but structurally neutral (no wall/building/
   *   strategy — mirrors the caravan path being out of village combat
   *   machinery).
   *   Victory → partial theft of the accrued-but-unsecured stock, capped by
   *   both `EXTRACTION_STEAL_RATIO` and the attacker's surviving carry
   *   capacity; site decremented by the full accrued amount (not just the
   *   stolen part — the rest is lost, not banked); victim returns early with
   *   the remainder. Defeat → exploitation continues untouched, victim
   *   escort takes losses (villagers are never harmed — run decision), and
   *   the attacker returns (or is annihilated, mirroring the village
   *   no-survivors path: RESOLVED with no return leg).
   *
   * No CombatReport is written for this resolution (run decision — a typed
   * report is future-ticketed debt).
   */
  async handleInterception(attackerExpeditionId: string): Promise<void> {
    const returnJobs = await withSerializableRetry(
      () =>
        this.prisma.$transaction(
          async (tx): Promise<{ expeditionId: string; returnAt: Date }[]> => {
            const attacker = await tx.expedition.findUnique({
              where: { id: attackerExpeditionId },
            });
            if (!attacker) {
              this.logger.warn(`Expedition ${attackerExpeditionId} not found`);
              return [];
            }
            if (
              attacker.kind !== 'ATTACK' ||
              attacker.targetKind !== 'EXTRACTION_SITE' ||
              attacker.status !== 'EN_ROUTE'
            ) {
              this.logger.debug(
                `Extraction interception no-op: expedition ${attackerExpeditionId} kind=${attacker.kind} targetKind=${attacker.targetKind} status=${attacker.status}`,
              );
              return [];
            }

            const site = await tx.resourceExtractionSite.findUnique({
              where: { id: attacker.targetRefId },
            });
            if (!site) {
              throw new Error(
                `Extraction site ${attacker.targetRefId} not found for interception ${attackerExpeditionId}`,
              );
            }

            const victim = await tx.expedition.findFirst({
              where: {
                extractionSiteId: site.id,
                kind: 'EXTRACTION',
                status: 'EXPLOITING',
              },
            });

            const attackerUnits = parseUnitMap(
              attacker.units,
              'expedition.units',
            );

            // Edge case: the victim's own extraction team arrives EXPLOITING
            // after this attack was already dispatched (attacker sent it
            // before their own team's arrival). Same user on both sides:
            // treat as an empty site — no combat, no Outbox event, the
            // exploitation stays intact.
            const isSelfIntercept =
              victim &&
              (await this.sameOwner(
                tx,
                attacker.attackerVillageId,
                victim.attackerVillageId,
              ));

            if (!victim || isSelfIntercept) {
              // Site empty (or self-intercept): attacker returns home
              // bredouille, no Outbox event.
              const returnAt = new Date(Date.now() + attacker.outboundTravelMs);
              await tx.expedition.update({
                where: { id: attacker.id },
                data: {
                  status: 'RETURNING',
                  returnAt,
                  survivingUnits: encodeUnitMap(attackerUnits),
                  loot: encodeCombatLoot({
                    resources: { wood: 0, stone: 0, iron: 0 },
                  }),
                },
              });
              return [{ expeditionId: attacker.id, returnAt }];
            }

            const escortUnits = parseUnitMap(victim.units, 'expedition.units');
            const outcome =
              Object.keys(escortUnits).length > 0
                ? calculateCombatOutcome(
                    await this.buildNeutralCombatContext(
                      site.worldId,
                      attackerUnits,
                      escortUnits,
                    ),
                  )
                : {
                    lossesAttacker: {},
                    lossesDefender: {},
                    survivingAttacker: { ...attackerUnits },
                    survivingDefender: {},
                  };

            const isVictory = isVictoryForAttacker(
              outcome.lossesAttacker,
              attackerUnits,
            );

            const { jobs, stolen } = isVictory
              ? await this.resolveInterceptionVictory(tx, {
                  attacker,
                  victim,
                  site,
                  outcome,
                })
              : await this.resolveInterceptionDefeat(tx, {
                  attacker,
                  victim,
                  outcome,
                });

            await createOutboxEvent(
              tx,
              'extraction.attacked',
              victim.attackerVillageId,
              {
                expeditionId: victim.id,
                worldId: site.worldId,
                villageId: victim.attackerVillageId,
                siteId: site.id,
                interrupted: isVictory,
                stolen,
              },
            );

            return jobs;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      this.logger,
      'extraction-interception',
    );

    for (const job of returnJobs) {
      await this.scheduleReturn(job.expeditionId, job.returnAt);
    }
  }

  /**
   * Attacker wins: steals `EXTRACTION_STEAL_RATIO` of the prorated accrued
   * amount since exploitation start, capped by the attacker's surviving
   * carry capacity. Site is decremented by the *full* accrued amount (the
   * unstolen remainder is lost, not banked — "vol partiel", never a
   * jackpot). Depletes + respawns the site if it runs dry. Victim returns
   * immediately with what's left; attacker returns with the stolen goods.
   */
  private async resolveInterceptionVictory(
    tx: PrismaClientOrTx,
    args: {
      attacker: {
        id: string;
        attackerVillageId: string;
        outboundTravelMs: number;
      };
      victim: {
        id: string;
        attackerVillageId: string;
        outboundTravelMs: number;
        exploitationEndsAt: Date | null;
        extractionDurationMs: number | null;
        extractionVillagers: number | null;
      };
      site: ResourceExtractionSite;
      outcome: {
        lossesAttacker: UnitMap;
        lossesDefender: UnitMap;
        survivingAttacker: UnitMap;
        survivingDefender: UnitMap;
      };
    },
  ): Promise<{
    jobs: { expeditionId: string; returnAt: Date }[];
    stolen: { wood: number; stone: number; iron: number };
  }> {
    const { attacker, victim, site, outcome } = args;

    if (
      !victim.exploitationEndsAt ||
      !victim.extractionDurationMs ||
      !victim.extractionVillagers
    ) {
      throw new Error(
        `Extraction expedition ${victim.id} missing extraction fields for interception`,
      );
    }

    // Release population for units killed on both sides — mirrors
    // combat.worker's sumPopulationCost/decrement (dead units free their pop
    // immediately, same as village combat resolution).
    await this.releasePopulationForLosses(
      tx,
      attacker.attackerVillageId,
      outcome.lossesAttacker,
    );
    await this.releasePopulationForLosses(
      tx,
      victim.attackerVillageId,
      outcome.lossesDefender,
    );

    const exploitationStartedAt = new Date(
      victim.exploitationEndsAt.getTime() - victim.extractionDurationMs,
    );
    const elapsedMs = Math.min(
      Math.max(Date.now() - exploitationStartedAt.getTime(), 0),
      victim.extractionDurationMs,
    );
    const accrued = computeExtractedAmount({
      villagers: victim.extractionVillagers,
      elapsedMs,
      remainingCapacity: site.remainingCapacity,
    });
    const stolenBase = Math.floor(accrued * EXTRACTION_STEAL_RATIO);
    const carryCapacity = this.sumCarryCapacity(outcome.survivingAttacker);
    const stolen = Math.min(stolenBase, carryCapacity);
    const stolenResources = this.resourceLoot(site.resourceType, stolen);

    const updatedSite = await tx.resourceExtractionSite.update({
      where: { id: site.id },
      data: { remainingCapacity: { decrement: accrued } },
    });
    await this.depleteAndRespawnIfExhausted(tx, updatedSite);

    const victimReturnAt = new Date(Date.now() + victim.outboundTravelMs);
    await tx.expedition.update({
      where: { id: victim.id },
      data: {
        status: 'RETURNING',
        returnAt: victimReturnAt,
        units: encodeUnitMap(outcome.survivingDefender),
        loot: encodeCombatLoot({
          resources: this.resourceLoot(site.resourceType, accrued - stolen),
        }),
      },
    });

    const attackerReturnAt = new Date(Date.now() + attacker.outboundTravelMs);
    await tx.expedition.update({
      where: { id: attacker.id },
      data: {
        status: 'RETURNING',
        returnAt: attackerReturnAt,
        survivingUnits: encodeUnitMap(outcome.survivingAttacker),
        loot: encodeCombatLoot({ resources: stolenResources }),
      },
    });

    return {
      jobs: [
        { expeditionId: victim.id, returnAt: victimReturnAt },
        { expeditionId: attacker.id, returnAt: attackerReturnAt },
      ],
      stolen: stolenResources,
    };
  }

  /**
   * Attacker loses: exploitation continues untouched (`exploitationEndsAt`
   * unchanged, completion job intact — never re-scheduled here). Victim
   * escort takes the resolved losses (villagers are never harmed). Attacker
   * survivors return home empty-handed; total annihilation mirrors the
   * village no-survivors path (RESOLVED, no return leg).
   */
  private async resolveInterceptionDefeat(
    tx: PrismaClientOrTx,
    args: {
      attacker: {
        id: string;
        attackerVillageId: string;
        outboundTravelMs: number;
      };
      victim: { id: string; attackerVillageId: string };
      outcome: {
        lossesAttacker: UnitMap;
        lossesDefender: UnitMap;
        survivingAttacker: UnitMap;
        survivingDefender: UnitMap;
      };
    },
  ): Promise<{
    jobs: { expeditionId: string; returnAt: Date }[];
    stolen: { wood: number; stone: number; iron: number };
  }> {
    const { attacker, victim, outcome } = args;
    const noStolen = { wood: 0, stone: 0, iron: 0 };

    // Release population for units killed on both sides — mirrors
    // combat.worker's sumPopulationCost/decrement.
    await this.releasePopulationForLosses(
      tx,
      attacker.attackerVillageId,
      outcome.lossesAttacker,
    );
    await this.releasePopulationForLosses(
      tx,
      victim.attackerVillageId,
      outcome.lossesDefender,
    );

    await tx.expedition.update({
      where: { id: victim.id },
      data: { units: encodeUnitMap(outcome.survivingDefender) },
    });

    const hasSurvivors = Object.values(outcome.survivingAttacker).some(
      (quantity) => (quantity ?? 0) > 0,
    );

    if (!hasSurvivors) {
      await tx.expedition.update({
        where: { id: attacker.id },
        data: {
          status: 'RESOLVED',
          survivingUnits: encodeUnitMap({}),
          loot: encodeCombatLoot({ resources: noStolen }),
        },
      });
      return { jobs: [], stolen: noStolen };
    }

    const returnAt = new Date(Date.now() + attacker.outboundTravelMs);
    await tx.expedition.update({
      where: { id: attacker.id },
      data: {
        status: 'RETURNING',
        returnAt,
        survivingUnits: encodeUnitMap(outcome.survivingAttacker),
        loot: encodeCombatLoot({ resources: noStolen }),
      },
    });

    return {
      jobs: [{ expeditionId: attacker.id, returnAt }],
      stolen: noStolen,
    };
  }

  /**
   * Release `villageId`'s population for units killed in interception combat —
   * same accounting as `combat.worker`'s `sumPopulationCost` +
   * `tx.population.update({ used: { decrement } })` for village combat.
   */
  private async releasePopulationForLosses(
    tx: PrismaClientOrTx,
    villageId: string,
    losses: UnitMap,
  ): Promise<void> {
    const popReleased = sumPopulationCost(losses);
    if (popReleased <= 0) return;
    await tx.population.update({
      where: { villageId },
      data: { used: { decrement: popReleased } },
    });
  }

  private async scheduleReturn(
    expeditionId: string,
    returnAt: Date,
  ): Promise<void> {
    await this.boss.send(
      'combat:return',
      { expeditionId },
      {
        startAfter: returnAt,
        singletonKey: `return:${expeditionId}`,
      },
    );
  }

  /**
   * True when both expeditions' origin villages belong to the same user.
   */
  private async sameOwner(
    tx: PrismaClientOrTx,
    attackerVillageId: string,
    victimVillageId: string,
  ): Promise<boolean> {
    const [attackerVillage, victimVillage] = await Promise.all([
      tx.village.findUnique({
        where: { id: attackerVillageId },
        select: { userId: true },
      }),
      tx.village.findUnique({
        where: { id: victimVillageId },
        select: { userId: true },
      }),
    ]);
    return (
      attackerVillage?.userId != null &&
      attackerVillage.userId === victimVillage?.userId
    );
  }

  /**
   * Neutral CombatContext for the interception fight: no wall/building
   * modifiers, no strategy bonuses — attacker vs a single escort
   * "participant" built from the raw UnitMap. Structural neutrality is
   * preserved (no defender village/building/strategy), but the world's real
   * config drives `combat.attackBonus`/`defenseBonus`/etc. so a world tempo
   * or combat-balance override isn't silently ignored, matching the caravan
   * path being out of the village combat machinery (no CombatStrategy, no
   * CombatContext extension).
   */
  private async buildNeutralCombatContext(
    worldId: string,
    attackerUnits: UnitMap,
    escortUnits: UnitMap,
  ): Promise<CombatContext> {
    const config = await this.worldConfig.getConfig(worldId);
    return {
      worldId,
      expedition: {} as CombatContext['expedition'],
      attacker: {
        village: {
          id: '',
          name: '',
          x: 0,
          y: 0,
          userId: null,
          isBarbarian: false,
        },
        units: attackerUnits,
      },
      defender: {
        kind: 'PLAYER_VILLAGE',
        units: escortUnits,
        participants: [{ villageId: 'extraction-escort', units: escortUnits }],
      },
      config: {
        ...config,
        _distance: 0,
        _travelTime: 0,
      },
    };
  }

  /** Sum of `carryCapacity` across a UnitMap — mirrors `LootManager`'s private helper, no dependency on the loot pipeline (which expects a defender resource stock, irrelevant here). */
  private sumCarryCapacity(units: UnitMap): number {
    let total = 0;
    for (const [unitType, quantity] of typedEntries(units)) {
      const stats = getUnitStats(unitType);
      if (stats?.carryCapacity) {
        total += stats.carryCapacity * quantity;
      }
    }
    return total;
  }

  private async depleteAndRespawnIfExhausted(
    tx: PrismaClientOrTx,
    site: ResourceExtractionSite,
  ): Promise<void> {
    // Idempotence guard: a site already DEPLETED (or with capacity left) must
    // never be re-depleted/re-respawned — guards against completion +
    // interception both racing to deplete the same exhausted site, which
    // would double-emit `extraction.depleted` and respawn twice.
    if (site.state !== 'ACTIVE' || site.remainingCapacity > 0) return;

    await tx.resourceExtractionSite.update({
      where: { id: site.id },
      data: { state: 'DEPLETED', depletedAt: new Date() },
    });
    await createOutboxEvent(tx, 'extraction.depleted', site.id, {
      worldId: site.worldId,
      siteId: site.id,
      resourceType: site.resourceType,
    });
    await this.siteSeeding.respawnSite(tx, site.worldId, site.resourceType);
  }

  private resourceLoot(
    resourceType: ExtractionResourceType,
    amount: number,
  ): { wood: number; stone: number; iron: number } {
    return {
      wood: resourceType === 'WOOD' ? amount : 0,
      stone: resourceType === 'STONE' ? amount : 0,
      iron: resourceType === 'IRON' ? amount : 0,
    };
  }
}
