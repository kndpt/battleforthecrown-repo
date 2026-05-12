/* global React, ModalShell, ModalOverlay, PixelBtn, CostStrip, Pill, Glyph, BFTC_T */
/* Village Style — Carrousel Modal (production-ready). 
   Browse 4 voices in a focused hero card with arrows + dots. Adopt locks
   a 24h cooldown server-side; cost scales ×1.25^(N-4) from château 4. */

const { useState, useEffect, useCallback } = React;

// ---------- Data ----------
const VILLAGE_STYLES = [
  {
    id: 'fortress',
    name: 'Forteresse',
    glyph: '🛡',
    tagline: 'Murs hauts, portes lourdes.',
    color: { l: '#5b8fbf', d: '#2e5a88', b: '#1f3e66' },
    bonuses: [
      { label: 'Défense unité', value: '+25%' },
      { label: 'Stockage', value: '+10%' },
    ],
    maluses: [
      { label: 'Vitesse de déplacement', value: '−20%' },
    ],
    cost: { wood: 200, stone: 100, iron: 50, crowns: 80 },
    flavor: 'Vos troupes formées ici tiennent les remparts comme la pierre.',
  },
  {
    id: 'raiders',
    name: 'Raiders',
    glyph: '⚔',
    tagline: 'Légers, rapides, sans pitié.',
    color: { l: 'var(--game-red-light)', d: 'var(--game-red-dark)', b: 'var(--game-red-border)' },
    bonuses: [
      { label: 'Vitesse de déplacement', value: '+15%' },
      { label: 'Pillage', value: '+10%' },
    ],
    maluses: [
      { label: 'Défense', value: '−10%' },
    ],
    cost: { wood: 50, stone: 100, iron: 200, crowns: 80 },
    flavor: 'L\'éclat du fer précède celui des couronnes.',
  },
  {
    id: 'economic',
    name: 'Économique',
    glyph: '⚙',
    tagline: 'Plus de bras, plus de récolte.',
    color: { l: 'var(--game-green-light)', d: 'var(--game-green-dark)', b: 'var(--game-green-border)' },
    bonuses: [
      { label: 'Production', value: '+20%' },
      { label: 'Population max', value: '+10%' },
    ],
    maluses: [
      { label: 'Attaque', value: '−10%' },
      { label: 'Défense', value: '−10%' },
    ],
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
    cost: { wood: 100, stone: 100, iron: 100, crowns: 80 },
    flavor: 'Le village garde ses portes ouvertes et son fer en réserve.',
  },
];

function scaleCost(cost, level) {
  const m = Math.pow(1.25, Math.max(0, level - 4));
  return {
    wood: Math.round(cost.wood * m),
    stone: Math.round(cost.stone * m),
    iron: Math.round(cost.iron * m),
    crowns: Math.round(cost.crowns * m),
  };
}

// ---------- Carousel arrows ----------
function CarouselArrow({ dir = 'left', onClick, disabled }) {
  const isLeft = dir === 'left';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={isLeft ? 'Voie précédente' : 'Voie suivante'}
      style={{
        position: 'absolute',
        [isLeft ? 'left' : 'right']: -2,
        top: '50%', transform: 'translateY(-50%)',
        width: 32, height: 44, borderRadius: 10,
        background: 'linear-gradient(to bottom, #a67c52, #5d4a32)',
        border: '2px solid #3c2619',
        color: '#fff', fontFamily: 'var(--bftc-font-display)', fontWeight: 900, fontSize: 18,
        textShadow: '1px 1px 1px rgba(0,0,0,.5)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.25)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? .4 : 1,
        zIndex: 2,
      }}
    >
      {isLeft ? '‹' : '›'}
    </button>
  );
}

// ---------- Carousel dots ----------
function CarouselDots({ count, active, onChange, styles }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 0 4px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange?.(i)}
          aria-label={`Voie ${i + 1}`}
          style={{
            width: i === active ? 22 : 8, height: 8, borderRadius: 99,
            border: '1.5px solid rgba(93,74,50,.55)',
            background: i === active && styles
              ? `linear-gradient(to bottom, ${styles[i].color.l}, ${styles[i].color.d})`
              : 'rgba(93,74,50,.25)',
            cursor: 'pointer', padding: 0,
            transition: 'width .18s, background .18s',
          }}
        />
      ))}
    </div>
  );
}

