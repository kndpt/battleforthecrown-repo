/* global React */
/* Village Style Modal — 3 variants. Each variant renders inside a 360×720 phone frame,
   sitting on top of a faint village background. */

const { useState, useMemo } = React;

// ---------- Tokens ----------
const T = {
  font: 'var(--bftc-font-display)',
  ink: '#3d2f1f',
  inkSoft: '#6d5838',
  parch1: '#fef9f0',
  parch2: '#f4e4c1',
  parch3: '#e8d4a8',
  parchDeep: '#d4c094',
  woodLight: '#a67c52',
  woodDeep: '#5d4a32',
  woodBark: '#3c2619',
  goldL: 'var(--game-gold-light)',
  goldD: 'var(--game-gold-dark)',
  goldB: 'var(--game-gold-border)',
  greenL: 'var(--game-green-light)',
  greenD: 'var(--game-green-dark)',
  greenB: 'var(--game-green-border)',
  redL: 'var(--game-red-light)',
  redD: 'var(--game-red-dark)',
  redB: 'var(--game-red-border)',
  blueL: 'var(--game-blue-light)',
  blueD: 'var(--game-blue-dark)',
  blueB: 'var(--game-blue-border)',
  stoneL: 'var(--game-stone-light)',
  stoneD: 'var(--game-stone-dark)',
  stoneB: 'var(--game-stone-border)',
};

// ---------- Styles data ----------
const STYLES = [
  {
    id: 'fortress',
    name: 'Forteresse',
    glyph: '🛡',
    tagline: 'Murs hauts, portes lourdes.',
    color: { l: '#5b8fbf', d: '#2e5a88', b: '#1f3e66' }, // ardoise / bleu défense
    bonuses: [
      { label: 'Défense unité', value: '+25%' },
      { label: 'Stockage', value: '+10%' },
    ],
    maluses: [
      { label: 'Vitesse de déplacement', value: '−20%' },
    ],
    dominant: 'wood',
    cost: { wood: 200, stone: 100, iron: 50, crowns: 80 },
    flavor: 'Vos troupes formées ici tiennent les remparts comme la pierre.',
  },
  {
    id: 'raiders',
    name: 'Raiders',
    glyph: '⚔',
    tagline: 'Légers, rapides, sans pitié.',
    color: { l: T.redL, d: T.redD, b: T.redB },
    bonuses: [
      { label: 'Vitesse de déplacement', value: '+15%' },
      { label: 'Pillage', value: '+10%' },
    ],
    maluses: [
      { label: 'Défense', value: '−10%' },
    ],
    dominant: 'iron',
    cost: { wood: 50, stone: 100, iron: 200, crowns: 80 },
    flavor: 'L\'éclat du fer précède celui des couronnes.',
  },
  {
    id: 'economic',
    name: 'Économique',
    glyph: '⚙',
    tagline: 'Plus de bras, plus de récolte.',
    color: { l: T.greenL, d: T.greenD, b: T.greenB },
    bonuses: [
      { label: 'Production', value: '+20%' },
      { label: 'Population max', value: '+10%' },
    ],
    maluses: [
      { label: 'Attaque', value: '−10%' },
      { label: 'Défense', value: '−10%' },
    ],
    dominant: 'stone',
    cost: { wood: 100, stone: 200, iron: 50, crowns: 60 },
    flavor: 'Les fondations civiles tiennent plus longtemps que les guerres.',
  },
  {
    id: 'balanced',
    name: 'Équilibré',
    glyph: '⚖',
    tagline: 'Aucun engagement. Aucune faveur.',
    color: { l: '#b89968', d: '#7d5a3a', b: '#5d4a32' },
    bonuses: [],
    maluses: [],
    dominant: null,
    cost: { wood: 100, stone: 100, iron: 100, crowns: 80 },
    flavor: 'Le village garde ses portes ouvertes et son fer en réserve.',
  },
];

const RESOURCE_ICON = {
  wood: 'assets/resources/wood.png',
  stone: 'assets/resources/stone.png',
  iron: 'assets/resources/iron.png',
  crowns: 'assets/casual-icons/crown.png',
};

// Scale a cost by château level (×1.25^(N-4))
function scaleCost(cost, level) {
  const m = Math.pow(1.25, Math.max(0, level - 4));
  return {
    wood: Math.round(cost.wood * m),
    stone: Math.round(cost.stone * m),
    iron: Math.round(cost.iron * m),
    crowns: Math.round(cost.crowns * m),
  };
}

