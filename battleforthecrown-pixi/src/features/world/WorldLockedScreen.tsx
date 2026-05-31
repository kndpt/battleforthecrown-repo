import { ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router';
import { Button, Panel } from '@/ui';

/**
 * Shown on /game/world when the player has no Watchtower built yet. The
 * Shared game shell already greys out the World icon, but a deep-link or a
 * destroyed watchtower can still bring the user here, so we render a friendly
 * gate instead of letting them peek at the map without paying the gameplay cost.
 */
export function WorldLockedScreen() {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden p-4 pb-24">
      <Panel variant="stone" padding="lg" className="text-center max-w-md shadow-2xl">
        <Lock className="h-16 w-16 text-white mx-auto mb-4" />
        <h2 className="font-cinzel text-2xl font-bold text-white mb-3">
          Carte du monde verrouillée
        </h2>
        <p className="text-white/90 mb-6 leading-relaxed">
          Construisez la <span className="font-bold">Tour de guet</span> pour
          débloquer la carte du monde et explorer les territoires voisins.
        </p>
        <Link to="/game">
          <Button variant="success" size="lg" className="w-full">
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft size={20} />
              <span>Retour au village</span>
            </div>
          </Button>
        </Link>
      </Panel>
    </div>
  );
}
