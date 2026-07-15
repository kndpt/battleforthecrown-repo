import { Injectable } from '@nestjs/common';
import type { InboxEntry, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { presentCaravanReport } from './caravan-report.presenter';
import { InboxReportService } from './inbox-report.service';
import type { CaravanReportResponse } from '@battleforthecrown/shared/combat';

type CaravanEntryWithReport = Prisma.InboxEntryGetPayload<{
  include: { caravanReport: true };
}>;

type CaravanReportRow = NonNullable<CaravanEntryWithReport['caravanReport']>;

@Injectable()
export class CaravanReportService extends InboxReportService<
  CaravanReportRow,
  CaravanReportResponse
> {
  protected readonly kind = 'CARAVAN' as const;
  protected readonly include: Prisma.InboxEntryInclude = {
    caravanReport: true,
  };
  protected readonly notFoundMessage = 'Caravan report not found';
  protected readonly mutationExcludesHidden = true;

  constructor(prisma: PrismaService, ownership: OwnershipService) {
    super(prisma, ownership);
  }

  protected reportIdFilter(reportId: string): Prisma.InboxEntryWhereInput {
    return { caravanReportId: reportId };
  }

  protected extractReport(entry: InboxEntry): CaravanReportRow | null {
    return (entry as CaravanEntryWithReport).caravanReport ?? null;
  }

  protected present(
    report: CaravanReportRow,
    isRead: boolean,
  ): CaravanReportResponse {
    return presentCaravanReport(report, isRead);
  }

  getAllCaravanReports(
    userId: string,
    worldId: string,
  ): Promise<CaravanReportResponse[]> {
    return this.listReports(userId, worldId);
  }

  getCaravanReport(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<CaravanReportResponse> {
    return this.readReport(userId, reportId, worldId);
  }

  markCaravanReportAsRead(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<CaravanReportResponse> {
    return this.markReportAsRead(userId, reportId, worldId);
  }

  deleteCaravanReport(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<{ message: string }> {
    return this.deleteReport(
      userId,
      reportId,
      worldId,
      'Caravan report deleted successfully',
    );
  }
}
