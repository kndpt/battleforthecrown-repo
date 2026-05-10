import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';

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
    });
    if (!world) {
      throw new NotFoundException(`World ${worldId} not found`);
    }

    const playerCount = await this.prisma.worldMembership.count({
      where: { worldId },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { config: _config, ...summary } = world;
    return { ...summary, playerCount };
  }

  async getWorldConfig(worldId: string) {
    return this.worldConfigService.getConfig(worldId);
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
}
