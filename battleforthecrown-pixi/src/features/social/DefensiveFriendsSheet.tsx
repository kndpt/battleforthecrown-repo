import { useMemo, useState, type ReactNode } from 'react';
import { Check, UserPlus, X } from 'lucide-react';
import { Badge, Button, Input, Spinner, Tooltip } from '@/ui';
import { GameBottomSheetPanel } from '@/features/design-system/components/GameBottomSheetPanel';
import {
  DEFENSIVE_FRIENDS_CAP,
  type FriendshipDto,
} from '@battleforthecrown/shared/social';
import {
  useAcceptFriendshipMutation,
  useCreateFriendshipMutation,
  useDeleteFriendshipMutation,
  useMyFriendshipsQuery,
} from '@/api/queries';
import { useUiStore } from '@/stores/ui';
import { friendshipErrorMessage } from './friendshipErrorMessage';

interface DefensiveFriendsSheetProps {
  onClose: () => void;
}

/**
 * Management UI for the defensive-friends list (cf.
 * `docs/gameplay/20-defensive-friends.md`). Renders the three server-owned
 * buckets, an add-by-pseudo form gated on the MVP cap, and accept/refuse/remove
 * actions through the shared {@link GameBottomSheetPanel} chrome. All cap +
 * status logic stays backend-authoritative — this only mirrors the buckets and
 * surfaces the machine-readable error codes.
 */
