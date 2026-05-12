import { useCallback, useEffect, useMemo, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type VillageStyleId = 'fortress' | 'raiders' | 'economic' | 'balanced';
export type VillageStyleResource = 'wood' | 'stone' | 'iron' | 'crowns';

export interface VillageStyleCost {
  crowns: number;
  iron: number;
  stone: number;
  wood: number;
}

export interface VillageStyleEffect {
  label: string;
  value: string;
}

export interface VillageStyleOption {
  bonuses: VillageStyleEffect[];
  color: {
    border: string;
    dark: string;
    light: string;
  };
  cost: VillageStyleCost;
  glyph: string;
  id: VillageStyleId;
  maluses: VillageStyleEffect[];
  name: string;
  tagline: string;
}

export interface VillageStyleModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  castleLevel?: number;
  cooldownHours?: number;
  currentStyleId?: VillageStyleId;
  initialStyleId?: VillageStyleId;
  onAdopt?: (styleId: VillageStyleId) => void;
  onChange?: (styleId: VillageStyleId) => void;
  onClose?: () => void;
  open: boolean;
  options?: VillageStyleOption[];
  stock?: VillageStyleCost;
  value?: VillageStyleId;
}

export interface VillageStyleTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  currentStyleId?: VillageStyleId;
  onClick?: () => void;
  options?: VillageStyleOption[];
}

const resourceIcons: Record<VillageStyleResource, string> = {
  crowns: '/assets/casual-icons/crown.png',
  iron: '/assets/resources/iron.png',
  stone: '/assets/resources/stone.png',
  wood: '/assets/resources/wood.png',
};

export const villageStyleOptions: VillageStyleOption[] = [
  {
    bonuses: [
      { label: 'Défense unité', value: '+25%' },
      { label: 'Stockage', value: '+10%' },
    ],
    color: { border: '#1f3e66', dark: '#2e5a88', light: '#5b8fbf' },
    cost: { crowns: 80, iron: 50, stone: 100, wood: 200 },
    glyph: '🛡',
    id: 'fortress',
    maluses: [{ label: 'Vitesse de déplacement', value: '−20%' }],
    name: 'Forteresse',
    tagline: 'Murs hauts, portes lourdes.',
  },
  {
    bonuses: [
      { label: 'Vitesse de déplacement', value: '+15%' },
      { label: 'Pillage', value: '+10%' },
    ],
    color: { border: '#a93226', dark: '#c0392b', light: '#e74c3c' },
    cost: { crowns: 80, iron: 200, stone: 100, wood: 50 },
    glyph: '⚔',
    id: 'raiders',
    maluses: [{ label: 'Défense', value: '−10%' }],
    name: 'Raiders',
    tagline: 'Légers, rapides, sans pitié.',
  },
  {
    bonuses: [
      { label: 'Production', value: '+20%' },
      { label: 'Population max', value: '+10%' },
    ],
    color: { border: '#3a6c1f', dark: '#4a8c2a', light: '#6ebf49' },
    cost: { crowns: 60, iron: 50, stone: 200, wood: 100 },
    glyph: '⚙',
    id: 'economic',
    maluses: [
      { label: 'Attaque', value: '−10%' },
      { label: 'Défense', value: '−10%' },
    ],
    name: 'Économique',
    tagline: 'Plus de bras, plus de récolte.',
  },
  {
    bonuses: [],
    color: { border: '#5d4a32', dark: '#7d5a3a', light: '#b89968' },
    cost: { crowns: 80, iron: 100, stone: 100, wood: 100 },
    glyph: '⚖',
    id: 'balanced',
    maluses: [],
    name: 'Équilibré',
    tagline: 'Aucun engagement. Aucune faveur.',
  },
];

const defaultStock: VillageStyleCost = { crowns: 142, iron: 1240, stone: 940, wood: 1820 };

export function scaleVillageStyleCost(cost: VillageStyleCost, castleLevel: number): VillageStyleCost {
  const multiplier = Math.pow(1.25, Math.max(0, castleLevel - 4));

  return {
    crowns: Math.round(cost.crowns * multiplier),
    iron: Math.round(cost.iron * multiplier),
    stone: Math.round(cost.stone * multiplier),
    wood: Math.round(cost.wood * multiplier),
  };
}

function getStyleVars(style: VillageStyleOption): CSSProperties {
  return {
    '--village-style-border': style.color.border,
    '--village-style-dark': style.color.dark,
    '--village-style-light': style.color.light,
  } as CSSProperties;
}

