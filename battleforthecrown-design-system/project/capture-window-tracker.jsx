/* global React, BFTC_T, PixelBtn, Pill */
/* Battle for the Crown — CaptureWindowTracker
   --------------------------------------------------------------------------
   Composant de suivi persistant des captures de villages barbares en cours.
   Une capture est un état LONG (2h–12h), critique et réhydratable :
   le joueur doit pouvoir répondre, sans toast, à 3 questions :

       1.  QUEL village est en cours de capture ?
       2.  OÙ est le Seigneur immobilisé ?
       3.  COMBIEN de temps reste-t-il ?

   Forme : liste compacte de CaptureWindowCard, intégrée comme onglet dans
   le panneau Expéditions (bottom sheet mobile ou panel desktop). Jamais
   plein écran ; jamais mélangée aux formations de troupes.

   États visuels :
       en-cours          —  bande gold,       Pill gold     « Capture en cours »
       bientôt-terminée  —  bande verte pulse Pill green    « Bientôt terminée »
       interrompue       —  bande rouge,      Pill red      « Capture interrompue »      (transitoire)
       réussie           —  bande indigo,     Pill green    « Capture réussie »          (transitoire)

   Note : interrompue / réussie sont conservées pour les events arrivant
   pendant que le panneau est ouvert ; après refetch, l'item disparaît.
   -------------------------------------------------------------------------- */

const { useState, useEffect, useRef } = React;

// ---------- tokens ----------
const CW = {
  font: 'var(--bftc-font-display)',
  ink: '#3d2f1f',
  inkSoft: '#6d5838',
  inkMute: '#8b7355',
  parch1: '#fef9f0',
  parch2: '#f9f3e8',
  parch3: '#f5e6d3',
  parch4: '#e8d4a8',
  woodLight: '#a67c52',
  woodDeep: '#5d4a32',
  woodBark: '#3c2619',
  goldL: '#f1c40f',
  goldD: '#d4a017',
  goldB: '#9e7b0d',
  greenL: '#6ebf49',
  greenD: '#4a8c2a',
  greenB: '#3a6c1f',
  redL: '#e74c3c',
  redD: '#c0392b',
  redB: '#a93226',
  blueL: '#5b9bd5',
  blueD: '#2e75b6',
  blueB: '#1f5288',
  // dedicated "victory" indigo so it doesn't read like "training info"
  indigoL: '#8a7ad8',
  indigoD: '#5b4cb0',
  indigoB: '#3f3290',
};

// Map state -> visual tokens. The "stripe" colour is what carries the
// fastest semantic read across the list ; the pill copy is the explicit
// confirmation, the time block is the data answer.
const STATE_TOKENS = {
  'en-cours': {
    stripe: `linear-gradient(180deg, ${CW.goldL}, ${CW.goldD})`,
    stripeBorder: CW.goldB,
    pillTone: 'gold',
    pillLabel: 'Capture en cours',
    timeColor: CW.ink,
    barFill: `linear-gradient(90deg, ${CW.goldL}, ${CW.goldD})`,
    glow: null,
  },
  'bientot-terminee': {
    stripe: `linear-gradient(180deg, ${CW.greenL}, ${CW.greenD})`,
    stripeBorder: CW.greenB,
    pillTone: 'green',
    pillLabel: 'Bientôt terminée',
    timeColor: CW.greenD,
    barFill: `linear-gradient(90deg, ${CW.greenL}, ${CW.greenD})`,
    glow: '0 0 0 2px rgba(110,191,73,.35), 0 0 18px rgba(110,191,73,.45)',
    pulse: true,
  },
  'interrompue': {
    stripe: `linear-gradient(180deg, ${CW.redL}, ${CW.redD})`,
    stripeBorder: CW.redB,
    pillTone: 'red',
    pillLabel: 'Capture interrompue',
    timeColor: CW.redD,
    barFill: `linear-gradient(90deg, ${CW.redL}, ${CW.redD})`,
    glow: null,
    muted: true,
  },
  'reussie': {
    stripe: `linear-gradient(180deg, ${CW.indigoL}, ${CW.indigoD})`,
    stripeBorder: CW.indigoB,
    pillTone: 'green',
    pillLabel: 'Capture réussie',
    timeColor: CW.indigoD,
    barFill: `linear-gradient(90deg, ${CW.indigoL}, ${CW.indigoD})`,
    glow: '0 0 0 2px rgba(91,76,176,.3)',
  },
};

