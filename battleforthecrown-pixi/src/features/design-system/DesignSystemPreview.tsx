import { useState, type CSSProperties, type ReactNode } from 'react';
import { BUILDING_DEFINITIONS, BUILDING_TYPES, type BuildingType } from '@battleforthecrown/shared/village/buildings';
import { RESOURCE_PRODUCTION_PER_HOUR } from '@battleforthecrown/shared/resources';
import { getOnboardingNarrativeLoot } from '@battleforthecrown/shared/onboarding';
import { Button } from '@/ui/buttons/Button';
import { VictoryModal } from '@/ui/modals/VictoryModal';
import { cn } from '@/lib/cn';
import {
  WorldsSelectionDesign,
} from './worlds/WorldsSelectionDesign';
import { WorldDetailDesign } from './worlds/WorldDetailDesign';
import { worldDetailLabels } from './worlds/worldDetailConfig';
import { defaultSeasonVariants, worldsSelectionLabels } from './worlds/worldsSelectionConfig';
import { worldPreviewModels } from './worlds/worldsPreviewFixtures';
import {
  buildWorldTabCounts,
  filterWorldsByTab,
  WORLD_SIGIL_GLYPHS,
  WORLD_THEME_TOKENS,
  type WorldsTab,
} from '@/features/worlds/worldsViewModel';
import {
  ArmyMovementList,
  ArmyDraggingOverlay,
  ArmyRecruitOverlay,
  ArmyViewDesign,
  AuthBannerScreen,
  AuthLandingScreen,
  AuthLoginScreen,
  AuthRegisterScreen,
  Avatar,
  AvatarProfileLine,
  AvatarStack,
  Badge,
  BaseModal,
  BftcButton,
  BorderStrokeTile,
  BuildingCard,
  BuildingIconTile,
  BuildingLevelRow,
  BuildQueueCard,
  ChatPanel,
  CinzelDisplaySample,
  ColorSwatchTile,
  CombatReportModal,
  CombatReportPhoneFrame,
  CostPill,
  CostRow,
  DailyQuestModal,
  DailyQuestPhoneFrame,
  DarkSegmentedStage,
  DigitTimer,
  EmptyState,
  FeaturedQuestCard,
  GameBottomSheetPanel,
  GameInput,
  GameModal,
  HeaderBar,
  IconButton,
  InboxTabs,
  CaptureWindowCard,
  KingdomActivitiesPanel,
  KingdomActivityHudBadges,
  LeaderboardHeader,
  LeaderboardRow,
  LevelChip,
  MailInboxItem,
  MultiVillageBottomSheet,
  MultiVillagePhoneFrame,
  NumberStepper,
  OnboardingFab,
  PipRating,
  PlayerProfileCard,
  PlayerProfileSheet,
  ProgressBar,
  QuestMissionCard,
  RadiusTile,
  RequirementChip,
  ResourceBuildingModal,
  ResourceBuildingPhoneFrame,
  ResourceIconTile,
  RoyalSeal,
  ScoutReportCard,
  SegmentedControl,
  SemanticColorRow,
  ShadowDepthTile,
  SurfaceTile,
  Timer,
  ToastPreview,
  TroopDetailModal,
  TroopDetailPhoneFrame,
  TROOP_DETAIL_FIELD_MAX,
  TROOP_DETAIL_LABELS_FR,
  TroopRow,
  TroopStepper,
  VillageMapPanel,
  VillageStyleModal,
  VillageStyleTrigger,
  computeArmyRecruitMax,
  type ArmyFilterOption,
  type ArmyRecruitPopupLabels,
  type ArmyRecruitQuickValue,
  type ArmyRecruitSheetProps,
  type ArmyRecruitStock,
  type ArmyTroop,
  type ArmyViewProps,
  type CaptureWindowCardProps,
  type ChatMessage,
  type CombatReportModalProps,
  type DailyQuestItem,
  type DailyQuestOyez,
  type ExpeditionActivityCardProps,
  type AuthHeraldShield,
  type IncomingAttackCardProps,
  type KingdomActivitiesPanelLabels,
  type KingdomActivityTab,
  type MultiVillageFilter,
  type MultiVillageItem,
  type PlayerProfileSheetTab,
  type PlayerProfileSheetProps,
  type ResourceBuildingKey,
  type ResourceBuildingLinkVariant,
  type ResourceBuildingModalProps,
  type VillageStyleId,
} from './components';

const chatMessages: ChatMessage[] = [
  {
    id: 'system-join',
    message: 'Dame_Aliénor a rejoint le canal',
    time: '09h12',
    type: 'system',
  },
  {
    avatarIcon: '/assets/icons/hand-silver.png',
    id: 'alienor',
    message: 'Sire Vous, des éclaireurs ont vu 240 unités à 238|617. Restez vigilant.',
    role: { label: 'DUC' },
    sender: 'Dame_Aliénor',
    time: '09h12',
    type: 'other',
  },
  {
    id: 'self',
    inlinePing: { icon: '/assets/position.png', label: '234|612' },
    message: "Bien reçu. J'ai 4.250 pwr, je tiens. Renfort possible ?",
    sender: 'Vous',
    time: '09h13',
    type: 'self',
  },
  {
    avatarIcon: '/assets/icons/hand-silver.png',
    id: 'leofric',
    message: "J'envoie 80 milice. ETA 12 min.",
    role: { label: 'CHEF', tone: 'stone' },
    sender: 'Baron_Léofric',
    time: '09h14',
    type: 'other',
  },
  {
    id: 'system-war',
    message: '⚔ Sire_Robert a déclaré la guerre — il y a 4 min',
    type: 'system',
  },
];

const authStatus = {
  batteryLabel: '100%',
  networkLabel: '5G',
  timeLabel: '9:41',
};

const authTitleLines = ['Battle for', 'the Crown'];

const authSecondaryActions = [
  { id: 'magic-link', label: 'Lien magique' },
  { id: 'visitor', label: 'Entrer en visiteur' },
];

const authShields: AuthHeraldShield[] = [
  { accent: '#f6d57b', field: ['#c0392b', '#7d1e15'], id: 'blood-gold', label: 'Or & Sang', symbol: '♕' },
  { accent: '#f6d57b', field: ['#3a72b8', '#1f4d85'], id: 'royal-blue', label: 'Azur Royal', symbol: '✦' },
  { accent: '#f6d57b', field: ['#5a8f3a', '#2f5b1c'], id: 'sinople', label: 'Sinople', symbol: '♘' },
  { accent: '#f6d57b', field: ['#2c2520', '#0c0a08'], id: 'sable-gold', label: 'Sable & Or', symbol: '♔' },
  { accent: '#f6d57b', field: ['#7a3a7d', '#43204a'], id: 'purple', label: 'Pourpre', symbol: '✠' },
  { accent: '#3c2619', field: ['#b5b8be', '#7c8088'], id: 'silver', label: 'Argent', symbol: '⚜' },
];

const armyTroops: ArmyTroop[] = [
  {
    attack: 6,
    category: 'Infanterie',
    cost: { iron: 10, stone: 30, wood: 50 },
    defense: 4,
    icon: '/assets/army/militia.png',
    id: 'militia',
    inVillage: 29,
    name: 'Milice de paysans',
    pop: 1,
    power: 3,
    short: 'Milice',
    supportingElsewhere: 0,
    trainingTime: '18s',
    unlocked: true,
  },
  {
    attack: 10,
    category: 'Infanterie',
    cost: { iron: 30, stone: 50, wood: 80 },
    defense: 12,
    fromAllies: 12,
    icon: '/assets/army/squire.png',
    id: 'squire',
    inVillage: 10,
    name: 'Écuyer',
    pop: 1,
    power: 8,
    short: 'Écuyer',
    supportingElsewhere: 0,
    trainingTime: '45s',
    unlocked: true,
  },
  {
    attack: 14,
    category: 'Tireur',
    cost: { iron: 60, stone: 20, wood: 100 },
    defense: 4,
    fromAllies: 0,
    icon: '/assets/army/archer.png',
    id: 'archer',
    inVillage: 1,
    name: 'Archer',
    pop: 1,
    power: 6,
    short: 'Archer',
    supportingElsewhere: 5,
    trainingTime: '1m',
    unlocked: true,
  },
  {
    attack: 24,
    category: 'Spécial',
    cost: { iron: 120, stone: 50, wood: 200 },
    defense: 8,
    fromAllies: 0,
    icon: '/assets/army/savage.png',
    id: 'savage',
    inVillage: 49,
    name: 'Mercenaire',
    pop: 2,
    power: 14,
    short: 'Mercen.',
    supportingElsewhere: 0,
    trainingTime: '2m 30s',
    unlocked: true,
  },
  {
    attack: 40,
    category: 'Élite',
    cost: { iron: 300, stone: 200, wood: 300 },
    defense: 30,
    fromAllies: 0,
    icon: '/assets/army/templar.png',
    id: 'templar',
    inVillage: 0,
    name: 'Templier',
    pop: 3,
    power: 32,
    requiredLevel: 4,
    requirementLabel: 'Caserne niv. 4 requis',
    short: 'Templier',
    supportingElsewhere: 0,
    trainingTime: '5m',
    unlocked: false,
  },
  {
    attack: 56,
    category: 'Cavalerie',
    cost: { iron: 400, stone: 150, wood: 400 },
    defense: 22,
    emoji: '🐎',
    id: 'cavalry',
    inVillage: 0,
    name: 'Cavalerie',
    pop: 4,
    power: 48,
    requiredLevel: 5,
    requirementLabel: 'Caserne niv. 5 requis',
    short: 'Cav.',
    trainingTime: '8m',
    unlocked: false,
  },
  {
    attack: 0,
    category: 'Siège',
    cost: { iron: 500, stone: 0, wood: 600 },
    defense: 0,
    emoji: '🪵',
    id: 'ram',
    inVillage: 0,
    name: 'Bélier',
    pop: 5,
    power: 80,
    requiredLevel: 8,
    requirementLabel: 'Caserne niv. 8 requis',
    short: 'Bélier',
    trainingTime: '12m',
    unlocked: false,
  },
  {
    attack: 0,
    category: 'Siège',
    cost: { iron: 700, stone: 300, wood: 800 },
    defense: 0,
    emoji: '🪨',
    id: 'catapult',
    inVillage: 0,
    name: 'Catapulte',
    pop: 8,
    power: 120,
    requiredLevel: 10,
    requirementLabel: 'Caserne niv. 10 requis',
    short: 'Catap.',
    trainingTime: '20m',
    unlocked: false,
  },
];

const armyFilters: ArmyFilterOption[] = [
  { count: 89, id: 'all', label: 'Toutes' },
  { count: 89, id: 'mine', label: 'Mien', tone: 'green' },
  { count: 20, id: 'allies', label: 'Alliés', tone: 'blue' },
  { count: 5, id: 'sent', label: 'Envoyés', tone: 'gold' },
];

const armyRecruitSheet: ArmyRecruitSheetProps = {
  activeDropLabel: 'Lâcher ici',
  dropIdleLabel: 'Glissez une troupe ici',
  iconPath: 'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6m-3 9 5-5m-4.5-1.5 5 5',
  queue: [
    { active: true, id: 'q-militia', progress: 0.7, quantity: 2, troopId: 'militia' },
    { id: 'q-squire', quantity: 1, troopId: 'squire' },
  ],
  summaryLabel: '3 en formation · 1m 20s restant',
  title: "Caserne · file d'attente",
};

const armyRecruitStock: ArmyRecruitStock = {
  iron: 4600,
  populationAvailable: 45,
  stone: 4400,
  wood: 4500,
};

const armyRecruitQuickValues: ArmyRecruitQuickValue[] = [
  { label: '10', value: 10 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '500', value: 500 },
  { label: 'MAX', tone: 'gold', value: computeArmyRecruitMax(armyTroops[1], armyRecruitStock) },
];

const armyRecruitLabels: ArmyRecruitPopupLabels = {
  cancel: 'Annuler',
  max: 'Max',
  population: 'Population',
  recruit: 'Entraîner',
  resourceIron: 'Fer',
  resourceStone: 'Pierre',
  resourceWood: 'Bois',
};

