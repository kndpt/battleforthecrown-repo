import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { PrismaClientOrTx } from '../../common/prisma.types';

@Injectable()
export class WorldAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertWorldWritable(
    worldId: string,
    reader: PrismaClientOrTx = this.prisma,
  ): Promise<void> {
    const world = await reader.world.findUnique({
      where: { id: worldId },
      select: { status: true },
    });
    if (!world) throw new NotFoundException(`World ${worldId} not found`);
    if (world.status === 'ENDED' || world.status === 'ARCHIVED') {
      throw new ForbiddenException({
        message: 'This world has ended and is read-only.',
        code: 'WORLD_READ_ONLY',
      });
    }
  }

  /**
   * Lecture seule, sans throw : un monde `ARCHIVED` (run 065) a vu ses données
   * joueur purgées. Les reads side-effecting (upserts/créations paresseuses)
   * doivent court-circuiter leur écriture pour ne jamais recréer d'orphelin
   * post-purge. Distinct de `assertWorldWritable` : `ENDED` reste consultable
   * (fenêtre 7 j) donc ses reads paresseux restent autorisés.
   */
  async isWorldArchived(
    worldId: string,
    reader: PrismaClientOrTx = this.prisma,
  ): Promise<boolean> {
    const world = await reader.world.findUnique({
      where: { id: worldId },
      select: { status: true },
    });
    return world?.status === 'ARCHIVED';
  }
}
