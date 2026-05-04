import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/ui/buttons';
import { Spinner } from '@/ui/spinners';
import { apiClient } from '@/api';
import { useMyMembershipsQuery, useLogout } from '@/api/queries';
import type { JoinedVillage } from '@/api/types';
import { useGameStore } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';

export function MyWorldsScreen() {
  const navigate = useNavigate();
  const memberships = useMyMembershipsQuery();
  const setContext = useGameStore((state) => state.setContext);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const [busyWorldId, setBusyWorldId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (memberships.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const list = memberships.data ?? [];

  const enter = async (worldId: string) => {
    if (!user) return;
    setError(null);
    setBusyWorldId(worldId);
    try {
      const villages = await apiClient.get<JoinedVillage[]>('/village', { query: { worldId, userId: user.id } });
      const villageId = villages[0]?.id ?? null;
      setContext({ worldId, villageId });
      navigate('/game');
    } catch {
      setError('Impossible de charger ton village pour ce monde.');
    } finally {
      setBusyWorldId(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-game text-2xl text-game-gold-light text-shadow-game">Mes royaumes</h1>
          {user && <p className="text-sm text-parchment/80">{user.email}</p>}
        </div>
        <div className="flex gap-3">
          <Link to="/worlds" className="text-sm uppercase tracking-widest text-game-blue-light underline">
            Découvrir
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/auth/login');
            }}
            className="text-sm uppercase tracking-widest text-game-red-light underline"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded border border-game-red-border bg-game-red-dark/30 px-3 py-2 text-sm text-white">
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <div className="rounded-md border-2 border-dashed border-game-gold-border bg-black/30 p-6 text-center">
          <p className="text-parchment/80">Tu n'as encore rejoint aucun monde.</p>
          <Link to="/worlds" className="mt-2 inline-block font-bold text-game-gold-light underline">
            Rejoindre un monde
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((membership) => (
            <li
              key={membership.worldId}
              className="flex items-center justify-between rounded-md border-2 border-game-gold-border bg-[#2a1f12]/80 p-4"
            >
              <div>
                <p className="font-game text-lg text-game-gold-light">{membership.worldName}</p>
                <p className="text-sm text-parchment/80">
                  {membership.villageCount} village{membership.villageCount > 1 ? 's' : ''} · rejoint le{' '}
                  {new Date(membership.joinedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <Button
                variant="success"
                size="sm"
                disabled={busyWorldId === membership.worldId}
                onClick={() => enter(membership.worldId)}
              >
                {busyWorldId === membership.worldId ? <Spinner size="sm" /> : 'Entrer'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
