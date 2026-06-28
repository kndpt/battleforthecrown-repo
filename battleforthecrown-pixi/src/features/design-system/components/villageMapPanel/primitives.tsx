import type { CSSProperties, ReactNode } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import {
  CATEGORY_COLORS,
  STYLE_META,
  STYLE_FALLBACK,
  frInt,
  frShort,
} from './meta';
import type { TroopCategory, VillageMapTypeTag } from './meta';

// ---------------------------------------------------------------------------
// Glyphes SVG inline (sans className font-game — ce sont des SVG purs)
// ---------------------------------------------------------------------------

export interface WallGlyphProps { size?: number; color?: string }
export function WallGlyph({ size = 16, color = '#fef9f0' }: WallGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M2 21V11H4V8H7V11H10V8H13V11H16V8H19V11H22V21Z" fill={color} stroke="#1f1308" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M2 15H22" stroke="#1f1308" strokeWidth="1" opacity=".22"/>
      <path d="M12 15V21" stroke="#1f1308" strokeWidth="1" opacity=".22"/>
    </svg>
  );
}

export interface ClockGlyphProps { size?: number; color?: string }
export function ClockGlyph({ size = 12, color = '#cdb88a' }: ClockGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CoordPill
// ---------------------------------------------------------------------------

export interface CoordPillProps { children: ReactNode; tone?: 'dark' | 'light' }
export function CoordPill({ children, tone = 'dark' }: CoordPillProps) {
  const dark = tone === 'dark';
  return (
    <span
      className="font-game"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px 2px 6px',
        borderRadius: 999,
        background: dark ? 'rgba(0,0,0,.32)' : 'rgba(60,38,25,.12)',
        border: `1.5px solid ${dark ? 'rgba(255,255,255,.22)' : 'rgba(60,38,25,.28)'}`,
        fontWeight: 800,
        fontSize: 11,
        color: dark ? '#f0e0c0' : '#6d5838',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '.04em',
        whiteSpace: 'nowrap',
      }}
    >
      <img
        src={publicAsset('/assets/position.png')}
        alt=""
        style={{ width: 11, height: 11, opacity: dark ? .9 : .6, filter: dark ? 'brightness(1.7)' : 'none' }}
      />
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// TypeTag
// ---------------------------------------------------------------------------

interface TagMeta { bg: string; bd: string; ink: string; label: string }
const TYPE_TAG_MAP: Record<VillageMapTypeTag, TagMeta> = {
  player:  { bg: 'linear-gradient(to bottom, #5b9bd5, #2e75b6)', bd: '#1f5288', ink: '#fff',    label: 'Joueur' },
  mine:    { bg: 'linear-gradient(to bottom, #f1c40f, #d4a017)', bd: '#9e7b0d', ink: '#3a2a00', label: 'Vous' },
  pvm:     { bg: 'linear-gradient(to bottom, #c06a5e, #7d2b22)', bd: '#561711', ink: '#fff',    label: 'PVM' },
  barbare: { bg: 'linear-gradient(to bottom, #95a5a6, #7f8c8d)', bd: '#5d6d6e', ink: '#fff',    label: 'Barbare' },
};

export interface TypeTagProps { kind: VillageMapTypeTag }
export function TypeTag({ kind }: TypeTagProps) {
  const M = TYPE_TAG_MAP[kind];
  return (
    <span
      className="font-game"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        background: M.bg,
        border: `1.5px solid ${M.bd}`,
        color: M.ink,
        fontWeight: 800,
        fontSize: 8.5,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        textShadow: M.ink === '#fff' ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)',
        whiteSpace: 'nowrap',
      }}
    >
      {M.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// PowerCell
// ---------------------------------------------------------------------------

export interface PowerCellProps { label: string; value: number }
export function PowerCell({ label, value }: PowerCellProps) {
  return (
    <div
      className="font-game"
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: 'linear-gradient(to bottom, #fff7e6, #ecd9ab)',
        border: '1.5px solid #b08d5a',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 1px 0 rgba(0,0,0,.1)',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 8.5, color: '#6d5838', letterSpacing: '.14em', textTransform: 'uppercase', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0, fontWeight: 800, fontSize: 14, color: '#3d2f1f', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>
        <img
          src={publicAsset('/assets/army-power.png')}
          alt=""
          style={{ width: 15, height: 15, flexShrink: 0, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.25))' }}
        />
        {frShort(value)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VillageTile
// ---------------------------------------------------------------------------

export interface VillageTileProps {
  size?: number;
  src?: string;
  /** Niveau de Renommée du propriétaire — badge doré bas-droite (cf. header). */
  level?: number | null;
}
export function VillageTile({ size = 42, src = '/assets/castle.png', level = null }: VillageTileProps) {
  return (
    <div
      className="font-game"
      style={{
        width: size,
        height: size,
        borderRadius: 11,
        flexShrink: 0,
        position: 'relative',
        background: 'linear-gradient(to bottom, #d9c896, #a67c52)',
        border: '2px solid #5d4a32',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 2px 0 rgba(0,0,0,.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // `overflow: visible` pour laisser déborder le badge de niveau ; le
        // contenu (img) est déjà clippé par son propre cadrage.
        overflow: level != null ? 'visible' : 'hidden',
      }}
    >
      <img
        src={publicAsset(src)}
        alt=""
        style={{ width: size * 0.84, height: size * 0.84, objectFit: 'contain', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.4))', borderRadius: 9 }}
      />
      {level != null && (
        <span
          aria-label={`Niveau ${level}`}
          style={{
            position: 'absolute',
            bottom: -5,
            right: -5,
            minWidth: 18,
            height: 18,
            padding: '0 4px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            border: '1px solid #7a5200',
            background: 'linear-gradient(to bottom, #f6d57b, #c9900c)',
            color: '#3a2a00',
            fontWeight: 900,
            fontSize: 9.5,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            boxShadow: '0 1px 2px rgba(0,0,0,.35)',
          }}
        >
          {level}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FreshnessPill
// ---------------------------------------------------------------------------

export interface FreshnessPillProps { ago: string; fresh: boolean }
export function FreshnessPill({ ago, fresh }: FreshnessPillProps) {
  return (
    <span
      className="font-game"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 9px 2px 7px',
        borderRadius: 999,
        background: fresh
          ? 'linear-gradient(to bottom, rgba(110,191,73,.22), rgba(74,140,42,.28))'
          : 'linear-gradient(to bottom, rgba(246,213,123,.25), rgba(197,158,63,.3))',
        border: `1.5px solid ${fresh ? 'rgba(74,140,42,.6)' : 'rgba(158,123,13,.6)'}`,
        fontWeight: 800,
        fontSize: 9.5,
        color: fresh ? '#3a6c1f' : '#7a4d05',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      <ClockGlyph size={11} color={fresh ? '#4a8c2a' : '#9e7b0d'}/> il y a {ago}
    </span>
  );
}

// ---------------------------------------------------------------------------
// LootChip
// ---------------------------------------------------------------------------

type LootKind = 'wood' | 'stone' | 'iron' | 'pop';
interface LootMeta { icon: string; label: string }
const LOOT_META: Record<LootKind, LootMeta> = {
  wood:  { icon: '/assets/resources/wood.png',       label: 'Bois' },
  stone: { icon: '/assets/resources/stone.png',      label: 'Pierre' },
  iron:  { icon: '/assets/resources/iron.png',       label: 'Fer' },
  pop:   { icon: '/assets/population.png',           label: 'Pop.' },
};

export interface LootChipProps { kind: LootKind; value: number }
export function LootChip({ kind, value }: LootChipProps) {
  const { icon, label } = LOOT_META[kind];
  return (
    <div
      className="font-game"
      title={`${label} · ${frInt(value)}`}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '4px 7px',
        borderRadius: 9,
        background: 'linear-gradient(to bottom, #fff7e6, #ecd9ab)',
        border: '1.5px solid #b08d5a',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 1px 0 rgba(0,0,0,.1)',
      }}
    >
      <img
        src={publicAsset(icon)}
        alt={label}
        style={{ width: 19, height: 19, flexShrink: 0, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.3))' }}
      />
      <span style={{ fontWeight: 800, fontSize: 13, color: '#3d2f1f', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 0 rgba(255,255,255,.5)', whiteSpace: 'nowrap' }}>
        {frInt(value)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TroopChip
// ---------------------------------------------------------------------------

export interface TroopChipProps {
  icon: string;
  count: number;
  category: TroopCategory;
  name?: string;
  size?: number;
  showName?: boolean;
}
export function TroopChip({ icon, count, category, name, size = 44, showName = false }: TroopChipProps) {
  const c = CATEGORY_COLORS[category];
  return (
    <div className="font-game" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 11,
          position: 'relative',
          background: `linear-gradient(to bottom, ${c.l}, ${c.d})`,
          border: `2px solid ${c.b}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={publicAsset(icon)}
          alt={name ?? ''}
          style={{ width: size * 0.74, height: size * 0.74, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }}
        />
        <span
          style={{
            position: 'absolute',
            bottom: -6,
            right: -6,
            minWidth: 19,
            height: 18,
            padding: '0 4px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom, #fef9f0, #d9c896)',
            border: '1.5px solid #5d4a32',
            borderRadius: 999,
            fontWeight: 800,
            fontSize: 10,
            color: '#3d2f1f',
            fontVariantNumeric: 'tabular-nums',
            boxShadow: '0 1px 0 rgba(0,0,0,.25)',
          }}
        >
          {count}
        </span>
      </div>
      {showName && name && (
        <span style={{ fontWeight: 700, fontSize: 8.5, color: '#6d5838', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>
          {name}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WallStat
// ---------------------------------------------------------------------------

export interface WallStatProps { level: number }
export function WallStat({ level }: WallStatProps) {
  return (
    <div className="font-game" style={{ flex: '0 0 auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom, #cdb88a, #8b7355)',
          border: '1.5px solid #5d4a32',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)',
        }}
      >
        <WallGlyph size={22} color="#fef0d2"/>
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 8.5, color: '#6d5838', letterSpacing: '.16em', textTransform: 'uppercase' }}>Rempart</div>
        <div style={{ fontWeight: 800, fontSize: 15, color: level === 0 ? '#7d1e15' : '#3d2f1f', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>Niv. {level}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StyleStat
// ---------------------------------------------------------------------------

export interface StyleStatProps { style: string }
export function StyleStat({ style }: StyleStatProps) {
  const m = STYLE_META[style] ?? STYLE_FALLBACK;
  return (
    <div className="font-game" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(to bottom, ${m.l}, ${m.d})`,
          border: `1.5px solid ${m.b}`,
          fontSize: 17,
          color: m.ink,
          textShadow: m.ink === '#fff' ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)',
        }}
      >
        {m.ico}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 8.5, color: '#6d5838', letterSpacing: '.16em', textTransform: 'uppercase' }}>Style</div>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#3d2f1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
          {style}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ArmySummary
// ---------------------------------------------------------------------------

export interface ArmySummaryProps { total: number }
export function ArmySummary({ total }: ArmySummaryProps) {
  return (
    <span className="font-game" style={{ fontWeight: 800, fontSize: 10.5, color: '#6d5838', fontVariantNumeric: 'tabular-nums' }}>
      {frInt(total)} unités
    </span>
  );
}

// ---------------------------------------------------------------------------
// CloseBtn
// ---------------------------------------------------------------------------

export interface CloseBtnProps { onClick?: () => void; tone?: 'wood' | 'light' }
export function CloseBtn({ onClick, tone = 'wood' }: CloseBtnProps) {
  const light = tone === 'light';
  return (
    <button
      onClick={onClick}
      aria-label="Fermer"
      type="button"
      className="font-game"
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        flexShrink: 0,
        background: light ? 'rgba(0,0,0,.28)' : 'linear-gradient(to bottom, #b6a78a, #8b7355)',
        border: `2px solid ${light ? 'rgba(255,255,255,.3)' : '#5d4a32'}`,
        color: '#fff',
        fontWeight: 800,
        fontSize: 14,
        lineHeight: 1,
        cursor: 'pointer',
        textShadow: '1px 1px 1px rgba(0,0,0,.5)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 2px 0 rgba(0,0,0,.18)',
      }}
    >
      ×
    </button>
  );
}

// ---------------------------------------------------------------------------
// Dossier
// ---------------------------------------------------------------------------

export interface DossierProps { children: ReactNode; style?: CSSProperties }
export function Dossier({ children, style }: DossierProps) {
  return (
    <div
      className="font-game"
      style={{
        borderRadius: 14,
        padding: 11,
        background: 'linear-gradient(to bottom, rgba(255,251,242,.75), rgba(232,212,168,.55))',
        border: '1.5px solid rgba(139,115,85,.55)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -8px 16px rgba(93,74,50,.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
