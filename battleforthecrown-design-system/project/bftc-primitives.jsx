/* global React */
/* Battle for the Crown — atomic primitives shared across modals & panels.
   Pure presentational pieces; no data, no state.
   Exposed on window so JSX scripts in <script type="text/babel"> can use them. */

const BFTC_T = {
  font: 'var(--bftc-font-display)',
  ink: '#3d2f1f',
  inkSoft: '#6d5838',
  parch1: '#fef9f0',
  parch3: '#e8d4a8',
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

// Resource asset map — single source of truth so screens don't hardcode paths.
const BFTC_RESOURCE_ICON = {
  wood:   'assets/resources/wood.png',
  stone:  'assets/resources/stone.png',
  iron:   'assets/resources/iron.png',
  crowns: 'assets/casual-icons/crown.png',
};

// ---------- Glyph ----------
// Display-font character with the engraved text-shadow we use everywhere.
function Glyph({ char, size = 22, color = '#fff', style }) {
  return (
    <span style={{
      fontFamily: BFTC_T.font, fontWeight: 800, fontSize: size, lineHeight: 1,
      color, textShadow: '1px 1px 2px rgba(0,0,0,.5)', ...style,
    }}>{char}</span>
  );
}

// ---------- PixelBtn ----------
// Gradient game button with the 5-variant action palette. Press = sinks 2px.
function PixelBtn({ variant = 'success', size = 'md', disabled, children, onClick, style, full }) {
  const v = {
    success: { bg: `linear-gradient(to bottom, ${BFTC_T.greenL}, ${BFTC_T.greenD})`, bd: BFTC_T.greenB, c: '#fff' },
    info:    { bg: `linear-gradient(to bottom, ${BFTC_T.blueL},  ${BFTC_T.blueD})`,  bd: BFTC_T.blueB,  c: '#fff' },
    danger:  { bg: `linear-gradient(to bottom, ${BFTC_T.redL},   ${BFTC_T.redD})`,   bd: BFTC_T.redB,   c: '#fff' },
    warning: { bg: `linear-gradient(to bottom, ${BFTC_T.goldL},  ${BFTC_T.goldD})`,  bd: BFTC_T.goldB,  c: '#3a2a00' },
    neutral: { bg: `linear-gradient(to bottom, ${BFTC_T.stoneL}, ${BFTC_T.stoneD})`, bd: BFTC_T.stoneB, c: '#fff' },
    wood:    { bg: `linear-gradient(to bottom, ${BFTC_T.woodLight}, ${BFTC_T.woodDeep})`, bd: BFTC_T.woodBark, c: '#fff' },
  }[variant];
  const s = {
    xs: { fs: 11, pad: '4px 9px' },
    sm: { fs: 12, pad: '6px 12px' },
    md: { fs: 14, pad: '9px 18px' },
    lg: { fs: 15, pad: '11px 22px' },
  }[size];
  return (
    <button onClick={onClick} disabled={disabled} className="bftc-pixel-btn" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontFamily: BFTC_T.font, fontWeight: 700, fontSize: s.fs, letterSpacing: '.04em',
      color: v.c, textShadow: v.c === '#fff' ? '1px 1px 2px rgba(0,0,0,.6)' : 'none',
      padding: s.pad, border: `2px solid ${v.bd}`, borderRadius: 10, background: v.bg,
      boxShadow: '0 3px 0 rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.28)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      width: full ? '100%' : 'auto', transition: 'transform .1s, filter .15s',
      ...style,
    }}>{children}</button>
  );
}

// ---------- CostChip ----------
// Resource cost token: icon + tabular value. ok=false flips to red wash.
function CostChip({ icon, value, ok = true, size = 'md' }) {
  const s = size === 'sm'
    ? { fs: 10.5, h: 22, ico: 14, pad: '0 7px 0 4px', gap: 4 }
    : { fs: 12,   h: 26, ico: 16, pad: '0 9px 0 5px', gap: 5 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: s.gap,
      height: s.h, padding: s.pad,
      borderRadius: 999,
      background: ok
        ? 'rgba(0,0,0,.22)'
        : 'linear-gradient(to bottom, rgba(192,57,43,.45), rgba(192,57,43,.7))',
      border: `1.5px solid ${ok ? 'rgba(0,0,0,.3)' : BFTC_T.redB}`,
      fontFamily: BFTC_T.font, fontWeight: 700, fontSize: s.fs,
      color: ok ? '#fff' : '#ffe2dc',
      textShadow: '1px 1px 1px rgba(0,0,0,.5)',
      fontVariantNumeric: 'tabular-nums',
      boxShadow: ok ? 'inset 0 1px 0 rgba(255,255,255,.08)' : 'inset 0 0 8px rgba(192,57,43,.4)',
    }}>
      <img src={icon} alt="" style={{ width: s.ico, height: s.ico, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.5))' }} />
      {value}
    </span>
  );
}

