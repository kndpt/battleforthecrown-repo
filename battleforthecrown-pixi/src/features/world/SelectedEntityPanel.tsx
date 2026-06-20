import { useState } from "react";
import {
  MapEntityCallout,
  type MapEntityCalloutSection,
  type MapEntityCalloutStat,
} from "@/features/design-system/components";
import {
  useArmyInventoryQuery,
  useGarrisonQuery,
  usePublicVillagePowerQuery,
  useVillageIntelQuery,
} from "@/api/queries";
import type { MapEntity } from "@/api/world-types";
import type { OpenConquestDto } from "@battleforthecrown/shared/combat";
import type { VillageIntelDto } from "@battleforthecrown/shared/world";
import { useTickingNow } from "@/lib/useTickingNow";
import { formatRemaining } from "@/features/village/constructionProgress";
import { computeProgress } from "@/features/combat/kingdomActivitiesViewModel";
import { mapEntityCalloutSubtitle } from "./mapEntityLabels";
import {
  buildTroopsSection,
  summarizePresentTroops,
} from "./selectedEntityTroops";
import { formatIntelAge, toIntelView } from "./intelView";
import { ReportDetailModal } from "@/features/combat/ReportDetailModal";
import { useGameStore } from "@/stores/game";

interface SelectedEntityPanelProps {
  activeCapture?: OpenConquestDto | null;
  entity: MapEntity | null;
  currentVillageId?: string | null;
  onAttack?: (entity: MapEntity) => void;
  onCaravan?: (entity: MapEntity) => void;
  onScout?: (entity: MapEntity) => void;
  onGoToVillage?: (entity: MapEntity) => void;
}

