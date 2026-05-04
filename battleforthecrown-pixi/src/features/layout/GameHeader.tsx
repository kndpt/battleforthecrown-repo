import { useNavigate } from 'react-router';
import { ResourceBar } from '@/features/resources/ResourceBar';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { usePopulationQuery, useLogout } from '@/api/queries';
import { useDisplayCrowns } from '@/features/resources/useDisplayResources';

const formatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function GameHeader() {
  const navigate = useNavigate();
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const user = useAuthStore((state) => state.user);
  const population = usePopulationQuery(villageId);
  const logout = useLogout();
  const crowns = useDisplayCrowns(user?.id ?? null, worldId);

  return (
    <header className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-md border-2 border-game-gold-border bg-[#1a120b]/95 px-3 py-2 text-white shadow-game-inset">
      <div className="flex-1 min-w-[260px]">
        <ResourceBar />
      </div>

      <div className="flex items-center gap-2 rounded border border-game-gold-border/70 bg-black/40 px-3 py-1 text-xs">
        <span className="text-[10px] uppercase tracking-widest text-game-gold-light">Pop.</span>
        <span className="font-bold tabular-nums">
          {population.data ? `${population.data.used}/${population.data.max}` : '—'}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded border border-game-gold-border/70 bg-black/40 px-3 py-1 text-xs">
        <span aria-hidden>👑</span>
        <span className="font-bold tabular-nums">
          {crowns.balance != null ? formatter.format(crowns.balance) : '—'}
        </span>
        {crowns.productionRate != null && (
          <span className="text-[10px] text-parchment/70">+{crowns.productionRate}/h</span>
        )}
      </div>

      <div className="flex items-center gap-2 rounded border border-game-gold-border/70 bg-black/40 px-3 py-1 text-xs">
        <span className="font-game text-[11px] uppercase tracking-widest text-game-gold-light">
          {user?.email ?? 'Anonyme'}
        </span>
        <button
          type="button"
          onClick={() => navigate('/my-worlds')}
          className="text-[10px] uppercase tracking-widest text-game-blue-light hover:text-white"
        >
          Mondes
        </button>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/auth/login');
          }}
          className="text-[10px] uppercase tracking-widest text-game-red-light hover:text-white"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
