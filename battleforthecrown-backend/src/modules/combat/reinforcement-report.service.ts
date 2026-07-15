import { Injectable } from '@nestjs/common';
import type { InboxEntry, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { presentReinforcementReport } from './reinforcement-report.presenter';
import { InboxReportService } from './inbox-report.service';
import type { ReinforcementReportResponse } from '@battleforthecrown/shared/combat';

type ReinforcementEntryWithReport = Prisma.InboxEntryGetPayload<{
  include: { reinforcementReport: true };
}>;

type ReinforcementReportRow = NonNullable<
  ReinforcementEntryWithReport['reinforcementReport']
>;

@Injectable()
export class ReinforcementReportService extends InboxReportService<
  ReinforcementReportRow,
  ReinforcementReportResponse
> {
  protected readonly kind = 'REINFORCEMENT' as const;
  protected readonly include: Prisma.InboxEntryInclude = {
    reinforcementReport: true,
  };
  protected readonly notFoundMessage = 'Reinforcement report not found';
  // Unlike caravan, mark-read/delete stay idempotent on hidden entries so the
  // caller can still normalise their inbox state after a soft delete.
  protected readonly mutationExcludesHidden = false;

  constructor(prisma: PrismaService, ownership: OwnershipService) {
    super(prisma, ownership);
  }

  protected reportIdFilter(reportId: string): Prisma.InboxEntryWhereInput {
    return { reinforcementReportId: reportId };
  }

  protected extractReport(entry: InboxEntry): ReinforcementReportRow | null {
    return (entry as ReinforcementEntryWithReport).reinforcementReport ?? null;
  }

  protected present(
    report: ReinforcementReportRow,
    isRead: boolean,
  ): ReinforcementReportResponse {
    return presentReinforcementReport(report, isRead);
  }

  getAllReinforcementReports(
    userId: string,
    worldId: string,
  ): Promise<ReinforcementReportResponse[]> {
    return this.listReports(userId, worldId);
  }

  getReinforcementReport(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<ReinforcementReportResponse> {
    return this.readReport(userId, reportId, worldId);
  }

  markReinforcementReportAsRead(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<ReinforcementReportResponse> {
    return this.markReportAsRead(userId, reportId, worldId);
  }

  deleteReinforcementReport(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<{ message: string }> {
    return this.deleteReport(
      userId,
      reportId,
      worldId,
      'Reinforcement report deleted successfully',
    );
  }
}
