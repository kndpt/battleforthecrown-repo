import { useState } from "react";
import { BottomSheet, ProgressBar, ResourceIcon } from "@/ui";
import {
  BftcButton,
  GameBottomSheetPanel,
  RequirementChip,
  SegmentedControl,
  type SegmentedControlOption,
} from "@/features/design-system/components";
import {
  useCancelConstructionMutation,
  usePopulationQuery,
} from "@/api/queries";
import { useGameStore } from "@/stores/game";
import { useDisplayResources } from "@/features/resources/useDisplayResources";
import type { BuildingDto } from "@/api";
import { metaFor } from "./buildingMeta";
import { BuildingIcon } from "./BuildingIcon";
import {
  getBuildingLockState,
  type BuildingLockState,
} from "./buildingLockState";
import {
  BUILDING_DEFINITIONS,
  type BuildingType,
  type BuildingLevelDefinition,
} from "@battleforthecrown/shared/village/buildings";
import {
  computeConstructionProgress,
  formatRemaining,
} from "./constructionProgress";
import { useTickingNow } from "@/lib/useTickingNow";
import { publicAsset } from "@/lib/publicAsset";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BuildingManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: BuildingDto[];
  onBuildingClick: (building: BuildingDto) => void;
}

interface BuildingStatus {
  building: BuildingDto;
  lockState: BuildingLockState;
  group: string;
}

