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
  lostValue?: string;
  primaryAmount: number;
  primaryLabel: string;
  primaryValue: string;
  sentValue: string;
}

export interface CaravanReportSummary {
  body: string;
  lostTotal: number;
  primaryLabel: string;
  primaryTotal: number;
  resources: CaravanReportResourceLine[];
  sentTotal: number;
  title: string;
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
    return 'Caravane rentrée';
  }
  return caravanReportResourceTotal(report.lost) > 0 ? 'Livraison partielle' : 'Livraison réussie';
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

function formatResource(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

function deliveredResources(report: CaravanReportResponse): CaravanReportResourcesDto {
  return report.type === 'ARRIVED' ? report.credited : report.returned;
}

function resourceLines(report: CaravanReportResponse): CaravanReportResourceLine[] {
  const delivered = deliveredResources(report);
  const primaryLabel = report.type === 'ARRIVED' ? 'Livré' : 'Récupéré';
  const keys = (['wood', 'stone', 'iron'] as const).filter(
    (key) => report.resources[key] > 0 || delivered[key] > 0 || report.lost[key] > 0,
  );
  const visibleKeys = keys.length > 0 ? keys : (['wood', 'stone', 'iron'] as const);

  return visibleKeys.map((key) => ({
    icon: resourceMeta[key].icon,
    key,
    label: resourceMeta[key].label,
    lostValue: report.lost[key] > 0 ? formatResource(report.lost[key]) : undefined,
    primaryAmount: delivered[key],
    primaryLabel,
    primaryValue: formatResource(delivered[key]),
    sentValue: formatResource(report.resources[key]),
  }));
}

export function caravanReportSummary(report: CaravanReportResponse): CaravanReportSummary {
  const sentTotal = caravanReportResourceTotal(report.resources);
  const primaryTotal = caravanReportResourceTotal(deliveredResources(report));
  const lostTotal = caravanReportResourceTotal(report.lost);
  const primaryLabel = report.type === 'ARRIVED' ? 'Livré' : 'Récupéré';

  if (report.type === 'RETURNED') {
    return {
      body: primaryTotal === 0
        ? lostTotal > 0
          ? `Aucune ressource n'a pu revenir au village d'origine. ${formatResource(lostTotal)} n'ont pas pu être stockées.`
          : "Aucune ressource n'était transportée."
        : lostTotal > 0
          ? `${formatResource(primaryTotal)} ressources sont revenues au village d'origine. ${formatResource(lostTotal)} n'ont pas pu être stockées.`
          : `${formatResource(primaryTotal)} ressources sont revenues au village d'origine.`,
      lostTotal,
      primaryLabel,
      primaryTotal,
      resources: resourceLines(report),
      sentTotal,
      title: lostTotal > 0 ? 'Retour partiel' : 'Retour complet',
    };
  }

  return {
    body: primaryTotal === 0
      ? lostTotal > 0
        ? `Aucune ressource n'a pu être livrée. ${formatResource(lostTotal)} n'ont pas pu entrer dans l'Entrepôt.`
        : "Aucune ressource n'était transportée."
      : lostTotal > 0
        ? `${formatResource(primaryTotal)} ressources ont été livrées. ${formatResource(lostTotal)} n'ont pas pu entrer dans l'Entrepôt.`
        : `${formatResource(primaryTotal)} ressources ont été livrées au village destinataire.`,
    lostTotal,
    primaryLabel,
    primaryTotal,
    resources: resourceLines(report),
    sentTotal,
    title: lostTotal > 0 ? 'Entrepôt plein' : 'Livraison complète',
  };
}

export function caravanReportSubject(report: CaravanReportResponse): string {
  return caravanReportSummary(report).title;
}

export function caravanReportPreview(report: CaravanReportResponse): string {
  const summary = caravanReportSummary(report);
  const origin = caravanReportVillageLabel(caravanReportOriginVillage(report));
  const target = caravanReportVillageLabel(caravanReportTargetVillage(report));
  const route = report.type === 'ARRIVED' ? `${origin} vers ${target}` : `${target} vers ${origin}`;
  const primary = summary.primaryTotal > 0
    ? `${formatResource(summary.primaryTotal)} ${summary.primaryLabel.toLowerCase()}`
    : report.type === 'ARRIVED'
      ? 'Aucune ressource livrée'
      : 'Aucune ressource récupérée';
  const loss = summary.lostTotal > 0 ? ` · ${formatResource(summary.lostTotal)} perdues` : '';
  return `${primary}${loss} · ${route}`;
}

export function caravanReportWhen(report: CaravanReportResponse): string {
  return DATE_FORMATTER.format(new Date(report.timestamp));
}
