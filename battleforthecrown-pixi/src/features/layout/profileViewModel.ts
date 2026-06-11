import type { BuildingDto, JoinedVillage, WorldMembership } from '@/api';
import type { KingdomPowerDto, VillageStrategyInfoDto } from '@/api/queries';
import type {
  PlayerProfileSheetProps,
  PlayerProfileSheetVillage,
} from '@/features/design-system/components/PlayerProfileSheet';
import { villageStyleOptions } from '@/features/design-system/components/villageStyleData';
import { WORLD_SIGIL_GLYPHS, WORLD_THEME_TOKENS } from '@/features/worlds/worldsViewModel';
import type { PublicWorld } from '@battleforthecrown/shared/world';
import { VILLAGE_LABEL_DISPLAY } from '@battleforthecrown/shared/village';
import {
  formatWorldPhase,
  getPlayerInitials,
  integerFormatter,
  PLAYER_PROFILE_LEVEL,
} from './headerHelpers';

/** Strategy id → display name, shared by GameHeader and VillageView profile sheets. */
export const strategyLabels: Record<string, string> = Object.fromEntries(
  villageStyleOptions.map((option) => [option.id, option.name]),
);

export interface ProfileVillagesParams {
  villages: JoinedVillage[];
  buildingsByVillageId: ReadonlyMap<string, BuildingDto[]>;
  powerByVillageId: ReadonlyMap<string, number>;
  strategyByVillageId: ReadonlyMap<string, VillageStrategyInfoDto>;
}

/** Pure transform: joined villages → `PlayerProfileSheet` village rows. */
export function buildProfileVillages({
  villages,
  buildingsByVillageId,
  powerByVillageId,
  strategyByVillageId,
}: ProfileVillagesParams): PlayerProfileSheetVillage[] {
  return villages.map((village) => {
    const strategy = strategyByVillageId.get(village.id)?.currentStrategy;
    const level =
      village.castleLevel ??
      buildingsByVillageId.get(village.id)?.find((building) => building.type === 'CASTLE')?.level ??
      '—';

    return {
      capital: village.isCapital,
      coords: `${village.x}:${village.y}`,
      id: village.id,
      label: village.label ? VILLAGE_LABEL_DISPLAY[village.label] : undefined,
      level,
      name: village.name,
      power: powerByVillageId.get(village.id)?.toLocaleString('fr-FR') ?? '—',
      style: strategy ? { id: strategy, label: strategyLabels[strategy] ?? strategy } : undefined,
    };
  });
}

export interface ProfileSheetDataParams {
  kingdomPower: KingdomPowerDto | undefined;
  crownBalance: number | null | undefined;
  user: { displayName?: string | null } | null | undefined;
  villagesCount: number;
  activePublicWorld: PublicWorld | undefined;
  activeMembership: WorldMembership | undefined;
  worldId: string | null;
}

/** Pure transform: session/world data → `PlayerProfileSheet` player/stats/world props. */
export function buildPlayerProfileSheetData({
  kingdomPower,
  crownBalance,
  user,
  villagesCount,
  activePublicWorld,
  activeMembership,
  worldId,
}: ProfileSheetDataParams): Pick<PlayerProfileSheetProps, 'player' | 'stats' | 'world'> {
  const power = kingdomPower ? integerFormatter.format(kingdomPower.kingdomPower) : '—';
  const crowns = Number.isFinite(crownBalance ?? NaN)
    ? integerFormatter.format(Math.floor(crownBalance ?? 0))
    : '—';

  return {
    player: {
      initials: getPlayerInitials(user?.displayName ?? 'Joueur'),
      level: PLAYER_PROFILE_LEVEL,
      name: user?.displayName ?? 'Joueur',
      online: Boolean(user),
      tribe: { cap: 0, members: 0, name: 'Sans tribu', role: 'À venir', tag: '—' },
    },
    stats: {
      crowns,
      defenses: 'À venir',
      points: 'À venir',
      power,
      raidsWon: 'À venir',
      rank: '—',
      rankTotal: '—',
      villages: villagesCount,
    },
    world: {
      day: activePublicWorld?.lifecycle.day ?? '—',
      name:
        activePublicWorld?.identity.displayName ??
        activeMembership?.worldName ??
        worldId ??
        'À venir',
      phase: formatWorldPhase(activePublicWorld),
      sigilGlyph: activePublicWorld
        ? WORLD_SIGIL_GLYPHS[activePublicWorld.identity.sigil]
        : WORLD_SIGIL_GLYPHS.crown,
      theme: activePublicWorld
        ? WORLD_THEME_TOKENS[activePublicWorld.identity.themeColor]
        : WORLD_THEME_TOKENS.green,
      total: activePublicWorld?.lifecycle.totalDays ?? '—',
    },
  };
}