interface AffordabilityInfo {
  wood: boolean;
  stone: boolean;
  iron: boolean;
  population: boolean;
  overall: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUILDING_GROUP: Record<string, string> = {
  CASTLE: "Centre",
  COUNCIL_HALL: "Centre",
  WOOD: "Ressources",
  STONE: "Ressources",
  IRON: "Ressources",
  WAREHOUSE: "Ressources",
  QUARTER: "Ressources",
  HIDEOUT: "Ressources",
  BARRACKS: "Militaire",
  WALL: "Militaire",
  THRONE_HALL: "Militaire",
  WATCHTOWER: "Militaire",
};

const GROUP_ORDER = ["Centre", "Ressources", "Militaire"] as const;

const CATEGORIES = [
  { id: "all", label: "Tous" },
  { id: "Centre", label: "Centre" },
  { id: "Ressources", label: "Ressources" },
  { id: "Militaire", label: "Militaire" },
] as const;

const ENABLE_BUILDING_ACTION_FOOTER = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBuildTime(seconds: number): string {
  if (seconds === 0) return "Instantané";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins === 0 ? `${hours}h` : `${hours}h${remMins}m`;
}

function computeAffordability(
  building: BuildingDto,
  displayResources: { wood: number; stone: number; iron: number } | null,
  availablePopulation: number,
): AffordabilityInfo {
  const nextLevel = building.level + 1;
  const nextCost =
    BUILDING_DEFINITIONS[building.type as BuildingType]?.levels[nextLevel] ??
    null;
  if (!nextCost)
    return {
      wood: true,
      stone: true,
      iron: true,
      population: true,
      overall: true,
    };
  const wood = (displayResources?.wood ?? 0) >= nextCost.wood;
  const stone = (displayResources?.stone ?? 0) >= nextCost.stone;
  const iron = (displayResources?.iron ?? 0) >= nextCost.iron;
  const population = availablePopulation >= nextCost.population;
  return {
    wood,
    stone,
    iron,
    population,
    overall: wood && stone && iron && population,
  };
}

function getNextCost(building: BuildingDto): BuildingLevelDefinition | null {
  const nextLevel = building.level + 1;
  return (
    BUILDING_DEFINITIONS[building.type as BuildingType]?.levels[nextLevel] ??
    null
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  count: number;
  locked?: boolean;
}

function SectionHeader({ title, count, locked = false }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-2">
      <div
        className="w-2.5 h-2.5 rotate-45 flex-shrink-0"
        style={{
          background: locked
            ? "linear-gradient(to bottom, #a8b1ba, #6e7780)"
            : "linear-gradient(to bottom, #f1c40f, #d4a017)",
          border: `1.2px solid ${locked ? "#2e3338" : "#9e7b0d"}`,
        }}
      />
      <span
        className="font-cinzel text-[11px] font-bold uppercase tracking-[.22em]"
        style={{ color: locked ? "#5d6d6e" : "#3d2f1f" }}
      >
        {title}
      </span>
      <span
        className="font-cinzel text-[9.5px] font-bold px-2 py-0.5 rounded-full"
        style={{
          background: locked
            ? "linear-gradient(to bottom, #b6bec6, #8a939c)"
            : "linear-gradient(to bottom, #efe1bd, #d5be84)",
          color: locked ? "#1f2428" : "#3d2f1f",
          border: `1.2px solid ${locked ? "#4a525a" : "rgba(93,74,50,.45)"}`,
        }}
      >
        {count}
      </span>
      <div
        className="flex-1 h-px"
        style={{
          background: locked
            ? "linear-gradient(to right, #5d6d6e, transparent)"
            : "linear-gradient(to right, rgba(93,74,50,.5), transparent)",
        }}
      />
    </div>
  );
}

// ─── CastleLevelPill ──────────────────────────────────────────────────────────

function CastleLevelPill({ level }: { level: number }) {
  const castleMeta = metaFor("CASTLE");
  return (
    <div className="flex items-center gap-1.5">
      <BuildingIcon
        iconPath={castleMeta.iconPath}
        label="Château"
        emoji="🏰"
        width={23}
        height={23}
        imageClassName="object-contain drop-shadow"
        fallbackClassName="text-xl leading-none"
      />
      <span
        className="font-cinzel text-[13px] font-bold"
        style={{ color: "#3d2f1f" }}
      >
        Niv. {level}
      </span>
    </div>
  );
}

// ─── ResourceBit ──────────────────────────────────────────────────────────────

interface ResourceBitProps {
  type: "wood" | "stone" | "iron" | "population";
  value: number;
  canAfford: boolean;
}

function ResourceBit({ type, value, canAfford }: ResourceBitProps) {
  return (
    <span
      className="inline-flex items-center gap-[2px] font-game tabular-nums leading-none"
      style={{
        fontSize: "11px",
        fontWeight: 800,
        color: canAfford ? "#3d2f1f" : "#c0290a",
      }}
    >
      <ResourceIcon resource={type} size={14} fallbackToEmoji />
      {value}
    </span>
  );
}

function BuildTimeBit({ seconds }: { seconds: number }) {
  return (
    <span
      className="inline-flex items-center gap-[2px] font-game font-bold tabular-nums leading-none"
      style={{
        fontSize: "10.5px",
        color: "#3d2f1f",
      }}
    >
      <img
        src={publicAsset("/assets/clock.png")}
        alt=""
        width={14}
        height={14}
        className="object-contain"
      />
      {formatBuildTime(seconds)}
    </span>
  );
}

const BUILDING_CARD_RAIL_ITEM_STYLE: React.CSSProperties = {
  flex: "0 0 calc((100% - 16px) / 2.5)",
  minHeight: "190px",
};

const BUILDING_CARD_IMAGE_STYLE: React.CSSProperties = {
  background: "#bfa36b",
};

const BUILDING_CARD_INFO_STYLE: React.CSSProperties = {
  background: "#f4df9f",
};

function buildingCardStyle(isSelected: boolean, isNew: boolean): React.CSSProperties {
  const borderColor = isNew
    ? "var(--game-blue-border, #1f5288)"
    : isSelected
      ? "var(--game-gold-dark, #d4a017)"
      : "var(--parchment-700, #8b7355)";

  return {
    ...BUILDING_CARD_RAIL_ITEM_STYLE,
    background: BUILDING_CARD_IMAGE_STYLE.background,
    border: `${isSelected || isNew ? "3px" : "2px"} solid ${borderColor}`,
    animation: isNew ? "bftc-building-new-pulse 1.8s ease-in-out infinite" : "none",
    boxShadow: "none",
  };
}

function BuildingCardRail({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// ─── BuildingGridCard ─────────────────────────────────────────────────────────

interface BuildingGridCardProps {
  status: BuildingStatus;
  isSelected: boolean;
  affordability: AffordabilityInfo;
  nextCost: BuildingLevelDefinition | null;
  onSelect: () => void;
}

function BuildingGridCard({
  status,
  isSelected,
  affordability,
  nextCost,
  onSelect,
}: BuildingGridCardProps) {
  const { building, lockState } = status;
  const meta = metaFor(building.type);
  const isNew = lockState.state === "unbuilt-available";
  const isMax = lockState.state === "max";
  const isInProgress = lockState.state === "in-progress";

  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className="rounded-xl overflow-hidden text-left w-full transition-transform active:scale-[.97] focus:outline-none"
      aria-pressed={isSelected}
      style={buildingCardStyle(isSelected, isNew)}
    >
      {/* Image area */}
      <div
        className="relative h-[104px] flex items-center justify-center"
        style={BUILDING_CARD_IMAGE_STYLE}
      >
        <BuildingIcon
          iconPath={meta.iconPath}
          label={meta.label}
          emoji={meta.emoji}
          width={78}
          height={78}
          imageClassName={isNew ? "object-contain opacity-85 grayscale-[.25]" : "object-contain"}
          fallbackClassName={isNew ? "text-6xl opacity-85 grayscale-[.25]" : "text-6xl"}
        />

        {/* Level / NOUVEAU badge (top-left) */}
        <div className="absolute left-1 top-0.5">
          {isNew ? (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full font-cinzel font-bold text-white uppercase leading-none"
              style={{
                fontSize: "9px",
                letterSpacing: ".1em",
                background: "linear-gradient(to bottom, #5db8e0, #2480b8)",
                border: "1.5px solid #1458a0",
              }}
            >
              NOUVEAU
            </span>
          ) : (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-full font-cinzel font-bold leading-none"
              style={{
                fontSize: "9.5px",
                background: "linear-gradient(to bottom, #f6d57b, #c9900c)",
                border: "1.5px solid #7a5200",
                color: "#3a2a00",
              }}
            >
              Niv.{building.level}
            </span>
          )}
        </div>

        {nextCost && !isMax && !isInProgress && (
          <div className="absolute bottom-1 right-1">
            <BuildTimeBit seconds={nextCost.timeSeconds} />
          </div>
        )}
      </div>

      {/* Info area */}
      <div
        className="flex min-h-[80px] flex-col px-2 pt-2 pb-2"
        style={BUILDING_CARD_INFO_STYLE}
      >
        <div
          className="line-clamp-2 min-h-[25px] font-cinzel font-bold uppercase leading-tight"
          style={{
            fontSize: "11px",
            color: "#3d2f1f",
            letterSpacing: "0",
          }}
        >
          {meta.label}
        </div>

        {nextCost && !isMax && !isInProgress && (
          <>
            {/* Line 1: wood · stone · iron */}
            <div className="mt-0.5 flex items-center gap-1">
              <ResourceBit
                type="wood"
                value={nextCost.wood}
                canAfford={affordability.wood}
              />
              <ResourceBit
                type="stone"
                value={nextCost.stone}
                canAfford={affordability.stone}
              />
              <ResourceBit
                type="iron"
                value={nextCost.iron}
                canAfford={affordability.iron}
              />
            </div>
            {/* Line 2: population */}
            <div className="mt-0.5 flex items-center gap-1">
              <ResourceBit
                type="population"
                value={nextCost.population}
                canAfford={affordability.population}
              />
            </div>
          </>
        )}

        {isMax && (
          <div
            className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full border px-2 py-1 font-cinzel font-bold uppercase leading-none"
            style={{
              background: "linear-gradient(to bottom, #d6ecc4, #a8d28d)",
              borderColor: "#3a6c1f",
              color: "#2d5a16",
              fontSize: "10px",
            }}
          >
            ✓ Max
          </div>
        )}

        {isInProgress && (
          <div
            className="mt-0.5 font-cinzel font-bold"
            style={{ fontSize: "10px", color: "#c9900c" }}
          >
            ⏳ En cours…
          </div>
        )}
      </div>
    </button>
  );
}

// ─── LockedGridCard ───────────────────────────────────────────────────────────

function LockedGridCard({ status }: { status: BuildingStatus }) {
  const meta = metaFor(status.building.type);
  const req = status.lockState.requiredCastleLevel;

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className="relative rounded-xl overflow-hidden"
      style={{
        ...BUILDING_CARD_RAIL_ITEM_STYLE,
        background:
          "repeating-linear-gradient(-45deg, #f2e7cf 0 8px, #e6d8bc 8px 16px)",
        border: "2px solid rgba(93,74,50,.55)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(255,249,240,.32)" }}
      />
      <div className="relative flex min-h-[186px] flex-col px-2 py-2">
        <div
          className="line-clamp-2 text-center font-cinzel font-bold uppercase leading-tight"
          style={{ fontSize: "9.5px", color: "#5f5646", letterSpacing: "0" }}
        >
          {meta.label}
        </div>

        <div className="relative mt-1 flex min-h-[106px] flex-1 items-center justify-center pb-5">
          <BuildingIcon
            iconPath={meta.iconPath}
            label={meta.label}
            emoji={meta.emoji}
            width={82}
            height={82}
            imageClassName="object-contain grayscale opacity-35"
            fallbackClassName="text-6xl opacity-35"
          />
          <img
            src={publicAsset("/assets/lock.png")}
            alt=""
            className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 object-contain"
          />
        </div>

        <RequirementChip
          className="absolute bottom-2 left-1/2 min-w-[104px] -translate-x-1/2 justify-center whitespace-nowrap px-2.5 py-1 text-[10.5px] shadow-[0_2px_0_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.3)]"
          icon="/assets/castle.png"
          state="locked"
        >
          <span>{req !== null ? `Niv. ${req} requis` : "Verrouillé"}</span>
        </RequirementChip>
      </div>
    </div>
  );
}

// ─── ActionTray ───────────────────────────────────────────────────────────────

interface ActionTrayProps {
  status: BuildingStatus;
  affordability: AffordabilityInfo;
  nextCost: BuildingLevelDefinition | null;
  onAction: (building: BuildingDto) => void;
  villageId: string | null;
}

function ActionTray({
  status,
  affordability,
  nextCost,
  onAction,
  villageId,
}: ActionTrayProps) {
  const { building, lockState } = status;
  const meta = metaFor(building.type);
  const now = useTickingNow(1_000);
  const progress = computeConstructionProgress(
    { startTime: building.startTime, endTime: building.endTime },
    now,
  );
  const cancel = useCancelConstructionMutation();
  const isNew = lockState.state === "unbuilt-available";
  const isMax = lockState.state === "max";
  const isInProgress = progress.inProgress;
  const nextLevel = building.level + 1;

  const handleCancel = () => {
    if (!villageId) return;
    cancel.mutate({ villageId, buildingId: building.id });
  };

  // Shared cost chip style
  const costChip = (affordable: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    height: "23px",
    padding: "0 9px",
    borderRadius: "999px",
    fontFamily: "Cinzel, serif",
    fontSize: "12px",
    fontWeight: 800,
    background: affordable
      ? "linear-gradient(to bottom, rgba(254,249,240,.88), rgba(232,212,168,.7))"
      : "linear-gradient(to bottom, #f0b3aa, #cf6d60)",
    border: `1.2px solid ${affordable ? "rgba(93,74,50,.34)" : "#8a1208"}`,
    color: affordable ? "#3d2f1f" : "#7a1d17",
  });

  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #e8d4a8, #d5be84)",
        borderTop: "2px solid var(--parchment-700, #8b7355)",
      }}
    >
      <div className="px-3.5 pt-3 pb-5">
        {/* Building identity row */}
        <div className="flex items-center gap-3 mb-3">
          <BuildingIcon
            iconPath={meta.iconPath}
            label={meta.label}
            emoji={meta.emoji}
            width={42}
            height={42}
            imageClassName="object-contain flex-shrink-0 drop-shadow"
            fallbackClassName="text-3xl flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div
              className="font-cinzel font-black uppercase truncate"
              style={{
                fontSize: "17px",
                color: "#3d2f1f",
                letterSpacing: ".04em",
              }}
            >
              {meta.label}
            </div>
            <div
              className="font-cinzel italic"
              style={{ fontSize: "10px", color: "#6d5838", marginTop: "1px" }}
            >
              {isNew
                ? "Niv. 0 → 1"
                : isMax
                  ? `Niv. ${building.level} · max`
                  : `Niv. ${building.level} → ${nextLevel}`}
            </div>
          </div>
          {/* Close */}
        </div>

        {/* In-progress state */}
        {isInProgress && (
          <div className="space-y-2">
            <ProgressBar
              value={progress.percent}
              showPercentage
              variant="warning"
              size="sm"
              animated
            />
            <div className="flex items-center gap-2">
            <div
              className="font-cinzel font-medium flex-1 text-center"
                style={{ fontSize: "11px", color: "#9e7b0d" }}
              >
                {formatRemaining(progress.remainingMs)}
              </div>
              <button
                onClick={handleCancel}
                disabled={cancel.isPending}
                className="px-3 py-1.5 rounded-lg font-cinzel font-bold"
                style={{
                  fontSize: "11px",
                  background: "rgba(192,41,26,.7)",
                  border: "1.5px solid #a93226",
                  color: "#ffe2dc",
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Max level */}
        {isMax && (
          <BftcButton
            className="w-full justify-center py-2 font-cinzel text-[12px] uppercase tracking-[.06em]"
            disabled
            size="md"
            variant="success"
          >
            ✓ Niveau maximum atteint
          </BftcButton>
        )}

        {/* Costs + CTA */}
        {!isMax && !isInProgress && nextCost && (
          <>
            {/* Cost pills */}
            <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
              <span
                className="font-cinzel font-bold uppercase tracking-[.22em] flex-shrink-0"
                style={{ fontSize: "9px", color: "#9a7a52" }}
              >
                Coûts
              </span>
              <span style={costChip(affordability.wood)}>
                <ResourceIcon resource="wood" size={13} fallbackToEmoji />
                {nextCost.wood}
              </span>
              <span style={costChip(affordability.stone)}>
                <ResourceIcon resource="stone" size={13} fallbackToEmoji />
                {nextCost.stone}
              </span>
              <span style={costChip(affordability.iron)}>
                <ResourceIcon resource="iron" size={13} fallbackToEmoji />
                {nextCost.iron}
              </span>
              <span style={costChip(affordability.population)}>
                <ResourceIcon resource="population" size={13} fallbackToEmoji />
                {nextCost.population}
              </span>
            </div>

            {/* CTA row */}
            <div className="flex gap-2 items-center">
              <button
                onClick={() => onAction(building)}
                disabled={!affordability.overall}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-[10px] font-cinzel font-black uppercase tracking-[.06em]"
                style={{
                  fontSize: "12px",
                  background: affordability.overall
                    ? "linear-gradient(to bottom, #52b058, #2e7834)"
                    : "linear-gradient(to bottom, #6a5a48, #4a3a2c)",
                  border: `2px solid ${affordability.overall ? "#2a7030" : "#3a2a1c"}`,
                  color: affordability.overall ? "#fff" : "#9a8a7a",
                  textShadow: affordability.overall
                    ? "1px 1px 1px rgba(0,0,0,.45)"
                    : "none",
                  boxShadow: affordability.overall
                    ? "0 3px 0 rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.28)"
                    : "none",
                }}
              >
                ⚒ {isNew ? "Construire" : `Améliorer → Niv. ${nextLevel}`}
              </button>

              {/* Build time */}
              <div
                className="inline-flex items-center gap-2 font-cinzel font-black whitespace-nowrap flex-shrink-0"
                style={{
                  fontSize: "13px",
                  color: "#3d2f1f",
                }}
              >
                <img
                  src={publicAsset("/assets/clock.png")}
                  alt="⏱"
                  width={17}
                  height={17}
                  style={{ objectFit: "contain", opacity: 0.7 }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
                {formatBuildTime(nextCost.timeSeconds)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BuildingManagementPanel({
  isOpen,
  onClose,
  buildings,
  onBuildingClick,
}: BuildingManagementPanelProps) {
  const villageId = useGameStore((state) => state.villageId);

  const { display: displayResources } = useDisplayResources(villageId);
  const populationQuery = usePopulationQuery(villageId);
  const availablePopulation = populationQuery.data
    ? Math.max(0, populationQuery.data.max - populationQuery.data.used)
    : 0;

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trayDismissed, setTrayDismissed] = useState(false);

  const castle = buildings.find((b) => b.type === "CASTLE");
  const castleLevel = castle?.level ?? 0;

  const allStatuses: BuildingStatus[] = buildings
    .map((building) => ({
      building,
      lockState: getBuildingLockState(building, castleLevel),
      group: BUILDING_GROUP[building.type] ?? "Autres",
    }))
    .sort(
      (a, b) =>
        (metaFor(a.building.type).sortKey ?? 99) -
        (metaFor(b.building.type).sortKey ?? 99),
    );

  const availableStatuses = allStatuses.filter(
    ({ lockState }) => lockState.state !== "unbuilt-locked",
  );
  const lockedStatuses = allStatuses.filter(
    ({ lockState }) => lockState.state === "unbuilt-locked",
  );

  // Filter by active category tab
  const categoryAvailable =
    activeCategory === "all"
      ? availableStatuses
      : availableStatuses.filter(({ group }) => group === activeCategory);

  const categoryLocked =
    activeCategory === "all"
      ? lockedStatuses
      : lockedStatuses.filter(({ group }) => group === activeCategory);

  // Resolve selected: explicit user pick → first available (if not dismissed)
  const effectiveSelectedId = ENABLE_BUILDING_ACTION_FOOTER
    ? trayDismissed
      ? null
      : selectedId &&
          categoryAvailable.some(({ building }) => building.id === selectedId)
        ? selectedId
        : (categoryAvailable[0]?.building.id ?? null)
    : null;

  const selectedStatus =
    categoryAvailable.find(
      ({ building }) => building.id === effectiveSelectedId,
    ) ?? null;

  // Tab badges are notifications for newly constructible buildings only.
  const newStatuses = availableStatuses.filter(
    ({ lockState }) => lockState.state === "unbuilt-available",
  );
  const tabCounts: Record<string, number> = {
    all: newStatuses.length,
    ...GROUP_ORDER.reduce(
      (acc, group) => ({
        ...acc,
        [group]: newStatuses.filter(({ group: g }) => g === group).length,
      }),
      {},
    ),
  };

  const tabOptions: SegmentedControlOption[] = CATEGORIES.map((cat) => {
    const count = tabCounts[cat.id] ?? 0;
    return { badge: count > 0 ? String(count) : undefined, label: cat.label, value: cat.id };
  });

  // Affordability helper (uses closure over displayResources / availablePopulation)
  const afford = (building: BuildingDto): AffordabilityInfo =>
    computeAffordability(building, displayResources, availablePopulation);

  const handleCategoryChange = (nextCategory: string) => {
    setActiveCategory(nextCategory);
    setSelectedId(null);
    setTrayDismissed(false);
  };

  const handleAvailableCardSelect = (status: BuildingStatus) => {
    if (!ENABLE_BUILDING_ACTION_FOOTER) {
      onBuildingClick(status.building);
      return;
    }

    setSelectedId(status.building.id);
    setTrayDismissed(false);
  };

  // Group available buildings for "Tous" tab
  const groupedAvailable =
    activeCategory === "all"
      ? GROUP_ORDER.reduce<Record<string, BuildingStatus[]>>((acc, group) => {
          const items = categoryAvailable.filter(({ group: g }) => g === group);
          if (items.length > 0) acc[group] = items;
          return acc;
        }, {})
      : null;

  // ── Category tabs ──────────────────────────────────────────────────────────
  const tabs = (
    <SegmentedControl
      ariaLabel="Catégorie de bâtiments"
      className="flex w-full [&>button]:min-w-0 [&>button]:flex-1 [&>button]:justify-center [&>button]:px-1.5 [&>button]:py-1 [&>button]:text-[10.5px] [&>button]:uppercase [&>button]:tracking-[.05em]"
      onChange={handleCategoryChange}
      options={tabOptions}
      size="compact"
      value={activeCategory}
    />
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="75vh" zIndex={50}>
      <GameBottomSheetPanel
        eyebrow="Codex du chantier"
        title="Bâtir & améliorer"
        className="h-[75vh]"
        headerActions={<CastleLevelPill level={castleLevel} />}
        tabs={tabs}
        tabsFullWidth
        bodyClassName="flex flex-col overflow-hidden pt-2 pb-0"
        scrollable={false}
      >
        {/* Grid content */}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4"
          onClick={() => {
            if (ENABLE_BUILDING_ACTION_FOOTER && selectedStatus) {
              setTrayDismissed(true);
            }
          }}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {groupedAvailable !== null ? (
            GROUP_ORDER.map((group) => {
              const items = groupedAvailable[group];
              if (!items || items.length === 0) return null;
              return (
                <div key={group}>
                  <SectionHeader title={group} count={items.length} />
                  <BuildingCardRail>
                    {items.map((s) => (
                      <BuildingGridCard
                        key={s.building.id}
                        status={s}
                        isSelected={s.building.id === effectiveSelectedId}
                        affordability={afford(s.building)}
                        nextCost={getNextCost(s.building)}
                        onSelect={() => handleAvailableCardSelect(s)}
                      />
                    ))}
                  </BuildingCardRail>
                </div>
              );
            })
          ) : (
            <BuildingCardRail>
              {categoryAvailable.map((s) => (
                <BuildingGridCard
                  key={s.building.id}
                  status={s}
                  isSelected={s.building.id === effectiveSelectedId}
                  affordability={afford(s.building)}
                  nextCost={getNextCost(s.building)}
                  onSelect={() => handleAvailableCardSelect(s)}
                />
              ))}
            </BuildingCardRail>
          )}

          {/* Locked buildings */}
          {categoryLocked.length > 0 && (
            <div>
              <SectionHeader
                title="Verrouillés"
                count={categoryLocked.length}
                locked
              />
              <BuildingCardRail>
                {categoryLocked.map((s) => (
                  <LockedGridCard key={s.building.id} status={s} />
                ))}
              </BuildingCardRail>
            </div>
          )}

          {/* Bottom spacer when no tray */}
          {!selectedStatus && <div className="h-6" />}
        </div>

        {/* Action tray */}
        {ENABLE_BUILDING_ACTION_FOOTER && selectedStatus && (
          <div className="shrink-0">
            <ActionTray
              status={selectedStatus}
              affordability={afford(selectedStatus.building)}
              nextCost={getNextCost(selectedStatus.building)}
              onAction={onBuildingClick}
              villageId={villageId}
            />
          </div>
        )}
      </GameBottomSheetPanel>
    </BottomSheet>
  );
}