// ---------- TierBadge ----------
// Hexagonal-feel tier crest. 5 tiers (T1..T5) with escalating gold weight.
// T1/T2 wood, T3 gold, T4 red-gold, T5 violet-gold. Lifted from the in-game
// barbarian-village tier convention.
function TierBadge({ tier, size = 48 }) {
  const t = String(tier).toUpperCase();
  const palette = {
    T1: { bg: `linear-gradient(180deg, #b89970, #6d5838)`, bd: '#3c2619', ink: '#f0e0c0' },
    T2: { bg: `linear-gradient(180deg, #d4b585, #8b6f47)`, bd: '#3c2619', ink: '#fff' },
    T3: { bg: `linear-gradient(180deg, ${CW.goldL}, ${CW.goldD})`, bd: CW.goldB, ink: '#3a2a00' },
    T4: { bg: `linear-gradient(180deg, #f1a40f, #c0392b)`, bd: '#7d2218', ink: '#fff8d0' },
    T5: { bg: `linear-gradient(180deg, #f6d57b, #5b4cb0)`, bd: '#3f3290', ink: '#fff8d0' },
  }[t] || {};
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: 12,
      background: palette.bg,
      border: `2.5px solid ${palette.bd}`,
      boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.45), inset 0 -10px 16px rgba(0,0,0,.22), 0 2px 0 rgba(0,0,0,.25)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 1,
    }}>
      <span style={{
        fontFamily: CW.font, fontWeight: 900, fontSize: size * 0.42,
        color: palette.ink, lineHeight: 1,
        textShadow: '1px 1px 2px rgba(0,0,0,.55)',
        letterSpacing: '.02em',
      }}>{t}</span>
      <span style={{
        fontFamily: CW.font, fontWeight: 700, fontSize: size * 0.16,
        color: palette.ink, letterSpacing: '.2em', textTransform: 'uppercase',
        opacity: .8,
      }}>TIER</span>
    </div>
  );
}

// ---------- Inline icons ----------
// Position glyph (pin) — matches assets/icons/position.png stroke, drawn
// inline so we can tint per state.
function PinGlyph({ size = 12, color = '#6d5838' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function ClockGlyph({ size = 13, color = '#3d2f1f' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  );
}
function CastleGlyph({ size = 11, color = '#6d5838' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke={color} strokeWidth=".5" strokeLinejoin="round">
      <path d="M3 21V9l2 1V7l2 1V6l2 1V4l2 1V4l2-1v2l2-1v3l2-1v3l2-1v12H3Z"/>
    </svg>
  );
}
function HandRedGlyph({ size = 11 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={CW.redD} stroke={CW.redB} strokeWidth="1">
      <path d="M8 11V5a1.5 1.5 0 0 1 3 0v5h1V3.5a1.5 1.5 0 0 1 3 0V10h1V5a1.5 1.5 0 0 1 3 0v9.5c0 3.5-2.5 7-7 7-3 0-5-1.5-6.5-4L4 13c-.5-.9 0-2 1-2 .8 0 1.5.5 2 1l1 1h0Z"/>
    </svg>
  );
}

// ---------- CapturePill ----------
// Tone-mapped status pill (matches design-system Pill but inlined for the
// indigo "réussie" tone which isn't in the base set).
function CapturePill({ tone, children, pulse }) {
  const t = {
    gold:  { bg: `linear-gradient(180deg, ${CW.goldL}, ${CW.goldD})`,   bd: CW.goldB,   c: '#3a2a00' },
    green: { bg: `linear-gradient(180deg, ${CW.greenL}, ${CW.greenD})`, bd: CW.greenB,  c: '#fff' },
    red:   { bg: `linear-gradient(180deg, ${CW.redL}, ${CW.redD})`,     bd: CW.redB,    c: '#fff' },
  }[tone];
  return (
    <span className={pulse ? 'cw-pulse' : undefined} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: CW.font, fontWeight: 800, fontSize: 9.5,
      letterSpacing: '.16em', textTransform: 'uppercase',
      padding: '3px 8px 3px 7px', borderRadius: 999,
      background: t.bg, border: `1.5px solid ${t.bd}`, color: t.c,
      textShadow: t.c === '#fff' ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45)',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: 99,
        background: t.c, boxShadow: '0 0 4px rgba(255,255,255,.4)',
      }}/>
      {children}
    </span>
  );
}

