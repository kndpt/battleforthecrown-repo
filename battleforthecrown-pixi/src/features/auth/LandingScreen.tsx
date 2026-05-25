import { Link } from 'react-router';
import { Crown, Shield, Swords } from 'lucide-react';
import { Button } from '@/ui';
import { useAuthStore } from '@/stores/auth';

export function LandingScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e8d5b7] via-[#f5e6d3] to-[#d4c094] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Crown className="absolute top-12 left-10 text-[#8b7355]/10" size={140} />
        <Shield className="absolute bottom-16 right-12 text-[#8b7355]/10" size={160} />
      </div>

      <div className="relative w-full max-w-2xl text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Swords className="text-[#8b7355]" size={28} />
          <span className="font-cinzel text-sm uppercase tracking-[0.3em] text-[#5d4a32]">
            MMORTS médiéval
          </span>
          <Swords className="text-[#8b7355]" size={28} />
        </div>

        <h1 className="font-cinzel text-5xl md:text-6xl font-bold text-gray-800">
          Battle for the Crown
        </h1>

        <p className="max-w-xl mx-auto text-base text-gray-700 font-game">
          Construis ton château, lève une armée, conquiers la couronne. Inspiré de Kingsage et
          Tribal Wars.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {accessToken ? (
            <Link to="/game">
              <Button variant="success" size="lg">
                Reprendre l&apos;aventure
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="warning" size="lg">
                  Connexion
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button variant="success" size="lg">
                  Créer un compte
                </Button>
              </Link>
            </>
          )}
        </div>

        <p className="pt-6 text-xs text-gray-600 font-cinzel italic">
          « À ceux qui osent, le royaume offre gloire et richesses. »
        </p>
      </div>
    </main>
  );
}
