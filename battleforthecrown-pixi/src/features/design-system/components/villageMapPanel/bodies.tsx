import { publicAsset } from '@/lib/publicAsset';
import { TIER_META } from './meta';
import type { BarbarianTier, TroopCategory } from './meta';
import {
  Dossier,
  WallGlyph,
  ClockGlyph,
  LootChip,
  TroopChip,
  WallStat,
  StyleStat,
  ArmySummary,
} from './primitives';

// ---------------------------------------------------------------------------
// UnscoutedPanel
// ---------------------------------------------------------------------------

export function UnscoutedPanel() {
  const items: { ico: React.ReactNode; label: string }[] = [
    {
      ico: <img src={publicAsset('/assets/resources/wood.png')} alt="" style={{ width: 17, height: 17 }}/>,
      label: 'Butin',
    },
    {
      ico: <img src={publicAsset('/assets/army-power.png')} alt="" style={{ width: 17, height: 17 }}/>,
      label: 'Armée',
    },
    {
      ico: <WallGlyph size={17} color="#6d5838"/>,
      label: 'Rempart',
    },
  ];

  return (
    <Dossier style={{ gap: 10, padding: '15px 12px 13px', alignItems: 'center', textAlign: 'center' }}>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom, #5b9bd5, #2e75b6)',
          border: '2px solid #1f5288',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.2)',
        }}
      >
        <img src={publicAsset('/assets/lupa.png')} alt="" style={{ width: 22, height: 22 }}/>
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 14, color: '#3d2f1f', textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>
          Village non espionné
        </div>
        <div style={{ fontWeight: 600, fontSize: 10.5, color: '#6d5838', marginTop: 3, lineHeight: 1.35, maxWidth: 240 }}>
          Armée, butin et défenses inconnus. Lancez un espion pour révéler l'intel de cette cible.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, width: '100%', marginTop: 1 }}>
        {items.map(it => (
          <div
            key={it.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '7px 4px',
              borderRadius: 9,
              background: 'rgba(93,74,50,.07)',
              border: '1.5px dashed rgba(93,74,50,.32)',
            }}
          >
            <span style={{ opacity: .55, display: 'flex' }}>{it.ico}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 800, fontSize: 9.5, color: '#6d5838' }}>
              <img src={publicAsset('/assets/lock.png')} alt="" style={{ width: 9, height: 9 }}/> {it.label}
            </span>
          </div>
        ))}
      </div>
    </Dossier>
  );
}

// ---------------------------------------------------------------------------
// FullIntelPanel
// ---------------------------------------------------------------------------

export interface FullIntelArmyEntry {
  icon: string;
  count: number;
  category: TroopCategory;
  name?: string;
}

export interface FullIntelPanelProps {
  loot?: { wood: number; stone: number; iron: number };
  army?: FullIntelArmyEntry[];
  wall?: number | null;
  style?: string | null;
  freshness?: { ago: string; fresh: boolean };
}

export function FullIntelPanel({ loot, army, wall, style, freshness }: FullIntelPanelProps) {
  return (
    <Dossier style={{ gap: 9, padding: 10 }}>
      {/* Bloc Butin */}
      {loot && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 5,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 8.5, color: '#6d5838', letterSpacing: '.18em', textTransform: 'uppercase' }}>
              Butin
            </span>
            {freshness && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700, fontSize: 9, color: freshness.fresh ? '#4a8c2a' : '#9e7b0d', fontVariantNumeric: 'tabular-nums' }}>
                <ClockGlyph size={10} color={freshness.fresh ? '#4a8c2a' : '#9e7b0d'}/> il y a {freshness.ago}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <LootChip kind="wood"  value={loot.wood}/>
            <LootChip kind="stone" value={loot.stone}/>
            <LootChip kind="iron"  value={loot.iron}/>
          </div>
        </div>
      )}

      {/* Bloc Armée */}
      {army && army.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 8.5, color: '#6d5838', letterSpacing: '.18em', textTransform: 'uppercase' }}>
              Armée
            </span>
            <ArmySummary total={army.reduce((s, u) => s + u.count, 0)}/>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {army.map((entry, i) => (
              <TroopChip
                key={i}
                icon={entry.icon}
                count={entry.count}
                category={entry.category}
                name={entry.name}
                size={44}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ligne Rempart + Style */}
      {(wall != null || style) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {wall != null && <WallStat level={wall}/>}
          {wall != null && style && (
            <span style={{ width: 1, height: 30, background: 'rgba(93,74,50,.25)', flexShrink: 0 }}/>
          )}
          {style && <StyleStat style={style}/>}
        </div>
      )}
    </Dossier>
  );
}

