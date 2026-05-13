/* global React, BFTC_T, ModalShell, CostStrip, PixelBtn, Pill, BFTC_RESOURCE_ICON */
/* Battle for the Crown — Troop Detail Modal
   ----------------------------------------------------------------------
   Demo unit: WARRIOR (Guerrier). The modal sits inside a 360×720 phone
   frame over a faint village screen so it reads as an in-game popover.
   Stats are rendered as gradient progress bars normalised against the
   FIELD_MAX scale (peak value of the regular battle-troop line), so the
   bar length actually says something about strength / weakness:

     - >= 90%   → Excellent  (green)
     - 65-89%   → Solide     (green)
     - 40-64%   → Correct    (gold)
     - 20-39%   → Faible     (red)
     - <20%     → Médiocre   (red)

   We exclude siege weapons (RAM / CATAPULT), the SPY and the NOBLE from
   the normalisation; those units belong to specialised ladders and would
   crush the scale for everyone else.
   ---------------------------------------------------------------------- */

const { useState, useEffect, useRef } = React;

// ---------------------------------------------------------------- data --
const TROOP = {
  key: 'WARRIOR',
  name: 'Guerrier',
  archetype: 'Infanterie · Frappe rapide',
  tier: 'Tier II · Caserne niv. 3',
  portrait: 'assets/army/savage.png',  // closest field-troop sprite
  tagline: '« Frappe d’abord. Dort sous les armes. »',
  stats: {
    attack:           20,
    defenseInfantry:   5,
    defenseCavalry:    5,
    defenseArcher:     5,
    speed:            20,
    carryCapacity:    35,
  },
  passive: {
    kind: 'attackOnRaid',
    name: 'Frénésie du pillard',
    desc: '+10 % d’attaque lorsque la troupe participe à un raid.',
    bonus: '+10 %',
  },
  cost: { wood: 30, stone: 0, iron: 45, crowns: 0 },
  trainingTime: '1 m 35 s',
  populationCost: 1,
};

// Field-troop peak values used to scale the bars.
const FIELD_MAX = {
  attack:           20,  // WARRIOR
  defenseInfantry:  15,  // TEMPLAR
  defenseCavalry:   15,  // TEMPLAR
  defenseArcher:    15,  // TEMPLAR
  speed:            35,  // CAVALRY
  carryCapacity:   100,  // CAVALRY
};

const STOCK = { wood: 1820, stone: 940, iron: 1240, crowns: 142 };

// --------------------------------------------------------------- tiers --
function tierFor(pct) {
  if (pct >= 90) return { label: 'Excellent', tone: 'green' };
  if (pct >= 65) return { label: 'Solide',    tone: 'green' };
  if (pct >= 40) return { label: 'Correct',   tone: 'gold'  };
  if (pct >= 20) return { label: 'Faible',    tone: 'red'   };
  return            { label: 'Médiocre',  tone: 'red'   };
}

const TONE_GRAD = {
  green: ['#7ec74e', '#3a8a1f', '#2d6b16'],
  gold:  ['#f1c40f', '#b67e0a', '#8a5e07'],
  red:   ['#e74c3c', '#a93226', '#7d2218'],
};

