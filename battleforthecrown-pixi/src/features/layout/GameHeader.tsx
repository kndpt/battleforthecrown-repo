import { useNavigate } from 'react-router';
import { LogOut, Map } from 'lucide-react';
import {
  HeaderActions,
  HeaderBar,
  PlayerProfile,
  PopulationIndicator,
} from '@/ui';
import { ResourceBar } from '@/features/resources/ResourceBar';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { usePopulationQuery, useLogout } from '@/api/queries';
import { useDisplayCrowns } from '@/features/resources/useDisplayResources';
import { useGameSocketStatus } from '@/lib/useGameSocketStatus';

const formatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

const WS_STATUS_LABEL: Record<string, { dot: string; label: string; title: string }> = {
  idle: { dot: 'bg-white/40', label: '—', title: 'WebSocket : initialisation' },
  connecting: {
    dot: 'bg-game-gold-light animate-pulse',
    label: 'Connexion',
    title: 'WebSocket : connexion en cours',
  },
  connected: {
    dot: 'bg-game-green-light',
    label: 'En ligne',
    title: 'WebSocket : connecté',
  },
  disconnected: {
    dot: 'bg-game-red-light',
    label: 'Hors ligne',
    title: 'WebSocket : déconnecté',
  },
};

function shortName(email?: string): string {
  if (!email) return 'Anonyme';
  const handle = email.split('@')[0] ?? email;
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}

export function GameHeader() {
  const navigate = useNavigate();
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const user = useAuthStore((state) => state.user);
  const population = usePopulationQuery(villageId);
  const logout = useLogout();
  const crowns = useDisplayCrowns(user?.id ?? null, worldId);
  const wsStatus = useGameSocketStatus();
  const wsView = WS_STATUS_LABEL[wsStatus] ?? WS_STATUS_LABEL.idle;

  const populationAvailable = population.data
    ? Math.max(0, population.data.max - population.data.used)
    : undefined;

  return (
    <HeaderBar className="pointer-events-auto rounded-md">
      <PlayerProfile playerName={shortName(user?.email)} level={1} />

      <div className="flex items-center gap-4 flex-1 justify-center">
        <ResourceBar compact />
      </div>

      <HeaderActions>
        <PopulationIndicator
          availablePopulation={populationAvailable}
          loading={population.isLoading}
        />

        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30 border border-[#3d2f1f]">
          <img
            src="/assets/casual-icons/crown.png"
            alt=""
            width={18}
            height={18}
            className="drop-shadow-sm"
          />
          <span className="font-cinzel font-bold text-sm text-white tabular-nums">
            {crowns.balance != null ? formatter.format(crowns.balance) : '—'}
          </span>
          {crowns.productionRate != null && (
            <span className="text-[10px] text-[#f5e6d3]/70 leading-none">
              +{crowns.productionRate}/h
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30 border border-[#3d2f1f]"
          title={wsView.title}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${wsView.dot}`} aria-hidden />
          <span className="font-cinzel text-[10px] uppercase tracking-widest text-[#f5e6d3]/80">
            {wsView.label}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/my-worlds')}
          className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 border border-[#3d2f1f] text-[#f5e6d3] hover:text-white"
          title="Mes mondes"
        >
          <Map size={14} />
          <span className="font-cinzel text-[10px] uppercase tracking-widest">Mondes</span>
        </button>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/auth/login');
          }}
          className="flex items-center gap-1 px-2 py-1 rounded bg-game-red-dark/40 border border-game-red-border text-white hover:bg-game-red-dark/60"
          title="Déconnexion"
        >
          <LogOut size={14} />
          <span className="font-cinzel text-[10px] uppercase tracking-widest">Sortie</span>
        </button>
      </HeaderActions>
    </HeaderBar>
  );
}
