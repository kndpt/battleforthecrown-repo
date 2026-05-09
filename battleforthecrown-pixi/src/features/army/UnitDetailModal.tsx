import { Swords, X } from 'lucide-react';
import { Badge, Modal, ModalBody } from '@/ui';
import { UNIT_STATS } from '@battleforthecrown/shared/army';
import type { ArmyUnitDto } from '@/api/queries';
import { unitMetaFor } from './unitConfig';

interface UnitDetailModalProps {
  unit: ArmyUnitDto;
  barracksLevel: number;
  onClose: () => void;
}

export function UnitDetailModal({ unit, onClose }: UnitDetailModalProps) {
  const meta = unitMetaFor(unit.type);
  const stats = UNIT_STATS[unit.type as keyof typeof UNIT_STATS];

  return (
    <Modal isOpen onClose={onClose} size="lg" variant="default">
      <ModalBody className="!p-0 relative flex flex-col overflow-hidden max-h-[90vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X size={20} className="text-white" />
        </button>

        <div className="relative h-40 bg-gradient-to-br from-game-blue-light to-game-blue-dark border-b-4 border-game-blue-border flex-shrink-0 flex items-center justify-center">
          {meta.iconPath ? (
            <img
              src={meta.iconPath}
              alt={meta.name}
              width={120}
              height={120}
              className="object-contain drop-shadow-2xl"
            />
          ) : (
            <span aria-hidden className="text-7xl drop-shadow-2xl">
              {meta.emoji}
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <h2 className="font-cinzel text-xl font-bold text-white text-center text-shadow">
              {meta.name}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 bg-gradient-to-br from-white/60 to-white/40 border-2 border-kingdom-300 rounded-lg">
            <p className="text-sm text-kingdom-800 leading-relaxed text-center">
              {meta.description}
            </p>
          </div>

          {stats && (
            <div className="p-4 bg-game-blue-light/10 border-2 border-game-blue-border/30 rounded-lg">
              <h3 className="font-cinzel text-base font-bold text-kingdom-900 mb-3 flex items-center gap-2">
                <Swords size={18} className="text-game-blue-dark" />
                Statistiques de combat
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">⚔️ Attaque</span>
                  <Badge variant="error" size="sm">{stats.attack}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">🛡️ Déf. Inf.</span>
                  <Badge variant="info" size="sm">{stats.defenseInfantry}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">🐎 Déf. Cav.</span>
                  <Badge variant="info" size="sm">{stats.defenseCavalry}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">🏹 Déf. Arch.</span>
                  <Badge variant="info" size="sm">{stats.defenseArcher}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">⚡ Vitesse</span>
                  <Badge variant="warning" size="sm">{stats.speed}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/40 rounded">
                  <span className="text-xs text-kingdom-700">📦 Capacité</span>
                  <Badge variant="success" size="sm">{stats.carryCapacity}</Badge>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-game-green-light/10 border-2 border-game-green-border/30 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-kingdom-800">Vos troupes :</span>
              <Badge variant="success" size="lg">{unit.quantity}</Badge>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
