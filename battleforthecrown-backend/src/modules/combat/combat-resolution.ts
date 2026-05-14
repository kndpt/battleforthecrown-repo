import { getStrategyBonusValue } from '@battleforthecrown/shared/village';
import {
  getUnitStats,
  UNIT_TYPES,
  type UnitStats,
  type UnitType,
  type UnitMap,
} from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';
import { CombatContext } from './interfaces/combat-context.interface';

export interface CombatOutcome {
  lossesAttacker: UnitMap;
  lossesDefender: UnitMap;
  survivingAttacker: UnitMap;
  survivingDefender: UnitMap;
}

type RandomSource = () => number;
type DefenseStat = 'defenseInfantry' | 'defenseCavalry' | 'defenseArcher';
type DefenseStatWeights = Record<DefenseStat, number>;

const NOBLE_LOSS_CHANCE_BY_ATTACKER_LOSS_RATIO = [
  [0.5, 0.01],
  [0.55, 0.05],
  [0.6, 0.1],
  [0.65, 0.2],
  [0.7, 0.3],
  [0.75, 0.4],
  [0.8, 0.5],
  [0.85, 0.6],
  [0.9, 0.7],
  [0.95, 0.8],
  [1, 1],
] as const;

export function calculateNobleLossChance(attackerLossRatio: number): number {
  if (attackerLossRatio < 0.5) {
    return 0;
  }

  const table = NOBLE_LOSS_CHANCE_BY_ATTACKER_LOSS_RATIO;
  for (let i = 0; i < table.length; i += 1) {
    const [ratio, chance] = table[i];
    if (attackerLossRatio === ratio) {
      return chance;
    }
    if (attackerLossRatio < ratio) {
      const [previousRatio, previousChance] = table[i - 1];
      const progress =
        (attackerLossRatio - previousRatio) / (ratio - previousRatio);
      return previousChance + progress * (chance - previousChance);
    }
  }

  return 1;
}

export function calculateCombatOutcome(
  context: CombatContext,
  random: RandomSource = Math.random,
): CombatOutcome {
  const { attacker, defender, config } = context;
  const defenderUnits = defender.units || {};

  const totalAttackPower =
    sumAttackPower(attacker.units) * config.combat.attackBonus;
  const totalDefensePower = sumDefensePower(context);

  if (totalAttackPower <= 0) {
    return {
      lossesAttacker: { ...attacker.units },
      lossesDefender: {},
      survivingAttacker: {},
      survivingDefender: { ...defenderUnits },
    };
  }

  if (totalDefensePower <= 0) {
    return {
      lossesAttacker: {},
      lossesDefender: {},
      survivingAttacker: { ...attacker.units },
      survivingDefender: { ...defenderUnits },
    };
  }

  const isAttackerWin = totalAttackPower > totalDefensePower;

  let lossesAttacker = isAttackerWin
    ? applyLossRatio(attacker.units, totalDefensePower / totalAttackPower)
    : { ...attacker.units };
  const lossesDefender = isAttackerWin
    ? { ...defenderUnits }
    : applyLossRatio(defenderUnits, totalAttackPower / totalDefensePower);

  if (isAttackerWin) {
    lossesAttacker = applyNobleVictoryLoss(
      attacker.units,
      lossesAttacker,
      random,
    );
  }

  return {
    lossesAttacker,
    lossesDefender,
    survivingAttacker: subtractLosses(attacker.units, lossesAttacker),
    survivingDefender: subtractLosses(defenderUnits, lossesDefender),
  };
}

function sumAttackPower(units: UnitMap): number {
  let total = 0;
  for (const [unitType, quantity] of typedEntries(units)) {
    const stats = getUnitStats(unitType);
    if (stats) {
      total += stats.attack * quantity;
    }
  }
  return total;
}