// --------------------------------------------------------------- StatBar
// Animated horizontal bar with quartile ticks, tier label and value chip.
// `delay` staggers the bar entrance so the row reads from top to bottom.
function StatBar({ icon, label, value, max, delay = 0, indent = false }) {
  const target = Math.min(100, Math.round((value / max) * 100));
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setPct(target), 120 + delay);
    return () => clearTimeout(id);
  }, [target, delay]);
  const tier = tierFor(target);
  const [g1, g2, g3] = TONE_GRAD[tier.tone];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 5,
      paddingLeft: indent ? 8 : 0,
      position: 'relative',
    }}>
      {/* connector line for indented (defense sub-stats) */}
      {indent && (
        <span style={{
          position: 'absolute', left: -2, top: 9, width: 8, height: 1,
          background: 'rgba(60,38,25,.3)',
        }}/>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        fontFamily: BFTC_T.font,
      }}>
        <span style={{
          width: 18, height: 18, borderRadius: 6,
          background: 'linear-gradient(to bottom, rgba(60,38,25,.15), rgba(60,38,25,.04))',
          border: '1px solid rgba(60,38,25,.18)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: BFTC_T.ink, fontSize: 11, lineHeight: 1,
        }}>{icon}</span>
        <span style={{
          flex: 1, fontSize: indent ? 10.5 : 11.5, fontWeight: 700,
          color: indent ? BFTC_T.inkSoft : BFTC_T.ink,
          letterSpacing: '.015em',
        }}>{label}</span>
        <span style={{
          fontSize: 8.5, fontWeight: 800, letterSpacing: '.16em',
          color: g3, textTransform: 'uppercase',
        }}>{tier.label}</span>
        <span style={{
          fontSize: 13, fontWeight: 900, color: BFTC_T.ink,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 26, textAlign: 'right',
          textShadow: '0 1px 0 rgba(255,255,255,.4)',
        }}>{value}</span>
      </div>
      <div style={{
        position: 'relative',
        height: indent ? 8 : 10, borderRadius: 99,
        background: 'rgba(60,38,25,.16)',
        border: '1px solid rgba(60,38,25,.32)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,.22)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, width: pct + '%',
          background: `linear-gradient(to bottom, ${g1} 0%, ${g2} 100%)`,
          borderRight: pct > 0 && pct < 100 ? `1px solid ${g3}` : 'none',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), inset 0 -2px 4px rgba(0,0,0,.18)',
          transition: 'width 720ms cubic-bezier(.2,.75,.3,1.05)',
        }}/>
        {/* quartile ticks (subtle, only show on track) */}
        {[25, 50, 75].map(t => (
          <span key={t} style={{
            position: 'absolute', left: `calc(${t}% - 0.5px)`, top: 1, bottom: 1,
            width: 1, background: 'rgba(0,0,0,.18)',
            pointerEvents: 'none',
          }}/>
        ))}
        {/* shimmer pulse, very subtle */}
        <span style={{
          position: 'absolute', top: 0, bottom: 0,
          width: 24, left: `calc(${pct}% - 28px)`,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent)',
          opacity: pct > 4 ? 0.7 : 0,
          transition: 'left 720ms cubic-bezier(.2,.75,.3,1.05)',
          pointerEvents: 'none',
        }}/>
      </div>
    </div>
  );
}

// ----------------------------------------------------------- DefenseGroup
// Groups the 3 defense sub-stats under a single labelled rail.
function DefenseGroup({ stats, max, delayBase }) {
  const rows = [
    { icon: '🛡', label: 'vs Infanterie', v: stats.defenseInfantry, m: max.defenseInfantry, d: delayBase },
    { icon: '🐎', label: 'vs Cavalerie',  v: stats.defenseCavalry,  m: max.defenseCavalry,  d: delayBase + 70 },
    { icon: '🏹', label: 'vs Archers',    v: stats.defenseArcher,   m: max.defenseArcher,   d: delayBase + 140 },
  ];
  return (
    <div style={{
      borderLeft: `2px solid rgba(60,38,25,.22)`,
      paddingLeft: 8,
      marginLeft: 9,
      display: 'flex', flexDirection: 'column', gap: 7,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: -10, top: -2,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 800,
        letterSpacing: '.16em', color: BFTC_T.ink, textTransform: 'uppercase',
        background: `linear-gradient(to bottom, ${BFTC_T.parch1}, #f1e2c0)`,
        padding: '1px 6px 1px 0',
      }}>
        <span style={{
          width: 18, height: 18, borderRadius: 6,
          background: 'linear-gradient(to bottom, rgba(60,38,25,.18), rgba(60,38,25,.05))',
          border: '1px solid rgba(60,38,25,.22)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
        }}>⛨</span>
        Défense
      </div>
      <div style={{ height: 14 }}/>
      {rows.map((r, i) => (
        <StatBar key={r.label} icon={r.icon} label={r.label} value={r.v} max={r.m} delay={r.d} indent />
      ))}
    </div>
  );
}

