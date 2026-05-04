import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/ui/buttons';
import { Spinner } from '@/ui/spinners';
import { useJoinWorldMutation, useMyMembershipsQuery, useWorldsQuery } from '@/api/queries';
import { ApiError } from '@/api';
import type { World } from '@/api';
import { useAuthStore } from '@/stores/auth';

function defaultVillageName(email?: string): string {
  if (!email) return 'Royaume du joueur';
  const handle = email.split('@')[0] ?? 'joueur';
  return `Royaume de ${handle}`;
}

export function WorldSelector() {
  const navigate = useNavigate();
  const worlds = useWorldsQuery();
  const memberships = useMyMembershipsQuery();
  const join = useJoinWorldMutation();
  const userEmail = useAuthStore((state) => state.user?.email);
  const [error, setError] = useState<string | null>(null);

  if (worlds.isLoading || memberships.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (worlds.isError) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 text-center">
        <p className="text-parchment/80">Impossible de charger la liste des mondes.</p>
      </div>
    );
  }

  const joinedIds = new Set(memberships.data?.map((m) => m.worldId) ?? []);
  const list = worlds.data ?? [];

  const onJoin = (world: World) => {
    setError(null);
    join.mutate(
      { worldId: world.id, villageName: defaultVillageName(userEmail) },
      {
        onSuccess: () => navigate('/game'),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : 'Inscription au monde impossible');
        },
      },
    );
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="font-game text-2xl text-game-gold-light text-shadow-game">Choisis un monde</h1>
        <Link to="/my-worlds" className="text-sm uppercase tracking-widest text-game-blue-light underline">
          Mes mondes
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded border border-game-red-border bg-game-red-dark/30 px-3 py-2 text-sm text-white">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {list.map((world) => {
          const alreadyIn = joinedIds.has(world.id);
          return (
            <li
              key={world.id}
              className="flex flex-col gap-3 rounded-md border-2 border-game-gold-border bg-[#2a1f12]/80 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-game text-lg text-game-gold-light">{world.name}</p>
                <p className="text-sm text-parchment/80">
                  {world.gridWidth ? `${world.gridWidth}×${world.gridHeight}` : 'Grille inconnue'} ·{' '}
                  {world.status ?? 'status inconnu'}
                </p>
              </div>
              <div className="flex gap-2">
                {alreadyIn ? (
                  <Button variant="info" size="sm" onClick={() => navigate('/my-worlds')}>
                    Déjà rejoint
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => onJoin(world)}
                    disabled={join.isPending}
                  >
                    {join.isPending ? <Spinner size="sm" /> : 'Rejoindre'}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
        {list.length === 0 && <p className="text-parchment/80">Aucun monde disponible pour l'instant.</p>}
      </ul>
    </div>
  );
}
