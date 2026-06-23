import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PowerService } from '../power/power.service';
import { NewbieShieldService } from '../world/newbie-shield.service';
import type { PublicPlayerProfileResponse } from '@battleforthecrown/shared';

/**
 * Read-only, world-scoped public profile of a player observed from the map.
 *
 * Exposes ONLY spec-public fields (09 § Visibilité): displayName + kingdom
 * power + newbie-shield state. The shield state is read live via
 * {@link NewbieShieldService} (no new source of truth). An inactive shield is
 * mapped to `null` (spec 14 § 3 — no explicit "exposed" signal).
 */
@Injectable()
export class PublicProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly powerService: PowerService,
    private readonly newbieShield: NewbieShieldService,
  ) {}

  async getPublicProfile(
    userId: string,
    worldId: string,
  ): Promise<PublicPlayerProfileResponse> {
    // Membership is the canonical gate: a barbarian (no User) or a user who
    // never joined this world has no membership → 404. Reusing the unique
    // (userId, worldId) constraint keeps the world-scope invariant explicit.
    const membership = await this.prisma.worldMembership.findUnique({
      where: { userId_worldId: { userId, worldId } },
      select: { user: { select: { displayName: true } } },
    });

    if (!membership) {
      throw new NotFoundException('USER_NOT_MEMBER_OF_WORLD');
    }

    const shieldState = await this.newbieShield.getMembershipShieldState(
      userId,
      worldId,
    );
    const { kingdomPower } = await this.powerService.getPublicKingdomPower(
      userId,
      worldId,
    );

    return {
      userId,
      displayName: membership.user.displayName,
      kingdomPower,
      newbieShield: shieldState?.active
        ? { active: true, endsAt: shieldState.endsAt }
        : null,
    };
  }
}