// -------------------------------------------------------------- Portrait
function TroopHero({ troop }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 12,
      padding: '12px 14px 10px',
    }}>
      {/* portrait */}
      <div style={{
        position: 'relative',
        width: 78, height: 86, borderRadius: 14,
        background: 'linear-gradient(160deg, #5f3d2b 0%, #2e1c12 100%)',
        border: `2.5px solid ${BFTC_T.woodBark}`,
        overflow: 'hidden', flexShrink: 0,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), 0 4px 0 rgba(0,0,0,.18)',
      }}>
        {/* faint amber halo */}
        <span style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(241,196,15,.45) 0%, rgba(241,196,15,0) 70%)',
        }}/>
        <img src={troop.portrait} alt={troop.name} style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.45))',
        }}/>
        {/* tier ribbon */}
        <span style={{
          position: 'absolute', left: 4, bottom: 4,
          fontFamily: BFTC_T.font, fontSize: 7.5, fontWeight: 800, letterSpacing: '.18em',
          padding: '2px 5px', borderRadius: 4,
          background: `linear-gradient(to bottom, ${BFTC_T.goldL}, ${BFTC_T.goldD})`,
          color: '#3a2a00', border: `1px solid ${BFTC_T.goldB}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)',
        }}>II</span>
      </div>
      {/* name block */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, letterSpacing: '.28em',
          color: BFTC_T.inkSoft, textTransform: 'uppercase',
        }}>{troop.tier}</div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 24, fontWeight: 900, lineHeight: 1,
          color: BFTC_T.ink, letterSpacing: '.02em',
          textShadow: '0 1px 0 rgba(255,255,255,.55)',
        }}>{troop.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800,
            letterSpacing: '.14em', textTransform: 'uppercase',
            padding: '2.5px 7px', borderRadius: 999,
            background: `linear-gradient(to bottom, ${BFTC_T.redL}, ${BFTC_T.redD})`,
            border: `1.5px solid ${BFTC_T.redB}`,
            color: '#fff',
            textShadow: '1px 1px 1px rgba(0,0,0,.4)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)',
          }}>Offensif</span>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 700,
            color: BFTC_T.inkSoft,
          }}>{troop.archetype}</span>
        </div>
        <div style={{
          fontFamily: BFTC_T.font, fontStyle: 'italic',
          fontSize: 10.5, color: BFTC_T.inkSoft,
          paddingLeft: 8, borderLeft: '2px solid rgba(60,38,25,.25)',
          marginTop: 2,
        }}>{troop.tagline}</div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- Passive --
function PassiveCard({ passive }) {
  return (
    <div style={{
      margin: '0 14px',
      borderRadius: 12,
      background: `linear-gradient(to bottom, #fff7e0 0%, #f3df9e 100%)`,
      border: `2px solid ${BFTC_T.goldB}`,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 2px 0 rgba(0,0,0,.12)',
      padding: '8px 10px',
      display: 'flex', alignItems: 'center', gap: 9,
      position: 'relative', overflow: 'hidden',
    }}>
      <span style={{
        position: 'absolute', right: -10, top: -8,
        fontFamily: BFTC_T.font, fontSize: 64, fontWeight: 900, lineHeight: 1,
        color: 'rgba(154,121,28,.18)', pointerEvents: 'none',
      }}>⚡</span>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: `linear-gradient(to bottom, ${BFTC_T.goldL}, ${BFTC_T.goldD})`,
        border: `2px solid ${BFTC_T.goldB}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#3a2a00', fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 16,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)',
      }}>⚡</div>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 12.5, fontWeight: 800, color: '#3a2a00',
            letterSpacing: '.02em',
          }}>{passive.name}</span>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 900, color: '#7d4e08',
            fontVariantNumeric: 'tabular-nums',
          }}>{passive.bonus}</span>
        </div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 10.5, color: '#6b4d10', lineHeight: 1.3,
        }}>{passive.desc}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Modal --
function TroopDetailModal({ troop = TROOP, onClose = () => {} }) {
  const s = troop.stats;
  const cost = troop.cost;
  const affordable =
    STOCK.wood >= cost.wood &&
    STOCK.stone >= cost.stone &&
    STOCK.iron >= cost.iron &&
    STOCK.crowns >= cost.crowns;

  return (
    <ModalShell
      eyebrow="Caserne · Détail de la troupe"
      title={troop.name}
      accent={BFTC_T.redD}
      accentLight={BFTC_T.redL}
      onClose={onClose}
      width={334}
      maxHeight={680}
    >
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        <TroopHero troop={troop} />

        {/* divider with cartouche */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          margin: '2px 14px 8px',
        }}>
          <span style={{ flex: 1, height: 1, background: 'rgba(60,38,25,.22)' }}/>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800,
            letterSpacing: '.28em', textTransform: 'uppercase',
            color: BFTC_T.inkSoft,
          }}>Caractéristiques</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(60,38,25,.22)' }}/>
        </div>

        {/* stats panel */}
        <div style={{
          margin: '0 14px',
          padding: '11px 12px 13px',
          borderRadius: 14,
          background: 'linear-gradient(to bottom, rgba(255,255,255,.55) 0%, rgba(244,228,193,.5) 100%)',
          border: '1.5px solid rgba(60,38,25,.22)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -10px 18px rgba(0,0,0,.05)',
          display: 'flex', flexDirection: 'column', gap: 11,
        }}>
          <StatBar icon="⚔" label="Attaque"             value={s.attack}         max={FIELD_MAX.attack}         delay={0}   />
          <DefenseGroup stats={s} max={FIELD_MAX} delayBase={140} />
          <StatBar icon="💨" label="Vitesse"             value={s.speed}          max={FIELD_MAX.speed}          delay={420} />
          <StatBar icon="📦" label="Capacité de pillage" value={s.carryCapacity}  max={FIELD_MAX.carryCapacity}  delay={490} />
        </div>

        {/* sub-stats row: training time + population */}
        <div style={{
          margin: '10px 14px 0',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          <SubStat icon="⏱" label="Formation" value={troop.trainingTime} />
          <SubStat icon="👤" label="Population" value={`${troop.populationCost} place`} />
        </div>

        {/* passive */}
        <div style={{ height: 10 }}/>
        <PassiveCard passive={troop.passive} />
        <div style={{ height: 12 }}/>
      </div>

      {/* footer */}
      <div style={{
        padding: '10px 14px 12px',
        background: 'linear-gradient(to bottom, rgba(93,74,50,.95), rgba(60,38,25,.97))',
        borderTop: `2px solid ${BFTC_T.woodBark}`,
        display: 'flex', flexDirection: 'column', gap: 9,
      }}>
        <CostStrip
          cost={cost}
          stock={STOCK}
          label="Coût (×1)"
          multiplier="Par unité"
          dense
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <PixelBtn variant="neutral" size="md" full>Fermer</PixelBtn>
          <PixelBtn variant="success" size="md" full disabled={!affordable}>
            Recruter
          </PixelBtn>
        </div>
      </div>
    </ModalShell>
  );
}

// Inline sub-stat tile used between stats panel and passive.
function SubStat({ icon, label, value }) {
  return (
    <div style={{
      borderRadius: 10,
      border: '1.5px solid rgba(60,38,25,.22)',
      background: 'linear-gradient(to bottom, rgba(255,255,255,.5), rgba(244,228,193,.5))',
      padding: '6px 9px',
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55)',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 7,
        background: 'linear-gradient(to bottom, rgba(60,38,25,.16), rgba(60,38,25,.04))',
        border: '1px solid rgba(60,38,25,.2)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: BFTC_T.ink,
      }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 8.5, fontWeight: 800, letterSpacing: '.16em',
          color: BFTC_T.inkSoft, textTransform: 'uppercase',
        }}>{label}</span>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 12, fontWeight: 800, color: BFTC_T.ink,
          fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        }}>{value}</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------- Phone frame
function VillageBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#7c9756 0%,#a8b977 28%,#cdbf8e 60%,#b89968 100%)' }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 62,
        background: 'linear-gradient(to bottom, rgba(60,38,25,.94), rgba(78,56,34,.94))',
        borderBottom: '2px solid #8b7355',
      }}/>
      <img src="assets/buildings/barracks.png" alt="" style={{ position: 'absolute', top: 200, left: 70, width: 140, opacity: .75 }} />
      <img src="assets/buildings/castle.png" alt="" style={{ position: 'absolute', top: 380, left: 200, width: 110, opacity: .7 }} />
      <img src="assets/buildings/watchtower.png" alt="" style={{ position: 'absolute', top: 440, left: 30, width: 90, opacity: .7 }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 64,
        background: 'linear-gradient(to top, rgba(60,38,25,.95), rgba(78,56,34,.9))',
        borderTop: '2px solid #8b7355',
      }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)' }}/>
    </div>
  );
}

function PhoneTroopDetail() {
  return (
    <div style={{
      position: 'relative', width: 360, height: 720,
      borderRadius: 36, overflow: 'hidden',
      background: '#1a1a2e', border: '8px solid #0c0c1a',
      boxShadow: '0 30px 60px rgba(0,0,0,.6), inset 0 0 0 2px #2a2a45',
    }}>
      <VillageBg/>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 10,
      }}>
        <TroopDetailModal/>
      </div>
    </div>
  );
}

Object.assign(window, {
  TROOP, FIELD_MAX, TroopDetailModal, PhoneTroopDetail,
});