// ---------------------------------------------------------------------------
// TierMedallion
// ---------------------------------------------------------------------------

export interface TierMedallionProps { tier: BarbarianTier; size?: number }
export function TierMedallion({ tier, size = 52 }: TierMedallionProps) {
  const m = TIER_META[tier];
  return (
    <div
      className="font-game"
      style={{
        width: size,
        height: size,
        borderRadius: 13,
        flexShrink: 0,
        position: 'relative',
        background: `linear-gradient(to bottom, ${m.l}, ${m.d})`,
        border: `2px solid ${m.b}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 2px 0 rgba(0,0,0,.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontWeight: 900,
          fontSize: 22,
          color: m.ink,
          textShadow: m.ink === '#fff' ? '1px 1px 1px rgba(0,0,0,.45)' : '0 1px 0 rgba(255,255,255,.4)',
          letterSpacing: '.01em',
        }}
      >
        T{tier}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TierScale
// ---------------------------------------------------------------------------

export interface TierScaleProps { tier: BarbarianTier }
export function TierScale({ tier }: TierScaleProps) {
  return (
    <div className="font-game" style={{ display: 'flex', gap: 4 }}>
      {([1, 2, 3, 4, 5] as BarbarianTier[]).map(n => {
        const on = n <= tier;
        const m = TIER_META[n];
        const cur = n === tier;
        return (
          <div
            key={n}
            style={{
              flex: 1,
              height: 26,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: on ? `linear-gradient(to bottom, ${m.l}, ${m.d})` : 'rgba(93,74,50,.12)',
              border: `1.5px solid ${on ? m.b : 'rgba(93,74,50,.28)'}`,
              boxShadow: cur
                ? '0 0 0 2px rgba(255,255,255,.5), inset 0 1px 0 rgba(255,255,255,.4)'
                : on
                  ? 'inset 0 1px 0 rgba(255,255,255,.3)'
                  : 'none',
              fontWeight: 800,
              fontSize: 10.5,
              color: on ? (m.ink === '#fff' ? '#fff' : '#3a2a00') : 'rgba(93,74,50,.45)',
              textShadow: on && m.ink === '#fff' ? '1px 1px 1px rgba(0,0,0,.35)' : 'none',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            T{n}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TierPanel
// ---------------------------------------------------------------------------

export interface TierPanelProps { tier: BarbarianTier }
export function TierPanel({ tier }: TierPanelProps) {
  const m = TIER_META[tier];
  return (
    <Dossier style={{ gap: 11, padding: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <TierMedallion tier={tier}/>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 8.5, color: '#6d5838', letterSpacing: '.18em', textTransform: 'uppercase' }}>
            Niveau de garnison
          </div>
          <div style={{ fontWeight: 900, fontSize: 17, color: '#3d2f1f', marginTop: 1, textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>
            {m.label}
          </div>
          <div style={{ fontWeight: 600, fontSize: 10.5, color: '#6d5838', marginTop: 2, lineHeight: 1.25 }}>
            {m.desc}
          </div>
        </div>
      </div>
      <TierScale tier={tier}/>
    </Dossier>
  );
}