function isAffordable(cost: VillageStyleCost, stock: VillageStyleCost): boolean {
  return stock.crowns >= cost.crowns && stock.iron >= cost.iron && stock.stone >= cost.stone && stock.wood >= cost.wood;
}

function Glyph({ children, className, size = 26 }: { children: ReactNode; className?: string; size?: number }) {
  return (
    <span
      className={cn('font-game font-extrabold leading-none text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.5)]', className)}
      style={{ fontSize: size }}
    >
      {children}
    </span>
  );
}

function CostChip({ ok, resource, value }: { ok: boolean; resource: VillageStyleResource; value: number }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1 rounded-full border-[1.5px] py-0 pl-1 pr-[7px] font-game text-[10.5px] font-bold tabular-nums text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]',
        ok
          ? 'border-[rgba(0,0,0,.3)] bg-[rgba(0,0,0,.22)] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]'
          : 'border-[#a93226] bg-[linear-gradient(to_bottom,rgba(192,57,43,.45),rgba(192,57,43,.7))] text-[#ffe2dc] shadow-[inset_0_0_8px_rgba(192,57,43,.4)]',
      )}
    >
      <img alt="" className="size-3.5 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]" src={publicAsset(resourceIcons[resource])} />
      {value}
    </span>
  );
}

function PixelButton({
  children,
  className,
  disabled,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        'inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border-2 border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] px-[18px] py-[9px] font-game text-sm font-bold tracking-[.04em] text-white shadow-[0_3px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)] [text-shadow:1px_1px_2px_rgba(0,0,0,.6)] enabled:cursor-pointer enabled:active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ModalShell({
  accent,
  accentLight,
  children,
  onClose,
}: {
  accent: string;
  accentLight: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className="relative flex max-h-full w-80 max-w-[94%] flex-col overflow-hidden rounded-2xl border-4 border-[#3c2619] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] shadow-[0_0_0_2px_var(--modal-accent),0_12px_32px_rgba(0,0,0,.6),inset_0_2px_0_rgba(255,255,255,.55)]"
      style={{ '--modal-accent': accent } as CSSProperties}
    >
      <div
        className="h-2 border-b border-[rgba(0,0,0,.25)] bg-[linear-gradient(to_right,var(--modal-accent-light),var(--modal-accent))]"
        style={{ '--modal-accent': accent, '--modal-accent-light': accentLight } as CSSProperties}
      />
      <div className="flex items-center gap-2 px-3.5 pb-1.5 pt-2.5">
        <div className="min-w-0 flex-1">
          <div className="font-game text-[9.5px] font-bold uppercase tracking-[.3em] text-[#6d5838]">Salle du Conseil</div>
          <div className="font-game text-base font-extrabold tracking-[.02em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
            Choisir une voie
          </div>
        </div>
        <button
          aria-label="Fermer"
          className="size-7 shrink-0 cursor-pointer rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#b6a78a,#8b7355)] font-game text-sm font-extrabold leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
      <div className="mx-3.5 h-px bg-[rgba(93,74,50,.35)]" />
      {children}
    </div>
  );
}

