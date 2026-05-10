import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  Panel,
  Spinner,
} from '@/ui';
import { apiClient } from '@/api';
import {
  useMyMembershipsQuery,
  useLogout,
  useResetWorldMutation,
} from '@/api/queries';
import type { JoinedVillage, WorldMembership } from '@/api/types';
import { useGameStore } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';

export function MyWorldsScreen() {
  const navigate = useNavigate();
  const memberships = useMyMembershipsQuery();
  const setContext = useGameStore((state) => state.setContext);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const resetWorld = useResetWorldMutation();
  const [busyWorldId, setBusyWorldId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<WorldMembership | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const closeResetModal = () => {
    if (resetWorld.isPending) return;
    setResetTarget(null);
    setConfirmText('');
    setResetError(null);
  };

  const confirmReset = () => {
    if (!resetTarget) return;
    if (confirmText !== resetTarget.worldName) return;
    setResetError(null);
    const worldId = resetTarget.worldId;
    resetWorld.mutate(
      { worldId },
      {
        onSuccess: () => {
          setResetTarget(null);
          setConfirmText('');
        },
        onError: () => {
          setResetError('Échec de la réinitialisation. Réessaie.');
        },
      },
    );
  };

  if (memberships.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100 p-4">
      <div className="container mx-auto max-w-4xl py-8 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-cinzel text-3xl font-bold text-kingdom-800">Mes royaumes</h1>
            {user && <p className="text-sm text-gray-700 font-game">{user.email}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/worlds"
              className="text-sm font-game uppercase tracking-widest text-kingdom-700 underline hover:text-kingdom-900"
            >
              Découvrir d&apos;autres mondes
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                logout();
                navigate('/auth/login');
              }}
            >
              <span className="flex items-center gap-2">
                <LogOut size={14} />
                Déconnexion
              </span>
            </Button>
          </div>
        </header>

        {error && (
          <div role="alert">
            <Panel variant="danger" padding="md">
              <p className="text-sm text-white">{error}</p>
            </Panel>
          </div>
        )}

        {list.length === 0 ? (
          <Panel variant="parchment" padding="lg" className="text-center space-y-3">
            <p className="text-gray-700 font-game">Tu n&apos;as encore rejoint aucun monde.</p>
            <Link to="/worlds" className="inline-block">
              <Button variant="success" size="md">
                Rejoindre un monde
              </Button>
            </Link>
          </Panel>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((membership) => (
              <Panel key={membership.worldId} variant="stone" padding="lg">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-cinzel text-xl font-bold text-white">{membership.worldName}</h2>
                  <Badge variant="success" size="sm">
                    {membership.villageCount} village{membership.villageCount > 1 ? 's' : ''}
                  </Badge>
                </div>

                <p className="text-sm text-white/80 mb-4">
                  Rejoint le {new Date(membership.joinedAt).toLocaleDateString('fr-FR')}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="md"
                    className="flex-1"
                    disabled={busyWorldId === membership.worldId}
                    onClick={() => enter(membership.worldId)}
                  >
                    {busyWorldId === membership.worldId ? <Spinner size="sm" /> : 'Entrer'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setResetTarget(membership);
                      setConfirmText('');
                      setResetError(null);
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={resetTarget !== null}
        onClose={closeResetModal}
        title={resetTarget ? `Réinitialiser ${resetTarget.worldName} ?` : ''}
        variant="danger"
        size="sm"
        closeOnOverlayClick={!resetWorld.isPending}
        closeOnEscape={!resetWorld.isPending}
      >
        {resetTarget && (
          <>
            <ModalBody>
              <p className="text-sm mb-3">
                Cette opération est <strong>définitive</strong>. Tu pourras rejoindre ce monde à nouveau, mais en repartant de zéro.
              </p>
              <ul className="text-sm list-disc pl-5 space-y-1 mb-4">
                <li>Tous tes villages seront supprimés</li>
                <li>Tes couronnes du monde seront perdues</li>
                <li>Tes expéditions en cours seront annulées</li>
              </ul>
              <label className="block text-sm font-game mb-1">
                Tape <strong>{resetTarget.worldName}</strong> pour confirmer :
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={resetTarget.worldName}
                disabled={resetWorld.isPending}
                autoFocus
              />
              {resetError && (
                <p className="text-sm text-game-red-dark mt-2" role="alert">
                  {resetError}
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="neutral"
                size="md"
                onClick={closeResetModal}
                disabled={resetWorld.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={confirmReset}
                disabled={confirmText !== resetTarget.worldName || resetWorld.isPending}
              >
                {resetWorld.isPending ? <Spinner size="sm" /> : 'Réinitialiser définitivement'}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}
