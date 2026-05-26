import type {
  OnboardingStep,
  OnboardingSummaryDto,
} from '@battleforthecrown/shared/onboarding';

export interface OnboardingGuidance {
  title: string;
  description: string;
  ctaLabel: string;
  route: '/game' | '/game/army' | '/game/world';
  progressLabel: string;
}

const STEP_INDEX: Record<OnboardingStep, number> = {
  UPGRADE_CASTLE_LEVEL_2: 1,
  BUILD_BARRACKS: 2,
  TRAIN_TROOPS: 3,
  BUILD_WATCHTOWER: 4,
  ATTACK_BARBARIAN: 5,
};

const STEP_GUIDANCE: Record<
  OnboardingStep,
  Omit<OnboardingGuidance, 'progressLabel'>
> = {
  UPGRADE_CASTLE_LEVEL_2: {
    title: 'Renforcer le Château',
    description: 'Passe le Château au niveau 2 pour accélérer les prochaines constructions.',
    ctaLabel: 'Voir les bâtiments',
    route: '/game',
  },
  BUILD_BARRACKS: {
    title: 'Construire la Caserne',
    description: 'Ouvre le panneau des bâtiments et lance la Caserne pour débloquer tes premières troupes.',
    ctaLabel: 'Construire',
    route: '/game',
  },
  TRAIN_TROOPS: {
    title: 'Former des troupes',
    description: 'Entraîne une première unité depuis l’écran Armée.',
    ctaLabel: 'Former',
    route: '/game/army',
  },
  BUILD_WATCHTOWER: {
    title: 'Élever la Tour de guet',
    description: 'Construis une Tour de guet pour révéler une cible barbare proche.',
    ctaLabel: 'Voir les bâtiments',
    route: '/game',
  },
  ATTACK_BARBARIAN: {
    title: 'Attaquer un village barbare',
    description: 'Passe sur la carte, sélectionne un village barbare révélé et lance l’attaque.',
    ctaLabel: 'Ouvrir la carte',
    route: '/game/world',
  },
};

export function getOnboardingGuidance(
  summary: OnboardingSummaryDto | undefined,
): OnboardingGuidance | null {
  if (!summary || summary.status === 'COMPLETED' || !summary.currentStep) {
    return null;
  }
  const guidance = STEP_GUIDANCE[summary.currentStep];
  return {
    ...guidance,
    progressLabel: `${STEP_INDEX[summary.currentStep]} / 5`,
  };
}