function VillageStyleHeroCard({
  current,
  index,
  option,
  total,
}: {
  current: boolean;
  index: number;
  option: VillageStyleOption;
  total: number;
}) {
  const hasEffects = option.bonuses.length > 0 || option.maluses.length > 0;

  return (
    <div
      className="relative min-h-[220px] overflow-hidden rounded-[14px] border-[3px] border-[var(--village-style-border)] bg-[linear-gradient(160deg,var(--village-style-light)_0%,var(--village-style-dark)_100%)] p-[14px_14px_12px] shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_6px_14px_rgba(0,0,0,.35)]"
      style={getStyleVars(option)}
    >
      <div className="pointer-events-none absolute -right-[18px] -top-[18px] select-none font-game text-[200px] font-black leading-none text-[rgba(255,255,255,.10)]">
        {option.glyph}
      </div>
      <div className="relative flex items-center gap-2.5">
        <div className="flex size-[46px] shrink-0 items-center justify-center rounded-xl border-2 border-[rgba(255,255,255,.4)] bg-[rgba(0,0,0,.28)] shadow-[inset_0_1px_0_rgba(255,255,255,.35)]">
          <Glyph>{option.glyph}</Glyph>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-game text-[9.5px] font-bold uppercase tracking-[.22em] text-[rgba(255,255,255,.7)]">
            Voie {index + 1} / {total}
          </div>
          <div className="font-game text-xl font-black leading-[1.1] tracking-[.03em] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.55),0_1px_0_rgba(255,255,255,.15)]">
            {option.name}
          </div>
        </div>
        {current ? (
          <span className="rounded-full border-[1.5px] border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] px-[7px] py-[3px] font-game text-[9px] font-extrabold tracking-[.14em] text-[#3a2a00]">
            ACTUEL
          </span>
        ) : null}
      </div>
      <div className="my-2 font-game text-[11.5px] italic text-[rgba(255,255,255,.92)] [text-shadow:1px_1px_2px_rgba(0,0,0,.5)]">« {option.tagline} »</div>
      <div className="flex flex-col gap-[5px] rounded-[10px] border-[1.5px] border-[rgba(255,255,255,.18)] bg-[rgba(0,0,0,.22)] px-2.5 py-2">
        {!hasEffects ? (
          <div className="py-1.5 text-center font-game text-[11.5px] font-bold tracking-[.06em] text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]">
            Neutre — aucun bonus, aucun malus
          </div>
        ) : (
          <>
            {option.bonuses.map((bonus) => (
              <HeroStat key={bonus.label} kind="bonus" {...bonus} />
            ))}
            {option.maluses.map((malus) => (
              <HeroStat key={malus.label} kind="malus" {...malus} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function HeroStat({ kind, label, value }: VillageStyleEffect & { kind: 'bonus' | 'malus' }) {
  const bonus = kind === 'bonus';

  return (
    <div className="flex items-center gap-2 font-game">
      <span
        className={cn(
          'w-[42px] shrink-0 text-[9px] font-extrabold tracking-[.14em] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]',
          bonus ? 'text-[#d6f5b8]' : 'text-[#ffd1cc]',
        )}
      >
        {bonus ? 'BONUS' : 'MALUS'}
      </span>
      <span className="flex-1 text-[11.5px] font-bold text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]">{label}</span>
      <span
        className={cn(
          'text-[13px] font-black tabular-nums [text-shadow:1px_1px_2px_rgba(0,0,0,.5)]',
          bonus ? 'text-[#d6f5b8]' : 'text-[#ffd1cc]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function VillageStyleModal({
  castleLevel = 5,
  className,
  cooldownHours = 24,
  currentStyleId = 'balanced',
  initialStyleId,
  onAdopt,
  onChange,
  onClose,
  open,
  options = villageStyleOptions,
  stock = defaultStock,
  value,
  ...props
}: VillageStyleModalProps) {
  const startId = initialStyleId ?? currentStyleId;
  const startIndex = Math.max(0, options.findIndex((option) => option.id === startId));
  const controlledIndex = value ? options.findIndex((option) => option.id === value) : -1;
  const [internalIndex, setInternalIndex] = useState(startIndex);
  const index = controlledIndex >= 0 ? controlledIndex : internalIndex;
  const option = options[index] ?? options[0];
  const cost = useMemo(() => scaleVillageStyleCost(option.cost, castleLevel), [castleLevel, option.cost]);
  const affordable = isAffordable(cost, stock);
  const current = option.id === currentStyleId;
  const multiplier = Math.pow(1.25, Math.max(0, castleLevel - 4)).toFixed(2);

  const setIndex = useCallback(
    (nextIndex: number | ((currentIndex: number) => number)) => {
      const resolved = typeof nextIndex === 'function' ? nextIndex(index) : nextIndex;
      const bounded = (resolved + options.length) % options.length;
      if (controlledIndex < 0) {
        setInternalIndex(bounded);
      }
      onChange?.(options[bounded].id);
    },
    [controlledIndex, index, onChange, options],
  );

  useEffect(() => {
    if (open && controlledIndex < 0) {
      setInternalIndex(startIndex);
    }
  }, [controlledIndex, open, startIndex]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setIndex((currentIndex) => currentIndex - 1);
      if (event.key === 'ArrowRight') setIndex((currentIndex) => currentIndex + 1);
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, open, setIndex]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex items-center justify-center bg-[rgba(0,0,0,.62)] p-3 [backdrop-filter:blur(3px)]',
        className,
      )}
      onClick={onClose}
      {...props}
    >
      <div onClick={(event) => event.stopPropagation()}>
        <ModalShell accent={option.color.dark} accentLight={option.color.light} onClose={onClose}>
          <div className="relative px-3.5 pt-3">
            <VillageStyleHeroCard current={current} index={index} option={option} total={options.length} />
            <button
              aria-label="Voie précédente"
              className="absolute left-[-2px] top-1/2 z-[2] size-auto h-11 w-8 -translate-y-1/2 cursor-pointer rounded-[10px] border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,#a67c52,#5d4a32)] font-game text-lg font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.25)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
              onClick={() => setIndex((currentIndex) => currentIndex - 1)}
              type="button"
            >
              ‹
            </button>
            <button
              aria-label="Voie suivante"
              className="absolute right-[-2px] top-1/2 z-[2] size-auto h-11 w-8 -translate-y-1/2 cursor-pointer rounded-[10px] border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,#a67c52,#5d4a32)] font-game text-lg font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.25)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]"
              onClick={() => setIndex((currentIndex) => currentIndex + 1)}
              type="button"
            >
              ›
            </button>
          </div>
          <div className="flex justify-center gap-1.5 px-0 pb-1 pt-2">
            {options.map((item, itemIndex) => (
              <button
                aria-label={`Voie ${itemIndex + 1}`}
                className={cn(
                  'h-2 rounded-full border-[1.5px] border-[rgba(93,74,50,.55)] p-0 transition-[width,background] duration-[180ms]',
                  itemIndex === index
                    ? 'w-[22px] bg-[linear-gradient(to_bottom,var(--village-style-light),var(--village-style-dark))]'
                    : 'w-2 bg-[rgba(93,74,50,.25)]',
                )}
                key={item.id}
                onClick={() => setIndex(itemIndex)}
                style={getStyleVars(item)}
                type="button"
              />
            ))}
          </div>
          <div className="flex flex-col gap-2 px-3.5 pb-3 pt-1">
            <div className="flex flex-col gap-2 rounded-xl border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(60,38,25,.96),rgba(78,56,34,.96))] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_2px_0_rgba(0,0,0,.2)]">
              <div className="flex items-center justify-between">
                <span className="font-game text-[9.5px] font-bold uppercase tracking-[.18em] text-[#f0e0c0]">Coût · Château {castleLevel}</span>
                <span className="font-game text-[9px] font-bold tracking-[.14em] text-[#cdb88a]">×{multiplier}</span>
              </div>
              <div className="flex flex-wrap gap-[5px]">
                <CostChip ok={stock.wood >= cost.wood} resource="wood" value={cost.wood} />
                <CostChip ok={stock.stone >= cost.stone} resource="stone" value={cost.stone} />
                <CostChip ok={stock.iron >= cost.iron} resource="iron" value={cost.iron} />
                <CostChip ok={stock.crowns >= cost.crowns} resource="crowns" value={cost.crowns} />
              </div>
            </div>
            <PixelButton disabled={!affordable || current} onClick={() => onAdopt?.(option.id)}>
              {current ? 'Voie actuelle' : `Adopter — ${option.name}`}
            </PixelButton>
            <div
              className={cn(
                'text-center font-game text-[9.5px]',
                !affordable && !current ? 'font-bold text-[#c0392b]' : 'text-[#cdb88a]',
              )}
            >
              {current ? 'Cette voie est déjà la vôtre.' : !affordable ? 'Ressources insuffisantes' : `Verrouillé ${cooldownHours} h · invisible des voisins`}
            </div>
          </div>
        </ModalShell>
      </div>
    </div>
  );
}

export function VillageStyleTrigger({
  className,
  currentStyleId = 'balanced',
  onClick,
  options = villageStyleOptions,
  ...props
}: VillageStyleTriggerProps) {
  const current = options.find((option) => option.id === currentStyleId) ?? options[0];

  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-[var(--village-style-border)] bg-[linear-gradient(to_bottom,var(--village-style-light),var(--village-style-dark))] py-[7px] pl-[7px] pr-3 font-game shadow-[0_3px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)]',
        className,
      )}
      onClick={onClick}
      style={getStyleVars(current)}
      type="button"
      {...props}
    >
      <span className="flex size-7 items-center justify-center rounded-[7px] border-[1.5px] border-[rgba(255,255,255,.35)] bg-[rgba(0,0,0,.28)] shadow-[inset_0_1px_0_rgba(255,255,255,.25)]">
        <Glyph size={16}>{current.glyph}</Glyph>
      </span>
      <span className="flex flex-col items-start leading-[1.1]">
        <span className="text-[8.5px] font-bold uppercase tracking-[.2em] text-[rgba(255,255,255,.8)] [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]">
          Voie du village
        </span>
        <span className="text-[13px] font-extrabold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]">{current.name}</span>
      </span>
    </button>
  );
}
