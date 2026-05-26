import type { DailyCardTaskType } from '@battleforthecrown/shared/retention';
import type { OnboardingStep } from '@battleforthecrown/shared/onboarding';

export type GameActionRoute = '/game' | '/game/army' | '/game/world';

export type GameActionId =
  | 'open-building-management'
  | 'open-army-training'
  | 'open-world-map';

export type GameActionIntent = 'building-management' | 'route';

export interface GameActionDefinition {
  id: GameActionId;
  defaultLabel: string;
  intent: GameActionIntent;
  route: GameActionRoute;
}

export interface DailyTaskGameAction {
  actionLabel: string;
  gameActionId: GameActionId;
  icon: string;
  loopLabel: string;
}

export interface RunGameActionOptions {
  close?: () => void;
  navigate: (route: GameActionRoute) => void;
  openBuildingManagement?: () => void;
}

export const GAME_ACTIONS: Record<GameActionId, GameActionDefinition> = {
  'open-building-management': {
    defaultLabel: 'Bâtiments',
    id: 'open-building-management',
    intent: 'building-management',
    route: '/game',
  },
  'open-army-training': {
    defaultLabel: 'Armée',
    id: 'open-army-training',
    intent: 'route',
    route: '/game/army',
  },
  'open-world-map': {
    defaultLabel: 'Carte',
    id: 'open-world-map',
    intent: 'route',
    route: '/game/world',
  },
};

const DAILY_TASK_ACTIONS: Record<DailyCardTaskType, DailyTaskGameAction> = {
  COMPLETE_BUILDING: {
    actionLabel: 'Village',
    gameActionId: 'open-building-management',
    icon: '/assets/castle.png',
    loopLabel: 'Éco',
  },
  RAID_BARBARIAN: {
    actionLabel: 'Carte',
    gameActionId: 'open-world-map',
    icon: '/assets/attack.png',
    loopLabel: 'PVM',
  },
  SCOUT_TARGET: {
    actionLabel: 'Carte',
    gameActionId: 'open-world-map',
    icon: '/assets/lupa.png',
    loopLabel: 'Scout',
  },
  SEND_REINFORCEMENT: {
    actionLabel: 'Carte',
    gameActionId: 'open-world-map',
    icon: '/assets/defense.png',
    loopLabel: 'Défense',
  },
  TRAIN_UNITS: {
    actionLabel: 'Armée',
    gameActionId: 'open-army-training',
    icon: '/assets/army-power.png',
    loopLabel: 'Armée',
  },
};

const ONBOARDING_STEP_ACTIONS: Record<OnboardingStep, GameActionId> = {
  ATTACK_BARBARIAN: 'open-world-map',
  BUILD_BARRACKS: 'open-building-management',
  BUILD_WATCHTOWER: 'open-building-management',
  TRAIN_TROOPS: 'open-army-training',
  UPGRADE_CASTLE_LEVEL_2: 'open-building-management',
  UPGRADE_CASTLE_LEVEL_3: 'open-building-management',
};

export function getDailyTaskGameAction(type: DailyCardTaskType): DailyTaskGameAction {
  return DAILY_TASK_ACTIONS[type];
}

export function getOnboardingStepGameAction(step: OnboardingStep): GameActionDefinition {
  return GAME_ACTIONS[ONBOARDING_STEP_ACTIONS[step]];
}

export function runGameAction(actionId: GameActionId, options: RunGameActionOptions) {
  const action = GAME_ACTIONS[actionId];
  options.close?.();

  if (action.intent === 'building-management' && options.openBuildingManagement) {
    options.openBuildingManagement();
    return;
  }

  options.navigate(action.route);
}
