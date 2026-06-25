import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';
import { ProgressBar } from '@/ui/feedback/ProgressBar';
import { GameBottomSheetPanel } from './GameBottomSheetPanel';
import { SegmentedControl } from './SegmentedControl';

export type PlayerProfileSheetTab = 'profile' | 'villages' | 'settings';
export type PlayerProfileSheetVillageStyle = 'FORTRESS' | 'RAIDERS' | 'ECONOMIC' | 'BALANCED';

export interface PlayerProfileSheetTribe {
  cap: number;
  members: number;
  name: string;
  role: string;
  tag: string;
}

export interface PlayerProfileSheetStats {
  crowns: string;
  defenses: number | string;
  points: string;
  power: string;
  raidsWon: number | string;
  rank: number | string;
  rankTotal: number | string;
  villages: number | string;
}

export interface PlayerProfileSheetVillage {
  capital?: boolean;
  coords: string;
  id: string;
  label?: string;
  level: number | string;
  name: string;
  power: string;
  style?: {
    id: PlayerProfileSheetVillageStyle;
    label: string;
  };
}

export interface PlayerProfileSheetWorld {
  day: number | string;
  name: string;
  phase: string;
  sigilGlyph: string;
  theme: {
    border: string;
    dark: string;
    light: string;
  };
  total: number | string;
}

export interface PlayerProfileSheetSetting {
  icon: string;
  id: string;
  label: string;
  onClick?: () => void;
  value?: string;
}

export interface PlayerProfileSheetIcons {
  armyPower: string;
  castle: string;
  crown: string;
  defense: string;
  position: string;
  raids: string;
}

export interface PlayerProfileSheetLabels {
  close: string;
  history: string;
  logout: string;
  phase: string;
  tabs: Record<PlayerProfileSheetTab, string>;
  villageHint?: string;
  world: string;
}

export interface PlayerProfileSheetPlayer {
  initials: string;
  level: number | string;
  name: string;
  online?: boolean;
  tribe: PlayerProfileSheetTribe;
}

export interface PlayerProfileSheetRenown {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  justLeveledUp?: boolean;
}

export type PlayerProfileSheetTitleSignal = 'ASSAULT_GLORY' | 'RAMPART_GLORY';

export interface PlayerProfileSheetTitle {
  id: string;
  /** Full FR label, e.g. "Champion d'Assaut · Semaine 3 · Avalon". */
  label: string;
  signal: PlayerProfileSheetTitleSignal;
  /** `validUntilAt > now` — drives the active badge styling. */
  active: boolean;
}

export interface PlayerProfileSheetProps {
  activeTab: PlayerProfileSheetTab;
  className?: string;
  icons: PlayerProfileSheetIcons;
  labels: PlayerProfileSheetLabels;
  onClose?: () => void;
  onLogout?: () => void;
  onTabChange: (tab: PlayerProfileSheetTab) => void;
  onVillageSelect?: (village: PlayerProfileSheetVillage) => void;
  onWorldSelect?: () => void;
  player: PlayerProfileSheetPlayer;
  renown?: PlayerProfileSheetRenown;
  settings: PlayerProfileSheetSetting[];
  stats: PlayerProfileSheetStats;
  titles?: PlayerProfileSheetTitle[];
  villages: PlayerProfileSheetVillage[];
  world: PlayerProfileSheetWorld;
}

const titleSignalStyle: Record<
  PlayerProfileSheetTitleSignal,
  { glyph: string; border: string; bg: string }
> = {
  ASSAULT_GLORY: {
    glyph: '⚔️',
    border: '#a93226',
    bg: 'linear-gradient(to bottom,#e74c3c,#c0392b)',
  },
  RAMPART_GLORY: {
    glyph: '🛡️',
    border: '#1f3e66',
    bg: 'linear-gradient(to bottom,#5b8fbf,#2e5a88)',
  },
};

const tabs: PlayerProfileSheetTab[] = ['profile', 'villages', 'settings'];