export function DefensiveFriendsSheet({ onClose }: DefensiveFriendsSheetProps) {
  const friendships = useMyFriendshipsQuery();
  const createFriendship = useCreateFriendshipMutation();
  const acceptFriendship = useAcceptFriendshipMutation();
  const deleteFriendship = useDeleteFriendshipMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [pseudo, setPseudo] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const active = friendships.data?.active ?? [];
  const pendingIn = friendships.data?.pendingIn ?? [];
  const pendingOut = friendships.data?.pendingOut ?? [];
  const capReached = active.length >= DEFENSIVE_FRIENDS_CAP;

  const trimmedPseudo = pseudo.trim();
  const canSubmit =
    trimmedPseudo.length > 0 && !capReached && !createFriendship.isPending;

  const anyMutationPending =
    createFriendship.isPending ||
    acceptFriendship.isPending ||
    deleteFriendship.isPending;

  const handleAdd = () => {
    if (!canSubmit) return;
    setAddError(null);
    createFriendship.mutate(
      { recipientDisplayName: trimmedPseudo },
      {
        onSuccess: () => {
          setPseudo('');
          pushToast({
            tone: 'success',
            title: 'Demande envoyée',
            description: `${trimmedPseudo} doit accepter pour activer la liaison.`,
          });
        },
        onError: (err) => {
          setAddError(friendshipErrorMessage(err, "Échec de l'ajout"));
        },
      },
    );
  };

  const handleAccept = (friendship: FriendshipDto) => {
    acceptFriendship.mutate(
      { friendshipId: friendship.id },
      {
        onSuccess: () =>
          pushToast({
            tone: 'success',
            title: 'Ami défensif activé',
            description: `${friendship.otherDisplayName} peut désormais vous renforcer.`,
          }),
        onError: (err) =>
          pushToast({
            tone: 'error',
            title: "Échec de l'acceptation",
            description: friendshipErrorMessage(err, 'Réessayez plus tard.'),
          }),
      },
    );
  };

  const handleRemove = (friendship: FriendshipDto, label: string) => {
    deleteFriendship.mutate(
      { friendshipId: friendship.id },
      {
        onSuccess: () =>
          pushToast({ tone: 'info', title: label, description: friendship.otherDisplayName }),
        onError: (err) =>
          pushToast({
            tone: 'error',
            title: 'Action impossible',
            description: friendshipErrorMessage(err, 'Réessayez plus tard.'),
          }),
      },
    );
  };

  const addButton = useMemo(
    () => (
      <Button
        variant="success"
        size="md"
        className="shrink-0 font-bold"
        onClick={handleAdd}
        disabled={!canSubmit}
        aria-label="Ajouter un ami défensif"
      >
        {createFriendship.isPending ? (
          <Spinner size="sm" />
        ) : (
          <UserPlus size={16} />
        )}
      </Button>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canSubmit, createFriendship.isPending, trimmedPseudo],
  );

  return (
    <GameBottomSheetPanel
      className="relative h-full max-h-full"
      eyebrow="Coopération défensive"
      title="Amis défensifs"
      headerActions={
        <>
          <Badge variant={capReached ? 'warning' : 'info'} size="md">
            {active.length}/{DEFENSIVE_FRIENDS_CAP}
          </Badge>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-[#6d5838] transition-colors hover:bg-black/10"
          >
            <X size={18} />
          </button>
        </>
      }
    >
      <div className="space-y-5 p-4">
        {/* Add by pseudo */}
        <section className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                value={pseudo}
                onChange={(e) => {
                  setPseudo(e.target.value);
                  setAddError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                }}
                placeholder="Pseudo du joueur"
                disabled={capReached}
                aria-label="Pseudo du joueur à ajouter"
              />
            </div>
            {capReached ? (
              <Tooltip content={`Cap ${DEFENSIVE_FRIENDS_CAP} amis défensifs`}>
                {addButton}
              </Tooltip>
            ) : (
              addButton
            )}
          </div>
          {addError && (
            <p role="alert" className="text-xs font-medium text-game-red-dark">
              {addError}
            </p>
          )}
          {capReached && !addError && (
            <p className="text-xs text-kingdom-500">
              Cap {DEFENSIVE_FRIENDS_CAP} amis défensifs atteint — retirez-en un
              pour en ajouter.
            </p>
          )}
        </section>

        {friendships.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : friendships.isError ? (
          <div className="rounded-lg border-2 border-game-red-border/30 bg-game-red-light/10 p-4 text-center text-sm text-kingdom-700">
            Impossible de charger la liste.{' '}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => void friendships.refetch()}
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <FriendBucket
              title="Reçues"
              emptyHint="Aucune demande reçue."
              friendships={pendingIn}
              renderActions={(friendship) => (
                <div className="flex gap-1.5">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleAccept(friendship)}
                    disabled={anyMutationPending}
                    aria-label={`Accepter ${friendship.otherDisplayName}`}
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => handleRemove(friendship, 'Demande refusée')}
                    disabled={anyMutationPending}
                    aria-label={`Refuser ${friendship.otherDisplayName}`}
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}
            />

            <FriendBucket
              title="Actifs"
              emptyHint="Aucun ami défensif actif."
              friendships={active}
              renderActions={(friendship) => (
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => handleRemove(friendship, 'Ami retiré')}
                  disabled={anyMutationPending}
                  aria-label={`Retirer ${friendship.otherDisplayName}`}
                >
                  Retirer
                </Button>
              )}
            />

            <FriendBucket
              title="Envoyées"
              emptyHint="Aucune demande en attente."
              friendships={pendingOut}
              renderActions={(friendship) => (
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => handleRemove(friendship, 'Demande annulée')}
                  disabled={anyMutationPending}
                  aria-label={`Annuler la demande à ${friendship.otherDisplayName}`}
                >
                  Annuler
                </Button>
              )}
            />
          </>
        )}
      </div>
    </GameBottomSheetPanel>
  );
}

interface FriendBucketProps {
  title: string;
  emptyHint: string;
  friendships: FriendshipDto[];
  renderActions: (friendship: FriendshipDto) => ReactNode;
}

function FriendBucket({
  title,
  emptyHint,
  friendships,
  renderActions,
}: FriendBucketProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-kingdom-600">
          {title}
        </h3>
        <Badge variant="neutral" size="sm">
          {friendships.length}
        </Badge>
      </div>
      {friendships.length === 0 ? (
        <p className="text-xs text-kingdom-400">{emptyHint}</p>
      ) : (
        <ul className="space-y-1.5">
          {friendships.map((friendship) => (
            <li
              key={friendship.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-kingdom-200 bg-white/60 px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm font-medium text-kingdom-800">
                {friendship.otherDisplayName}
              </span>
              {renderActions(friendship)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