// ---------- Hero card for the focused style ----------
function StyleHeroCard({ style, index, total, isCurrent }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 14, overflow: 'hidden',
      background: `linear-gradient(160deg, ${style.color.l} 0%, ${style.color.d} 100%)`,
      border: `3px solid ${style.color.b}`,
      padding: '14px 14px 12px',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 6px 14px rgba(0,0,0,.35)',
      minHeight: 220,
    }}>
      {/* faint glyph backdrop */}
      <div aria-hidden="true" style={{
        position: 'absolute', right: -18, top: -18,
        fontFamily: 'var(--bftc-font-display)', fontSize: 200, lineHeight: 1, fontWeight: 900,
        color: 'rgba(255,255,255,.10)', pointerEvents: 'none', userSelect: 'none',
      }}>{style.glyph}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: 'rgba(0,0,0,.28)',
          border: '2px solid rgba(255,255,255,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)',
          flexShrink: 0,
        }}>
          <Glyph char={style.glyph} size={26} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--bftc-font-display)', fontSize: 9.5, fontWeight: 700,
            color: 'rgba(255,255,255,.7)', letterSpacing: '.22em', textTransform: 'uppercase',
          }}>Voie {index + 1} / {total}</div>
          <div style={{
            fontFamily: 'var(--bftc-font-display)', fontSize: 20, fontWeight: 900,
            color: '#fff', letterSpacing: '.03em',
            textShadow: '1px 1px 2px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.15)',
            lineHeight: 1.1,
          }}>{style.name}</div>
        </div>
        {isCurrent && <Pill tone="gold">ACTUEL</Pill>}
      </div>

      <div style={{
        fontFamily: 'var(--bftc-font-display)', fontSize: 11.5, fontStyle: 'italic',
        color: 'rgba(255,255,255,.92)', margin: '8px 0 10px',
        textShadow: '1px 1px 2px rgba(0,0,0,.5)',
      }}>« {style.tagline} »</div>

      <div style={{
        background: 'rgba(0,0,0,.22)',
        border: '1.5px solid rgba(255,255,255,.18)',
        borderRadius: 10, padding: '8px 10px',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        {style.bonuses.length === 0 && style.maluses.length === 0 ? (
          <div style={{
            fontFamily: 'var(--bftc-font-display)', fontSize: 11.5, fontWeight: 700,
            color: '#fff', textAlign: 'center', padding: '6px 0', letterSpacing: '.06em',
            textShadow: '1px 1px 1px rgba(0,0,0,.4)',
          }}>Neutre — aucun bonus, aucun malus</div>
        ) : (
          <>
            {style.bonuses.map(b => (
              <HeroStatLine key={b.label} kind="bonus" label={b.label} value={b.value} />
            ))}
            {style.maluses.map(b => (
              <HeroStatLine key={b.label} kind="malus" label={b.label} value={b.value} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Hero-card variant of the bonus/malus row (different styling: tag pill + value on right)
function HeroStatLine({ kind, label, value }) {
  const isPos = kind === 'bonus';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--bftc-font-display)' }}>
      <span style={{
        fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
        color: isPos ? '#d6f5b8' : '#ffd1cc',
        textShadow: '1px 1px 1px rgba(0,0,0,.5)',
        width: 42, flexShrink: 0,
      }}>{isPos ? 'BONUS' : 'MALUS'}</span>
      <span style={{
        flex: 1, fontSize: 11.5, fontWeight: 700, color: '#fff',
        textShadow: '1px 1px 1px rgba(0,0,0,.4)',
      }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 900,
        color: isPos ? '#d6f5b8' : '#ffd1cc',
        textShadow: '1px 1px 2px rgba(0,0,0,.5)',
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  );
}

// ---------- Main component ----------
function VillageStyleModal({
  open = true,
  onClose,
  onAdopt,
  currentStyleId = 'balanced',
  initialStyleId,
  castleLevel = 5,
  stock = { wood: 1820, stone: 940, iron: 1240, crowns: 142 },
  cooldownHours = 24,
  styles = VILLAGE_STYLES,
}) {
  const startIdx = Math.max(0, styles.findIndex(s => s.id === (initialStyleId || currentStyleId)));
  const [idx, setIdx] = useState(startIdx === -1 ? 0 : startIdx);
  const total = styles.length;
  const style = styles[idx];
  const cost = scaleCost(style.cost, castleLevel);
  const affordable =
    stock.wood   >= cost.wood   &&
    stock.stone  >= cost.stone  &&
    stock.iron   >= cost.iron   &&
    stock.crowns >= cost.crowns;
  const isCurrent = style.id === currentStyleId;

  // arrow keys
  const handleKey = useCallback((e) => {
    if (!open) return;
    if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + total) % total);
    if (e.key === 'ArrowRight') setIdx(i => (i + 1) % total);
    if (e.key === 'Escape' && onClose) onClose();
  }, [open, total, onClose]);
  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, handleKey]);

  // Reset idx when re-opening
  useEffect(() => {
    if (open) setIdx(startIdx === -1 ? 0 : startIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalShell
        eyebrow="Salle du Conseil"
        title="Choisir une voie"
        accent={style.color.d}
        accentLight={style.color.l}
        onClose={onClose}
        width={320}
      >
        <div style={{ position: 'relative', padding: '12px 14px 0' }}>
          <StyleHeroCard style={style} index={idx} total={total} isCurrent={isCurrent} />
          <CarouselArrow dir="left"  onClick={() => setIdx(i => (i - 1 + total) % total)} />
          <CarouselArrow dir="right" onClick={() => setIdx(i => (i + 1) % total)} />
        </div>

        <CarouselDots count={total} active={idx} onChange={setIdx} styles={styles} />

        <div style={{ padding: '4px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CostStrip
            cost={cost}
            stock={stock}
            label={`Coût · Château ${castleLevel}`}
            multiplier={`×${Math.pow(1.25, castleLevel - 4).toFixed(2)}`}
            dense
          />
          <PixelBtn
            variant="success"
            size="md"
            full
            disabled={!affordable || isCurrent}
            onClick={() => onAdopt?.(style.id)}
          >
            {isCurrent ? `Voie actuelle` : `Adopter — ${style.name}`}
          </PixelBtn>
          <div style={{
            fontFamily: 'var(--bftc-font-display)', fontSize: 9.5,
            color: !affordable && !isCurrent ? 'var(--game-red-dark)' : '#cdb88a',
            textAlign: 'center', fontWeight: !affordable && !isCurrent ? 700 : 400,
          }}>
            {isCurrent
              ? 'Cette voie est déjà la vôtre.'
              : !affordable
                ? 'Ressources insuffisantes'
                : `Verrouillé ${cooldownHours} h · invisible des voisins`}
          </div>
        </div>
      </ModalShell>
    </ModalOverlay>
  );
}

// ---------- Trigger button — opens the modal from the village UI ----------
// Looks like a Salle du Conseil action button. Use anywhere in the village
// header / building menu.
function VillageStyleTrigger({ currentStyleId = 'balanced', onClick, styles = VILLAGE_STYLES }) {
  const cur = styles.find(s => s.id === currentStyleId) || styles[3];
  return (
    <button onClick={onClick} className="bftc-pixel-btn" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '7px 12px 7px 7px', borderRadius: 12,
      background: `linear-gradient(to bottom, ${cur.color.l}, ${cur.color.d})`,
      border: `2px solid ${cur.color.b}`,
      boxShadow: '0 3px 0 rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.28)',
      cursor: 'pointer',
      fontFamily: 'var(--bftc-font-display)',
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: 7,
        background: 'rgba(0,0,0,.28)',
        border: '1.5px solid rgba(255,255,255,.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
      }}>
        <Glyph char={cur.glyph} size={16} color="#fff" />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        <span style={{
          fontSize: 8.5, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,.8)', textShadow: '1px 1px 1px rgba(0,0,0,.4)',
        }}>Voie du village</span>
        <span style={{
          fontSize: 13, fontWeight: 800, color: '#fff',
          textShadow: '1px 1px 2px rgba(0,0,0,.6)',
        }}>{cur.name}</span>
      </span>
    </button>
  );
}

Object.assign(window, {
  VillageStyleModal,
  VillageStyleTrigger,
  VILLAGE_STYLES,
  scaleCost,
});
