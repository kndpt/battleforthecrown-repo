/* global React, BFTC_T, ModalShell, PixelBtn, Pill, BFTC_RESOURCE_ICON */
/* Battle for the Crown — Devoirs Royaux : sceau HUD + sheet modale
   ----------------------------------------------------------------------
   Le Roi reçoit ses devoirs « par essence » : pas de bâtiment dédié,
   pas d'onglet bottom-nav. Un sceau royal permanent vit dans le HUD top
   et déclenche une sheet plein écran listant 4–6 tâches quotidiennes
   couvrant les boucles éco/militaire/scout/conquête.

   Ce fichier expose :
     - <RoyalSeal>            le glyph (disque de cire + couronne)
     - <ParchmentStamp>       variante parchemin (carré crème)
     - <HUDWithSeal>          le TopBar reconstruit avec le sceau placé
                              (pendant / inline / floating)
     - <DailyQuestSheet>      la modal ModalShell pleine hauteur
     - <PhoneQuestModal>      un frame mobile avec le sheet ouvert
     - <PhoneHUDOnly>         frame mobile coupé au HUD (comparaisons)
   ---------------------------------------------------------------------- */

const ASSET_Q  = 'assets';
const R_Q = (n) => `${ASSET_Q}/resources/${n}.png`;
const B_Q = (n) => `${ASSET_Q}/buildings/${n}.png`;
const A_Q = (n) => `${ASSET_Q}/army/${n}.png`;
const I_Q = (n) => `${ASSET_Q}/icons/${n}.png`;
const C_Q = (n) => `${ASSET_Q}/casual-icons/${n}.png`;

// ---------------------------------------------------------------- data --
const QUEST_HUD_PROPS = {
  name: 'Sire Kelvin', level: 12, power: '2 480', crowns: 28,
  resources: {
    wood:       { value: '8 500',   sub: '+120/h' },
    stone:      { value: '3 200',   sub: '+80/h'  },
    iron:       { value: '1 500',   sub: '+50/h'  },
    population: { value: '120/200', sub: 'villageois' },
  },
};

const QUEST_DATA = {
  chapter: {
    eyebrow: 'Quête de chapitre · IV',
    title:   'Briser le siège de Roc-d\u2011Acier',
    body:    'Lancez une attaque réussie contre Sire_Robert avant la pleine lune. Le héraut récompensera votre audace.',
    rewards: [
      { icon: C_Q('crown'),    value:    '50' },
      { icon: R_Q('iron'),     value: '2.000' },
    ],
    expiresIn: '3 jours',
  },
  daily: [
    { id:'wood',   icon: R_Q('wood'),         name: 'Récolter 1.500 bois',
      loop: 'Éco',         have:  980, need: 1500,
      reward: [{ icon: C_Q('coin'),  value: 200 }],   state: 'progress' },
    { id:'troop',  icon: A_Q('squire'),       name: 'Recruter 12 squires',
      loop: 'Militaire',   have:   12, need:   12,
      reward: [{ icon: C_Q('crown'), value:   5 }],   state: 'claimable' },
    { id:'scout',  icon: I_Q('position'),     name: 'Espionner 1 voisin',
      loop: 'Scout',       have:    0, need:    1,
      reward: [{ icon: R_Q('iron'),  value: 120 }],   state: 'todo' },
    { id:'raid',   icon: I_Q('hand-red'),     name: 'Gagner 1 bataille',
      loop: 'Conquête',    have:    0, need:    1,
      reward: [{ icon: R_Q('wood'),  value: 500 },
               { icon: R_Q('stone'), value: 500 }],   state: 'todo' },
    { id:'upgrade',icon: B_Q('castle'),       name: 'Améliorer un bâtiment',
      loop: 'Éco',         have:    1, need:    1,
      reward: [{ icon: C_Q('crown'), value:   3 }],   state: 'claimable' },
    { id:'temple', icon: I_Q('lock'),         name: 'Faire un don au temple',
      loop: '—',           have:    0, need:    1,
      reward: [{ icon: C_Q('crown'), value:  10 }],   state: 'locked',
      lockedHint: 'Débloque à la fin du chapitre III.' },
  ],
  meta: {
    expiresIn:  '6h 22m',
    backlog:    { current: 1, total: 3, nextAt: 'demain · 12h' },
  },
};

