import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BUILDING_TYPES } from '@battleforthecrown/shared/village';
import { WATCHTOWER_VISION_LEVELS } from '@battleforthecrown/shared/village';
import type {
  BuildingCompletedPayload,
  EventKind,
  PayloadForKind,
} from '../event/event-types';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import { BarbarianVillageFactory } from './barbarian-village.factory';

interface Position {
  x: number;
  y: number;
}

/**
 * Creates the weakened "narrative" barbarian village that the onboarding
 * tutorial points at for its final ATTACK_BARBARIAN step. The target is a
 * dedicated T1 village with ONBOARDING_NARRATIVE origin — distinct from the
 * standard barbarian seeding so the global T1 pool stays a real adversary
 * (cf. run 054, `docs/gameplay/15-onboarding.md`).
 *
 * Trigger: the dispatch loop calls `handleEvent` on every Outbox event; we
 * only react to `building.completed` with WATCHTOWER level ≥ 1. The creation
 * is idempotent via `OnboardingState.narrativeTargetVillageId` (unique).
 */
@Injectable()
export class OnboardingNarrativeTargetService {
  private readonly logger = new Logger(OnboardingNarrativeTargetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
    private readonly factory: BarbarianVillageFactory,
  ) {}

  async handleEvent<K extends EventKind>(
    kind: K,
    payload: PayloadForKind<K>,
  ): Promise<void> {
    if (kind !== 'building.completed') return;
    const event = payload as BuildingCompletedPayload;
    if (event.buildingType !== BUILDING_TYPES.WATCHTOWER || event.level < 1) {
      return;
    }

    await this.ensureForVillage(event.villageId);
  }

  /**
   * Idempotent. Returns the village id of the narrative target (existing or
   * freshly created), or `null` when the owner has no active onboarding state
   * (e.g. the watchtower belongs to a non-anchor village). Public so tests and
   * the smoke harness can drive it explicitly.
   */
  async ensureForVillage(triggerVillageId: string): Promise<string | null> {
    return this.prisma.$transaction(async (tx) => {
      const triggerVillage = await tx.village.findUnique({
        where: { id: triggerVillageId },
        select: { id: true, userId: true, worldId: true, x: true, y: true },
      });
      if (!triggerVillage?.userId) return null;

      const state = await tx.onboardingState.findUnique({
        where: {
          userId_worldId: {
            userId: triggerVillage.userId,
            worldId: triggerVillage.worldId,
          },
        },
        select: {
          id: true,
          status: true,
          firstVillageId: true,
          narrativeTargetVillageId: true,
        },
      });
      if (!state || state.status !== 'ACTIVE') return null;

      // Only the anchor village (the one that bootstrapped onboarding) triggers
      // the narrative target. A second village belonging to the same player
      // building a watchtower must not spawn a duplicate.
      if (state.firstVillageId !== triggerVillage.id) return null;

      if (state.narrativeTargetVillageId) {
        const existing = await tx.village.findUnique({
          where: { id: state.narrativeTargetVillageId },
          select: { id: true },
        });
        if (existing) return existing.id;
        // FK is ON DELETE SET NULL: if the target was wiped externally, drop
        // the dangling pointer and re-create below.
        await tx.onboardingState.update({
          where: { id: state.id },
          data: { narrativeTargetVillageId: null },
        });
      }

      const config = await this.worldConfig.getConfig(triggerVillage.worldId);
      const seeding = config.barbarianSeeding;
      const world = await tx.world.findUniqueOrThrow({
        where: { id: triggerVillage.worldId },
        select: { gridWidth: true, gridHeight: true },
      });
      const watchtowerRadius =
        WATCHTOWER_VISION_LEVELS[1]?.visibilityRadius ?? 10;

      const position = await this.pickReachablePosition(tx, {
        worldId: triggerVillage.worldId,
        centerX: triggerVillage.x,
        centerY: triggerVillage.y,
        gridWidth: world.gridWidth,
        gridHeight: world.gridHeight,
        minDistance: Math.max(1, seeding?.rMin ?? 4),
        maxDistance: watchtowerRadius,
        minSpacing: seeding?.minSpacing ?? 6,
        playerExclusion: seeding?.playerExclusion ?? 2,
      });

      if (!position) {
        this.logger.warn(
          `Could not place onboarding narrative target near anchor village ${triggerVillage.id} ` +
            `at (${triggerVillage.x}, ${triggerVillage.y}) in world ${triggerVillage.worldId}`,
        );
        return null;
      }

      try {
        const village = await this.factory.create(tx, {
          worldId: triggerVillage.worldId,
          tier: 'T1',
          x: position.x,
          y: position.y,
          originKind: 'ONBOARDING_NARRATIVE',
        });
        await tx.onboardingState.update({
          where: { id: state.id },
          data: { narrativeTargetVillageId: village.id },
        });
        this.logger.log(
          `Spawned onboarding narrative target ${village.id} at (${position.x}, ${position.y}) ` +
            `for anchor ${triggerVillage.id} in world ${triggerVillage.worldId}`,
        );
        return village.id;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          // Tile collision (rare race with normal seeding) — abandon this run,
          // the next dispatch will retry through the same idempotent path.
          this.logger.debug(
            `Tile (${position.x}, ${position.y}) already occupied, skipping narrative target spawn`,
          );
          return null;
        }
        throw error;
      }
    });
  }

  private async pickReachablePosition(
    tx: Prisma.TransactionClient,
    params: {
      worldId: string;
      centerX: number;
      centerY: number;
      gridWidth: number;
      gridHeight: number;
      minDistance: number;
      maxDistance: number;
      minSpacing: number;
      playerExclusion: number;
    },
  ): Promise<Position | null> {
    const {
      worldId,
      centerX,
      centerY,
      gridWidth,
      gridHeight,
      minDistance,
      maxDistance,
      minSpacing,
      playerExclusion,
    } = params;

    if (maxDistance < minDistance) return null;

    const halo = maxDistance + minSpacing;
    const nearby = await tx.village.findMany({
      where: {
        worldId,
        x: {
          gte: Math.floor(centerX - halo),
          lte: Math.ceil(centerX + halo),
        },
        y: {
          gte: Math.floor(centerY - halo),
          lte: Math.ceil(centerY + halo),
        },
      },
      select: { x: true, y: true, isBarbarian: true },
    });
    const existing = nearby.map(({ x, y }) => ({ x, y }));
    const players = nearby
      .filter((v) => !v.isBarbarian)
      .map(({ x, y }) => ({ x, y }));

    const candidates: Position[] = [];
    const minX = Math.max(0, Math.floor(centerX - maxDistance));
    const maxX = Math.min(gridWidth - 1, Math.ceil(centerX + maxDistance));
    const minY = Math.max(0, Math.floor(centerY - maxDistance));
    const maxY = Math.min(gridHeight - 1, Math.ceil(centerY + maxDistance));

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const distance = Math.hypot(x - centerX, y - centerY);
        if (distance < minDistance || distance > maxDistance) continue;
        if (
          players.some((v) => Math.hypot(x - v.x, y - v.y) < playerExclusion)
        ) {
          continue;
        }
        if (existing.some((v) => Math.hypot(x - v.x, y - v.y) < minSpacing)) {
          continue;
        }
        candidates.push({ x, y });
      }
    }

    candidates.sort((a, b) => {
      const da = Math.hypot(a.x - centerX, a.y - centerY);
      const db = Math.hypot(b.x - centerX, b.y - centerY);
      if (da !== db) return da - db;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    return candidates[0] ?? null;
  }
}