// ---------- ProgressArc ----------
// Slim "fenêtre encore ouverte" bar — explicitly NOT a construction queue.
// We render it with state-tinted fill and a faint hatched track to hint
// "duration remaining", not "production progress".
function CaptureBar({ percent, state }) {
  const tok = STATE_TOKENS[state];
  return (
    <div style={{
      position: 'relative',
      height: 6, borderRadius: 99, overflow: 'hidden',
      background: 'rgba(60,38,25,.16)',
      border: '1px solid rgba(60,38,25,.22)',
      boxShadow: 'inset 0 1px 1px rgba(0,0,0,.18)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(60,38,25,.07) 0 3px, transparent 3px 6px)',
      }}/>
      <div style={{
        height: '100%',
        width: `${Math.max(2, Math.min(100, percent))}%`,
        background: tok.barFill,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5), inset 0 -2px 4px rgba(0,0,0,.22)',
        transition: 'width .6s ease-out',
      }}/>
    </div>
  );
}

// ---------- CaptureWindowCard ----------
// Single capture line. Layout fits 360px portrait one-handed:
//
//   ┃ ╔═══╗   Village barbare ………… [Capture en cours]
//   ┃ ║ T3║   ◉ 259|242  ·  ⌂ Royaume du Nord
//   ┃ ╚═══╝   ─────────────────────────────────
//   ┃           ⏱  3h 42m                Fin à 21:18
//   ┃         ▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱  38 %
//
function CaptureWindowCard({
  target = 'Village barbare',
  tier = 'T3',
  coords = '259|242',
  origin = 'Royaume du Nord',
  timeRemaining = '3h 42m',
  endTime = '21:18',
  percent = 38,
  noble = 'Seigneur Aldric',
  state = 'en-cours',
  onView,
}) {
  const tok = STATE_TOKENS[state];
  const muted = state === 'interrompue';

  return (
    <article style={{
      position: 'relative',
      borderRadius: 12,
      background: `linear-gradient(180deg, ${CW.parch1}, ${CW.parch3})`,
      border: `2px solid ${CW.inkMute}`,
      boxShadow: [
        'inset 0 1px 0 rgba(255,255,255,.55)',
        'inset 0 -10px 18px rgba(60,38,25,.10)',
        '0 2px 0 rgba(0,0,0,.18)',
        '0 4px 10px rgba(0,0,0,.18)',
        tok.glow,
      ].filter(Boolean).join(', '),
      overflow: 'hidden',
      opacity: muted ? 0.85 : 1,
    }}>
      {/* State stripe — left edge */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: 6,
        background: tok.stripe,
        borderRight: `1px solid ${tok.stripeBorder}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)',
      }}/>

      <div style={{
        padding: '10px 12px 11px 16px',
        display: 'flex', flexDirection: 'column', gap: 9,
      }}>
        {/* ROW 1 — tier crest + meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TierBadge tier={tier} size={42}/>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{
                fontFamily: CW.font, fontWeight: 800, fontSize: 14, color: CW.ink,
                letterSpacing: '.01em', lineHeight: 1.1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textShadow: '0 1px 0 rgba(255,255,255,.5)',
                flex: 1, minWidth: 0,
              }}>{target}</span>
              <CapturePill tone={tok.pillTone} pulse={tok.pulse}>{tok.pillLabel}</CapturePill>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: CW.font, fontWeight: 600, fontSize: 11, color: CW.inkSoft,
              minWidth: 0,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <PinGlyph size={11} color={CW.inkSoft}/>
                <span style={{
                  fontVariantNumeric: 'tabular-nums', fontWeight: 800,
                  letterSpacing: '.04em', color: CW.ink,
                }}>{coords}</span>
              </span>
              <span style={{ color: CW.inkMute, opacity: .6 }}>·</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
              }}>
                <CastleGlyph size={11} color={CW.inkSoft}/>
                <span style={{
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>Depuis <em style={{ fontStyle: 'normal', color: CW.ink, fontWeight: 700 }}>{origin}</em></span>
              </span>
            </div>
          </div>
        </div>

        {/* Hairline rule */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(60,38,25,0), rgba(60,38,25,.28) 20%, rgba(60,38,25,.28) 80%, rgba(60,38,25,0))' }}/>

        {/* ROW 2 — time block */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockGlyph size={16} color={tok.timeColor}/>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{
                fontFamily: CW.font, fontWeight: 900, fontSize: 22,
                color: tok.timeColor,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '.01em',
                textShadow: '0 1px 0 rgba(255,255,255,.6)',
              }}>{timeRemaining}</span>
              <span style={{
                fontFamily: CW.font, fontWeight: 600, fontSize: 10,
                color: CW.inkSoft, marginTop: 3, letterSpacing: '.02em',
              }}>
                {state === 'reussie'      ? `Capturé à ${endTime}` :
                 state === 'interrompue' ? `Interrompue à ${endTime}` :
                                            <>Fin à <span style={{
                                              fontVariantNumeric: 'tabular-nums', fontWeight: 800,
                                              color: CW.ink,
                                            }}>{endTime}</span></>}
              </span>
            </div>
          </div>

          {/* Noble immobilisé */}
          <div style={{
            textAlign: 'right',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
            fontFamily: CW.font,
          }}>
            <span style={{
              fontSize: 8.5, fontWeight: 700, color: CW.inkMute,
              letterSpacing: '.22em', textTransform: 'uppercase',
            }}>Seigneur immobilisé</span>
            <span style={{
              fontSize: 11.5, fontWeight: 700, color: CW.ink,
              maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{noble}</span>
          </div>
        </div>

        {/* ROW 3 — progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}><CaptureBar percent={percent} state={state}/></div>
          <span style={{
            fontFamily: CW.font, fontVariantNumeric: 'tabular-nums',
            fontSize: 10, fontWeight: 800, color: CW.inkSoft,
            width: 30, textAlign: 'right',
          }}>{percent}%</span>
        </div>
      </div>

      {/* Transient state ribbon overlay (interrompue / réussie) */}
      {(state === 'interrompue' || state === 'reussie') && (
        <div style={{
          position: 'absolute', top: 8, right: -28, transform: 'rotate(28deg)',
          padding: '2px 30px',
          fontFamily: CW.font, fontWeight: 900, fontSize: 8.5,
          letterSpacing: '.3em', textTransform: 'uppercase',
          color: '#fff', textShadow: '1px 1px 1px rgba(0,0,0,.4)',
          background: state === 'interrompue'
            ? `linear-gradient(180deg, ${CW.redL}, ${CW.redD})`
            : `linear-gradient(180deg, ${CW.indigoL}, ${CW.indigoD})`,
          border: `1px solid ${state === 'interrompue' ? CW.redB : CW.indigoB}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 2px 4px rgba(0,0,0,.25)',
          pointerEvents: 'none',
        }}>
          {state === 'interrompue' ? 'Transitoire' : 'Transitoire'}
        </div>
      )}
    </article>
  );
}

