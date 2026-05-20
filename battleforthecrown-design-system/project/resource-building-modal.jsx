/* global React, BFTC_T, ModalShell, CostStrip, PixelBtn, Pill, BFTC_RESOURCE_ICON,
   TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakSlider */
/* Battle for the Crown — Resource Building Modal
   ----------------------------------------------------------------------
   Triggered by tapping a resource gauge in the HUD. Surfaces the
   production building (camp / quarry / mine / farm), what it currently
   produces, and — the piece that drives the upgrade decision — what
   the NEXT level would produce.

   Same ModalShell vocabulary as DailyQuestSheet:
     - 4px wood border, 2px colored ring + drop shadow
     - 8px gold-strip header, eyebrow + title block
     - dark-wood footer carrying CostStrip + PixelBtn pair

   What's new here:
     - a "balance" between two production cards (NIVEAU ACTUEL → NIVEAU N+1)
       with the delta highlighted in a gold cartouche between them
     - a storage gauge with a "growth" overlay showing the new cap
     - a small "Villageois assignés" row (the eco loop's pop sink)
   ---------------------------------------------------------------------- */

const { useState } = React;

// =================================================================== assets
const ASSET_R  = 'assets';
const R_R = (n) => `${ASSET_R}/resources/${n}.png`;
const B_R = (n) => `${ASSET_R}/buildings/${n}.png`;
const I_R = (n) => `${ASSET_R}/icons/${n}.png`;

// =================================================================== data --
// One entry per "resource gauge" the user might tap on. Each entry carries
// everything the modal needs: copy, sprite, accent palette and the production
// curve up to a few levels ahead (so we can read N and N+1).

const RESOURCE_BUILDINGS = {
  wood: {
    key:        'wood',
    eyebrow:    'Production · Bois',
    name:       'Camp de bûcherons',
    tagline:    '« Que les forêts bruissent sous nos haches. »',
    building:   B_R('wood'),
    resIcon:    R_R('wood'),
    resLabel:   'bois',
    accent:     { light: '#7ec74e', dark: '#3a8a1f', border: '#2d6b16',
                  haloTint: 'rgba(126,199,78,.35)' },
    population: { current: 120, max: 200 },
    // production[lvl] = units/h ; storage[lvl] = warehouse cap (here per-building)
    production: { 1: 30, 2: 70, 3: 120, 4: 160, 5: 220 },
    storage:    { 1: 1500, 2: 3500, 3: 8000, 4: 12000, 5: 18000 },
    workers:    { 1: { used: 2, max: 3 }, 2: { used: 5, max: 6 },
                  3: { used: 8, max: 10 }, 4: { used: 8, max: 14 },
                  5: { used: 12, max: 18 } },
    stockNow:   6420,                // currently in warehouse
    upgrade:    { cost: { wood: 240, stone: 180, iron: 60, crowns: 0 },
                  time: '14m 30s', reqLabel: 'Château niv. 3' },
  },

  stone: {
    key:        'stone',
    eyebrow:    'Production · Pierre',
    name:       'Carrière',
    tagline:    '« Pierre par pierre, le royaume tient debout. »',
    building:   B_R('stone'),
    resIcon:    R_R('stone'),
    resLabel:   'pierre',
    accent:     { light: '#b0b8c0', dark: '#7f8c8d', border: '#5d6d6e',
                  haloTint: 'rgba(176,184,192,.35)' },
    population: { current: 120, max: 200 },
    production: { 1: 20, 2: 50, 3: 80, 4: 120, 5: 170 },
    storage:    { 1: 1500, 2: 3500, 3: 8000, 4: 12000, 5: 18000 },
    workers:    { 1: { used: 2, max: 3 }, 2: { used: 4, max: 6 },
                  3: { used: 7, max: 9 },  4: { used: 7, max: 12 },
                  5: { used: 10, max: 16 } },
    stockNow:   3200,
    upgrade:    { cost: { wood: 320, stone: 140, iron: 90, crowns: 0 },
                  time: '17m 10s', reqLabel: 'Château niv. 3' },
  },

  iron: {
    key:        'iron',
    eyebrow:    'Production · Fer',
    name:       'Mine de fer',
    tagline:    '« De la roche au fer, du fer à la lame. »',
    building:   B_R('iron'),
    resIcon:    R_R('iron'),
    resLabel:   'fer',
    accent:     { light: '#5b9bd5', dark: '#2e75b6', border: '#1f5288',
                  haloTint: 'rgba(91,155,213,.38)' },
    population: { current: 120, max: 200 },
    production: { 1: 10, 2: 30, 3: 50, 4: 80, 5: 120 },
    storage:    { 1: 1000, 2: 2500, 3: 5000, 4: 8000, 5: 12000 },
    workers:    { 1: { used: 2, max: 3 }, 2: { used: 3, max: 5 },
                  3: { used: 6, max: 8 },  4: { used: 6, max: 11 },
                  5: { used: 9, max: 14 } },
    stockNow:   1500,
    upgrade:    { cost: { wood: 280, stone: 220, iron: 40, crowns: 0 },
                  time: '21m 45s', reqLabel: 'Château niv. 4' },
  },

  farm: {
    key:        'farm',
    eyebrow:    'Production · Population',
    name:       'Ferme',
    tagline:    '« Sans pain, point de soldats. »',
    building:   B_R('farm'),
    resIcon:    R_R('population'),
    resLabel:   'villageois',
    accent:     { light: '#f1c40f', dark: '#d4a017', border: '#9e7b0d',
                  haloTint: 'rgba(241,196,15,.4)' },
    population: { current: 120, max: 200 },
    // For the farm, "production" reads as "places de villageois", not /h.
    production: { 1: 80, 2: 140, 3: 200, 4: 280, 5: 380 },
    storage:    { 1: 80, 2: 140, 3: 200, 4: 280, 5: 380 },  // same as cap
    workers:    { 1: { used: 1, max: 2 }, 2: { used: 2, max: 4 },
                  3: { used: 4, max: 6 }, 4: { used: 4, max: 8 },
                  5: { used: 6, max: 10 } },
    stockNow:   120,
    upgrade:    { cost: { wood: 360, stone: 260, iron: 80, crowns: 0 },
                  time: '18m 20s', reqLabel: 'Château niv. 3' },
    isPopulation: true,
  },
};