const styleColor: Record<PlayerProfileSheetVillageStyle, { light: string; dark: string; border: string; ink: string }> = {
  BALANCED: { light: '#b89968', dark: '#7d5a3a', border: '#5d4a32', ink: '#fff' },
  ECONOMIC: { light: '#6ebf49', dark: '#4a8c2a', border: '#3a6c1f', ink: '#fff' },
  FORTRESS: { light: '#5b8fbf', dark: '#2e5a88', border: '#1f3e66', ink: '#fff' },
  RAIDERS: { light: '#e74c3c', dark: '#c0392b', border: '#a93226', ink: '#fff' },
};

function playerProfileTierFromPower(power: string): number {
  const n = Number.parseInt(power.replace(/\D/g, ''), 10) || 0;
  if (n >= 2500) return 5;
  if (n >= 1500) return 4;
  if (n >= 800) return 3;
  if (n >= 300) return 2;
  return 1;
}

function asset(src: string) {
  return publicAsset(src);
}

function StyleTag({ label, styleId, size = 'md' }: { label: string; size?: 'md' | 'sm'; styleId: PlayerProfileSheetVillageStyle }) {
  const c = styleColor[styleId];

  return (
    <span
      className={cn(
        'whitespace-nowrap rounded-full border-[1.5px] font-game font-extrabold uppercase tracking-[.14em] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]',
        size === 'sm' ? 'px-1.5 py-px text-[8.5px]' : 'px-2 py-0.5 text-[9.5px]',
        c.ink === '#fff' ? 'text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]' : 'text-[#3a2a00] [text-shadow:none]',
      )}
      style={{
        background: `linear-gradient(to bottom, ${c.light}, ${c.dark})`,
        borderColor: c.border,
      }}
    >
      {label}
    </span>
  );
}

