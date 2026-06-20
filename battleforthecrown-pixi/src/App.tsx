import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { queryClient } from '@/api/query-client';
import { LandingScreen } from '@/features/auth/LandingScreen';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { RegisterScreen } from '@/features/auth/RegisterScreen';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { WorldDetailScreen } from '@/features/worlds/WorldDetailScreen';
import { WorldSelector } from '@/features/worlds/WorldSelector';
import { WorldSessionGate } from '@/features/worlds/WorldSessionGate';
import { Spinner } from '@/ui/spinners';
import { AuthenticatedShell } from '@/features/layout/AuthenticatedShell';
import { GameShellLayout } from '@/features/layout/GameShellLayout';
import { VictoryModalHost } from '@/ui/modals/VictoryModalHost';
import { DefeatModalHost } from '@/ui/modals/DefeatModalHost';

const VillageView = lazy(() =>
  import('@/features/game/VillageView').then((m) => ({ default: m.VillageView })),
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
const RankingsScreen = lazy(() =>
  import('@/features/rankings/RankingsScreen').then((m) => ({ default: m.RankingsScreen })),
);
const UiTestScreen = lazy(() =>
  import('@/features/ui-test/UiTestScreen').then((m) => ({ default: m.UiTestScreen })),
);
const DesignSystemPreview = lazy(() =>
  import('@/features/design-system/DesignSystemPreview').then((m) => ({
    default: m.DesignSystemPreview,
  })),
);

function GameLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function GameGuard() {
  return (
    <WorldSessionGate>
      <Suspense fallback={<GameLoader />}>
        <VillageView />
      </Suspense>
    </WorldSessionGate>
  );
}

function WorldMapGuard() {
  return (
    <WorldSessionGate>
      <Suspense fallback={<GameLoader />}>
        <WorldMapScreen />
      </Suspense>
    </WorldSessionGate>
  );
}

function ArmyGuard() {
  return (
    <WorldSessionGate>
      <Suspense fallback={<GameLoader />}>
        <ArmyScreen />
      </Suspense>
    </WorldSessionGate>
  );
}

function MessagesGuard() {
  return (
    <WorldSessionGate>
      <Suspense fallback={<GameLoader />}>
        <MessagesScreen />
      </Suspense>
    </WorldSessionGate>
  );
}

function RankingsGuard() {
  return (
    <WorldSessionGate>
      <Suspense fallback={<GameLoader />}>
        <RankingsScreen />
      </Suspense>
    </WorldSessionGate>
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
          <Route
            path="/design-system"
            element={
              <Suspense fallback={<GameLoader />}>
                <DesignSystemPreview />
              </Suspense>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedShell />}>
              <Route path="/worlds" element={<WorldSelector />} />
              <Route path="/worlds/:worldId" element={<WorldDetailScreen />} />
              <Route path="/my-worlds" element={<Navigate to="/game" replace />} />
              <Route element={<GameShellLayout />}>
                <Route path="/game" element={<GameGuard />} />
                <Route path="/game/world" element={<WorldMapGuard />} />
                <Route path="/game/army" element={<ArmyGuard />} />
                <Route path="/game/messages" element={<MessagesGuard />} />
                <Route path="/game/rankings" element={<RankingsGuard />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <VictoryModalHost />
        <DefeatModalHost />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