const armyBottomNav = {
  activeId: 'army',
  items: [
    { iconPath: 'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6m-3 9 5-5m-4.5-1.5 5 5', id: 'army', label: 'Armée' },
    { iconPath: 'm15 12-7-7-5 5 7 7M12.5 6.5 17 11l4.5-4.5L17 2M2 22l8-8', id: 'build', label: 'Village' },
    { badge: 3, iconPath: 'M22 6 12 13 2 6m20 0v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6m20 0a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2', id: 'messages', label: 'Messages' },
    { iconPath: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', id: 'world', label: 'Monde' },
  ],
};

const troopDetailFixture = {
  archetype: 'Infanterie · Frappe rapide',
  closeLabel: 'Fermer',
  cost: { crowns: 0, iron: 45, stone: 0, wood: 30 },
  name: 'Guerrier',
  populationCost: 1,
  portraitSrc: '/assets/army/savage.png',
  roleLabel: 'Offensif',
  stats: {
    attack: 20,
    carryCapacity: 35,
    defenseArcher: 5,
    defenseCavalry: 5,
    defenseInfantry: 5,
    speed: 20,
  },
  stock: { crowns: 142, iron: 1240, stone: 940, wood: 1820 },
  tagline: '« Frappe d’abord. Dort sous les armes. »',
  tierBadge: 'II',
  trainingTime: '1 m 35 s',
};

const combatReportLabels = {
  attackerTitle: 'Attaquant',
  defenderTitle: 'Défenseur',
  lossesTitle: 'Pertes sur le champ',
  reportPrefix: 'Rapport',
};

const combatReportWin: Omit<CombatReportModalProps, 'actions' | 'labels' | 'onAction'> = {
  attacker: { coord: '234|612', name: 'Vous', place: 'Castelnef' },
  attackerUnits: [
    { icon: '/assets/army/squire.png', lost: 18, name: 'Squires', sent: 120 },
    { icon: '/assets/army/archer.png', lost: 4, name: 'Archers', sent: 60 },
  ],
  battleId: '#7421-A',
  banner: 'VICTOIRE',
  defender: { coord: '238|617', name: 'Sire_Robert', place: "Roc-d'Acier" },
  defenderUnits: [
    { icon: '/assets/army/militia.png', lost: 80, name: 'Miliciens', sent: 80 },
    { icon: '/assets/army/templar.png', lost: 5, name: 'Templiers', sent: 5 },
  ],
  highlight: {
    chips: [
      { icon: '/assets/resources/wood.png', remainingValue: '8.760', value: '1.240' },
      { icon: '/assets/resources/stone.png', remainingValue: '4.180', value: '820' },
      { icon: '/assets/resources/iron.png', remainingValue: '2.160', value: '340' },
      { icon: '/assets/casual-icons/coin.png', remainingValue: '6.800', value: '1.200' },
    ],
    kind: 'loot',
    title: 'Butin ramené',
  },
  isPlayerAttacker: true,
  motto: '« Les corbeaux suivent vos étendards. »',
  outcome: 'win',
  roleLabel: 'Attaquant',
  type: 'Pillage offensif',
  when: 'Il y a 12 min',
};

const combatReportLose: Omit<CombatReportModalProps, 'actions' | 'labels' | 'onAction'> = {
  attacker: { coord: '198|580', name: 'Dame_Aliénor', place: 'Tours-Hautes' },
  attackerUnits: [
    { icon: '/assets/army/savage.png', lost: 22, name: 'Sauvages', sent: 180 },
    { icon: '/assets/army/templar.png', lost: 6, name: 'Templiers', sent: 40 },
  ],
  battleId: '#7424-D',
  banner: 'DÉFAITE',
  defender: { coord: '234|612', name: 'Vous', place: 'Castelnef' },
  defenderUnits: [
    { icon: '/assets/army/militia.png', lost: 160, name: 'Miliciens', sent: 160 },
    { icon: '/assets/army/squire.png', lost: 60, name: 'Squires', sent: 80 },
  ],
  highlight: {
    chips: [
      { icon: '/assets/resources/wood.png', remainingValue: '7.880', value: '1.120' },
      { icon: '/assets/resources/stone.png', remainingValue: '3.360', value: '640' },
      { icon: '/assets/resources/iron.png', remainingValue: '1.580', value: '420' },
      { icon: '/assets/casual-icons/coin.png', remainingValue: '2.900', value: '1.300' },
    ],
    kind: 'lootLost',
    title: 'Butin perdu',
  },
  isPlayerAttacker: false,
  motto: '« Les murs ont tenu — vos hommes, non. »',
  outcome: 'lose',
  roleLabel: 'Défenseur',
  type: 'Défense du village',
  when: 'Il y a 1h 04',
};

const kingdomActivityLabels: KingdomActivitiesPanelLabels = {
  captureEmptyQuote: '« Envoyez un Noble sur un village barbare pour ouvrir une fenêtre de capture. »',
  captureEmptyTitle: 'Aucune capture en cours',
  captureErrorLabel: 'Impossible de charger les captures.',
  captureLoadingLabel: 'Chargement des captures...',
  captureRetryLabel: 'Réessayer',
  capturesTab: 'Captures',
  closeLabel: 'Fermer',
  expeditionEmptyQuote: '« Quand vos troupes marcheront, le héraut consignera leur route ici. »',
  expeditionEmptyTitle: 'Aucune expédition active',
  expeditionErrorLabel: 'Impossible de charger les expéditions.',
  expeditionLoadingLabel: 'Chargement des expéditions...',
  expeditionRetryLabel: 'Réessayer',
  expeditionsTab: 'Expéditions',
  headerEyebrow: 'Panneau',
  headerTitle: 'Activités du royaume',
  threatEmptyQuote: '« Aucune armée ennemie ne marche vers vos terres. »',
  threatEmptyTitle: 'Aucune attaque entrante',
  threatErrorLabel: 'Impossible de charger les menaces.',
  threatLoadingLabel: 'Analyse des menaces...',
  threatRetryLabel: 'Réessayer',
  threatsTab: 'Menaces',
};

const captureWindows: CaptureWindowCardProps[] = [
  {
    coordinates: '259|242',
    endTime: '21:18',
    endTimeLabel: 'Fin à',
    nobleEyebrow: 'Seigneur immobilisé',
    nobleName: 'Seigneur Aldric',
    originLabelPrefix: 'Depuis',
    originName: 'Royaume du Nord',
    progress: 38,
    state: 'open',
    statusLabel: 'Capture en cours',
    targetName: 'Village b...',
    tier: 'T3',
    tierSubLabel: 'Tier',
    timeRemaining: '3h 42m',
  },
  {
    coordinates: '241|261',
    endTime: '23:50',
    endTimeLabel: 'Fin à',
    nobleEyebrow: 'Seigneur immobilisé',
    nobleName: 'Dame Yseult',
    originLabelPrefix: 'Depuis',
    originName: 'Royaume du Nord',
    progress: 19,
    state: 'open',
    statusLabel: 'Capture en cours',
    targetName: 'Camp de ...',
    tier: 'T4',
    tierSubLabel: 'Tier',
    timeRemaining: '6h 14m',
  },
  {
    coordinates: '273|228',
    endTime: '17:47',
    endTimeLabel: 'Fin à',
    nobleEyebrow: 'Seigneur immobilisé',
    nobleName: 'Baron Halrid',
    originLabelPrefix: 'Depuis',
    originName: 'Avant-poste de Br...',
    progress: 96,
    state: 'soon',
    statusLabel: 'Bientôt terminée',
    targetName: 'Village b...',
    tier: 'T2',
    tierSubLabel: 'Tier',
    timeRemaining: '0h 11m',
  },
];

const allCaptureStates: CaptureWindowCardProps[] = [
  ...captureWindows,
  {
    coordinates: '266|231',
    endTime: '16:02',
    endTimeLabel: 'Capturé à',
    nobleEyebrow: 'Seigneur immobilisé',
    nobleName: 'Seigneur Eldwen',
    originLabelPrefix: 'Depuis',
    originName: 'Royaume du Nord',
    progress: 100,
    state: 'completed',
    statusLabel: 'Capture réussie',
    targetName: 'Village barbare',
    tier: 'T1',
    tierSubLabel: 'Tier',
    timeRemaining: '— —',
  },
  {
    coordinates: '288|211',
    endTime: '15:33',
    endTimeLabel: 'Interrompue à',
    nobleEyebrow: 'Seigneur immobilisé',
    nobleName: 'Seigneur Garric',
    originLabelPrefix: 'Depuis',
    originName: 'Forteresse d’Aubépine',
    progress: 64,
    state: 'interrupted',
    statusLabel: 'Capture interrompue',
    targetName: 'Camp fortifié',
    tier: 'T5',
    tierSubLabel: 'Tier',
    timeRemaining: '— —',
  },
];

const expeditionActivities: ExpeditionActivityCardProps[] = [
  {
    icon: '/assets/hand-red.png',
    kind: 'attack',
    movementId: 'raid-village-barbare-t2',
    phase: 'en_route',
    progress: 42,
    statusLabel: 'ATTAQUE',
    subtitle: (
      <>
        <b>231|198</b> · Arrivée dans 12 min
      </>
    ),
    time: '12m',
    title: 'Village barbare T2',
  },
  {
    icon: '/assets/hand-silver.png',
    kind: 'reinforce',
    movementId: 'renfort-royaume-sud',
    phase: 'returning',
    progress: 68,
    statusLabel: 'RENFORT',
    subtitle: (
      <>
        <b>208|245</b> · Retour dans 1h 04m
      </>
    ),
    time: '1h 04m',
    title: 'Royaume du Sud',
  },
  {
    icon: '/assets/lupa.png',
    kind: 'scout',
    movementId: 'scout-camp-pillards',
    phase: 'resolved',
    progress: 87,
    statusLabel: 'SCOUT',
    subtitle: (
      <>
        <b>259|242</b> · Rapport dans 8 min
      </>
    ),
    time: '8m',
    title: 'Camp de pillards',
  },
  {
    icon: '/assets/casual-icons/crown.png',
    kind: 'conquest',
    movementId: 'conquete-camp-t4',
    phase: 'en_route',
    progress: 24,
    statusLabel: 'CONQUÊTE',
    subtitle: (
      <>
        Noble + escorte · <b>241|261</b> · ouverture capture
      </>
    ),
    time: '46m',
    title: 'Camp de conquête T4',
  },
];

const incomingThreats: IncomingAttackCardProps[] = [
  {
    icon: '/assets/hand-red.png',
    movementId: 'menace-village-principal',
    progress: 72,
    statusLabel: 'Imminente',
    subtitle: (
      <>
        Cible <b>247|231</b> · Arrivée dans 4 min
      </>
    ),
    time: '4m',
    title: 'ATTAQUE ENTRANTE',
  },
  {
    icon: '/assets/hand-red.png',
    movementId: 'menace-village-est',
    progress: 18,
    statusLabel: 'Imminente',
    subtitle: (
      <>
        Cible <b>251|228</b> · Arrivée dans 27 min
      </>
    ),
    time: '27m',
    title: 'ATTAQUE ENTRANTE',
  },
];

const resourceBuildingStock = { crowns: 142, iron: 1500, stone: 3200, wood: 8500 };

const resourceStoragePreview: Record<ResourceBuildingKey, Record<number, number>> = {
  quarter: { 1: 80, 2: 140, 3: 200, 4: 280, 5: 380 },
  iron: { 1: 1000, 2: 2500, 3: 5000, 4: 8000, 5: 12000 },
  stone: { 1: 1500, 2: 3500, 3: 8000, 4: 12000, 5: 18000 },
  wood: { 1: 1500, 2: 3500, 3: 8000, 4: 12000, 5: 18000 },
};

function getResourceBuildingLevelStats(key: ResourceBuildingKey): ResourceBuildingModalProps['levelStats'] {
  if (key === 'quarter') {
    return Object.fromEntries(
      Object.entries(resourceStoragePreview.quarter).map(([level, value]) => [
        Number(level),
        { production: value, storage: value },
      ]),
    );
  }

  return Object.fromEntries(
    Object.entries(RESOURCE_PRODUCTION_PER_HOUR).slice(0, 5).map(([level, production]) => [
      Number(level),
      {
        production,
        storage: resourceStoragePreview[key][Number(level)] ?? 0,
      },
    ]),
  );
}

function formatPreviewDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function getSharedUpgradePreview(buildingType: BuildingType, level: number) {
  const nextLevel = Math.min(level + 1, 5);
  const sharedLevel = BUILDING_DEFINITIONS[buildingType]?.levels[nextLevel];

  return {
    cost: {
      crowns: 0,
      iron: sharedLevel?.iron ?? 0,
      stone: sharedLevel?.stone ?? 0,
      wood: sharedLevel?.wood ?? 0,
    },
    time: formatPreviewDuration(sharedLevel?.timeSeconds ?? 0),
  };
}

type ResourceBuildingPreviewFixture = Omit<
  ResourceBuildingModalProps,
  'cost' | 'level' | 'levelStats' | 'linkVariant' | 'onAction' | 'onClose' | 'onUpgrade' | 'upgradeTime'
> & {
  buildingType: BuildingType;
};

const resourceBuildingFixtures: Record<ResourceBuildingKey, ResourceBuildingPreviewFixture> = {
  wood: {
    accent: { border: '#2d6b16', dark: '#3a8a1f', haloTint: 'rgba(126,199,78,.35)', light: '#7ec74e' },
    buildingIcon: '/assets/wood.png',
    buildingType: BUILDING_TYPES.WOOD,
    eyebrow: 'Production · Bois',
    name: 'Camp de bûcherons',
    requirementLabel: 'Château niv. 3',
    resourceIcon: '/assets/resources/wood.png',
    resourceLabel: 'bois',
    stock: resourceBuildingStock,
    stockNow: 6420,
    tagline: '« Que les forêts bruissent sous nos haches. »',
  },
  stone: {
    accent: { border: '#5d6d6e', dark: '#7f8c8d', haloTint: 'rgba(176,184,192,.35)', light: '#b0b8c0' },
    buildingIcon: '/assets/stone.png',
    buildingType: BUILDING_TYPES.STONE,
    eyebrow: 'Production · Pierre',
    name: 'Carrière',
    requirementLabel: 'Château niv. 3',
    resourceIcon: '/assets/resources/stone.png',
    resourceLabel: 'pierre',
    stock: resourceBuildingStock,
    stockNow: 3200,
    tagline: '« Pierre par pierre, le royaume tient debout. »',
  },
  iron: {
    accent: { border: '#1f5288', dark: '#2e75b6', haloTint: 'rgba(91,155,213,.38)', light: '#5b9bd5' },
    buildingIcon: '/assets/iron.png',
    buildingType: BUILDING_TYPES.IRON,
    eyebrow: 'Production · Fer',
    name: 'Mine de fer',
    requirementLabel: 'Château niv. 4',
    resourceIcon: '/assets/resources/iron.png',
    resourceLabel: 'fer',
    stock: resourceBuildingStock,
    stockNow: 1500,
    tagline: '« De la roche au fer, du fer à la lame. »',
  },
  quarter: {
    accent: { border: '#9e7b0d', dark: '#d4a017', haloTint: 'rgba(241,196,15,.4)', light: '#f1c40f' },
    buildingIcon: '/assets/quarter.png',
    buildingType: BUILDING_TYPES.QUARTER,
    eyebrow: 'Production · Population',
    isPopulation: true,
    name: 'Quartier',
    requirementLabel: 'Château niv. 3',
    resourceIcon: '/assets/resources/population.png',
    resourceLabel: 'villageois',
    stock: resourceBuildingStock,
    stockNow: 120,
    tagline: '« Sans pain, point de soldats. »',
  },
};

const dailyQuestOyez: DailyQuestOyez = {
  effect: 'Construction légèrement favorisée',
  eyebrow: 'Oyez · en cours',
  icon: '/assets/casual-icons/card-gold.png',
  title: 'Jour des bâtisseurs',
};

const dailyQuestItems: DailyQuestItem[] = [
  {
    have: 1500,
    icon: '/assets/resources/wood.png',
    id: 'eco-wood',
    loopLabel: 'Économie',
    name: 'Récolter 1.500 bois',
    need: 1500,
    rewards: [{ icon: '/assets/casual-icons/coin.png', value: '200' }],
    state: 'claimable' as const,
  },
  {
    have: 8,
    icon: '/assets/army/squire.png',
    id: 'mil-squires',
    loopLabel: 'Militaire',
    name: 'Recruter 12 squires',
    need: 12,
    rewards: [{ icon: '/assets/resources/iron.png', value: '80' }],
    state: 'progress' as const,
  },
  {
    have: 0,
    icon: '/assets/lupa.png',
    id: 'expl-scout',
    loopLabel: 'Exploration',
    name: 'Espionner 1 voisin',
    need: 1,
    rewards: [{ icon: '/assets/resources/iron.png', value: '120' }],
    state: 'progress' as const,
  },
  {
    have: 0,
    icon: '/assets/hand-silver.png',
    id: 'def-reinforce',
    loopLabel: 'Défense',
    name: 'Renforcer un village allié',
    need: 1,
    rewards: [{ icon: '/assets/resources/stone.png', value: '150' }],
    state: 'progress' as const,
  },
  {
    have: 0,
    icon: '/assets/hand-red.png',
    id: 'conq-battle',
    loopLabel: 'Conquête',
    name: 'Gagner 1 bataille',
    need: 1,
    rewards: [
      { icon: '/assets/resources/wood.png', value: '500' },
      { icon: '/assets/resources/stone.png', value: '500' },
    ],
    state: 'progress' as const,
  },
  {
    icon: '/assets/lock.png',
    id: 'eco-producer',
    lockedHint: 'Débloque quand un producteur atteint le niv. 4.',
    loopLabel: 'Économie',
    name: 'Améliorer un producteur au niv. 5',
    rewards: [{ icon: '/assets/casual-icons/coin.png', value: '250' }],
    state: 'locked' as const,
  },
];

const playerProfileSheetFixture = {
  icons: {
    armyPower: '/assets/power.png',
    castle: '/assets/castle.png',
    crown: '/assets/casual-icons/crown.png',
    defense: '/assets/hand-silver.png',
    position: '/assets/position.png',
    raids: '/assets/hand-red.png',
  },
  labels: {
    close: 'Fermer',
    history: 'Historique',
    logout: 'Quitter la session',
    phase: 'Phase verrouillée',
    tabs: {
      profile: 'Profil',
      settings: 'Réglages',
      villages: 'Villages',
    },
    villageHint: 'Encore trop de place libre ? Le monde ne va pas se conquérir tout seul.',
    world: 'Monde',
  },
  player: {
    initials: 'SK',
    level: 12,
    name: 'Sire Kelvin',
    online: true,
    tribe: { cap: 30, members: 14, name: 'Les Lames du Nord', role: 'Duc', tag: 'BFC' },
  },
  settings: [
    { icon: '🔔', id: 'notifications', label: 'Notifications', value: 'Activées' },
    { icon: '🔊', id: 'sound', label: 'Son et musique', value: 'Activés' },
    { icon: '🌐', id: 'language', label: 'Langue', value: 'Français' },
    { icon: '❓', id: 'help', label: 'Aide et support' },
    { icon: '📋', id: 'terms', label: 'Conditions' },
  ],
  stats: {
    crowns: '28 410',
    defenses: 11,
    points: '62.480',
    power: '4 250',
    raidsWon: 28,
    rank: 47,
    rankTotal: 312,
    villages: 3,
  },
  villages: [
    { capital: true, coords: '(7,12)', id: 'v1', level: 5, name: 'Kelvinor', power: '2 480', style: { id: 'FORTRESS', label: 'Forteresse' } },
    { coords: '(11,4)', id: 'v2', level: 3, name: "Vald'Or", power: '980', style: { id: 'ECONOMIC', label: 'Économique' } },
    { coords: '(2,18)', id: 'v3', level: 3, name: 'Pierre-Noire', power: '790', style: { id: 'RAIDERS', label: 'Raiders' } },
  ],
  world: {
    day: 18,
    name: 'Avalon-3',
    phase: 'Verrouillé',
    sigilGlyph: WORLD_SIGIL_GLYPHS.tower,
    theme: WORLD_THEME_TOKENS.azure,
    total: 60,
  },
} satisfies Pick<PlayerProfileSheetProps, 'icons' | 'labels' | 'player' | 'settings' | 'stats' | 'villages' | 'world'>;

const multiVillageLabels = {
  activeFilter: 'Actifs',
  alertsFilter: 'Alertes',
  allFilter: 'Tous',
  buildActivity: 'Chantier',
  close: 'Fermer',
  empty: 'Aucun domaine ne correspond à ce filtre.',
  eyebrow: 'Domaines du royaume',
  levelPrefix: 'Niv.',
  lordActivity: 'Seigneur',
  noActivity: 'Aucune activité en cours',
  sort: 'Trier',
  title: 'Mes villages',
  troopsActivity: 'Formation',
};

const multiVillageFixture: MultiVillageItem[] = [
  {
    active: true,
    alert: { eta: '2:15', kind: 'attack', msg: 'Attaque entrante' },
    builds: [
      { eta: '1:23', name: 'Camp pierre', progress: 0.62, target: 'stone', to: 4 },
      { eta: '12:40', name: 'Caserne', progress: 0.04, target: 'barracks', to: 3 },
    ],
    badge: 'Offensif',
    capitale: true,
    coords: '(7,12)',
    id: 'v1',
    label: 'OFFENSIVE',
    level: 5,
    lords: [],
    name: 'Kelvinor',
    power: '2 480',
    resources: {
      iron: { max: 6000, n: 5550 },
      pop: { max: 300, n: 174 },
      stone: { max: 8000, n: 4300 },
      wood: { max: 8000, n: 4500 },
    },
    strategy: 'FORTRESS',
    troops: [
      { count: 25, eta: '0:45', label: 'Milicien', progress: 0.45, unit: 'militia' },
      { count: 10, eta: '3:20', label: 'Archer', progress: 0.02, unit: 'archer' },
    ],
  },
  {
    alert: null,
    badge: 'Économique',
    builds: [{ eta: '8:30', name: 'Bûcherons', progress: 0.18, target: 'wood', to: 4 }],
    coords: '(11,4)',
    id: 'v2',
    label: 'ECONOMIC',
    level: 3,
    lords: [{ eta: '6:12', name: 'Sieur Aldred', progress: 0.55 }],
    name: "Vald'Or",
    power: '980',
    resources: {
      iron: { max: 3000, n: 980 },
      pop: { max: 180, n: 92 },
      stone: { max: 4000, n: 1850 },
      wood: { max: 4000, n: 2200 },
    },
    strategy: 'ECONOMIC',
    troops: [],
  },
  {
    alert: { eta: '0:50', kind: 'attack', msg: 'Attaque entrante' },
    badge: 'Défensif',
    builds: [],
    coords: '(2,18)',
    id: 'v3',
    label: 'DEFENSIVE',
    level: 3,
    lords: [],
    name: 'Pierre-Noire',
    power: '790',
    resources: {
      iron: { max: 3000, n: 1450 },
      pop: { max: 180, n: 168 },
      stone: { max: 4000, n: 2700 },
      wood: { max: 4000, n: 1100 },
    },
    strategy: 'RAIDERS',
    troops: [{ count: 6, eta: '4:50', label: 'Écuyer', progress: 0.72, unit: 'squire' }],
  },
];

const onboardingNarrativeLoot = getOnboardingNarrativeLoot('T1');

const onboardingPreviewStep = {
  body: 'Construis une Tour de guet pour révéler une cible barbare proche.',
  closeLabel: 'Fermer',
  ctaLabel: 'Voir les bâtiments',
  imageAlt: 'Élever la Tour de guet',
  imageSrc: '/assets/watchtower.png',
  lootPreview: {
    label: 'Butin à récupérer',
    items: [
      { icon: '/assets/resources/wood.png', value: String(onboardingNarrativeLoot.wood) },
      { icon: '/assets/resources/stone.png', value: String(onboardingNarrativeLoot.stone) },
      { icon: '/assets/resources/iron.png', value: String(onboardingNarrativeLoot.iron) },
    ],
  },
  modalLabel: 'TUTORIEL · Étape 5/6',
  pillLabel: 'Tutoriel · 5/6',
  secondaryLabel: 'Plus tard',
  step: 5,
  title: 'Élever la Tour de guet',
  total: 6,
};

function OnboardingPreviewPhoneFrame({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="rounded-full border border-[rgba(93,74,50,.35)] px-2.5 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.24em] text-[#5d4a32]">
        {label}
      </span>
      <div className="relative h-[720px] w-[360px] overflow-hidden rounded-[18px] border-[3px] border-[#3c2619] bg-[#5b8f3a] shadow-[0_10px_28px_rgba(60,38,25,.35)]">
        {children}
      </div>
    </div>
  );
}

function OnboardingPreviewScene({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden bg-[#5b8f3a] font-game text-[#fef9f0]"
      style={{
        '--bftc-bottom-nav-gap': '18px',
        '--bftc-bottom-nav-height': '58px',
      } as CSSProperties}
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b-2 border-[#3c2619] bg-[linear-gradient(to_bottom,#3c2619,#27170f)] px-3 text-[11px] font-black">
        <span>DK</span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-[#f1c40f] px-2 py-0.5 text-[#3c2619]">145</span>
          <span>100</span>
        </div>
      </div>
      <div className="grid h-[34px] shrink-0 grid-cols-4 border-b-2 border-[#3c2619] bg-[linear-gradient(to_bottom,#6b4b2b,#3c2619)] text-center text-[10px] font-bold">
        {['1k', '1k', '1k', '233'].map((value, index) => (
          <div className="flex items-center justify-center border-r border-[rgba(254,249,240,.18)] last:border-r-0" key={`${value}-${index}`}>
            {value}
          </div>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden bg-[#5b8f3a]">
        <div className="absolute left-1/2 top-7 w-[290px] -translate-x-1/2 rounded-xl border-2 border-[#3c2619] bg-[rgba(254,249,240,.86)] p-3 text-center text-[#3d2f1f] shadow-[0_6px_16px_rgba(0,0,0,.22)]">
          <div className="text-[9px] font-extrabold uppercase tracking-[.24em] text-[#92400e]">Village</div>
          <div className="mt-0.5 text-base font-black">ROYAUME DE DUPONT.KELVIN</div>
          <div className="mt-1 text-[11px] font-bold text-[#6d5838]">Capitale · (7,12)</div>
        </div>
        <div className="absolute inset-x-0 bottom-20 grid grid-cols-3 gap-3 px-8">
          {[
            { icon: '/assets/castle.png', label: 'Château' },
            { icon: '/assets/barracks.png', label: 'Caserne' },
            { icon: '/assets/watchtower.png', label: 'Tour' },
          ].map((building) => (
            <div className="flex flex-col items-center gap-1 rounded-xl border-2 border-[#3c2619] bg-[rgba(254,249,240,.84)] p-2 shadow-[0_4px_10px_rgba(0,0,0,.24)]" key={building.label}>
              <img alt="" className="h-12 w-12 object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,.35)]" src={building.icon} />
              <span className="text-[9px] font-bold text-[#3d2f1f]">{building.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid h-[58px] shrink-0 grid-cols-4 border-t-2 border-[#3c2619] bg-[linear-gradient(to_bottom,#6b4b2b,#3c2619)] text-center text-[9px] font-bold uppercase tracking-[.08em]">
        {['Armée', 'Bâtiments', 'Messages', 'Monde'].map((item) => (
          <div className="flex items-center justify-center border-r border-[rgba(254,249,240,.12)] last:border-r-0" key={item}>
            {item}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

export function DesignSystemPreview() {
  const [inputValue, setInputValue] = useState('');
  const [lordName, setLordName] = useState('');
  const [authLoginLord, setAuthLoginLord] = useState('SireKelvin');
  const [authLoginPassword, setAuthLoginPassword] = useState('motdepasse');
  const [authLoginPasswordVisible, setAuthLoginPasswordVisible] = useState(false);
  const [authRemember, setAuthRemember] = useState(true);
  const [authRegisterLord, setAuthRegisterLord] = useState('');
  const [authRegisterEmail, setAuthRegisterEmail] = useState('');
  const [authRegisterPassword, setAuthRegisterPassword] = useState('forge2025');
  const [authRegisterPasswordVisible, setAuthRegisterPasswordVisible] = useState(false);
  const [authTermsAccepted, setAuthTermsAccepted] = useState(true);
  const [authBannerLord, setAuthBannerLord] = useState('Sire Kelvin');
  const [authSelectedShield, setAuthSelectedShield] = useState('royal-blue');
  const [armyActiveFilter, setArmyActiveFilter] = useState('all');
  const [armyRecruitQuantity, setArmyRecruitQuantity] = useState(25);
  const [kingdomName, setKingdomName] = useState('Le Grand Nord');
  const [passwordValue, setPasswordValue] = useState('......');
  const [messages, setMessages] = useState(chatMessages);
  const [segmentAttack, setSegmentAttack] = useState('attack');
  const [segmentList, setSegmentList] = useState('list');
  const [segmentBuilding, setSegmentBuilding] = useState('barracks');
  const [segmentIcon, setSegmentIcon] = useState('offense');
  const [segmentReports, setSegmentReports] = useState('mine');
  const [segmentRange, setSegmentRange] = useState('1h');
  const [segmentWorld, setSegmentWorld] = useState('world');
  const [worldsPreviewTab, setWorldsPreviewTab] = useState<WorldsTab>('open');
  const [multiVillageFilter, setMultiVillageFilter] = useState<MultiVillageFilter>('all');
  const [inboxTab, setInboxTab] = useState('all');
  const [kingdomActivityTab, setKingdomActivityTab] = useState<KingdomActivityTab>('captures');
  const [stepperValue, setStepperValue] = useState(125);
  const [troopQuantity, setTroopQuantity] = useState(24);
  const [resourceBuildingKey, setResourceBuildingKey] = useState<ResourceBuildingKey>('wood');
  const [resourceBuildingLevel, setResourceBuildingLevel] = useState(3);
  const [resourceBuildingLink, setResourceBuildingLink] = useState<ResourceBuildingLinkVariant>('chevron');
  const [resourceBuildingConstructing, setResourceBuildingConstructing] = useState(false);
  const [resourceBuildingAction, setResourceBuildingAction] = useState('Aucune action');
  const [villageStyleOpen, setVillageStyleOpen] = useState(true);
  const [villageStyle, setVillageStyle] = useState<VillageStyleId>('RAIDERS');
  const [victoryModalOpen, setVictoryModalOpen] = useState(false);
  const [combatReportAction, setCombatReportAction] = useState('Aucune action');
  const [playerProfileSheetTab, setPlayerProfileSheetTab] = useState<PlayerProfileSheetTab>('profile');
  const [onboardingPreviewOpen, setOnboardingPreviewOpen] = useState(true);
  const [onboardingPreviewAction, setOnboardingPreviewAction] = useState('Aucune action');
  const resourceBuildingFixture = resourceBuildingFixtures[resourceBuildingKey];
  const { buildingType: resourceBuildingType, ...resourceBuildingModalFixture } = resourceBuildingFixture;
  const resourceBuildingUpgrade = getSharedUpgradePreview(resourceBuildingType, resourceBuildingLevel);
  const worldsPreviewCounts = buildWorldTabCounts(worldPreviewModels);
  const filteredWorldPreviewModels = filterWorldsByTab(worldPreviewModels, worldsPreviewTab);
  const armyRecruitTroop = armyTroops[1];
  const armyRecruitMax = computeArmyRecruitMax(armyRecruitTroop, armyRecruitStock);
  const armyPreviewBase: ArmyViewProps = {
    activeFilterId: armyActiveFilter,
    bottomNav: armyBottomNav,
    filters: armyFilters,
    hud: {
      crowns: '263 481',
      crownsIcon: '/assets/crown.png',
      level: 12,
      playerInitials: 'SK',
      power: '4 642',
      powerIcon: '/assets/power.png',
      resources: [
        { icon: '/assets/resources/wood.png', id: 'wood', label: 'Bois', sub: '+120/h', value: '4.5K' },
        { icon: '/assets/resources/stone.png', id: 'stone', label: 'Pierre', sub: '+80/h', value: '4.4K' },
        { icon: '/assets/resources/iron.png', id: 'iron', label: 'Fer', sub: '+50/h', value: '4.6K' },
        { icon: '/assets/resources/population.png', id: 'population', label: 'Population', sub: 'villageois', value: '175/220' },
      ],
    },
    onFilterChange: setArmyActiveFilter,
    recruitSheet: armyRecruitSheet,
    screenLabel: 'Vue Armée',
    troops: armyTroops,
    village: {
      name: 'Cursed Village',
      nextLabel: 'Village suivant',
      previousLabel: 'Village précédent',
      subtitle: 'Capitale',
      titleLabel: 'Village',
    },
  };

  return (
    <main className="min-h-full overflow-y-auto bg-[#f5e6d3] p-[18px] text-[#1f2937]">
      <div className="mx-auto flex w-full max-w-[700px] flex-col items-stretch gap-6">
        <header className="space-y-2">
          <p className="font-game text-sm font-semibold uppercase tracking-[0.3em] text-[#5d4a32]">
            Battle for the Crown
          </p>
          <h1 className="font-game text-4xl font-bold leading-tight text-[#1f2937]">Design system React</h1>
          <p className="max-w-2xl font-game text-sm leading-6 text-[#4b5563]">
            Reset du sas React. Les prochains composants doivent reproduire le prototype HTML source avant toute extraction.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Kingdom palette</h2>
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            <ColorSwatchTile color="#fef7ee" label="50" value="#fef7ee" />
            <ColorSwatchTile color="#fdead4" label="100" value="#fdead4" />
            <ColorSwatchTile color="#fbd6a8" label="200" value="#fbd6a8" />
            <ColorSwatchTile color="#f9b97c" label="300" value="#f9b97c" />
            <ColorSwatchTile color="#f59e0b" label="400" value="#f59e0b" />
            <ColorSwatchTile color="#d97706" label="500" value="#d97706" />
            <ColorSwatchTile color="#b45309" label="600" value="#b45309" />
            <ColorSwatchTile color="#92400e" label="700" value="#92400e" />
            <ColorSwatchTile color="#78350f" label="800" value="#78350f" />
            <ColorSwatchTile color="#451a03" label="900" value="#451a03" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Parchment palette</h2>
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            <ColorSwatchTile color="#fef9f0" label="50" value="#fef9f0" />
            <ColorSwatchTile color="#f9f3e8" label="100" value="#f9f3e8" />
            <ColorSwatchTile color="#f5e6d3" label="200" value="#f5e6d3" />
            <ColorSwatchTile color="#f4e4c1" label="300" value="#f4e4c1" />
            <ColorSwatchTile color="#e8d4a8" label="400" value="#e8d4a8" />
            <ColorSwatchTile color="#d4c094" label="500" value="#d4c094" />
            <ColorSwatchTile color="#c9a882" label="600" value="#c9a882" />
            <ColorSwatchTile color="#8b6f47" label="800" value="#8b6f47" />
            <ColorSwatchTile color="#6d5838" label="900" value="#6d5838" />
            <ColorSwatchTile color="#5d4a32" label="950" value="#5d4a32" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Game semantic colors</h2>
          <div className="flex w-full flex-col items-stretch gap-2.5">
            <SemanticColorRow
              borderColor="#3a6c1f"
              label="Success"
              segments={[
                { color: '#6ebf49' },
                { color: '#4a8c2a' },
                { color: '#3a6c1f' },
              ]}
            />
            <SemanticColorRow
              borderColor="#1f5288"
              label="Info"
              segments={[
                { color: '#5b9bd5' },
                { color: '#2e75b6' },
                { color: '#1f5288' },
              ]}
            />
            <SemanticColorRow
              borderColor="#9e7b0d"
              label="Warning"
              segments={[
                { color: '#f1c40f', textTone: 'dark' },
                { color: '#d4a017' },
                { color: '#9e7b0d' },
              ]}
            />
            <SemanticColorRow
              borderColor="#a93226"
              label="Danger"
              segments={[
                { color: '#e74c3c' },
                { color: '#c0392b' },
                { color: '#a93226' },
              ]}
            />
            <SemanticColorRow
              borderColor="#5d6d6e"
              label="Neutral"
              segments={[
                { color: '#95a5a6' },
                { color: '#7f8c8d' },
                { color: '#5d6d6e' },
              ]}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Cinzel display</h2>
          <CinzelDisplaySample
            lines={[
              { text: 'MMORTS MÉDIÉVAL · EYEBROW · 11/0.3em', variant: 'eyebrow' },
              { text: 'Battle for the Crown', variant: 'hero' },
              { text: 'Forgez votre royaume', variant: 'title' },
              { text: 'Camp de bûcherons', variant: 'section' },
              { text: '« À ceux qui osent, le royaume offre gloire et richesses. »', variant: 'quote' },
            ]}
          />
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">Onboarding FAB</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">
              onboarding · source Onboarding.html · action: {onboardingPreviewAction}
            </span>
          </div>
          <div className="flex w-full flex-wrap items-start justify-center gap-5">
            <OnboardingPreviewPhoneFrame label="Pill fermé">
              <OnboardingPreviewScene>
                <OnboardingFab
                  {...onboardingPreviewStep}
                  onOpenChange={(open) => setOnboardingPreviewAction(open ? 'Ouverture depuis le pill' : 'Fermeture')}
                  onPrimaryAction={(payload) => setOnboardingPreviewAction(`CTA ${payload.title}`)}
                  onSecondaryAction={() => setOnboardingPreviewAction('Plus tard')}
                  open={false}
                  placement="container"
                />
              </OnboardingPreviewScene>
            </OnboardingPreviewPhoneFrame>

            <OnboardingPreviewPhoneFrame label="Modal ouvert">
              <OnboardingPreviewScene>
                <OnboardingFab
                  {...onboardingPreviewStep}
                  onOpenChange={(open) => {
                    setOnboardingPreviewOpen(open);
                    setOnboardingPreviewAction(open ? 'Ouverture modal' : 'Fermeture modal');
                  }}
                  onPrimaryAction={(payload) => {
                    setOnboardingPreviewOpen(false);
                    setOnboardingPreviewAction(`CTA ${payload.title}`);
                  }}
                  onSecondaryAction={() => {
                    setOnboardingPreviewOpen(false);
                    setOnboardingPreviewAction('Plus tard');
                  }}
                  open={onboardingPreviewOpen}
                  placement="container"
                />
              </OnboardingPreviewScene>
            </OnboardingPreviewPhoneFrame>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">Connexion / Inscription</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">
              auth · 6 artboards · source project/Connexion.html
            </span>
          </div>
          <div className="flex w-full flex-col items-center gap-5">
            <div className="flex flex-wrap items-start justify-center gap-5">
              <div className="flex flex-col items-center gap-2">
                <span className="rounded-full border border-[rgba(93,74,50,.35)] px-2.5 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.24em] text-[#5d4a32]">
                  A1 · Crest impérial
                </span>
                <AuthLandingScreen
                  actions={[
                    { id: 'resume', label: "Reprendre l'aventure", variant: 'success', size: 'lg' },
                    { id: 'new', label: 'Forger un nouveau royaume', variant: 'wood', size: 'md' },
                  ]}
                  castleIcon="/assets/castle.png"
                  crownIcon="/assets/crown.png"
                  eyebrow="· Chronique du royaume ·"
                  secondaryActions={authSecondaryActions}
                  status={authStatus}
                  tagline="« Forgez votre royaume. »"
                  titleLines={authTitleLines}
                  variant="crest"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="rounded-full border border-[rgba(93,74,50,.35)] px-2.5 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.24em] text-[#5d4a32]">
                  A2 · Aube sur le château
                </span>
                <AuthLandingScreen
                  actions={[
                    { id: 'resume', label: "Reprendre l'aventure", variant: 'warning', size: 'lg' },
                    { id: 'new', label: 'Forger un nouveau royaume', variant: 'wood', size: 'md' },
                  ]}
                  castleIcon="/assets/castle.png"
                  crownIcon="/assets/crown.png"
                  eyebrow=""
                  status={authStatus}
                  tagline="« Quand le soleil se lève, le royaume s'éveille. »"
                  titleLines={authTitleLines}
                  variant="dawn"
                  warehouseIcon="/assets/warehouse.png"
                  watchtowerIcon="/assets/watchtower.png"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="rounded-full border border-[rgba(93,74,50,.35)] px-2.5 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.24em] text-[#5d4a32]">
                  A3 · Sceau royal
                </span>
                <AuthLandingScreen
                  actions={[
                    { id: 'resume', label: "Reprendre l'aventure", variant: 'success', size: 'lg' },
                    { id: 'new', label: 'Forger un nouveau royaume', variant: 'wood', size: 'md' },
                  ]}
                  castleIcon="/assets/castle.png"
                  crownIcon="/assets/crown.png"
                  eyebrow="· Anno regni ·"
                  secondaryActions={authSecondaryActions}
                  status={authStatus}
                  tagline="« Trois lis, une couronne, mille batailles. »"
                  titleLines={authTitleLines}
                  variant="seal"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-center gap-5">
              <div className="flex flex-col items-center gap-2">
                <span className="rounded-full border border-[rgba(93,74,50,.35)] px-2.5 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.24em] text-[#5d4a32]">
                  B · Connexion
                </span>
                <AuthLoginScreen
                  backLabel="Retour"
                  crownIcon="/assets/crown.png"
                  dividerLabel="ou"
                  fields={{
                    lord: {
                      id: 'auth-preview-login-lord',
                      icon: '✦',
                      label: 'Nom de seigneur',
                      onChange: setAuthLoginLord,
                      placeholder: 'ex. SireKelvin',
                      value: authLoginLord,
                    },
                    password: {
                      id: 'auth-preview-login-password',
                      icon: '✶',
                      label: 'Sceau secret',
                      onChange: setAuthLoginPassword,
                      onPasswordVisibleChange: setAuthLoginPasswordVisible,
                      passwordVisible: authLoginPasswordVisible,
                      placeholder: '•••••••',
                      secure: true,
                      value: authLoginPassword,
                    },
                  }}
                  forgotAction={{ id: 'forgot', label: 'Sceau oublié ?' }}
                  footerAction={{ id: 'register', label: 'En forger un →' }}
                  footerPrompt="Pas encore de royaume ?"
                  remember={{
                    checked: authRemember,
                    label: 'Se souvenir',
                    onChange: setAuthRemember,
                  }}
                  ssoActions={[
                    { id: 'google', kind: 'google', label: 'Google' },
                    { id: 'apple', kind: 'apple', label: 'Apple' },
                  ]}
                  status={authStatus}
                  stepLabel="Connexion · 1/1"
                  submitAction={{ id: 'submit-login', label: 'Entrer dans le royaume', variant: 'success', size: 'lg' }}
                  subtitle="Le royaume vous attend, Sire."
                  title="Reprendre l'aventure"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="rounded-full border border-[rgba(93,74,50,.35)] px-2.5 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.24em] text-[#5d4a32]">
                  C · Inscription
                </span>
                <AuthRegisterScreen
                  backLabel="Retour"
                  badgeIcon="/assets/casual-icons/crown.png"
                  badgeLabel="Fonder un royaume"
                  fields={{
                    email: {
                      id: 'auth-preview-register-email',
                      icon: '✉',
                      label: 'Plis royaux',
                      onChange: setAuthRegisterEmail,
                      placeholder: 'seigneur@royaume.fr',
                      type: 'email',
                      value: authRegisterEmail,
                    },
                    lord: {
                      hint: '3 à 16 caractères, sans espace',
                      id: 'auth-preview-register-lord',
                      icon: '✦',
                      label: 'Nom de seigneur',
                      onChange: setAuthRegisterLord,
                      placeholder: 'ex. SireKelvin',
                      value: authRegisterLord,
                    },
                    password: {
                      id: 'auth-preview-register-password',
                      icon: '✶',
                      label: 'Sceau secret',
                      onChange: setAuthRegisterPassword,
                      onPasswordVisibleChange: setAuthRegisterPasswordVisible,
                      passwordVisible: authRegisterPasswordVisible,
                      placeholder: '•••••••',
                      secure: true,
                      value: authRegisterPassword,
                    },
                  }}
                  footerAction={{ id: 'login', label: 'Reprendre →' }}
                  footerPrompt="Déjà un royaume ?"
                  status={authStatus}
                  stepLabel="Inscription · 1/2"
                  strength={{
                    labels: ['Faible', 'Moyen', 'Bon', 'Robuste'],
                    score: 3,
                    titlePrefix: 'Sceau',
                  }}
                  submitAction={{ id: 'submit-register', label: 'Forger mon royaume', variant: 'warning', size: 'lg' }}
                  terms={{
                    checked: authTermsAccepted,
                    firstLinkLabel: 'Édits du Royaume',
                    firstText: 'Je jure allégeance aux',
                    onChange: setAuthTermsAccepted,
                    secondLinkLabel: 'Charte de discrétion',
                    secondText: 'et reconnais la',
                    suffix: '.',
                  }}
                  titleLines={['Que la couronne', 'vous distingue']}
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="rounded-full border border-[rgba(93,74,50,.35)] px-2.5 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.24em] text-[#5d4a32]">
                  D · Forger l'étendard
                </span>
                <AuthBannerScreen
                  backLabel="Retour"
                  field={{
                    id: 'auth-preview-banner-lord',
                    icon: '✦',
                    label: 'Nom du seigneur',
                    onChange: setAuthBannerLord,
                    value: authBannerLord,
                  }}
                  onShieldChange={setAuthSelectedShield}
                  quote="« On reconnaît le seigneur à ses couleurs, pas à ses paroles. »"
                  selectedShieldId={authSelectedShield}
                  shieldLabel="Blason"
                  shields={authShields}
                  status={authStatus}
                  stepLabel="Inscription · 2/2"
                  submitAction={{ id: 'submit-banner', label: "Lever l'étendard", variant: 'warning', size: 'lg' }}
                  subtitle="« Que vos couleurs guident vos vassaux. »"
                  title="Forgez votre étendard"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">Choix du Monde · Variante B</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">
              worlds · bannières héraldiques · source project/Choix du Monde.html
            </span>
          </div>
          <div className="flex w-full justify-center">
            <div className="h-[720px] w-[360px] overflow-hidden rounded-[18px] border-[3px] border-[#3c2619] shadow-[0_10px_28px_rgba(60,38,25,.35)]">
              <WorldsSelectionDesign
                activeTab={worldsPreviewTab}
                counts={worldsPreviewCounts}
                labels={worldsSelectionLabels}
                onBack={() => undefined}
                onDetails={() => undefined}
                onEnter={() => undefined}
                onJoin={() => undefined}
                onNotify={() => undefined}
                onTabChange={setWorldsPreviewTab}
                totalCount={worldPreviewModels.length}
                variants={defaultSeasonVariants}
                worlds={filteredWorldPreviewModels}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">Détail du Monde · Runtime</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">
              worlds · détail royaume · source project/world-views.jsx
            </span>
          </div>
          <div className="flex w-full justify-center">
            <div className="h-[720px] w-[360px] overflow-hidden rounded-[18px] border-[3px] border-[#3c2619] shadow-[0_10px_28px_rgba(60,38,25,.35)]">
              <WorldDetailDesign
                labels={worldDetailLabels}
                onBack={() => undefined}
                onEnter={() => undefined}
                onJoin={() => undefined}
                onNotify={() => undefined}
                world={{
                  ...worldPreviewModels[0]!,
                  isJoined: true,
                  personalStats: {
                    kingdomPowerLabel: '48 210',
                    villageCountLabel: '2 villages',
                  },
                }}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">Vue Armée · État stable</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">
              army · garnison · source project/Vue Armée.html
            </span>
          </div>
          <div className="flex w-full justify-center">
            <div className="h-[720px] w-[360px] overflow-hidden rounded-[18px] border-[3px] border-[#3c2619] shadow-[0_10px_28px_rgba(60,38,25,.35)]">
              <ArmyViewDesign {...armyPreviewBase} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">Vue Armée · Drag et recrutement</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">
              army · drop zone active · bottom-sheet contrôlé
            </span>
          </div>
          <div className="flex w-full flex-wrap justify-center gap-4">
            <div className="h-[720px] w-[360px] overflow-hidden rounded-[18px] border-[3px] border-[#3c2619] shadow-[0_10px_28px_rgba(60,38,25,.35)]">
              <ArmyDraggingOverlay
                army={armyPreviewBase}
                ghostLabel="Vue Armée · drag actif"
                troopId="squire"
              />
            </div>
            <div className="h-[720px] w-[360px] overflow-hidden rounded-[18px] border-[3px] border-[#3c2619] shadow-[0_10px_28px_rgba(60,38,25,.35)]">
              <ArmyRecruitOverlay
                army={armyPreviewBase}
                popup={{
                  labels: armyRecruitLabels,
                  max: armyRecruitMax,
                  onCancel: () => setArmyRecruitQuantity(1),
                  onChange: setArmyRecruitQuantity,
                  onRecruit: setArmyRecruitQuantity,
                  quickValues: armyRecruitQuickValues,
                  stock: armyRecruitStock,
                  troop: armyRecruitTroop,
                  value: armyRecruitQuantity,
                }}
                screenLabel="Vue Armée · popup recrutement"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Surfaces & gradients</h2>
          <div className="flex w-full flex-wrap items-center justify-center gap-[14px]">
            <SurfaceTile code="#1a1a2e" label="App backdrop" tone="appBackdrop" />
            <SurfaceTile code="#d2b48c" label="Flat parchment" tone="flatParchment" />
            <SurfaceTile code="e8d5b7→d4c094" label="Landing radial" tone="landingRadial" />
            <SurfaceTile code="3c2619→6b4b2b" label="Bottom nav" tone="bottomNav" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Shadows & depth</h2>
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <ShadowDepthTile description="Petit lift · boutons" label="flat-2" tone="flat2" />
            <ShadowDepthTile description="Carte / panneau standard" label="card" tone="card" />
            <ShadowDepthTile description="Boutons CTA + reflet haut" label="card+rim" tone="cardRim" />
            <ShadowDepthTile description="Slot / champ creusé" label="inset" tone="inset" />
            <ShadowDepthTile description="Onglet actif · sélection" label="glow" tone="glow" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Resource icons</h2>
          <div className="flex w-full flex-wrap items-center justify-center gap-[14px] bg-[#3c2619] p-[18px]">
            <ResourceIconTile icon="/assets/resources/wood.png" label="Bois" />
            <ResourceIconTile icon="/assets/resources/stone.png" label="Pierre" />
            <ResourceIconTile icon="/assets/resources/iron.png" label="Fer" />
            <ResourceIconTile icon="/assets/resources/population.png" label="Population" />
            <ResourceIconTile icon="/assets/crown.png" label="Couronne" tone="premium" />
            <ResourceIconTile icon="/assets/power.png" label="Puissance" />
            <ResourceIconTile icon="/assets/clock.png" label="Temps" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Building icons</h2>
          <div className="flex w-full flex-wrap items-center justify-center gap-[14px] bg-[#5b8f3a] p-[18px]">
            <BuildingIconTile icon="/assets/castle.png" label="Château" />
            <BuildingIconTile icon="/assets/barracks.png" label="Caserne" />
            <BuildingIconTile icon="/assets/quarter.png" label="Quartier" />
            <BuildingIconTile icon="/assets/warehouse.png" label="Entrepôt" />
            <BuildingIconTile icon="/assets/watchtower.png" label="Tour de guet" />
            <BuildingIconTile icon="/assets/wood.png" label="Bûcherons" />
            <BuildingIconTile icon="/assets/stone.png" label="Carrière" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Building cards</h2>
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            <BuildingCard actionLabel="→ Niv. 4" icon="/assets/castle.png" surface="parchment" title="Château" />
            <BuildingCard actionLabel="Construire" icon="/assets/wood.png" surface="wood" title="Camp de bûcherons" />
            <BuildingCard actionLabel="→ Niv. 2" actionTone="info" icon="/assets/iron.png" surface="stone" title="Mine de fer" />
            <BuildingCard actionDisabled actionLabel="Verrouillé" actionTone="neutral" icon="/assets/watchtower.png" iconMuted surface="default" title="Tour de guet" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Borders & strokes</h2>
          <div className="flex w-full flex-wrap items-center justify-center gap-[18px]">
            <BorderStrokeTile description="Cartes simples" label="2px wood" tone="wood2" />
            <BorderStrokeTile description="CTA · panneaux" label="3px deep" tone="deep3" />
            <BorderStrokeTile description="Inputs · cartes BftC" label="4px parch" tone="parch4" />
            <BorderStrokeTile description="Drop-target · ghost" label="dashed" tone="dashed" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Radii</h2>
          <div className="flex w-full flex-wrap items-center justify-center gap-[18px]">
            <RadiusTile description="6px · inputs" label="sm" tone="sm" />
            <RadiusTile description="10px · buttons" label="md" tone="md" />
            <RadiusTile description="14px · cards" label="lg" tone="lg" />
            <RadiusTile description="18px · modals" label="xl" tone="xl" />
            <RadiusTile description="∞ · badges" label="pill" tone="pill" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Avatar</h2>
          <div className="flex w-full flex-col items-stretch gap-[14px]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">tailles</span>
              <Avatar initials="R" size="s24" />
              <Avatar initials="A" size="s32" />
              <Avatar initials="SR" size="s44" />
              <Avatar initials="SR" size="s64" />
              <Avatar initials="SR" size="s88" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">teintes (tribu)</span>
              <Avatar initials="B" tone="red" />
              <Avatar initials="S" tone="blue" />
              <Avatar initials="V" tone="green" />
              <Avatar initials="R" tone="purple" />
              <Avatar initials="N" tone="stone" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">statut</span>
              <Avatar initials="B" status="online" tone="red" />
              <Avatar initials="S" status="attack" tone="blue" />
              <Avatar initials="V" status="defense" tone="green" />
              <Avatar initials="N" status="offline" tone="stone" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">niveau / chef</span>
              <Avatar initials="B" levelLabel="Niv. 18" size="s64" status="online" tone="red" />
              <Avatar crownIcon="/assets/casual-icons/crown.png" initials="R" levelLabel="★ Chef" size="s64" tone="purple" />
              <Avatar icon="/assets/army/templar.png" levelLabel="Héros" size="s64" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">stack (membres)</span>
              <AvatarStack
                items={[
                  { id: 'braves', initials: 'B', tone: 'red' },
                  { id: 'saphir', initials: 'S', tone: 'blue' },
                  { id: 'verdoyants', initials: 'V', tone: 'green' },
                  { id: 'neutres', initials: 'N', tone: 'stone' },
                ]}
                moreLabel="+18"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">ligne profil</span>
              <AvatarProfileLine
                avatar={{ initials: 'SR', status: 'online', tone: 'red' }}
                name="Sire_Robert"
                subtitle="Niv. 18 · [BFC] · 38.420 pts"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Army movement</h2>
          <div className="flex w-full flex-col items-stretch bg-[#3c2619] p-[18px] text-[#f5e6d3]">
            <ArmyMovementList
              label="mouvements actifs · 4"
              movements={[
                {
                  icon: '/assets/hand-red.png',
                  incoming: true,
                  movementId: 'incoming-robert',
                  progress: 32,
                  subtitle: (
                    <>
                      De <b>Sire_Robert</b> · Roc-d&apos;Acier <b>238|617</b> · ≈ 240 unités
                    </>
                  ),
                  time: '02:15',
                  title: '⚠ ATTAQUE entrante',
                  tone: 'attack',
                },
                {
                  icon: '/assets/army/squire.png',
                  movementId: 'attack-tours-hautes',
                  progress: 78,
                  subtitle: (
                    <>
                      <b>120</b> squires + <b>60</b> archers · arrivée à 14h42
                    </>
                  ),
                  time: '0:47',
                  title: 'Attaque → Tours-Hautes',
                  tone: 'attack',
                },
                {
                  icon: '/assets/hand-silver.png',
                  movementId: 'reinforce-castelfort',
                  progress: 25,
                  subtitle: (
                    <>
                      <b>80</b> milice · au retour : 6h
                    </>
                  ),
                  time: '1h 12m',
                  title: 'Renfort → Castelfort (allié)',
                  tone: 'reinforce',
                },
                {
                  icon: '/assets/army/squire.png',
                  movementId: 'return-roc-acier',
                  progress: 96,
                  subtitle: (
                    <>
                      102 squires + 56 archers · <b>+2.400 butin</b>
                    </>
                  ),
                  time: '0:12',
                  title: "Retour de pillage · Roc-d'Acier",
                  tone: 'return',
                },
                {
                  icon: '/assets/lupa.png',
                  movementId: 'scout-bois-argent',
                  onRecall: () => undefined,
                  progress: 22,
                  recallLabel: 'Rappeler',
                  subtitle: '×1 éclaireur · discret',
                  time: '3:04',
                  title: "Éclaireur → Bois-d'Argent",
                  tone: 'scout',
                },
              ]}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Choix du Style — Village</h2>
          <div className="flex flex-wrap gap-4">
            <div className="relative h-[720px] w-[360px] overflow-hidden rounded-[36px] border-[8px] border-[#0c0c1a] bg-[#1a1a2e] shadow-[0_30px_60px_rgba(0,0,0,.6),inset_0_0_0_2px_#2a2a45]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,#7c9756_0%,#a8b977_28%,#cdbf8e_60%,#b89968_100%)]">
                <div className="absolute inset-x-0 top-0 flex h-[62px] items-center gap-2 border-b-2 border-[#8b7355] bg-[linear-gradient(to_bottom,rgba(60,38,25,.94),rgba(78,56,34,.94))] px-2.5 py-2">
                  <div className="size-10 rounded-full border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#8b6f47,#6d5838)]" />
                  <div className="flex flex-1 flex-col gap-[5px]">
                    <div className="h-3.5 w-[100px] rounded bg-[rgba(255,255,255,.18)]" />
                    <div className="h-[22px] rounded-md bg-[rgba(0,0,0,.32)]" />
                  </div>
                </div>
                <img alt="" className="absolute left-[70px] top-[200px] w-[130px] opacity-85" src="/assets/castle.png" />
                <img alt="" className="absolute left-[200px] top-[380px] w-[100px] opacity-85" src="/assets/warehouse.png" />
                <img alt="" className="absolute left-[30px] top-[430px] w-[110px] opacity-85" src="/assets/quarter.png" />
                <div className="absolute inset-x-0 bottom-0 h-16 border-t-2 border-[#8b7355] bg-[linear-gradient(to_top,rgba(60,38,25,.95),rgba(78,56,34,.9))]" />
              </div>
              <div className="absolute inset-x-0 bottom-[86px] flex justify-center">
                <VillageStyleTrigger currentStyleId="BALANCED" onClick={() => setVillageStyleOpen(true)} />
              </div>
              <VillageStyleModal
                castleLevel={5}
                currentStyleId="BALANCED"
                initialStyleId={villageStyle}
                onAdopt={(styleId) => {
                  setVillageStyle(styleId);
                  setVillageStyleOpen(false);
                }}
                onChange={setVillageStyle}
                onClose={() => setVillageStyleOpen(false)}
                open={villageStyleOpen}
                overlayMode="absolute"
                stock={{ crowns: 60, iron: 180, stone: 940, wood: 1820 }}
                value={villageStyle}
              />
            </div>
            <div className="flex max-w-[300px] flex-col justify-center gap-2 rounded-xl border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] p-4 font-game text-sm text-[#3d2f1f]">
              <div className="text-xs font-bold uppercase tracking-[.18em] text-[#6d5838]">Scénario source</div>
              <div>Carrousel focalisé · Château 5 · style actuel Équilibré.</div>
              <div>Stock volontairement insuffisant pour Raiders : bois 1.820 · pierre 940 · fer 180 · couronnes 60.</div>
              <BftcButton onClick={() => setVillageStyleOpen(true)} variant="info">Réouvrir la modal</BftcButton>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Buttons</h2>
          <div className="flex w-full flex-col items-stretch gap-2.5">
            <div className="flex w-full flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">6 variants</span>
              <BftcButton>OK</BftcButton>
              <BftcButton variant="info">ACCEPTER</BftcButton>
              <BftcButton variant="danger">NON</BftcButton>
              <BftcButton variant="warning">ATTENTION</BftcButton>
              <BftcButton variant="neutral">Retour</BftcButton>
              <BftcButton variant="wood">Bois</BftcButton>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">xs/sm/md/lg</span>
              <BftcButton size="xs">XSmall</BftcButton>
              <BftcButton variant="success" size="sm">Small</BftcButton>
              <BftcButton variant="info">Medium</BftcButton>
              <BftcButton size="lg" variant="warning">Large</BftcButton>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">states</span>
              <BftcButton>Default</BftcButton>
              <BftcButton state="hover">Hover</BftcButton>
              <BftcButton state="pressed">Pressed</BftcButton>
              <BftcButton state="disabled">Disabled</BftcButton>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Inputs</h2>
          <div className="flex w-full flex-col items-stretch gap-3">
            <GameInput
              helperText="Visible par vos voisins du royaume."
              label="Nom du seigneur"
              onChange={setLordName}
              placeholder="Sire Kelvin"
              value={lordName}
            />
            <GameInput
              label="Royaume"
              onChange={setKingdomName}
              tone="parchment"
              value={kingdomName}
            />
            <GameInput
              errorText="8 caractères minimum."
              label="Mot de passe"
              onChange={setPasswordValue}
              type="password"
              value={passwordValue}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Icon buttons</h2>
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <IconButton
              icon={(
                <svg strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
              label="Ajouter"
              tone="success"
            />
            <IconButton
              icon={(
                <svg strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              )}
              label="Supprimer"
              tone="danger"
            />
            <IconButton
              icon={(
                <svg strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              )}
              label="Paramètres"
              tone="info"
            />
            <IconButton
              icon={(
                <svg strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              )}
              label="Fermer"
              tone="neutral"
            />
            <IconButton
              icon={(
                <svg strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6m-3 9 5-5m-4.5-1.5 5 5" />
                </svg>
              )}
              label="Attaquer"
              tone="warning"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Header bar</h2>
          <div className="w-full max-w-[390px] bg-[#3c2619] p-3.5">
            <HeaderBar
              avatarInitials="SK"
              level={12}
              population={{ icon: '/assets/resources/population.png', label: 'Population', value: '120' }}
              primaryStats={[
                { icon: '/assets/power.png', label: 'Puissance', value: '2 480' },
                { icon: '/assets/crown.png', label: 'Couronnes', value: '28' },
              ]}
              resources={[
                { icon: '/assets/resources/wood.png', label: 'Bois', value: '8.500' },
                { icon: '/assets/resources/stone.png', label: 'Pierre', value: '3.200' },
                { icon: '/assets/resources/iron.png', label: 'Fer', value: '1.500' },
              ]}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Activités du royaume</h2>
          <div className="min-w-0 overflow-hidden rounded-[14px] border-2 border-[#3c2619] bg-[#5b8f3a] shadow-[0_8px_24px_rgba(0,0,0,.28)]">
            <div className="relative flex min-h-[720px] min-w-0 max-w-[390px] flex-col overflow-hidden bg-[linear-gradient(180deg,#7eab57_0%,#5b8f3a_58%,#3d6e1f_100%)]">
              <div className="absolute inset-0 opacity-[.35] blur-[2px] [background-image:url('/assets/castle.png'),url('/assets/quarter.png'),url('/assets/barracks.png')] [background-position:50%_22%,12%_48%,78%_56%] [background-repeat:no-repeat] [background-size:38%,30%,28%]" />
              <div className="absolute inset-0 bg-[rgba(60,38,25,.32)] backdrop-blur-[1px]" />
              <div className="relative z-[2] bg-[#3c2619] p-3.5">
                <HeaderBar
                  avatarInitials="SK"
                  level={12}
                  population={{ icon: '/assets/resources/population.png', label: 'Population', value: '120' }}
                  primaryStats={[
                    { icon: '/assets/power.png', label: 'Puissance', value: '2 480' },
                    { icon: '/assets/crown.png', label: 'Couronnes', value: '28' },
                  ]}
                  resources={[
                    { icon: '/assets/resources/wood.png', label: 'Bois', value: '8.500' },
                    { icon: '/assets/resources/stone.png', label: 'Pierre', value: '3.200' },
                    { icon: '/assets/resources/iron.png', label: 'Fer', value: '1.500' },
                  ]}
                />
              </div>
              <div className="relative z-[2] flex flex-wrap items-center gap-1.5 bg-[linear-gradient(180deg,rgba(60,38,25,.78),rgba(60,38,25,0))] px-2.5 pb-2 pt-1.5">
                <KingdomActivityHudBadges
                  badges={[
                    {
                      count: expeditionActivities.length,
                      label: 'Expéditions',
                      onClick: () => setKingdomActivityTab('expeditions'),
                      tone: 'stone',
                    },
                    {
                      count: captureWindows.length,
                      label: 'Captures',
                      onClick: () => setKingdomActivityTab('captures'),
                      tone: 'gold',
                    },
                  ]}
                />
                <span className="font-game text-[10px] font-semibold tracking-[.05em] text-[rgba(245,243,232,.7)]">
                  · 1 fenêtre se ferme bientôt
                </span>
              </div>
              <div className="relative flex-1" />
              <div className="relative z-[5]">
                <KingdomActivitiesPanel
                  activeTab={kingdomActivityTab}
                  captureCount={captureWindows.length}
                  captures={captureWindows}
                  embedded
                  expeditionCount={expeditionActivities.length}
                  expeditions={expeditionActivities}
                  labels={kingdomActivityLabels}
                  onTabChange={setKingdomActivityTab}
                  threatCount={incomingThreats.length}
                  threats={incomingThreats}
                />
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-[14px] border-2 border-[#8b7355] bg-[linear-gradient(180deg,#f5e6d3,#e8d4a8)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.45)]">
              <h3 className="mb-2 font-game text-xs font-bold uppercase tracking-[.12em] text-[#3d2f1f]">États de capture</h3>
              <div className="flex flex-col gap-2.5">
                {allCaptureStates.map((capture) => (
                  <CaptureWindowCard
                    key={`${capture.tier}-${capture.coordinates}`}
                    {...capture}
                  />
                ))}
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <div className="min-w-0 rounded-[14px] border-2 border-[#8b7355] bg-[linear-gradient(180deg,#f5e6d3,#e8d4a8)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.45)]">
                <h3 className="mb-2 font-game text-xs font-bold uppercase tracking-[.12em] text-[#3d2f1f]">Badges HUD</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-[10px] border-2 border-[#3c2619] bg-[linear-gradient(180deg,rgba(60,38,25,.95),rgba(78,56,34,.95))] px-2.5 py-2">
                    <span className="mr-auto font-game text-[10.5px] font-extrabold uppercase tracking-[.18em] text-[rgba(240,224,192,.65)]">HUD royaume</span>
                    <KingdomActivityHudBadges
                      badges={[
                        { count: 0, label: 'Expéditions', tone: 'stone' },
                        { count: 0, label: 'Captures', tone: 'gold' },
                      ]}
                    />
                    <span className="font-game text-[10px] italic text-[rgba(245,243,232,.4)]">—</span>
                  </div>
                  <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-[10px] border-2 border-[#3c2619] bg-[linear-gradient(180deg,rgba(60,38,25,.95),rgba(78,56,34,.95))] px-2.5 py-2">
                    <span className="mr-auto font-game text-[10.5px] font-extrabold uppercase tracking-[.18em] text-[rgba(240,224,192,.65)]">HUD royaume</span>
                    <KingdomActivityHudBadges badges={[{ count: 3, label: 'Captures', tone: 'gold' }]} />
                  </div>
                  <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-[10px] border-2 border-[#3c2619] bg-[linear-gradient(180deg,rgba(60,38,25,.95),rgba(78,56,34,.95))] px-2.5 py-2">
                    <span className="mr-auto font-game text-[10.5px] font-extrabold uppercase tracking-[.18em] text-[rgba(240,224,192,.65)]">HUD royaume</span>
                    <KingdomActivityHudBadges
                      badges={[
                        { count: 2, label: 'Expéditions', tone: 'stone' },
                        { count: 3, label: 'Captures', tone: 'green' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <KingdomActivitiesPanel
                activeTab="expeditions"
                captureCount={0}
                captures={[]}
                expeditionCount={expeditionActivities.length}
                expeditions={expeditionActivities}
                labels={kingdomActivityLabels}
                onTabChange={() => undefined}
                threatCount={incomingThreats.length}
                threats={incomingThreats}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">MultiVillageBottomSheet</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">monde · navigation multi-village · bottom sheet</span>
          </div>
          <div className="flex w-full flex-wrap items-start justify-center gap-6">
            <MultiVillagePhoneFrame>
              <MultiVillageBottomSheet
                capacity={7}
                filter={multiVillageFilter}
                labels={multiVillageLabels}
                onClose={() => undefined}
                onFilterChange={setMultiVillageFilter}
                onSelectVillage={() => undefined}
                onSort={() => undefined}
                villages={multiVillageFixture}
              />
            </MultiVillagePhoneFrame>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Bottom sheet shell</h2>
          <div className="flex w-full justify-center">
            <div className="h-[420px] w-full max-w-[390px] overflow-hidden rounded-2xl border-2 border-[#3c2619] bg-[#2f5125] shadow-[0_12px_28px_rgba(60,38,25,.22)]">
              <div className="flex h-full items-end">
                <GameBottomSheetPanel
                  bodyClassName="space-y-3 p-3"
                  closeLabel="Fermer"
                  eyebrow="Panneau"
                  headerActions={<Badge tone="warning" size="sm">2 / 3</Badge>}
                  onClose={() => undefined}
                  title="Constructions actives"
                >
                  <BuildQueueCard
                    icon="/assets/barracks.png"
                    progress={72}
                    time="3:42"
                    title="Caserne niv. 2"
                  />
                  <BuildQueueCard
                    icon="/assets/watchtower.png"
                    progress={0}
                    time="8:10"
                    title="Tour de guet niv. 1"
                    tone="idle"
                  />
                </GameBottomSheetPanel>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Badges</h2>
          <div className="flex w-full flex-col items-stretch gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[60px] font-mono text-[10px] text-[#5d4a32]">variants</span>
              <Badge>12</Badge>
              <Badge tone="success">OK</Badge>
              <Badge tone="info">Niv. 3</Badge>
              <Badge tone="warning">Niv. 5</Badge>
              <Badge tone="danger">3</Badge>
              <Badge tone="neutral">Non construit</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[60px] font-mono text-[10px] text-[#5d4a32]">sm/md/lg</span>
              <Badge size="sm" tone="warning">9</Badge>
              <Badge tone="warning">Niv. 3</Badge>
              <Badge size="lg" tone="warning">12</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[60px] font-mono text-[10px] text-[#5d4a32]">en jeu</span>
              <Badge tone="success">Niv. MAX</Badge>
              <Badge tone="info">×24</Badge>
              <Badge tone="danger">!</Badge>
              <Badge tone="warning">+15%</Badge>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Timer & countdown</h2>
          <div className="flex w-full flex-col items-stretch gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">tailles</span>
              <Timer size="xs">45s</Timer>
              <Timer>2:15</Timer>
              <Timer size="md">1h 12m</Timer>
              <Timer size="lg">3h 04m</Timer>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">variants</span>
              <Timer>2:15</Timer>
              <Timer tone="blue">Entraînement</Timer>
              <Timer tone="red" urgent>0:12</Timer>
              <Timer showIcon={false} tone="stone">⏸ En pause</Timer>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">attaque dans</span>
              <DigitTimer parts={['02', '15', '47']} />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">mega</span>
              <Timer size="mega" tone="red" urgent>00:12</Timer>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Cost row</h2>
          <div className="flex w-full flex-col items-stretch gap-3">
            <CostRow>
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">inline</span>
              <CostPill icon="/assets/resources/wood.png" value="200" />
              <CostPill icon="/assets/resources/stone.png" value="150" />
              <CostPill icon="/assets/resources/iron.png" value="80" />
              <CostPill icon="/assets/resources/population.png" value="5" />
            </CostRow>
            <CostRow>
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">manque</span>
              <CostPill icon="/assets/resources/wood.png" value="200" />
              <CostPill current="320" icon="/assets/resources/stone.png" insufficient value="1.500" />
              <CostPill current="150" icon="/assets/resources/iron.png" insufficient value="800" />
            </CostRow>
            <div className="w-full rounded-xl border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#f5e6d3] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
              <h3 className="mb-1.5 font-game text-xs font-bold uppercase tracking-[0.15em] text-[#5d4a32]">
                Coût · Caserne → Niv. 2
              </h3>
              <CostRow>
                <CostPill icon="/assets/resources/wood.png" size="lg" value="1.200" />
                <CostPill icon="/assets/resources/stone.png" size="lg" value="800" />
                <CostPill current="420" icon="/assets/resources/iron.png" insufficient size="lg" value="650" />
                <CostPill icon="/assets/resources/population.png" size="lg" value="8" />
                <CostPill className="ml-auto" icon="/assets/clock.png" size="lg" value="12m" />
              </CostRow>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Requirement chip</h2>
          <div className="flex w-full flex-col items-stretch gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">états</span>
              <RequirementChip icon="/assets/lock.png">Château niv. 5 requis</RequirementChip>
              <RequirementChip icon="/assets/lock.png" state="soon">Caserne niv. 3 requise</RequirementChip>
              <RequirementChip icon="/assets/castle.png" state="current">Château niv. 4 / 5</RequirementChip>
              <RequirementChip icon="/assets/barracks.png" state="done">Caserne niv. 3 ✓</RequirementChip>
            </div>
            <div className="mt-1.5 w-full rounded-xl border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#f5e6d3] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
              <h3 className="mb-1.5 font-game text-[11px] font-bold uppercase tracking-[0.15em] text-[#5d4a32]">
                Conditions · Atelier de siège
              </h3>
              <div className="flex flex-col gap-1">
                <RequirementChip icon="/assets/castle.png" state="done" status="✓ rempli">Château niv. 5</RequirementChip>
                <RequirementChip icon="/assets/barracks.png" state="done" status="✓ rempli">Caserne niv. 3</RequirementChip>
                <RequirementChip icon="/assets/iron.png" state="current" status="3 / 4">Mine de fer niv. 4</RequirementChip>
                <RequirementChip icon="/assets/warehouse.png" status="1 / 6">Entrepôt niv. 6</RequirementChip>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Pip rating / level</h2>
          <div className="flex flex-col items-stretch gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">5 pips · or</span>
              <PipRating max={5} value={3} />
              <PipRating max={5} value={4} />
              <PipRating max={5} value={5} />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">10 pips</span>
              <PipRating max={10} size="sm" value={7} />
              <span className="font-game text-[11px] text-[#6d5838]">Niveau 7 / 10</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">teintes</span>
              <PipRating max={5} tone="red" value={3} />
              <PipRating max={5} tone="green" value={4} />
              <PipRating max={5} tone="silver" value={2} />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">étoiles</span>
              <PipRating max={5} value={3} variant="star" />
              <PipRating max={5} size="lg" value={5} variant="star" />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">chevrons</span>
              <PipRating max={1} value={1} variant="chevron" />
              <PipRating max={2} value={2} variant="chevron" />
              <PipRating max={3} value={3} variant="chevron" />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">chips niveau</span>
              <LevelChip icon="/assets/casual-icons/crown.png" value={12} />
              <LevelChip max={10} value={3} />
              <LevelChip tone="max" />
            </div>
            <div className="flex flex-col items-stretch gap-1.5">
              <span className="font-mono text-[10px] text-[#5d4a32]">en jeu · bâtiments</span>
              <BuildingLevelRow icon="/assets/castle.png" level={4} maxLevel={5} subtitle="Cœur de la cité" title="Château" />
              <BuildingLevelRow icon="/assets/wood.png" level={3} maxLevel={5} subtitle="+120 bois / heure" title="Camp de bûcherons" />
              <BuildingLevelRow icon="/assets/iron.png" level={5} maxLevel={5} ratingTone="green" subtitle="+50 fer / heure" title="Mine de fer" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Progress bars</h2>
          <div className="flex w-full flex-col items-stretch gap-3.5">
            <ProgressBar label="Construction · Caserne Niv. 2" suffix="72%" tone="gold" value={72} />
            <ProgressBar label="Entraînement · 24 squires" suffix="40%" value={40} />
            <ProgressBar label="Santé du village" suffix="22 / 100" tone="red" value={22} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Segmented control</h2>
          <div className="flex w-full flex-col items-stretch gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[90px] font-mono text-[10px] text-[#5d4a32]">2 options</span>
              <SegmentedControl ariaLabel="Type de marche" onChange={setSegmentAttack} options={[{ label: 'Attaque', value: 'attack' }, { label: 'Soutien', value: 'support' }]} value={segmentAttack} />
              <SegmentedControl ariaLabel="Vue" onChange={setSegmentList} options={[{ label: 'Carte', value: 'map' }, { label: 'Liste', value: 'list' }]} value={segmentList} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[90px] font-mono text-[10px] text-[#5d4a32]">3 options</span>
              <SegmentedControl ariaLabel="Bâtiment" onChange={setSegmentBuilding} options={[{ label: 'Caserne', value: 'barracks' }, { label: 'Atelier', value: 'workshop' }, { label: 'Forge', value: 'forge' }]} value={segmentBuilding} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[90px] font-mono text-[10px] text-[#5d4a32]">avec icônes</span>
              <SegmentedControl
                ariaLabel="Doctrine"
                onChange={setSegmentIcon}
                options={[
                  { icon: '/assets/army-power.png', label: 'Offensif', value: 'offense' },
                  { icon: '/assets/hand-silver.png', label: 'Défensif', value: 'defense' },
                  { icon: '/assets/lupa.png', label: 'Espion', value: 'spy' },
                ]}
                value={segmentIcon}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[90px] font-mono text-[10px] text-[#5d4a32]">grandes tabs</span>
              <SegmentedControl ariaLabel="Rapports" onChange={setSegmentReports} options={[{ label: 'Mes rapports', value: 'mine' }, { badge: '3', label: 'Tribu', value: 'tribe' }, { label: 'Archives', value: 'archives' }]} size="tabs" value={segmentReports} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[90px] font-mono text-[10px] text-[#5d4a32]">compact</span>
              <SegmentedControl ariaLabel="Période" onChange={setSegmentRange} options={[{ label: '1h', value: '1h' }, { label: '24h', value: '24h' }, { label: '7j', value: '7d' }, { label: '30j', value: '30d' }, { label: 'Tout', value: 'all' }]} size="compact" value={segmentRange} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[90px] font-mono text-[10px] text-[#5d4a32]">fond sombre</span>
              <DarkSegmentedStage>
                <SegmentedControl ariaLabel="Zoom monde" onChange={setSegmentWorld} options={[{ label: 'Monde', value: 'world' }, { label: 'Continent', value: 'continent' }, { label: 'Région', value: 'region' }]} tone="dark" value={segmentWorld} />
              </DarkSegmentedStage>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Stepper</h2>
          <div className="flex w-full flex-col items-stretch gap-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">tailles</span>
              <NumberStepper size="sm" value="3" />
              <NumberStepper value="24" />
              <NumberStepper size="lg" value="1.000" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">avec ±10</span>
              <NumberStepper leftControls={[{ label: '−10' }, { label: '−' }]} max={500} min={0} onChange={setStepperValue} rightControls={[{ label: '+' }, { label: '+10' }]} value={stepperValue} />
              <NumberStepper leftControls={[{ label: '−100' }, { label: '−10' }]} rightControls={[{ label: '+10' }, { label: '+100' }]} size="lg" value="1.250" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[100px] font-mono text-[10px] text-[#5d4a32]">limites</span>
              <NumberStepper leftControls={[{ disabled: true, label: '−' }]} value="0" />
              <NumberStepper rightControls={[{ disabled: true, label: '+' }]} value="MAX" valueTone="danger" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <span className="font-mono text-[10px] text-[#5d4a32]">recrutement · composer une vague</span>
          <TroopStepper
            availableLabel="Disponibles : 48 · Capacité libre : 72"
            costs={[
              { icon: '/assets/resources/wood.png', value: '720' },
              { icon: '/assets/resources/stone.png', value: '480' },
              { icon: '/assets/resources/iron.png', value: '240' },
              { icon: '/assets/resources/population.png', value: '24' },
              { icon: '/assets/clock.png', value: '1h 12m' },
            ]}
            icon="/assets/army/squire.png"
            max={72}
            name="Squire"
            onCancel={() => setTroopQuantity(0)}
            onChange={setTroopQuantity}
            quickValues={[
              { label: '0', value: 0 },
              { label: '10', value: 10 },
              { label: '25', value: 25 },
              { label: '50', value: 50 },
              { label: 'MAX (72)', max: true, value: 72 },
            ]}
            value={troopQuantity}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-game text-xs font-bold uppercase tracking-[0.15em] text-[#3d2f1f]">File de construction</h2>
            <span className="font-game text-[11px] font-bold tabular-nums text-[#5d4a32]">2 / 3 actifs</span>
          </div>
          <div className="flex w-full flex-col gap-2">
            <BuildQueueCard accelerateCost="10" icon="/assets/barracks.png" progress={72} time="2:15" title="Caserne → Niv. 2" />
            <BuildQueueCard accelerateCost="25" icon="/assets/army/squire.png" progress={40} time="1h 12m" title="Squires · ×24" tone="training" />
            <BuildQueueCard icon="/assets/lock.png" title="Slot libre · Construire" tone="idle" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Toasts</h2>
          <div className="flex w-full flex-col gap-2 bg-[#3c2619] p-[18px]">
            <ToastPreview icon="/assets/barracks.png" subtitle="Caserne · Niv. 2 prêt au combat." title="Construction terminée" />
            <ToastPreview icon="/assets/army/squire.png" subtitle="24 squires · arrivée dans 1h 12m." title="Entraînement lancé" tone="info" />
            <ToastPreview icon="/assets/resources/wood.png" subtitle="9.800 / 10.000 bois — pensez à dépenser." title="Entrepôt presque plein" tone="warning" />
            <ToastPreview icon="/assets/hand-red.png" subtitle="Sire_Robert marche sur votre village · 02:15:47." title="Attaque détectée" tone="danger" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Empty state</h2>
          <div className="grid w-full gap-3.5 sm:grid-cols-2">
            <EmptyState
              actionLabel="Recruter"
              icon="/assets/army/militia.png"
              quote="À ceux qui osent, le royaume offre gloire et richesses."
              title="Aucune armée à déployer"
            />
            <EmptyState
              icon="/assets/hand-silver.png"
              quote="Quand la trompe sonnera, c'est ici qu'arriveront vos messages."
              title="Boîte de rapports vide"
            />
            <EmptyState
              actionLabel="Voir conditions"
              actionVariant="warning"
              grayscale
              icon="/assets/watchtower.png"
              quote="Château niv. 5 requis pour scruter les terres alentours."
              title="Tour de guet verrouillée"
            />
            <EmptyState
              icon="/assets/casual-icons/card-gold.png"
              quote="Le héraut prépare votre prochaine épreuve. Patientez, sire."
              title="Aucune quête active"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Modal variants</h2>
          <div className="grid w-full gap-3.5 bg-[rgba(0,0,0,.6)] p-[18px] sm:grid-cols-2">
            <BaseModal
              footer={
                <div className="flex justify-end gap-2">
                  <BftcButton className="px-3 py-[5px] text-xs" variant="neutral">Annuler</BftcButton>
                  <BftcButton className="px-3 py-[5px] text-xs" variant="info">Confirmer</BftcButton>
                </div>
              }
              title="Base modale"
              tone="blue"
              width={360}
            >
              <p className="font-game text-xs leading-[1.4] text-[#3d2f1f]">
                Body libre via children. Le footer est optionnel et accepte n'importe quel JSX.
              </p>
            </BaseModal>
            <BaseModal tone="brown" width={360}>
              <p className="font-game text-xs leading-[1.4] text-[#3d2f1f]">
                Variante sans titre ni footer, couleur marron par défaut.
              </p>
            </BaseModal>
            <GameModal
              actions={[{ label: 'Annuler', variant: 'neutral' }, { label: 'Construire', variant: 'info' }]}
              icon="/assets/barracks.png"
              quote="« Une garnison forte garde les portes au clair de la lune. »"
              title="Construire Caserne"
              tone="info"
            >
              Améliorer la caserne au Niv. 2 ? Coût : 1.200 bois · 800 pierre · 650 fer.
            </GameModal>
            <GameModal
              actions={[{ label: 'Annuler', variant: 'neutral' }, { label: 'ATTAQUER', variant: 'danger' }]}
              icon="/assets/hand-red.png"
              title="Lancer l'attaque ?"
              tone="danger"
            >
              Vous envoyez 240 unités contre <b>Sire_Robert</b>. Cette action est irréversible.
            </GameModal>
            <GameModal
              actions={[{ label: 'Voir le rapport', variant: 'success' }]}
              icon="/assets/casual-icons/crown.png"
              subtitle="Vous avez pillé 2.400 ressources et capturé 12 prisonniers."
              title="VICTOIRE"
              tone="success"
              variant="celebration"
            />
            <GameModal
              actions={[{ label: 'Plus tard', variant: 'neutral' }, { label: 'Améliorer', variant: 'warning' }]}
              icon="/assets/resources/wood.png"
              title="Entrepôt presque plein"
              tone="warning"
            >
              Vos coffres de bois sont à 98 %. Augmentez votre entrepôt ou dépensez avant la perte de production.
            </GameModal>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Victory Modal (runtime)</h2>
          <p className="text-sm text-[#6d5838]">
            Modal monté par <code>VictoryModalHost</code> au niveau racine quand l'event WS
            <code> village.conquered</code> arrive. Le bouton CTA recentre la carte du monde sur le
            village conquis.
          </p>
          <Button variant="success" size="md" onClick={() => setVictoryModalOpen(true)}>
            Ouvrir l'aperçu
          </Button>
          <VictoryModal
            isOpen={victoryModalOpen}
            villageName="Cravia"
            x={42}
            y={88}
            onClose={() => setVictoryModalOpen(false)}
            onViewVillage={() => setVictoryModalOpen(false)}
          />
        </section>

        <section className="space-y-4">
          <InboxTabs
            onChange={setInboxTab}
            options={[
              { count: '3', label: 'Tous', value: 'all' },
              { label: 'Combats', value: 'reports' },
              { count: '1', label: 'Scouts', value: 'players' },
              { label: 'Système', value: 'system' },
            ]}
            value={inboxTab}
          />
          <div className="flex w-full flex-col gap-[5px]">
            <MailInboxItem
              alertLabel="!"
              icon="/assets/hand-red.png"
              preview="Préparez vos défenses, j'arrive sous 2h…"
              sender="Sire_Robert · [RVN]"
              subject="⚠ Vos murs trembleront avant l'aube"
              tag={{ label: 'ATTAQUE', tone: 'attack' }}
              time="il y a 4 min"
              tone="attack"
              unread
            />
            <MailInboxItem
              icon="/assets/casual-icons/crown.png"
              preview="Vos squires ont enfoncé la garnison adverse…"
              sender="Roc-d'Acier"
              subject="Pillage réussi · +2.400 butin ramené"
              tag={{ label: 'VICTOIRE', tone: 'report' }}
              time="il y a 12 min"
              tone="report"
              unread
            />
            <MailInboxItem
              icon="/assets/hand-silver.png"
              preview="Je marche vers Castelnef pour vous épauler."
              sender="Dame_Aliénor · [BFC]"
              subject="Renfort de 80 milices envoyé"
              time="9h42"
              tone="player"
              unread
            />
            <MailInboxItem
              icon="/assets/lupa.png"
              preview="Vos éclaireurs ont longé les murailles…"
              sender="Tours-Hautes"
              subject="Garnison estimée : ~168 unités"
              tag={{ label: 'ESPION', tone: 'scout' }}
              time="hier"
              tone="scout"
            />
            <MailInboxItem
              icon="/assets/casual-icons/bell-gold.png"
              preview="La saison commence le 1er des récoltes…"
              sender="Système"
              subject="Nouvelle saison · La Couronne d'Or"
              tag={{ label: 'HÉRAUT', tone: 'system' }}
              time="3j"
              tone="system"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Scout report</h2>
          <div className="flex w-full justify-center">
            <ScoutReportCard
              action={{ label: 'Attaquer' }}
              bannerIcon="/assets/lupa.png"
              metaLabel="1 retour · 0 perte"
              note="« Vos éclaireurs ont longé les murailles à l'aube — la garde paraît clairsemée du côté ouest. »"
              sections={[
                {
                  items: [
                    { icon: '/assets/lupa.png', label: 'Espion', lossValue: '-1', value: '12' },
                  ],
                  title: 'Espions — pertes',
                },
                {
                  items: [
                    { icon: '/assets/resources/wood.png', label: 'Bois', value: '8.420' },
                    { icon: '/assets/resources/stone.png', label: 'Pierre', value: '3.180' },
                    { icon: '/assets/resources/iron.png', label: 'Fer', value: '1.640' },
                    { icon: '/assets/casual-icons/coin.png', label: 'Or', value: '4.200' },
                  ],
                  title: 'Ressources visibles',
                },
                {
                  items: [
                    { icon: '/assets/army/militia.png', label: 'Milice', value: '120' },
                    { icon: '/assets/army/squire.png', label: 'Squires', value: '~48' },
                    { hidden: true, icon: '/assets/army/archer.png', label: 'Archers', value: '???' },
                    { hidden: true, icon: '/assets/army/templar.png', label: 'Templiers', value: '???' },
                  ],
                  title: 'Garnison estimée',
                },
              ]}
              targetName="Sire_Robert"
              targetPrefix="Cible"
              timeLabel="il y a 4 min"
              title="RAPPORT D'ESPIONNAGE"
              verdicts={[
                { label: 'Pillage estimé', value: '17.440' },
                { label: 'Menace · mur', tone: 'danger', value: 'Niv. 8' },
              ]}
              villageLabel="Roc-d'Acier · 238|617"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Leaderboard row</h2>
          <LeaderboardHeader />
          <div className="flex w-full flex-col gap-1">
            <LeaderboardRow
              avatarIcon="/assets/crown.png"
              delta={{ label: '▲ 3', tone: 'up' }}
              name="Dame_Aliénor"
              points="71.020"
              rank={1}
              rankTone="gold"
              subtitle="[BFC] alliée · 4 villages"
            />
            <LeaderboardRow
              avatarIcon="/assets/crown.png"
              avatarTone="gold"
              delta={{ label: '— 0', tone: 'flat' }}
              name="Sire_Vous"
              points="62.480"
              rank={2}
              rankTone="silver"
              subtitle="[BFC] · 3 villages"
            />
            <LeaderboardRow
              avatarIcon="/assets/hand-red.png"
              avatarTone="enemy"
              delta={{ label: '▲ 1', tone: 'up' }}
              name="Sire_Robert"
              points="48.210"
              rank={3}
              rankTone="bronze"
              subtitle="[RVN] · 2 villages"
            />
            <LeaderboardRow
              avatarIcon="/assets/army/templar.png"
              delta={{ label: '▼ 2', tone: 'down' }}
              name="Baron_Léofric"
              points="42.110"
              rank={4}
              subtitle="[BFC] · 3 villages"
            />
            <LeaderboardRow
              avatarIcon="/assets/army/squire.png"
              delta={{ label: '— 0', tone: 'flat' }}
              name="Comte_Henri"
              points="38.920"
              rank={5}
              subtitle="[LDR] · 2 villages"
            />
            <LeaderboardRow
              avatarIcon="/assets/army/archer.png"
              delta={{ label: '▲ 5', tone: 'up' }}
              name="Dame_Iseult"
              points="36.480"
              rank={6}
              subtitle="[BFC] · 2 villages"
            />
            <LeaderboardRow
              avatarIcon="/assets/army/militia.png"
              delta={{ label: '▼ 1', tone: 'down' }}
              name="Sire_Tristan"
              points="32.140"
              rank={7}
              subtitle="sans alliance · 1 village"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Player profile sheet</h2>
          <div className="flex w-full justify-center">
            <div className="relative h-[640px] w-full max-w-[390px] overflow-hidden rounded-2xl border-2 border-[#3c2619] bg-[radial-gradient(circle_at_50%_10%,#5d8a39,#2f5125_45%,#1a1a2e)] shadow-[0_12px_28px_rgba(60,38,25,.22)]">
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.08),rgba(0,0,0,.28))]" />
              <div className="absolute inset-0 bg-[rgba(0,0,0,.55)] backdrop-blur-[2px]" />
              <PlayerProfileSheet
                activeTab={playerProfileSheetTab}
                icons={playerProfileSheetFixture.icons}
                labels={playerProfileSheetFixture.labels}
                onClose={() => undefined}
                onLogout={() => undefined}
                onTabChange={setPlayerProfileSheetTab}
                onVillageSelect={() => undefined}
                player={playerProfileSheetFixture.player}
                settings={playerProfileSheetFixture.settings}
                stats={playerProfileSheetFixture.stats}
                villages={playerProfileSheetFixture.villages}
                world={playerProfileSheetFixture.world}
              />
            </div>
          </div>
          <h3 className="font-game text-xl font-bold text-[#1f2937]">Player profile card</h3>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <PlayerProfileCard
              avatarIcon="/assets/crown.png"
              name="Sire_Vous"
              online
              relation="self"
              selfLabel="VOUS"
              showCrown
              stats={[
                { icon: '/assets/casual-icons/crown.png', label: 'pts', value: '62.480' },
                { icon: '/assets/power.png', label: 'pwr', value: '4.250' },
                { label: '🏰', value: '3 villages' },
              ]}
              tribe={{ name: 'Les Lames du Nord', tag: 'BFC' }}
            />
            <PlayerProfileCard
              actions={[
                { label: 'Profil', variant: 'neutral' },
                { label: 'Espionner', variant: 'info' },
                { label: 'Attaquer', variant: 'danger' },
              ]}
              avatarIcon="/assets/hand-red.png"
              avatarTone="enemy"
              name="Sire_Robert"
              relation="enemy"
              stats={[
                { icon: '/assets/casual-icons/crown.png', value: '48.210' },
                { icon: '/assets/power.png', value: '2.580' },
                { label: '🏰', value: '2' },
              ]}
              tribe={{ name: 'Corbeaux Noirs', tag: 'RVN', tone: 'red' }}
            />
            <PlayerProfileCard
              actions={[
                { label: 'Profil', variant: 'neutral' },
                { label: 'Renforcer', variant: 'info' },
                { label: 'Message', variant: 'success' },
              ]}
              avatarIcon="/assets/hand-silver.png"
              avatarTone="ally"
              name="Dame_Aliénor"
              relation="ally"
              stats={[
                { icon: '/assets/casual-icons/crown.png', value: '71.020' },
                { icon: '/assets/power.png', value: '5.840' },
                { label: '🏰', value: '4' },
              ]}
              tribe={{ name: 'Alliée', tag: 'BFC' }}
            />
            <PlayerProfileCard
              avatarIcon="/assets/army/militia.png"
              avatarTone="neutral"
              name="Brigand_223"
              stats={[
                { icon: '/assets/casual-icons/crown.png', value: '1.240' },
                { icon: '/assets/power.png', value: '180' },
              ]}
              tribe={{ name: 'sans tribu', tag: '—', tone: 'stone' }}
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            <PlayerProfileCard
              avatarIcon="/assets/hand-red.png"
              compactValue="48.210"
              name="Sire_Robert"
              tribe={{ name: 'Corbeaux Noirs', tag: 'RVN' }}
              variant="compact"
            />
            <PlayerProfileCard
              avatarIcon="/assets/hand-silver.png"
              avatarTone="ally"
              compactValue="71.020"
              name="Dame_Aliénor"
              tribe={{ name: 'alliée', tag: 'BFC' }}
              variant="compact"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between font-game text-[11px] font-bold uppercase tracking-[.14em] text-[#5d4a32]">
            <span>Quêtes du jour</span>
            <span>3 / 5 · expire dans 6h 22m</span>
          </div>
          <FeaturedQuestCard
            actionLabel="Détails"
            description="Lancez une attaque réussie contre Sire_Robert avant la pleine lune. Le héraut récompensera votre audace."
            eyebrow="Quête de chapitre · IV"
            icon="/assets/casual-icons/crown.png"
            rewards={[
              { icon: '/assets/casual-icons/crown.png', value: '50' },
              { icon: '/assets/resources/iron.png', value: '2.000' },
            ]}
            title="Briser le siège de Roc-d'Acier"
          />
          <div className="flex w-full flex-col gap-2">
            <QuestMissionCard
              icon="/assets/wood.png"
              progressLabel="3.200 / 5.000"
              progressPercent={64}
              rewards={[{ icon: '/assets/casual-icons/coin.png', value: '200' }]}
              title="Récolter 5.000 bois"
            />
            <QuestMissionCard
              actionLabel="Réclamer"
              icon="/assets/army/squire.png"
              progressLabel="✓ Terminé"
              rewards={[{ icon: '/assets/casual-icons/crown.png', value: '5' }]}
              state="ready"
              title="Recruter 24 squires"
            />
            <QuestMissionCard
              icon="/assets/hand-red.png"
              progressLabel="0 / 1"
              progressPercent={0}
              rewards={[
                { icon: '/assets/resources/wood.png', value: '500' },
                { icon: '/assets/resources/stone.png', value: '500' },
              ]}
              title="Gagner 1 bataille"
            />
            <QuestMissionCard
              description="Débloque à la fin du chapitre III."
              icon="/assets/lock.png"
              rewards={[{ icon: '/assets/casual-icons/crown.png', value: '10' }]}
              state="locked"
              title="Améliorer le château au niv. 5"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">RoyalSeal</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">hud · sceau royal · variantes & états</span>
          </div>
          <div className="flex flex-col gap-5 rounded-2xl border-2 border-[#c9a882] bg-[linear-gradient(180deg,#fef9f0,#e8d4a8)] px-[22px] py-6 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_4px_0_rgba(0,0,0,.1)]">
            <div className="flex flex-wrap items-end justify-around gap-x-7 gap-y-5">
              {[
                { label: 'Repos', badge: false, halo: false },
                { label: '≥1 réclamable', badge: true, halo: true },
                { label: 'Avec total', badge: true, halo: true, count: 2 },
                { label: 'Pressé', badge: true, halo: false, pressed: true },
              ].map((sample) => (
                <div className="flex flex-col items-center gap-2" key={`wax-${sample.label}`}>
                  <RoyalSeal
                    badge={sample.badge}
                    badgeCount={sample.count ?? null}
                    halo={sample.halo}
                    pressed={sample.pressed ?? false}
                    size={56}
                  />
                  <span className="font-game text-[10px] font-extrabold uppercase tracking-[.18em] text-[#6d5838]">
                    {sample.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px bg-[rgba(93,74,50,.25)]" />
            <div className="flex flex-wrap items-end justify-around gap-x-7 gap-y-5">
              {[
                { label: 'Parchemin', badge: false, halo: false },
                { label: 'Avec dot', badge: true, halo: false },
                { label: 'Avec total', badge: true, halo: true, count: 3 },
                { label: 'Pressé', badge: false, halo: false, pressed: true },
              ].map((sample) => (
                <div className="flex flex-col items-center gap-2" key={`parch-${sample.label}`}>
                  <RoyalSeal
                    badge={sample.badge}
                    badgeCount={sample.count ?? null}
                    halo={sample.halo}
                    pressed={sample.pressed ?? false}
                    size={56}
                    variant="parchment"
                  />
                  <span className="font-game text-[10px] font-extrabold uppercase tracking-[.18em] text-[#6d5838]">
                    {sample.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px bg-[rgba(93,74,50,.25)]" />
            <div className="flex flex-wrap items-end justify-around gap-x-7 gap-y-5">
              {[
                { label: 'Couronne', badge: false, halo: false },
                { label: 'Avec dot', badge: true, halo: true },
                { label: 'Avec total', badge: true, halo: true, count: 2 },
                { label: 'Pressé', badge: true, halo: false, pressed: true },
              ].map((sample) => (
                <div className="flex flex-col items-center gap-2" key={`crown-${sample.label}`}>
                  <RoyalSeal
                    badge={sample.badge}
                    badgeCount={sample.count ?? null}
                    halo={sample.halo}
                    pressed={sample.pressed ?? false}
                    size={56}
                    variant="crown"
                  />
                  <span className="font-game text-[10px] font-extrabold uppercase tracking-[.18em] text-[#6d5838]">
                    {sample.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">DailyQuestModal</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">messagerie · devoirs royaux · modal</span>
          </div>
          <div className="flex w-full justify-center">
            <DailyQuestPhoneFrame>
              <DailyQuestModal
                claimRowLabel="Réclamer"
                closeLabel="Fermer"
                completedLabel="accomplie"
                completedSummary="1 / 3"
                eyebrow="Devoir Royal · jour 1"
                expiresInLabel="Expire à"
                expiresInValue="04h00"
                onClaim={() => undefined}
                onClose={() => undefined}
                onPrimaryAction={() => undefined}
                oyez={dailyQuestOyez}
                primaryActionLabel="Tout · 1"
                primaryActionVariant="success"
                quests={dailyQuestItems.slice(0, 3)}
                questsTodayLabel="Tâches du jour"
                rewardLabel="Récompense"
                tasksDividerLabel="Tâches du Roi"
                taskDoneLabel="✓ Tâche accomplie"
                title="Devoir royal"
              />
            </DailyQuestPhoneFrame>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">ResourceBuildingModal</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">
              village · bâtiment de ressource · dernière action: {resourceBuildingAction}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(['wood', 'stone', 'iron', 'quarter'] as ResourceBuildingKey[]).map((key) => (
              <button
                className={cn(
                  'rounded-full border px-3 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.16em]',
                  resourceBuildingKey === key
                    ? 'border-[#5d4a32] bg-[#3d2f1f] text-[#fef9f0]'
                    : 'border-[rgba(93,74,50,.3)] bg-[rgba(255,255,255,.35)] text-[#5d4a32]',
                )}
                key={key}
                onClick={() => setResourceBuildingKey(key)}
                type="button"
              >
                {resourceBuildingFixtures[key].resourceLabel}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 font-game text-[11px] font-bold uppercase tracking-[.14em] text-[#5d4a32]">
            <label className="flex items-center gap-2">
              Niveau
              <input
                className="w-32 accent-[#5d4a32]"
                max={5}
                min={1}
                onChange={(event) => setResourceBuildingLevel(Number(event.target.value))}
                step={1}
                type="range"
                value={resourceBuildingLevel}
              />
              <span>{resourceBuildingLevel >= 5 ? 'max.' : `${resourceBuildingLevel} → ${resourceBuildingLevel + 1}`}</span>
            </label>
            <select
              className="rounded-lg border border-[rgba(93,74,50,.35)] bg-[#fef9f0] px-2 py-1 text-[#3d2f1f]"
              onChange={(event) => setResourceBuildingLink(event.target.value as ResourceBuildingLinkVariant)}
              value={resourceBuildingLink}
            >
              <option value="chevron">Chevron</option>
              <option value="arrow-pill">Pastille</option>
              <option value="rule">Règle +N</option>
              <option value="rail">Rail</option>
              <option value="none">Aucun</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                checked={resourceBuildingConstructing}
                className="accent-[#5d4a32]"
                onChange={(event) => setResourceBuildingConstructing(event.target.checked)}
                type="checkbox"
              />
              Construction
            </label>
          </div>
          <div className="flex w-full justify-center">
            <ResourceBuildingPhoneFrame buildingIcon={resourceBuildingFixtures[resourceBuildingKey].buildingIcon}>
              <ResourceBuildingModal
                {...resourceBuildingModalFixture}
                construction={
                  resourceBuildingConstructing
                    ? {
                        cancelLabel: 'Annuler la construction',
                        state: {
                          progressPercent: 99,
                          remainingLabel: '19s restant',
                        },
                      }
                    : undefined
                }
                cost={resourceBuildingUpgrade.cost}
                level={resourceBuildingLevel}
                levelStats={getResourceBuildingLevelStats(resourceBuildingKey)}
                linkVariant={resourceBuildingLink}
                onAction={(action) => setResourceBuildingAction(action.label)}
                onClose={() => undefined}
                onUpgrade={() => undefined}
                upgradeTime={resourceBuildingUpgrade.time}
              />
            </ResourceBuildingPhoneFrame>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">CombatReportModal</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">
              messagerie · rapport de combat · dernière action: {combatReportAction}
            </span>
          </div>
          <div className="flex w-full flex-wrap items-start justify-center gap-7">
            <div className="flex flex-col items-center gap-2.5">
              <span className="rounded-full border border-[rgba(126,199,78,.4)] px-2.5 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.28em] text-[#3a6c1f]">
                Variante · Victoire (pillage)
              </span>
              <CombatReportPhoneFrame outcome="win">
                <CombatReportModal
                  {...combatReportWin}
                  actions={[
                    { id: 'details', label: 'Détails', tone: 'neutral' },
                    { id: 'share', label: 'Partager', tone: 'success' },
                  ]}
                  labels={combatReportLabels}
                  onAction={(action) => setCombatReportAction(`Victoire: ${action.label}`)}
                />
              </CombatReportPhoneFrame>
            </div>
            <div className="flex flex-col items-center gap-2.5">
              <span className="rounded-full border border-[rgba(231,76,60,.4)] px-2.5 py-1 font-game text-[10px] font-extrabold uppercase tracking-[.28em] text-[#a93226]">
                Variante · Défaite (défense)
              </span>
              <CombatReportPhoneFrame outcome="lose">
                <CombatReportModal
                  {...combatReportLose}
                  actions={[
                    { id: 'details', label: 'Détails', tone: 'neutral' },
                    { id: 'retaliate', label: 'Riposter', tone: 'danger' },
                  ]}
                  labels={combatReportLabels}
                  onAction={(action) => setCombatReportAction(`Défaite: ${action.label}`)}
                />
              </CombatReportPhoneFrame>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">TroopDetailModal</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">caserne · détail de troupe</span>
          </div>
          <div className="flex w-full justify-center">
            <TroopDetailPhoneFrame>
              <TroopDetailModal
                archetype={troopDetailFixture.archetype}
                closeLabel={troopDetailFixture.closeLabel}
                cost={troopDetailFixture.cost}
                fieldMax={TROOP_DETAIL_FIELD_MAX}
                labels={TROOP_DETAIL_LABELS_FR}
                name={troopDetailFixture.name}
                onClose={() => undefined}
                populationCost={troopDetailFixture.populationCost}
                portraitSrc={troopDetailFixture.portraitSrc}
                roleLabel={troopDetailFixture.roleLabel}
                stats={troopDetailFixture.stats}
                stock={troopDetailFixture.stock}
                tagline={troopDetailFixture.tagline}
                tierBadge={troopDetailFixture.tierBadge}
                trainingTime={troopDetailFixture.trainingTime}
              />
            </TroopDetailPhoneFrame>
          </div>
        </section>

        <section className="space-y-4">
          <span className="font-mono text-[10px] text-[#5d4a32]">caserne · répertoire</span>
          <div className="flex w-full flex-col gap-1.5">
            <TroopRow
              actionLabel="Recruter"
              icon="/assets/army/militia.png"
              name="Milice"
              quantity="120"
              quantityLabel="casernées"
              stats={[
                { label: '⚔', tone: 'attack', value: '10' },
                { label: '🛡', tone: 'defense', value: '15' },
                { label: '👣', value: '18 m/km' },
                { label: '📦', value: '25' },
              ]}
            />
            <TroopRow
              actionLabel="Recruter"
              icon="/assets/army/squire.png"
              name="Squire"
              quantity="48"
              quantityLabel="casernées"
              stats={[
                { label: '⚔', tone: 'attack', value: '25' },
                { label: '🛡', tone: 'defense', value: '15' },
                { label: '👣', value: '18 m/km' },
                { label: '📦', value: '30' },
              ]}
            />
            <TroopRow
              actionLabel="+10"
              actionVariant="info"
              icon="/assets/army/archer.png"
              name="Archer"
              quantity="22"
              quantityLabel="casernées"
              stats={[
                { label: '⚔', tone: 'attack', value: '40' },
                { label: '🛡', tone: 'defense', value: '10' },
                { label: '👣', value: '15 m/km' },
                { label: '📦', value: '20' },
              ]}
            />
            <TroopRow
              actionLabel="Recruter"
              icon="/assets/army/templar.png"
              name="Templier"
              quantity="0"
              quantityLabel="casernées"
              stats={[
                { label: '⚔', tone: 'attack', value: '120' },
                { label: '🛡', tone: 'defense', value: '90' },
                { label: '👣', value: '10 m/km' },
                { label: '📦', value: '10' },
              ]}
            />
            <TroopRow
              actionLabel="Verrouillé"
              actionVariant="neutral"
              icon="/assets/army/savage.png"
              locked
              name="Sauvage"
              quantity="—"
              stats={[{ label: '🔒 Caserne niv. 5 requise', tone: 'locked' }]}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-game text-2xl font-bold text-[#1f2937]">VillageMapPanel</h2>
            <span className="font-mono text-[10px] text-[#5d4a32]">carte monde · popover village · 4 variantes</span>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#5d4a32]">mine</span>
              <div className="relative flex justify-center rounded-lg bg-[#1a1a2e] p-7" style={{ width: 380 }}>
                <VillageMapPanel
                  variant="mine"
                  name="Castelfort"
                  coords="271 | 230"
                  typeTag="mine"
                  owner="airstyle59"
                  villagePower={312}
                  ownerPower={1240}
                  intel={{
                    loot: { wood: 8420, stone: 6900, iron: 5310 },
                    wall: 4,
                    style: 'Forteresse',
                    army: [
                      { icon: '/assets/army/militia.png', count: 120, category: 'inf', name: 'Milicien' },
                      { icon: '/assets/army/archer.png', count: 64, category: 'tir', name: 'Archer' },
                      { icon: '/assets/army/squire.png', count: 40, category: 'inf', name: 'Écuyer' },
                      { icon: '/assets/army/savage.png', count: 12, category: 'spe', name: 'Mercenaire' },
                      { icon: '/assets/army/templar.png', count: 9, category: 'eli', name: 'Templier' },
                    ],
                  }}
                  onClose={() => {}}
                  onEnter={() => {}}
                  onSendResources={() => {}}
                  onReinforce={() => {}}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#5d4a32]">unscouted</span>
              <div className="relative flex justify-center rounded-lg bg-[#1a1a2e] p-7" style={{ width: 380 }}>
                <VillageMapPanel
                  variant="unscouted"
                  name="Bourg-le-Comte"
                  coords="258 | 241"
                  typeTag="player"
                  owner="DarkLord_88"
                  villagePower={410}
                  ownerPower={2890}
                  onClose={() => {}}
                  onScout={() => {}}
                  onAttack={() => {}}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#5d4a32]">scouted · attaque bloquée</span>
              <div className="relative flex justify-center rounded-lg bg-[#1a1a2e] p-7" style={{ width: 380 }}>
                <VillageMapPanel
                  variant="scouted"
                  name="QA Refacto"
                  coords="263 | 234"
                  typeTag="player"
                  owner="Joueur_nu001t"
                  villagePower={195}
                  ownerPower={1240}
                  attackBlocked={true}
                  attackBlockedReason="Puissance trop faible"
                  intel={{
                    freshness: { ago: '2 min', fresh: true },
                    loot: { wood: 3000, stone: 3000, iron: 3000 },
                    wall: 0,
                    style: 'Économique',
                    army: [
                      { icon: '/assets/army/militia.png', count: 48, category: 'inf', name: 'Milicien' },
                      { icon: '/assets/army/archer.png', count: 22, category: 'tir', name: 'Archer' },
                      { icon: '/assets/army/squire.png', count: 14, category: 'inf', name: 'Écuyer' },
                      { icon: '/assets/army/savage.png', count: 6, category: 'spe', name: 'Mercenaire' },
                      { icon: '/assets/army/templar.png', count: 3, category: 'eli', name: 'Templier' },
                    ],
                  }}
                  onClose={() => {}}
                  onScout={() => {}}
                  onViewReport={() => {}}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#5d4a32]">barbare · tier 3</span>
              <div className="relative flex justify-center rounded-lg bg-[#1a1a2e] p-7" style={{ width: 380 }}>
                <VillageMapPanel
                  variant="barbare"
                  name="Camp barbare"
                  coords="266 | 239"
                  typeTag="pvm"
                  owner={null}
                  villagePower={88}
                  tier={3}
                  onClose={() => {}}
                  onScout={() => {}}
                  onAttack={() => {}}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Chat bubble · alliance chat</h2>
          <ChatPanel
            emblemIcon="/assets/casual-icons/crown.png"
            inputValue={inputValue}
            messages={messages}
            onInputChange={setInputValue}
            onSubmit={() => {
              const nextMessage = inputValue.trim();
              if (!nextMessage) return;
              setMessages((current) => [
                ...current,
                {
                  id: `local-${current.length}`,
                  message: nextMessage,
                  sender: 'Vous',
                  time: 'maintenant',
                  type: 'self',
                },
              ]);
              setInputValue('');
            }}
            selfAvatarIcon="/assets/icons/crown.png"
            subtitle="24 membres · 6 en ligne"
            title="[BFC] Les Lames du Nord"
          />
        </section>
      </div>
    </main>
  );
}