function Medallion({
  crownIcon,
  initials,
  level,
  online = true,
  size = 54,
}: {
  crownIcon: string;
  initials: string;
  level: number | string;
  online?: boolean;
  size?: number;
}) {
  return (
    <div className="relative shrink-0" style={{ height: size, width: size }}>
      <div
        className="flex items-center justify-center rounded-full border-[3px] border-[#3d2f1f] bg-[radial-gradient(circle_at_32%_28%,#fef0c6,#c89a4c_60%,#6f4a1d),linear-gradient(to_bottom,#f6d57b,#a37a2b)] shadow-[inset_0_2px_0_rgba(255,255,255,.5),inset_0_-8px_12px_rgba(0,0,0,.25),0_4px_8px_rgba(0,0,0,.4),0_0_10px_rgba(246,213,123,.65)]"
        style={{ height: size, width: size }}
      >
        <span
          className="font-game font-extrabold leading-none text-[#fef9f0] [text-shadow:1px_1px_2px_rgba(0,0,0,.55),0_0_6px_rgba(0,0,0,.35)]"
          style={{ fontSize: size * 0.34, letterSpacing: '.05em' }}
        >
          {initials}
        </span>
      </div>
      <img
        alt=""
        className="pointer-events-none absolute left-1/2 top-[-18%] -translate-x-1/2 -rotate-6 drop-shadow-[0_2px_3px_rgba(0,0,0,.5)]"
        src={asset(crownIcon)}
        style={{ width: size * 0.45 }}
      />
      <div
        className="absolute bottom-[-2px] right-[-4px] flex items-center justify-center rounded-full border-[2.5px] border-[#5d4a32] bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)] px-[5px] font-game font-extrabold text-[#3a2a00] shadow-[0_2px_0_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.4)] [text-shadow:0_1px_0_rgba(255,255,255,.4)]"
        style={{ fontSize: size * 0.18, height: size * 0.34, minWidth: size * 0.34 }}
      >
        {level}
      </div>
      {online ? (
        <span
          className="absolute rounded-full border-[2.5px] border-[#fef9f0] bg-[linear-gradient(to_bottom,#7cc55c,#3e7a26)] shadow-[0_0_6px_rgba(124,197,92,.7)]"
          style={{ bottom: size * 0.05, height: 12, left: size * 0.04, width: 12 }}
        />
      ) : null}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon?: string; label: string; value: string }) {
  return (
    <div className="flex-1 rounded-[10px] border-2 border-[#a67c52] bg-[linear-gradient(to_bottom,rgba(255,255,255,.45),rgba(213,182,128,.45))] px-1.5 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.18)]">
      {icon ? <img alt="" className="inline size-[22px] drop-shadow-[0_1px_1px_rgba(0,0,0,.4)]" src={asset(icon)} /> : null}
      <div className="mt-0.5 font-game text-sm font-extrabold leading-[1.1] text-[#3d2f1f] tabular-nums [text-shadow:0_1px_0_rgba(255,255,255,.45)]">{value}</div>
      <div className="mt-0.5 font-game text-[8.5px] font-bold uppercase tracking-[.18em] text-[#6d5838]">{label}</div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return (
    <div className="flex flex-1 items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#a67c52] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] px-2 py-1.5">
      <img alt="" className="size-[18px]" src={asset(icon)} />
      <div className="leading-[1.1]">
        <div className="font-game text-[13px] font-extrabold text-[#3d2f1f] tabular-nums">{value}</div>
        <div className="font-game text-[8.5px] font-bold uppercase tracking-[.14em] text-[#6d5838]">{label}</div>
      </div>
    </div>
  );
}

function VillageTierAsset({ tier }: { tier: number }) {
  const clampedTier = Math.max(1, Math.min(6, tier));

  return (
    <img
      alt=""
      className="block size-10 object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,.35)]"
      src={asset(`/assets/world/entity/village-tier${clampedTier}.png`)}
    />
  );
}

function WorldPanel({
  labels,
  onWorldSelect,
  world,
}: Pick<PlayerProfileSheetProps, 'labels' | 'onWorldSelect' | 'world'>) {
  return (
    <button
      aria-label={`Voir les royaumes depuis ${world.name}`}
      className="flex w-full cursor-pointer items-center gap-[9px] rounded-[10px] border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(60,38,25,.94),rgba(78,56,34,.94))] px-[11px] py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_2px_0_rgba(0,0,0,.18)] active:translate-y-px"
      onClick={onWorldSelect}
      type="button"
    >
      <div className="relative h-[36px] w-[32px] shrink-0 drop-shadow-[0_2px_3px_rgba(0,0,0,.45)]" aria-hidden="true">
        <div
          className="absolute inset-0 border-2 shadow-[inset_0_2px_0_rgba(255,255,255,.25),inset_0_-8px_12px_rgba(0,0,0,.25)] [clip-path:polygon(50%_100%,0%_75%,0%_8%,8%_0%,92%_0%,100%_8%,100%_75%)]"
          style={{
            background: `linear-gradient(to bottom, ${world.theme.light}, ${world.theme.dark})`,
            borderColor: world.theme.border,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pb-1 font-game text-[15px] font-black leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,.6)]">
          {world.sigilGlyph}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-game text-[8.5px] font-bold uppercase leading-none tracking-[.3em] text-[#cdb88a]">{labels.world}</div>
        <div className="mt-0.5 font-game text-[13px] font-extrabold tracking-[.03em] text-[#fef9f0] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]">{world.name}</div>
      </div>
      <div className="text-right">
        <div className="font-game text-xs font-extrabold text-[#fef9f0] tabular-nums [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]">
          J+{world.day}<span className="font-bold opacity-[.55]"> / {world.total}</span>
        </div>
        <div className="mt-px font-game text-[9px] text-[#cdb88a]">{world.phase}</div>
      </div>
    </button>
  );
}

function RenownBlock({ renown }: { renown: PlayerProfileSheetRenown }) {
  const ratio = renown.xpForNextLevel > 0
    ? Math.min(1, Math.max(0, renown.xpIntoLevel / renown.xpForNextLevel))
    : 1;

  return (
    <div
      className={cn(
        'rounded-[10px] border-2 border-[#a67c52] bg-[linear-gradient(to_bottom,rgba(255,255,255,.45),rgba(213,182,128,.45))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.18)]',
        renown.justLeveledUp && 'animate-pulse border-[#c9900c] shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.18),0_0_10px_rgba(246,213,123,.5)]',
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-game text-[9.5px] font-bold uppercase tracking-[.3em] text-[#6d5838]">
          Renommée
        </span>
        <span className="font-game text-sm font-extrabold text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.45)]">
          Niv. {renown.level}
        </span>
        {renown.justLeveledUp ? (
          <span className="animate-pulse rounded-full border border-[#c9900c] bg-[linear-gradient(to_bottom,#f6d57b,#c9900c)] px-2 py-px font-game text-[8.5px] font-extrabold text-[#3a2a00]">
            Niveau supérieur&nbsp;!
          </span>
        ) : null}
      </div>
      <ProgressBar value={ratio * 100} variant="warning" size="sm" />
      <div className="mt-1 text-right font-game text-[8.5px] text-[#6d5838]">
        {renown.xpIntoLevel} / {renown.xpForNextLevel} XP
      </div>
    </div>
  );
}

function TitleRow({ title }: { title: PlayerProfileSheetTitle }) {
  const style = titleSignalStyle[title.signal];
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-[10px] border-2 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_rgba(0,0,0,.14)]',
        title.active ? 'opacity-100' : 'opacity-60',
      )}
      style={{
        borderColor: style.border,
        background:
          'linear-gradient(to right,#fff3d6 0%,#fef9f0 45%,#f0dcae 100%)',
      }}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-base shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_0_8px_rgba(246,213,123,.4)]"
        style={{ borderColor: style.border, background: style.bg }}
      >
        <span aria-hidden="true">{style.glyph}</span>
      </div>
      <div className="min-w-0 flex-1 truncate font-game text-[12px] font-extrabold text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.4)]">
        {title.label}
      </div>
      {title.active ? null : (
        <span className="shrink-0 font-game text-[8px] font-bold uppercase tracking-[.12em] text-[#8a6a1e]">
          Expiré
        </span>
      )}
    </div>
  );
}

