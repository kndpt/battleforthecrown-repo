import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router';
import { usePublicWorldsQuery } from '@/api/queries';
import { GAME_SOUND_URLS, playGameSound } from '@/features/audio/gameSounds';
import { WorldEntryOverlay } from '@/features/design-system/worlds/WorldsSelectionDesign';
import { useGameStore } from '@/stores/game';
import {
  toWorldCardViewModel,
  WORLD_SIGIL_GLYPHS,
  WORLD_THEME_TOKENS,
  type WorldCardViewModel,
} from './worldsViewModel';

const WORLD_ENTRY_DURATION_MS = 2000;

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
    personalStats: null,
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

  useEffect(() => {
    if (!routeIsGame) return undefined;

    const timeoutId = window.setTimeout(() => {
      playGameSound(GAME_SOUND_URLS.worldEntryComplete);
    }, WORLD_ENTRY_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [location.key, routeIsGame, worldId]);

  if (!routeIsGame) return null;

  return <WorldEntryOverlay world={world} />;
}
