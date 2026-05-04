import { Link } from 'react-router';
import { useAuthStore } from '@/stores/auth';

export function LandingScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <main className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-game text-5xl text-game-gold-light text-shadow-game">Battle for the Crown</h1>
      <p className="max-w-md text-base text-parchment/80">
        MMORTS médiéval. Construis ton château, lève une armée, conquiers la couronne.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {accessToken ? (
          <Link
            to="/my-worlds"
            className="rounded border border-game-green-border bg-game-green-dark px-6 py-2 text-sm uppercase tracking-widest text-white shadow-game-inset hover:bg-game-green-light"
          >
            Reprendre
          </Link>
        ) : (
          <>
            <Link
              to="/auth/login"
              className="rounded border border-game-gold-border bg-game-gold-dark px-6 py-2 text-sm uppercase tracking-widest text-white shadow-game-inset hover:bg-game-gold-light"
            >
              Connexion
            </Link>
            <Link
              to="/auth/register"
              className="rounded border border-game-green-border bg-game-green-dark px-6 py-2 text-sm uppercase tracking-widest text-white shadow-game-inset hover:bg-game-green-light"
            >
              Créer un compte
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
