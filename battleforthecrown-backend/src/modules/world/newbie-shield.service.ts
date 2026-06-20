import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import {
  isShieldActive,
  shieldEndsAt,
  type NewbieShieldState,
} from '@battleforthecrown/shared';
import { createOutboxEvent } from '../event/event.utils';
import type { PrismaClientOrTx } from '../../common/prisma.types';

@Injectable()
export class NewbieShieldService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
  ) {}

  async getMembershipShieldState(
    userId: string,
    worldId: string,
    now: Date = new Date(),
    client: PrismaClientOrTx = this.prisma,
  ): Promise<NewbieShieldState | null> {
    const membership = await client.worldMembership.findUnique({
      where: { userId_worldId: { userId, worldId } },
      select: { joinedAt: true, shieldBrokenAt: true },
    });

    if (!membership) return null;

    const config = await this.worldConfig.getConfig(worldId);
    const hours = config.lifecycle.newbieShieldHours;
    const { joinedAt, shieldBrokenAt } = membership;

    const endsAt = shieldEndsAt({
      joinedAt,
      newbieShieldHours: hours,
    }).toISOString();
    const brokenAt = shieldBrokenAt ? shieldBrokenAt.toISOString() : null;
    const active = isShieldActive({
      joinedAt,
      brokenAt: shieldBrokenAt,
      newbieShieldHours: hours,
      now,
    });

    return { endsAt, brokenAt, active };
  }

  async assertCanAttackTarget(
    defenderUserId: string,
    worldId: string,
    tx: PrismaClientOrTx,
    now: Date = new Date(),
  ): Promise<void> {
    const state = await this.getMembershipShieldState(
      defenderUserId,
      worldId,
      now,
      tx,
    );
    if (state?.active) {
      throw new ForbiddenException('NEWBIE_SHIELD_ACTIVE');
    }
  }

  async breakAttackerShieldIfActive(
    attackerUserId: string,
    worldId: string,
    tx: PrismaClientOrTx,
    now: Date,
  ): Promise<boolean> {
    const state = await this.getMembershipShieldState(
      attackerUserId,
      worldId,
      now,
      tx,
    );
    if (!state?.active) return false;

    await tx.worldMembership.update({
      where: { userId_worldId: { userId: attackerUserId, worldId } },
      data: { shieldBrokenAt: now },
    });

    await createOutboxEvent(tx, 'pvp.shield.broken', attackerUserId, {
      userId: attackerUserId,
      worldId,
      brokenAt: now.toISOString(),
      endsAt: state.endsAt,
    });

    return true;
  }
}