// Player's mock stock to compute affordability
const STOCK = { wood: 1820, stone: 940, iron: 1240, crowns: 142 };

// ---------- Primitives ----------
function Glyph({ char, size = 22, color = '#fff' }) {
  return (
    <span style={{
      fontFamily: T.font, fontWeight: 800, fontSize: size, lineHeight: 1,
      color, textShadow: '1px 1px 2px rgba(0,0,0,.5)',
    }}>{char}</span>
  );
}

function CostChip({ icon, value, ok = true, size = 'md' }) {
  const s = size === 'sm'
    ? { fs: 10, h: 22, ico: 14, pad: '0 6px 0 4px', gap: 4 }
    : { fs: 12, h: 26, ico: 16, pad: '0 8px 0 5px', gap: 5 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: s.gap,
      height: s.h, padding: s.pad,
      borderRadius: 999,
      background: ok ? 'rgba(0,0,0,.18)' : 'linear-gradient(to bottom, rgba(192,57,43,.35), rgba(192,57,43,.55))',
      border: `1.5px solid ${ok ? 'rgba(0,0,0,.25)' : T.redB}`,
      fontFamily: T.font, fontWeight: 700, fontSize: s.fs,
      color: ok ? '#fff' : '#ffd9d4',
      textShadow: '1px 1px 1px rgba(0,0,0,.5)',
      fontVariantNumeric: 'tabular-nums',
    }}>
      <img src={icon} alt="" style={{ width: s.ico, height: s.ico, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.4))' }} />
      {value}
    </span>
  );
}

function PixelBtn({ variant = 'success', size = 'md', disabled, children, onClick, style, full }) {
  const v = {
    success: { bg: `linear-gradient(to bottom, ${T.greenL}, ${T.greenD})`, bd: T.greenB, c: '#fff' },
    info:    { bg: `linear-gradient(to bottom, ${T.blueL},  ${T.blueD})`,  bd: T.blueB,  c: '#fff' },
    danger:  { bg: `linear-gradient(to bottom, ${T.redL},   ${T.redD})`,   bd: T.redB,   c: '#fff' },
    warning: { bg: `linear-gradient(to bottom, ${T.goldL},  ${T.goldD})`,  bd: T.goldB,  c: '#3a2a00' },
    neutral: { bg: `linear-gradient(to bottom, ${T.stoneL}, ${T.stoneD})`, bd: T.stoneB, c: '#fff' },
  }[variant];
  const s = { sm: { fs: 12, pad: '6px 12px' }, md: { fs: 14, pad: '9px 18px' }, lg: { fs: 15, pad: '11px 22px' } }[size];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontFamily: T.font, fontWeight: 700, fontSize: s.fs, letterSpacing: '.04em',
      color: v.c, textShadow: v.c === '#fff' ? '1px 1px 2px rgba(0,0,0,.6)' : 'none',
      padding: s.pad, border: `2px solid ${v.bd}`, borderRadius: 10, background: v.bg,
      boxShadow: '0 3px 0 rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.28)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      width: full ? '100%' : 'auto',
      ...style,
    }}>{children}</button>
  );
}

// Tiny line metric: + value with green tone or − value with red tone
function StatLine({ kind, label, value, dense }) {
  const isPos = kind === 'bonus';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: T.font, fontSize: dense ? 10.5 : 12, fontWeight: 600,
      color: T.ink,
    }}>
      <span style={{
        width: dense ? 12 : 14, height: dense ? 12 : 14, borderRadius: 99,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: isPos ? `linear-gradient(to bottom, ${T.greenL}, ${T.greenD})` : `linear-gradient(to bottom, ${T.redL}, ${T.redD})`,
        border: `1.5px solid ${isPos ? T.greenB : T.redB}`,
        color: '#fff', fontWeight: 900, fontSize: dense ? 9 : 10, lineHeight: 1,
        textShadow: '1px 1px 1px rgba(0,0,0,.5)', flexShrink: 0,
      }}>{isPos ? '+' : '−'}</span>
      <span style={{ flex: 1, color: T.inkSoft }}>{label}</span>
      <span style={{
        fontWeight: 800, color: isPos ? T.greenD : T.redD,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  );
}

