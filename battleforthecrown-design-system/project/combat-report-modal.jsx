/* global React, BFTC_T, ModalShell, PixelBtn, Pill, BFTC_RESOURCE_ICON */
/* Battle for the Crown — Combat Report Modal
   ----------------------------------------------------------------------
   Mobile-portrait rapport de combat. Same visual vocabulary as the
   Troop Detail modal: parchment ModalShell with a color-tinted gold
   strip on top, a hero block (outcome banner instead of portrait),
   animated stat bars normalised against a peak value, a passive-style
   highlight card (loot or damages), and the wood-strip footer with
   action buttons.

   Two variants exposed: 'win' (raid victory) and 'lose' (defense
   defeat). The hero accent flips green / red, the stat bars
   contextualise losses, and the highlight card morphs from "Butin
   ramené" to "Dégâts subis".
   ---------------------------------------------------------------------- */

const { useState: useState_cr, useEffect: useEffect_cr } = React;

// ---------------------------------------------------------------- data --
const REPORT_WIN = {
  outcome:   'win',
  type:      'Pillage offensif',
  banner:    'VICTOIRE',
  motto:     '« Les corbeaux suivent vos étendards. »',
  when:      'Il y a 12 min',
  battleId:  '#7421-A',
  attacker:  { name: 'Vous',         place: 'Castelnef',     coord: '234|612', side: 'left'  },
  defender:  { name: 'Sire_Robert',  place: "Roc-d'Acier",   coord: '238|617', side: 'right' },
  // metrics expressed as values normalised against MAX_METRIC (below).
  metrics: {
    forceRatio:    78,   // attacker force / (attacker + defender) — 50 = parity, >50 = attacker advantage
    casualtyRate:  18,   // % of attacker army lost
    enemyWipe:     100,  // % of defender army crushed
    loot:          85,   // % of carry capacity used
  },
  attackerUnits: [
    { icon: 'assets/army/squire.png', name: 'Squires',  sent: 120, lost: 18 },
    { icon: 'assets/army/archer.png', name: 'Archers',  sent: 60,  lost: 4  },
  ],
  defenderUnits: [
    { icon: 'assets/army/militia.png', name: 'Miliciens', sent: 80, lost: 80 },
    { icon: 'assets/army/templar.png', name: 'Templiers', sent: 5,  lost: 5  },
  ],
  highlight: {
    kind: 'loot',
    title: 'Butin ramené',
    bonus: '+3.600 G',
    desc:  'Retour de la troupe dans 1h 12. Capacité de portage à 85 %.',
    chips: [
      { icon: 'assets/resources/wood.png',       value: '1.240' },
      { icon: 'assets/resources/stone.png',      value:   '820' },
      { icon: 'assets/resources/iron.png',       value:   '340' },
      { icon: 'assets/casual-icons/coin.png',    value: '1.200' },
    ],
  },
};

const REPORT_LOSE = {
  outcome:   'lose',
  type:      'Défense du village',
  banner:    'DÉFAITE',
  motto:     '« Les murs ont tenu — vos hommes, non. »',
  when:      'Il y a 1h 04',
  battleId:  '#7424-D',
  attacker:  { name: 'Dame_Aliénor', place: 'Tours-Hautes',  coord: '198|580', side: 'left'  },
  defender:  { name: 'Vous',         place: 'Castelnef',     coord: '234|612', side: 'right' },
  metrics: {
    forceRatio:    32,   // defender (you) had less force than attacker
    casualtyRate:  92,   // 92% of your garrison destroyed
    enemyWipe:     14,   // only 14% of enemy crushed
    loot:          70,   // they took 70% of their carry capacity from you
  },
  attackerUnits: [
    { icon: 'assets/army/savage.png', name: 'Sauvages',  sent: 180, lost: 22 },
    { icon: 'assets/army/templar.png', name: 'Templiers', sent: 40,  lost: 6  },
  ],
  defenderUnits: [
    { icon: 'assets/army/militia.png', name: 'Miliciens', sent: 160, lost: 160 },
    { icon: 'assets/army/squire.png',  name: 'Squires',   sent: 80,  lost: 60  },
  ],
  highlight: {
    kind: 'damage',
    title: 'Dégâts subis',
    bonus: '−3.480 G',
    desc:  'Caserne endommagée (−1 niv.). Murs tenus de justesse.',
    chips: [
      { icon: 'assets/resources/wood.png',    value: '−1.120' },
      { icon: 'assets/resources/stone.png',   value:   '−640' },
      { icon: 'assets/resources/iron.png',    value:   '−420' },
      { icon: 'assets/casual-icons/coin.png', value: '−1.300' },
    ],
  },
};

// metrics caps: every bar is rendered as value / 100
const MAX_METRIC = 100;

