import type { PublicWorld } from "@battleforthecrown/shared/world";

export type WorldsTab = "open" | "planned" | "locked";
export type WorldCtaKind = "join" | "notify" | "locked" | "joined" | "rejoin";

export interface WorldThemeTokens {
  border: string;
  dark: string;
  glow: string;
  light: string;
}

export interface WorldPersonalStatsInput {
  kingdomPower: number;
  villageCount: number;
}

export interface WorldPersonalStatsViewModel {
  kingdomPowerLabel: string;
  villageCountLabel: string;
}

export interface WorldCardViewModel {
  ctaKind: WorldCtaKind;
  ctaLabel: string;
  dayLabel: string;
  displayName: string;
  id: string;
  inscriptionPhase: PublicWorld["lifecycle"]["inscriptionPhase"];
  isJoined: boolean;
  joinedCountLabel: string;
  lifecycleDay: number | null;
  lifecycleInscriptionLateDays: number;
  lifecycleInscriptionMainDays: number;
  lifecycleTotalDays: number;
  mapSizeLabel: string;
  opensInLabel: string | null;
  personalStats: WorldPersonalStatsViewModel | null;
  shieldLabel: string;
  sigilGlyph: string;
  statusLabel: string;
  tab: WorldsTab;
  tagline: string;
  tempoLabel: string;
  theme: WorldThemeTokens;
  themeColor: PublicWorld["identity"]["themeColor"];
  tierLabel: string;
}

export const WORLD_THEME_TOKENS: Record<
  PublicWorld["identity"]["themeColor"],
  WorldThemeTokens
> = {
  azure: {
    border: "#1f5288",
    dark: "#1f4d85",
    glow: "rgba(91,155,213,.42)",
    light: "#3a72b8",
  },
  crimson: {
    border: "#7d1e15",
    dark: "#7d1e15",
    glow: "rgba(192,57,43,.4)",
    light: "#c0392b",
  },
  gold: {
    border: "#9e7b0d",
    dark: "#c59e3f",
    glow: "rgba(246,213,123,.45)",
    light: "#f6d57b",
  },
  green: {
    border: "#3a6c1f",
    dark: "#2f5b1c",
    glow: "rgba(110,191,73,.45)",
    light: "#5a8f3a",
  },
  onyx: {
    border: "#3c2619",
    dark: "#0c0a08",
    glow: "rgba(60,38,25,.38)",
    light: "#2c2520",
  },
  purple: {
    border: "#43204a",
    dark: "#43204a",
    glow: "rgba(122,58,125,.34)",
    light: "#7a3a7d",
  },
  silver: {
    border: "#5d6d6e",
    dark: "#7c8088",
    glow: "rgba(176,184,192,.38)",
    light: "#b5b8be",
  },
  teal: {
    border: "#1c5b4d",
    dark: "#1c5b4d",
    glow: "rgba(58,143,125,.4)",
    light: "#3a8f7d",
  },
};

export const WORLD_SIGIL_GLYPHS: Record<
  PublicWorld["identity"]["sigil"],
  string
> = {
  crown: "♔",
  cross: "✠",
  flame: "♨",
  fleur: "⚜",
  lion: "♌",
  star: "✦",
  tower: "♜",
  tree: "⚘",
};

const tabByStatus: Record<PublicWorld["status"], WorldsTab> = {
  LOCKED: "locked",
  OPEN: "open",
  PLANNED: "planned",
};

const statusLabels: Record<PublicWorld["status"], string> = {
  LOCKED: "INSCRIPTIONS CLOSES",
  OPEN: "INSCRIPTIONS OUVERTES",
  PLANNED: "PLANIFIÉ",
};

const tierLabels: Record<PublicWorld["identity"]["tier"], string> = {
  CLASSED: "CLASSÉ",
  DEBUTANTS: "DÉBUTANTS",
};

const formatter = new Intl.NumberFormat("fr-FR");
const EMPTY_PERSONAL_STATS = new Map<string, WorldPersonalStatsInput>();
const EMPTY_VILLAGE_COUNTS = new Map<string, number>();

function formatCountdown(
  plannedOpenAt: string | null,
  nowMs: number,
): string | null {
  if (!plannedOpenAt) return null;
  const deltaMs = Date.parse(plannedOpenAt) - nowMs;
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return "bientôt";
  const totalHours = Math.ceil(deltaMs / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days <= 0) return `${hours}h`;
  return `${days}j ${hours}h`;
}

