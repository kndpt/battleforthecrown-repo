import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { presentCombatReport } from './combat-report.presenter';
import { presentScoutReport } from './scout-report.presenter';

@Injectable()
export class CombatReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async getAllReports(userId: string, worldId: string) {
    await this.ownership.assertWorldMember(worldId, userId);
    const reports = await this.prisma.combatReport.findMany({
      where: {
        worldId,
        OR: [
          { attackerUserId: userId, hiddenByAttacker: false },
          { defenderUserId: userId, hiddenByDefender: false },
        ],
      },
      orderBy: { timestamp: 'desc' },
    });

    return reports.map((report) => presentCombatReport(report, userId));
  }

  async getReport(userId: string, reportId: string, worldId: string) {
    await this.ownership.assertWorldMember(worldId, userId);
    const report = await this.prisma.combatReport.findFirst({
      where: { id: reportId, worldId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (!this.canAccessReport(report, userId)) {
      throw new BadRequestException('Not authorized to view this report');
    }

    return presentCombatReport(report, userId);
  }

  async deleteReport(userId: string, reportId: string, worldId: string) {
    await this.ownership.assertWorldMember(worldId, userId);
    const report = await this.prisma.combatReport.findFirst({
      where: { id: reportId, worldId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (!this.canAccessReport(report, userId)) {
      throw new BadRequestException('Not authorized to delete this report');
    }

    const role = this.getReportRole(report, userId);
    if (
      report.attackerUserId === userId &&
      report.defenderUserId === userId &&
      this.isOccupationDefenseReport(report.details)
    ) {
      await this.prisma.combatReport.delete({ where: { id: reportId } });
      return { message: 'Report deleted successfully' };
    }

    const otherParticipantHidden =
      role === 'attacker'
        ? report.hiddenByDefender || !report.defenderUserId
        : report.hiddenByAttacker;

    if (otherParticipantHidden) {
      await this.prisma.combatReport.delete({ where: { id: reportId } });
    } else {
      await this.prisma.combatReport.update({
        where: { id: reportId },
        data:
          role === 'attacker'
            ? { hiddenByAttacker: true }
            : { hiddenByDefender: true },
      });
    }

    return { message: 'Report deleted successfully' };
  }

  async markReportAsRead(userId: string, reportId: string, worldId: string) {
    await this.ownership.assertWorldMember(worldId, userId);
    const report = await this.prisma.combatReport.findFirst({
      where: { id: reportId, worldId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (!this.canAccessReport(report, userId)) {
      throw new BadRequestException('Not authorized to modify this report');
    }

    const role = this.getReportRole(report, userId);
    const updated = await this.prisma.combatReport.update({
      where: { id: reportId },
      data:
        role === 'attacker'
          ? { readByAttacker: true }
          : { readByDefender: true },
    });

    return presentCombatReport(updated, userId);
  }

  async getAllScoutReports(userId: string, worldId: string) {
    await this.ownership.assertWorldMember(worldId, userId);
    const reports = await this.prisma.scoutReport.findMany({
      where: { worldId, scoutUserId: userId, hidden: false },
      orderBy: { timestamp: 'desc' },
    });

    return reports.map((report) => presentScoutReport(report));
  }

  async getScoutReport(userId: string, reportId: string, worldId: string) {
    await this.ownership.assertWorldMember(worldId, userId);
    const report = await this.prisma.scoutReport.findFirst({
      where: { id: reportId, worldId },
    });

    if (!report) {
      throw new NotFoundException('Scout report not found');
    }

    if (report.scoutUserId !== userId || report.hidden) {
      throw new BadRequestException('Not authorized to view this scout report');
    }

    return presentScoutReport(report);
  }

  async markScoutReportAsRead(
    userId: string,
    reportId: string,
    worldId: string,
  ) {
    await this.ownership.assertWorldMember(worldId, userId);
    const report = await this.prisma.scoutReport.findFirst({
      where: { id: reportId, worldId },
    });

    if (!report) {
      throw new NotFoundException('Scout report not found');
    }

    if (report.scoutUserId !== userId || report.hidden) {
      throw new BadRequestException(
        'Not authorized to modify this scout report',
      );
    }

    const updated = await this.prisma.scoutReport.update({
      where: { id: reportId },
      data: { isRead: true },
    });

    return presentScoutReport(updated);
  }

  async deleteScoutReport(userId: string, reportId: string, worldId: string) {
    await this.ownership.assertWorldMember(worldId, userId);
    const report = await this.prisma.scoutReport.findFirst({
      where: { id: reportId, worldId },
    });

    if (!report) {
      throw new NotFoundException('Scout report not found');
    }

    if (report.scoutUserId !== userId || report.hidden) {
      throw new BadRequestException(
        'Not authorized to delete this scout report',
      );
    }

    await this.prisma.scoutReport.update({
      where: { id: reportId },
      data: { hidden: true },
    });

    return { message: 'Scout report deleted successfully' };
  }

  private getReportRole(
    report: {
      attackerUserId: string;
      defenderUserId: string | null;
      details?: unknown;
    },
    userId: string,
  ): 'attacker' | 'defender' | null {
    if (
      report.defenderUserId === userId &&
      this.isOccupationDefenseReport(report.details)
    ) {
      return 'defender';
    }
    if (report.attackerUserId === userId) return 'attacker';
    if (report.defenderUserId === userId) return 'defender';
    return null;
  }

  private isOccupationDefenseReport(details: unknown): boolean {
    return (
      details !== null &&
      typeof details === 'object' &&
      'occupationDefense' in details
    );
  }

  private canAccessReport(
    report: {
      attackerUserId: string;
      defenderUserId: string | null;
      hiddenByAttacker: boolean;
      hiddenByDefender: boolean;
    },
    userId: string,
  ): boolean {
    const role = this.getReportRole(report, userId);
    if (role === 'attacker') return !report.hiddenByAttacker;
    if (role === 'defender') return !report.hiddenByDefender;
    return false;
  }
}
