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
          { observerUserId: userId },
          { defenderUserId: userId },
          { attackerUserId: userId },
        ],
      },
      orderBy: { timestamp: 'desc' },
    });

    return reports
      .filter((report) => this.canAccessReport(report, userId))
      .map((report) => presentCombatReport(report, userId));
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
    const participants = this.getReportParticipants(report);
    const otherParticipantsHidden = participants
      .filter((participant) => participant.role !== role)
      .every((participant) => participant.hidden);

    if (otherParticipantsHidden) {
      await this.prisma.combatReport.delete({ where: { id: reportId } });
    } else {
      await this.prisma.combatReport.update({
        where: { id: reportId },
        data: this.hiddenPatchForRole(role),
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
      data: this.readPatchForRole(role),
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
      observerUserId?: string | null;
    },
    userId: string,
  ): 'attacker' | 'defender' | 'observer' | null {
    if (report.observerUserId === userId) return 'observer';
    if (report.defenderUserId === userId) return 'defender';
    if (report.attackerUserId === userId) return 'attacker';
    return null;
  }

  private getReportParticipants(report: {
    attackerUserId: string;
    defenderUserId: string | null;
    observerUserId?: string | null;
    hiddenByAttacker: boolean;
    hiddenByDefender: boolean;
    hiddenByObserver?: boolean;
  }): Array<{
    role: 'attacker' | 'defender' | 'observer';
    userId: string;
    hidden: boolean;
  }> {
    const byUser = new Map<
      string,
      {
        role: 'attacker' | 'defender' | 'observer';
        userId: string;
        hidden: boolean;
      }
    >();

    byUser.set(report.attackerUserId, {
      role: 'attacker',
      userId: report.attackerUserId,
      hidden: report.hiddenByAttacker,
    });
    if (report.defenderUserId) {
      byUser.set(report.defenderUserId, {
        role: 'defender',
        userId: report.defenderUserId,
        hidden: report.hiddenByDefender,
      });
    }
    if (report.observerUserId) {
      byUser.set(report.observerUserId, {
        role: 'observer',
        userId: report.observerUserId,
        hidden: report.hiddenByObserver ?? false,
      });
    }
    return [...byUser.values()];
  }

  private readPatchForRole(role: 'attacker' | 'defender' | 'observer' | null) {
    if (role === 'attacker') return { readByAttacker: true };
    if (role === 'defender') return { readByDefender: true };
    if (role === 'observer') return { readByObserver: true };
    return {};
  }

  private hiddenPatchForRole(
    role: 'attacker' | 'defender' | 'observer' | null,
  ) {
    if (role === 'attacker') return { hiddenByAttacker: true };
    if (role === 'defender') return { hiddenByDefender: true };
    if (role === 'observer') return { hiddenByObserver: true };
    return {};
  }

  private canAccessReport(
    report: {
      attackerUserId: string;
      defenderUserId: string | null;
      observerUserId?: string | null;
      hiddenByAttacker: boolean;
      hiddenByDefender: boolean;
      hiddenByObserver?: boolean;
    },
    userId: string,
  ): boolean {
    const role = this.getReportRole(report, userId);
    if (role === 'attacker') return !report.hiddenByAttacker;
    if (role === 'defender') return !report.hiddenByDefender;
    if (role === 'observer') return !(report.hiddenByObserver ?? false);
    return false;
  }
}
