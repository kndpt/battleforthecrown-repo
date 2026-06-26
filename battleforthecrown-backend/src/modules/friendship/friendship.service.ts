import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Friendship } from '@prisma/client';
import {
  DEFENSIVE_FRIENDS_CAP,
  FRIENDSHIP_ERROR_CODES,
  type CreateFriendshipBody,
  type FriendshipDto,
  type MyFriendshipsResponse,
} from '@battleforthecrown/shared/social';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { PrismaClientOrTx } from '../../common/prisma.types';
import { OwnershipService } from '../../common/auth/ownership.service';

const FRIENDSHIP_USER_INCLUDE = {
  requesterUser: { select: { displayName: true } },
  recipientUser: { select: { displayName: true } },
} as const;

type FriendshipWithUsers = Friendship & {
  requesterUser: { displayName: string };
  recipientUser: { displayName: string };
};

/**
 * Defensive-friends lifecycle (cf. docs/gameplay/20-defensive-friends.md).
 *
 * Server-authoritative: owns the PENDING → ACTIVE transition and the
 * {@link DEFENSIVE_FRIENDS_CAP} cap, rechecked on BOTH sides at accept time
 * under a row lock so concurrent accepts can never push a player past the cap.
 */
@Injectable()
export class FriendshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  /** ACTIVE friendships of a player, counted from either side of the pair. */
  private countActive(
    reader: PrismaClientOrTx,
    worldId: string,
    userId: string,
  ): Promise<number> {
    return reader.friendship.count({
      where: {
        worldId,
        status: 'ACTIVE',
        OR: [{ requesterUserId: userId }, { recipientUserId: userId }],
      },
    });
  }

  /** True when an ACTIVE friendship links the two players (either direction). */
  async areActiveFriends(
    worldId: string,
    userIdA: string,
    userIdB: string,
    reader: PrismaClientOrTx = this.prisma,
  ): Promise<boolean> {
    if (userIdA === userIdB) return false;
    const link = await reader.friendship.findFirst({
      where: {
        worldId,
        status: 'ACTIVE',
        OR: [
          { requesterUserId: userIdA, recipientUserId: userIdB },
          { requesterUserId: userIdB, recipientUserId: userIdA },
        ],
      },
      select: { id: true },
    });
    return link !== null;
  }

  /** Display names of a player's ACTIVE defensive friends (cap-bounded). */
  async listActiveFriendDisplayNames(
    worldId: string,
    userId: string,
    reader: PrismaClientOrTx = this.prisma,
  ): Promise<string[]> {
    const rows = await reader.friendship.findMany({
      where: {
        worldId,
        status: 'ACTIVE',
        OR: [{ requesterUserId: userId }, { recipientUserId: userId }],
      },
      select: {
        requesterUserId: true,
        requesterUser: { select: { displayName: true } },
        recipientUser: { select: { displayName: true } },
      },
    });
    return rows.map((row) =>
      row.requesterUserId === userId
        ? row.recipientUser.displayName
        : row.requesterUser.displayName,
    );
  }

  async createFriendship(
    callerId: string,
    worldId: string,
    body: CreateFriendshipBody,
  ): Promise<FriendshipDto> {
    await this.ownership.assertWorldMember(worldId, callerId);
    const recipientUserId = await this.resolveRecipientUserId(worldId, body);

    if (recipientUserId === callerId) {
      throw new BadRequestException('You cannot befriend yourself');
    }
    await this.assertWorldMember(worldId, recipientUserId, 'Recipient');

    const existing = await this.prisma.friendship.findFirst({
      where: {
        worldId,
        OR: [
          { requesterUserId: callerId, recipientUserId },
          { requesterUserId: recipientUserId, recipientUserId: callerId },
        ],
      },
      include: FRIENDSHIP_USER_INCLUDE,
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        throw new ConflictException({
          message: 'You are already defensive friends with this player.',
          code: FRIENDSHIP_ERROR_CODES.ALREADY_ACTIVE,
        });
      }
      // status === 'PENDING'
      if (existing.requesterUserId === callerId) {
        // Idempotent re-request from the same side: return the same PENDING row.
        return this.toDto(existing, callerId);
      }
      throw new ConflictException({
        message:
          'This player already sent you a friend request — accept it instead.',
        code: FRIENDSHIP_ERROR_CODES.PENDING_AWAITING_ACCEPT,
      });
    }

    if (
      (await this.countActive(this.prisma, worldId, callerId)) >=
      DEFENSIVE_FRIENDS_CAP
    ) {
      throw this.capReached();
    }

    const created = await this.prisma.friendship.create({
      data: { worldId, requesterUserId: callerId, recipientUserId },
      include: FRIENDSHIP_USER_INCLUDE,
    });
    return this.toDto(created, callerId);
  }

  async acceptFriendship(
    callerId: string,
    worldId: string,
    friendshipId: string,
  ): Promise<FriendshipDto> {
    await this.ownership.assertWorldMember(worldId, callerId);
    return this.prisma.$transaction(async (tx) => {
      const friendship = await tx.friendship.findUnique({
        where: { id: friendshipId },
      });
      if (!friendship || friendship.worldId !== worldId) {
        throw new NotFoundException('Friend request not found');
      }
      if (friendship.recipientUserId !== callerId) {
        throw new ForbiddenException(
          'Only the recipient can accept this friend request',
        );
      }
      if (friendship.status !== 'PENDING') {
        throw new ForbiddenException(
          'This friend request is no longer pending',
        );
      }

      const { requesterUserId, recipientUserId } = friendship;

      // Serialize concurrent accepts touching either side of the pair: lock all
      // friendship rows involving either player so the cap recount below is
      // consistent (A at 4 ACTIVE accepting two requests can't slip to 6).
      await tx.$queryRaw`
        SELECT 1 FROM friendship
        WHERE world_id = ${worldId}
          AND (requester_user_id IN (${requesterUserId}, ${recipientUserId})
            OR recipient_user_id IN (${requesterUserId}, ${recipientUserId}))
        FOR UPDATE
      `;

      // Re-read under lock: a concurrent accept may have resolved this row.
      const locked = await tx.friendship.findUnique({
        where: { id: friendshipId },
      });
      if (!locked || locked.status !== 'PENDING') {
        throw new ConflictException({
          message: 'This friend request was already resolved.',
          code: FRIENDSHIP_ERROR_CODES.ALREADY_ACTIVE,
        });
      }

      // Anti-doublon symétrique : si une autre ligne ACTIVE lie déjà la paire
      // (race des deux demandes mutuelles), refuser ce second accept.
      const activeBetween = await tx.friendship.findFirst({
        where: {
          worldId,
          status: 'ACTIVE',
          OR: [
            { requesterUserId, recipientUserId },
            {
              requesterUserId: recipientUserId,
              recipientUserId: requesterUserId,
            },
          ],
        },
        select: { id: true },
      });
      if (activeBetween) {
        throw new ConflictException({
          message: 'You are already defensive friends with this player.',
          code: FRIENDSHIP_ERROR_CODES.ALREADY_ACTIVE,
        });
      }

      // Cap rechecked on BOTH sides at accept time.
      if (
        (await this.countActive(tx, worldId, recipientUserId)) >=
        DEFENSIVE_FRIENDS_CAP
      ) {
        throw this.capReached();
      }
      if (
        (await this.countActive(tx, worldId, requesterUserId)) >=
        DEFENSIVE_FRIENDS_CAP
      ) {
        throw this.capReached();
      }

      const accepted = await tx.friendship.update({
        where: { id: friendshipId },
        data: { status: 'ACTIVE', acceptedAt: new Date() },
        include: FRIENDSHIP_USER_INCLUDE,
      });
      return this.toDto(accepted, callerId);
    });
  }

  async deleteFriendship(
    callerId: string,
    worldId: string,
    friendshipId: string,
  ): Promise<void> {
    await this.ownership.assertWorldMember(worldId, callerId);
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship || friendship.worldId !== worldId) {
      throw new NotFoundException('Friendship not found');
    }
    if (
      friendship.requesterUserId !== callerId &&
      friendship.recipientUserId !== callerId
    ) {
      throw new ForbiddenException('You are not part of this friendship');
    }
    // Hard delete (MVP — no social history). Cross-player garrisons already
    // stationed are NOT auto-recalled (cf. spec § Retrait): they resolve via the
    // existing recall / send-back paths.
    await this.prisma.friendship.delete({ where: { id: friendshipId } });
  }

  async getMyFriendships(
    callerId: string,
    worldId: string,
  ): Promise<MyFriendshipsResponse> {
    await this.ownership.assertWorldMember(worldId, callerId);
    const rows = await this.prisma.friendship.findMany({
      where: {
        worldId,
        OR: [{ requesterUserId: callerId }, { recipientUserId: callerId }],
      },
      include: FRIENDSHIP_USER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    const response: MyFriendshipsResponse = {
      active: [],
      pendingOut: [],
      pendingIn: [],
    };
    for (const row of rows) {
      const dto = this.toDto(row, callerId);
      if (dto.status === 'ACTIVE') {
        response.active.push(dto);
      } else if (dto.isRequester) {
        response.pendingOut.push(dto);
      } else {
        response.pendingIn.push(dto);
      }
    }
    return response;
  }

  private async resolveRecipientUserId(
    worldId: string,
    body: CreateFriendshipBody,
  ): Promise<string> {
    if (body.recipientUserId) return body.recipientUserId;

    // displayName is unique case-insensitively (user_display_name_lower_key) →
    // match the same way so "bob" finds the player registered as "Bob".
    const membership = await this.prisma.worldMembership.findFirst({
      where: {
        worldId,
        user: {
          displayName: {
            equals: body.recipientDisplayName,
            mode: 'insensitive',
          },
        },
      },
      select: { userId: true },
    });
    if (!membership) {
      throw new NotFoundException(
        `No player named "${body.recipientDisplayName}" on this world`,
      );
    }
    return membership.userId;
  }

  private async assertWorldMember(
    worldId: string,
    userId: string,
    label: string,
  ): Promise<void> {
    const membership = await this.prisma.worldMembership.findUnique({
      where: { userId_worldId: { userId, worldId } },
      select: { userId: true },
    });
    if (!membership) {
      throw new BadRequestException(`${label} is not a member of this world`);
    }
  }

  private capReached(): ConflictException {
    return new ConflictException({
      message: `Defensive friends are capped at ${DEFENSIVE_FRIENDS_CAP}.`,
      code: FRIENDSHIP_ERROR_CODES.CAP_REACHED,
    });
  }

  private toDto(
    friendship: FriendshipWithUsers,
    callerId: string,
  ): FriendshipDto {
    const isRequester = friendship.requesterUserId === callerId;
    const otherUserId = isRequester
      ? friendship.recipientUserId
      : friendship.requesterUserId;
    const otherDisplayName = isRequester
      ? friendship.recipientUser.displayName
      : friendship.requesterUser.displayName;
    return {
      id: friendship.id,
      worldId: friendship.worldId,
      status: friendship.status,
      otherUserId,
      otherDisplayName,
      isRequester,
      createdAt: friendship.createdAt.toISOString(),
      acceptedAt: friendship.acceptedAt?.toISOString() ?? null,
    };
  }
}
