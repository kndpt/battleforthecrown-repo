import { useWorldConfigQuery } from '@/api/queries';
import type { ArmyUnitDto } from '@/api/queries';
import { ModalBackdrop } from '@/ui';
import {
  TROOP_DETAIL_FIELD_MAX,
  TROOP_DETAIL_LABELS_FR,
  TroopDetailModal as DesignTroopDetailModal,
  type TroopDetailRoleTone,
} from '@/features/design-system/components';
import { formatRemaining } from '@/features/village/constructionProgress';
import { useDisplayCrowns, useDisplayResources } from '@/features/resources/useDisplayResources';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import {
  UNIT_COSTS,
  UNIT_STATS,
  UNIT_TYPES,
  type UnitType,
} from '@battleforthecrown/shared/army';
import { unitMetaFor } from './unitConfig';
import { getEffectiveUnitTrainingDurationSeconds } from './trainingDuration';

interface UnitDetailModalProps {
  barracksLevel: number;
  onClose: () => void;
  unit: ArmyUnitDto;
}

function isUnitType(value: string): value is UnitType {
  return Object.values(UNIT_TYPES).includes(value as UnitType);
}

function roman(value: number): string {
  const safe = Math.max(1, Math.min(10, value));
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][safe - 1] ?? 'I';
}

function roleFor(type: UnitType, stats: typeof UNIT_STATS[UnitType]): { archetype: string; label: string; tone: TroopDetailRoleTone } {
  if (type === UNIT_TYPES.MILITIA) return { archetype: 'Infanterie · Base polyvalente', label: 'Neutre', tone: 'neutral' };
  if (type === UNIT_TYPES.SQUIRE) return { archetype: 'Infanterie · Ligne polyvalente', label: 'Neutre', tone: 'neutral' };
  if (type === UNIT_TYPES.ARCHER) return { archetype: 'Défense · Anti-cavalerie', label: 'Défensif', tone: 'info' };
  if (type === UNIT_TYPES.TEMPLAR) return { archetype: 'Défense · Tenue de ligne', label: 'Défensif', tone: 'info' };
  if (type === UNIT_TYPES.WARRIOR) return { archetype: 'Infanterie · Frappe rapide', label: 'Offensif', tone: 'danger' };
  if (type === UNIT_TYPES.SPY) return { archetype: 'Reconnaissance · Discrétion', label: 'Espion', tone: 'info' };
  if (type === UNIT_TYPES.RAM || type === UNIT_TYPES.CATAPULT) return { archetype: 'Siège · Destruction', label: 'Siège', tone: 'warning' };
  if (type === UNIT_TYPES.NOBLE) return { archetype: 'Conquête · Autorité', label: 'Seigneur', tone: 'warning' };

  const defense = Math.max(stats.defenseInfantry, stats.defenseCavalry, stats.defenseArcher);
  if (defense > stats.attack) return { archetype: 'Défense · Tenue de ligne', label: 'Défensif', tone: 'info' };
  if (stats.speed >= TROOP_DETAIL_FIELD_MAX.speed) return { archetype: 'Cavalerie · Raid rapide', label: 'Mobile', tone: 'success' };
  return { archetype: 'Infanterie · Frappe rapide', label: 'Offensif', tone: 'danger' };
}

export function UnitDetailModal({
  barracksLevel,
  onClose,
  unit,
}: UnitDetailModalProps) {
  const unitType = isUnitType(unit.type) ? unit.type : null;
  const meta = unitMetaFor(unit.type);
  const stats = unitType ? UNIT_STATS[unitType] : null;
  const cost = unitType ? UNIT_COSTS[unitType] : null;
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { display } = useDisplayResources(villageId);
  const { balance: crownsBalance } = useDisplayCrowns(userId, worldId);
  const worldTempo = useWorldConfigQuery(worldId).data?.tempo;

  if (!unitType || !stats || !cost) return null;

  const requiredLevel = cost.requiredBarracksLevel;
  const troopCost = {
    crowns: cost.crowns ?? 0,
    iron: cost.iron,
    stone: cost.stone,
    wood: cost.wood,
  };
  const stock = {
    crowns: crownsBalance ?? 0,
    iron: display?.iron ?? 0,
    stone: display?.stone ?? 0,
    wood: display?.wood ?? 0,
  };
  const role = roleFor(unitType, stats);
  const perUnitSeconds = getEffectiveUnitTrainingDurationSeconds({
    unitTimeSeconds: cost.time,
    worldTempo,
    barracksLevel: unitType === UNIT_TYPES.NOBLE ? 1 : barracksLevel,
  });

  return (
    <ModalBackdrop onClose={onClose}>
      <DesignTroopDetailModal
        archetype={role.archetype}
        closeLabel="Fermer"
        cost={troopCost}
        fieldMax={TROOP_DETAIL_FIELD_MAX}
        labels={TROOP_DETAIL_LABELS_FR}
        name={meta.name}
        onClose={onClose}
        populationCost={cost.population}
        portraitFallback={meta.emoji}
        portraitSrc={meta.iconPath}
        roleLabel={role.label}
        roleTone={role.tone}
        stats={stats}
        stock={stock}
        tagline={`« ${meta.description} »`}
        tierBadge={roman(Math.min(requiredLevel, 10))}
        trainingTime={formatRemaining(perUnitSeconds * 1000)}
      />
    </ModalBackdrop>
  );
}
