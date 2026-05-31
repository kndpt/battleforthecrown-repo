import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { presentReinforcementReport } from './reinforcement-report.presenter';
import type { ReinforcementReportResponse } from '@battleforthecrown/shared/combat';

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
    const entry = await this.prisma.inboxEntry.findFirst({
      where: {
        userId,
        worldId,
        kind: 'REINFORCEMENT',
        reinforcementReportId: reportId,
        hidden: false,
      },
      include: { reinforcementReport: true },
    });
    if (!entry || !entry.reinforcementReport) {
      throw new NotFoundException('Reinforcement report not found');
    }
    return presentReinforcementReport(entry.reinforcementReport, entry.isRead);
  }

  async markReinforcementReportAsRead(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<ReinforcementReportResponse> {
    await this.ownership.assertWorldMember(worldId, userId);
    const entry = await this.prisma.inboxEntry.findFirst({
      where: {
        userId,
        worldId,
        kind: 'REINFORCEMENT',
        reinforcementReportId: reportId,
      },
      include: { reinforcementReport: true },
    });
    if (!entry || !entry.reinforcementReport) {
      throw new NotFoundException('Reinforcement report not found');
    }
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
    const entry = await this.prisma.inboxEntry.findFirst({
      where: {
        userId,
        worldId,
        kind: 'REINFORCEMENT',
        reinforcementReportId: reportId,
      },
      include: { reinforcementReport: true },
    });
    if (!entry || !entry.reinforcementReport) {
      throw new NotFoundException('Reinforcement report not found');
    }
    await this.prisma.inboxEntry.update({
      where: { id: entry.id },
      data: { hidden: true },
    });
    return { message: 'Reinforcement report deleted successfully' };
  }
}