// Phone frame (no status bar; we want the modal to feel native)
function Phone({ children, label, sub }) {
  return (
    <div style={{
      width: 360, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{
        position: 'relative',
        width: 360, height: 720, borderRadius: 36, overflow: 'hidden',
        background: '#1a1a2e', border: '8px solid #0c0c1a',
        boxShadow: '0 30px 60px rgba(0,0,0,.6), inset 0 0 0 2px #2a2a45',
      }}>
        {/* Background — village mock so the modal has something to sit over */}
        <VillageBg/>
        {children}
      </div>
      {label && (
        <div style={{ textAlign: 'center', fontFamily: T.font }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: '.04em' }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

// Faint behind-modal screen — header + a few buildings & a hint of bottom nav
function VillageBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#7c9756 0%,#a8b977 28%,#cdbf8e 60%,#b89968 100%)' }}>
      {/* topbar mock */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 62,
        background: 'linear-gradient(to bottom, rgba(60,38,25,.94), rgba(78,56,34,.94))',
        borderBottom: '2px solid #8b7355',
        display: 'flex', alignItems: 'center', padding: '8px 10px', gap: 8,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(to bottom,#8b6f47,#6d5838)', border: '2px solid #5d4a32' }}/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ height: 14, width: 100, background: 'rgba(255,255,255,.18)', borderRadius: 4 }}/>
          <div style={{ height: 22, background: 'rgba(0,0,0,.32)', borderRadius: 6 }}/>
        </div>
      </div>
      {/* a couple of buildings */}
      <img src="assets/buildings/castle.png" alt="" style={{ position: 'absolute', top: 200, left: 70, width: 130, opacity: .8 }} />
      <img src="assets/buildings/warehouse.png" alt="" style={{ position: 'absolute', top: 380, left: 200, width: 100, opacity: .8 }} />
      <img src="assets/buildings/farm.png" alt="" style={{ position: 'absolute', top: 430, left: 30, width: 110, opacity: .8 }} />
      {/* bottom nav mock */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 64,
        background: 'linear-gradient(to top, rgba(60,38,25,.95), rgba(78,56,34,.9))',
        borderTop: '2px solid #8b7355',
      }}/>
      {/* dim overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)' }}/>
    </div>
  );
}

// Modal frame — parchment, double-ringed border, gold strip header, X close.
function ModalShell({ title, eyebrow, accent = T.goldD, accentLight = T.goldL, onClose, width = 320, children, maxHeight }) {
  return (
    <div style={{
      width, maxWidth: '94%', borderRadius: 16, overflow: 'hidden',
      background: `linear-gradient(to bottom, ${T.parch1}, ${T.parch3})`,
      border: `4px solid ${T.woodBark}`,
      boxShadow: `0 0 0 2px ${accent}, 0 12px 32px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.55)`,
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      maxHeight,
    }}>
      <div style={{
        height: 8, background: `linear-gradient(to right, ${accentLight}, ${accent})`,
        borderBottom: '1px solid rgba(0,0,0,.25)',
      }}/>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 6px',
      }}>
        <div style={{ flex: 1 }}>
          {eyebrow && (
            <div style={{
              fontFamily: T.font, fontSize: 9.5, fontWeight: 700, letterSpacing: '.3em',
              color: T.inkSoft, textTransform: 'uppercase',
            }}>{eyebrow}</div>
          )}
          <div style={{
            fontFamily: T.font, fontSize: 16, fontWeight: 800, color: T.ink,
            letterSpacing: '.02em', textShadow: '0 1px 0 rgba(255,255,255,.5)',
          }}>{title}</div>
        </div>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(to bottom, #b6a78a, #8b7355)',
          border: '2px solid #5d4a32', color: '#fff',
          fontFamily: T.font, fontWeight: 800, fontSize: 14, lineHeight: 1,
          textShadow: '1px 1px 1px rgba(0,0,0,.5)',
          cursor: 'pointer', flexShrink: 0,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)',
        }}>×</button>
      </div>
      <div style={{ height: 1, background: 'rgba(93,74,50,.35)', margin: '0 14px' }}/>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// =====================================================================
// VARIANT A — 2×2 grid pick, with selected style detailed in a footer panel.
// Compact, decisional, classic clay-strategy look.
// =====================================================================
function ModalA() {
  const [sel, setSel] = useState('raiders');
  const [current] = useState('balanced'); // current village style
  const castleLevel = 5;
  const style = STYLES.find(s => s.id === sel);
  const cost = scaleCost(style.cost, castleLevel);
  const affordable = STOCK.wood >= cost.wood && STOCK.stone >= cost.stone && STOCK.iron >= cost.iron && STOCK.crowns >= cost.crowns;
  return (
    <ModalShell
      eyebrow="Salle du Conseil"
      title="Style du village"
      accent={style.color.d}
      accentLight={style.color.l}
      onClose={() => {}}
      width={324}
    >
      <div style={{ padding: '10px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Village pill + current */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', borderRadius: 10,
          background: 'rgba(93,74,50,.12)', border: '1.5px solid rgba(93,74,50,.25)',
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(to bottom,#a67c52,#7d5a3a)',
            border: '2px solid #5d4a32',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: T.font, fontWeight: 800, fontSize: 13,
            textShadow: '1px 1px 1px rgba(0,0,0,.5)',
          }}>K</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.font, fontSize: 12, fontWeight: 700, color: T.ink }}>Keep de Kelven</div>
            <div style={{ fontFamily: T.font, fontSize: 10, color: T.inkSoft }}>
              Style actuel · <b>{STYLES.find(s => s.id === current).name}</b>
            </div>
          </div>
          <span style={{
            fontFamily: T.font, fontSize: 9.5, fontWeight: 700, letterSpacing: '.18em',
            color: T.inkSoft, textTransform: 'uppercase',
          }}>Château {castleLevel}</span>
        </div>

        {/* 2x2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {STYLES.map(s => {
            const active = s.id === sel;
            const isCurrent = s.id === current;
            return (
              <button
                key={s.id}
                onClick={() => setSel(s.id)}
                style={{
                  position: 'relative',
                  padding: '10px 8px 8px',
                  background: active
                    ? `linear-gradient(to bottom, ${s.color.l}, ${s.color.d})`
                    : `linear-gradient(to bottom, ${T.parch1}, ${T.parch3})`,
                  border: `2.5px solid ${active ? s.color.b : 'rgba(93,74,50,.55)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  boxShadow: active
                    ? `0 0 0 2px rgba(255,255,255,.45), 0 6px 12px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.35)`
                    : '0 2px 0 rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.45)',
                  transition: 'all .15s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: active
                    ? 'rgba(0,0,0,.25)'
                    : `linear-gradient(to bottom, ${s.color.l}, ${s.color.d})`,
                  border: `2px solid ${active ? 'rgba(255,255,255,.4)' : s.color.b}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)',
                }}>
                  <Glyph char={s.glyph} size={20} color="#fff" />
                </div>
                <div style={{
                  fontFamily: T.font, fontWeight: 800, fontSize: 12,
                  color: active ? '#fff' : T.ink,
                  textShadow: active ? '1px 1px 2px rgba(0,0,0,.5)' : 'none',
                  letterSpacing: '.02em',
                }}>{s.name}</div>
                {/* mini metric strip */}
                <div style={{
                  display: 'flex', gap: 6,
                  fontFamily: T.font, fontWeight: 700, fontSize: 10,
                  color: active ? 'rgba(255,255,255,.95)' : T.inkSoft,
                  textShadow: active ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
                }}>
                  {s.bonuses.length > 0 ? (
                    <>
                      <span style={{ color: active ? '#d6f5b8' : T.greenD }}>+{s.bonuses.length}</span>
                      <span style={{ opacity: .5 }}>·</span>
                      <span style={{ color: active ? '#ffd1cc' : T.redD }}>−{s.maluses.length}</span>
                    </>
                  ) : (
                    <span style={{ opacity: .75 }}>Neutre</span>
                  )}
                </div>
                {isCurrent && (
                  <span style={{
                    position: 'absolute', top: -7, right: -6,
                    fontFamily: T.font, fontSize: 8.5, fontWeight: 800, letterSpacing: '.12em',
                    padding: '2px 6px', borderRadius: 999,
                    background: `linear-gradient(to bottom, ${T.goldL}, ${T.goldD})`,
                    border: `1.5px solid ${T.goldB}`,
                    color: '#3a2a00',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)',
                  }}>ACTUEL</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected — details */}
        <div style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,.6), rgba(244,228,193,.55))',
          border: `2px solid ${style.color.b}`,
          borderRadius: 12,
          padding: '10px 11px 11px',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -12px 22px rgba(0,0,0,.06)',
        }}>
          <div style={{
            fontFamily: T.font, fontStyle: 'italic', fontSize: 11.5, color: T.inkSoft,
            paddingLeft: 10, borderLeft: `3px solid ${style.color.d}`,
            marginBottom: 8,
          }}>« {style.flavor} »</div>

          {style.bonuses.length === 0 && style.maluses.length === 0 ? (
            <div style={{ fontFamily: T.font, fontSize: 12, color: T.inkSoft, textAlign: 'center', padding: '4px 0' }}>
              Aucun bonus, aucun malus. Le village garde toutes ses options ouvertes.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {style.bonuses.map(b => <StatLine key={b.label} kind="bonus" label={b.label} value={b.value} />)}
              {style.maluses.map(b => <StatLine key={b.label} kind="malus" label={b.label} value={b.value} />)}
            </div>
          )}
        </div>
      </div>

      {/* Footer cost + actions */}
      <div style={{
        marginTop: 10, padding: '10px 14px 12px',
        background: 'linear-gradient(to bottom, rgba(93,74,50,.92), rgba(60,38,25,.95))',
        borderTop: `2px solid ${T.woodBark}`,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        }}>
          <span style={{ fontFamily: T.font, fontSize: 10, fontWeight: 700, color: '#f0e0c0', letterSpacing: '.18em', textTransform: 'uppercase' }}>
            Coût du changement
          </span>
          <span style={{
            fontFamily: T.font, fontSize: 9.5, fontWeight: 700, color: '#cdb88a', letterSpacing: '.14em', textTransform: 'uppercase',
          }}>×{(Math.pow(1.25, castleLevel - 4)).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <CostChip icon={RESOURCE_ICON.wood}   value={cost.wood}   ok={STOCK.wood   >= cost.wood} />
          <CostChip icon={RESOURCE_ICON.stone}  value={cost.stone}  ok={STOCK.stone  >= cost.stone} />
          <CostChip icon={RESOURCE_ICON.iron}   value={cost.iron}   ok={STOCK.iron   >= cost.iron} />
          <CostChip icon={RESOURCE_ICON.crowns} value={cost.crowns} ok={STOCK.crowns >= cost.crowns} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <PixelBtn variant="neutral" size="md" full>Annuler</PixelBtn>
          <PixelBtn variant="success" size="md" full disabled={!affordable || sel === current}>
            Adopter
          </PixelBtn>
        </div>
        <div style={{
          fontFamily: T.font, fontSize: 9.5, color: '#cdb88a', textAlign: 'center',
          letterSpacing: '.04em',
        }}>
          Cooldown <b style={{ color: '#fff' }}>24 h</b> avant le prochain changement · style caché des voisins
        </div>
      </div>
    </ModalShell>
  );
}

