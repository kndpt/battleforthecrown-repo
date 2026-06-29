import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MapMarker, Prisma } from '@prisma/client';
import {
  MAP_MARKER_CAP,
  MAP_MARKER_ERROR_CODES,
  type CreateMapMarkerBody,
  type MapMarkerDto,
  type UpdateMapMarkerBody,
} from '@battleforthecrown/shared/map-markers';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth/ownership.service';
import { WorldAccessService } from '../world/world-access.service';
import { _mapMarkerKindFromPrisma } from '../../common/prisma-shared-enums';

/**
 * Private map-markers lifecycle (cf. docs/gameplay/26-private-map-markers.md).
 *
 * Strictly scoped to `userId × worldId`: a marker is private strategic memory,
 * never a cross-account reveal. Every read/mutation asserts world membership;
 * mutations also assert the world is writable so a LOCKED → ENDED world becomes
 * read-only, while GET stays available during the ENDED consultation window.
 */
@Injectable()
export class MapMarkerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly worldAccess: WorldAccessService,
  ) {}

  /** Markers owned by the caller on this world, freshest first. */
  async listMine(userId: string, worldId: string): Promise<MapMarkerDto[]> {
    await this.ownership.assertWorldMember(worldId, userId);
    const rows = await this.prisma.mapMarker.findMany({
      where: { userId, worldId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDto(row));
  }

  /**
   * Create-or-upsert on the `(userId, worldId, x, y)` tile. Re-marking a tile
   * already marked by the caller edits it in place (idempotent) and never
   * counts against the cap; only a genuinely new tile is gated by
   * {@link MAP_MARKER_CAP}, rechecked inside the same transaction as the insert.
   */
  async upsert(
    userId: string,
    worldId: string,
    body: CreateMapMarkerBody,
  ): Promise<MapMarkerDto> {
    await this.ownership.assertWorldMember(worldId, userId);
    return this.prisma.$transaction(async (tx) => {
      await this.worldAccess.assertWorldWritable(worldId, tx);

      const existing = await tx.mapMarker.findUnique({
        where: {
          userId_worldId_x_y: { userId, worldId, x: body.x, y: body.y },
        },
      });
      if (existing) {
        const updated = await tx.mapMarker.update({
          where: { id: existing.id },
          data: { kind: body.kind, note: body.note },
        });
        return this.toDto(updated);
      }

      const count = await tx.mapMarker.count({ where: { userId, worldId } });
      if (count >= MAP_MARKER_CAP) {
        throw this.capReached();
      }

      try {
        const created = await tx.mapMarker.create({
          data: {
            userId,
            worldId,
            x: body.x,
            y: body.y,
            kind: body.kind,
            note: body.note,
          },
        });
        return this.toDto(created);
      } catch (error) {
        // A concurrent identical create won the insert race on the
        // (userId, worldId, x, y) unique — resolve to the same upsert outcome.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const raced = await tx.mapMarker.update({
            where: {
              userId_worldId_x_y: { userId, worldId, x: body.x, y: body.y },
            },
            data: { kind: body.kind, note: body.note },
          });
          return this.toDto(raced);
        }
        throw error;
      }
    });
  }

  /** Edit a marker's kind and/or note. Ownership enforced. */
  async update(
    userId: string,
    worldId: string,
    markerId: string,
    body: UpdateMapMarkerBody,
  ): Promise<MapMarkerDto> {
    await this.ownership.assertWorldMember(worldId, userId);
    return this.prisma.$transaction(async (tx) => {
      await this.worldAccess.assertWorldWritable(worldId, tx);
      await this.assertOwned(tx, userId, worldId, markerId);

      const data: Prisma.MapMarkerUpdateInput = {};
      if (body.kind !== undefined) data.kind = body.kind;
      if (body.note !== undefined) data.note = body.note;

      const updated = await tx.mapMarker.update({
        where: { id: markerId },
        data,
      });
      return this.toDto(updated);
    });
  }

  /** Delete a marker. Ownership enforced. */
  async remove(
    userId: string,
    worldId: string,
    markerId: string,
  ): Promise<void> {
    await this.ownership.assertWorldMember(worldId, userId);
    await this.prisma.$transaction(async (tx) => {
      await this.worldAccess.assertWorldWritable(worldId, tx);
      await this.assertOwned(tx, userId, worldId, markerId);
      await tx.mapMarker.delete({ where: { id: markerId } });
    });
  }

  /**
   * Guard: the marker exists, belongs to this world, and is owned by the caller.
   * A 404 (never a 403 that would leak existence) hides other players' markers.
   */
  private async assertOwned(
    tx: Prisma.TransactionClient,
    userId: string,
    worldId: string,
    markerId: string,
  ): Promise<void> {
    const marker = await tx.mapMarker.findUnique({ where: { id: markerId } });
    if (!marker || marker.worldId !== worldId || marker.userId !== userId) {
      throw new NotFoundException({
        message: 'Map marker not found',
        code: MAP_MARKER_ERROR_CODES.NOT_FOUND,
      });
    }
  }

  private capReached(): ConflictException {
    return new ConflictException({
      message: `Map markers are capped at ${MAP_MARKER_CAP} per world.`,
      code: MAP_MARKER_ERROR_CODES.CAP_REACHED,
    });
  }

  private toDto(marker: MapMarker): MapMarkerDto {
    return {
      id: marker.id,
      worldId: marker.worldId,
      x: marker.x,
      y: marker.y,
      kind: _mapMarkerKindFromPrisma[marker.kind],
      note: marker.note,
      createdAt: marker.createdAt.toISOString(),
      updatedAt: marker.updatedAt.toISOString(),
    };
  }
}