const STOCK_R = { wood: 8500, stone: 3200, iron: 1500, crowns: 142 };

// ============================================================ helpers ----
const fr = (n) => n.toLocaleString('fr-FR').replace(/,/g, ' ');

// Format an hourly production value with sign.
function ProductionValue({ value, suffix }) {
  return (
    <span style={{
      fontFamily: BFTC_T.font, fontWeight: 900,
      fontVariantNumeric: 'tabular-nums',
      color: BFTC_T.ink,
      textShadow: '0 1px 0 rgba(255,255,255,.55)',
    }}>+{fr(value)}<span style={{
      fontSize: '0.65em', fontWeight: 700, color: BFTC_T.inkSoft,
      letterSpacing: '.08em', marginLeft: 2,
    }}>{suffix}</span></span>
  );
}

// ============================================================ Hero -------
function BuildingHero({ b, level, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 12,
      padding: '12px 14px 8px',
    }}>
      {/* sprite tile */}
      <div style={{
        position: 'relative',
        width: 86, height: 90, borderRadius: 14,
        background: `radial-gradient(ellipse at 50% 30%, ${accent.haloTint} 0%, rgba(60,38,25,0) 60%), linear-gradient(160deg, #5f3d2b 0%, #2e1c12 100%)`,
        border: `2.5px solid ${BFTC_T.woodBark}`,
        overflow: 'hidden', flexShrink: 0,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), 0 4px 0 rgba(0,0,0,.18)',
      }}>
        <img src={b.building} alt={b.name} style={{
          position: 'absolute', left: '50%', top: '52%',
          transform: 'translate(-50%, -50%)',
          width: '108%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.45))',
        }}/>
        {/* level cartouche, bottom-left */}
        <span style={{
          position: 'absolute', left: 4, bottom: 4,
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
          padding: '2px 6px', borderRadius: 5,
          background: `linear-gradient(to bottom, ${accent.light}, ${accent.dark})`,
          color: '#fff', border: `1.5px solid ${accent.border}`,
          textShadow: '1px 1px 1px rgba(0,0,0,.45)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)',
        }}>NIV. {level}</span>
      </div>

      {/* name block */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, letterSpacing: '.28em',
          color: BFTC_T.inkSoft, textTransform: 'uppercase',
        }}>Bâtiment économique</div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 21, fontWeight: 900, lineHeight: 1.05,
          color: BFTC_T.ink, letterSpacing: '.01em',
          textShadow: '0 1px 0 rgba(255,255,255,.55)',
        }}>{b.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800,
            letterSpacing: '.14em', textTransform: 'uppercase',
            padding: '2.5px 7px 2.5px 4px', borderRadius: 999,
            background: `linear-gradient(to bottom, ${accent.light}, ${accent.dark})`,
            border: `1.5px solid ${accent.border}`,
            color: '#fff',
            textShadow: '1px 1px 1px rgba(0,0,0,.4)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)',
          }}>
            <img src={b.resIcon} alt="" style={{ width: 13, height: 13 }}/>
            {b.resLabel}
          </span>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 700,
            color: BFTC_T.inkSoft,
          }}>Boucle Éco</span>
        </div>
        <div style={{
          fontFamily: BFTC_T.font, fontStyle: 'italic',
          fontSize: 10.5, color: BFTC_T.inkSoft,
          paddingLeft: 8, borderLeft: '2px solid rgba(60,38,25,.25)',
          marginTop: 2,
        }}>{b.tagline}</div>
      </div>
    </div>
  );
}

