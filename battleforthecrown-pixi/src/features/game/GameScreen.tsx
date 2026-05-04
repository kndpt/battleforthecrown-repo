import { Link } from 'react-router';
import { GameSession } from './GameSession';
import { GameHeader } from '@/features/layout/GameHeader';
import { NavRail } from '@/features/layout/NavRail';
import { ToastStack } from '@/features/layout/ToastStack';
import { VillagePanel } from '@/features/village/VillagePanel';
import { QueueBar } from '@/features/village/QueueBar';

export function GameScreen() {
  return (
    <GameSession>
      <div className="flex h-full flex-col gap-3 px-3 py-3">
        <GameHeader />

        <div className="flex flex-1 gap-3 overflow-hidden">
          <aside className="hidden md:block">
            <NavRail />
          </aside>

          <main className="flex-1 overflow-y-auto">
            <section className="space-y-4">
              <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="font-game text-xl text-game-gold-light text-shadow-game">Mon village</h1>
                  <p className="text-xs text-parchment/70">
                    Le canvas Pixi du village arrive en Phase 5. En attendant, gère tes constructions ici.
                  </p>
                </div>
                <Link
                  to="/game/world"
                  className="rounded border-2 border-game-blue-border bg-game-blue-dark px-4 py-1.5 text-xs uppercase tracking-widest text-white shadow-game-inset hover:bg-game-blue-light"
                >
                  Voir la carte du monde →
                </Link>
              </header>

              <div className="rounded-md border-2 border-dashed border-game-gold-border/40 bg-black/30 px-4 py-6 text-center text-sm text-parchment/70">
                {/* Pixi canvas placeholder until Phase 5 */}
                Aperçu du village (canvas Pixi) — Phase 5
              </div>

              <VillagePanel />
            </section>
          </main>
        </div>

        <footer className="md:hidden">
          <NavRail />
        </footer>

        <QueueBar />

        <ToastStack />
      </div>
    </GameSession>
  );
}
