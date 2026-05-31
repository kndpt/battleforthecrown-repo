import type { ReinforcementReportResponse } from '@battleforthecrown/shared/combat';

export type { ReinforcementReportResponse };

export function reinforcementReportTypeLabel(type: ReinforcementReportResponse['type']): string {
  return type === 'STATIONED' ? 'Arrivé en soutien' : 'Retour au village';
}

export function reinforcementReportUnitTotal(report: ReinforcementReportResponse): number {
  return Object.values(report.units ?? {}).reduce((sum, qty) => sum + qty, 0);
}

export function reinforcementReportSubject(report: ReinforcementReportResponse): string {
  if (report.type === 'STATIONED') {
    const host = report.hostVillageName ?? `(${report.hostX}, ${report.hostY})`;
    return `Renfort · ${host}`;
  }
  const origin = report.originVillageName ?? `(${report.originX}, ${report.originY})`;
  return `Retour · ${origin}`;
}

export function reinforcementReportPreview(report: ReinforcementReportResponse): string {
  const total = reinforcementReportUnitTotal(report);
  const origin = report.originVillageName ?? `(${report.originX}, ${report.originY})`;
  const host = report.hostVillageName ?? `(${report.hostX}, ${report.hostY})`;
  return `${total} unités · de ${origin} → ${host}`;
}
