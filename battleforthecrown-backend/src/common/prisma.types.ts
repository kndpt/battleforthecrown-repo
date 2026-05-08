import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Union type for Prisma client or transaction context.
 * Use this when a function accepts either a PrismaService (extends PrismaClient)
 * or a transaction client. The structural subset of methods used by callers
 * (model accessors like `resourceStock`, `eventOutbox`) exists on both.
 */
export type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;

/**
 * Type helper to extract Prisma model types
 * @example
 * type VillageModel = PrismaModel<'village'>;
 */
export type PrismaModel<T extends Prisma.ModelName> =
  Prisma.TypeMap['model'][T];

/**
 * Generic chunk bounds type for spatial queries
 */
export interface ChunkBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Coordinates for chunk-based spatial indexing
 */
export interface ChunkCoord {
  cx: number;
  cy: number;
}

/**
 * Generic 2D position type
 */
export interface Position {
  x: number;
  y: number;
}