const claimableCount = QUEST_DATA.daily.filter(q => q.state === 'claimable').length;
const completedCount = QUEST_DATA.daily.filter(q => q.state === 'claimable' || q.state === 'done').length;

// =================================================================== seal
// Wax-seal disc + parchment-stamp alternative.
// Size is the actual disc; the parent should give it a >=44×44 hit area.

function RoyalSeal({
  size = 44,
  variant = 'wax',          // 'wax' | 'parchment'
  badge = false,            // red dot if ≥1 claimable
  badgeCount = null,        // optional count inside red dot
  pressed = false,
  halo = false,             // soft gold halo when claimable
  style,
}) {
  if (variant === 'parchment') {
    return (
      <ParchmentStamp size={size} badge={badge} badgeCount={badgeCount} pressed={pressed} halo={halo} style={style}/>
    );
  }
  const inner = Math.round(size * 0.56);
  return (
    <div style={{
      position: 'relative',
      width: size, height: size,
      flexShrink: 0,
      ...style,
    }}>
      {halo && (
        <span style={{
          position: 'absolute', inset: -size * 0.18, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(246,213,123,.55) 0%, rgba(246,213,123,0) 70%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'sealHalo 2.2s ease-in-out infinite',
        }}/>
      )}
      <div style={{
        position: 'relative', zIndex: 1,
        width: size, height: size, borderRadius: '50%',
        background: 'radial-gradient(circle at 32% 26%, #fff3b0 0%, #f1c40f 32%, #b67e0a 72%, #6e4a08 100%)',
        border: '2.5px solid #4a2f06',
        boxShadow: pressed
          ? 'inset 0 3px 6px rgba(0,0,0,.55), 0 1px 0 rgba(0,0,0,.2)'
          : 'inset 0 1px 0 rgba(255,255,255,.55), 0 3px 0 rgba(0,0,0,.28), 0 6px 14px rgba(74,47,6,.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: pressed ? 'translateY(1px)' : 'none',
        transition: 'transform .1s, filter .15s',
      }}>
        {/* engraved notched ring */}
        <span style={{
          position: 'absolute', inset: size > 36 ? 3.5 : 2.5,
          borderRadius: '50%',
          border: `1px dashed rgba(60,30,0,.45)`,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)',
          pointerEvents: 'none',
        }}/>
        {/* crown emboss */}
        <img src={C_Q('crown')} alt="" style={{
          width: inner, height: inner,
          filter: 'drop-shadow(0 1px 0 rgba(255,255,255,.45)) drop-shadow(0 -1px 0 rgba(60,30,0,.45))',
          opacity: .92,
        }}/>
        {/* top-edge highlight */}
        <span style={{
          position: 'absolute', left: '18%', right: '40%', top: '10%', height: '18%',
          borderRadius: '50%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,.55), rgba(255,255,255,0))',
          filter: 'blur(1.5px)',
          pointerEvents: 'none',
        }}/>
      </div>
      {badge && <SealBadge count={badgeCount} size={size}/>}
    </div>
  );
}

