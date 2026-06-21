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
    if (world.status === 'ENDED') {
      throw new ForbiddenException({
        message: 'This world has ended and is read-only.',
        code: 'WORLD_READ_ONLY',
      });
    }
  }
}