// ---------- CostStrip ----------
// Dark-wood footer strip with eyebrow label, the 4 resource chips, and an
// optional scaling multiplier badge.
function CostStrip({ cost, stock, label = 'Coût', multiplier, dense = false, style }) {
  const sizes = dense
    ? { pad: '8px 10px', gap: 5 }
    : { pad: '10px 12px', gap: 5 };
  return (
    <div style={{
      borderRadius: 12,
      background: 'linear-gradient(to bottom, rgba(60,38,25,.96), rgba(78,56,34,.96))',
      border: `2px solid ${BFTC_T.woodBark}`,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.15), 0 2px 0 rgba(0,0,0,.2)',
      padding: sizes.pad,
      display: 'flex', flexDirection: 'column', gap: 8,
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 700, color: '#f0e0c0',
          letterSpacing: '.18em', textTransform: 'uppercase',
        }}>{label}</span>
        {multiplier && (
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, color: '#cdb88a',
            letterSpacing: '.14em',
          }}>{multiplier}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: sizes.gap, flexWrap: 'wrap' }}>
        <CostChip size="sm" icon={BFTC_RESOURCE_ICON.wood}   value={cost.wood}   ok={!stock || stock.wood   >= cost.wood} />
        <CostChip size="sm" icon={BFTC_RESOURCE_ICON.stone}  value={cost.stone}  ok={!stock || stock.stone  >= cost.stone} />
        <CostChip size="sm" icon={BFTC_RESOURCE_ICON.iron}   value={cost.iron}   ok={!stock || stock.iron   >= cost.iron} />
        <CostChip size="sm" icon={BFTC_RESOURCE_ICON.crowns} value={cost.crowns} ok={!stock || stock.crowns >= cost.crowns} />
      </div>
    </div>
  );
}

// ---------- StatLine ----------
// Bonus (+) / Malus (−) row with colored circular sign, label, value.
// kind = 'bonus' | 'malus'. tone = 'parchment' (dark text) | 'dark' (light text on color bg).
function StatLine({ kind, label, value, tone = 'parchment', dense = false }) {
  const isPos = kind === 'bonus';
  const onDark = tone === 'dark';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: dense ? 6 : 7,
      fontFamily: BFTC_T.font, fontSize: dense ? 11 : 11.5, fontWeight: 700,
    }}>
      <span style={{
        width: dense ? 13 : 16, height: dense ? 13 : 16, borderRadius: 99,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: isPos
          ? `linear-gradient(to bottom, ${BFTC_T.greenL}, ${BFTC_T.greenD})`
          : `linear-gradient(to bottom, ${BFTC_T.redL}, ${BFTC_T.redD})`,
        border: `1.5px solid ${isPos ? BFTC_T.greenB : BFTC_T.redB}`,
        color: '#fff', fontWeight: 900, fontSize: dense ? 9 : 11, lineHeight: 1,
        textShadow: '1px 1px 1px rgba(0,0,0,.5)', flexShrink: 0,
      }}>{isPos ? '+' : '−'}</span>
      <span style={{
        flex: 1,
        color: onDark ? '#fff' : BFTC_T.inkSoft,
        textShadow: onDark ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
      }}>{label}</span>
      <span style={{
        fontWeight: 900,
        color: onDark
          ? (isPos ? '#d6f5b8' : '#ffd1cc')
          : (isPos ? BFTC_T.greenD : BFTC_T.redD),
        textShadow: onDark ? '1px 1px 2px rgba(0,0,0,.5)' : 'none',
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  );
}