function ParchmentStamp({ size = 44, badge = false, badgeCount = null, pressed = false, halo = false, style }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      {halo && (
        <span style={{
          position: 'absolute', inset: -size * 0.18, borderRadius: 12,
          background: 'radial-gradient(circle, rgba(246,213,123,.5) 0%, rgba(246,213,123,0) 70%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'sealHalo 2.2s ease-in-out infinite',
        }}/>
      )}
      <div style={{
        position: 'relative', zIndex: 1,
        width: size, height: size, borderRadius: 10,
        background: 'linear-gradient(160deg, #fef0c6 0%, #e8c878 60%, #c79a3e 100%)',
        border: '2.5px solid #6e4a08',
        boxShadow: pressed
          ? 'inset 0 3px 5px rgba(0,0,0,.45), 0 1px 0 rgba(0,0,0,.2)'
          : 'inset 0 1px 0 rgba(255,255,255,.55), 0 3px 0 rgba(0,0,0,.25), 0 6px 14px rgba(74,47,6,.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: pressed ? 'translateY(1px)' : 'none',
      }}>
        {/* ribbon strip at the bottom */}
        <span style={{
          position: 'absolute', left: -3, right: -3, bottom: '14%', height: size * 0.18,
          background: 'linear-gradient(to bottom, #c84128 0%, #7d2218 100%)',
          borderTop: '1px solid rgba(0,0,0,.35)',
          borderBottom: '1px solid rgba(0,0,0,.35)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
        }}/>
        <span style={{
          fontFamily: BFTC_T.font, fontWeight: 900, fontSize: size * 0.52,
          color: '#5a3a05', lineHeight: 1,
          textShadow: '0 1px 0 rgba(255,255,255,.55), 0 -1px 0 rgba(60,30,0,.4)',
          marginTop: -size * 0.04,
        }}>⚜</span>
      </div>
      {badge && <SealBadge count={badgeCount} size={size}/>}
    </div>
  );
}

function SealBadge({ count, size }) {
  const dot = Math.max(13, Math.round(size * 0.32));
  return (
    <span style={{
      position: 'absolute', top: -dot * 0.18, right: -dot * 0.18,
      minWidth: dot, height: dot, borderRadius: 999,
      padding: count != null ? '0 4px' : 0,
      background: 'radial-gradient(circle at 32% 28%, #ff8a7d 0%, #e74c3c 45%, #a93226 100%)',
      border: `2px solid ${BFTC_T.parch1}`,
      boxShadow: '0 1px 3px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.4)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: BFTC_T.font, fontWeight: 900,
      fontSize: dot * 0.62, color: '#fff', lineHeight: 1,
      textShadow: '0 1px 1px rgba(0,0,0,.4)',
      zIndex: 2,
    }}>{count != null ? count : ''}</span>
  );
}

// ============================================================ HUD chrome
// Re-implementation of the live TopBar with the seal slotted in.

function SmallBadge_Q({ children, gold, dark }) {
  const bg = gold ? 'linear-gradient(to bottom,#f6d57b,#c59e3f)' : 'linear-gradient(to bottom,#8b6f47,#5d4a32)';
  const bd = gold ? '#9e7b0d' : '#3d2f1f';
  const c  = gold ? '#3a2a00' : '#fff';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 0, padding: '1px 7px', height: 20,
      background: bg, border: `2px solid ${bd}`, borderRadius: 9999,
      fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 11, color: c,
      textShadow: c === '#fff' ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
    }}>{children}</span>
  );
}

function ResChip_Q({ icon, value, sub }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', gap: 5,
      background: 'rgba(0,0,0,.4)', border: '2px solid rgba(255,255,255,.12)',
      borderRadius: 8, padding: '3px 6px', minWidth: 0,
    }}>
      <img src={icon} style={{ width: 20, height: 20, flexShrink: 0, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.5))' }} alt=""/>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, minWidth: 0 }}>
        <span style={{ fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 11, color: '#fff',
          textShadow: '1px 1px 1px rgba(0,0,0,.5)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <span style={{ fontFamily: BFTC_T.font, fontSize: 9, color: '#cdb88a' }}>{sub}</span>
      </div>
    </div>
  );
}