// --------------------------------------------------------------- tones --
const TONE_GRAD_CR = {
  green: ['#7ec74e', '#3a8a1f', '#2d6b16'],
  gold:  ['#f1c40f', '#b67e0a', '#8a5e07'],
  red:   ['#e74c3c', '#a93226', '#7d2218'],
};

// Bar tier — context-aware. Some metrics are "higher is better for you"
// (force, enemyWipe, loot) and others "lower is better" (casualtyRate).
// `polarity` flips the green/red mapping.
function crTier(pct, polarity = 'up') {
  const v = polarity === 'down' ? 100 - pct : pct;
  if (v >= 80) return { label: polarity === 'down' ? 'Léger'    : 'Écrasant',   tone: 'green' };
  if (v >= 55) return { label: polarity === 'down' ? 'Modéré'   : 'Solide',     tone: 'green' };
  if (v >= 35) return { label: polarity === 'down' ? 'Lourd'    : 'Mitigé',     tone: 'gold'  };
  if (v >= 15) return { label: polarity === 'down' ? 'Saignant' : 'Faible',     tone: 'red'   };
  return                  { label: polarity === 'down' ? 'Décimé'   : 'Médiocre',   tone: 'red'   };
}

// ---------------------------------------------------------- ReportHero --
// Replaces TroopHero. Big sigil instead of a portrait, then opponent /
// place / coord triplet on the right.
function ReportHero({ r }) {
  const win = r.outcome === 'win';
  const youOnLeft = r.attacker.name === 'Vous';
  const you  = youOnLeft ? r.attacker : r.defender;
  const them = youOnLeft ? r.defender : r.attacker;
  const role = youOnLeft ? 'Attaquant' : 'Défenseur';

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, padding: '12px 14px 8px' }}>
      {/* sigil — replaces the portrait. Crown for win, broken-shield for loss. */}
      <div style={{
        position: 'relative',
        width: 78, height: 86, borderRadius: 14,
        background: win
          ? 'linear-gradient(160deg, #1f3d18 0%, #0d1a07 100%)'
          : 'linear-gradient(160deg, #4a1410 0%, #1d0606 100%)',
        border: `2.5px solid ${BFTC_T.woodBark}`,
        overflow: 'hidden', flexShrink: 0,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), 0 4px 0 rgba(0,0,0,.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          position: 'absolute', inset: 0,
          background: win
            ? 'radial-gradient(ellipse at 50% 40%, rgba(126,199,78,.55) 0%, rgba(126,199,78,0) 70%)'
            : 'radial-gradient(ellipse at 50% 40%, rgba(231,76,60,.55) 0%, rgba(231,76,60,0) 70%)',
        }}/>
        <img
          src={win ? 'assets/casual-icons/crown.png' : 'assets/icons/hand-red.png'}
          alt=""
          style={{ width: '64%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.55))', position: 'relative', zIndex: 1 }}
        />
        {/* battleId ribbon */}
        <span style={{
          position: 'absolute', left: 4, bottom: 4,
          fontFamily: BFTC_T.font, fontSize: 7.5, fontWeight: 800, letterSpacing: '.18em',
          padding: '2px 5px', borderRadius: 4,
          background: `linear-gradient(to bottom, ${BFTC_T.goldL}, ${BFTC_T.goldD})`,
          color: '#3a2a00', border: `1px solid ${BFTC_T.goldB}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)',
          zIndex: 2,
        }}>{r.battleId}</span>
      </div>

      {/* outcome block */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, letterSpacing: '.28em',
          color: BFTC_T.inkSoft, textTransform: 'uppercase',
        }}>{r.type} · {r.when}</div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 24, fontWeight: 900, lineHeight: 1,
          color: win ? '#2d6b16' : '#a93226', letterSpacing: '.02em',
          textShadow: '0 1px 0 rgba(255,255,255,.55)',
        }}>{r.banner}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800,
            letterSpacing: '.14em', textTransform: 'uppercase',
            padding: '2.5px 7px', borderRadius: 999,
            background: win
              ? `linear-gradient(to bottom, ${BFTC_T.greenL}, ${BFTC_T.greenD})`
              : `linear-gradient(to bottom, ${BFTC_T.redL}, ${BFTC_T.redD})`,
            border: `1.5px solid ${win ? BFTC_T.greenB : BFTC_T.redB}`,
            color: '#fff',
            textShadow: '1px 1px 1px rgba(0,0,0,.4)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)',
          }}>{role}</span>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 700, color: BFTC_T.inkSoft,
          }}>vs {them.name}</span>
        </div>
        <div style={{
          fontFamily: BFTC_T.font, fontStyle: 'italic',
          fontSize: 10.5, color: BFTC_T.inkSoft,
          paddingLeft: 8, borderLeft: '2px solid rgba(60,38,25,.25)',
          marginTop: 2,
        }}>{r.motto}</div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------- VersusStrip
// Compact map / coord strip between hero and stats. Two place names with
// an animated "VS" disc in the middle and an arrow of march.
function VersusStrip({ r }) {
  const win = r.outcome === 'win';
  const youOnLeft = r.attacker.name === 'Vous';
  const left  = youOnLeft ? r.attacker : r.defender;
  const right = youOnLeft ? r.defender : r.attacker;
  return (
    <div style={{
      margin: '2px 14px 0',
      padding: '7px 10px',
      borderRadius: 10,
      background: 'linear-gradient(to bottom, rgba(60,38,25,.06), rgba(60,38,25,.12))',
      border: '1px solid rgba(60,38,25,.2)',
      display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 11.5, fontWeight: 800, color: BFTC_T.ink,
          letterSpacing: '.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{left.name}</div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 600, color: BFTC_T.inkSoft,
          letterSpacing: '.04em',
        }}>{left.place} · {left.coord}</div>
      </div>
      <div style={{
        position: 'relative', width: 36, height: 36, borderRadius: 99,
        background: `linear-gradient(to bottom, ${win ? BFTC_T.greenL : BFTC_T.redL}, ${win ? BFTC_T.greenD : BFTC_T.redD})`,
        border: `2px solid ${win ? BFTC_T.greenB : BFTC_T.redB}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 12,
        letterSpacing: '.04em', textShadow: '1px 1px 1px rgba(0,0,0,.45)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 2px 0 rgba(0,0,0,.2)',
      }}>VS</div>
      <div style={{ minWidth: 0, textAlign: 'right' }}>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 11.5, fontWeight: 800, color: BFTC_T.ink,
          letterSpacing: '.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{right.name}</div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 600, color: BFTC_T.inkSoft,
          letterSpacing: '.04em',
        }}>{right.place} · {right.coord}</div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------- UnitRoster
