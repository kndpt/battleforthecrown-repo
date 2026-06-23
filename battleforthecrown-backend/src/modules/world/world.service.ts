import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import {
  WorldConfigSchema,
  InscriptionPhase,
  deriveInscriptionPhase,
  deriveWorldDayCounter,
  deriveWorldArchiveAt,
  PublicWorldStatusSchema,
  TempoService,
  type PublicWorld,
  type WorldConfig,
  type WorldMembershipResponse,
} from '@battleforthecrown/shared/world';
import {
  buildShieldState,
  type NewbieShieldState,
} from '@battleforthecrown/shared';

@Injectable()
export class WorldService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfigService: WorldConfigService,
  ) {}

  async getWorlds() {
    const worlds = await this.prisma.world.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const counts = await this.prisma.worldMembership.groupBy({
      by: ['worldId'],
      _count: { _all: true },
      where: { worldId: { in: worlds.map((w) => w.id) } },
    });

    const countByWorld = new Map(counts.map((c) => [c.worldId, c._count._all]));

    return worlds.map((world) => ({
      ...world,
      playerCount: countByWorld.get(world.id) ?? 0,
    }));
  }

  async getWorldDetails(worldId: string) {
    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
      select: {
        id: true,
        name: true,
        status: true,
        gridWidth: true,
        gridHeight: true,
        continentWidth: true,
        continentHeight: true,
        startedAt: true,
        endsAt: true,
        plannedOpenAt: true,
        createdAt: true,
      },
    });
    if (!world) {
      throw new NotFoundException(`World ${worldId} not found`);
    }

    const playerCount = await this.prisma.worldMembership.count({
      where: { worldId },
    });

    return { ...world, playerCount };
  }

  async getWorldConfig(worldId: string) {
    return this.worldConfigService.getConfig(worldId);
  }

  async getPublicWorlds(now = new Date()): Promise<PublicWorld[]> {
    const worlds = await this.prisma.world.findMany({
      // ENDED worlds stay listed (read-only consultation) until run 065
      // transitions them to ARCHIVED at endsAt + archiveAfterDays.
      where: { status: { in: ['PLANNED', 'OPEN', 'LOCKED', 'ENDED'] } },
      orderBy: [{ plannedOpenAt: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { memberships: true } } },
    });

    return worlds.map((world) => {
      const config = this.parseWorldConfig(world.id, world.config);
      const dayCounter = deriveWorldDayCounter(
        {
          startedAt: world.startedAt,
          endsAt: world.endsAt,
          config,
        },
        now,
      );
      const inscriptionPhase =
        world.status === 'OPEN'
          ? deriveInscriptionPhase(
              {
                startedAt: world.startedAt,
                endsAt: world.endsAt,
                config,
              },
              now,
            )
          : InscriptionPhase.CLOSED;

      const status = PublicWorldStatusSchema.parse(world.status);

      return {
        id: world.id,
        status,
        identity: config.identity,
        lifecycle: {
          day:
            world.status === 'PLANNED' || !world.startedAt
              ? null
              : dayCounter.day,
          totalDays: dayCounter.totalDays,
          inscriptionMainDays: config.lifecycle.inscriptionMainDays,
          inscriptionLateDays: config.lifecycle.inscriptionLateDays,
          newbieShieldHours: config.lifecycle.newbieShieldHours,
          inscriptionPhase,
          startedAt: toIsoString(world.startedAt),
          endsAt: toIsoString(world.endsAt),
          plannedOpenAt:
            world.status === 'PLANNED'
              ? toIsoString(world.plannedOpenAt)
              : null,
          archiveAt:
            world.status === 'ENDED'
              ? toIsoString(
                  deriveWorldArchiveAt({
                    startedAt: world.startedAt,
                    endsAt: world.endsAt,
                    config,
                  }),
                )
              : null,
        },
        map: {
          width: world.gridWidth,
          height: world.gridHeight,
        },
        tempoProfile: TempoService.deriveProfile(config.tempo),
        joinedCount: world._count.memberships,
      };
    });
  }

  async getWorldIdFromVillage(villageId: string): Promise<string> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: { worldId: true },
    });

    if (!village) {
      throw new NotFoundException(`Village ${villageId} not found`);
    }

    return village.worldId;
  }

  async getUserMemberships(userId: string): Promise<WorldMembershipResponse[]> {
    const memberships = await this.prisma.worldMembership.findMany({
      where: { userId },
      include: { world: true },
    });

    const villageCounts = await this.prisma.village.groupBy({
      by: ['worldId'],
      _count: { _all: true },
      where: {
        userId,
        worldId: { in: memberships.map((m) => m.worldId) },
      },
    });

    const countByWorld = new Map(
      villageCounts.map((c) => [c.worldId, c._count._all]),
    );

    const now = new Date();
    return memberships.flatMap((m) => {
      // Validate the world status before building the row. A non-public status
      // (e.g. ARCHIVED, run 065) is dropped rather than throwing on parse — the
      // UI must not route the player back into a world it can no longer enter.
      const status = PublicWorldStatusSchema.safeParse(m.world.status);
      if (!status.success) return [];

      // Reuse the already-loaded world row (include: { world: true }) instead
      // of re-fetching config per membership — avoids an N+1 on this list route.
      const shieldHours = this.parseWorldConfig(m.worldId, m.world.config)
        .lifecycle.newbieShieldHours;
      const newbieShield: NewbieShieldState = buildShieldState({
        joinedAt: m.joinedAt,
        brokenAt: m.shieldBrokenAt,
        newbieShieldHours: shieldHours,
        now,
      });
      return [
        {
          worldId: m.worldId,
          worldName: m.world.name,
          status: status.data,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          lastLoginAt: m.lastLoginAt ? m.lastLoginAt.toISOString() : null,
          villageCount: countByWorld.get(m.worldId) ?? 0,
          newbieShield,
        },
      ];
    });
  }

  async touchUserMembership(
    userId: string,
    worldId: string,
  ): Promise<WorldMembershipResponse> {
    const membership = await this.prisma.worldMembership.findUnique({
      where: { userId_worldId: { userId, worldId } },
      include: { world: true },
    });

    if (!membership) {
      throw new NotFoundException(`World ${worldId} membership not found`);
    }
    // Validate writability BEFORE the lastLoginAt write so a non-enterable world
    // (ENDED, or ARCHIVED once run 065 lands) never persists a side effect and
    // then 500s on the status parse below.
    const parsedStatus = PublicWorldStatusSchema.safeParse(
      membership.world.status,
    );
    if (!parsedStatus.success || parsedStatus.data === 'ENDED') {
      throw new BadRequestException(`World ${worldId} is not open for entry`);
    }

    const lastLoginAt = new Date();
    await this.prisma.worldMembership.update({
      where: { userId_worldId: { userId, worldId } },
      data: { lastLoginAt },
    });

    const villageCount = await this.prisma.village.count({
      where: { userId, worldId },
    });

    return {
      worldId: membership.worldId,
      worldName: membership.world.name,
      status: parsedStatus.data,
      role: membership.role,
      joinedAt: membership.joinedAt.toISOString(),
      lastLoginAt: lastLoginAt.toISOString(),
      villageCount,
    };
  }

  private parseWorldConfig(worldId: string, config: unknown): WorldConfig {
    const parsed = WorldConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new Error(
        `World ${worldId} has an invalid config: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  }
}

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}
