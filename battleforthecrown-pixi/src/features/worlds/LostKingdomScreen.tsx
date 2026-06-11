import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useJoinWorldMutation } from '@/api/queries';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { Spinner } from '@/ui';
import { joinErrorMessage } from './useWorldCardModels';

interface LostKingdomScreenProps {
  worldId: string;
}

function defaultVillageName(displayName?: string): string {
  if (!displayName) return 'Royaume du joueur';
  return `Royaume de ${displayName}`;
}

export function LostKingdomScreen({ worldId }: LostKingdomScreenProps) {
  const navigate = useNavigate();
  const join = useJoinWorldMutation();
  const userDisplayName = useAuthStore((state) => state.user?.displayName);
  const clearGame = useGameStore((state) => state.clear);
  const [error, setError] = useState<string | null>(null);

  const handleReturn = () => {
    if (join.isPending) return;
    setError(null);
    join.mutate(
      { worldId, villageName: defaultVillageName(userDisplayName) },
      {
        onError: (err) => setError(joinErrorMessage(err)),
        onSuccess: () => navigate('/game'),
      },
    );
  };

  const handleChooseOther = () => {
    if (join.isPending) return;
    clearGame();
    void navigate('/worlds');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#d4c094] p-4 font-game">
      <div className="mx-auto w-full max-w-[380px] rounded-xl border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#f3e3c2)] p-5 shadow-[0_4px_10px_rgba(60,38,25,.18)]">
        <div className="mb-4 text-center">
          <div className="mb-2 text-[28px]">⚔️</div>
          <h1 className="font-game text-[17px] font-black leading-snug tracking-[.02em] text-[#3c2619]">
            Ton village a été pris.
          </h1>
          <p className="mt-2 font-game text-[12px] leading-relaxed text-[#6d5838]">
            Les survivants se sont repliés. Tu peux reconstruire ta présence sur
            ce monde ou choisir un nouveau départ ailleurs.
          </p>
        </div>

        {error ? (
          <div
            className="mb-3 rounded-lg border border-[#a93226] bg-[rgba(192,57,43,.1)] px-3 py-2 font-game text-[11px] font-bold text-[#7d1e15]"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-2.5">
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)] font-game text-[12px] font-extrabold uppercase tracking-[.08em] text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_3px_0_rgba(0,0,0,.2)] [text-shadow:0_1px_0_rgba(255,255,255,.35)] active:translate-y-px disabled:opacity-60"
            disabled={join.isPending}
            onClick={handleReturn}
            type="button"
          >
            {join.isPending ? (
              <Spinner size="sm" />
            ) : null}
            Revenir sur ce monde
          </button>
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#fef9f0,#d8c298)] font-game text-[11px] font-extrabold uppercase tracking-[.08em] text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(60,38,25,.18)] active:translate-y-px disabled:opacity-60"
            disabled={join.isPending}
            onClick={handleChooseOther}
            type="button"
          >
            Choisir un autre monde
          </button>
        </div>
      </div>
    </main>
  );
}
