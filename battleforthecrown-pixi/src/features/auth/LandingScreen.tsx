import { useNavigate } from 'react-router';
import { AuthButton, AuthWordmark } from '@/features/design-system/components';
import { useAuthStore } from '@/stores/auth';
import { AuthCastleStage, AuthScreenViewport } from './AuthScreenViewport';

export function LandingScreen() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <AuthScreenViewport>
      <section className="relative z-[1] flex w-full max-w-[760px] flex-col items-center gap-5 py-3 text-center text-[#f6e4b8]">
        <div className="font-game text-[10px] font-extrabold uppercase tracking-[.32em] text-[rgba(246,228,184,.68)]">
          MMORTS médiéval
        </div>
        <AuthWordmark
          className="max-w-[360px]"
          size="lg"
          tagline="Construis, rallie, conquiers."
          titleLines={['Battle for', 'the Crown']}
          tone="light"
        />
        <AuthCastleStage />
        <div className="grid w-full max-w-[430px] gap-3">
          {accessToken ? (
            <AuthButton full onClick={() => navigate('/game')} size="lg" variant="success">
              Reprendre l&apos;aventure
            </AuthButton>
          ) : (
            <>
              <AuthButton full onClick={() => navigate('/auth/login')} size="lg" variant="warning">
                Connexion
              </AuthButton>
              <AuthButton full onClick={() => navigate('/auth/register')} size="lg" variant="success">
                Créer un compte
              </AuthButton>
              <button
                className="mx-auto w-fit cursor-not-allowed border-0 border-b border-dotted border-[rgba(246,228,184,.45)] bg-transparent p-0 pb-px font-game text-[11px] font-bold text-[rgba(246,228,184,.62)] disabled:opacity-[.72]"
                disabled
                type="button"
              >
                Visiteur indisponible
              </button>
            </>
          )}
        </div>
      </section>
    </AuthScreenViewport>
  );
}