// ---------- CaptureHUDBadge ----------
// Compact indicator that surfaces in the village HUD when ≥1 capture is
// in progress. Stays silent (returns null) when count === 0 — never a
// permanent ornament.
function CaptureHUDBadge({ count = 0, attention = false, onClick }) {
  if (!count) return null;
  return (
    <button onClick={onClick} className={attention ? 'cw-attention' : undefined} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px 4px 6px', borderRadius: 999,
      background: attention
        ? `linear-gradient(180deg, ${CW.greenL}, ${CW.greenD})`
        : `linear-gradient(180deg, ${CW.goldL}, ${CW.goldD})`,
      border: `2px solid ${attention ? CW.greenB : CW.goldB}`,
      color: attention ? '#fff' : '#3a2a00',
      fontFamily: CW.font, fontWeight: 800, fontSize: 10,
      letterSpacing: '.14em', textTransform: 'uppercase',
      textShadow: attention ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), 0 2px 0 rgba(0,0,0,.22)',
      cursor: 'pointer',
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 99,
        background: 'rgba(0,0,0,.22)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ClockGlyph size={11} color={attention ? '#fff' : '#3a2a00'}/>
      </span>
      <span>Captures</span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 17, height: 17, padding: '0 5px', borderRadius: 99,
        background: '#fff', color: attention ? CW.greenD : CW.goldB,
        fontSize: 10, fontWeight: 900, letterSpacing: 0,
        boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,.15)',
      }}>{count}</span>
    </button>
  );
}

