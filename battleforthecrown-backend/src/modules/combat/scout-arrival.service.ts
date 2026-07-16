import { Injectable, Logger, Inject } from '@nestjs/common';
import { Expedition } from '@prisma/client';
import PgBoss from 'pg-boss';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { createOutboxEvent } from '../event/event.utils';
import { encodeUnitMap, parseUnitMap } from './codecs';
import { WorldConfigService } from '../world/world-config.service';
import { BarbarianRuntimeService } from '../world/barbarian-runtime.service';
import { NewbieShieldService } from '../world/newbie-shield.service';
import { FriendshipService } from '../friendship/friendship.service';
import { IntelService } from '../intel/intel.service';
import { findBuildingByType } from '@battleforthecrown/shared/village';
import { computeInactivityState } from '@battleforthecrown/shared/world';
import {
  deriveScoutPrecision,
  isIntelCompositionRevealed,
  isStrategyRevealed,
  representativeIntelResources,
  representativeIntelUnits,
  scoutSpyCount,
} from '@battleforthecrown/shared/combat';
import { type UnitMap } from '@battleforthecrown/shared/army';

/**
 * Scout arrival lifecycle: snapshots the target (units/resources/wall/castle +
 * shield/friends/inactivity badges), writes the scout report + intel record,
 * flips the expedition to RETURNING and schedules its return.
 *
 * Runs inside the caller's `combat:resolve` transaction (`tx` is passed in) —
 * `CombatWorker` only routes by expedition kind, mirroring how
 * `ExtractionLifecycleService` owns the extraction path.
 */
@Injectable()
export class ScoutArrivalService {
  private readonly logger = new Logger(ScoutArrivalService.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly worldConfig: WorldConfigService,
    private readonly barbarianRuntime: BarbarianRuntimeService,
    private readonly newbieShield: NewbieShieldService,
    private readonly friendship: FriendshipService,
    private readonly intelService: IntelService,
  ) {}

  async handleArrival(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ): Promise<void> {
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
    // Snapshot de l'inactivité pré-abandon du propriétaire de la cible au
    // moment du scout (PLAYER only) → badge figé sur le rapport (spec 18).
    // Dérivé en lecture seule de `WorldMembership.lastLoginAt` : jamais le
    // timestamp brut, seul l'état + `sinceDays` figés sortent. Absent si le
    // propriétaire est ACTIVE ou pour une cible barbare. Figé comme
    // wallLevel/newbieShield : non recalculé live après le scout.
    const inactivitySnapshot =
      expedition.targetKind === 'PLAYER_VILLAGE' && targetVillage.userId
        ? await this.snapshotOwnerInactivity(
            tx,
            targetVillage.userId,
            expedition.worldId,
          )
        : null;

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
          ...(inactivitySnapshot ? { inactivity: inactivitySnapshot } : {}),
          // Natural trait snapshot (spec 27) — present for BOTH player and
          // barbarian targets (every village has one). Fixed to the tile, so a
          // single snapshot is authoritative (never recomputed live).
          naturalTrait: targetVillage.naturalTrait,
        },
      },
    });

    // Cohérence carnet d'intel (run 090) : le carnet ne doit pas exposer plus
    // de précision que le rapport. On dérive le palier depuis le nombre
    // d'ESPIONS et on coarse la compo/stock (valeurs représentatives), en ne
    // révélant compo/stock/style qu'à partir du palier RANGED.
    const scoutPrecision = deriveScoutPrecision(
      scoutSpyCount(parseUnitMap(expedition.units, 'expedition.units')),
    );
    const intelStrategy =
      expedition.targetKind === 'PLAYER_VILLAGE' &&
      isStrategyRevealed(scoutPrecision)
        ? (targetVillage.strategyConfig?.strategy ?? null)
        : null;

    await this.intelService.recordIntel(tx, {
      userId: attackerVillage.userId,
      worldId: expedition.worldId,
      targetVillageId: targetVillage.id,
      sourceKind: 'SCOUT',
      sourceReportId: report.id,
      units: representativeIntelUnits(snapshot.units, scoutPrecision),
      resources: representativeIntelResources(
        snapshot.resources,
        scoutPrecision,
      ),
      compositionRevealed: isIntelCompositionRevealed(scoutPrecision),
      wallLevel,
      strategy: intelStrategy,
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

  private async snapshotOwnerInactivity(
    tx: PrismaClientOrTx,
    ownerUserId: string,
    worldId: string,
  ): Promise<{ state: 'INACTIVE'; sinceDays: number } | null> {
    const membership = await tx.worldMembership.findUnique({
      where: { userId_worldId: { userId: ownerUserId, worldId } },
      select: { lastLoginAt: true },
    });
    const status = computeInactivityState(
      membership?.lastLoginAt ?? null,
      new Date(),
    );
    return status.state === 'INACTIVE'
      ? { state: 'INACTIVE', sinceDays: status.sinceDays }
      : null;
  }
}
