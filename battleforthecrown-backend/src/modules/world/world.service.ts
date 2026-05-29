import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import {
  WorldConfigSchema,
  InscriptionPhase,
  deriveInscriptionPhase,
  deriveWorldDayCounter,
  PublicWorldStatusSchema,
  TempoService,
  type PublicWorld,
  type WorldConfig,
} from '@battleforthecrown/shared/world';

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
      where: { status: { in: ['PLANNED', 'OPEN', 'LOCKED'] } },
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
          inscriptionPhase,
          startedAt: toIsoString(world.startedAt),
          endsAt: toIsoString(world.endsAt),
          plannedOpenAt:
            world.status === 'PLANNED'
              ? toIsoString(world.plannedOpenAt)
              : null,
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

  async getUserMemberships(userId: string) {
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

    return memberships.map((m) => ({
      worldId: m.worldId,
      worldName: m.world.name,
      role: m.role,
      joinedAt: m.joinedAt,
      lastLoginAt: m.lastLoginAt,
      villageCount: countByWorld.get(m.worldId) ?? 0,
    }));
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