// Seal "inline" badge — sized to ride in the small-badges row alongside power/crowns.
// The disc itself is ~26 high; we pad the click target to 44.
function InlineSealBtn({ badge, halo, label = 'DEVOIRS' }) {
  return (
    <button type="button" aria-label="Devoirs royaux" style={{
      position: 'relative',
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 22, padding: '0 9px 0 4px',
      background: 'linear-gradient(to bottom, #f6d57b 0%, #c59e3f 100%)',
      border: '2px solid #6e4a08', borderRadius: 9999,
      cursor: 'pointer',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), 0 2px 0 rgba(0,0,0,.25)',
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        background: 'radial-gradient(circle at 32% 26%, #fff3b0 0%, #f1c40f 35%, #8a5e07 100%)',
        border: '1.5px solid #4a2f06',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img src={C_Q('crown')} alt="" style={{ width: 12, height: 12, filter: 'drop-shadow(0 1px 0 rgba(60,30,0,.4))' }}/>
      </span>
      <span style={{
        fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 10, letterSpacing: '.14em',
        color: '#3a2a00', textShadow: '0 1px 0 rgba(255,255,255,.4)',
      }}>{label}</span>
      {badge && (
        <span style={{
          position: 'absolute', top: -3, right: -3,
          width: 12, height: 12, borderRadius: 999,
          background: 'radial-gradient(circle at 32% 28%, #ff8a7d 0%, #e74c3c 50%, #a93226 100%)',
          border: `2px solid ${BFTC_T.parch1}`,
          boxShadow: '0 1px 2px rgba(0,0,0,.4)',
        }}/>
      )}
      {halo && (
        <span style={{
          position: 'absolute', inset: -6, borderRadius: 9999,
          background: 'radial-gradient(ellipse, rgba(246,213,123,.55) 0%, rgba(246,213,123,0) 70%)',
          pointerEvents: 'none', zIndex: -1,
          animation: 'sealHalo 2.2s ease-in-out infinite',
        }}/>
      )}
    </button>
  );
}

// HUD TopBar with seal at one of three placements.
// placement: 'pendant' (overhang right) | 'inline' (badge in row) | 'floating' (below HUD)
// claimable: 0 = no red dot, >0 = red dot (with count when small enough)
function HUDWithSeal({ placement = 'pendant', claimable = 1, sealVariant = 'wax' }) {
  const { name, level, power, crowns, resources } = QUEST_HUD_PROPS;
  const hasClaim = claimable > 0;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(to bottom,rgba(60,38,25,.95),rgba(78,56,34,.95))',
        borderBottom: '2px solid #8b7355', padding: '8px 10px',
        paddingRight: placement === 'pendant' ? 64 : 10,   // make room for the overhanging pendant
        position: 'relative', zIndex: 2,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(to bottom,#8b6f47,#6d5838)', border: '2px solid #5d4a32',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 12, color: '#fff',
          textShadow: '1px 1px 1px rgba(0,0,0,.5)', position: 'relative', flexShrink: 0,
        }}>
          SK
          <span style={{ position: 'absolute', bottom: -4, right: -4,
            background: 'linear-gradient(to bottom,#f6d57b,#c59e3f)',
            border: '2px solid #9e7b0d', borderRadius: '50%', width: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: '#3a2a00' }}>{level}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <SmallBadge_Q dark><img src={I_Q('army-power')} style={{ width: 12, height: 12, marginRight: 3 }}/>{power}</SmallBadge_Q>
            <SmallBadge_Q gold><img src={I_Q('crown')} style={{ width: 12, height: 12, marginRight: 3 }}/>{crowns}</SmallBadge_Q>
            {placement === 'inline' && (
              <InlineSealBtn badge={hasClaim} halo={hasClaim}/>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5, width: '100%' }}>
            <ResChip_Q icon={R_Q('wood')}       {...resources.wood}/>
            <ResChip_Q icon={R_Q('stone')}      {...resources.stone}/>
            <ResChip_Q icon={R_Q('iron')}       {...resources.iron}/>
            <ResChip_Q icon={R_Q('population')} {...resources.population}/>
          </div>
        </div>
      </div>

      {/* Pendant placement — overhangs the right edge, half below the bar */}
      {placement === 'pendant' && (
        <button type="button" aria-label="Devoirs royaux" style={{
          position: 'absolute', top: 6, right: 8,
          width: 56, height: 56, padding: 0,
          background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 5,
        }}>
          <RoyalSeal size={48} variant={sealVariant} badge={hasClaim} halo={hasClaim} badgeCount={claimable > 1 ? claimable : null}/>
          {/* leather cord/clasp tying the seal to the banner edge */}
          <span style={{
            position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%) rotate(-12deg)',
            width: 4, height: 10, borderRadius: 2,
            background: 'linear-gradient(to bottom, #3c2619, #1a0e08)',
            border: '1px solid #0e0805',
            zIndex: -1,
          }}/>
        </button>
      )}

      {/* Floating placement — pinned below the HUD, top-right of the scene */}
      {placement === 'floating' && (
        <button type="button" aria-label="Devoirs royaux" style={{
          position: 'absolute', top: 64 + 6, right: 8,
          width: 50, height: 50, padding: 0,
          background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 5,
        }}>
          <RoyalSeal size={46} variant={sealVariant} badge={hasClaim} halo={hasClaim} badgeCount={claimable > 1 ? claimable : null}/>
        </button>
      )}
    </div>
  );
}

