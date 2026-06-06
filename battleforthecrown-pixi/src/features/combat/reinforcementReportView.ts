import type { ReinforcementReportResponse } from '@battleforthecrown/shared/combat';
import { unitMetaFor } from '@/features/army/unitConfig';
import type {
  ReinforcementReportAction,
  ReinforcementReportModalLabels,
  ReinforcementReportModalProps,
  ReinforcementReportPlace,
  ReinforcementReportUnit,
} from '@/features/design-system/components';

export type { ReinforcementReportResponse };

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const reinforcementReportLabels: ReinforcementReportModalLabels = {
  reportPrefix: 'Rapport',
  unitsTitle: 'Détachement',
};

export function reinforcementReportTypeLabel(type: ReinforcementReportResponse['type']): string {
  return type === 'STATIONED' ? 'Soutien arrivé' : 'Troupes rentrées';
}

export function reinforcementReportUnitTotal(report: ReinforcementReportResponse): number {
  return Object.values(report.units ?? {}).reduce((sum, qty) => sum + qty, 0);
}

function formatCoord(x: number, y: number): string {
  return `${x}|${y}`;
}

function villageLabel(name: string | null | undefined, x: number, y: number): string {
  return name?.trim() || `Village ${formatCoord(x, y)}`;
}

function shortReportId(reportId: string): string {
  return `#${reportId.slice(0, 6).toUpperCase()}`;
}

function formatUnitTotal(total: number): string {
  return `${NUMBER_FORMATTER.format(total)} troupe${total > 1 ? 's' : ''}`;
}

function place({
  icon,
  label,
  name,
  x,
  y,
}: {
  icon: string;
  label: string;
  name: string | null | undefined;
  x: number;
  y: number;
}): ReinforcementReportPlace {
  return {
    coord: formatCoord(x, y),
    icon,
    label,
    name: villageLabel(name, x, y),
  };
}

export function reinforcementReportUnits(report: ReinforcementReportResponse): ReinforcementReportUnit[] {
  return Object.entries(report.units ?? {})
    .filter(([, quantity]) => quantity > 0)
    .map(([unitType, quantity]) => {
      const meta = unitMetaFor(unitType);
      return {
        icon: meta.iconPath ?? '/assets/army-power.png',
        label: quantity > 1 ? meta.pluralName : meta.name,
        quantity: NUMBER_FORMATTER.format(quantity),
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label, 'fr'));
}

export function reinforcementReportSubject(report: ReinforcementReportResponse): string {
  if (report.type === 'STATIONED') {
    return `Soutien arrivé · ${villageLabel(report.hostVillageName, report.hostX, report.hostY)}`;
  }
  return `Retour de renfort · ${villageLabel(report.originVillageName, report.originX, report.originY)}`;
}

export function reinforcementReportPreview(report: ReinforcementReportResponse): string {
  const total = reinforcementReportUnitTotal(report);
  const origin = villageLabel(report.originVillageName, report.originX, report.originY);
  const host = villageLabel(report.hostVillageName, report.hostX, report.hostY);
  const [from, to] = report.type === 'RETURNED' ? [host, origin] : [origin, host];
  return `${formatUnitTotal(total)} · ${from} vers ${to}`;
}

export function buildReinforcementReportModalProps(
  report: ReinforcementReportResponse,
  actions: ReinforcementReportAction[],
  onAction?: (action: ReinforcementReportAction) => void,
): ReinforcementReportModalProps {
  const isStationed = report.type === 'STATIONED';
  const origin = place({
    icon: isStationed ? '/assets/position.png' : '/assets/defense.png',
    label: isStationed ? 'Départ' : 'Garnison',
    name: isStationed ? report.originVillageName : report.hostVillageName,
    x: isStationed ? report.originX : report.hostX,
    y: isStationed ? report.originY : report.hostY,
  });
  const destination = place({
    icon: isStationed ? '/assets/defense.png' : '/assets/position.png',
    label: isStationed ? 'Garnison' : "Village d'origine",
    name: isStationed ? report.hostVillageName : report.originVillageName,
    x: isStationed ? report.hostX : report.originX,
    y: isStationed ? report.hostY : report.originY,
  });

  return {
    actions,
    banner: isStationed ? 'SOUTIEN ARRIVÉ' : 'TROUPES RENTRÉES',
    destination,
    heroIcon: isStationed ? '/assets/defense.png' : '/assets/position.png',
    labels: reinforcementReportLabels,
    maxHeight: 'min(90dvh, 760px)',
    onAction,
    origin,
    reportId: shortReportId(report.id),
    roleLabel: isStationed ? 'Soutien' : 'Retour',
    tone: isStationed ? 'stationed' : 'returned',
    units: reinforcementReportUnits(report),
    when: DATE_FORMATTER.format(new Date(report.timestamp)),
    width: 360,
  };
}
