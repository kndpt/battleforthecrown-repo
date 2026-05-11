import {
  AchievementCard,
  ActiveBoostList,
  AllianceBanner,
  AllianceRow,
  ArmyMarchMarker,
  ArmyMovementRow,
  Avatar,
  Badge,
  BannerTitle,
  BftcButton,
  BoostPill,
  BottomNavPreview,
  BuildQueueCard,
  ChatPanel,
  CombatReportCard,
  CombatReportMiniList,
  CoordinateInput,
  CostPill,
  CostRow,
  DailyReward,
  DigitTimer,
  Divider,
  EmptyState,
  FeaturedQuestCard,
  GameInput,
  GameModal,
  HeaderBar,
  HeraldicShield,
  IconButton,
  InfoCard,
  LeaderboardRow,
  LevelChip,
  MailInboxItem,
  MapCallout,
  MapDot,
  MapMarker,
  MiniCard,
  NumberStepper,
  PipRating,
  PlayerProfileCard,
  PowerComparison,
  PremiumBundle,
  ProgressBar,
  QuestCard,
  RequirementChip,
  ResourceHud,
  ScoutReport,
  SegmentedControl,
  ShopTile,
  Timer,
  ToastPreview,
  TroopRow,
  TroopStepper,
  type ToastPreviewProps,
  type ResourceHudItem,
  type ChatMessage,
  type CoordinateValue,
} from './components';
import { Hammer, Lock, Mail, Plus, ScrollText, Settings, Shield, Swords, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';

const resourceRows: ResourceHudItem[][] = [
  [
    { icon: '/assets/resources/wood.png', value: '8.500', label: '+120/h · /10.000' },
    { icon: '/assets/resources/stone.png', value: '3.200', label: '+80/h · /5.000' },
    { icon: '/assets/resources/iron.png', value: '1.500', label: '+50/h · /8.000' },
    { icon: '/assets/resources/population.png', value: '120 / 200', label: 'villageois' },
  ],
  [
    { icon: '/assets/resources/wood.png', value: '9.800', label: 'presque plein', low: true },
    { icon: '/assets/resources/stone.png', value: '150', label: '+5/h · faible', low: true },
    { icon: '/assets/crown.png', value: '28', label: 'couronnes' },
  ],
];

const bottomNavItems = [
  { id: 'army', label: 'Armée', Icon: Swords },
  { id: 'buildings', label: 'Bâtiments', Icon: Hammer },
  { id: 'messages', label: 'Messages', Icon: Mail, badge: 3 },
  { id: 'world', label: 'Monde', Icon: Lock, locked: true },
];

const troopStepperBaseData = {
  availableLabel: 'Disponibles : 48 · Capacité libre : 72',
  costs: [
    { icon: '/assets/resources/wood.png', value: '720' },
    { icon: '/assets/resources/iron.png', value: '240' },
    { icon: '/assets/resources/population.png', value: '24' },
    { icon: '/assets/clock.png', value: '1h 12m' },
  ],
  icon: '/assets/army/squire.png',
  max: 72,
  name: 'Squire',
  quickValues: [
    { label: '0', value: 0 },
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: 'MAX (72)', value: 72, isMax: true },
  ],
};

const initialToasts: ToastPreviewProps[] = [
  {
    icon: '/assets/barracks.png',
    subtitle: 'Caserne · Niv. 2 prêt au combat.',
    title: 'Construction terminée',
  },
  {
    icon: '/assets/army/squire.png',
    subtitle: '24 squires · arrivée dans 1h 12m.',
    title: 'Entraînement lancé',
    tone: 'info',
  },
  {
    icon: '/assets/resources/wood.png',
    subtitle: '9.800 / 10.000 bois — pensez à dépenser.',
    title: 'Entrepôt presque plein',
    tone: 'warning',
  },
  {
    icon: '/assets/hand-red.png',
    subtitle: 'Sire_Robert marche sur votre village · 02:15:47.',
    title: 'Attaque détectée',
    tone: 'danger',
  },
];

const combatReport = {
  actions: [
    { label: 'Partager', variant: 'neutral' as const },
    { label: 'Détails', variant: 'info' as const },
  ],
  attacker: { name: 'Vous', location: 'Castelnef · 234|612' },
  defender: { name: 'Sire_Robert', location: "Roc-d'Acier · 238|617" },
  icon: '/assets/casual-icons/crown.png',
  loot: [
    { icon: '/assets/resources/wood.png', value: '1.240' },
    { icon: '/assets/resources/stone.png', value: '820' },
    { icon: '/assets/resources/iron.png', value: '340' },
    { icon: '/assets/casual-icons/coin.png', value: '1.200' },
  ],
  outcome: 'win' as const,
  title: 'VICTOIRE',
  troopColumns: [
    {
      title: 'Attaquant — pertes',
      troops: [
        { icon: '/assets/army/squire.png', sent: '120', lost: '−18' },
        { icon: '/assets/army/archer.png', sent: '60', lost: '−4' },
      ],
    },
    {
      title: 'Défenseur — pertes',
      troops: [
        { icon: '/assets/army/militia.png', sent: '80', lost: '−80' },
        { icon: '/assets/army/templar.png', sent: '5', lost: '−5' },
      ],
    },
  ],
};

const combatReportMinis = [
  { badge: 'V', title: "Pillage · Roc-d'Acier", subtitle: 'Il y a 12 min · +2.400 G ramenés', value: '−22' },
  { badge: 'D', lost: true, title: 'Défense · Castelnef', subtitle: 'Il y a 1h · Dame_Aliénor', value: '−240' },
  { badge: 'E', title: 'Espionnage · Tours-Hautes', subtitle: 'Il y a 3h · 1 éclaireur revenu', value: '+info' },
];

const coordinateHistory = [
  { label: 'Capitale', x: 234, y: 612 },
  { label: 'Avant-poste', x: 238, y: 617 },
  { label: 'Fer', x: 229, y: 604 },
];

