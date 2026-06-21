import type { VillageIntelDto } from "@battleforthecrown/shared/world";
import type { IntelSourceKind } from "@battleforthecrown/shared/world";

export interface IntelUnitEntry {
  unitType: string;
  quantity: number;
}

export interface IntelView {
  units: IntelUnitEntry[];
  resources: { wood: number; stone: number; iron: number };
  wallLabel: string;
  styleLabel: string;
  sourceKind: IntelSourceKind;
  sourceReportId: string;
}

const STYLE_LABELS: Record<string, string> = {
  FORTRESS: "Forteresse",
  RAIDERS: "Raiders",
  ECONOMIC: "Économique",
  BALANCED: "Équilibré",
};

export function formatIntelAge(
  seenAtIso: string,
  now: Date = new Date(),
): string {
  const diffMs = Math.max(0, now.getTime() - new Date(seenAtIso).getTime());
  if (diffMs < 3_600_000) {
    return `il y a ${Math.floor(diffMs / 60_000)}mn`;
  }
  if (diffMs < 86_400_000) {
    return `il y a ${Math.floor(diffMs / 3_600_000)}h`;
  }
  return `il y a ${Math.floor(diffMs / 86_400_000)}j`;
}

export function toIntelView(dto: VillageIntelDto): IntelView {
  const units: IntelUnitEntry[] = Object.entries(dto.units)
    .filter(([, qty]) => qty != null && qty > 0)
    .map(([unitType, quantity]) => ({
      unitType,
      quantity: quantity as number,
    }));

  const wallLabel =
    dto.wallLevel != null ? `Rempart niv. ${dto.wallLevel}` : "—";
  const styleLabel =
    dto.strategy != null ? (STYLE_LABELS[dto.strategy] ?? "—") : "—";

  return {
    units,
    resources: dto.resources,
    wallLabel,
    styleLabel,
    sourceKind: dto.sourceKind,
    sourceReportId: dto.sourceReportId,
  };
}