function TitlesBlock({ titles }: { titles: PlayerProfileSheetTitle[] }) {
  // Active titles first, capped at 3 shown; the rest collapse into a count.
  const sorted = [...titles].sort(
    (a, b) => Number(b.active) - Number(a.active),
  );
  const shown = sorted.slice(0, 3);
  const remaining = sorted.length - shown.length;
  return (
    <div>
      <div className="mb-1.5 font-game text-[9.5px] font-bold uppercase tracking-[.3em] text-[#6d5838]">
        Titres
      </div>
      <div className="flex flex-col gap-1.5">
        {shown.map((title) => (
          <TitleRow key={title.id} title={title} />
        ))}
      </div>
      {remaining > 0 ? (
        <div className="mt-1 text-right font-game text-[9px] text-[#6d5838]">
          + {remaining} autre{remaining > 1 ? 's' : ''}
        </div>
      ) : null}
    </div>
  );
}

function ProfilePane({
  icons,
  labels,
  onWorldSelect,
  renown,
  stats,
  titles,
  world,
}: Pick<PlayerProfileSheetProps, 'icons' | 'labels' | 'onWorldSelect' | 'renown' | 'stats' | 'titles' | 'world'>) {
  return (
    <div className="flex flex-col gap-2.5">
      {renown ? <RenownBlock renown={renown} /> : null}
      <WorldPanel labels={labels} onWorldSelect={onWorldSelect} world={world} />
      {titles && titles.length > 0 ? <TitlesBlock titles={titles} /> : null}
      <div className="flex gap-1.5">
        <StatTile icon={icons.armyPower} label="Puissance" value={stats.power} />
        <StatTile icon={icons.crown} label="Couronnes" value={stats.crowns} />
      </div>
      <div className="flex gap-1.5">
        <StatTile label="Points" value={stats.points} />
        <StatTile label={`/ ${stats.rankTotal}`} value={`#${stats.rank}`} />
      </div>
      <div>
        <div className="mb-1.5 font-game text-[9.5px] font-bold uppercase tracking-[.3em] text-[#6d5838]">{labels.history}</div>
        <div className="flex gap-1.5">
          <MiniStat icon={icons.raids} label="Raids" value={stats.raidsWon} />
          <MiniStat icon={icons.defense} label="Défenses" value={stats.defenses} />
          <MiniStat icon={icons.castle} label="Villages" value={stats.villages} />
        </div>
      </div>
    </div>
  );
}

