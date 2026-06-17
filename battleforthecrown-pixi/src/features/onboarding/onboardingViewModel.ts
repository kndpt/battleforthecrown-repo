import type {
  OnboardingStep,
  OnboardingSummaryDto,
} from '@battleforthecrown/shared/onboarding';
import { getOnboardingNarrativeLoot } from '@battleforthecrown/shared/onboarding';
import { ONBOARDING_TRAIN_TROOPS_TARGET } from '@battleforthecrown/shared/onboarding';
import {
  getOnboardingStepGameAction,
  type GameActionId,
  type GameActionRoute,
} from '@/features/game-actions/gameActions';
import { formatResourceAmount } from '@/lib/resourceConfig';

export interface OnboardingLootPreviewItem {
  icon: string;
  value: string;
}

export interface OnboardingLootPreview {
  label: string;
  items: OnboardingLootPreviewItem[];
}

export interface OnboardingGuidance {
  title: string;
  description: string;
  ctaLabel: string;
  imageBadgeLabel?: string;
  gameActionId: GameActionId;
  imageSrc: string;
  lootPreview?: OnboardingLootPreview;
  modalLabel: string;
  pillLabel: string;
  route: GameActionRoute;
  progressLabel: string;
  secondaryLabel: string;
  step: number;
  total: number;
}

const STEP_INDEX: Record<OnboardingStep, number> = {
  UPGRADE_CASTLE_LEVEL_2: 1,
  BUILD_BARRACKS: 2,
  TRAIN_TROOPS: 3,
  UPGRADE_CASTLE_LEVEL_3: 4,
  BUILD_WATCHTOWER: 5,
  ATTACK_BARBARIAN: 6,
};

const TOTAL_STEPS = 6;

const ONBOARDING_NARRATIVE_LOOT_PREVIEW: OnboardingLootPreview = (() => {
  const loot = getOnboardingNarrativeLoot('T1');

  return {
    label: 'Butin à récupérer',
    items: [
      { icon: '/assets/resources/wood.png', value: formatResourceAmount(loot.wood) },
      { icon: '/assets/resources/stone.png', value: formatResourceAmount(loot.stone) },
      { icon: '/assets/resources/iron.png', value: formatResourceAmount(loot.iron) },
    ],
  };
})();

const STEP_GUIDANCE: Record<
  OnboardingStep,
  Omit<
    OnboardingGuidance,
    | 'gameActionId'
    | 'modalLabel'
    | 'pillLabel'
    | 'progressLabel'
    | 'secondaryLabel'
    | 'step'
    | 'total'
  >
> = {
  UPGRADE_CASTLE_LEVEL_2: {
    title: 'Renforcer le Château',
    description: 'Passe le Château au niveau 2 pour accélérer les prochaines constructions.',
    ctaLabel: 'Voir les bâtiments',
    imageSrc: '/assets/castle.png',
    route: '/game',
  },
  BUILD_BARRACKS: {
    title: 'Construire la Caserne',
    description: 'Ouvre le panneau des bâtiments et lance la Caserne pour débloquer tes premières troupes.',
    ctaLabel: 'Construire',
    imageSrc: '/assets/barracks.png',
    route: '/game',
  },
  TRAIN_TROOPS: {
    title: 'Former la milice',
    description: `Entraîne ${ONBOARDING_TRAIN_TROOPS_TARGET} miliciens paysans depuis l’écran Armée.`,
    ctaLabel: 'Former',
    imageBadgeLabel: `x${ONBOARDING_TRAIN_TROOPS_TARGET}`,
    imageSrc: '/assets/army/militia.png',
    route: '/game/army',
  },
  UPGRADE_CASTLE_LEVEL_3: {
    title: 'Renforcer le Château',
    description: 'Passe le Château au niveau 3 pour débloquer la Tour de guet.',
    ctaLabel: 'Voir les bâtiments',
    imageSrc: '/assets/castle.png',
    route: '/game',
  },
  BUILD_WATCHTOWER: {
    title: 'Élever la Tour de guet',
    description: 'Construis une Tour de guet pour révéler une cible barbare proche.',
    ctaLabel: 'Voir les bâtiments',
    imageSrc: '/assets/watchtower.png',
    lootPreview: ONBOARDING_NARRATIVE_LOOT_PREVIEW,
    route: '/game',
  },
  ATTACK_BARBARIAN: {
    // The narrative target is the only barbarian that completes this step
    // (cf. run 054). Other T1 villages remain real adversaries, so guidance
    // must point at the revealed campement, not "any T1".
    title: 'Attaquer le campement révélé',
    description: `Ouvre la carte, vise le campement barbare révélé par la Tour de guet et lance ton attaque avec tes ${ONBOARDING_TRAIN_TROOPS_TARGET} miliciens.`,
    ctaLabel: 'Ouvrir la carte',
    imageSrc: '/assets/world/entity/barbarian-village-tier1.png',
    lootPreview: ONBOARDING_NARRATIVE_LOOT_PREVIEW,
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
  const action = getOnboardingStepGameAction(summary.currentStep);
  const step = STEP_INDEX[summary.currentStep];
  const total = TOTAL_STEPS;
  return {
    ...guidance,
    modalLabel: `TUTORIEL · Étape ${step}/${total}`,
    pillLabel: `Tutoriel · ${step}/${total}`,
    progressLabel: `${step} / ${total}`,
    gameActionId: action.id,
    route: action.route,
    secondaryLabel: 'Plus tard',
    step,
    total,
  };
}