const leaderboardRows = [
  {
    avatar: { crown: true, initials: 'AR', tone: 'red' as const },
    delta: 'flat' as const,
    name: 'Arthur',
    points: '128k',
    rank: 1,
    tribe: 'RDR',
  },
  {
    avatar: { initials: 'AL', status: 'online' as const, tone: 'green' as const },
    delta: 'up' as const,
    name: 'Aliénor',
    points: '115k',
    rank: 2,
    tribe: 'LYS',
  },
  {
    avatar: { initials: 'VO', tone: 'blue' as const },
    delta: 'down' as const,
    name: 'Vous',
    points: '102k',
    rank: 3,
    self: true,
    tribe: 'BFTC',
  },
  {
    avatar: { initials: 'RB', status: 'attack' as const, tone: 'red' as const },
    delta: 'up' as const,
    name: 'Sire_Robert',
    points: '99k',
    rank: 4,
    tribe: 'WOL',
  },
];

const mailItems = [
  {
    avatar: { icon: '/assets/hand-red.png', tone: 'red' as const },
    badge: 'Attaque',
    preview: 'Une armée ennemie marche vers Castelnef.',
    sender: 'Tour de guet',
    subject: 'Alerte militaire',
    time: '02:15',
    type: 'attack' as const,
    unread: true,
  },
  {
    avatar: { icon: '/assets/casual-icons/crown.png', tone: 'green' as const },
    badge: 'Rapport',
    preview: '+2.400 ressources ramenées.',
    sender: 'Héraut',
    subject: "Pillage · Roc-d'Acier",
    time: '12 min',
    type: 'report' as const,
  },
  {
    avatar: { initials: 'AL', tone: 'purple' as const },
    badge: 'MP',
    preview: 'On synchronise le soutien à 21h.',
    sender: 'Dame_Aliénor',
    subject: 'Défense groupée',
    time: '1h',
    type: 'player' as const,
    unread: true,
  },
];

const initialChatMessages: ChatMessage[] = [
  { id: 'system-1', message: 'Dame_Aliénor a rejoint le canal.', type: 'system' },
  {
    avatar: { initials: 'AL', status: 'online', tone: 'purple' },
    id: 'm-1',
    message: 'Soutien prêt sur Castelnef.',
    role: 'Officier',
    sender: 'Aliénor',
    time: '20:14',
    type: 'other',
  },
  { id: 'm-2', message: 'Je lance les squires maintenant.', time: '20:15', type: 'self' },
  {
    avatar: { initials: 'RB', status: 'attack', tone: 'red' },
    id: 'm-3',
    message: 'Ping sur 238|617, activité ennemie.',
    sender: 'Robert',
    time: '20:16',
    type: 'other',
  },
];

const previewSectionClass = 'space-y-4';
const previewTitleClass = 'font-game text-2xl font-bold text-[#1f2937]';

