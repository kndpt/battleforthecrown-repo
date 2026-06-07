import { describe, expect, it } from 'vitest';
import type { CombatReportDto } from '@/api/queries';
import {
  buildCombatReportModalProps,
  combatReportOutcome,
  combatReportTypeLabel,
} from './combatReportView';

const report: CombatReportDto = {
  id: 'abcdef123456',
  worldId: 'world-1',
  attackerVillageId: 'v-attacker',
  attackerUserId: 'u-attacker',
  defenderVillageId: 'v-defender',
  defenderUserId: 'u-defender',
  targetKind: 'PLAYER_VILLAGE',
  targetX: 12,
  targetY: 34,
  loot: {
    remainingResources: { iron: 0, stone: 50, wood: 100 },
    resources: { iron: 0, stone: 25, wood: 75 },
  },
  totalUnitsAttacker: { ARCHER: 10, WARRIOR: 20 },
  totalUnitsDefender: { MILITIA: 15 },
  lossesAttacker: { ARCHER: 2, WARRIOR: 20 },
  lossesDefender: { MILITIA: 15 },
  details: { targetTier: null },
  isRead: false,
  isAttacker: true,
  timestamp: '2026-05-12T10:00:00.000Z',
  createdAt: '2026-05-12T10:00:00.000Z',
};

describe('combatReportView', () => {
  it('maps attacker reports to the design-system combat modal props', () => {
    const props = buildCombatReportModalProps(report, [
      { id: 'close', label: 'Fermer', tone: 'neutral' },
    ]);

    expect(props.battleId).toBe('#ABCDEF');
    expect(props.banner).toBe('VICTOIRE');
    expect(props.outcome).toBe('win');
    expect(props.roleLabel).toBe('Attaquant');
    expect(props.type).toBe('Attaque');
    expect(props.attacker).toEqual({
      coord: '—',
      name: 'Vous',
      place: 'Votre village',
    });
    expect(props.defender).toEqual({
      coord: '12|34',
      name: 'Village joueur',
      place: 'Village joueur',
    });
    expect(props.attackerUnits).toEqual([
      expect.objectContaining({ lost: 2, name: 'Archers', sent: 10 }),
      expect.objectContaining({ lost: 20, name: 'Guerriers', sent: 20 }),
    ]);
    expect(props.defenderUnits).toEqual([
      expect.objectContaining({ lost: 15, name: 'Milices de paysans', sent: 15 }),
    ]);
    expect(props.highlight).toEqual(
      expect.objectContaining({
        kind: 'loot',
        title: 'Butin ramené',
        chips: [
          expect.objectContaining({ remainingValue: '175', value: '75' }),
          expect.objectContaining({ remainingValue: '75', value: '25' }),
        ],
      }),
    );
  });

  it('flips the outcome for defense reports', () => {
    const defenseReport: CombatReportDto = {
      ...report,
      isAttacker: false,
      lossesAttacker: { ARCHER: 10, WARRIOR: 20 },
      lossesDefender: { MILITIA: 4 },
      targetKind: 'BARBARIAN_VILLAGE',
      details: { targetTier: 'T2' },
    };

    expect(combatReportOutcome(defenseReport)).toEqual({
      isVictory: true,
      outcome: 'win',
    });

    const props = buildCombatReportModalProps(defenseReport, []);

    expect(props.roleLabel).toBe('Défenseur');
    expect(props.type).toBe('Défense');
    expect(props.defender).toEqual({
      coord: '12|34',
      name: 'Vous',
      place: 'Village barbare T2',
    });
    expect(props.highlight).toEqual(
      expect.objectContaining({
        kind: 'lootLost',
        title: 'Ressources pillées',
      }),
    );
  });

  it('marks attacker wipe as defeat for attacker and victory for defender', () => {
    const attackerWipeReport: CombatReportDto = {
      ...report,
      totalUnitsAttacker: { ARCHER: 16, WARRIOR: 20 },
      totalUnitsDefender: { ARCHER: 146 },
      lossesAttacker: { ARCHER: 16, WARRIOR: 20 },
      lossesDefender: { ARCHER: 49 },
    };

    expect(combatReportOutcome(attackerWipeReport)).toEqual({
      isVictory: false,
      outcome: 'lose',
    });
    expect(combatReportOutcome({ ...attackerWipeReport, isAttacker: false })).toEqual({
      isVictory: true,
      outcome: 'win',
    });
  });

  it('marks attacker survival as victory even with heavier attacker losses', () => {
    const costlyVictoryReport: CombatReportDto = {
      ...report,
      totalUnitsAttacker: { ARCHER: 20, WARRIOR: 20 },
      totalUnitsDefender: { MILITIA: 10 },
      lossesAttacker: { ARCHER: 19, WARRIOR: 20 },
      lossesDefender: { MILITIA: 10 },
    };

    expect(combatReportOutcome(costlyVictoryReport)).toEqual({
      isVictory: true,
      outcome: 'win',
    });
  });

  it('labels capture defense, observed contest and final capture reports', () => {
    const captureDefense: CombatReportDto = {
      ...report,
      details: { occupationDefense: { attackerVillageId: 'v-origin' } },
      isAttacker: false,
      recipientRole: 'defender',
    };
    expect(combatReportTypeLabel(captureDefense)).toEqual({
      icon: '🛡️',
      label: 'Défense de capture',
      roleLabel: 'Occupant',
    });

    const observedContest: CombatReportDto = {
      ...report,
      details: { occupationDefense: { attackerVillageId: 'v-origin' } },
      isAttacker: false,
      recipientRole: 'observer',
    };
    expect(combatReportTypeLabel(observedContest)).toEqual({
      icon: '👁️',
      label: 'Capture contestée',
      roleLabel: 'Propriétaire original',
    });

    const captureWon: CombatReportDto = {
      ...report,
      details: { captureFinalized: { outcome: 'COMPLETED' } },
      lossesAttacker: {},
      lossesDefender: {},
      totalUnitsAttacker: {},
      totalUnitsDefender: {},
      recipientRole: 'attacker',
    };
    expect(combatReportOutcome(captureWon)).toEqual({
      isVictory: true,
      outcome: 'win',
    });
    expect(combatReportTypeLabel(captureWon).label).toBe('Capture réussie');

    const captureLost: CombatReportDto = {
      ...captureWon,
      isAttacker: false,
      recipientRole: 'defender',
    };
    expect(combatReportOutcome(captureLost)).toEqual({
      isVictory: false,
      outcome: 'lose',
    });
    expect(combatReportTypeLabel(captureLost).label).toBe('Capture perdue');
  });

});