// ---------- CaptureEmpty ----------
// Empty state — quote + faded illustration. Never noisy ; absent rather
// than aggressive.
function CaptureEmpty() {
  return (
    <div style={{
      padding: '24px 18px 28px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: `linear-gradient(180deg, ${CW.parch2}, ${CW.parch3})`,
        border: `2px dashed ${CW.inkMute}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: .7,
      }}>
        <ClockGlyph size={26} color={CW.inkMute}/>
      </div>
      <div style={{
        fontFamily: CW.font, fontWeight: 700, fontSize: 13, color: CW.ink,
      }}>Aucune capture en cours</div>
      <div style={{
        fontFamily: CW.font, fontStyle: 'italic', fontSize: 11.5,
        color: CW.inkSoft, lineHeight: 1.45, maxWidth: 240,
      }}>« Envoyez un Noble sur un village barbare pour ouvrir une fenêtre de capture. »</div>
    </div>
  );
}

// ---------- CaptureWindowList ----------
// The list itself — used inside the panneau Expéditions (tab "Captures").
function CaptureWindowList({ items = [], dense = false }) {
  if (!items.length) return <CaptureEmpty/>;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: dense ? 8 : 10,
      padding: dense ? '8px 10px' : '10px 12px',
    }}>
      {items.map((it, i) => (
        <CaptureWindowCard key={it.id ?? i} {...it}/>
      ))}
    </div>
  );
}

// ---------- ExpeditionPanelTabs ----------
// The bottom-sheet container used in the panneau Expéditions, with the
// recommended MVP placement : "Captures" as a sibling tab to "Expéditions".
function ExpeditionPanelTabs({ items, activeTab = 'captures', onTabChange, onClose, embedded = false }) {
  return (
    <div style={{
      width: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(180deg, ${CW.parch3}, ${CW.parch4})`,
      borderTop: `3px solid ${CW.woodBark}`,
      borderRadius: embedded ? '16px 16px 0 0' : 16,
      boxShadow: '0 -10px 28px rgba(0,0,0,.45), inset 0 2px 0 rgba(255,255,255,.4)',
      overflow: 'hidden',
    }}>
      {/* Grab handle */}
      <div style={{
        display: 'flex', justifyContent: 'center', padding: '8px 0 2px',
      }}>
        <div style={{
          width: 38, height: 4, borderRadius: 99,
          background: 'rgba(60,38,25,.32)',
        }}/>
      </div>

      {/* Sheet header */}
      <div style={{
        padding: '4px 14px 8px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8,
      }}>
        <div>
          <div style={{
            fontFamily: CW.font, fontSize: 9.5, fontWeight: 700, color: CW.inkSoft,
            letterSpacing: '.28em', textTransform: 'uppercase',
          }}>Panneau</div>
          <div style={{
            fontFamily: CW.font, fontSize: 17, fontWeight: 800, color: CW.ink,
            textShadow: '0 1px 0 rgba(255,255,255,.5)', lineHeight: 1.1,
          }}>Activités du royaume</div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Fermer" style={{
            width: 30, height: 30, borderRadius: 8,
            background: `linear-gradient(180deg, #b6a78a, ${CW.woodLight})`,
            border: `2px solid ${CW.woodDeep}`, color: '#fff',
            fontFamily: CW.font, fontWeight: 800, fontSize: 14,
            textShadow: '1px 1px 1px rgba(0,0,0,.5)', cursor: 'pointer',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.2)',
          }}>×</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 12px 8px',
        borderBottom: `1px solid rgba(60,38,25,.22)`,
      }}>
        {[
          { id: 'expeditions', label: 'Expéditions', badge: 2 },
          { id: 'captures',    label: 'Captures',    badge: items.filter(i => i.state === 'en-cours' || i.state === 'bientot-terminee').length, accent: true },
        ].map(t => {
          const a = t.id === activeTab;
          return (
            <button key={t.id} onClick={() => onTabChange?.(t.id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 12px 8px', borderRadius: '10px 10px 0 0',
              border: '2px solid',
              borderColor: a ? CW.woodDeep : 'rgba(60,38,25,.18)',
              borderBottom: a ? `2px solid ${CW.parch3}` : '2px solid transparent',
              marginBottom: a ? -1 : 0,
              background: a
                ? `linear-gradient(180deg, ${CW.parch1}, ${CW.parch3})`
                : 'rgba(60,38,25,.06)',
              color: a ? CW.ink : CW.inkSoft,
              fontFamily: CW.font, fontWeight: 800, fontSize: 12,
              letterSpacing: '.05em',
              textShadow: a ? '0 1px 0 rgba(255,255,255,.5)' : 'none',
              cursor: 'pointer',
              boxShadow: a ? 'inset 0 1.5px 0 rgba(255,255,255,.6)' : 'none',
            }}>
              {t.label}
              {t.badge > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 16, height: 16, padding: '0 5px', borderRadius: 99,
                  background: t.accent && a
                    ? `linear-gradient(180deg, ${CW.goldL}, ${CW.goldD})`
                    : 'rgba(60,38,25,.55)',
                  color: t.accent && a ? '#3a2a00' : '#fff',
                  fontFamily: CW.font, fontSize: 9.5, fontWeight: 900,
                  border: t.accent && a ? `1.5px solid ${CW.goldB}` : '1.5px solid rgba(0,0,0,.25)',
                  textShadow: 'none',
                }}>{t.badge}</span>
              )}
            </button>
          );
        })}
        <div style={{ flex: 1 }}/>
      </div>

      <div style={{
        flex: 1, minHeight: 0, overflow: 'auto',
        background: `linear-gradient(180deg, ${CW.parch3} 0%, ${CW.parch3} 100%)`,
      }}>
        {activeTab === 'captures' ? (
          <CaptureWindowList items={items}/>
        ) : (
          <ExpeditionStub/>
        )}
      </div>
    </div>
  );
}

