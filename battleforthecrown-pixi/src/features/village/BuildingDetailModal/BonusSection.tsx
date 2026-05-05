import { Badge, Card, ResourceIcon } from '@/ui';
import { Box, Eye, TrendingUp, Users, Zap } from 'lucide-react';
import {
  CASTLE_CONSTRUCTION_SPEED_BONUS,
  WATCHTOWER_VISION_LEVELS,
  type BuildingType,
} from '@battleforthecrown/shared/village/buildings';
import {
  getBuildingProduction,
  getWarehouseStorageLimit,
} from '@battleforthecrown/shared/resources';
import { getFarmPopulationLimit } from '@battleforthecrown/shared/village';

interface BuildingBonus {
  label: string;
  iconType: 'production' | 'storage' | 'population' | 'vision' | 'speed';
  resourceType?: 'wood' | 'stone' | 'iron';
  currentValue: number;
  nextValue: number | null;
  unit?: string;
  /** Used when the value at level 0 should be hidden (not yet built). */
  formatCurrent?: (value: number) => string;
  formatNext?: (value: number) => string;
}

function bonusFor(type: string, level: number): BuildingBonus | null {
  const t = type as BuildingType;
  const next = level + 1;

  if (t === 'WOOD' || t === 'STONE' || t === 'IRON') {
    const current = level > 0 ? getBuildingProduction(t, level) ?? 0 : 0;
    const upcoming = getBuildingProduction(t, next);
    const resourceType = t.toLowerCase() as 'wood' | 'stone' | 'iron';
    return {
      label: 'Production',
      iconType: 'production',
      resourceType,
      currentValue: current,
      nextValue: upcoming,
      unit: '/ h',
    };
  }

  if (t === 'WAREHOUSE') {
    const current = level > 0 ? getWarehouseStorageLimit(level).wood : 0;
    const upcoming = getWarehouseStorageLimit(next).wood;
    return {
      label: 'Capacité de stockage',
      iconType: 'storage',
      currentValue: current,
      nextValue: upcoming,
      unit: 'par ressource',
    };
  }

  if (t === 'FARM') {
    const current = level > 0 ? getFarmPopulationLimit(level) : 0;
    const upcoming = getFarmPopulationLimit(next);
    return {
      label: 'Population maximale',
      iconType: 'population',
      currentValue: current,
      nextValue: upcoming,
      unit: 'villageois',
    };
  }

  if (t === 'WATCHTOWER') {
    const cur = WATCHTOWER_VISION_LEVELS[level];
    const nxt = WATCHTOWER_VISION_LEVELS[next];
    return {
      label: 'Rayon de vision',
      iconType: 'vision',
      currentValue: cur?.visibilityRadius ?? 0,
      nextValue: nxt?.visibilityRadius ?? null,
      formatCurrent: (v) => (v > 0 ? `${v} cases` : 'Aucun'),
      formatNext: (v) => `${v} cases`,
    };
  }

  if (t === 'CASTLE') {
    const cur = CASTLE_CONSTRUCTION_SPEED_BONUS[level];
    const nxt = CASTLE_CONSTRUCTION_SPEED_BONUS[next];
    if (cur === undefined && nxt === undefined) return null;
    return {
      label: 'Vitesse de construction',
      iconType: 'speed',
      currentValue: cur ?? 1,
      nextValue: nxt ?? null,
      formatCurrent: (v) => `×${(1 / v).toFixed(2)}`,
      formatNext: (v) => `×${(1 / v).toFixed(2)}`,
    };
  }

  return null;
}

function getIcon(type: BuildingBonus['iconType']) {
  switch (type) {
    case 'production':
      return <TrendingUp size={18} className="text-game-green-dark" />;
    case 'storage':
      return <Box size={18} className="text-game-gold-dark" />;
    case 'population':
      return <Users size={18} className="text-game-blue-dark" />;
    case 'vision':
      return <Eye size={18} className="text-game-blue-dark" />;
    case 'speed':
      return <Zap size={18} className="text-game-gold-dark" />;
  }
}

interface BonusSectionProps {
  buildingType: string;
  currentLevel: number;
}

function format(bonus: BuildingBonus, value: number, formatter?: (v: number) => string) {
  if (formatter) return formatter(value);
  return `${value.toLocaleString()}${bonus.unit ? ` ${bonus.unit}` : ''}`;
}

export function BonusSection({ buildingType, currentLevel }: BonusSectionProps) {
  const bonus = bonusFor(buildingType, currentLevel);
  if (!bonus) return null;

  return (
    <Card variant="parchment" className="p-4" innerLight={false} innerShadow={false}>
      <div className="flex items-center gap-2 mb-3">
        {getIcon(bonus.iconType)}
        <h3 className="font-cinzel font-bold text-sm text-kingdom-900">{bonus.label}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-2.5 bg-white/50 rounded-lg border border-game-blue-border/30">
          <div className="flex items-center gap-2">
            {bonus.resourceType && <ResourceIcon resource={bonus.resourceType} size={24} />}
            <div>
              <p className="text-xs text-kingdom-600">Niveau actuel</p>
              <p className="font-bold text-base text-kingdom-900">
                {format(bonus, bonus.currentValue, bonus.formatCurrent)}
              </p>
            </div>
          </div>
          <Badge variant="info" size="sm">Niv. {currentLevel}</Badge>
        </div>

        {bonus.nextValue !== null && (
          <>
            <div className="flex items-center">
              <div className="h-px bg-game-gold-border/30 flex-1" />
              <span className="px-3 text-[10px] uppercase tracking-widest text-kingdom-500">
                amélioration
              </span>
              <div className="h-px bg-game-gold-border/30 flex-1" />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-game-green-light/20 rounded-lg border border-game-green-border">
              <div className="flex items-center gap-2">
                {bonus.resourceType && <ResourceIcon resource={bonus.resourceType} size={24} />}
                <div>
                  <p className="text-xs text-kingdom-600">Prochain niveau</p>
                  <p className="font-bold text-base text-game-green-dark">
                    {format(bonus, bonus.nextValue, bonus.formatNext)}
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">Niv. {currentLevel + 1}</Badge>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