// ====================================================== quest list rows
// Visual grammar = preview/components-quest-card.html, transposed to JSX.

function QuestRow({ q }) {
  const pct = q.need ? Math.min(100, Math.round((q.have / q.need) * 100)) : 0;
  const isLocked    = q.state === 'locked';
  const isClaimable = q.state === 'claimable';
  const isDone      = q.state === 'done';

  const bg = isClaimable
    ? 'linear-gradient(to bottom, #fef0c6, #e8c878)'
    : isDone
      ? 'linear-gradient(to bottom, #d6ecc4, #a8d28d)'
      : isLocked
        ? 'linear-gradient(to bottom, #ede5d4, #c9bda1)'
        : 'linear-gradient(to bottom, #fef9f0, #e8d4a8)';
  const bd = isClaimable ? '#9e7b0d' : isDone ? BFTC_T.greenB : isLocked ? '#8b7355' : '#8b7355';

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 10,
      alignItems: 'center', padding: '9px 11px',
      background: bg, border: `2px solid ${bd}`, borderRadius: 12,
      boxShadow: isClaimable
        ? 'inset 0 1px 0 rgba(255,255,255,.55), 0 3px 0 rgba(0,0,0,.16), 0 0 14px rgba(241,196,15,.4)'
        : 'inset 0 1px 0 rgba(255,255,255,.45), 0 3px 0 rgba(0,0,0,.16)',
      position: 'relative', opacity: isLocked ? 0.85 : 1,
    }}>
      {/* loop eyebrow */}
      <span style={{
        position: 'absolute', top: -7, left: 10,
        fontFamily: BFTC_T.font, fontSize: 8, fontWeight: 800, letterSpacing: '.18em',
        textTransform: 'uppercase',
        padding: '1.5px 6px', borderRadius: 999,
        background: isLocked
          ? 'linear-gradient(to bottom, #b0b8c0, #7f8c8d)'
          : 'linear-gradient(to bottom, #8b6f47, #5d4a32)',
        border: '1.5px solid #3c2619', color: '#f0e0c0',
        textShadow: '0 1px 0 rgba(0,0,0,.45)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
      }}>{q.loop}</span>

      {/* icon tile */}
      <div style={{
        width: 46, height: 46, borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(255,255,255,.4), rgba(0,0,0,.18))',
        border: '2px solid rgba(0,0,0,.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)',
        opacity: isLocked ? 0.55 : 1,
      }}>
        <img src={q.icon} alt="" style={{ width: 34, height: 34, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }}/>
      </div>

      {/* body: name + progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 13, lineHeight: 1.15,
          color: isLocked ? '#7d6a55' : BFTC_T.ink,
        }}>{q.name}</div>
        {isLocked ? (
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 11, fontStyle: 'italic',
            color: '#7d6a55',
          }}>{q.lockedHint}</div>
        ) : isClaimable ? (
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 800,
            color: BFTC_T.greenD, letterSpacing: '.06em',
          }}>✓ Tâche accomplie</div>
        ) : (
          <>
            <div style={{
              position: 'relative', height: 8, borderRadius: 4,
              background: 'rgba(0,0,0,.22)', border: '1px solid rgba(0,0,0,.25)', overflow: 'hidden',
            }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: 'linear-gradient(to bottom, #f1c40f, #d4a017)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)',
              }}/>
            </div>
            <div style={{
              fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 10.5,
              color: BFTC_T.ink, fontVariantNumeric: 'tabular-nums',
            }}>{q.have.toLocaleString('fr-FR')} / {q.need.toLocaleString('fr-FR')}</div>
          </>
        )}
      </div>

      {/* reward column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {q.reward.map((r, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 7px 2px 3px',
              background: 'rgba(0,0,0,.06)', border: '1.5px solid rgba(0,0,0,.22)',
              borderRadius: 9999,
              fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 10.5,
              color: BFTC_T.ink, fontVariantNumeric: 'tabular-nums',
              opacity: isLocked ? 0.5 : 1,
            }}>
              <img src={r.icon} alt="" style={{ width: 14, height: 14 }}/>{r.value}
            </span>
          ))}
        </div>
        {isClaimable && (
          <PixelBtn variant="success" size="xs">Réclamer</PixelBtn>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------- Featured chapter
function ChapterFeatured({ ch }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '62px 1fr', gap: 11,
      padding: '11px 12px',
      background: 'linear-gradient(135deg, #fef0c6, #e8c878)',
      border: '2.5px solid #9e7b0d', borderRadius: 14,
      color: '#3a2a00',
      boxShadow: '0 4px 0 rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.5)',
      position: 'relative',
    }}>
      <div style={{
        width: 62, height: 62, borderRadius: 12,
        background: 'radial-gradient(circle at 30% 25%, #fff5b8, #a87b25)',
        border: '2.5px solid #6e4a08',
        boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img src={C_Q('crown')} alt="" style={{ width: 44, height: 44, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.35))' }}/>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800, letterSpacing: '.22em',
            textTransform: 'uppercase', color: '#704c0a',
          }}>{ch.eyebrow}</span>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 700,
            color: '#704c0a', letterSpacing: '.06em',
          }}>{ch.expiresIn}</span>
        </div>
        <div style={{
          fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 15, lineHeight: 1.15,
          color: '#3a2a00', letterSpacing: '.01em',
        }}>{ch.title}</div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 11, lineHeight: 1.35, color: '#5a4400',
        }}>{ch.body}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: '#704c0a', marginRight: 2,
          }}>Récompense</span>
          {ch.rewards.map((r, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 8px 2px 3px',
              background: 'rgba(255,255,255,.45)', border: '1.5px solid #704c0a',
              borderRadius: 9999,
              fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 11,
              color: '#3a2a00', fontVariantNumeric: 'tabular-nums',
            }}>
              <img src={r.icon} alt="" style={{ width: 15, height: 15 }}/>{r.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================== sheet --
function DailyQuestSheet({ onClose = () => {} }) {
  const { chapter, daily, meta } = QUEST_DATA;
  return (
    <ModalShell
      eyebrow="Messagerie · Devoirs Royaux"
      title="Devoirs Royaux"
      accent={BFTC_T.goldD}
      accentLight={BFTC_T.goldL}
      onClose={onClose}
      width={336}
      maxHeight={680}
    >
      {/* Sub-header: progress meter + expiry */}
      <div style={{
        margin: '8px 14px 0',
        padding: '8px 10px',
        borderRadius: 10,
        background: 'linear-gradient(to bottom, rgba(60,38,25,.08), rgba(60,38,25,.14))',
        border: '1px solid rgba(60,38,25,.22)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800, letterSpacing: '.28em',
            textTransform: 'uppercase', color: BFTC_T.inkSoft,
          }}>Quêtes du jour</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 1 }}>
            <span style={{
              fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 18, color: BFTC_T.ink,
              fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 0 rgba(255,255,255,.5)',
            }}>{completedCount} / {daily.length}</span>
            <span style={{ fontFamily: BFTC_T.font, fontSize: 11, color: BFTC_T.inkSoft }}>accomplies</span>
          </div>
        </div>
        <div style={{
          textAlign: 'right',
          fontFamily: BFTC_T.font, fontSize: 10, color: BFTC_T.inkSoft,
        }}>
          <div style={{ fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 800 }}>Expire dans</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 1,
            fontWeight: 800, fontSize: 12.5, color: BFTC_T.ink,
            fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>
            <img src={I_Q('clock')} alt="" style={{ width: 12, height: 12 }}/>
            {meta.expiresIn}
          </div>
        </div>
      </div>

      {/* Scrollable list */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '12px 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <ChapterFeatured ch={chapter}/>

        {/* divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 2,
        }}>
          <span style={{ flex: 1, height: 1, background: 'rgba(60,38,25,.22)' }}/>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800,
            letterSpacing: '.28em', textTransform: 'uppercase', color: BFTC_T.inkSoft,
          }}>Tâches du Roi</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(60,38,25,.22)' }}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
          {daily.map(q => <QuestRow key={q.id} q={q}/>)}
        </div>

        <div style={{
          margin: '2px 0 4px',
          padding: '8px 10px',
          borderRadius: 10,
          border: '1.5px dashed rgba(60,38,25,.35)',
          background: 'rgba(255,255,255,.25)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 6,
            background: 'linear-gradient(to bottom, #8b6f47, #5d4a32)',
            border: '1.5px solid #3c2619', color: '#f0e0c0',
            fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 11,
          }}>{meta.backlog.current}/{meta.backlog.total}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 800,
              color: BFTC_T.ink, letterSpacing: '.04em',
            }}>Carte {meta.backlog.current} de {meta.backlog.total}</div>
            <div style={{
              fontFamily: BFTC_T.font, fontSize: 10, color: BFTC_T.inkSoft,
              fontStyle: 'italic',
            }}>Prochaine carte délivrée {meta.backlog.nextAt}.</div>
          </div>
        </div>
      </div>

      {/* Footer — wood strip + actions */}
      <div style={{
        padding: '10px 14px 12px',
        background: 'linear-gradient(to bottom, rgba(93,74,50,.95), rgba(60,38,25,.97))',
        borderTop: `2px solid ${BFTC_T.woodBark}`,
        display: 'flex', flexDirection: 'column', gap: 9,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 700, color: '#f0e0c0',
            letterSpacing: '.18em', textTransform: 'uppercase',
          }}>Sceau du Roi · {claimableCount > 0 ? `${claimableCount} à réclamer` : 'à jour'}</span>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, color: '#cdb88a',
            letterSpacing: '.14em',
          }}>réinit · 6h 22m</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PixelBtn variant="neutral" size="md" full onClick={onClose}>Fermer</PixelBtn>
          {claimableCount > 0
            ? <PixelBtn variant="success" size="md" full>Tout réclamer · {claimableCount}</PixelBtn>
            : <PixelBtn variant="warning" size="md" full>Voir le héraut</PixelBtn>}
        </div>
      </div>
    </ModalShell>
  );
}