// ---------- ExpeditionStub ----------
// Tiny placeholder for the sibling tab — proves the panel can host both
// activity kinds side-by-side, but we don't need to design Expéditions here.
function ExpeditionStub() {
  return (
    <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { name: 'Raid · Village barbare T2', meta: '231|198 · Arrivée dans 12 min', tone: CW.redD },
        { name: 'Renfort · Royaume du Sud',  meta: '208|245 · Retour dans 1h 04m', tone: CW.blueD },
      ].map((e, i) => (
        <div key={i} style={{
          padding: '9px 12px', borderRadius: 10,
          background: `linear-gradient(180deg, ${CW.parch1}, ${CW.parch2})`,
          border: `2px solid ${CW.inkMute}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: CW.font,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 12, color: CW.ink }}>{e.name}</div>
            <div style={{ fontSize: 10.5, color: CW.inkSoft, marginTop: 2 }}>{e.meta}</div>
          </div>
          <span style={{
            width: 8, height: 8, borderRadius: 99, background: e.tone,
            boxShadow: `0 0 8px ${e.tone}55`,
          }}/>
        </div>
      ))}
      <div style={{
        fontFamily: CW.font, fontStyle: 'italic', fontSize: 11,
        color: CW.inkSoft, textAlign: 'center', padding: '6px 0 2px',
      }}>(onglet existant — démontre la cohabitation)</div>
    </div>
  );
}

// ---------- CaptureSidePanel ----------
// Desktop / compact-panel variant — same cards, narrower chrome.
function CaptureSidePanel({ items }) {
  return (
    <aside style={{
      width: '100%', maxWidth: 320,
      background: `linear-gradient(180deg, ${CW.parch3}, ${CW.parch4})`,
      border: `3px solid ${CW.woodBark}`,
      borderRadius: 14,
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,.45), 0 8px 24px rgba(0,0,0,.35)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 12px 9px',
        background: `linear-gradient(180deg, ${CW.woodLight}, ${CW.woodDeep})`,
        borderBottom: `2px solid ${CW.woodBark}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
      }}>
        <div>
          <div style={{
            fontFamily: CW.font, fontSize: 9, fontWeight: 700, color: '#f0e0c0',
            letterSpacing: '.28em', textTransform: 'uppercase', opacity: .85,
          }}>Activités · Royaume</div>
          <div style={{
            fontFamily: CW.font, fontSize: 14, fontWeight: 800, color: '#fff',
            textShadow: '1px 1px 1px rgba(0,0,0,.5)', letterSpacing: '.02em',
          }}>Captures en cours</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 99,
          background: `linear-gradient(180deg, ${CW.goldL}, ${CW.goldD})`,
          border: `1.5px solid ${CW.goldB}`,
          fontFamily: CW.font, fontSize: 10, fontWeight: 800,
          color: '#3a2a00', letterSpacing: '.04em',
        }}>{items.length} actives</span>
      </div>
      <CaptureWindowList items={items} dense/>
    </aside>
  );
}

// ---------- Animation keyframes ----------
if (typeof document !== 'undefined' && !document.getElementById('cw-anim')) {
  const s = document.createElement('style');
  s.id = 'cw-anim';
  s.textContent = `
    @keyframes cwPulse {
      0%, 100% { box-shadow: inset 0 1px 0 rgba(255,255,255,.45); }
      50%      { box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 0 0 4px rgba(110,191,73,.25); }
    }
    .cw-pulse { animation: cwPulse 1.6s ease-in-out infinite; }
    @keyframes cwAttn {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-1px); }
    }
    .cw-attention { animation: cwAttn 1.4s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  CW, STATE_TOKENS,
  TierBadge, CapturePill, CaptureBar,
  CaptureWindowCard, CaptureWindowList, CaptureEmpty,
  CaptureHUDBadge, ExpeditionPanelTabs, CaptureSidePanel,
});