function VillageRow({
  icons,
  onVillageSelect,
  village,
}: {
  icons: PlayerProfileSheetIcons;
  onVillageSelect?: (village: PlayerProfileSheetVillage) => void;
  village: PlayerProfileSheetVillage;
}) {
  const tier = playerProfileTierFromPower(village.power);

  return (
    <button
      aria-label={`Sélectionner ${village.name}`}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2.5 rounded-[11px] border-2 px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_rgba(0,0,0,.12)]',
        village.capital
          ? 'border-[#9e7b0d] bg-[linear-gradient(to_right,#fff3d6_0%,#fef9f0_40%,#e8d4a8_100%)]'
          : 'border-[#a67c52] bg-[linear-gradient(to_right,#fef9f0,#e8d4a8)]',
      )}
      onClick={() => onVillageSelect?.(village)}
      type="button"
    >
      <div
        className={cn(
          'relative flex size-[46px] shrink-0 items-center justify-center rounded-lg border-2',
          village.capital
            ? 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_0_8px_rgba(246,213,123,.5)]'
            : 'border-[#5d4a32] bg-[linear-gradient(to_bottom,#d9c896,#a67c52)] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]',
        )}
      >
        <VillageTierAsset tier={tier} />
        {village.capital ? (
          <img
            alt=""
            className="pointer-events-none absolute left-1/2 top-[-7px] w-4 -translate-x-1/2 -rotate-6 drop-shadow-[0_1px_2px_rgba(0,0,0,.4)]"
            src={asset(icons.crown)}
          />
        ) : null}
        <span className="absolute bottom-[-4px] right-[-4px] rounded-full border-[1.5px] border-[#5d4a32] bg-[linear-gradient(to_bottom,#fef9f0,#d9c896)] px-1 font-game text-[8.5px] font-extrabold leading-[1.3] tracking-[.06em] text-[#3d2f1f] shadow-[0_1px_0_rgba(0,0,0,.25)]">
          T{tier}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-game text-[13px] font-extrabold text-[#3d2f1f]">{village.name}</span>
          {village.label ? (
            <span className="whitespace-nowrap rounded-full border-[1.5px] border-[#9e7b0d] bg-[rgba(241,196,15,.18)] px-1.5 py-px font-game text-[8.5px] font-extrabold uppercase tracking-[.12em] text-[#7a4d05]">
              {village.label}
            </span>
          ) : null}
          {village.style ? <StyleTag label={village.style.label} size="sm" styleId={village.style.id} /> : null}
        </div>
        <div className="mt-0.5 flex gap-2 font-game text-[10px] text-[#6d5838]">
          <span>
            Château <b className="text-[#3d2f1f]">Niv. {village.level}</b>
          </span>
          <span>·</span>
          <span>
            <img alt="" className="inline w-2.5 align-[-2px]" src={asset(icons.armyPower)} /> <b className="text-[#3d2f1f]">{village.power}</b>
          </span>
          <span>·</span>
          <span>{village.coords}</span>
        </div>
      </div>
      <span className="font-game text-lg font-extrabold text-[#6d5838]">›</span>
    </button>
  );
}

function VillagesPane({
  icons,
  labels,
  onVillageSelect,
  villages,
}: Pick<PlayerProfileSheetProps, 'icons' | 'labels' | 'onVillageSelect' | 'villages'>) {
  return (
    <div className="flex flex-col gap-1.5">
      {villages.map((village) => (
        <VillageRow icons={icons} key={village.id} onVillageSelect={onVillageSelect} village={village} />
      ))}
      {labels.villageHint ? (
        <div className="mt-1 rounded-[10px] border-[1.5px] border-dashed border-[#a67c52] bg-[rgba(255,255,255,.28)] px-3 py-2 text-center font-game text-[10.5px] font-bold leading-snug text-[#6d5838]">
          {labels.villageHint}
        </div>
      ) : null}
    </div>
  );
}

