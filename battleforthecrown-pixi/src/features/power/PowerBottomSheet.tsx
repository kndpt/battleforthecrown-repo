import { X } from 'lucide-react';
import { BottomSheet, Panel, PanelBody, PanelHeader, Spinner } from '@/ui';
import { useKingdomPowerQuery, useVillagePowerQuery } from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { PowerBreakdown } from './PowerBreakdown';

interface PowerBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PowerBottomSheet({ isOpen, onClose }: PowerBottomSheetProps) {
  const villageId = useGameStore((state) => state.villageId);
  const kingdom = useKingdomPowerQuery();
  const village = useVillagePowerQuery(villageId);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="80vh" zIndex={50}>
      <Panel variant="parchment" padding="none" className="rounded-t-2xl shadow-2xl">
        <PanelHeader
          variant="parchment"
          className="flex items-center justify-between sticky top-0 z-10 rounded-t-2xl"
        >
          <span className="font-bold">⚜️ Puissance Totale</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X size={24} className="text-gray-800" />
          </button>
        </PanelHeader>
        <PanelBody className="p-4">
          <div className="text-center mb-6">
            <p className="text-xs text-kingdom-700 font-game mb-1">
              Puissance du royaume
            </p>
            <div className="text-4xl font-bold text-game-gold-light font-cinzel text-shadow flex items-center justify-center gap-2">
              <span aria-hidden>⚜️</span>
              {kingdom.isLoading ? (
                <Spinner size="sm" />
              ) : (
                <span>{(kingdom.data?.kingdomPower ?? 0).toLocaleString()}</span>
              )}
            </div>
            {kingdom.data && (
              <p className="text-xs text-kingdom-700 font-game mt-1">
                {kingdom.data.villageCount} village
                {kingdom.data.villageCount > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {kingdom.data && (
            <div className="mb-6 px-2">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium font-game text-kingdom-900">
                  🏰 Bâtiments
                </span>
                <span className="text-sm font-bold font-game text-kingdom-900">
                  {kingdom.data.totalBuildings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium font-game text-kingdom-900">
                  ⚔️ Armée
                </span>
                <span className="text-sm font-bold font-game text-kingdom-900">
                  {kingdom.data.totalArmy.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="border-t border-game-stone-border pt-4">
            <p className="text-xs text-kingdom-700 font-game mb-3 text-center">
              Village actuel
            </p>
            {village.isLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : (
              <PowerBreakdown
                buildings={village.data?.buildings ?? 0}
                army={village.data?.army ?? 0}
                className="opacity-75"
              />
            )}
          </div>

          <div className="mt-6 p-3 bg-game-stone-dark/20 rounded-lg border border-game-stone-border">
            <p className="text-xs text-kingdom-700 font-game text-center leading-relaxed">
              La puissance du royaume représente la force cumulée de tous vos villages.
            </p>
          </div>
        </PanelBody>
      </Panel>
    </BottomSheet>
  );
}
