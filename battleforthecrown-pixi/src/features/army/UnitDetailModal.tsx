import { useWorldConfigQuery } from '@/api/queries';
import type { ArmyUnitDto } from '@/api/queries';
import {
  TROOP_DETAIL_FIELD_MAX,
  TROOP_DETAIL_LABELS_FR,
  TroopDetailModal as DesignTroopDetailModal,
  type TroopDetailPassive,
  type TroopDetailRoleTone,
} from '@/features/design-system/components';
import { useDisplayCrowns, useDisplayResources } from '@/features/resources/useDisplayResources';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import {
  UNIT_COSTS,
  UNIT_STATS,
  UNIT_TYPES,
  type UnitPassive,
  type UnitType,
} from '@battleforthecrown/shared/army';
import { unitMetaFor } from './unitConfig';

interface UnitDetailModalProps {
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

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) return `${hours} h ${minutes} m`;
  if (minutes > 0) return `${minutes} m ${secs} s`;
  return `${secs} s`;
}

function formatBonus(value: number): string {
  return `+${Math.round(value * 100)} %`;
}

function passiveFor(passive: UnitPassive | null, unitName: string): TroopDetailPassive | null {
  if (!passive) return null;

  if (passive.kind === 'attackVsUnits') {
    const targets = passive.targets.map((target) => unitMetaFor(target).name).join(', ');
    return {
      bonus: formatBonus(passive.bonus),
      description: `${formatBonus(passive.bonus)} d’attaque contre ${targets}.`,
      icon: '⚔',
      name: 'Avantage tactique',
    };
  }

  if (passive.kind === 'attackVsWall') {
    return {
      bonus: formatBonus(passive.bonus),
      description: `${formatBonus(passive.bonus)} d’attaque contre les remparts.`,
      icon: '💥',
      name: 'Briseur de remparts',
    };
  }

  if (passive.kind === 'attackOnRaid') {
    return {
      bonus: formatBonus(passive.bonus),
      description: `${formatBonus(passive.bonus)} d’attaque lorsque la troupe participe à un raid.`,
      icon: '⚡',
      name: 'Frénésie du pillard',
    };
  }

  if (passive.kind === 'defenseOnGarrison') {
    return {
      bonus: formatBonus(passive.bonus),
      description: `${formatBonus(passive.bonus)} de défense lorsque ${unitName} tient une garnison.`,
      icon: '⛨',
      name: 'Mur vivant',
    };
  }

  if (passive.kind === 'aoeDamage') {
    return {
      bonus: 'Zone',
      description: 'Inflige des dégâts de siège répartis sur plusieurs lignes.',
      icon: '✹',
      name: 'Impact de zone',
    };
  }

  return {
    bonus: 'Discret',
    description: 'Spécialisé dans la reconnaissance et l’espionnage.',
    icon: '◉',
    name: 'Reconnaissance',
  };
}

function roleFor(type: UnitType, stats: typeof UNIT_STATS[UnitType]): { archetype: string; label: string; tone: TroopDetailRoleTone } {
  if (type === UNIT_TYPES.MILITIA) return { archetype: 'Infanterie · Base polyvalente', label: 'Neutre', tone: 'neutral' };
  if (type === UNIT_TYPES.SQUIRE) return { archetype: 'Infanterie · Ligne polyvalente', label: 'Neutre', tone: 'neutral' };
  if (type === UNIT_TYPES.ARCHER) return { archetype: 'Défense · Anti-cavalerie', label: 'Défensif', tone: 'info' };
  if (type === UNIT_TYPES.TEMPLAR) return { archetype: 'Défense · Tenue de ligne', label: 'Défensif', tone: 'info' };
  if (type === UNIT_TYPES.WARRIOR) return { archetype: 'Infanterie · Frappe rapide', label: 'Offensif', tone: 'danger' };
  if (type === UNIT_TYPES.SPY) return { archetype: 'Reconnaissance · Discrétion', label: 'Espion', tone: 'info' };
  if (type === UNIT_TYPES.RAM || type === UNIT_TYPES.CATAPULT) return { archetype: 'Siège · Destruction', label: 'Siège', tone: 'warning' };
  if (type === UNIT_TYPES.NOBLE) return { archetype: 'Conquête · Autorité', label: 'Noble', tone: 'warning' };

  const defense = Math.max(stats.defenseInfantry, stats.defenseCavalry, stats.defenseArcher);
  if (defense > stats.attack) return { archetype: 'Défense · Tenue de ligne', label: 'Défensif', tone: 'info' };
  if (stats.speed >= TROOP_DETAIL_FIELD_MAX.speed) return { archetype: 'Cavalerie · Raid rapide', label: 'Mobile', tone: 'success' };
  return { archetype: 'Infanterie · Frappe rapide', label: 'Offensif', tone: 'danger' };
}

export function UnitDetailModal({ onClose, unit }: UnitDetailModalProps) {
  const unitType = isUnitType(unit.type) ? unit.type : null;
  const meta = unitMetaFor(unit.type);
  const stats = unitType ? UNIT_STATS[unitType] : null;
  const cost = unitType ? UNIT_COSTS[unitType] : null;
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { display } = useDisplayResources(villageId);
  const { balance: crownsBalance } = useDisplayCrowns(userId, worldId);
  const trainingMultiplier = useWorldConfigQuery(worldId).data?.gameSpeed.training;

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
  const passive = passiveFor(stats.passive, meta.name);
  const perUnitSeconds = trainingMultiplier ? cost.time / trainingMultiplier : cost.time;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(0,0,0,.62)] p-3 [backdrop-filter:blur(3px)]"
      onClick={onClose}
      role="dialog"
    >
      <div className="flex w-full justify-center" onClick={(event) => event.stopPropagation()}>
        <DesignTroopDetailModal
          archetype={role.archetype}
          closeLabel="Fermer"
          cost={troopCost}
          fieldMax={TROOP_DETAIL_FIELD_MAX}
          labels={TROOP_DETAIL_LABELS_FR}
          name={meta.name}
          onClose={onClose}
          passive={passive}
          populationCost={cost.population}
          portraitFallback={meta.emoji}
          portraitSrc={meta.iconPath}
          roleLabel={role.label}
          roleTone={role.tone}
          stats={stats}
          stock={stock}
          tagline={`« ${meta.description} »`}
          tierBadge={roman(Math.min(requiredLevel, 10))}
          trainingTime={formatDuration(perUnitSeconds)}
        />
      </div>
    </div>
  );
}
