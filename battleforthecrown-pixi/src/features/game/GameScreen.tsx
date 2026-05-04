import { Link } from 'react-router';
import { GameSession } from './GameSession';
import { GameHeader } from '@/features/layout/GameHeader';
import { NavRail } from '@/features/layout/NavRail';
import { ToastStack } from '@/features/layout/ToastStack';
import { VillagePanel } from '@/features/village/VillagePanel';
import { QueueBar } from '@/features/village/QueueBar';
import { VillageCanvas } from '@/features/village/VillageCanvas';
import { useVillageBuildingsQuery } from '@/api/queries';
import { Spinner } from '@/ui/spinners';
import { useGameStore } from '@/stores/game';

function VillageCanvasFrame() {
  const villageId = useGameStore((state) => state.villageId);
  const buildings = useVillageBuildingsQuery(villageId);

  if (!villageId) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border-2 border-dashed border-game-gold-border/40 bg-black/30 text-sm text-parchment/70">
        Pas de village actif.
      </div>
    );
  }

  if (buildings.isLoading || !buildings.data) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border-2 border-game-gold-border bg-[#0d0f17]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-md border-2 border-game-gold-border bg-[#1a2014]">
      <VillageCanvas villageId={villageId} buildings={buildings.data} />
    </div>
  );
}

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
                    Glisse pour te déplacer dans le village, molette pour zoomer. Clique sur un bâtiment pour ouvrir son panneau.
                  </p>
                </div>
                <Link
                  to="/game/world"
                  className="rounded border-2 border-game-blue-border bg-game-blue-dark px-4 py-1.5 text-xs uppercase tracking-widest text-white shadow-game-inset hover:bg-game-blue-light"
                >
                  Voir la carte du monde →
                </Link>
              </header>

              <VillageCanvasFrame />

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
