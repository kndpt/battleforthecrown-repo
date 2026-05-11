import { getStrategyBonusValue } from '@battleforthecrown/shared/village';
import { getUnitStats, type UnitMap } from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';
import { CombatContext } from './interfaces/combat-context.interface';

export interface CombatOutcome {
  lossesAttacker: UnitMap;
  lossesDefender: UnitMap;
  survivingAttacker: UnitMap;
  survivingDefender: UnitMap;
}

export function calculateCombatOutcome(context: CombatContext): CombatOutcome {
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

  const lossesAttacker = isAttackerWin
    ? applyLossRatio(attacker.units, totalDefensePower / totalAttackPower)
    : { ...attacker.units };
  const lossesDefender = isAttackerWin
    ? { ...defenderUnits }
    : applyLossRatio(defenderUnits, totalAttackPower / totalDefensePower);

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

  for (const participant of context.defender.participants) {
    let participantDefensePower = 0;
    for (const [unitType, quantity] of typedEntries(participant.units)) {
      const stats = getUnitStats(unitType);
      if (stats) {
        participantDefensePower += stats.defenseInfantry * quantity;
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

function applyLossRatio(units: UnitMap, lossRatio: number): UnitMap {
  const losses: UnitMap = {};
  for (const [unitType, quantity] of typedEntries(units)) {
    losses[unitType] = Math.floor(quantity * lossRatio);
  }
  return losses;
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