export function SelectedEntityPanel({
  activeCapture,
  entity,
  currentVillageId,
  onAttack,
  onCaravan,
  onScout,
  onGoToVillage,
}: SelectedEntityPanelProps) {
  const now = useTickingNow(1_000);
  const worldId = useGameStore((state) => state.worldId);
  const [reportModal, setReportModal] = useState<{
    reportId: string;
    reportKind: "scout" | "combat";
  } | null>(null);

  const ownedVillageId =
    entity?.kind === "PLAYER_VILLAGE" && entity.isMine ? entity.id : null;
  const villagePowerId =
    entity?.kind === "PLAYER_VILLAGE" || entity?.kind === "BARBARIAN_VILLAGE"
      ? entity.id
      : null;

  const isEnemyVillage =
    entity != null &&
    (entity.kind === "PLAYER_VILLAGE" || entity.kind === "BARBARIAN_VILLAGE") &&
    !entity.isMine;
  const intelQuery = useVillageIntelQuery(
    worldId,
    entity?.id ?? null,
    isEnemyVillage,
  );

  const armyInventory = useArmyInventoryQuery(ownedVillageId);
  const garrison = useGarrisonQuery(ownedVillageId);
  const villagePower = usePublicVillagePowerQuery(villagePowerId);

  if (!entity) return null;

  // Village-only power (buildings); troops are excluded server-side.
  const stats: MapEntityCalloutStat[] | undefined = villagePower.data
    ? [
        {
          icon: "/assets/castle.png",
          value: villagePower.data.buildings.toLocaleString("fr-FR"),
        },
      ]
    : undefined;

  const isPlayerVillage = entity.kind === "PLAYER_VILLAGE" && !entity.isMine;
  const isOwnedPlayerVillage =
    entity.kind === "PLAYER_VILLAGE" && entity.isMine;
  const isBarbarian = entity.kind === "BARBARIAN_VILLAGE";
  const showAttack = (isBarbarian || isPlayerVillage) && Boolean(onAttack);
  const showScout = (isBarbarian || isPlayerVillage) && Boolean(onScout);
  const showReinforce =
    isOwnedPlayerVillage && entity.id !== currentVillageId && Boolean(onAttack);
  const showCaravan =
    isOwnedPlayerVillage &&
    entity.id !== currentVillageId &&
    Boolean(onCaravan);
  const showGoToVillage =
    isOwnedPlayerVillage &&
    entity.id !== currentVillageId &&
    Boolean(onGoToVillage);
  const shield = entity.newbieShield;
  const shieldEndsMs = shield ? Date.parse(shield.endsAt) : Number.NaN;
  const shieldRemainingMs = Number.isFinite(shieldEndsMs)
    ? Math.max(0, shieldEndsMs - now)
    : 0;
  const shieldActive = Boolean(shield?.active && shieldRemainingMs > 0);
  const shieldBlocksAttack = shieldActive && isPlayerVillage;

  const troopSection = troopsSectionFor(
    isOwnedPlayerVillage,
    armyInventory.data ?? [],
    garrison.data ?? [],
    armyInventory.isLoading || garrison.isLoading,
    armyInventory.isError || garrison.isError,
  );
  const captureSection = captureSectionFor(entity, activeCapture, now);
  const shieldSection = shieldSectionFor(entity, now);
  const intelSection = isEnemyVillage
    ? intelSectionFor(intelQuery.data ?? null)
    : null;
  const sections = [
    captureSection,
    shieldSection,
    troopSection,
    intelSection,
  ].filter((section): section is MapEntityCalloutSection => Boolean(section));
  const actions = [
    ...(showAttack
      ? [
          {
            icon: "⚔",
            label: shieldBlocksAttack
              ? `Joueur protégé — bouclier débutant (${formatRemaining(shieldRemainingMs)} restantes)`
              : "Attaquer",
            tone: "attack" as const,
            disabled: shieldBlocksAttack ? true : undefined,
            onClick: shieldBlocksAttack ? undefined : () => onAttack?.(entity),
          },
        ]
      : []),
    ...(showScout
      ? [
          {
            icon: "/assets/lupa.png",
            label: "Espionner",
            tone: "scout" as const,
            onClick: () => onScout?.(entity),
          },
        ]
      : []),
    ...(showReinforce
      ? [
          {
            icon: "🛡",
            label: "Renforcer",
            tone: "support" as const,
            onClick: () => onAttack?.(entity),
          },
        ]
      : []),
    ...(showCaravan
      ? [
          {
            icon: "📦",
            label: "Envoyer ressources",
            tone: "support" as const,
            onClick: () => onCaravan?.(entity),
          },
        ]
      : []),
    ...(showGoToVillage
      ? [
          {
            icon: "↪",
            label: "Aller à ce village",
            tone: "support" as const,
            onClick: () => onGoToVillage?.(entity),
          },
        ]
      : []),
    ...(isEnemyVillage && intelQuery.data
      ? [
          {
            icon: "📋",
            label: "Voir rapport source",
            tone: "support" as const,
            onClick: () => {
              const d = intelQuery.data;
              if (!d) return;
              setReportModal({
                reportId: d.sourceReportId,
                reportKind: d.sourceKind === "SCOUT" ? "scout" : "combat",
              });
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <MapEntityCallout
        actions={actions}
        coordinates={`${entity.x}|${entity.y}`}
        sections={sections}
        stats={stats}
        subtitle={mapEntityCalloutSubtitle(entity)}
        tier={entity.tier ? { label: `★ ${entity.tier}` } : undefined}
        title={entity.name}
        titleIcon={isBarbarian ? "★" : undefined}
      />
      {reportModal && (
        <ReportDetailModal
          reportId={reportModal.reportId}
          reportKind={reportModal.reportKind}
          onClose={() => setReportModal(null)}
        />
      )}
    </>
  );
}

function captureSectionFor(
  entity: MapEntity,
  activeCapture: OpenConquestDto | null | undefined,
  nowMs: number,
): MapEntityCalloutSection | null {
  if (activeCapture) {
    const startedAt = Date.parse(activeCapture.captureStartedAt);
    const captureUntil = Date.parse(activeCapture.captureUntil);
    const elapsedMs = Number.isFinite(startedAt)
      ? Math.max(0, nowMs - startedAt)
      : 0;
    const remainingMs = Number.isFinite(captureUntil)
      ? Math.max(0, captureUntil - nowMs)
      : 0;
    const progress = computeProgress(startedAt, captureUntil, nowMs);

    return {
      title: "Capture",
      rows: [
        {
          icon: "/assets/castle.png",
          label: "Depuis",
          value: activeCapture.attackerVillageName || "Village inconnu",
        },
        {
          icon: "/assets/clock.png",
          label: "Écoulé",
          value: formatRemaining(elapsedMs),
        },
        {
          icon: "/assets/clock.png",
          label: "Reste",
          value: formatRemaining(remainingMs),
        },
      ],
      progress: {
        label: `${Math.round(progress)}%`,
        value: progress,
      },
    };
  }

  if (!entity.captureWindow) return null;

  const captureUntil = Date.parse(entity.captureWindow.captureUntil);
  const remainingMs = Number.isFinite(captureUntil)
    ? Math.max(0, captureUntil - nowMs)
    : 0;

  return {
    title: "Capture",
    rows: [
      {
        icon: "/assets/clock.png",
        label: "Reste",
        value: formatRemaining(remainingMs),
      },
    ],
  };
}

function shieldSectionFor(
  entity: MapEntity,
  nowMs: number,
): MapEntityCalloutSection | null {
  const shield = entity.newbieShield;
  if (!shield?.active) return null;
  const endsAt = Date.parse(shield.endsAt);
  const remainingMs = Number.isFinite(endsAt) ? Math.max(0, endsAt - nowMs) : 0;
  if (remainingMs <= 0) return null;
  return {
    title: "Bouclier débutant",
    rows: [
      {
        icon: "/assets/clock.png",
        label: "Joueur protégé",
        value: formatRemaining(remainingMs),
      },
    ],
  };
}

function intelSectionFor(
  data: VillageIntelDto | null,
): MapEntityCalloutSection | null {
  if (data === null) {
    return {
      title: "Dernière intel",
      rows: [{ label: "Aucune intel", value: "" }],
    };
  }
  const view = toIntelView(data);
  const rows: MapEntityCalloutSection["rows"] = [];

  if (view.units.length > 0) {
    for (const entry of view.units) {
      rows.push({ label: entry.unitType, value: String(entry.quantity) });
    }
  } else {
    rows.push({ label: "Armée", value: "—" });
  }

  rows.push({
    label: "Bois",
    value: view.resources.wood.toLocaleString("fr-FR"),
  });
  rows.push({
    label: "Pierre",
    value: view.resources.stone.toLocaleString("fr-FR"),
  });
  rows.push({
    label: "Fer",
    value: view.resources.iron.toLocaleString("fr-FR"),
  });
  rows.push({ label: "Rempart", value: view.wallLabel });
  rows.push({ label: "Style", value: view.styleLabel });
  rows.push({ label: "Observé", value: formatIntelAge(data.seenAt) });

  return { title: "Dernière intel", rows };
}

function troopsSectionFor(
  isOwnedPlayerVillage: boolean,
  inventory: Parameters<typeof summarizePresentTroops>[0],
  garrison: Parameters<typeof summarizePresentTroops>[1],
  isLoading: boolean,
  isError: boolean,
) {
  if (!isOwnedPlayerVillage || isError) return null;
  if (isLoading) {
    return {
      title: "Troupes présentes",
      rows: [{ label: "Chargement", value: "..." }],
    };
  }
  return buildTroopsSection(summarizePresentTroops(inventory, garrison));
}