// ============================================================== phones --
function VillageBg_Q({ dimmed }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#7c9756 0%,#a8b977 28%,#cdbf8e 60%,#b89968 100%)' }}>
      <img src={B_Q('castle')}     alt="" style={{ position: 'absolute', top: 200, left: 60, width: 140, opacity: .72 }} />
      <img src={B_Q('barracks')}   alt="" style={{ position: 'absolute', top: 380, left: 200, width: 110, opacity: .65 }} />
      <img src={B_Q('watchtower')} alt="" style={{ position: 'absolute', top: 440, left: 30, width: 90, opacity: .65 }} />
      <img src={B_Q('farm')}       alt="" style={{ position: 'absolute', top: 520, left: 130, width: 130, opacity: .65 }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 64,
        background: 'linear-gradient(to top, rgba(60,38,25,.95), rgba(78,56,34,.9))',
        borderTop: '2px solid #8b7355',
      }}/>
      {dimmed && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)' }}/>}
    </div>
  );
}

function PhoneShell({ children }) {
  return (
    <div style={{
      position: 'relative', width: 360, height: 720,
      borderRadius: 36, overflow: 'hidden',
      background: '#1a1a2e', border: '8px solid #0c0c1a',
      boxShadow: '0 30px 60px rgba(0,0,0,.6), inset 0 0 0 2px #2a2a45',
    }}>{children}</div>
  );
}

