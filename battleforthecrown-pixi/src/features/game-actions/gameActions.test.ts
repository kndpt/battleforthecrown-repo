import { describe, expect, it, vi } from 'vitest';
import {
  getDailyTaskGameAction,
  getOnboardingStepGameAction,
  runGameAction,
} from './gameActions';

describe('gameActions', () => {
  it('shares daily task and onboarding navigation intents', () => {
    expect(getDailyTaskGameAction('COMPLETE_BUILDING')).toMatchObject({
      gameActionId: 'open-building-management',
      loopLabel: 'Éco',
    });
    expect(getOnboardingStepGameAction('BUILD_BARRACKS')).toMatchObject({
      id: 'open-building-management',
      route: '/game',
    });
    expect(getOnboardingStepGameAction('UPGRADE_CASTLE_LEVEL_3')).toMatchObject({
      id: 'open-building-management',
      route: '/game',
    });
    expect(getOnboardingStepGameAction('ATTACK_BARBARIAN')).toMatchObject({
      id: 'open-world-map',
      route: '/game/world',
    });
  });

  it('opens the local building management hook before falling back to route navigation', () => {
    const navigate = vi.fn();
    const openBuildingManagement = vi.fn();
    const close = vi.fn();

    runGameAction('open-building-management', {
      close,
      navigate,
      openBuildingManagement,
    });

    expect(close).toHaveBeenCalledOnce();
    expect(openBuildingManagement).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('falls back to the canonical route when no local handler exists', () => {
    const navigate = vi.fn();

    runGameAction('open-building-management', { navigate });

    expect(navigate).toHaveBeenCalledWith('/game');
  });
});
