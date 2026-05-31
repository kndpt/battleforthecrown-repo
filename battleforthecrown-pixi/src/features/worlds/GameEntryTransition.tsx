import { useEffect, useMemo, useState } from 'react';
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

interface EntryTransitionState {
  isVisible: boolean;
  pathname: string;
  routeIsGame: boolean;
  sequence: number;
}

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
  const [entryTransition, setEntryTransition] = useState<EntryTransitionState>(() => ({
    isVisible: routeIsGame,
    pathname: location.pathname,
    routeIsGame,
    sequence: routeIsGame ? 1 : 0,
  }));

  const gamePathChangedDuringTransition =
    routeIsGame && entryTransition.routeIsGame && entryTransition.isVisible && entryTransition.pathname !== location.pathname;

  if (entryTransition.routeIsGame !== routeIsGame || gamePathChangedDuringTransition) {
    const enteredGame = routeIsGame && !entryTransition.routeIsGame;
    setEntryTransition({
      isVisible: enteredGame,
      pathname: location.pathname,
      routeIsGame,
      sequence: enteredGame ? entryTransition.sequence + 1 : entryTransition.sequence,
    });
  }

  const showEntryTransition = routeIsGame && entryTransition.isVisible;

  const world = useMemo(() => {
    const activePublicWorld = publicWorlds.data?.find((candidate) => candidate.id === worldId);
    return activePublicWorld
      ? toWorldCardViewModel(activePublicWorld, new Set([activePublicWorld.id]))
      : fallbackWorldEntryModel(worldId);
  }, [publicWorlds.data, worldId]);

  useEffect(() => {
    if (!showEntryTransition) return undefined;

    const timeoutId = window.setTimeout(() => {
      playGameSound(GAME_SOUND_URLS.worldEntryComplete);
      setEntryTransition((current) =>
        current.sequence === entryTransition.sequence ? { ...current, isVisible: false } : current,
      );
    }, WORLD_ENTRY_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [entryTransition.sequence, showEntryTransition]);

  if (!routeIsGame || !showEntryTransition) return null;

  return <WorldEntryOverlay world={world} />;
}
