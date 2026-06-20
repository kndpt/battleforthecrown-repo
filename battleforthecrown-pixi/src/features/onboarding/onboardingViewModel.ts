import type {
  OnboardingStep,
  OnboardingSummaryDto,
} from "@battleforthecrown/shared/onboarding";
import { ONBOARDING_COMPLETION_REWARD } from "@battleforthecrown/shared/onboarding";
import { ONBOARDING_TRAIN_TROOPS_TARGET } from "@battleforthecrown/shared/onboarding";
import { BUILDING_TYPES } from "@battleforthecrown/shared/village/buildings";
import {
  getOnboardingStepGameAction,
  type GameActionId,
  type GameActionRoute,
} from "@/features/game-actions/gameActions";
import { formatResourceAmount } from "@/lib/resourceConfig";

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
  /** Absent on the completion screen: the final CTA only acknowledges. */
  gameActionId?: GameActionId;
  imageSrc: string;
  lootPreview?: OnboardingLootPreview;
  modalLabel: string;
  pillLabel: string;
  /** Absent on the completion screen: the final CTA does not navigate. */
  route?: GameActionRoute;
  /** When set, the CTA opens this building's detail modal directly (village screen only). */
  targetBuildingType?: string;
  progressLabel: string;
  secondaryLabel?: string;
  step: number;
  total: number;
  /** Post-victory closing screen — primary CTA acknowledges and dismisses. */
  isCompletion?: boolean;
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

const ONBOARDING_REWARD_PREVIEW: OnboardingLootPreview = {
  label: "Butin à récupérer",
  items: [
    {
      icon: "/assets/resources/wood.png",
      value: formatResourceAmount(ONBOARDING_COMPLETION_REWARD.wood),
    },
    {
      icon: "/assets/resources/stone.png",
      value: formatResourceAmount(ONBOARDING_COMPLETION_REWARD.stone),
    },
    {
      icon: "/assets/resources/iron.png",
      value: formatResourceAmount(ONBOARDING_COMPLETION_REWARD.iron),
    },
  ],
};

const STEP_GUIDANCE: Record<
  OnboardingStep,
  Omit<
    OnboardingGuidance,
    | "gameActionId"
    | "modalLabel"
    | "pillLabel"
    | "progressLabel"
    | "secondaryLabel"
    | "step"
    | "total"
  >
> = {
  UPGRADE_CASTLE_LEVEL_2: {
    title: "Renforcer le Château",
    description:
      "Passe le Château au niveau 2 pour accélérer les prochaines constructions.",
    ctaLabel: "Améliorer",
    imageSrc: "/assets/castle.png",
    route: "/game",
    targetBuildingType: BUILDING_TYPES.CASTLE,
  },
  BUILD_BARRACKS: {
    title: "Construire la Caserne",
    description:
      "Ouvre la Caserne et lance sa construction pour débloquer tes premières troupes.",
    ctaLabel: "Ouvrir",
    imageSrc: "/assets/barracks.png",
    route: "/game",
    targetBuildingType: BUILDING_TYPES.BARRACKS,
  },
  TRAIN_TROOPS: {
    title: "Former la milice",
    description: `Entraîne ${ONBOARDING_TRAIN_TROOPS_TARGET} miliciens paysans depuis l’écran Armée.`,
    ctaLabel: "Former",
    imageBadgeLabel: `x${ONBOARDING_TRAIN_TROOPS_TARGET}`,
    imageSrc: "/assets/army/militia.png",
    route: "/game/army",
  },
  UPGRADE_CASTLE_LEVEL_3: {
    title: "Renforcer le Château",
    description: "Passe le Château au niveau 3 pour débloquer la Tour de guet.",
    ctaLabel: "Améliorer",
    imageSrc: "/assets/castle.png",
    route: "/game",
    targetBuildingType: BUILDING_TYPES.CASTLE,
  },
  BUILD_WATCHTOWER: {
    title: "Élever la Tour de guet",
    description:
      "Construis une Tour de guet pour révéler une cible barbare proche.",
    ctaLabel: "Construire",
    imageSrc: "/assets/watchtower.png",
    route: "/game",
    targetBuildingType: BUILDING_TYPES.WATCHTOWER,
  },
  ATTACK_BARBARIAN: {
    // The narrative target is the only barbarian that completes this step
    // (cf. run 054). Other T1 villages remain real adversaries, so guidance
    // must point at the revealed campement, not "any T1".
    title: "Attaquer le campement révélé",
    description: `Ouvre la carte, vise le campement barbare révélé par la Tour de guet et lance ton attaque avec tes ${ONBOARDING_TRAIN_TROOPS_TARGET} miliciens.`,
    ctaLabel: "Ouvrir la carte",
    imageSrc: "/assets/world/entity/barbarian-village-tier1.png",
    route: "/game/world",
  },
};

const COMPLETION_GUIDANCE: OnboardingGuidance = {
  title: "Campement barbare vaincu !",
  description:
    "Bravo, tu maîtrises les bases du royaume. Tes troupes rapportent le butin pillé — récupère-le et lance-toi à la conquête.",
  ctaLabel: "Récupérer le butin",
  imageSrc: "/assets/world/entity/barbarian-village-tier1.png",
  lootPreview: ONBOARDING_REWARD_PREVIEW,
  modalLabel: "TUTORIEL · Terminé",
  pillLabel: "Tutoriel · Terminé",
  progressLabel: `${TOTAL_STEPS} / ${TOTAL_STEPS}`,
  step: TOTAL_STEPS,
  total: TOTAL_STEPS,
  isCompletion: true,
};

export interface GetOnboardingGuidanceOptions {
  /** Player already dismissed the post-victory completion modal this session. */
  completionAcknowledged?: boolean;
}

export function getOnboardingGuidance(
  summary: OnboardingSummaryDto | undefined,
  options: GetOnboardingGuidanceOptions = {},
): OnboardingGuidance | null {
  if (!summary) {
    return null;
  }
  if (summary.status === "COMPLETED") {
    return options.completionAcknowledged ? null : COMPLETION_GUIDANCE;
  }
  if (!summary.currentStep) {
    return null;
  }
  const guidance = STEP_GUIDANCE[summary.currentStep];
  const action = getOnboardingStepGameAction(summary.currentStep);
  const step = STEP_INDEX[summary.currentStep];
  const total = TOTAL_STEPS;
  return {
    lootPreview: ONBOARDING_REWARD_PREVIEW,
    ...guidance,
    modalLabel: `TUTORIEL · Étape ${step}/${total}`,
    pillLabel: `Tutoriel · ${step}/${total}`,
    progressLabel: `${step} / ${total}`,
    gameActionId: action.id,
    route: action.route,
    secondaryLabel: "Plus tard",
    step,
    total,
  };
}
