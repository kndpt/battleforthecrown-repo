import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Badge, Button, Panel, Spinner } from '@/ui';
import { useJoinWorldMutation, useMyMembershipsQuery, useWorldsQuery } from '@/api/queries';
import { ApiError } from '@/api';
import type { World } from '@/api';
import { useAuthStore } from '@/stores/auth';

function defaultVillageName(email?: string): string {
  if (!email) return 'Royaume du joueur';
  const handle = email.split('@')[0] ?? 'joueur';
  return `Royaume de ${handle}`;
}

function badgeVariantForStatus(status: string | undefined): 'success' | 'warning' | 'info' | 'error' {
  switch (status) {
    case 'OPEN':
      return 'success';
    case 'LOCKED':
      return 'warning';
    case 'ENDED':
      return 'error';
    default:
      return 'info';
  }
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
      <div className="min-h-screen bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (worlds.isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100 flex items-center justify-center px-6 text-center">
        <p className="text-gray-700 font-game">Impossible de charger la liste des mondes.</p>
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
    <div className="min-h-screen bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100 p-4">
      <div className="container mx-auto max-w-4xl py-8 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="font-cinzel text-3xl font-bold text-kingdom-800">Sélectionnez un monde</h1>
          <Link
            to="/my-worlds"
            className="text-sm font-game uppercase tracking-widest text-kingdom-700 underline hover:text-kingdom-900"
          >
            Mes mondes
          </Link>
        </header>

        {error && (
          <div role="alert">
            <Panel variant="danger" padding="md">
              <p className="text-sm text-white">{error}</p>
            </Panel>
          </div>
        )}

        {list.length === 0 ? (
          <Panel variant="parchment" padding="lg" className="text-center">
            <p className="text-gray-700 font-game">Aucun monde disponible pour l&apos;instant.</p>
          </Panel>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((world) => {
              const alreadyIn = joinedIds.has(world.id);
              return (
                <Panel key={world.id} variant="stone" padding="lg">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="font-cinzel text-xl font-bold text-white">{world.name}</h2>
                    <Badge variant={badgeVariantForStatus(world.status)} size="sm">
                      {world.status ?? 'STATUT'}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-white/80 mb-4">
                    <p>
                      Taille : {world.gridWidth ?? '?'}×{world.gridHeight ?? '?'}
                    </p>
                    {alreadyIn && <p className="text-kingdom-300 font-semibold">Tu as déjà rejoint ce monde</p>}
                  </div>

                  {alreadyIn ? (
                    <Button variant="info" size="md" className="w-full" onClick={() => navigate('/my-worlds')}>
                      Voir mes mondes
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="md"
                      className="w-full"
                      onClick={() => onJoin(world)}
                      disabled={join.isPending}
                    >
                      {join.isPending ? <Spinner size="sm" /> : 'Rejoindre'}
                    </Button>
                  )}
                </Panel>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