// ============================================================ ProductionCard
// Single side of the production "balance". `tone` = 'current' | 'next'
function ProductionCard({ b, level, accent, tone, capPct, max }) {
  const prod    = b.production[level] ?? 0;
  const cap     = b.storage[level]    ?? 0;
  const workers = b.workers[level]    ?? { used: 0, max: 0 };
  const isNext  = tone === 'next';

  const cardBg  = isNext
    ? `linear-gradient(to bottom, ${accent.haloTint.replace(/[\d.]+\)$/, '.28)')} 0%, rgba(255,255,255,.55) 100%)`
    : 'linear-gradient(to bottom, rgba(255,255,255,.6) 0%, rgba(244,228,193,.55) 100%)';
  const cardBd  = isNext ? accent.border : 'rgba(60,38,25,.28)';
  const eyebrowText = isNext ? 'Après amélioration' : 'Niveau actuel';
  const eyebrowColor = isNext ? accent.border : BFTC_T.inkSoft;

  // Fill the production bar relative to a passed max so the two cards share scale.
  const fillPct = Math.min(100, Math.round((prod / max) * 100));

  return (
    <div style={{
      position: 'relative',
      borderRadius: 14,
      padding: '10px 12px 11px',
      background: cardBg,
      border: `2px solid ${cardBd}`,
      boxShadow: isNext
        ? `inset 0 1px 0 rgba(255,255,255,.55), 0 3px 0 rgba(0,0,0,.12), 0 0 14px ${accent.haloTint}`
        : 'inset 0 1px 0 rgba(255,255,255,.55), 0 2px 0 rgba(0,0,0,.10)',
    }}>
      {/* eyebrow row: label + level pill */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 7,
      }}>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800,
          letterSpacing: '.24em', textTransform: 'uppercase',
          color: eyebrowColor,
        }}>{eyebrowText}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '1.5px 7px', borderRadius: 999,
          fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em',
          background: isNext
            ? `linear-gradient(to bottom, ${accent.light}, ${accent.dark})`
            : 'linear-gradient(to bottom, #b6a78a, #8b7355)',
          color: '#fff',
          border: `1.5px solid ${isNext ? accent.border : '#5d4a32'}`,
          textShadow: '1px 1px 1px rgba(0,0,0,.4)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)',
        }}>NIV. {level}</span>
      </div>

      {/* big production number */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
        marginBottom: 7,
      }}>
        <img src={b.resIcon} alt="" style={{ width: 22, height: 22,
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.35))', alignSelf: 'center' }}/>
        <span style={{
          fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 24,
          color: BFTC_T.ink, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 1px 0 rgba(255,255,255,.6)',
          letterSpacing: '.01em',
        }}>+{fr(prod)}</span>
        <span style={{
          fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 11,
          color: BFTC_T.inkSoft, letterSpacing: '.08em',
        }}>/ heure</span>
      </div>

      {/* production bar (relative scale) */}
      <div style={{
        position: 'relative', height: 8, borderRadius: 99,
        background: 'rgba(60,38,25,.18)',
        border: '1px solid rgba(60,38,25,.3)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,.2)',
        overflow: 'hidden', marginBottom: 9,
      }}>
        <div style={{
          position: 'absolute', inset: 0, width: fillPct + '%',
          background: `linear-gradient(to bottom, ${accent.light}, ${accent.dark})`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), inset 0 -2px 4px rgba(0,0,0,.18)',
          transition: 'width 700ms cubic-bezier(.2,.75,.3,1.05)',
        }}/>
      </div>

    </div>
  );
}