function ctaFor(
  world: PublicWorld,
  isJoined: boolean,
  villageCount?: number,
): Pick<WorldCardViewModel, "ctaKind" | "ctaLabel"> {
  if (isJoined && villageCount === 0) return { ctaKind: "rejoin", ctaLabel: "Revenir" };
  if (isJoined) return { ctaKind: "joined", ctaLabel: "Entrer" };
  if (world.status === "PLANNED")
    return { ctaKind: "notify", ctaLabel: "Me prévenir à l'ouverture" };
  if (world.status === "LOCKED")
    return { ctaKind: "locked", ctaLabel: "Inscriptions closes" };
  return { ctaKind: "join", ctaLabel: "S'inscrire" };
}

function formatVillageCount(count: number): string {
  return `${formatter.format(count)} village${count > 1 ? "s" : ""}`;
}

export function toWorldCardViewModel(
  world: PublicWorld,
  joinedWorldIds: ReadonlySet<string>,
  nowMs = Date.now(),
  personalStatsByWorldId: ReadonlyMap<
    string,
    WorldPersonalStatsInput
  > = EMPTY_PERSONAL_STATS,
  villageCountByWorldId: ReadonlyMap<string, number> = EMPTY_VILLAGE_COUNTS,
): WorldCardViewModel {
  const isJoined = joinedWorldIds.has(world.id);
  const villageCount = isJoined ? villageCountByWorldId.get(world.id) : undefined;
  const cta = ctaFor(world, isJoined, villageCount);
  const opensIn = formatCountdown(world.lifecycle.plannedOpenAt, nowMs);
  const day = world.status === "PLANNED" ? null : world.lifecycle.day;
  const personalStats = isJoined
    ? personalStatsByWorldId.get(world.id)
    : undefined;

  return {
    ...cta,
    dayLabel:
      world.status === "PLANNED"
        ? opensIn
          ? `Ouvre dans ${opensIn}`
          : "Ouverture planifiée"
        : day
          ? `J. ${day} / ${world.lifecycle.totalDays}`
          : `J. ? / ${world.lifecycle.totalDays}`,
    displayName: world.identity.displayName,
    id: world.id,
    inscriptionPhase: world.lifecycle.inscriptionPhase,
    isJoined,
    joinedCountLabel: formatter.format(world.joinedCount),
    lifecycleDay: day,
    lifecycleInscriptionLateDays: world.lifecycle.inscriptionLateDays,
    lifecycleInscriptionMainDays: world.lifecycle.inscriptionMainDays,
    lifecycleTotalDays: world.lifecycle.totalDays,
    mapSizeLabel: `${formatter.format(world.map.width)} × ${formatter.format(world.map.height)}`,
    opensInLabel: opensIn,
    personalStats: personalStats
      ? {
          kingdomPowerLabel: formatter.format(personalStats.kingdomPower),
          villageCountLabel: formatVillageCount(personalStats.villageCount),
        }
      : null,
    shieldLabel: `${formatter.format(world.lifecycle.newbieShieldHours)} h`,
    sigilGlyph: WORLD_SIGIL_GLYPHS[world.identity.sigil],
    statusLabel: statusLabels[world.status],
    tab: tabByStatus[world.status],
    tagline: world.identity.tagline,
    tempoLabel: world.tempoProfile === "standard" ? "STANDARD" : "CUSTOM",
    theme: WORLD_THEME_TOKENS[world.identity.themeColor],
    themeColor: world.identity.themeColor,
    tierLabel: tierLabels[world.identity.tier],
  };
}

export function buildWorldTabCounts(
  worlds: readonly WorldCardViewModel[],
): Record<WorldsTab, number> {
  return {
    locked: worlds.filter((world) => world.tab === "locked").length,
    open: worlds.filter((world) => world.tab === "open").length,
    planned: worlds.filter((world) => world.tab === "planned").length,
  };
}

export function filterWorldsByTab(
  worlds: readonly WorldCardViewModel[],
  tab: WorldsTab,
): WorldCardViewModel[] {
  return worlds.filter((world) => world.tab === tab);
}