// ---------- ModalShell ----------
// Parchment modal with double-ringed border, gold strip on top (color-tinted
// to the variant), title block, close button, then a children area.
// Use as outer container for any in-game modal.
function ModalShell({
  title, eyebrow,
  accent = BFTC_T.goldD, accentLight = BFTC_T.goldL,
  onClose, width = 320, maxHeight,
  children,
}) {
  return (
    <div style={{
      width, maxWidth: '94%', borderRadius: 16, overflow: 'hidden',
      background: `linear-gradient(to bottom, ${BFTC_T.parch1}, ${BFTC_T.parch3})`,
      border: `4px solid ${BFTC_T.woodBark}`,
      boxShadow: `0 0 0 2px ${accent}, 0 12px 32px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.55)`,
      position: 'relative', display: 'flex', flexDirection: 'column',
      maxHeight,
    }}>
      <div style={{
        height: 8, background: `linear-gradient(to right, ${accentLight}, ${accent})`,
        borderBottom: '1px solid rgba(0,0,0,.25)',
      }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && (
            <div style={{
              fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 700, letterSpacing: '.3em',
              color: BFTC_T.inkSoft, textTransform: 'uppercase',
            }}>{eyebrow}</div>
          )}
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 16, fontWeight: 800, color: BFTC_T.ink,
            letterSpacing: '.02em', textShadow: '0 1px 0 rgba(255,255,255,.5)',
          }}>{title}</div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Fermer" style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(to bottom, #b6a78a, #8b7355)',
            border: '2px solid #5d4a32', color: '#fff',
            fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 14, lineHeight: 1,
            textShadow: '1px 1px 1px rgba(0,0,0,.5)',
            cursor: 'pointer', flexShrink: 0,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.2)',
          }}>×</button>
        )}
      </div>
      <div style={{ height: 1, background: 'rgba(93,74,50,.35)', margin: '0 14px' }}/>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ---------- ModalOverlay ----------
// Dim + blur background that catches clicks to close.
function ModalOverlay({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 30,
      background: 'rgba(0,0,0,.62)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 12,
      animation: 'bftcFadeIn .2s ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        animation: 'bftcModalIn .25s cubic-bezier(.2,.7,.3,1.2)',
      }}>{children}</div>
    </div>
  );
}

// ---------- Pill ----------
// Small status badge — "ACTUEL", "VERROUILLÉ", "NOUVEAU", "PREMIUM", etc.
function Pill({ children, tone = 'gold', size = 'md', style }) {
  const t = {
    gold:   { bg: `linear-gradient(to bottom, ${BFTC_T.goldL}, ${BFTC_T.goldD})`,   bd: BFTC_T.goldB,   c: '#3a2a00' },
    green:  { bg: `linear-gradient(to bottom, ${BFTC_T.greenL}, ${BFTC_T.greenD})`, bd: BFTC_T.greenB,  c: '#fff' },
    red:    { bg: `linear-gradient(to bottom, ${BFTC_T.redL}, ${BFTC_T.redD})`,     bd: BFTC_T.redB,    c: '#fff' },
    stone:  { bg: `linear-gradient(to bottom, ${BFTC_T.stoneL}, ${BFTC_T.stoneD})`, bd: BFTC_T.stoneB,  c: '#fff' },
  }[tone];
  const s = size === 'sm'
    ? { fs: 8.5, pad: '2px 5px' }
    : { fs: 9.5, pad: '3px 7px' };
  return (
    <span style={{
      fontFamily: BFTC_T.font, fontSize: s.fs, fontWeight: 800, letterSpacing: '.14em',
      padding: s.pad, borderRadius: 999,
      background: t.bg, border: `1.5px solid ${t.bd}`, color: t.c,
      textShadow: t.c === '#fff' ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)',
      ...style,
    }}>{children}</span>
  );
}

// Inject keyframes for modal entrance once.
if (typeof document !== 'undefined' && !document.getElementById('bftc-modal-anim')) {
  const s = document.createElement('style');
  s.id = 'bftc-modal-anim';
  s.textContent = `
    @keyframes bftcFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes bftcModalIn {
      from { opacity: 0; transform: translateY(8px) scale(.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .bftc-pixel-btn:not(:disabled):hover { filter: brightness(1.08); }
    .bftc-pixel-btn:not(:disabled):active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,.22), inset 0 2px 4px rgba(0,0,0,.4) !important; }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  BFTC_T, BFTC_RESOURCE_ICON,
  Glyph, PixelBtn, CostChip, CostStrip, StatLine,
  ModalShell, ModalOverlay, Pill,
});
