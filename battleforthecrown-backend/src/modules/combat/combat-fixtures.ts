import type { Expedition } from '@prisma/client';
import {
  DEFAULT_BARBARIAN_SEEDING_PLAN,
  DEFAULT_WORLD_IDENTITY_CONFIG,
  DEFAULT_WORLD_LIFECYCLE_CONFIG,
  DEFAULT_WORLD_OYEZ_CONFIG,
  DEFAULT_PLAYER_VILLAGE_PLACEMENT_PLAN,
} from '@battleforthecrown/shared/world';
import { DEFAULT_COMBAT_RULES } from '@battleforthecrown/shared/combat';
import type { CombatConfig } from './interfaces/combat-context.interface';

const BASE_EXPEDITION: Expedition = {
  id: 'exp-1',
  worldId: 'world-1',
  attackerVillageId: 'v1',
  reinforcementOriginVillageId: null,
  reinforcementRecallActorUserId: null,
  kind: 'ATTACK',
  targetKind: 'BARBARIAN_VILLAGE',
  targetRefId: 'barb-1',
  targetX: 10,
  targetY: 20,
  units: {},
  status: 'EN_ROUTE',
  departAt: new Date('2026-01-01'),
  arrivalAt: new Date('2026-01-01'),
  outboundTravelMs: 14000,
  attackerKingdomPowerSnapshot: null,
  defenderKingdomPowerSnapshot: null,
  defenderKingdomPowerSnapshots: null,
  returnAt: null,
  recalled: false,
  reportId: null,
  scoutReportId: null,
  survivingUnits: null,
  loot: null,
  createdAt: new Date('2026-01-01'),
};

export function makeExpeditionFixture(
  partial?: Partial<Expedition>,
): Expedition {
  return { ...BASE_EXPEDITION, ...partial };
}

const BASE_COMBAT_CONFIG: CombatConfig = {
  tempo: { global: 1 },
  lifecycle: DEFAULT_WORLD_LIFECYCLE_CONFIG,
  identity: DEFAULT_WORLD_IDENTITY_CONFIG,
  combat: DEFAULT_COMBAT_RULES,
  barbarianSeeding: DEFAULT_BARBARIAN_SEEDING_PLAN,
  playerVillagePlacement: DEFAULT_PLAYER_VILLAGE_PLACEMENT_PLAN,
  fogOfWar: { enabled: false },
  oyez: DEFAULT_WORLD_OYEZ_CONFIG,
  _distance: 14,
  _travelTime: 14000,
};

export function makeCombatConfigFixture(
  partial?: Partial<CombatConfig>,
): CombatConfig {
  return { ...BASE_COMBAT_CONFIG, ...partial };
}
