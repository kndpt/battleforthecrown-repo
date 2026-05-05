import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { queryClient } from '@/api/query-client';
import { LandingScreen } from '@/features/auth/LandingScreen';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { RegisterScreen } from '@/features/auth/RegisterScreen';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { WorldSelector } from '@/features/worlds/WorldSelector';
import { MyWorldsScreen } from '@/features/worlds/MyWorldsScreen';
import { Spinner } from '@/ui/spinners';
import { useGameStore } from '@/stores/game';
import { DebugOverlay } from '@/features/layout/DebugOverlay';

const GameScreen = lazy(() =>
  import('@/features/game/GameScreen').then((m) => ({ default: m.GameScreen })),
);
const WorldMapScreen = lazy(() =>
  import('@/features/world/WorldMapScreen').then((m) => ({ default: m.WorldMapScreen })),
);
const ArmyScreen = lazy(() =>
  import('@/features/army/ArmyScreen').then((m) => ({ default: m.ArmyScreen })),
);
const MessagesScreen = lazy(() =>
  import('@/features/combat/MessagesScreen').then((m) => ({ default: m.MessagesScreen })),
);
const UiTestScreen = lazy(() =>
  import('@/features/ui-test/UiTestScreen').then((m) => ({ default: m.UiTestScreen })),
);

function GameLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function GameGuard() {
  const worldId = useGameStore((state) => state.worldId);
  if (!worldId) {
    return <Navigate to="/my-worlds" replace />;
  }
  return (
    <Suspense fallback={<GameLoader />}>
      <GameScreen />
    </Suspense>
  );
}

function WorldMapGuard() {
  const worldId = useGameStore((state) => state.worldId);
  if (!worldId) {
    return <Navigate to="/my-worlds" replace />;
  }
  return (
    <Suspense fallback={<GameLoader />}>
      <WorldMapScreen />
    </Suspense>
  );
}

function ArmyGuard() {
  const worldId = useGameStore((state) => state.worldId);
  if (!worldId) {
    return <Navigate to="/my-worlds" replace />;
  }
  return (
    <Suspense fallback={<GameLoader />}>
      <ArmyScreen />
    </Suspense>
  );
}

function MessagesGuard() {
  const worldId = useGameStore((state) => state.worldId);
  if (!worldId) {
    return <Navigate to="/my-worlds" replace />;
  }
  return (
    <Suspense fallback={<GameLoader />}>
      <MessagesScreen />
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/auth/login" element={<LoginScreen />} />
          <Route path="/auth/register" element={<RegisterScreen />} />
          <Route
            path="/ui-test"
            element={
              <Suspense fallback={<GameLoader />}>
                <UiTestScreen />
              </Suspense>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route path="/worlds" element={<WorldSelector />} />
            <Route path="/my-worlds" element={<MyWorldsScreen />} />
            <Route path="/game" element={<GameGuard />} />
            <Route path="/game/world" element={<WorldMapGuard />} />
            <Route path="/game/army" element={<ArmyGuard />} />
            <Route path="/game/messages" element={<MessagesGuard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {import.meta.env.DEV && (
        <>
          <DebugOverlay />
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      )}
    </QueryClientProvider>
  );
}
