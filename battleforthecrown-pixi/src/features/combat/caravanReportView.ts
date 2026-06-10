import type { CaravanReportResponse } from '@battleforthecrown/shared/combat';

export type CaravanReportResourcesDto = CaravanReportResponse['resources'];

export interface CaravanReportVillageView {
  name: string | null | undefined;
  x: number;
  y: number;
}

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export interface CaravanReportResourceLine {
  icon: string;
  key: keyof CaravanReportResourcesDto;
  label: string;
  value: string;
}

export interface CaravanReportResourceSection {
  id: 'resources' | 'credited' | 'returned' | 'lost';
  label: string;
  resources: CaravanReportResourceLine[];
  total: number;
}

const resourceMeta: Record<keyof CaravanReportResourcesDto, { icon: string; label: string }> = {
  iron: { icon: '/assets/resources/iron.png', label: 'Fer' },
  stone: { icon: '/assets/resources/stone.png', label: 'Pierre' },
  wood: { icon: '/assets/resources/wood.png', label: 'Bois' },
};

export function caravanReportTypeLabel(type: CaravanReportResponse['type']): string {
  return type === 'ARRIVED' ? 'Caravane arrivée' : 'Caravane rappelée';
}

export function caravanReportStateLabel(report: CaravanReportResponse): string {
  if (report.type === 'RETURNED' || report.recalled) {
    return 'Retour rappelé';
  }
  return 'Livraison arrivée';
}

export function caravanReportResourceTotal(resources: CaravanReportResourcesDto): number {
  return resources.wood + resources.stone + resources.iron;
}

function formatCoord(x: number, y: number): string {
  return `${x}|${y}`;
}

export function caravanReportVillageLabel(village: CaravanReportVillageView): string {
  return village.name?.trim() || `Village ${formatCoord(village.x, village.y)}`;
}

export function caravanReportOriginVillage(report: CaravanReportResponse): CaravanReportVillageView {
  return {
    name: report.originVillageName,
    x: report.originX,
    y: report.originY,
  };
}

export function caravanReportTargetVillage(report: CaravanReportResponse): CaravanReportVillageView {
  return {
    name: report.targetVillageName,
    x: report.targetX,
    y: report.targetY,
  };
}

function resourceLines(resources: CaravanReportResourcesDto): CaravanReportResourceLine[] {
  return (['wood', 'stone', 'iron'] as const).map((key) => ({
    icon: resourceMeta[key].icon,
    key,
    label: resourceMeta[key].label,
    value: NUMBER_FORMATTER.format(resources[key]),
  }));
}

export function caravanReportResourceSections(report: CaravanReportResponse): CaravanReportResourceSection[] {
  const sections: CaravanReportResourceSection[] = [
    {
      id: 'resources',
      label: 'Envoyées',
      resources: resourceLines(report.resources),
      total: caravanReportResourceTotal(report.resources),
    },
  ];

  if (report.type === 'ARRIVED') {
    sections.push({
      id: 'credited',
      label: 'Créditées',
      resources: resourceLines(report.credited),
      total: caravanReportResourceTotal(report.credited),
    });
  }

  if (report.type === 'RETURNED' || caravanReportResourceTotal(report.returned) > 0) {
    sections.push({
      id: 'returned',
      label: 'Restaurées',
      resources: resourceLines(report.returned),
      total: caravanReportResourceTotal(report.returned),
    });
  }

  if (caravanReportResourceTotal(report.lost) > 0) {
    sections.push({
      id: 'lost',
      label: 'Perdues',
      resources: resourceLines(report.lost),
      total: caravanReportResourceTotal(report.lost),
    });
  }

  return sections;
}

export function caravanReportSubject(report: CaravanReportResponse): string {
  const village = report.type === 'ARRIVED' ? caravanReportTargetVillage(report) : caravanReportOriginVillage(report);
  return `${caravanReportTypeLabel(report.type)} · ${caravanReportVillageLabel(village)}`;
}

export function caravanReportPreview(report: CaravanReportResponse): string {
  const total = report.type === 'ARRIVED'
    ? caravanReportResourceTotal(report.credited)
    : caravanReportResourceTotal(report.returned);
  const origin = caravanReportVillageLabel(caravanReportOriginVillage(report));
  const target = caravanReportVillageLabel(caravanReportTargetVillage(report));
  const route = report.type === 'ARRIVED' ? `${origin} vers ${target}` : `${target} vers ${origin}`;
  return `${NUMBER_FORMATTER.format(total)} ressources · ${route}`;
}

export function caravanReportWhen(report: CaravanReportResponse): string {
  return DATE_FORMATTER.format(new Date(report.timestamp));
}
