import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async assertVillageOwnedBy(villageId: string, userId: string): Promise<void> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: { userId: true },
    });
    if (!village) {
      throw new NotFoundException(`Village ${villageId} not found`);
    }
    if (village.userId !== userId) {
      throw new ForbiddenException('You do not own this village');
    }
  }

  async assertWorldMember(worldId: string, userId: string): Promise<void> {
    const membership = await this.prisma.worldMembership.findUnique({
      where: { userId_worldId: { userId, worldId } },
      select: { userId: true },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this world');
    }
  }
}