// Simple two-column layout — sprite + sent number + arrow + losses in red.
// One line per unit, nothing else. Mirrors the original preview card.
function UnitRoster({ r }) {
  const youOnLeft = r.attacker.name === 'Vous';
  const yours  = youOnLeft ? r.attackerUnits : r.defenderUnits;
  const theirs = youOnLeft ? r.defenderUnits : r.attackerUnits;

  function Col({ title, units }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800,
          letterSpacing: '.18em', textTransform: 'uppercase',
          color: BFTC_T.inkSoft,
        }}>{title}</div>
        {units.map(u => (
          <div key={u.name} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: BFTC_T.font, fontSize: 12, color: BFTC_T.ink,
            fontVariantNumeric: 'tabular-nums',
          }}>
            <img src={u.icon} alt="" style={{ width: 22, height: 22, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.35))' }}/>
            <span style={{ fontWeight: 700 }}>{u.sent}</span>
            <span style={{ color: BFTC_T.inkSoft }}>→</span>
            <span style={{ color: BFTC_T.redB, fontWeight: 800 }}>−{u.lost}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      margin: '0 14px',
      padding: '11px 12px 12px',
      borderRadius: 14,
      background: 'linear-gradient(to bottom, rgba(255,255,255,.55) 0%, rgba(244,228,193,.5) 100%)',
      border: '1.5px solid rgba(60,38,25,.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -10px 18px rgba(0,0,0,.05)',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
      position: 'relative',
    }}>
      <Col title="Attaquant" units={r.attackerUnits}/>
      <Col title="Défenseur" units={r.defenderUnits}/>
      {/* center divider */}
      <span style={{
        position: 'absolute', left: '50%', top: 12, bottom: 12, width: 1,
        background: 'rgba(60,38,25,.16)', transform: 'translateX(-0.5px)',
      }}/>
    </div>
  );
}

