import { Expedition, Village, VillageStrategyConfig } from '@prisma/client';
import type { WorldConfig } from '@battleforthecrown/shared/world';
import type { UnitMap } from '@battleforthecrown/shared/army';

type VillageRef = Pick<
  Village,
  'id' | 'name' | 'x' | 'y' | 'userId' | 'isBarbarian'
>;

export interface CombatConfig extends WorldConfig {
  _distance: number;
  _travelTime: number;
}

export interface CombatContext {
  worldId: string;
  expedition: Expedition;
  attacker: { village: VillageRef; units: UnitMap };
  defender: {
    kind: 'PLAYER_VILLAGE' | 'BARBARIAN_VILLAGE';
    village?: VillageRef;
    units?: UnitMap;
    resources?: { wood: number; stone: number; iron: number };
  };
  config: CombatConfig;
  attackerStrategyConfig?: VillageStrategyConfig | null;
}
