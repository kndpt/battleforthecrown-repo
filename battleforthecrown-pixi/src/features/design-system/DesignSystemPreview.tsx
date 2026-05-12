import { useState } from 'react';
import {
  ArmyMovementList,
  Avatar,
  AvatarProfileLine,
  AvatarStack,
  Badge,
  BftcButton,
  BorderStrokeTile,
  BuildingCard,
  BuildingIconTile,
  BuildingLevelRow,
  BuildQueueCard,
  ChatPanel,
  CinzelDisplaySample,
  ColorSwatchTile,
  CostPill,
  CostRow,
  DarkSegmentedStage,
  DigitTimer,
  EmptyState,
  FeaturedQuestCard,
  GameInput,
  GameModal,
  HeaderBar,
  IconButton,
  InboxTabs,
  LeaderboardHeader,
  LeaderboardRow,
  LevelChip,
  MailInboxItem,
  NumberStepper,
  PipRating,
  PlayerProfileCard,
  ProgressBar,
  QuestMissionCard,
  RadiusTile,
  RequirementChip,
  ResourceIconTile,
  SegmentedControl,
  SemanticColorRow,
  ShadowDepthTile,
  SurfaceTile,
  Timer,
  ToastPreview,
  TroopRow,
  TroopStepper,
  VillageStyleModal,
  VillageStyleTrigger,
  type ChatMessage,
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

export function DesignSystemPreview() {
  const [inputValue, setInputValue] = useState('');
  const [lordName, setLordName] = useState('');
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
  const [inboxTab, setInboxTab] = useState('all');
  const [stepperValue, setStepperValue] = useState(125);
  const [troopQuantity, setTroopQuantity] = useState(24);
  const [villageStyleOpen, setVillageStyleOpen] = useState(true);
  const [villageStyle, setVillageStyle] = useState<VillageStyleId>('RAIDERS');

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
            <ResourceIconTile icon="/assets/army-power.png" label="Puissance" />
            <ResourceIconTile icon="/assets/clock.png" label="Temps" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Building icons</h2>
          <div className="flex w-full flex-wrap items-center justify-center gap-[14px] bg-[#5b8f3a] p-[18px]">
            <BuildingIconTile icon="/assets/castle.png" label="Château" />
            <BuildingIconTile icon="/assets/barracks.png" label="Caserne" />
            <BuildingIconTile icon="/assets/farm.png" label="Ferme" />
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
                  tone: 'defend',
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
                  icon: '/assets/position.png',
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
                <img alt="" className="absolute left-[30px] top-[430px] w-[110px] opacity-85" src="/assets/farm.png" />
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
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">5 variants</span>
              <BftcButton>OK</BftcButton>
              <BftcButton variant="info">ACCEPTER</BftcButton>
              <BftcButton variant="danger">NON</BftcButton>
              <BftcButton variant="warning">ATTENTION</BftcButton>
              <BftcButton variant="neutral">Retour</BftcButton>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2.5">
              <span className="min-w-[78px] font-mono text-[10px] text-[#5d4a32]">sm/md/lg</span>
              <BftcButton size="xs">Small</BftcButton>
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
              population={{ icon: '/assets/resources/population.png', label: 'Population', value: '120/200' }}
              primaryStats={[
                { icon: '/assets/army-power.png', label: 'Puissance', value: '2 480' },
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
                  { icon: '/assets/hand-red.png', label: 'Offensif', value: 'offense' },
                  { icon: '/assets/hand-silver.png', label: 'Défensif', value: 'defense' },
                  { icon: '/assets/watchtower.png', label: 'Espion', value: 'spy' },
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
          <span className="font-mono text-[10px] text-[#5d4a32]">boîte du seigneur · 12 messages</span>
          <InboxTabs
            onChange={setInboxTab}
            options={[
              { count: '3', label: 'Tous', value: 'all' },
              { label: 'Rapports', value: 'reports' },
              { count: '1', label: 'Joueurs', value: 'players' },
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
              sender="Rapport · Roc-d'Acier"
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
              icon="/assets/position.png"
              preview="Vos éclaireurs ont longé les murailles…"
              sender="Rapport · Tours-Hautes"
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
          <h2 className="font-game text-2xl font-bold text-[#1f2937]">Player profile card</h2>
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
                { icon: '/assets/army-power.png', label: 'pwr', value: '4.250' },
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
                { icon: '/assets/army-power.png', value: '2.580' },
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
                { icon: '/assets/army-power.png', value: '5.840' },
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
                { icon: '/assets/army-power.png', value: '180' },
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