function SettingRow({ setting }: { setting: PlayerProfileSheetSetting }) {
  const content = (
    <>
      <span className="w-[22px] text-center text-sm grayscale-[.2]">{setting.icon}</span>
      <span className="flex-1 font-game text-xs font-bold text-[#3d2f1f]">{setting.label}</span>
      {setting.value ? <span className="font-game text-[11px] text-[#6d5838]">{setting.value}</span> : null}
      <span className="font-game text-sm text-[#6d5838]">›</span>
    </>
  );

  if (setting.onClick) {
    return (
      <button className="flex w-full items-center gap-2.5 border-b border-[rgba(93,74,50,.18)] px-1 py-[9px] text-left" onClick={setting.onClick} type="button">
        {content}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center gap-2.5 border-b border-[rgba(93,74,50,.18)] px-1 py-[9px] text-left">
      {content}
    </div>
  );
}

function SettingsPane({
  labels,
  onLogout,
  settings,
}: Pick<PlayerProfileSheetProps, 'labels' | 'onLogout' | 'settings'>) {
  return (
    <div className="flex flex-col gap-1">
      {settings.map((setting) => (
        <SettingRow key={setting.id} setting={setting} />
      ))}
      <div className="h-2" />
      <button
        className="cursor-pointer rounded-[10px] border-2 border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)] px-3.5 py-[9px] font-game text-xs font-extrabold uppercase tracking-[.1em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_3px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
        onClick={onLogout}
        type="button"
      >
        {labels.logout}
      </button>
    </div>
  );
}

export function PlayerProfileSheet({
  activeTab,
  className,
  icons,
  labels,
  onLogout,
  onTabChange,
  onVillageSelect,
  onWorldSelect,
  player,
  renown,
  settings,
  stats,
  titles,
  villages,
  world,
}: PlayerProfileSheetProps) {
  return (
    <GameBottomSheetPanel
      bodyClassName="px-3.5 pb-3.5 pt-3"
      className={cn('h-full max-h-full', className)}
      headerContent={
        <div className="flex items-center gap-3">
          <Medallion crownIcon={icons.crown} initials={player.initials} level={player.level} online={player.online} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-game text-[15px] font-extrabold tracking-[.02em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.4)]">{player.name}</div>
            <div className="mt-0.5 flex items-center gap-[5px]">
              <span className="rounded-full border-[1.5px] border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] px-1.5 py-px font-game text-[9.5px] font-extrabold tracking-[.1em] text-[#3a2a00]">
                {player.tribe.tag}
              </span>
              <span className="truncate font-game text-[11px] text-[#6d5838]">
                {player.tribe.name} · <b className="text-[#3d2f1f]">{player.tribe.role}</b>
              </span>
            </div>
          </div>
        </div>
      }
      scrollable
      tabs={
        <SegmentedControl
          ariaLabel="Sections du profil"
          className="flex w-full [&>button]:min-w-0 [&>button]:flex-1 [&>button]:justify-center [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-[11px] [&>button]:uppercase [&>button]:tracking-[.06em]"
          onChange={(tab) => onTabChange(tab as PlayerProfileSheetTab)}
          options={tabs.map((tab) => ({ label: labels.tabs[tab], value: tab }))}
          size="compact"
          value={activeTab}
        />
      }
      tabsFullWidth
    >
      {activeTab === 'profile' ? (
        <ProfilePane
          icons={icons}
          labels={labels}
          onWorldSelect={onWorldSelect}
          renown={renown}
          stats={stats}
          titles={titles}
          world={world}
        />
      ) : null}
      {activeTab === 'villages' ? <VillagesPane icons={icons} labels={labels} onVillageSelect={onVillageSelect} villages={villages} /> : null}
      {activeTab === 'settings' ? <SettingsPane labels={labels} onLogout={onLogout} settings={settings} /> : null}
    </GameBottomSheetPanel>
  );
}