// ---------------------------------------------------- LootStrip --
// Simple "Butin ramené" — just a label and a row of resource pills, as in
// the original Combat Report preview. Rendered only for victories.
function LootStrip({ chips }) {
  return (
    <div style={{
      margin: '0 14px',
      padding: '10px 12px 12px',
      borderRadius: 14,
      background: 'linear-gradient(to bottom, rgba(255,255,255,.55) 0%, rgba(244,228,193,.5) 100%)',
      border: '1.5px solid rgba(60,38,25,.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -10px 18px rgba(0,0,0,.05)',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      <div style={{
        fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800,
        letterSpacing: '.18em', textTransform: 'uppercase',
        color: BFTC_T.inkSoft,
      }}>Butin ramené</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {chips.map((c, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px 3px 4px',
            borderRadius: 999,
            background: 'rgba(0,0,0,.06)',
            border: '1.5px solid rgba(0,0,0,.18)',
            fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 12,
            color: BFTC_T.ink, fontVariantNumeric: 'tabular-nums',
          }}>
            <img src={c.icon} alt="" style={{ width: 16, height: 16, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.25))' }}/>
            {c.value}
          </span>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------- Modal --
function CombatReportModal({ report = REPORT_WIN, onClose = () => {} }) {
  const win = report.outcome === 'win';

  return (
    <ModalShell
      eyebrow="Messagerie · Rapport de combat"
      title={win ? 'Victoire au combat' : 'Défaite au combat'}
      accent={win ? BFTC_T.greenD : BFTC_T.redD}
      accentLight={win ? BFTC_T.greenL : BFTC_T.redL}
      onClose={onClose}
      width={334}
      maxHeight={680}
    >
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        <ReportHero r={report} />
        <VersusStrip r={report} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          margin: '12px 14px 8px',
        }}>
          <span style={{ flex: 1, height: 1, background: 'rgba(60,38,25,.22)' }}/>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800,
            letterSpacing: '.28em', textTransform: 'uppercase',
            color: BFTC_T.inkSoft,
          }}>Pertes sur le champ</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(60,38,25,.22)' }}/>
        </div>

        {/* unit roster — primary content */}
        <UnitRoster r={report} />

        {/* secondary: butin — win only */}
        {win && (
          <>
            <div style={{ height: 10 }}/>
            <LootStrip chips={report.highlight.chips} />
          </>
        )}
        <div style={{ height: 12 }}/>
      </div>

      {/* footer */}
      <div style={{
        padding: '10px 14px 12px',
        background: 'linear-gradient(to bottom, rgba(93,74,50,.95), rgba(60,38,25,.97))',
        borderTop: `2px solid ${BFTC_T.woodBark}`,
        display: 'flex', flexDirection: 'column', gap: 9,
      }}>
        {/* meta strip styled like the CostStrip header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 700, color: '#f0e0c0',
            letterSpacing: '.18em', textTransform: 'uppercase',
          }}>Rapport {report.battleId}</span>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, color: '#cdb88a',
            letterSpacing: '.14em',
          }}>{report.when}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PixelBtn variant="neutral" size="md" full>Détails</PixelBtn>
          {win
            ? <PixelBtn variant="success" size="md" full>Partager</PixelBtn>
            : <PixelBtn variant="danger"  size="md" full>Riposter</PixelBtn>}
        </div>
      </div>
    </ModalShell>
  );
}

// ----------------------------------------------------------- Phone frame
function VillageBgCR({ outcome }) {
  const tint = outcome === 'win'
    ? 'radial-gradient(ellipse at 50% 35%, rgba(126,199,78,.22) 0%, rgba(126,199,78,0) 65%)'
    : 'radial-gradient(ellipse at 50% 35%, rgba(231,76,60,.22) 0%, rgba(231,76,60,0) 65%)';
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#7c9756 0%,#a8b977 28%,#cdbf8e 60%,#b89968 100%)' }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 62,
        background: 'linear-gradient(to bottom, rgba(60,38,25,.94), rgba(78,56,34,.94))',
        borderBottom: '2px solid #8b7355',
      }}/>
      <img src="assets/buildings/castle.png"    alt="" style={{ position: 'absolute', top: 200, left: 60, width: 140, opacity: .72 }} />
      <img src="assets/buildings/barracks.png"  alt="" style={{ position: 'absolute', top: 380, left: 200, width: 110, opacity: .65 }} />
      <img src="assets/buildings/watchtower.png"alt="" style={{ position: 'absolute', top: 440, left: 30, width: 90, opacity: .65 }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 64,
        background: 'linear-gradient(to top, rgba(60,38,25,.95), rgba(78,56,34,.9))',
        borderTop: '2px solid #8b7355',
      }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)' }}/>
      <div style={{ position: 'absolute', inset: 0, background: tint, pointerEvents: 'none' }}/>
    </div>
  );
}

function PhoneCombatReport({ variant = 'win' }) {
  const report = variant === 'win' ? REPORT_WIN : REPORT_LOSE;
  return (
    <div style={{
      position: 'relative', width: 360, height: 720,
      borderRadius: 36, overflow: 'hidden',
      background: '#1a1a2e', border: '8px solid #0c0c1a',
      boxShadow: '0 30px 60px rgba(0,0,0,.6), inset 0 0 0 2px #2a2a45',
    }}>
      <VillageBgCR outcome={report.outcome}/>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 10,
      }}>
        <CombatReportModal report={report}/>
      </div>
    </div>
  );
}

Object.assign(window, {
  REPORT_WIN, REPORT_LOSE, CombatReportModal, PhoneCombatReport,
});
