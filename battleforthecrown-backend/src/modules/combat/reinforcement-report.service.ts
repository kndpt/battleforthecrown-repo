import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { presentReinforcementReport } from './reinforcement-report.presenter';
import type { ReinforcementReportResponse } from '@battleforthecrown/shared/combat';

type ReinforcementEntryWithReport = Prisma.InboxEntryGetPayload<{
  include: { reinforcementReport: true };
}> & {
  reinforcementReport: NonNullable<
    Prisma.InboxEntryGetPayload<{
      include: { reinforcementReport: true };
    }>['reinforcementReport']
  >;
};

@Injectable()
export class ReinforcementReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async getAllReinforcementReports(
    userId: string,
    worldId: string,
  ): Promise<ReinforcementReportResponse[]> {
    await this.ownership.assertWorldMember(worldId, userId);
    const entries = await this.prisma.inboxEntry.findMany({
      where: { userId, worldId, kind: 'REINFORCEMENT', hidden: false },
      include: { reinforcementReport: true },
      orderBy: { timestamp: 'desc' },
    });
    return entries
      .filter((e) => e.reinforcementReport)
      .map((e) => presentReinforcementReport(e.reinforcementReport!, e.isRead));
  }

  async getReinforcementReport(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<ReinforcementReportResponse> {
    await this.ownership.assertWorldMember(worldId, userId);
    const entry = await this.findReinforcementEntry(userId, reportId, worldId, {
      excludeHidden: true,
    });
    return presentReinforcementReport(entry.reinforcementReport, entry.isRead);
  }

  async markReinforcementReportAsRead(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<ReinforcementReportResponse> {
    await this.ownership.assertWorldMember(worldId, userId);
    const entry = await this.findReinforcementEntry(userId, reportId, worldId);
    await this.prisma.inboxEntry.update({
      where: { id: entry.id },
      data: { isRead: true },
    });
    return presentReinforcementReport(entry.reinforcementReport, true);
  }

  async deleteReinforcementReport(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<{ message: string }> {
    await this.ownership.assertWorldMember(worldId, userId);
    const entry = await this.findReinforcementEntry(userId, reportId, worldId);
    await this.prisma.inboxEntry.update({
      where: { id: entry.id },
      data: { hidden: true },
    });
    return { message: 'Reinforcement report deleted successfully' };
  }

  /**
   * Load the caller's inbox entry that points at this reinforcement report,
   * with the join eagerly attached. Mirrors {@link CaravanReportService.findCaravanEntry}.
   * `excludeHidden` gates GET vs mark/delete: reads never surface a soft-deleted
   * entry, whereas mark-read and delete stay idempotent on hidden entries so
   * the caller can still normalise their inbox state.
   */
  private async findReinforcementEntry(
    userId: string,
    reportId: string,
    worldId: string,
    options: { excludeHidden?: boolean } = {},
  ): Promise<ReinforcementEntryWithReport> {
    const entry = await this.prisma.inboxEntry.findFirst({
      where: {
        userId,
        worldId,
        kind: 'REINFORCEMENT',
        reinforcementReportId: reportId,
        ...(options.excludeHidden ? { hidden: false } : {}),
      },
      include: { reinforcementReport: true },
    });
    if (!entry?.reinforcementReport) {
      throw new NotFoundException('Reinforcement report not found');
    }
    return entry as ReinforcementEntryWithReport;
  }
}
