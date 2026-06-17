import { describe, expect, it } from 'vitest';
import type { OnboardingSummaryDto } from '@battleforthecrown/shared/onboarding';
import { getOnboardingGuidance } from './onboardingViewModel';

function summary(currentStep: OnboardingSummaryDto['currentStep']): OnboardingSummaryDto {
  return {
    worldId: 'world-1',
    firstVillageId: 'village-1',
    narrativeTargetVillageId: null,
    status: currentStep ? 'ACTIVE' : 'COMPLETED',
    currentStep,
    completedSteps: [],
    initialRewardApplied: true,
    initialRewardAppliedAt: '2026-05-26T08:00:00.000Z',
    initialReward: { wood: 850, stone: 850, iron: 850, crowns: 100 },
    completedAt: currentStep ? null : '2026-05-26T08:05:00.000Z',
  };
}

describe('getOnboardingGuidance', () => {
  it('maps the current scripted step to a CTA', () => {
    expect(getOnboardingGuidance(summary('TRAIN_TROOPS'))).toMatchObject({
      title: 'Former la milice',
      description: 'Entraîne 5 miliciens paysans depuis l’écran Armée.',
      gameActionId: 'open-army-training',
      imageBadgeLabel: 'x5',
      route: '/game/army',
      progressLabel: '3 / 6',
      imageSrc: '/assets/army/militia.png',
      modalLabel: 'TUTORIEL · Étape 3/6',
      pillLabel: 'Tutoriel · 3/6',
      secondaryLabel: 'Plus tard',
      step: 3,
      total: 6,
    });
    expect(getOnboardingGuidance(summary('UPGRADE_CASTLE_LEVEL_3'))).toMatchObject({
      title: 'Renforcer le Château',
      description: 'Passe le Château au niveau 3 pour débloquer la Tour de guet.',
      gameActionId: 'open-building-management',
      route: '/game',
      progressLabel: '4 / 6',
      modalLabel: 'TUTORIEL · Étape 4/6',
      pillLabel: 'Tutoriel · 4/6',
      step: 4,
      total: 6,
    });
    expect(getOnboardingGuidance(summary('BUILD_WATCHTOWER'))?.lootPreview).toMatchObject({
      label: 'Butin à récupérer',
      items: [
        { icon: '/assets/resources/wood.png', value: '1.2K' },
        { icon: '/assets/resources/stone.png', value: '1.2K' },
        { icon: '/assets/resources/iron.png', value: '840' },
      ],
    });
    expect(getOnboardingGuidance(summary('ATTACK_BARBARIAN'))).toMatchObject({
      title: 'Attaquer le campement révélé',
      description:
        'Ouvre la carte, vise le campement barbare révélé par la Tour de guet et lance ton attaque avec tes 5 miliciens.',
      gameActionId: 'open-world-map',
      imageSrc: '/assets/world/entity/barbarian-village-tier1.png',
      lootPreview: {
        label: 'Butin à récupérer',
        items: [
          { icon: '/assets/resources/wood.png', value: '1.2K' },
          { icon: '/assets/resources/stone.png', value: '1.2K' },
          { icon: '/assets/resources/iron.png', value: '840' },
        ],
      },
      route: '/game/world',
      progressLabel: '6 / 6',
      modalLabel: 'TUTORIEL · Étape 6/6',
      pillLabel: 'Tutoriel · 6/6',
      step: 6,
      total: 6,
    });
  });

  it('hides guidance once onboarding is complete', () => {
    expect(getOnboardingGuidance(summary(null))).toBeNull();
  });
});