function MiniIcon({ glyph, small }) {
  return (
    <span style={{
      width: 18, height: 18, borderRadius: 5,
      background: 'linear-gradient(to bottom, rgba(60,38,25,.18), rgba(60,38,25,.05))',
      border: '1px solid rgba(60,38,25,.22)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: small ? 10 : 11, color: BFTC_T.ink, lineHeight: 1,
      flexShrink: 0,
    }}>{glyph}</span>
  );
}

function SubStat({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 7px 4px 5px',
      borderRadius: 8,
      background: 'rgba(255,255,255,.4)',
      border: '1px solid rgba(60,38,25,.18)',
      minWidth: 0,
    }}>
      {icon}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 8, fontWeight: 800, letterSpacing: '.18em',
          textTransform: 'uppercase', color: BFTC_T.inkSoft, lineHeight: 1,
        }}>{label}</span>
        <span style={{
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 12, color: BFTC_T.ink,
          fontVariantNumeric: 'tabular-nums', lineHeight: 1.15,
        }}>{value}</span>
      </div>
    </div>
  );
}

// ============================================================ LevelLink ---
// Marker drawn BETWEEN the two production cards. 4 visual variants exposed
// as a Tweak so we can settle on the one that reads best.
function LevelLink({ variant, delta, accent }) {
  if (variant === 'none') return <div style={{ height: 6 }}/>;

  if (variant === 'chevron') {
    // Just a downward chevron in parchment ink — quiet, ornament-like.
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        margin: '2px 0',
      }}>
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none"
             style={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,.55))' }}>
          <path d="M3 3 L11 11 L19 3" stroke="rgba(60,38,25,.55)" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </div>
    );
  }

  if (variant === 'arrow-pill') {
    // Small round arrow badge in the resource accent color.
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        margin: '-9px 0', position: 'relative', zIndex: 2,
      }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: `linear-gradient(to bottom, ${accent.light}, ${accent.dark})`,
          border: `2px solid ${accent.border}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: BFTC_T.font, fontWeight: 900,
          fontSize: 15, lineHeight: 1,
          textShadow: '1px 1px 1px rgba(0,0,0,.45)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 2px 0 rgba(0,0,0,.18)',
        }}>↓</span>
      </div>
    );
  }

  if (variant === 'rule') {
    // Hairline rule across the gap with a tiny "+N" inline chip.
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        margin: '4px 4px',
      }}>
        <span style={{ flex: 1, height: 1, background: 'rgba(60,38,25,.28)' }}/>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 800,
          color: accent.border, fontVariantNumeric: 'tabular-nums',
          letterSpacing: '.06em',
        }}>
          <span style={{ fontSize: 11, lineHeight: 1 }}>▾</span>
          +{fr(delta)} / h
        </span>
        <span style={{ flex: 1, height: 1, background: 'rgba(60,38,25,.28)' }}/>
      </div>
    );
  }

  // 'rail' — a vertical rail + arrowhead, like a wire physically connecting
  // card N to card N+1. Sits on the left side of the gap, ink-tone.
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
      gap: 10, margin: '1px 0 1px 22px', height: 18, position: 'relative',
    }}>
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
        <path d="M7 0 L7 12" stroke="rgba(60,38,25,.55)" strokeWidth="2"
              strokeLinecap="round"/>
        <path d="M3 10 L7 14 L11 10" stroke="rgba(60,38,25,.6)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <span style={{
        fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800,
        letterSpacing: '.22em', textTransform: 'uppercase',
        color: BFTC_T.inkSoft,
      }}>amélioration</span>
    </div>
  );
}

// ============================================================ Storage gauge
// Plain stock / cap gauge — one fill, one value pair.
function StorageGauge({ b, levelNow, accent }) {
  const capNow = b.storage[levelNow];
  const stock  = b.stockNow;
  const pctNow = Math.min(100, Math.round((stock / capNow) * 100));

  return (
    <div style={{
      padding: '10px 12px 11px',
      borderRadius: 12,
      background: 'linear-gradient(to bottom, rgba(255,255,255,.55) 0%, rgba(244,228,193,.5) 100%)',
      border: '1.5px solid rgba(60,38,25,.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55)',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800, letterSpacing: '.24em',
          textTransform: 'uppercase', color: BFTC_T.inkSoft,
        }}>{b.isPopulation ? 'Logement' : 'Capacité'}</span>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 13, fontWeight: 800, color: BFTC_T.ink,
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 1px 0 rgba(255,255,255,.5)',
        }}>
          {fr(stock)}<span style={{ color: BFTC_T.inkSoft }}> / {fr(capNow)}</span>
        </span>
      </div>

      <div style={{
        position: 'relative', height: 12, borderRadius: 99,
        background: 'rgba(60,38,25,.18)',
        border: '1.5px solid rgba(60,38,25,.32)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,.22)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, width: pctNow + '%',
          background: `linear-gradient(to bottom, ${accent.light}, ${accent.dark})`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), inset 0 -2px 4px rgba(0,0,0,.18)',
          transition: 'width 700ms cubic-bezier(.2,.75,.3,1.05)',
        }}/>
      </div>
    </div>
  );
}

// ============================================================ Modal -------
function ResourceBuildingModal({ resourceKey = 'wood', level = 3, linkVariant = 'chevron', onClose = () => {} }) {
  const b = RESOURCE_BUILDINGS[resourceKey];
  if (!b) return null;
  const accent = b.accent;
  const next   = Math.min(level + 1, 5);
  const isMaxed = next === level;

  const prodNow  = b.production[level];
  const prodNext = b.production[next];
  const delta    = prodNext - prodNow;
  const max      = b.production[5];   // shared scale for both cards

  const cost  = b.upgrade.cost;
  const canPay =
    STOCK_R.wood  >= cost.wood &&
    STOCK_R.stone >= cost.stone &&
    STOCK_R.iron  >= cost.iron &&
    STOCK_R.crowns >= (cost.crowns || 0);

  return (
    <ModalShell
      eyebrow={b.eyebrow}
      title={b.name}
      accent={accent.dark}
      accentLight={accent.light}
      onClose={onClose}
      width={336}
      maxHeight={680}
    >
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        <BuildingHero b={b} level={level} accent={accent}/>

        {/* section divider — Production */}
        <SectionRule label="Production"/>

        {/* Production "balance" — two cards stacked with delta cartouche */}
        <div style={{
          margin: '0 14px',
          display: 'flex', flexDirection: 'column', gap: 4,
          position: 'relative',
        }}>
          <ProductionCard b={b} level={level} accent={accent} tone="current" max={max}/>
          {isMaxed ? (
            <div style={{
              alignSelf: 'center', margin: '6px 0 2px',
              fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 800,
              letterSpacing: '.2em', textTransform: 'uppercase',
              color: BFTC_T.inkSoft,
            }}>Niveau maximal atteint</div>
          ) : (
            <>
              <LevelLink variant={linkVariant} delta={delta} accent={accent}/>
              <ProductionCard b={b} level={next} accent={accent} tone="next" max={max}/>
            </>
          )}
        </div>

        {/* section divider — Stockage */}
        <SectionRule label={b.isPopulation ? 'Logement' : 'Entrepôt'}/>

        <div style={{ margin: '0 14px 12px' }}>
          <StorageGauge b={b} levelNow={level} accent={accent}/>
        </div>
      </div>

      {/* footer — cost + actions */}
      <div style={{
        padding: '10px 14px 12px',
        background: 'linear-gradient(to bottom, rgba(93,74,50,.95), rgba(60,38,25,.97))',
        borderTop: `2px solid ${BFTC_T.woodBark}`,
        display: 'flex', flexDirection: 'column', gap: 9,
      }}>
        <CostStrip
          cost={cost}
          stock={STOCK_R}
          label={`Améliorer · Niv. ${level} → ${next}`}
          multiplier={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <img src={I_R('clock')} alt="" style={{ width: 11, height: 11 }}/>
              {b.upgrade.time}
            </span>
          }
          dense
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <PixelBtn variant="neutral" size="md" full onClick={onClose}>Fermer</PixelBtn>
          {isMaxed ? (
            <PixelBtn variant="warning" size="md" full disabled>Niveau max.</PixelBtn>
          ) : (
            <PixelBtn variant="success" size="md" full disabled={!canPay}>
              Améliorer
            </PixelBtn>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

function SectionRule({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      margin: '12px 14px 8px',
    }}>
      <span style={{ flex: 1, height: 1, background: 'rgba(60,38,25,.22)' }}/>
      <span style={{
        fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800,
        letterSpacing: '.28em', textTransform: 'uppercase',
        color: BFTC_T.inkSoft,
      }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'rgba(60,38,25,.22)' }}/>
    </div>
  );
}

// ====================================================== phone scaffold ----
function VillageBg_R({ dimmed, b }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#7c9756 0%,#a8b977 28%,#cdbf8e 60%,#b89968 100%)' }}>
      {/* a top wood strip mimicking the HUD */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 62,
        background: 'linear-gradient(to bottom, rgba(60,38,25,.94), rgba(78,56,34,.94))',
        borderBottom: '2px solid #8b7355',
      }}/>
      <img src={B_R('castle')}    alt="" style={{ position: 'absolute', top: 200, left: 60, width: 140, opacity: .72 }} />
      <img src={b.building}       alt="" style={{ position: 'absolute', top: 360, left: 180, width: 130, opacity: .8 }} />
      <img src={B_R('warehouse')} alt="" style={{ position: 'absolute', top: 470, left: 30, width: 110, opacity: .7 }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 64,
        background: 'linear-gradient(to top, rgba(60,38,25,.95), rgba(78,56,34,.9))',
        borderTop: '2px solid #8b7355',
      }}/>
      {dimmed && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)' }}/>}
    </div>
  );
}

function PhoneResourceBuilding({ resourceKey = 'wood', level = 3, linkVariant = 'chevron' }) {
  const b = RESOURCE_BUILDINGS[resourceKey];
  return (
    <div style={{
      position: 'relative', width: 360, height: 720,
      borderRadius: 36, overflow: 'hidden',
      background: '#1a1a2e', border: '8px solid #0c0c1a',
      boxShadow: '0 30px 60px rgba(0,0,0,.6), inset 0 0 0 2px #2a2a45',
    }}>
      <VillageBg_R b={b} dimmed/>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 10,
      }}>
        <ResourceBuildingModal resourceKey={resourceKey} level={level} linkVariant={linkVariant}/>
      </div>
    </div>
  );
}

// =============================================================== app =====
const RESOURCE_OPTIONS = ['wood', 'stone', 'iron', 'farm'];

function ResourceBuildingApp() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "resource": "wood",
    "level": 3,
    "linkVariant": "chevron"
  }/*EDITMODE-END*/;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <PhoneResourceBuilding resourceKey={t.resource} level={t.level} linkVariant={t.linkVariant}/>
      <TweaksPanel title="Tweaks">
        <TweakSection label="Bâtiment de ressource">
          <TweakRadio
            label="Ressource"
            value={t.resource}
            onChange={(v) => setTweak('resource', v)}
            options={[
              { value: 'wood',  label: 'Bois' },
              { value: 'stone', label: 'Pierre' },
              { value: 'iron',  label: 'Fer' },
              { value: 'farm',  label: 'Pop.' },
            ]}
          />
          <TweakSlider
            label="Niveau actuel"
            value={t.level} min={1} max={5} step={1}
            unit={t.level >= 5 ? ' (max.)' : ` → ${t.level + 1}`}
            onChange={(v) => setTweak('level', v)}
          />
        </TweakSection>
        <TweakSection label="Liaison entre les niveaux">
          <TweakRadio
            label="Style"
            value={t.linkVariant}
            onChange={(v) => setTweak('linkVariant', v)}
            options={[
              { value: 'chevron',     label: 'Chevron' },
              { value: 'arrow-pill', label: 'Pastille' },
              { value: 'rule',       label: 'Règle +N' },
              { value: 'rail',       label: 'Rail' },
              { value: 'none',       label: 'Aucun' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

Object.assign(window, {
  RESOURCE_BUILDINGS, ResourceBuildingModal,
  PhoneResourceBuilding, ResourceBuildingApp,
});
