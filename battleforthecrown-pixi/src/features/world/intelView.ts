import type { VillageIntelDto } from "@battleforthecrown/shared/world";
import type { IntelSourceKind } from "@battleforthecrown/shared/world";
import type { VillageNaturalTrait } from "@battleforthecrown/shared/village";
import { STRATEGY_LABELS } from "@/lib/strategyLabels";

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
  /** Trait naturel de la cible, exposé UNIQUEMENT quand l'intel a été
   * scoutée (jamais dérivé côté client). Cf. run 093 § Décision de périmètre. */
  naturalTrait: VillageNaturalTrait | null;
}

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
    dto.strategy != null ? (STRATEGY_LABELS[dto.strategy] ?? "—") : "—";

  return {
    units,
    resources: dto.resources,
    wallLabel,
    styleLabel,
    sourceKind: dto.sourceKind,
    sourceReportId: dto.sourceReportId,
    naturalTrait: dto.naturalTrait,
  };
}