function sumDefensePower(context: CombatContext): number {
  let total = 0;
  const defenseStatWeights = getDefenseStatWeights(context.attacker.units);

  for (const participant of context.defender.participants) {
    let participantDefensePower = 0;
    for (const [unitType, quantity] of typedEntries(participant.units)) {
      const stats = getUnitStats(unitType);
      if (stats) {
        participantDefensePower +=
          getWeightedDefensePower(stats, defenseStatWeights) * quantity;
      }
    }

    if (participant.strategy) {
      const defenseBonus = getStrategyBonusValue(
        participant.strategy,
        'defenseBonus',
      );
      if (defenseBonus) {
        participantDefensePower *= defenseBonus;
      }
    } else {
      participantDefensePower *= context.config.combat.defenseBonus;
    }

    total += participantDefensePower;
  }

  return total;
}

export function getDefenseStatForAttackerUnit(
  attackerUnitType: UnitType,
): DefenseStat {
  if (attackerUnitType === UNIT_TYPES.CAVALRY) {
    return 'defenseCavalry';
  }

  if (attackerUnitType === UNIT_TYPES.ARCHER) {
    return 'defenseArcher';
  }

  return 'defenseInfantry';
}

export function getDefenseStatWeights(
  attackerUnits: UnitMap,
): DefenseStatWeights {
  const weights: DefenseStatWeights = {
    defenseArcher: 0,
    defenseCavalry: 0,
    defenseInfantry: 0,
  };
  let totalAttackPower = 0;

  for (const [unitType, quantity] of typedEntries(attackerUnits)) {
    const stats = getUnitStats(unitType);
    if (!stats) {
      continue;
    }

    const attackPower = stats.attack * quantity;
    weights[getDefenseStatForAttackerUnit(unitType)] += attackPower;
    totalAttackPower += attackPower;
  }

  if (totalAttackPower <= 0) {
    return { defenseArcher: 0, defenseCavalry: 0, defenseInfantry: 1 };
  }

  return {
    defenseArcher: weights.defenseArcher / totalAttackPower,
    defenseCavalry: weights.defenseCavalry / totalAttackPower,
    defenseInfantry: weights.defenseInfantry / totalAttackPower,
  };
}

export function getWeightedDefensePower(
  stats: Pick<UnitStats, DefenseStat>,
  weights: DefenseStatWeights,
): number {
  return (
    stats.defenseInfantry * weights.defenseInfantry +
    stats.defenseCavalry * weights.defenseCavalry +
    stats.defenseArcher * weights.defenseArcher
  );
}

function applyLossRatio(units: UnitMap, lossRatio: number): UnitMap {
  const losses: UnitMap = {};
  for (const [unitType, quantity] of typedEntries(units)) {
    losses[unitType] = Math.floor(quantity * lossRatio);
  }
  return losses;
}

function applyNobleVictoryLoss(
  attackerUnits: UnitMap,
  lossesAttacker: UnitMap,
  random: RandomSource,
): UnitMap {
  if ((attackerUnits[UNIT_TYPES.NOBLE] ?? 0) < 1) {
    return lossesAttacker;
  }

  const totalUnits = sumUnits(attackerUnits);
  if (totalUnits === 0) {
    return lossesAttacker;
  }

  const lossRatio = sumUnits(lossesAttacker) / totalUnits;
  const nobleLossChance = calculateNobleLossChance(lossRatio);
  if (nobleLossChance === 0 || random() >= nobleLossChance) {
    return lossesAttacker;
  }

  return {
    ...lossesAttacker,
    [UNIT_TYPES.NOBLE]: 1,
  };
}

function sumUnits(units: UnitMap): number {
  return typedEntries(units).reduce((sum, [, quantity]) => sum + quantity, 0);
}

function subtractLosses(units: UnitMap, losses: UnitMap): UnitMap {
  const result: UnitMap = {};
  for (const [unitType, quantity] of typedEntries(units)) {
    const loss = losses[unitType] || 0;
    const survived = Math.max(0, quantity - loss);
    if (survived > 0) {
      result[unitType] = survived;
    }
  }
  return result;
}
