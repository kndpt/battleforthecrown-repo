import { Shield, X } from 'lucide-react';
import { BottomSheet, Panel, PanelBody, PanelHeader } from '@/ui';

interface PowerBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PowerBottomSheet({ isOpen, onClose }: PowerBottomSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="50vh" zIndex={50}>
      <Panel variant="parchment" padding="none" className="rounded-t-2xl shadow-2xl">
        <PanelHeader
          variant="wood"
          className="flex items-center justify-between sticky top-0 z-10 rounded-t-2xl"
        >
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-white" />
            <span className="font-bold">Puissance</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X size={24} className="text-white" />
          </button>
        </PanelHeader>
        <PanelBody className="p-6 text-center">
          <p className="font-cinzel text-lg font-bold text-kingdom-900 mb-2">
            Bientôt disponible
          </p>
          <p className="text-sm text-kingdom-600 leading-relaxed">
            Le panneau de puissance (leaderboard, score militaire, classements) sera
            porté en Phase 9.D. En attendant, l&apos;indicateur dans l&apos;en-tête est un
            placeholder.
          </p>
        </PanelBody>
      </Panel>
    </BottomSheet>
  );
}
