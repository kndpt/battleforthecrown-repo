import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { presentCaravanReport } from './caravan-report.presenter';
import type { CaravanReportResponse } from '@battleforthecrown/shared/combat';

@Injectable()
export class CaravanReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async getAllCaravanReports(
    userId: string,
    worldId: string,
  ): Promise<CaravanReportResponse[]> {
    await this.ownership.assertWorldMember(worldId, userId);
    const entries = await this.prisma.inboxEntry.findMany({
      where: { userId, worldId, kind: 'CARAVAN', hidden: false },
      include: { caravanReport: true },
      orderBy: { timestamp: 'desc' },
    });
    return entries
      .filter((entry) => entry.caravanReport)
      .map((entry) => presentCaravanReport(entry.caravanReport!, entry.isRead));
  }

  async getCaravanReport(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<CaravanReportResponse> {
    await this.ownership.assertWorldMember(worldId, userId);
    const entry = await this.findCaravanEntry(userId, reportId, worldId);
    return presentCaravanReport(entry.caravanReport!, entry.isRead);
  }

  async markCaravanReportAsRead(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<CaravanReportResponse> {
    await this.ownership.assertWorldMember(worldId, userId);
    const entry = await this.findCaravanEntry(userId, reportId, worldId);
    await this.prisma.inboxEntry.update({
      where: { id: entry.id },
      data: { isRead: true },
    });
    return presentCaravanReport(entry.caravanReport!, true);
  }

  async deleteCaravanReport(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<{ message: string }> {
    await this.ownership.assertWorldMember(worldId, userId);
    const entry = await this.findCaravanEntry(userId, reportId, worldId);
    await this.prisma.inboxEntry.update({
      where: { id: entry.id },
      data: { hidden: true },
    });
    return { message: 'Caravan report deleted successfully' };
  }

  private async findCaravanEntry(
    userId: string,
    reportId: string,
    worldId: string,
  ) {
    const entry = await this.prisma.inboxEntry.findFirst({
      where: {
        userId,
        worldId,
        kind: 'CARAVAN',
        caravanReportId: reportId,
        hidden: false,
      },
      include: { caravanReport: true },
    });
    if (!entry?.caravanReport) {
      throw new NotFoundException('Caravan report not found');
    }
    return entry;
  }
}