// Cropped HUD-only frame — used to compare placements side-by-side.
function PhoneHUDOnly({ placement = 'pendant', claimable = 1, sealVariant = 'wax', showFloating = false }) {
  // We render the full phone shell but visually focus on the top region.
  // Floating placement needs extra vertical space below the bar.
  const height = placement === 'floating' || showFloating ? 180 : 110;
  return (
    <div style={{
      position: 'relative', width: 360, height,
      borderRadius: 22, overflow: 'hidden',
      background: '#1a1a2e',
      border: '6px solid #0c0c1a',
      boxShadow: '0 16px 32px rgba(0,0,0,.4), inset 0 0 0 1.5px #2a2a45',
    }}>
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg,#7c9756 0%,#a8b977 60%,#cdbf8e 100%)' }}/>
      <HUDWithSeal placement={placement} claimable={claimable} sealVariant={sealVariant}/>
    </div>
  );
}

function PhoneQuestModal({ claimable = 2, sealVariant = 'wax', placement = 'pendant' }) {
  return (
    <PhoneShell>
      <VillageBg_Q dimmed/>
      {/* HUD with the seal "pressed" feel */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <HUDWithSeal placement={placement} claimable={claimable} sealVariant={sealVariant}/>
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 10,
      }}>
        <DailyQuestSheet/>
      </div>
    </PhoneShell>
  );
}

