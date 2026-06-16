import type { PrismaClientOrTx } from '../../common/prisma.types';

export interface ReportVillageSnapshot {
  id: string;
  name: string;
  x: number;
  y: number;
  userId: string | null;
}

export async function loadReportVillageSnapshot(
  tx: PrismaClientOrTx,
  villageId: string,
): Promise<ReportVillageSnapshot | null> {
  return tx.village.findUnique({
    where: { id: villageId },
    select: { id: true, name: true, x: true, y: true, userId: true },
  });
}

export function dedupedRecipientUserIds(
  ...userIds: ReadonlyArray<string | null | undefined>
): string[] {
  return [...new Set(userIds.filter((id): id is string => Boolean(id)))];
}
