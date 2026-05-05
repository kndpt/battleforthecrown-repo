import { Lock, Shield, Swords } from 'lucide-react';
import { Badge, Panel, PanelHeader } from '@/ui';
import { UNIT_COSTS, UNIT_TYPES } from '@battleforthecrown/shared/army';
import type { ArmyTrainingDto, ArmyUnitDto } from '@/api/queries';
import { UnitCard } from './UnitCard';

interface UnitListProps {
  units: ArmyUnitDto[];
  trainings: ArmyTrainingDto[];
  barracksLevel: number;
  onUnitClick: (unit: ArmyUnitDto) => void;
}

const UNIT_ORDER = Object.values(UNIT_TYPES) as string[];

export function UnitList({ units, trainings, barracksLevel, onUnitClick }: UnitListProps) {
  const sorted = [...units].sort((a, b) => {
    const ai = UNIT_ORDER.indexOf(a.type);
    const bi = UNIT_ORDER.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const trainingByType = new Map<string, ArmyTrainingDto>();
  trainings.forEach((t) => {
    if (!trainingByType.has(t.unitType)) trainingByType.set(t.unitType, t);
  });

  const inTraining: ArmyUnitDto[] = [];
  const ready: ArmyUnitDto[] = [];
  const locked: ArmyUnitDto[] = [];

  sorted.forEach((u) => {
    const cost = UNIT_COSTS[u.type as keyof typeof UNIT_COSTS];
    const required = cost?.requiredBarracksLevel ?? 1;
    if (trainingByType.has(u.type)) {
      inTraining.push(u);
    } else if (barracksLevel < required) {
      locked.push(u);
    } else {
      ready.push(u);
    }
  });

  return (
    <div className="space-y-6">
      {inTraining.length > 0 && (
        <section>
          <PanelHeader
            variant="warning"
            className="flex items-center justify-between mb-3 rounded-lg"
          >
            <div className="flex items-center gap-2 text-white">
              <Swords size={20} />
              <span className="font-cinzel font-bold">En formation</span>
            </div>
            <Badge variant="default" size="sm" className="bg-white/20 text-white border-white/40">
              {inTraining.length}
            </Badge>
          </PanelHeader>
          <div className="grid grid-cols-2 gap-4 items-stretch">
            {inTraining.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                barracksLevel={barracksLevel}
                training={trainingByType.get(unit.type)}
                onClick={onUnitClick}
              />
            ))}
          </div>
        </section>
      )}

      {ready.length > 0 && (
        <section>
          <PanelHeader
            variant="info"
            className="flex items-center justify-between mb-3 rounded-lg"
          >
            <div className="flex items-center gap-2 text-white">
              <Shield size={20} />
              <span className="font-cinzel font-bold">Entraînement</span>
            </div>
            <Badge variant="default" size="sm" className="bg-white/20 text-white border-white/40">
              {ready.length}
            </Badge>
          </PanelHeader>
          <div className="grid grid-cols-2 gap-4 items-stretch">
            {ready.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                barracksLevel={barracksLevel}
                training={undefined}
                onClick={onUnitClick}
              />
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section>
          <PanelHeader
            variant="stone"
            className="flex items-center justify-between mb-3 rounded-lg"
          >
            <div className="flex items-center gap-2 text-white">
              <Lock size={20} />
              <span className="font-cinzel font-bold">À débloquer</span>
            </div>
            <Badge variant="default" size="sm" className="bg-white/20 text-white border-white/40">
              {locked.length}
            </Badge>
          </PanelHeader>
          <div className="grid grid-cols-2 gap-4 items-stretch">
            {locked.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                barracksLevel={barracksLevel}
                training={undefined}
                onClick={onUnitClick}
              />
            ))}
          </div>
        </section>
      )}

      {units.length === 0 && (
        <Panel variant="stone" padding="lg" className="text-center">
          <Shield className="h-16 w-16 text-white mx-auto mb-4" />
          <p className="font-cinzel font-bold text-lg text-white mb-2">
            Aucune unité disponible
          </p>
          <p className="text-sm text-white/80">
            Améliorez la caserne pour débloquer de nouvelles troupes.
          </p>
        </Panel>
      )}
    </div>
  );
}