// Anatomy / state explorer card.
function SealStatesRow() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 22,
      padding: '24px 22px',
      background: 'linear-gradient(180deg, #fef9f0, #e8d4a8)',
      borderRadius: 16,
      border: '2px solid #c9a882',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 4px 0 rgba(0,0,0,.1)',
    }}>
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {[
          { label: 'Repos',        badge: false, halo: false, count: null },
          { label: '≥1 réclamable',badge: true,  halo: true,  count: null },
          { label: 'Avec total',   badge: true,  halo: true,  count: 2    },
          { label: 'Pressé',       badge: true,  halo: false, count: null, pressed: true },
        ].map((s) => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <RoyalSeal size={56} badge={s.badge} halo={s.halo} badgeCount={s.count} pressed={s.pressed}/>
            <span style={{
              fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 800,
              letterSpacing: '.18em', textTransform: 'uppercase', color: BFTC_T.inkSoft,
            }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: 'rgba(93,74,50,.25)' }}/>
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {[
          { label: 'Parchemin',     badge: false, halo: false, count: null },
          { label: 'Avec dot',      badge: true,  halo: false, count: null },
          { label: 'Avec total',    badge: true,  halo: true,  count: 3    },
          { label: 'Pressé',        badge: false, halo: false, count: null, pressed: true },
        ].map((s) => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <RoyalSeal variant="parchment" size={56} badge={s.badge} halo={s.halo} badgeCount={s.count} pressed={s.pressed}/>
            <span style={{
              fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 800,
              letterSpacing: '.18em', textTransform: 'uppercase', color: BFTC_T.inkSoft,
            }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inject the soft halo keyframe once.
if (typeof document !== 'undefined' && !document.getElementById('bftc-seal-anim')) {
  const s = document.createElement('style');
  s.id = 'bftc-seal-anim';
  s.textContent = `
    @keyframes sealHalo {
      0%, 100% { opacity: .55; transform: scale(1);   }
      50%      { opacity: .85; transform: scale(1.08); }
    }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  RoyalSeal, ParchmentStamp, InlineSealBtn,
  HUDWithSeal, PhoneHUDOnly,
  DailyQuestSheet, PhoneQuestModal,
  SealStatesRow,
  QUEST_DATA, QUEST_HUD_PROPS,
});
