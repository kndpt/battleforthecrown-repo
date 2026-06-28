import { useState, type FormEvent, type ReactNode } from "react";
import { BottomSheet, Button, Input, Spinner, Tooltip } from "@/ui";
import { GameBottomSheetPanel } from "@/features/design-system/components";
import {
  useAcceptFriendshipMutation,
  useCreateFriendshipMutation,
  useDeleteFriendshipMutation,
  useFriendshipsQuery,
} from "@/api/queries";
import { isDefensiveFriendsCapReached } from "@/lib/friendshipsCache";
import {
  DEFENSIVE_FRIENDS_CAP,
  type FriendshipDto,
} from "@battleforthecrown/shared/social";
import { useUiStore } from "@/stores/ui";
import { friendshipErrorMessage } from "./friendshipErrorMessage";

interface DefensiveFriendsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

function pushToast(
  tone: "success" | "error",
  title: string,
  description?: string,
): void {
  useUiStore.getState().pushToast({ tone, title, description, ttlMs: 4500 });
}

/**
 * Defensive-friends management sheet (cf. docs/gameplay/20-defensive-friends.md).
 * Renders the three server-owned buckets — received / sent / active — with
 * invite-by-pseudo, accept/refuse and removal. The hard cap of
 * {@link DEFENSIVE_FRIENDS_CAP} ACTIVE friends gates the invite control; the
 * backend re-checks it on both sides at accept time.
 */
export function DefensiveFriendsSheet({
  isOpen,
  onClose,
}: DefensiveFriendsSheetProps) {
  const friendships = useFriendshipsQuery();
  const createFriendship = useCreateFriendshipMutation();
  const acceptFriendship = useAcceptFriendshipMutation();
  const deleteFriendship = useDeleteFriendshipMutation();
  const [pseudo, setPseudo] = useState("");

  const data = friendships.data;
  const activeCount = data?.active.length ?? 0;
  const capReached = isDefensiveFriendsCapReached(data);

  const handleInvite = (event: FormEvent) => {
    event.preventDefault();
    const recipientDisplayName = pseudo.trim();
    if (!recipientDisplayName || createFriendship.isPending) return;
    createFriendship.mutate(
      { recipientDisplayName },
      {
        onSuccess: () => {
          setPseudo("");
          pushToast(
            "success",
            "Invitation envoyée",
            `${recipientDisplayName} doit l'accepter.`,
          );
        },
        onError: (err) => {
          pushToast(
            "error",
            "Invitation refusée",
            friendshipErrorMessage(err, "Échec de l'invitation."),
          );
        },
      },
    );
  };

  const handleAccept = (friend: FriendshipDto) => {
    if (acceptFriendship.isPending) return;
    acceptFriendship.mutate(
      { id: friend.id },
      {
        onSuccess: () =>
          pushToast("success", "Ami défensif ajouté", friend.otherDisplayName),
        onError: (err) =>
          pushToast(
            "error",
            "Échec",
            friendshipErrorMessage(err, "Impossible d'accepter."),
          ),
      },
    );
  };

  const handleRemove = (
    friend: FriendshipDto,
    label: string,
    successTitle: string,
  ) => {
    if (deleteFriendship.isPending) return;
    deleteFriendship.mutate(
      { id: friend.id },
      {
        onSuccess: () =>
          pushToast("success", successTitle, friend.otherDisplayName),
        onError: (err) =>
          pushToast(
            "error",
            "Échec",
            friendshipErrorMessage(err, `Impossible de ${label}.`),
          ),
      },
    );
  };

  const inviteDisabled =
    capReached || createFriendship.isPending || pseudo.trim().length === 0;

  return (
    <BottomSheet
      className="mx-auto max-w-[32rem]"
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="80vh"
    >
      <GameBottomSheetPanel
        bodyClassName="px-3.5 pb-4 pt-3"
        className="max-h-[80vh]"
        closeLabel="Fermer"
        eyebrow="Coopération"
        onClose={onClose}
        title="Amis défensifs"
      >
        <div className="space-y-4" data-bottom-sheet-scrollable>
          <p className="text-xs leading-relaxed text-kingdom-700">
            Un ami défensif peut envoyer des renforts sur vos villages, et vous
            sur les siens. {activeCount}/{DEFENSIVE_FRIENDS_CAP} amis actifs.
          </p>

          <form onSubmit={handleInvite} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Input
                aria-label="Pseudo du joueur à inviter"
                placeholder="Pseudo du joueur"
                value={pseudo}
                maxLength={32}
                onChange={(e) => setPseudo(e.target.value)}
                disabled={capReached}
              />
            </div>
            <Tooltip
              content={capReached ? `Cap ${DEFENSIVE_FRIENDS_CAP} amis défensifs` : ""}
              variant="dark"
            >
              <Button
                type="submit"
                variant="success"
                size="md"
                className="font-bold"
                disabled={inviteDisabled}
              >
                {createFriendship.isPending ? <Spinner size="sm" /> : "Inviter"}
              </Button>
            </Tooltip>
          </form>

          {friendships.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : friendships.isError ? (
            <p className="py-6 text-center text-sm font-semibold text-game-red-dark">
              Liste indisponible.
            </p>
          ) : (
            <div className="space-y-4">
              <FriendBucket
                title="Demandes reçues"
                friends={data?.pendingIn ?? []}
                emptyLabel="Aucune demande."
                renderActions={(friend) => (
                  <div className="flex gap-1.5">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAccept(friend)}
                    >
                      Accepter
                    </Button>
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() =>
                        handleRemove(friend, "refuser", "Demande refusée")
                      }
                    >
                      Refuser
                    </Button>
                  </div>
                )}
              />

              <FriendBucket
                title="Amis actifs"
                friends={data?.active ?? []}
                emptyLabel="Aucun ami défensif pour l'instant."
                renderActions={(friend) => (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      handleRemove(friend, "retirer", "Ami retiré")
                    }
                  >
                    Retirer
                  </Button>
                )}
              />

              <FriendBucket
                title="Demandes envoyées"
                friends={data?.pendingOut ?? []}
                emptyLabel="Aucune invitation en attente."
                renderActions={(friend) => (
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() =>
                      handleRemove(friend, "annuler", "Invitation annulée")
                    }
                  >
                    Annuler
                  </Button>
                )}
              />
            </div>
          )}
        </div>
      </GameBottomSheetPanel>
    </BottomSheet>
  );
}

interface FriendBucketProps {
  title: string;
  friends: FriendshipDto[];
  emptyLabel: string;
  renderActions: (friend: FriendshipDto) => ReactNode;
}

function FriendBucket({
  title,
  friends,
  emptyLabel,
  renderActions,
}: FriendBucketProps) {
  return (
    <section>
      <h3 className="mb-1.5 font-game text-[10px] font-bold uppercase tracking-[.18em] text-kingdom-600">
        {title} · {friends.length}
      </h3>
      {friends.length === 0 ? (
        <p className="rounded-lg border-2 border-kingdom-200/60 bg-white/30 px-3 py-2 text-xs text-kingdom-500">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="flex items-center justify-between gap-2 rounded-lg border-2 border-kingdom-300 bg-gradient-to-br from-white/60 to-white/40 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-kingdom-800">
                {friend.otherDisplayName}
              </span>
              {renderActions(friend)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
