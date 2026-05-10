import { Injectable, Logger } from '@nestjs/common';
import { CombatStrategy, CombatResolution } from './combat-strategy.interface';
import {
  CombatContext,
  CombatParticipant,
} from '../interfaces/combat-context.interface';
import { LootManager } from '../loot/loot.manager';
import { getUnitStats, type UnitMap } from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';
import { getStrategyBonusValue } from '@battleforthecrown/shared/village';

@Injectable()
export class PlayerVillageStrategy implements CombatStrategy {
  private readonly logger = new Logger(PlayerVillageStrategy.name);

  constructor(private readonly lootManager: LootManager) {}

  async resolve(context: CombatContext): Promise<CombatResolution> {
    this.logger.log(
      `Resolving PvP attack: expedition ${context.expedition.id}`,
    );

    // 1. Calculate combat outcome
    const combatOutcome = this.calculateCombat(context);

    // 2. Calculate loot (based on surviving attacker units)
    const lootContext = {
      ...context,
      attacker: {
        ...context.attacker,
        units: combatOutcome.survivingAttacker,
      },
    };
    const loot = await this.lootManager.calculateLoot(lootContext);

    this.logger.log(
      `PvP combat resolved: attacker losses ${JSON.stringify(combatOutcome.lossesAttacker)}, ` +
        `defender losses ${JSON.stringify(combatOutcome.lossesDefender)}, ` +
        `loot ${JSON.stringify(loot.resources)}`,
    );

    return {
      loot,
      lossesAttacker: combatOutcome.lossesAttacker,
      lossesDefender: combatOutcome.lossesDefender,
      survivingUnits: combatOutcome.survivingAttacker,
    };
  }

  /**
   * Calculate combat outcome with losses
   *
   * TODO v2: Add support for walls, morale, building bonuses
   */
  private calculateCombat(context: CombatContext): {
    lossesAttacker: UnitMap;
    lossesDefender: UnitMap;
    survivingAttacker: UnitMap;
    survivingDefender: UnitMap;
  } {
    const { attacker, defender, config } = context;

    // Calculate total attack power
    let totalAttackPower = 0;
    for (const [unitType, quantity] of typedEntries(attacker.units)) {
      const stats = getUnitStats(unitType);
      if (stats) {
        totalAttackPower += stats.attack * quantity;
      }
    }

    // Apply attack bonus from config

    totalAttackPower *= config.combat.attackBonus;

    // Calculate total defense power
    // For now, use defenseInfantry as base defense
    // TODO v2: Determine attack type (infantry/cavalry/archer) and use appropriate defense
    let totalDefensePower = 0;

    for (const participant of defender.participants) {
      let participantDefensePower = 0;
      for (const [unitType, quantity] of typedEntries(participant.units)) {
        const stats = getUnitStats(unitType);
        if (stats) {
          participantDefensePower += stats.defenseInfantry * quantity;
        }
      }

      // Apply defense bonus specific to this participant's origin style
      if (participant.strategy) {
        const defenseBonus = getStrategyBonusValue(
          participant.strategy,
          'defenseBonus',
        );
        if (defenseBonus) {
          participantDefensePower *= defenseBonus;
        }
      } else {
        // Fallback to global config bonus if participant has no specific strategy (should not happen for players)
        participantDefensePower *= config.combat.defenseBonus;
      }

      totalDefensePower += participantDefensePower;
    }

    // TODO v2: Add wall bonus
    // const wallBonus = this.calculateWallBonus(defender.village);
    // totalDefensePower *= wallBonus;

    this.logger.debug(
      `Combat powers: attack=${totalAttackPower}, defense=${totalDefensePower}`,
    );

    // Simple combat formula
    // Winner = higher total power
    // Loser losses = based on power ratio
    const isAttackerWin = totalAttackPower > totalDefensePower;

    let lossesAttacker: UnitMap = {};
    let lossesDefender: UnitMap = {};

    if (isAttackerWin) {
      // Attacker wins
      const lossRatio = totalDefensePower / totalAttackPower;
      lossesAttacker = this.applyLossRatio(attacker.units, lossRatio);
      lossesDefender = { ...(defender.units || {}) }; // All defenders die
    } else {
      // Defender wins
      const lossRatio = totalAttackPower / totalDefensePower;
      lossesAttacker = { ...attacker.units }; // All attackers die
      lossesDefender = this.applyLossRatio(defender.units || {}, lossRatio);
    }

    // Calculate survivors
    const survivingAttacker = this.subtractLosses(
      attacker.units,
      lossesAttacker,
    );
    const survivingDefender = this.subtractLosses(
      defender.units || {},
      lossesDefender,
    );

    return {
      lossesAttacker,
      lossesDefender,
      survivingAttacker,
      survivingDefender,
    };
  }

  /**
   * Apply loss ratio to units
   * TODO v2: More sophisticated formula (losses per unit type)
   */
  private applyLossRatio(units: UnitMap, lossRatio: number): UnitMap {
    const losses: UnitMap = {};
    for (const [unitType, quantity] of typedEntries(units)) {
      losses[unitType] = Math.floor(quantity * lossRatio);
    }
    return losses;
  }

  /**
   * Subtract losses from units
   */
  private subtractLosses(units: UnitMap, losses: UnitMap): UnitMap {
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
}
