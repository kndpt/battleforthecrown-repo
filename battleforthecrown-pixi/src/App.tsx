import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router';
import { HelloPixiScene } from './features/HelloPixiScene';

function HomeScreen() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-game text-5xl text-game-gold-light text-shadow-game">Battle for the Crown</h1>
      <p className="max-w-md text-base text-parchment/80">
        Migration vers Vite + React + PixiJS v8 en cours. Phase 0 — scaffold.
      </p>
      <div className="flex gap-4">
        <Link
          to="/auth/login"
          className="rounded border border-game-gold-border bg-game-gold-dark px-6 py-2 text-sm uppercase tracking-widest text-white shadow-game-inset hover:bg-game-gold-light"
        >
          Login (placeholder)
        </Link>
        <Link
          to="/game"
          className="rounded border border-game-green-border bg-game-green-dark px-6 py-2 text-sm uppercase tracking-widest text-white shadow-game-inset hover:bg-game-green-light"
        >
          Open Pixi canvas
        </Link>
      </div>
    </main>
  );
}

function LoginPlaceholderScreen() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="font-game text-3xl text-game-gold-light">Login</h2>
      <p className="text-parchment/80">Implémenté en Phase 1.</p>
      <Link to="/" className="text-sm uppercase tracking-widest text-game-blue-light underline">
        ← Retour
      </Link>
    </main>
  );
}

function GameScreen() {
  return <HelloPixiScene />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/auth/login" element={<LoginPlaceholderScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
