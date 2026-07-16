import { NotFoundException } from '@nestjs/common';
import type { InboxEntry, InboxKind, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';

/**
 * Shared CRUD for inbox-backed reports (caravan, reinforcement). Each report
 * family lives in its own table joined 1:1 from `InboxEntry`; the inbox row
 * owns `isRead`/`hidden` and the delivery envelope, the joined row owns the
 * payload. Subclasses declare only the discriminating kind, the join, the
 * report foreign key, how to read the joined row, and how to present it — all
 * list/read/mark-read/delete orchestration lives here, once.
 *
 * Hidden-gating semantics, centralised so the two report families stay
 * consistent:
 * - **list** and **read** never surface a soft-deleted (`hidden`) entry.
 * - **mark-read** and **delete** are gated by {@link mutationExcludesHidden}:
 *   `true` (caravan) makes them 404 on a hidden entry; `false` (reinforcement)
 *   keeps them idempotent so a caller can still normalise inbox state after a
 *   soft delete.
 */
export abstract class InboxReportService<TReport, TResponse> {
  /** `InboxEntry.kind` discriminating this report family. */
  protected abstract readonly kind: InboxKind;
  /** Prisma include that eagerly loads the 1:1 report join. */
  protected abstract readonly include: Prisma.InboxEntryInclude;
  /** Human-facing 404 message for a missing report. */
  protected abstract readonly notFoundMessage: string;
  /** Whether mark-read/delete refuse to act on a soft-deleted entry. */
  protected abstract readonly mutationExcludesHidden: boolean;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly ownership: OwnershipService,
  ) {}

  /** Narrow the report foreign key into an `InboxEntry` where-fragment. */
  protected abstract reportIdFilter(
    reportId: string,
  ): Prisma.InboxEntryWhereInput;

  /** Pull the eagerly-joined report off a loaded entry (`null` if absent). */
  protected abstract extractReport(entry: InboxEntry): TReport | null;

  /** Map a report row + read flag to its API response. */
  protected abstract present(report: TReport, isRead: boolean): TResponse;

  protected async listReports(
    userId: string,
    worldId: string,
  ): Promise<TResponse[]> {
    await this.ownership.assertWorldMember(worldId, userId);
    const entries = await this.prisma.inboxEntry.findMany({
      where: { userId, worldId, kind: this.kind, hidden: false },
      include: this.include,
      orderBy: { timestamp: 'desc' },
    });
    const responses: TResponse[] = [];
    for (const entry of entries) {
      const report = this.extractReport(entry);
      if (report) {
        responses.push(this.present(report, entry.isRead));
      }
    }
    return responses;
  }

  protected async readReport(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<TResponse> {
    await this.ownership.assertWorldMember(worldId, userId);
    // Reads never surface a soft-deleted entry.
    const { report, isRead } = await this.findEntry(userId, reportId, worldId, {
      excludeHidden: true,
    });
    return this.present(report, isRead);
  }

  protected async markReportAsRead(
    userId: string,
    reportId: string,
    worldId: string,
  ): Promise<TResponse> {
    await this.ownership.assertWorldMember(worldId, userId);
    const { id, report } = await this.findEntry(userId, reportId, worldId, {
      excludeHidden: this.mutationExcludesHidden,
    });
    await this.prisma.inboxEntry.update({
      where: { id },
      data: { isRead: true },
    });
    return this.present(report, true);
  }

  protected async deleteReport(
    userId: string,
    reportId: string,
    worldId: string,
    successMessage: string,
  ): Promise<{ message: string }> {
    await this.ownership.assertWorldMember(worldId, userId);
    const { id } = await this.findEntry(userId, reportId, worldId, {
      excludeHidden: this.mutationExcludesHidden,
    });
    await this.prisma.inboxEntry.update({
      where: { id },
      data: { hidden: true },
    });
    return { message: successMessage };
  }

  private async findEntry(
    userId: string,
    reportId: string,
    worldId: string,
    options: { excludeHidden: boolean },
  ): Promise<{ id: string; report: TReport; isRead: boolean }> {
    const entry = await this.prisma.inboxEntry.findFirst({
      where: {
        userId,
        worldId,
        kind: this.kind,
        ...this.reportIdFilter(reportId),
        ...(options.excludeHidden ? { hidden: false } : {}),
      },
      include: this.include,
    });
    const report = entry ? this.extractReport(entry) : null;
    if (!entry || !report) {
      throw new NotFoundException(this.notFoundMessage);
    }
    return { id: entry.id, report, isRead: entry.isRead };
  }
}
