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
import { GameScreen } from '@/features/game/GameScreen';
import { WorldMapScreen } from '@/features/world/WorldMapScreen';
import { useGameStore } from '@/stores/game';

function GameGuard() {
  const worldId = useGameStore((state) => state.worldId);
  if (!worldId) {
    return <Navigate to="/my-worlds" replace />;
  }
  return <GameScreen />;
}

function WorldMapGuard() {
  const worldId = useGameStore((state) => state.worldId);
  if (!worldId) {
    return <Navigate to="/my-worlds" replace />;
  }
  return <WorldMapScreen />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/auth/login" element={<LoginScreen />} />
          <Route path="/auth/register" element={<RegisterScreen />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/worlds" element={<WorldSelector />} />
            <Route path="/my-worlds" element={<MyWorldsScreen />} />
            <Route path="/game" element={<GameGuard />} />
            <Route path="/game/world" element={<WorldMapGuard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