export function DesignSystemPreview() {
  const [activeTab, setActiveTab] = useState('buildings');
  const [troopQuantity, setTroopQuantity] = useState(24);
  const [toasts, setToasts] = useState(initialToasts);
  const [queueMessage, setQueueMessage] = useState('Aucune action lancée.');
  const [filter, setFilter] = useState('all');
  const [coordinates, setCoordinates] = useState<CoordinateValue>({ x: 234, y: 612 });
  const [selectedMarker, setSelectedMarker] = useState('Castelnef');
  const [genericAmount, setGenericAmount] = useState(20);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [lordName, setLordName] = useState('Sire Kelvin');
  const [realmName, setRealmName] = useState('Le Grand Nord');
  const [password, setPassword] = useState('secret');
  const [modalOpen, setModalOpen] = useState(true);

  const troopStepperCosts = [
    { icon: '/assets/resources/wood.png', value: String(troopQuantity * 30) },
    { icon: '/assets/resources/iron.png', value: String(troopQuantity * 10) },
    { icon: '/assets/resources/population.png', value: String(troopQuantity) },
    { icon: '/assets/clock.png', value: troopQuantity > 0 ? `${Math.max(1, Math.ceil(troopQuantity * 3))}m` : '0m' },
  ];

  return (
    <main className="min-h-full overflow-y-auto bg-[#f5e6d3] px-4 py-6 text-[#1f2937]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="space-y-2">
          <p className="font-game text-sm font-semibold uppercase tracking-[0.3em] text-[#5d4a32]">
            Battle for the Crown
          </p>
          <h1 className="font-game text-4xl font-bold leading-tight text-[#1f2937]">Design system React</h1>
          <p className="max-w-2xl font-game text-sm leading-6 text-[#4b5563]">
            Portage React/Tailwind des références HTML. Cette page sert de sas de validation
            avant migration des composants de jeu.
          </p>
        </header>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Gradient buttons</h2>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">5 variants</span>
              <BftcButton>OK</BftcButton>
              <BftcButton variant="info">ACCEPTER</BftcButton>
              <BftcButton variant="danger">NON</BftcButton>
              <BftcButton variant="warning">ATTENTION</BftcButton>
              <BftcButton variant="neutral">Retour</BftcButton>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">sm/md/lg</span>
              <BftcButton size="xs">Small</BftcButton>
              <BftcButton variant="info">Medium</BftcButton>
              <BftcButton size="lg" variant="warning">
                Large
              </BftcButton>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">states</span>
              <BftcButton>Default</BftcButton>
              <BftcButton className="brightness-110">Hover</BftcButton>
              <BftcButton className="translate-y-0.5 shadow-game-pressed">Pressed</BftcButton>
              <BftcButton disabled>Disabled</BftcButton>
            </div>
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Resource HUD</h2>
          <div className="flex flex-col gap-2.5 bg-gradient-to-b from-[#3c2619] to-[#5d4a32]">
            {resourceRows.map((row, index) => (
              <ResourceHud key={index} items={row} />
            ))}
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Bottom navigation</h2>
          <div className="bg-[#5b8f3a]">
            <BottomNavPreview
              active={activeTab}
              items={bottomNavItems.map((item) => ({
                ...item,
                onClick: item.locked ? undefined : () => setActiveTab(item.id),
              }))}
            />
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Atomes · temps, coûts, conditions</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">badges</span>
              <Badge>Défaut</Badge>
              <Badge tone="success">Succès</Badge>
              <Badge tone="info">Info</Badge>
              <Badge tone="warning">Alerte</Badge>
              <Badge tone="danger">Danger</Badge>
              <Badge tone="neutral">Neutre</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">segment</span>
              <SegmentedControl
                ariaLabel="Filtre rapports"
                onChange={setFilter}
                options={[
                  { icon: <ScrollText size={14} />, label: 'Tous', value: 'all' },
                  { badge: <Badge size="sm" tone="danger">2</Badge>, icon: <Swords size={14} />, label: 'Attaques', value: 'attack' },
                  { icon: <Shield size={14} />, label: 'Défense', value: 'defense' },
                ]}
                value={filter}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">stepper</span>
              <NumberStepper ariaLabel="Quantité générique" className="w-full max-w-[320px]" max={100} onChange={setGenericAmount} value={genericAmount} />
            </div>
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
              <Timer variant="blue">Entraînement</Timer>
              <Timer urgent variant="red">
                0:12
              </Timer>
              <Timer showIcon={false} variant="stone">
                ⏸ En pause
              </Timer>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">attaque dans</span>
              <DigitTimer parts={['02', '15', '47']} />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">mega</span>
              <Timer size="mega" urgent variant="red">
                00:12
              </Timer>
            </div>

            <div className="h-px bg-[#8b7355]/30" />

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">inline</span>
              <CostRow>
                <CostPill icon="/assets/resources/wood.png" value="200" />
                <CostPill icon="/assets/resources/stone.png" value="150" />
                <CostPill icon="/assets/resources/iron.png" value="80" />
                <CostPill icon="/assets/resources/population.png" value="5" />
              </CostRow>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">manque</span>
              <CostRow>
                <CostPill icon="/assets/resources/wood.png" value="200" />
                <CostPill current="320" icon="/assets/resources/stone.png" insufficient value="1.500" />
                <CostPill current="150" icon="/assets/resources/iron.png" insufficient value="800" />
              </CostRow>
            </div>

            <div className="rounded-xl border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#f5e6d3] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
              <h3 className="mb-1.5 font-game text-xs font-bold uppercase tracking-[0.15em] text-[#5d4a32]">
                Coût · Caserne → Niv. 2
              </h3>
              <CostRow>
                <CostPill icon="/assets/resources/wood.png" size="lg" value="1.200" />
                <CostPill icon="/assets/resources/stone.png" size="lg" value="800" />
                <CostPill current="420" icon="/assets/resources/iron.png" insufficient size="lg" value="650" />
                <CostPill icon="/assets/resources/population.png" size="lg" value="8" />
                <CostPill icon="/assets/clock.png" size="lg" value="12m" />
              </CostRow>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">états</span>
              <RequirementChip icon="/assets/lock.png">Château niv. 5 requis</RequirementChip>
              <RequirementChip icon="/assets/lock.png" state="soon">
                Caserne niv. 3 requise
              </RequirementChip>
              <RequirementChip icon="/assets/castle.png" state="current">
                Château niv. 4 / 5
              </RequirementChip>
              <RequirementChip icon="/assets/barracks.png" state="done">
                Caserne niv. 3 ✓
              </RequirementChip>
            </div>
            <div className="rounded-xl border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#f5e6d3] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
              <h3 className="mb-1.5 font-game text-[11px] font-bold uppercase tracking-[0.15em] text-[#5d4a32]">
                Conditions · Atelier de siège
              </h3>
              <div className="flex flex-col gap-1">
                <RequirementChip className="w-full pr-3" icon="/assets/castle.png" state="done" status="✓ rempli">
                  Château niv. 5
                </RequirementChip>
                <RequirementChip className="w-full pr-3" icon="/assets/barracks.png" state="done" status="✓ rempli">
                  Caserne niv. 3
                </RequirementChip>
                <RequirementChip className="w-full pr-3" icon="/assets/iron.png" state="current" status="3 / 4">
                  Mine de fer niv. 4
                </RequirementChip>
                <RequirementChip className="w-full pr-3" icon="/assets/warehouse.png" status="1 / 6">
                  Entrepôt niv. 6
                </RequirementChip>
              </div>
            </div>
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Atomes · progression</h2>
          <div className="flex flex-col gap-3.5">
            <ProgressBar label="Construction · Caserne Niv. 2" suffix="72%" value={72} variant="gold" />
            <ProgressBar label="Entraînement · 24 squires" suffix="40%" value={40} />
            <ProgressBar label="Santé du village" suffix="22 / 100" value={22} variant="red" />
          </div>
        </section>

        <section className={previewSectionClass}>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-game text-xs font-bold uppercase tracking-[0.15em] text-[#3d2f1f]">
              File de construction
            </h2>
            <span className="font-game text-[11px] font-bold tabular-nums text-[#5d4a32]">2 / 3 actifs</span>
          </div>
          <div className="flex flex-col gap-2">
            <BuildQueueCard
              accelerateCost="10"
              icon="/assets/barracks.png"
              onAccelerate={() => setQueueMessage('Accélération construction demandée.')}
              onCancel={() => setQueueMessage('Annulation construction demandée.')}
              progress={72}
              title="Caserne → Niv. 2"
              time="2:15"
            />
            <BuildQueueCard
              accelerateCost="25"
              icon="/assets/army/squire.png"
              kind="training"
              onAccelerate={() => setQueueMessage('Accélération entraînement demandée.')}
              onCancel={() => setQueueMessage('Annulation entraînement demandée.')}
              progress={40}
              title="Squires · ×24"
              time="1h 12m"
            />
            <BuildQueueCard icon="/assets/lock.png" kind="idle" title="Slot libre · Construire" />
            <p className="font-game text-[11px] text-[#6d5838]">{queueMessage}</p>
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Feedback · toasts</h2>
          <div className="flex flex-col gap-2 bg-[#3c2619]">
            {toasts.map((toast) => (
              <ToastPreview
                key={toast.title}
                {...toast}
                onClose={() => setToasts((current) => current.filter((item) => item.title !== toast.title))}
              />
            ))}
            {toasts.length === 0 ? (
              <BftcButton onClick={() => setToasts(initialToasts)} variant="warning">
                Réafficher les toasts
              </BftcButton>
            ) : null}
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Feedback · empty states</h2>
          <div className="grid gap-3.5 md:grid-cols-2">
            <EmptyState
              actionLabel="Recruter"
              icon="/assets/army/militia.png"
              onAction={() => setTroopQuantity(10)}
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
              icon="/assets/watchtower.png"
              mutedIcon
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

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Militaire · troop rows</h2>
          <div className="flex flex-col gap-1.5">
            <TroopRow
              actionLabel="Recruter"
              icon="/assets/army/militia.png"
              name="Milice"
              quantity="120"
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
              stats={[
                { label: '⚔', tone: 'attack', value: '40' },
                { label: '🛡', tone: 'defense', value: '10' },
                { label: '👣', value: '15 m/km' },
                { label: '📦', value: '20' },
              ]}
            />
            <TroopRow
              actionLabel="Verrouillé"
              actionVariant="neutral"
              icon="/assets/army/savage.png"
              locked
              name="Sauvage"
              quantity="—"
              stats={[{ label: '🔒', tone: 'neutral', value: 'Caserne niv. 5 requise' }]}
            />
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Militaire · troop stepper</h2>
          <TroopStepper
            {...troopStepperBaseData}
            costs={troopStepperCosts}
            onCancel={() => setTroopQuantity(0)}
            onConfirm={() => setQueueMessage(`Recrutement ×${troopQuantity} demandé.`)}
            onQuantityChange={setTroopQuantity}
            quantity={troopQuantity}
            submitLabel={`RECRUTER ×${troopQuantity}`}
          />
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Combat · reports</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <CombatReportCard {...combatReport} />
            <div className="flex flex-col gap-2">
              <CombatReportMiniList items={combatReportMinis} />
            </div>
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Carte · coordonnées & marqueurs</h2>
          <div className="flex flex-wrap items-center gap-8 py-2">
            <span className="min-w-[120px] font-mono text-sm text-[#5d4a32]">marches</span>
            <ArmyMarchMarker eta="2:15" icon="/assets/hand-red.png" label="Attaque entrante" tone="attack" />
            <ArmyMarchMarker eta="0:48" icon="/assets/army/templar.png" label="Marche sortante" tone="out" />
            <ArmyMarchMarker eta="5:32" icon="/assets/hand-silver.png" label="Soutien allié" tone="support" />
            <ArmyMarchMarker eta="1:04" icon="/assets/army/squire.png" label="Retour" tone="return" />
          </div>
          <div className="grid gap-3 md:grid-cols-[320px_1fr]">
            <CoordinateInput
              error={coordinates.x > 999 || coordinates.y > 999 ? 'Coordonnées hors monde.' : undefined}
              history={coordinateHistory}
              onChange={setCoordinates}
              onSubmit={(value) => setQueueMessage(`Carte centrée sur ${value.x}|${value.y}.`)}
              value={coordinates}
            />
            <div className="relative min-h-[320px] overflow-hidden rounded-[18px] border-[4px] border-[#3d2f1f] bg-[radial-gradient(ellipse_at_60%_40%,#a8d28d_0%,#7d9d6e_22%,#5d6e58_42%,#3d4f60_78%)] shadow-[inset_0_0_28px_rgba(0,0,0,.56)]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.055)_1px,transparent_1px)] bg-[length:42px_42px]" />
              <MapMarker
                className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2"
                icon="/assets/casual-icons/crown.png"
                label="Bastion"
                onClick={() => setSelectedMarker('Bastion')}
                selected={selectedMarker === 'Bastion'}
                tone="tribe"
              />
              <span className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[32px] rounded bg-black/55 px-1.5 py-0.5 font-mono text-xs text-[#fef9f0]">
                Bastion · 234|612
              </span>
              <MapMarker
                className="absolute left-[28%] top-[34%] -translate-x-1/2 -translate-y-1/2"
                icon="/assets/hand-silver.png"
                label="Dame_Aliénor"
                onClick={() => setSelectedMarker('Dame_Aliénor')}
                selected={selectedMarker === 'Dame_Aliénor'}
                size="sm"
                tone="ally"
              />
              <span className="absolute left-[28%] top-[34%] translate-x-[-50%] translate-y-[26px] rounded bg-black/55 px-1.5 py-0.5 font-mono text-xs text-[#fef9f0]">
                [BFC] Dame_Aliénor
              </span>
              <MapMarker
                className="absolute left-[75%] top-[68%] -translate-x-1/2 -translate-y-1/2"
                icon="/assets/hand-red.png"
                label="Sire_Corbeau"
                onClick={() => setSelectedMarker('Sire_Corbeau')}
                selected={selectedMarker === 'Sire_Corbeau'}
                size="sm"
                tone="enemy"
              />
              <span className="absolute left-[75%] top-[68%] translate-x-[-50%] translate-y-[26px] rounded bg-black/55 px-1.5 py-0.5 font-mono text-xs text-[#fef9f0]">
                [RVN] Sire_Corbeau
              </span>
              <MapMarker
                className="absolute left-[18%] top-[72%] -translate-x-1/2 -translate-y-1/2"
                icon="/assets/world/entity/barbarian-village-tier2.png"
                label="Camp barbare T2"
                onClick={() => setSelectedMarker('Camp barbare')}
                selected={selectedMarker === 'Camp barbare'}
                size="sm"
                tier={2}
                tone="barbarian"
              />
              <MapMarker
                className="absolute left-[64%] top-[24%] -translate-x-1/2 -translate-y-1/2"
                icon="/assets/world/entity/barbarian-village-tier3.png"
                label="Camp barbare T5"
                onClick={() => setSelectedMarker('Camp barbare')}
                selected={selectedMarker === 'Camp barbare'}
                size="sm"
                tier={5}
                tone="barbarian"
              />
              <MapMarker
                className="absolute left-[42%] top-[80%] -translate-x-1/2 -translate-y-1/2"
                icon="/assets/world/entity/barbarian-village-tier3.png"
                label="Camp barbare T3"
                onClick={() => setSelectedMarker('Camp barbare')}
                selected={selectedMarker === 'Camp barbare'}
                size="sm"
                tier={3}
                tone="barbarian"
              />
              <div className="absolute left-[14%] top-[18%]"><MapDot label="Allié éloigné" tone="ally" /></div>
              <div className="absolute left-[88%] top-[42%]"><MapDot label="Ennemi éloigné" tone="enemy" /></div>
              <div className="absolute left-[88%] top-[84%]"><MapDot label="Barbare éloigné" tone="barbarian" /></div>
              <div className="absolute left-[8%] top-[48%]"><MapDot label="PNA éloigné" tone="nap" /></div>
              <div className="absolute left-[62%] top-[56%] -translate-x-1/2 -translate-y-1/2">
                <ArmyMarchMarker eta="2:15" icon="/assets/hand-red.png" label="Attaque entrante" tone="attack" />
              </div>
              <div className="absolute left-[40%] top-[42%] -translate-x-1/2 -translate-y-1/2">
                <ArmyMarchMarker eta="0:48" icon="/assets/army/templar.png" label="Marche sortante" tone="out" />
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <MapCallout
              actions={[
                { label: '⚔ Attaquer', variant: 'danger' },
                { label: '👁 Espionner', variant: 'info' },
              ]}
              coordinates="312|488"
              levelLabel="🏰 Niv. 6"
              owner="Inhabité · pillable"
              points="8.420"
              tierLabel="T4 OR"
              title="★ Camp barbare"
            />
            <MapCallout
              actions={[
                { label: '🛡 Soutenir', variant: 'success' },
                { label: '✉ Message', variant: 'info' },
              ]}
              coordinates="312|490"
              levelLabel="🏰 Château Niv. 4"
              owner="Sire_Robert · [BFC] allié"
              points="12.480"
              title="Roc-d'Acier"
            />
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Social · avatars, profils, classement</h2>
          <div className="flex flex-wrap items-end gap-3">
            <Avatar crown initials="AR" level={92} size="xl" status="online" tone="red" />
            <Avatar initials="AL" level={71} size="lg" status="defense" tone="purple" />
            <Avatar icon="/assets/army/squire.png" size="md" status="attack" tone="blue" />
            <Avatar initials="RB" size="sm" status="offline" tone="stone" />
            <Avatar initials="?" size="xs" tone="default" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <PlayerProfileCard
              actions={[
                { label: 'Message', variant: 'info' },
                { label: 'Profil', variant: 'neutral' },
              ]}
              avatar={{ crown: true, initials: 'VO', level: 42, status: 'online', tone: 'blue' }}
              name="Vous"
              rank="#3 royaume"
              relation="self"
              stats={[
                { label: 'Points', value: '102k' },
                { label: 'Villages', value: '7' },
                { label: 'Couronnes', value: '28' },
              ]}
              tribe="BFTC"
            />
            <PlayerProfileCard
              actions={[
                { label: 'Attaquer', variant: 'danger' },
                { label: 'Espionner', variant: 'warning' },
              ]}
              avatar={{ initials: 'RB', level: 38, status: 'attack', tone: 'red' }}
              name="Sire_Robert"
              rank="#4 royaume"
              relation="enemy"
              stats={[
                { label: 'Points', value: '99k' },
                { label: 'Villages', value: '6' },
                { label: 'Distance', value: '12m' },
              ]}
              tribe="WOL"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            {leaderboardRows.map((row) => (
              <LeaderboardRow key={row.rank} {...row} onClick={() => setSelectedMarker(row.name)} />
            ))}
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Messages · inbox & chat</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <SegmentedControl
                ariaLabel="Boîte de réception"
                onChange={setFilter}
                options={[
                  { icon: <Mail size={14} />, label: 'Inbox', value: 'all' },
                  { badge: <Badge size="sm" tone="danger">2</Badge>, icon: <Swords size={14} />, label: 'Alertes', value: 'attack' },
                  { icon: <User size={14} />, label: 'Joueurs', value: 'players' },
                ]}
                value={filter}
              />
              {mailItems.map((item) => (
                <MailInboxItem key={item.subject} {...item} onClick={() => setQueueMessage(`Message ouvert : ${item.subject}`)} />
              ))}
            </div>
            <ChatPanel
              inputValue={chatInput}
              messages={chatMessages}
              onInputChange={setChatInput}
              onSubmit={() => {
                const nextMessage = chatInput.trim();
                if (!nextMessage) return;
                setChatMessages((current) => [
                  ...current,
                  { id: `local-${current.length}`, message: nextMessage, time: 'maintenant', type: 'self' },
                ]);
                setChatInput('');
              }}
              title="Canal alliance"
            />
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Structure · header, inputs, cards</h2>
          <div className="flex flex-col gap-3 bg-[#3c2619] p-3">
            <HeaderBar
              avatar={{ initials: 'SK', level: 12, tone: 'stone' }}
              primary={[
                { icon: '/assets/army-power.png', value: '2 480' },
                { icon: '/assets/crown.png', value: '28' },
              ]}
              resources={[
                { icon: '/assets/resources/wood.png', value: '8.500' },
                { icon: '/assets/resources/stone.png', value: '3.200' },
                { icon: '/assets/resources/iron.png', value: '1.500' },
                { icon: '/assets/resources/population.png', value: '120/200' },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <GameInput helper="Visible par vos voisins du royaume." label="Nom du seigneur" onChange={setLordName} value={lordName} />
            <GameInput label="Royaume" onChange={setRealmName} tone="parchment" value={realmName} />
            <GameInput helper="8 caractères minimum." label="Mot de passe" onChange={setPassword} tone={password.length < 8 ? 'error' : 'default'} type="password" value={password} />
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton icon={<Plus size={20} />} label="Ajouter" tone="success" />
            <IconButton icon={<Trash2 size={20} />} label="Supprimer" tone="danger" />
            <IconButton icon={<Settings size={20} />} label="Paramètres" tone="info" />
            <IconButton icon={<X size={20} />} label="Fermer" tone="neutral" />
            <IconButton icon={<Swords size={20} />} label="Attaquer" tone="warning" />
          </div>
          <div className="flex flex-wrap gap-3">
            <MiniCard actionLabel="→ Niv. 4" icon="/assets/castle.png" title="Château" />
            <MiniCard actionLabel="Construire" icon="/assets/wood.png" title="Camp de bûcherons" tone="wood" />
            <MiniCard actionLabel="→ Niv. 2" actionVariant="info" icon="/assets/iron.png" title="Mine de fer" tone="stone" />
            <MiniCard actionLabel="Verrouillé" icon="/assets/watchtower.png" locked title="Tour de guet" tone="default" />
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Structure · banners, dividers, cards info</h2>
          <div className="flex flex-col gap-4">
            <BannerTitle subtitle="Niveau 5 · Conseil de guerre" title="Caserne du Roi" variant="wood" />
            <BannerTitle title="★ Salle du Trône ★" variant="ribbon" />
            <BannerTitle eyebrow="Édit du Royaume" icon="/assets/castle.png" title="Charte des bâtisseurs" variant="stone" />
            <BannerTitle eyebrow="Chapitre IV" subtitle="« Que la pierre tremble sous la cadence des marteaux. »" title="Le Siège de Roc-d'Acier" />
            <BannerTitle eyebrow="Tribu · Diplomatie" meta="👑 24 / 30" title="Les Lames du Nord" variant="screen" />
            <BannerTitle
              crumbs={[{ label: 'Empire' }, { label: 'Village' }, { current: true, label: 'Caserne' }]}
              subtitle="Forme les écuyers, les chevaliers et les templiers de votre garnison."
              title="Caserne · Niveau 3"
              variant="section"
            />
            <Divider />
            <Divider icon="/assets/casual-icons/crown.png" label="Royaume" variant="labeled" />
            <Divider variant="rope" />
            <Divider icon="/assets/hand-red.png" variant="sword" />
            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard
                icon="/assets/army/squire.png"
                stats={[
                  { label: 'Attaque', value: '25' },
                  { label: 'Défense', value: '15' },
                  { label: 'Vitesse', value: '18 min/km' },
                  { label: 'Charge', value: '30' },
                ]}
                title="Squire"
              />
              <InfoCard
                flavor="« Le bois nourrit la forge et la cheminée. »"
                icon="/assets/wood.png"
                stats={[
                  { label: 'Production', value: '+120 /h' },
                  { label: 'Stockage', value: '10.000' },
                ]}
                title="Camp de bûcherons"
              />
              <InfoCard
                dark
                icon="/assets/casual-icons/coin.png"
                stats={[
                  { label: 'En coffre', value: '2.480' },
                  { label: 'Plafond', value: '5.000' },
                ]}
                title="Ressource — Or"
              />
            </div>
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Modales</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {modalOpen ? (
              <GameModal
                actions={[
                  { label: 'Annuler', onClick: () => setModalOpen(false), variant: 'neutral' },
                  { label: 'Construire', variant: 'info' },
                ]}
                icon="/assets/barracks.png"
                onClose={() => setModalOpen(false)}
                quote="« Une garnison forte garde les portes au clair de la lune. »"
                title="Construire Caserne"
                tone="info"
              >
                Améliorer la caserne au Niv. 2 ? Coût : 1.200 bois · 800 pierre · 650 fer.
              </GameModal>
            ) : (
              <BftcButton onClick={() => setModalOpen(true)} variant="info">Réouvrir modale</BftcButton>
            )}
            <GameModal
              actions={[
                { label: 'Annuler', variant: 'neutral' },
                { label: 'ATTAQUER', variant: 'danger' },
              ]}
              icon="/assets/hand-red.png"
              title="Lancer l'attaque ?"
              tone="danger"
            >
              Vous envoyez 240 unités contre <b>Sire_Robert</b>. Cette action est irréversible.
            </GameModal>
            <GameModal actions={[{ label: 'Voir le rapport', variant: 'success' }]} icon="/assets/casual-icons/crown.png" title="VICTOIRE" tone="success">
              Vous avez pillé 2.400 ressources et capturé 12 prisonniers.
            </GameModal>
            <GameModal actions={[{ label: 'Plus tard', variant: 'neutral' }, { label: 'Améliorer', variant: 'warning' }]} icon="/assets/resources/wood.png" title="Entrepôt presque plein" tone="warning">
              Vos coffres de bois sont à 98 %. Augmentez votre entrepôt ou dépensez avant la perte de production.
            </GameModal>
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Quêtes · récompenses · boutique</h2>
          <div className="flex flex-col gap-3">
            <FeaturedQuestCard
              actionLabel="Détails"
              description="Lancez une attaque réussie contre Sire_Robert avant la pleine lune. Le héraut récompensera votre audace."
              eyebrow="Quête de chapitre · IV"
              icon="/assets/casual-icons/crown.png"
              rewards={[{ icon: '/assets/casual-icons/crown.png', value: '50' }, { icon: '/assets/resources/iron.png', value: '2.000' }]}
              title="Briser le siège de Roc-d'Acier"
            />
            <QuestCard icon="/assets/wood.png" name="Récolter 5.000 bois" progress={{ label: '3.200 / 5.000', value: 64 }} rewards={[{ icon: '/assets/casual-icons/coin.png', value: '200' }]} />
            <QuestCard actionLabel="Réclamer" icon="/assets/army/squire.png" name="Recruter 24 squires" progress={{ label: '✓ Terminé', value: 100 }} ready rewards={[{ icon: '/assets/casual-icons/crown.png', value: '5' }]} />
            <DailyReward
              actionLabel="Réclamer aujourd'hui"
              days={[
                { amount: '500', day: 'J 1', done: true, icon: '/assets/resources/wood.png' },
                { amount: '500', day: 'J 2', done: true, icon: '/assets/resources/stone.png' },
                { amount: '200', day: 'J 3', done: true, icon: '/assets/casual-icons/coin.png' },
                { amount: '400', day: 'J 4', icon: '/assets/resources/iron.png', today: true },
                { amount: '5', day: 'J 5', icon: '/assets/casual-icons/crown.png' },
                { amount: '×10', day: 'J 6', icon: '/assets/army/squire.png' },
                { amount: '25 + boost', day: 'J 7', icon: '/assets/casual-icons/crown.png', jackpot: true },
              ]}
              eyebrow="Récompense quotidienne"
              subtitle="« Plus vous reviendrez, plus la cour vous comblera. »"
              title="Le héraut du royaume"
            />
            <SegmentedControl
              ariaLabel="Boutique"
              onChange={setFilter}
              options={[
                { label: 'Boutique', value: 'all' },
                { label: 'Ressources', value: 'resources' },
                { label: 'Boosts', value: 'boosts' },
                { label: 'Skins', value: 'skins' },
              ]}
              value={filter}
            />
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              <ShopTile badge="−40%" currencyIcon="/assets/casual-icons/coin.png" icon="/assets/resources/wood.png" name="Cargaison de bois" price="120" tone="cash" />
              <ShopTile currencyIcon="/assets/casual-icons/coin.png" icon="/assets/resources/stone.png" name="Cargaison de pierre" price="140" tone="cash" />
              <ShopTile currencyIcon="/assets/casual-icons/crown.png" icon="/assets/clock.png" name="Bond de 1 heure" price="15" quantity="×3" />
              <ShopTile currencyIcon="/assets/casual-icons/crown.png" icon="/assets/casual-icons/card-gold.png" name="Carte de bénédiction" price="40" soldOut />
            </div>
          </div>
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Premium · achievements · boosts</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <PremiumBundle
              eyebrow="Pack Bourgeois"
              icon="/assets/casual-icons/coin.png"
              lines={[{ icon: '/assets/casual-icons/crown.png', label: 'Couronnes', value: '×80' }, { icon: '/assets/resources/wood.png', label: 'Bois', value: '5.000' }]}
              oldPrice="4,99 €"
              price="2,99 €"
              title="Bourse du roturier"
            />
            <PremiumBundle
              badge="POPULAIRE"
              eyebrow="Pack Baronnial"
              featured
              icon="/assets/casual-icons/crown.png"
              lines={[{ icon: '/assets/casual-icons/crown.png', label: 'Couronnes', value: '×450' }, { icon: '/assets/army/templar.png', label: 'Templiers', value: '×15' }, { icon: '/assets/clock.png', label: 'Boost prod', value: '24h' }]}
              oldPrice="14,99 €"
              price="9,99 €"
              title="Trésor de baron"
            />
            <PremiumBundle
              eyebrow="★ Royal"
              icon="/assets/casual-icons/crown.png"
              lines={[{ icon: '/assets/casual-icons/crown.png', label: 'Couronnes', value: '×2.000' }, { label: 'VIP Noblesse', value: '30 jours' }, { icon: '/assets/castle.png', label: 'Skin château', value: 'Or' }]}
              oldPrice="39,99 €"
              price="29,99 €"
              royal
              title="Pacte du Souverain"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <AchievementCard icon="/assets/casual-icons/crown.png" name="Premier sacre" points="50" tier="gold" tierLabel="OR" />
            <AchievementCard icon="/assets/army/squire.png" name="Recruteur" points="25" tier="silver" tierLabel="ARGENT" />
            <AchievementCard icon="/assets/wood.png" name="Premier coup de hache" points="10" tier="bronze" tierLabel="BRONZE" />
            <AchievementCard icon="/assets/hand-red.png" name="Conquérant" points="75" progress={{ label: '21 / 50 batailles', value: 42 }} tier="gold" tierLabel="OR · I / III" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <BoostPill icon="/assets/resources/wood.png" label="+50% prod" time="1h 23m" tone="production" />
            <BoostPill icon="/assets/hand-red.png" label="+25% ATK" time="12m" tone="attack" />
            <BoostPill icon="/assets/hand-silver.png" label="+40% DEF" time="2h 04m" tone="defense" />
            <BoostPill icon="/assets/clock.png" label="−30% temps" time="45m" tone="build" />
            <BoostPill icon="/assets/casual-icons/crown.png" label="VIP NOBLESSE" time="12j" tone="vip" />
          </div>
          <ActiveBoostList
            items={[
              { icon: '/assets/resources/wood.png', label: 'Boost production bois', time: '1h 23m', tone: 'production', value: '+50%' },
              { icon: '/assets/hand-red.png', label: 'Cri de guerre', time: '0:12', tone: 'attack', value: '+25% ATK' },
              { icon: '/assets/watchtower.png', label: 'Vigilance accrue', time: '2h 04m', tone: 'defense', value: '+40% DEF' },
            ]}
            title="Effets actifs · 3"
          />
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Progression · puissance · rapports</h2>
          <div className="flex flex-wrap items-center gap-3">
            <PipRating value={3} />
            <PipRating tone="green" value={4} />
            <PipRating max={10} size="sm" value={7} />
            <PipRating value={4} variant="star" />
            <PipRating value={3} variant="chevron" />
            <LevelChip icon="/assets/casual-icons/crown.png" value={12} />
            <LevelChip max={10} value={3} />
            <LevelChip value="MAX" />
          </div>
          <PowerComparison
            attackerLabel="Vous · puissance"
            attackerPower="4.250"
            attackerUnits={[{ icon: '/assets/army/squire.png', value: '×120' }, { icon: '/assets/army/archer.png', value: '×60' }, { icon: '/assets/army/templar.png', value: '×8' }]}
            defenderLabel="Sire_Robert · puissance"
            defenderPower="2.580"
            defenderUnits={[{ icon: '/assets/army/militia.png', value: '×120' }, { icon: '/assets/army/squire.png', value: '×~48' }, { icon: '/assets/army/templar.png', value: '×?' }]}
            ratioLabel="68% chances de victoire"
            value={62}
            verdict="⚔ Avantage net — pertes estimées : ≈ 22 unités"
          />
          <ScoutReport
            actions={[{ label: 'Partager tribu', variant: 'neutral' }, { label: 'Planifier attaque', variant: 'danger' }]}
            columns={[
              { title: 'Ressources visibles', rows: [{ icon: '/assets/resources/wood.png', label: 'Bois', value: '8.420' }, { icon: '/assets/resources/stone.png', label: 'Pierre', value: '3.180' }, { icon: '/assets/resources/iron.png', label: 'Fer', value: '1.640' }, { icon: '/assets/casual-icons/coin.png', label: 'Or', value: '4.200' }] },
              { title: 'Garnison estimée', rows: [{ icon: '/assets/army/militia.png', label: 'Milice', value: '120' }, { icon: '/assets/army/squire.png', label: 'Squires', value: '~48' }, { hidden: true, icon: '/assets/army/archer.png', label: 'Archers', value: '???' }, { hidden: true, icon: '/assets/army/templar.png', label: 'Templiers', value: '???' }] },
            ]}
            defenses={[{ icon: '/assets/watchtower.png', label: 'Tour niv. 3' }, { icon: '/assets/castle.png', label: 'Château niv. 5' }, { danger: true, label: '⚠ Mur niv. 8' }]}
            note="« Vos éclaireurs ont longé les murailles à l'aube. »"
            subtitle="Cible"
            tag="1 éclaireur revenu · 0 perdu"
            target="Sire_Robert · Roc-d'Acier 238|617"
            time="il y a 4 min"
            title="RAPPORT D'ESPIONNAGE"
          />
        </section>

        <section className={previewSectionClass}>
          <h2 className={previewTitleClass}>Mouvements & alliances</h2>
          <div className="flex flex-col gap-1.5 rounded-xl bg-[#3c2619] p-3">
            <ArmyMovementRow icon="/assets/hand-red.png" incoming progress={32} subtitle="De Sire_Robert · Roc-d'Acier 238|617 · ≈ 240 unités" time="02:15" title="⚠ ATTAQUE entrante" tone="attack" />
            <ArmyMovementRow icon="/assets/army/squire.png" progress={78} subtitle="120 squires + 60 archers · arrivée à 14h42" time="0:47" title="Attaque → Tours-Hautes" tone="attack" />
            <ArmyMovementRow icon="/assets/hand-silver.png" progress={25} subtitle="80 milice · au retour : 6h" time="1h 12m" title="Renfort → Castelfort (allié)" tone="defend" />
            <ArmyMovementRow actionLabel="Rappeler" icon="/assets/position.png" progress={22} subtitle="×1 éclaireur · discret" time="3:04" title="Éclaireur → Bois-d'Argent" tone="scout" />
          </div>
          <div className="flex flex-wrap gap-3">
            <HeraldicShield charge="chevron" field="sable" icon="/assets/casual-icons/crown.png" />
            <HeraldicShield charge="fess" field="azure" icon="/assets/hand-silver.png" />
            <HeraldicShield charge="cross" field="gules" />
            <HeraldicShield charge="pile" field="or" icon="/assets/castle.png" />
          </div>
          <AllianceBanner
            members="24 / 30 membres"
            motto="« Tant qu'il restera de l'acier, il restera des rois. »"
            name="Les Lames du Nord"
            points="1.482.310"
            rank="★ Rang #3"
            shield={{ charge: 'chevron', field: 'sable', icon: '/assets/casual-icons/crown.png' }}
            tag="BFC"
          />
          <div className="flex flex-col gap-1.5">
            <AllianceRow members="24 / 30 membres · fondée an 1247" name="Les Lames du Nord" points="1.482.310" relation="★ Votre tribu" relationTone="self" shield={{ charge: 'chevron', field: 'sable', icon: '/assets/casual-icons/crown.png' }} tag="BFC" />
            <AllianceRow members="19 membres · pacte scellé il y a 12 j" name="Sentinelles du Trône" points="1.124.880" relation="✦ Alliée" relationTone="ally" shield={{ charge: 'fess', field: 'azure', icon: '/assets/hand-silver.png' }} tag="STN" />
            <AllianceRow members="18 membres · 4 villages perdus cette saison" name="Corbeaux Noirs" points="982.140" relation="⚔ En guerre" relationTone="war" shield={{ charge: 'cross', field: 'gules' }} tag="RVN" />
          </div>
        </section>
      </div>
    </main>
  );
}