// =====================================================================
// VARIANT B — Vertical list of styles with inline bonuses/malus
// (info-dense, lets the player compare all 4 at a glance)
// =====================================================================
function ModalB() {
  const [sel, setSel] = useState('fortress');
  const [current] = useState('balanced');
  const castleLevel = 5;
  const style = STYLES.find(s => s.id === sel);
  const cost = scaleCost(style.cost, castleLevel);
  const affordable = STOCK.wood >= cost.wood && STOCK.stone >= cost.stone && STOCK.iron >= cost.iron && STOCK.crowns >= cost.crowns;
  return (
    <ModalShell
      eyebrow="Salle du Conseil · Château 5"
      title="Spécialiser le village"
      accent={style.color.d}
      accentLight={style.color.l}
      onClose={() => {}}
      width={328}
    >
      <div style={{ padding: '10px 12px 6px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {STYLES.map(s => {
          const active = s.id === sel;
          const isCurrent = s.id === current;
          return (
            <button
              key={s.id}
              onClick={() => setSel(s.id)}
              style={{
                width: '100%', padding: 0, textAlign: 'left',
                border: `2.5px solid ${active ? s.color.b : 'rgba(93,74,50,.45)'}`,
                borderRadius: 11,
                background: active
                  ? `linear-gradient(to right, ${s.color.l} 0%, ${s.color.d} 65%, ${s.color.d} 100%)`
                  : `linear-gradient(to bottom, ${T.parch1}, ${T.parch3})`,
                boxShadow: active
                  ? '0 4px 0 rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.35)'
                  : '0 2px 0 rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.45)',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex', alignItems: 'stretch',
              }}
            >
              {/* Left glyph block */}
              <div style={{
                width: 50, flexShrink: 0,
                background: active
                  ? 'rgba(0,0,0,.25)'
                  : `linear-gradient(to bottom, ${s.color.l}, ${s.color.d})`,
                borderRight: `2px solid ${active ? 'rgba(0,0,0,.35)' : s.color.b}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <Glyph char={s.glyph} size={24} color="#fff" />
                {isCurrent && (
                  <span style={{
                    position: 'absolute', top: 3, left: 3,
                    width: 8, height: 8, borderRadius: 99,
                    background: `linear-gradient(to bottom, ${T.goldL}, ${T.goldD})`,
                    border: `1.5px solid ${T.goldB}`,
                    boxShadow: '0 0 6px rgba(246,213,123,.7)',
                  }}/>
                )}
              </div>
              {/* Body */}
              <div style={{ flex: 1, padding: '7px 10px 8px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontFamily: T.font, fontWeight: 800, fontSize: 14,
                    color: active ? '#fff' : T.ink,
                    textShadow: active ? '1px 1px 2px rgba(0,0,0,.5)' : 'none',
                    letterSpacing: '.02em',
                  }}>{s.name}</span>
                  {isCurrent && (
                    <span style={{
                      fontFamily: T.font, fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em',
                      padding: '1.5px 5px', borderRadius: 99,
                      background: `linear-gradient(to bottom, ${T.goldL}, ${T.goldD})`,
                      border: `1.5px solid ${T.goldB}`,
                      color: '#3a2a00',
                    }}>ACTUEL</span>
                  )}
                </div>
                {s.bonuses.length + s.maluses.length === 0 ? (
                  <div style={{
                    fontFamily: T.font, fontSize: 10.5, fontStyle: 'italic',
                    color: active ? 'rgba(255,255,255,.85)' : T.inkSoft,
                    marginTop: 2,
                  }}>Aucun bonus · Aucun malus</div>
                ) : (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 3,
                    fontFamily: T.font, fontSize: 10.5, fontWeight: 700,
                  }}>
                    {s.bonuses.map(b => (
                      <span key={b.label} style={{ color: active ? '#d6f5b8' : T.greenD, textShadow: active ? '1px 1px 1px rgba(0,0,0,.4)' : 'none' }}>
                        {b.value} {b.label.toLowerCase()}
                      </span>
                    ))}
                    {s.maluses.map(b => (
                      <span key={b.label} style={{ color: active ? '#ffd1cc' : T.redD, textShadow: active ? '1px 1px 1px rgba(0,0,0,.4)' : 'none' }}>
                        {b.value} {b.label.toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Right radio dot */}
              <div style={{
                width: 26, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 99,
                  border: `2px solid ${active ? '#fff' : 'rgba(93,74,50,.6)'}`,
                  background: active ? '#fff' : 'rgba(255,255,255,.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 0 8px rgba(255,255,255,.7)' : 'inset 0 1px 2px rgba(0,0,0,.2)',
                }}>
                  {active && <span style={{ width: 7, height: 7, borderRadius: 99, background: s.color.d }}/>}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Cost strip */}
      <div style={{
        margin: '6px 12px 0', padding: '8px 10px',
        borderRadius: 10,
        background: 'linear-gradient(to bottom, rgba(60,38,25,.96), rgba(78,56,34,.96))',
        border: `2px solid ${T.woodBark}`,
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.15)',
      }}>
        <span style={{
          fontFamily: T.font, fontSize: 9.5, fontWeight: 700, color: '#f0e0c0',
          letterSpacing: '.16em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>Coût</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, flex: 1, justifyContent: 'flex-end' }}>
          <CostChip size="sm" icon={RESOURCE_ICON.wood}   value={cost.wood}   ok={STOCK.wood   >= cost.wood} />
          <CostChip size="sm" icon={RESOURCE_ICON.stone}  value={cost.stone}  ok={STOCK.stone  >= cost.stone} />
          <CostChip size="sm" icon={RESOURCE_ICON.iron}   value={cost.iron}   ok={STOCK.iron   >= cost.iron} />
          <CostChip size="sm" icon={RESOURCE_ICON.crowns} value={cost.crowns} ok={STOCK.crowns >= cost.crowns} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <PixelBtn variant="neutral" size="md" full>Annuler</PixelBtn>
          <PixelBtn variant="success" size="md" full disabled={!affordable || sel === current}>
            Adopter
          </PixelBtn>
        </div>
        <div style={{
          fontFamily: T.font, fontSize: 9.5, color: T.inkSoft, textAlign: 'center',
        }}>
          Cooldown <b>24 h</b> · révélé seulement par scout ESPION
        </div>
      </div>
    </ModalShell>
  );
}

// =====================================================================
// VARIANT C — Carousel: one focused style, hero glyph, full bonuses,
// dots + arrows to browse, "Adopter" CTA stamped at the bottom.
// More visual / decisional / committal feel.
// =====================================================================
function ModalC() {
  const order = ['fortress', 'raiders', 'economic', 'balanced'];
  const [idx, setIdx] = useState(1);
  const [current] = useState('balanced');
  const castleLevel = 5;
  const sel = order[idx];
  const style = STYLES.find(s => s.id === sel);
  const cost = scaleCost(style.cost, castleLevel);
  const affordable = STOCK.wood >= cost.wood && STOCK.stone >= cost.stone && STOCK.iron >= cost.iron && STOCK.crowns >= cost.crowns;

  return (
    <ModalShell
      eyebrow="Salle du Conseil"
      title="Choisir une voie"
      accent={style.color.d}
      accentLight={style.color.l}
      onClose={() => {}}
      width={320}
    >
      <div style={{ position: 'relative', padding: '12px 14px 0' }}>
        {/* Hero card */}
        <div style={{
          position: 'relative',
          borderRadius: 14, overflow: 'hidden',
          background: `linear-gradient(160deg, ${style.color.l} 0%, ${style.color.d} 100%)`,
          border: `3px solid ${style.color.b}`,
          padding: '14px 14px 12px',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 6px 14px rgba(0,0,0,.35)',
          minHeight: 220,
        }}>
          {/* faint glyph backdrop */}
          <div style={{
            position: 'absolute', right: -18, top: -18,
            fontFamily: T.font, fontSize: 200, lineHeight: 1, fontWeight: 900,
            color: 'rgba(255,255,255,.10)', pointerEvents: 'none', userSelect: 'none',
          }}>{style.glyph}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: 'rgba(0,0,0,.28)',
              border: '2px solid rgba(255,255,255,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)',
            }}>
              <Glyph char={style.glyph} size={26} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: T.font, fontSize: 9.5, fontWeight: 700,
                color: 'rgba(255,255,255,.7)', letterSpacing: '.22em', textTransform: 'uppercase',
              }}>Voie {idx + 1} / {order.length}</div>
              <div style={{
                fontFamily: T.font, fontSize: 20, fontWeight: 900,
                color: '#fff', letterSpacing: '.03em',
                textShadow: '1px 1px 2px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.15)',
                lineHeight: 1.1,
              }}>{style.name}</div>
            </div>
            {sel === current && (
              <span style={{
                fontFamily: T.font, fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
                padding: '3px 7px', borderRadius: 999,
                background: `linear-gradient(to bottom, ${T.goldL}, ${T.goldD})`,
                border: `1.5px solid ${T.goldB}`,
                color: '#3a2a00',
              }}>ACTUEL</span>
            )}
          </div>

          <div style={{
            fontFamily: T.font, fontSize: 11.5, fontStyle: 'italic',
            color: 'rgba(255,255,255,.92)', margin: '8px 0 10px',
            textShadow: '1px 1px 2px rgba(0,0,0,.5)',
          }}>« {style.tagline} »</div>

          <div style={{
            background: 'rgba(0,0,0,.22)',
            border: '1.5px solid rgba(255,255,255,.18)',
            borderRadius: 10, padding: '8px 10px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {style.bonuses.length === 0 && style.maluses.length === 0 ? (
              <div style={{
                fontFamily: T.font, fontSize: 11.5, fontWeight: 700, color: '#fff',
                textAlign: 'center', padding: '6px 0', letterSpacing: '.06em',
                textShadow: '1px 1px 1px rgba(0,0,0,.4)',
              }}>Neutre — aucun bonus, aucun malus</div>
            ) : (
              <>
                {style.bonuses.map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: T.font }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
                      color: '#d6f5b8', textShadow: '1px 1px 1px rgba(0,0,0,.5)',
                      width: 38, flexShrink: 0,
                    }}>BONUS</span>
                    <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: '#fff', textShadow: '1px 1px 1px rgba(0,0,0,.4)' }}>{b.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#d6f5b8', textShadow: '1px 1px 2px rgba(0,0,0,.5)', fontVariantNumeric: 'tabular-nums' }}>{b.value}</span>
                  </div>
                ))}
                {style.maluses.map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: T.font }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
                      color: '#ffd1cc', textShadow: '1px 1px 1px rgba(0,0,0,.5)',
                      width: 38, flexShrink: 0,
                    }}>MALUS</span>
                    <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: '#fff', textShadow: '1px 1px 1px rgba(0,0,0,.4)' }}>{b.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#ffd1cc', textShadow: '1px 1px 2px rgba(0,0,0,.5)', fontVariantNumeric: 'tabular-nums' }}>{b.value}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* arrows */}
        <button
          onClick={() => setIdx((idx - 1 + order.length) % order.length)}
          style={{
            position: 'absolute', left: -2, top: '50%', transform: 'translateY(-50%)',
            width: 32, height: 44, borderRadius: 10,
            background: 'linear-gradient(to bottom,#a67c52,#5d4a32)', border: '2px solid #3c2619',
            color: '#fff', fontFamily: T.font, fontWeight: 900, fontSize: 18, cursor: 'pointer',
            textShadow: '1px 1px 1px rgba(0,0,0,.5)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.25)',
          }}>‹</button>
        <button
          onClick={() => setIdx((idx + 1) % order.length)}
          style={{
            position: 'absolute', right: -2, top: '50%', transform: 'translateY(-50%)',
            width: 32, height: 44, borderRadius: 10,
            background: 'linear-gradient(to bottom,#a67c52,#5d4a32)', border: '2px solid #3c2619',
            color: '#fff', fontFamily: T.font, fontWeight: 900, fontSize: 18, cursor: 'pointer',
            textShadow: '1px 1px 1px rgba(0,0,0,.5)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.25)',
          }}>›</button>
      </div>

      {/* dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 0 4px' }}>
        {order.map((id, i) => (
          <button key={id} onClick={() => setIdx(i)} style={{
            width: i === idx ? 22 : 8, height: 8, borderRadius: 99,
            border: '1.5px solid rgba(93,74,50,.55)',
            background: i === idx
              ? `linear-gradient(to bottom, ${STYLES.find(s => s.id === id).color.l}, ${STYLES.find(s => s.id === id).color.d})`
              : 'rgba(93,74,50,.25)',
            cursor: 'pointer', padding: 0,
            transition: 'width .18s',
          }}/>
        ))}
      </div>

      {/* Cost + CTA */}
      <div style={{
        margin: '4px 14px 12px', padding: '10px 12px',
        borderRadius: 12,
        background: 'linear-gradient(to bottom, rgba(60,38,25,.96), rgba(78,56,34,.96))',
        border: `2px solid ${T.woodBark}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.15)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: T.font, fontSize: 9.5, fontWeight: 700, color: '#f0e0c0', letterSpacing: '.16em', textTransform: 'uppercase' }}>
            Coût · Château {castleLevel}
          </span>
          <span style={{ fontFamily: T.font, fontSize: 9, color: '#cdb88a', letterSpacing: '.12em' }}>
            ×{Math.pow(1.25, castleLevel - 4).toFixed(2)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <CostChip size="sm" icon={RESOURCE_ICON.wood}   value={cost.wood}   ok={STOCK.wood   >= cost.wood} />
          <CostChip size="sm" icon={RESOURCE_ICON.stone}  value={cost.stone}  ok={STOCK.stone  >= cost.stone} />
          <CostChip size="sm" icon={RESOURCE_ICON.iron}   value={cost.iron}   ok={STOCK.iron   >= cost.iron} />
          <CostChip size="sm" icon={RESOURCE_ICON.crowns} value={cost.crowns} ok={STOCK.crowns >= cost.crowns} />
        </div>
        <PixelBtn variant="success" size="md" full disabled={!affordable || sel === current}>
          Adopter — {style.name}
        </PixelBtn>
        <div style={{ fontFamily: T.font, fontSize: 9.5, color: '#cdb88a', textAlign: 'center' }}>
          Verrouillé 24 h · invisible des voisins
        </div>
      </div>
    </ModalShell>
  );
}

// ---------- Wrapped variants (each in a phone frame, modal centered) ----------
function PhoneA() {
  return (
    <Phone>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <ModalA/>
      </div>
    </Phone>
  );
}
function PhoneB() {
  return (
    <Phone>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <ModalB/>
      </div>
    </Phone>
  );
}
function PhoneC() {
  return (
    <Phone>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <ModalC/>
      </div>
    </Phone>
  );
}

Object.assign(window, { ModalA, ModalB, ModalC, PhoneA, PhoneB, PhoneC });
