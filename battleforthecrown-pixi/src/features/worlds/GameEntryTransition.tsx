import { useMemo } from 'react';
import { useLocation } from 'react-router';
import { usePublicWorldsQuery } from '@/api/queries';
import { WorldEntryOverlay } from '@/features/design-system/worlds/WorldsSelectionDesign';
import { useGameStore } from '@/stores/game';
import {
  toWorldCardViewModel,
  WORLD_SIGIL_GLYPHS,
  WORLD_THEME_TOKENS,
  type WorldCardViewModel,
} from './worldsViewModel';

function isGameRoute(pathname: string): boolean {
  return pathname === '/game' || pathname.startsWith('/game/');
}

function fallbackWorldEntryModel(worldId: string | null): WorldCardViewModel {
  return {
    ctaKind: 'joined',
    ctaLabel: 'Entrer dans le royaume',
    dayLabel: '',
    displayName: worldId ?? 'Royaume',
    id: worldId ?? 'current-world',
    inscriptionPhase: 'main',
    isJoined: true,
    joinedCountLabel: '',
    lifecycleDay: null,
    lifecycleTotalDays: 60,
    opensInLabel: null,
    sigilGlyph: WORLD_SIGIL_GLYPHS.crown,
    statusLabel: 'INSCRIPTION LIBRE',
    tab: 'open',
    tagline: '',
    tempoLabel: 'STANDARD',
    theme: WORLD_THEME_TOKENS.green,
    themeColor: 'green',
    tierLabel: 'DÉBUTANTS',
  };
}

export function GameEntryTransition() {
  const location = useLocation();
  const worldId = useGameStore((state) => state.worldId);
  const publicWorlds = usePublicWorldsQuery();
  const routeIsGame = isGameRoute(location.pathname);

  const world = useMemo(() => {
    const activePublicWorld = publicWorlds.data?.find((candidate) => candidate.id === worldId);
    return activePublicWorld
      ? toWorldCardViewModel(activePublicWorld, new Set([activePublicWorld.id]))
      : fallbackWorldEntryModel(worldId);
  }, [publicWorlds.data, worldId]);

  if (!routeIsGame) return null;

  return <WorldEntryOverlay world={world} />;
}
