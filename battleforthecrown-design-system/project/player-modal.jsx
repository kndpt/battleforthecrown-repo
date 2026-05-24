/* global React, BFTC_T */
/* Player modal — 3 variantes côte à côte au-dessus de la Vallée verte.
   Variante A : feuille basse compacte (onglets, ton sobre)
   Variante B : parchemin plein-écran (hero + sections, ton seigneurial)
   Variante C : carte centrée (accordéon, ton hybride) */

const { useState } = React;

// --- BottomNav stub (village-views.jsx referenced one that did not exist
//     in the design system; we recreate a minimal four-tab wood nav so the
//     village scene renders behind the modal). --------------------------------

window.BottomNav = function BottomNav({ active = "build" }) {
  const tabs = [
    { id: "build",   label: "Village",  glyph: "🏰" },
    { id: "army",    label: "Armée",    glyph: "⚔" },
    { id: "world",   label: "Monde",    glyph: "🌍" },
    { id: "inbox",   label: "Courrier", glyph: "✉" },
  ];
  return (
    <div style={{
      display: "flex", width: "100%",
      background: "linear-gradient(to bottom, rgba(78,56,34,.92), rgba(60,38,25,.95))",
      borderTop: "2px solid #3d2f1f",
      boxShadow: "0 -6px 18px rgba(0,0,0,.45)",
      backdropFilter: "blur(6px)",
      padding: "6px 0 8px",
      position: "relative", zIndex: 5,
    }}>
      {tabs.map(t => {
        const a = t.id === active;
        return (
          <button key={t.id} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            background: "transparent", border: "none", cursor: "pointer", padding: "4px 0",
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, lineHeight: 1,
              background: a
                ? "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))"
                : "linear-gradient(to bottom, #8b6f47, #5d4a32)",
              border: `2px solid ${a ? "var(--game-gold-border)" : "#3d2f1f"}`,
              color: "#fff", textShadow: "1px 1px 1px rgba(0,0,0,.5)",
              boxShadow: a
                ? "0 0 16px rgba(250,224,120,.5), inset 0 1px 0 rgba(255,255,255,.4)"
                : "inset 0 1px 0 rgba(255,255,255,.25)",
              transform: a ? "scale(1.05)" : "scale(1)",
              transition: "transform .15s",
            }}>{t.glyph}</span>
            <span style={{
              fontFamily: "var(--bftc-font-display)", fontSize: 9, fontWeight: 700,
              letterSpacing: ".1em", textTransform: "uppercase",
              color: a ? "#f6e4b8" : "#cdb88a",
              textShadow: "1px 1px 1px rgba(0,0,0,.5)",
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const ASSET = "assets";
const R = (n) => `${ASSET}/resources/${n}.png`;
const I = (n) => `${ASSET}/icons/${n}.png`;
const C = (n) => `${ASSET}/casual-icons/${n}.png`;
const B = (n) => `${ASSET}/buildings/${n}.png`;

// --- Données joueur partagées ------------------------------------------------

const PLAYER = {
  name: "Sire Kelvin",
  level: 12,
  initials: "SK",
  tribu: { tag: "BFC", name: "Les Lames du Nord", role: "Duc", members: 14, cap: 30 },
  stats: {
    power: "4 250",
    crowns: "28 410",
    points: "62.480",
    rank: 47,
    rankTotal: 312,
    villages: 3,
    raidsWon: 28,
    defenses: 11,
  },
  villages: [
    { id: "v1", name: "Kelvinor",      role: "Capitale",  power: "2 480", level: 5, coords: "(7,12)",  capitale: true },
    { id: "v2", name: "Vald'Or",       role: "Économique", power: "980",   level: 3, coords: "(11,4)" },
    { id: "v3", name: "Pierre-Noire",  role: "Offensif",   role2: "Défensif", power: "790",   level: 3, coords: "(2,18)" },
  ],
  world: { name: "Avalon-3", day: 18, total: 60 },
};

// --- Helpers visuels ---------------------------------------------------------

const ROLE_COLOR = {
  "Capitale":    { l: "var(--game-gold-light)",  d: "var(--game-gold-dark)",  b: "var(--game-gold-border)",  ink: "#3a2a00" },
  "Offensif":    { l: "var(--game-red-light)",   d: "var(--game-red-dark)",   b: "var(--game-red-border)",   ink: "#fff" },
  "Défensif":    { l: "var(--game-blue-light)",  d: "var(--game-blue-dark)",  b: "var(--game-blue-border)",  ink: "#fff" },
  "Économique":  { l: "var(--game-green-light)", d: "var(--game-green-dark)", b: "var(--game-green-border)", ink: "#fff" },
};

function RoleTag({ role, size = "md" }) {
  const c = ROLE_COLOR[role] || ROLE_COLOR["Économique"];
  const s = size === "sm"
    ? { fs: 8.5, pad: "1px 6px" }
    : { fs: 9.5, pad: "2px 8px" };
  return (
    <span style={{
      fontFamily: BFTC_T.font, fontSize: s.fs, fontWeight: 800, letterSpacing: ".14em",
      padding: s.pad, borderRadius: 999, textTransform: "uppercase",
      background: `linear-gradient(to bottom, ${c.l}, ${c.d})`,
      border: `1.5px solid ${c.b}`, color: c.ink,
      textShadow: c.ink === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)",
      whiteSpace: "nowrap",
    }}>{role}</span>
  );
}

// Big medallion avatar — couronne flottante + halo doré
function Medallion({ size = 78, initials = "SK", level = 12, online = true, crown = true }) {
  const r = size;
  const halo = r * 0.18;
  return (
    <div style={{
      width: r, height: r, position: "relative", flexShrink: 0,
    }}>
      <div style={{
        width: r, height: r, borderRadius: "50%",
        background: `
          radial-gradient(circle at 32% 28%, #fef0c6, #c89a4c 60%, #6f4a1d),
          linear-gradient(to bottom, #f6d57b, #a37a2b)`,
        border: "3px solid #3d2f1f",
        boxShadow: `
          inset 0 2px 0 rgba(255,255,255,.5),
          inset 0 -8px 12px rgba(0,0,0,.25),
          0 4px 8px rgba(0,0,0,.4),
          0 0 ${halo}px rgba(246,213,123,.65)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: r * 0.34,
          color: "#fef9f0", textShadow: "1px 1px 2px rgba(0,0,0,.55), 0 0 6px rgba(0,0,0,.35)",
          letterSpacing: ".05em",
        }}>{initials}</span>
      </div>
      {crown && (
        <img src={C("crown")} alt="" style={{
          position: "absolute", top: -r * 0.18, left: "50%",
          width: r * 0.45, transform: "translateX(-50%) rotate(-6deg)",
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,.5))",
        }}/>
      )}
      {/* level badge bottom-right */}
      <div style={{
        position: "absolute", bottom: -2, right: -4,
        background: "linear-gradient(to bottom,#f6d57b,#c59e3f)",
        border: "2.5px solid #5d4a32", borderRadius: 999,
        minWidth: r * 0.34, height: r * 0.34, padding: "0 5px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: BFTC_T.font, fontWeight: 800, fontSize: r * 0.18, color: "#3a2a00",
        textShadow: "0 1px 0 rgba(255,255,255,.4)",
        boxShadow: "0 2px 0 rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.4)",
      }}>{level}</div>
      {online && (
        <span style={{
          position: "absolute", bottom: r * 0.05, left: r * 0.04,
          width: 12, height: 12, borderRadius: "50%",
          background: "linear-gradient(to bottom,#7cc55c,#3e7a26)",
          border: "2.5px solid #fef9f0",
          boxShadow: "0 0 6px rgba(124,197,92,.7)",
        }}/>
      )}
    </div>
  );
}

// Compact stat block — icône en haut, valeur en gros, label en bas
function StatTile({ icon, value, label, tone = "parchment", style }) {
  const dark = tone === "dark";
  return (
    <div style={{
      flex: 1, padding: "8px 6px", textAlign: "center",
      background: dark
        ? "linear-gradient(to bottom, rgba(60,38,25,.92), rgba(40,24,14,.92))"
        : "linear-gradient(to bottom, rgba(255,255,255,.45), rgba(213,182,128,.45))",
      border: `2px solid ${dark ? "#1f1308" : "#a67c52"}`,
      borderRadius: 10,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.18)",
      ...style,
    }}>
      {icon && <img src={icon} alt="" style={{ width: 22, height: 22, filter: "drop-shadow(0 1px 1px rgba(0,0,0,.4))" }}/>}
      <div style={{
        fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 14,
        color: dark ? "#fff" : BFTC_T.ink,
        textShadow: dark ? "1px 1px 1px rgba(0,0,0,.5)" : "0 1px 0 rgba(255,255,255,.45)",
        fontVariantNumeric: "tabular-nums", lineHeight: 1.1, marginTop: 2,
      }}>{value}</div>
      <div style={{
        fontFamily: BFTC_T.font, fontSize: 8.5, fontWeight: 700, letterSpacing: ".18em",
        color: dark ? "#cdb88a" : BFTC_T.inkSoft, textTransform: "uppercase",
        marginTop: 2,
      }}>{label}</div>
    </div>
  );
}

// Petit séparateur ornemental (parchemin)
function Ornament({ width = 80, color = "#8b6f47" }) {
  return (
    <svg width={width} height={10} viewBox="0 0 80 10" style={{ display: "block" }}>
      <line x1="0" y1="5" x2="30" y2="5" stroke={color} strokeWidth="1.2"/>
      <line x1="50" y1="5" x2="80" y2="5" stroke={color} strokeWidth="1.2"/>
      <path d="M33 5 L40 1 L47 5 L40 9 Z" fill={color}/>
    </svg>
  );
}

// =============================================================================
// VARIANTE A — Feuille basse compacte (sober tone, tabs)
// =============================================================================

function ModalA({ onClose }) {
  const [tab, setTab] = useState("profil");
  const tabs = [
    { id: "profil",   label: "Profil" },
    { id: "villages", label: "Villages" },
    { id: "reglages", label: "Réglages" },
  ];
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0,
      maxHeight: "78%",
      background: `linear-gradient(to bottom, ${BFTC_T.parch1}, ${BFTC_T.parch3})`,
      borderTop: `4px solid ${BFTC_T.woodBark}`,
      borderRadius: "20px 20px 0 0",
      boxShadow: "0 -10px 30px rgba(0,0,0,.5), inset 0 2px 0 rgba(255,255,255,.55)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: "sheetUp .25s cubic-bezier(.2,.7,.3,1.2)",
    }}>
      {/* drag handle + gold strip */}
      <div style={{ height: 6, background: "linear-gradient(to right, var(--game-gold-light), var(--game-gold-dark))" }}/>
      <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 0" }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: "rgba(93,74,50,.35)" }}/>
      </div>

      {/* Header row : avatar + nom + close */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px 8px" }}>
        <Medallion size={54} initials={PLAYER.initials} level={PLAYER.level}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 15, color: BFTC_T.ink,
            letterSpacing: ".02em", textShadow: "0 1px 0 rgba(255,255,255,.4)",
          }}>{PLAYER.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <span style={{
              fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800,
              padding: "1px 6px", borderRadius: 999,
              background: "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))",
              border: "1.5px solid var(--game-gold-border)", color: "#3a2a00",
              letterSpacing: ".1em",
            }}>{PLAYER.tribu.tag}</span>
            <span style={{ fontFamily: BFTC_T.font, fontSize: 11, color: BFTC_T.inkSoft }}>
              {PLAYER.tribu.name} · <b style={{ color: BFTC_T.ink }}>{PLAYER.tribu.role}</b>
            </span>
          </div>
        </div>
        <button onClick={onClose} aria-label="Fermer" style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(to bottom, #b6a78a, #8b7355)",
          border: "2px solid #5d4a32", color: "#fff",
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 14, lineHeight: 1,
          textShadow: "1px 1px 1px rgba(0,0,0,.5)", cursor: "pointer",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.2)",
        }}>×</button>
      </div>

      {/* Tabs segmented */}
      <div style={{
        margin: "0 14px", padding: 3, borderRadius: 10,
        background: "linear-gradient(to bottom, rgba(60,38,25,.92), rgba(78,56,34,.92))",
        border: `2px solid ${BFTC_T.woodBark}`,
        display: "flex", gap: 2,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "7px 0", border: "none", cursor: "pointer", borderRadius: 7,
            fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 800, letterSpacing: ".1em",
            textTransform: "uppercase",
            background: tab === t.id
              ? "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))"
              : "transparent",
            color: tab === t.id ? "#3a2a00" : "#e6cf95",
            textShadow: tab === t.id ? "0 1px 0 rgba(255,255,255,.35)" : "1px 1px 1px rgba(0,0,0,.4)",
            boxShadow: tab === t.id
              ? "inset 0 1px 0 rgba(255,255,255,.4), 0 1px 0 rgba(0,0,0,.25)"
              : "none",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 14px" }}>
        {tab === "profil"   && <PaneAProfil/>}
        {tab === "villages" && <PaneAVillages/>}
        {tab === "reglages" && <PaneAReglages/>}
      </div>
    </div>
  );
}

function PaneAProfil() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* monde — remonté en tête comme contexte global du seigneur */}
      <div style={{
        padding: "8px 11px",
        background: "linear-gradient(to bottom, rgba(60,38,25,.94), rgba(78,56,34,.94))",
        border: `2px solid ${BFTC_T.woodBark}`, borderRadius: 10,
        display: "flex", alignItems: "center", gap: 9,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.18), 0 2px 0 rgba(0,0,0,.18)",
      }}>
        <img src={I("position")} alt="" style={{ width: 16, height: 16, filter: "brightness(1.9) drop-shadow(0 1px 1px rgba(0,0,0,.5))" }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 8.5, fontWeight: 700, letterSpacing: ".3em",
            color: "#cdb88a", textTransform: "uppercase", lineHeight: 1,
          }}>Monde</div>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 13, fontWeight: 800, color: "#fef9f0",
            textShadow: "1px 1px 1px rgba(0,0,0,.5)", letterSpacing: ".03em", marginTop: 2,
          }}>{PLAYER.world.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 12, fontWeight: 800, color: "#fef9f0",
            fontVariantNumeric: "tabular-nums", textShadow: "1px 1px 1px rgba(0,0,0,.5)",
          }}>J+{PLAYER.world.day}<span style={{ opacity: .55, fontWeight: 700 }}> / {PLAYER.world.total}</span></div>
          <div style={{ fontFamily: BFTC_T.font, fontSize: 9, color: "#cdb88a", marginTop: 1 }}>Phase verrouillée</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <StatTile icon={I("army-power")}   value={PLAYER.stats.power}  label="Puissance"/>
        <StatTile icon={C("crown")}        value={PLAYER.stats.crowns} label="Couronnes"/>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <StatTile value={PLAYER.stats.points} label="Points"/>
        <StatTile value={`#${PLAYER.stats.rank}`} label={`/ ${PLAYER.stats.rankTotal}`}/>
      </div>

      {/* historique */}
      <div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 700, letterSpacing: ".3em",
          color: BFTC_T.inkSoft, textTransform: "uppercase", marginBottom: 6,
        }}>Historique</div>
        <div style={{ display: "flex", gap: 6 }}>
          <MiniStat icon={I("hand-red")}    value={PLAYER.stats.raidsWon} label="Raids"/>
          <MiniStat icon={I("hand-silver")} value={PLAYER.stats.defenses} label="Défenses"/>
          <MiniStat icon={B("castle")}      value={PLAYER.stats.villages} label="Villages"/>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, value, label }) {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", gap: 6,
      background: "linear-gradient(to bottom, #fef9f0, #e8d4a8)",
      border: "1.5px solid #a67c52", borderRadius: 9, padding: "6px 8px",
    }}>
      <img src={icon} alt="" style={{ width: 18, height: 18 }}/>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 13, color: BFTC_T.ink,
          fontVariantNumeric: "tabular-nums",
        }}>{value}</div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 8.5, fontWeight: 700, letterSpacing: ".14em",
          color: BFTC_T.inkSoft, textTransform: "uppercase",
        }}>{label}</div>
      </div>
    </div>
  );
}

// Map raw power string ("2 480", "980") to a 1-5 tier.
// Aligned with the brief in 06-barbarians.md: T1 = campement, T5 = garnison.
function tierFromPower(powerStr) {
  const n = parseInt(String(powerStr).replace(/\D/g, ""), 10) || 0;
  if (n >= 2500) return 5;
  if (n >= 1500) return 4;
  if (n >= 800)  return 3;
  if (n >= 300)  return 2;
  return 1;
}

// Inline SVG village sprite — 5 progressive tiers (placeholder until
// dedicated village-tier*.png assets land). Built on a shared isometric
// base; accents added per tier per the brief in 06-barbarians.md.
// Palette escalates from gray-brown (T1) to red-gold (T5).
function VillageTierSprite({ tier = 1, size = 40, capital = false }) {
  // Tier-driven palettes
  const palettes = {
    1: { wall: "#8a7a5e", wallD: "#5e4f37", roof: "#8b5e3c", roofD: "#5e3e22", accent: "#6e5a3a" },
    2: { wall: "#9d8a64", wallD: "#6b5836", roof: "#a7613a", roofD: "#6e3a18", accent: "#8a6f3a" },
    3: { wall: "#b7a072", wallD: "#76603a", roof: "#c47238", roofD: "#80401a", accent: "#b8924a" },
    4: { wall: "#c8b07c", wallD: "#82693e", roof: "#d4773a", roofD: "#8a3e1a", accent: "#d6ac4e" },
    5: { wall: "#d8c089", wallD: "#8a7244", roof: "#c93a2e", roofD: "#7a1812", accent: "#f6d57b" },
  };
  const p = palettes[tier] || palettes[1];
  // Capital override: wash everything in gold tones
  const gold = capital ? { wall: "#e8cf8a", wallD: "#8c6f2c", roof: p.roof, roofD: p.roofD, accent: "#f6d57b" } : null;
  const c = gold || p;

  return (
    <svg viewBox="0 0 60 48" width={size} height={size} style={{
      display: "block", filter: "drop-shadow(0 2px 2px rgba(0,0,0,.35))",
    }} aria-hidden="true">
      {/* iso ground tile */}
      <polygon points="30,4 56,18 30,44 4,18" fill={"rgba(0,0,0,.18)"} opacity=".4"/>
      <polygon points="30,6 54,18 30,42 6,18" fill={c.accent} opacity=".55"/>

      {/* T1: une tente + une hutte */}
      {tier >= 1 && (
        <g>
          {/* tent */}
          <polygon points="14,28 22,18 30,28" fill={c.roof} stroke={c.roofD} strokeWidth=".8"/>
          <polygon points="22,18 30,28 22,32" fill={c.roofD} opacity=".6"/>
        </g>
      )}

      {/* T2: ajoute une hutte centrale */}
      {tier >= 2 && (
        <g>
          <rect x="28" y="22" width="14" height="10" fill={c.wall} stroke={c.wallD} strokeWidth=".8"/>
          <polygon points="27,22 35,14 43,22" fill={c.roof} stroke={c.roofD} strokeWidth=".8"/>
          <rect x="33" y="26" width="3" height="6" fill={c.wallD}/>
        </g>
      )}

      {/* T3: tour de bois */}
      {tier >= 3 && (
        <g>
          <rect x="40" y="16" width="8" height="18" fill={c.wall} stroke={c.wallD} strokeWidth=".8"/>
          <rect x="40" y="14" width="8" height="3" fill={c.wallD}/>
          <polygon points="39,14 48,8 49,14" fill={c.roof} stroke={c.roofD} strokeWidth=".8"/>
        </g>
      )}

      {/* T4: palissade autour */}
      {tier >= 4 && (
        <g stroke={c.wallD} strokeWidth=".7">
          {[12, 16, 20, 24].map((x, i) => (
            <polygon key={i} points={`${x},34 ${x + 2},32 ${x + 4},34 ${x + 4},38 ${x},38`}
                     fill={c.wallD}/>
          ))}
        </g>
      )}

      {/* T5: remparts + bannière + accents dorés */}
      {tier >= 5 && (
        <g>
          {/* rempart gauche + créneaux */}
          <rect x="8" y="24" width="22" height="4" fill={c.wall} stroke={c.wallD} strokeWidth=".8"/>
          {[8, 13, 18, 23].map((x, i) => (
            <rect key={i} x={x} y={20} width={3} height={5} fill={c.wall} stroke={c.wallD} strokeWidth=".6"/>
          ))}
          {/* bannière */}
          <rect x="35.5" y="4" width=".8" height="10" fill="#3d2f1f"/>
          <polygon points="36,5 42,5 42,11 39,9 36,11" fill="#c93a2e" stroke="#7a1812" strokeWidth=".5"/>
          {/* accent doré au sommet de la tour */}
          <circle cx="44" cy="7" r="1.3" fill="#f6d57b" stroke="#9e7b0d" strokeWidth=".4"/>
        </g>
      )}
    </svg>
  );
}

function PaneAVillages() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {PLAYER.villages.map((v) => {
        const tier = tierFromPower(v.power);
        return (
          <button key={v.id} style={{
            textAlign: "left", padding: "8px 10px", cursor: "pointer",
            background: v.capitale
              ? "linear-gradient(to right, #fff3d6 0%, #fef9f0 40%, #e8d4a8 100%)"
              : "linear-gradient(to right, #fef9f0, #e8d4a8)",
            border: v.capitale ? "2px solid var(--game-gold-border)" : "2px solid #a67c52",
            borderRadius: 11, display: "flex", alignItems: "center", gap: 10,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.5), 0 2px 0 rgba(0,0,0,.12)",
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 8, flexShrink: 0,
              background: v.capitale
                ? "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))"
                : "linear-gradient(to bottom, #d9c896, #a67c52)",
              border: v.capitale ? "2px solid var(--game-gold-border)" : "2px solid #5d4a32",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
              boxShadow: v.capitale
                ? "inset 0 1px 0 rgba(255,255,255,.45), 0 0 8px rgba(246,213,123,.5)"
                : "inset 0 1px 0 rgba(255,255,255,.4)",
            }}>
              <VillageTierSprite tier={tier} size={40} capital={v.capitale}/>
              {v.capitale && (
                <img src={C("crown")} alt="" style={{
                  position: "absolute", top: -7, left: "50%",
                  transform: "translateX(-50%) rotate(-6deg)",
                  width: 16, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))",
                  pointerEvents: "none",
                }}/>
              )}
              {/* badge tier en bas à droite */}
              <span style={{
                position: "absolute", bottom: -4, right: -4,
                fontFamily: BFTC_T.font, fontSize: 8.5, fontWeight: 800,
                background: "linear-gradient(to bottom, #fef9f0, #d9c896)",
                color: "#3d2f1f", border: "1.5px solid #5d4a32",
                borderRadius: 999, padding: "0 4px", lineHeight: 1.3,
                letterSpacing: ".06em",
                boxShadow: "0 1px 0 rgba(0,0,0,.25)",
              }}>T{tier}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{
                  fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 13, color: BFTC_T.ink,
                }}>{v.name}</span>
                <RoleTag role={v.role} size="sm"/>
                {v.role2 && <RoleTag role={v.role2} size="sm"/>}
              </div>
              <div style={{
                fontFamily: BFTC_T.font, fontSize: 10, color: BFTC_T.inkSoft,
                display: "flex", gap: 8, marginTop: 2,
              }}>
                <span>Château <b style={{ color: BFTC_T.ink }}>Niv. {v.level}</b></span>
                <span>·</span>
                <span><img src={I("army-power")} alt="" style={{ width: 10, verticalAlign: "-2px" }}/> <b style={{ color: BFTC_T.ink }}>{v.power}</b></span>
                <span>·</span>
                <span>{v.coords}</span>
              </div>
            </div>
            <span style={{ fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 18, color: BFTC_T.inkSoft }}>›</span>
          </button>
        );
      })}
    </div>
  );
}

function PaneAReglages() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <SettingRow icon="🔔" label="Notifications"      value="Activées"/>
      <SettingRow icon="🔊" label="Son et musique"     value="Activés"/>
      <SettingRow icon="🌐" label="Langue"             value="Français"/>
      <SettingRow icon="❓" label="Aide et support"/>
      <SettingRow icon="📋" label="Conditions"/>
      <div style={{ height: 8 }}/>
      <button style={{
        padding: "9px 14px", border: "2px solid var(--game-red-border)",
        background: "linear-gradient(to bottom, var(--game-red-light), var(--game-red-dark))",
        color: "#fff", fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 12,
        letterSpacing: ".1em", textTransform: "uppercase",
        textShadow: "1px 1px 1px rgba(0,0,0,.5)",
        borderRadius: 10, cursor: "pointer",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 3px 0 rgba(0,0,0,.2)",
      }}>Quitter la session</button>
    </div>
  );
}

function SettingRow({ icon, label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "9px 4px",
      borderBottom: "1px solid rgba(93,74,50,.18)",
    }}>
      <span style={{ width: 22, textAlign: "center", fontSize: 14, filter: "grayscale(.2)" }}>{icon}</span>
      <span style={{ flex: 1, fontFamily: BFTC_T.font, fontSize: 12, fontWeight: 700, color: BFTC_T.ink }}>{label}</span>
      {value && <span style={{ fontFamily: BFTC_T.font, fontSize: 11, color: BFTC_T.inkSoft }}>{value}</span>}
      <span style={{ fontFamily: BFTC_T.font, fontSize: 14, color: BFTC_T.inkSoft }}>›</span>
    </div>
  );
}

// =============================================================================
// VARIANTE B — Plein-écran parchemin (seigneurial, sections, scroll)
// =============================================================================

function ModalB({ onClose }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(to bottom, ${BFTC_T.parch1}, ${BFTC_T.parch3})`,
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: "fadeIn .2s ease-out",
    }}>
      {/* Top bar bois */}
      <div style={{
        background: "linear-gradient(to bottom,rgba(60,38,25,.96),rgba(78,56,34,.96))",
        borderBottom: `2px solid ${BFTC_T.woodBark}`,
        padding: "10px 12px",
        display: "flex", alignItems: "center", gap: 8,
        boxShadow: "0 2px 4px rgba(0,0,0,.25)",
        position: "relative", zIndex: 2,
      }}>
        <button onClick={onClose} aria-label="Fermer" style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(to bottom, #b6a78a, #8b7355)",
          border: "2px solid #5d4a32", color: "#fff",
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 16, cursor: "pointer",
        }}>‹</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, letterSpacing: ".3em",
            color: "#cdb88a", textTransform: "uppercase",
          }}>Fiche du Seigneur</div>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 14, fontWeight: 800, color: "#fef9f0",
            textShadow: "1px 1px 2px rgba(0,0,0,.6)", letterSpacing: ".04em",
          }}>Mon Royaume</div>
        </div>
        <div style={{ width: 30 }}/>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* HERO */}
        <div style={{
          padding: "24px 16px 14px",
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(246,213,123,.35) 0%, rgba(246,213,123,0) 70%),
            linear-gradient(to bottom, #fef3d6, transparent)`,
          textAlign: "center",
          borderBottom: "1px solid rgba(93,74,50,.25)",
          position: "relative",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <Medallion size={92} initials={PLAYER.initials} level={PLAYER.level}/>
          </div>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 700, letterSpacing: ".4em",
            color: BFTC_T.inkSoft, textTransform: "uppercase",
          }}>Noble Seigneur · Niveau {PLAYER.level}</div>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 26, fontWeight: 800, color: BFTC_T.ink,
            letterSpacing: ".02em", lineHeight: 1.1, marginTop: 4,
            textShadow: "0 1px 0 rgba(255,255,255,.5)",
          }}>{PLAYER.name}</div>

          {/* Tribu banner */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: 10, padding: "6px 14px",
            background: "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))",
            border: "2px solid var(--game-gold-border)", borderRadius: 999,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 2px 0 rgba(0,0,0,.2)",
          }}>
            <span style={{
              padding: "1px 7px", borderRadius: 999,
              background: "rgba(0,0,0,.25)", color: "#fef9f0",
              fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 10, letterSpacing: ".12em",
              border: "1px solid rgba(0,0,0,.3)",
            }}>{PLAYER.tribu.tag}</span>
            <span style={{
              fontFamily: BFTC_T.font, fontSize: 12, fontWeight: 800, color: "#3a2a00",
              letterSpacing: ".04em",
            }}>{PLAYER.tribu.name}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
            <Ornament/>
          </div>
        </div>

        {/* Stats hero */}
        <SectionB title="Trésor et puissance">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <StatTile icon={I("army-power")} value={PLAYER.stats.power}  label="Puissance" tone="dark"/>
            <StatTile icon={C("crown")}      value={PLAYER.stats.crowns} label="Couronnes" tone="dark"/>
            <StatTile icon={C("card-gold")}  value={PLAYER.stats.points} label="Renommée"/>
            <StatTile                        value={`#${PLAYER.stats.rank}`} label={`Rang sur ${PLAYER.stats.rankTotal}`}/>
          </div>
        </SectionB>

        {/* Vos terres */}
        <SectionB title="Vos terres" sub={`${PLAYER.villages.length} domaines sous votre bannière`}>
          {PLAYER.villages.map((v) => (
            <div key={v.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
              borderBottom: "1px dashed rgba(93,74,50,.3)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: v.capitale
                  ? "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))"
                  : "linear-gradient(to bottom, #d9c896, #a67c52)",
                border: `2px solid ${v.capitale ? "var(--game-gold-border)" : "#5d4a32"}`,
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)",
              }}>
                <img src={B("castle")} alt="" style={{ width: 36 }}/>
                {v.capitale && (
                  <img src={C("crown")} alt="" style={{
                    position: "absolute", top: -8, left: "50%", transform: "translateX(-50%) rotate(-4deg)",
                    width: 18, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))",
                  }}/>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{
                    fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 14, color: BFTC_T.ink,
                  }}>{v.name}</span>
                  <RoleTag role={v.role} size="sm"/>
                  {v.role2 && <RoleTag role={v.role2} size="sm"/>}
                </div>
                <div style={{
                  fontFamily: BFTC_T.font, fontSize: 10.5, color: BFTC_T.inkSoft,
                  display: "flex", gap: 10, marginTop: 2, alignItems: "center",
                }}>
                  <span>Château <b style={{ color: BFTC_T.ink }}>Niv. {v.level}</b></span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <img src={I("army-power")} alt="" style={{ width: 11 }}/>
                    <b style={{ color: BFTC_T.ink }}>{v.power}</b>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <img src={I("position")} alt="" style={{ width: 10, opacity: .7 }}/>
                    {v.coords}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </SectionB>

        {/* Frères d'armes */}
        <SectionB title="Frères d'armes" sub={`${PLAYER.tribu.members}/${PLAYER.tribu.cap} membres · ${PLAYER.tribu.role}`}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px",
            background: "linear-gradient(to bottom, #fef3d6, #e8d4a8)",
            border: "2px solid var(--game-gold-border)", borderRadius: 12,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.5)",
          }}>
            {/* Bannière SVG */}
            <svg width="42" height="56" viewBox="0 0 42 56">
              <defs>
                <linearGradient id="bnr" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#e7423a"/>
                  <stop offset="1" stopColor="#7a160f"/>
                </linearGradient>
              </defs>
              <rect x="2" y="0" width="38" height="2" fill="#3d2f1f"/>
              <path d="M3 2 L39 2 L39 46 L21 56 L3 46 Z" fill="url(#bnr)" stroke="#3d2f1f" strokeWidth="1.5"/>
              <path d="M21 14 L25 22 L33 23 L27 29 L29 37 L21 33 L13 37 L15 29 L9 23 L17 22 Z" fill="#f6d57b" stroke="#9e7b0d" strokeWidth=".8"/>
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 13, color: BFTC_T.ink,
              }}>{PLAYER.tribu.name}</div>
              <div style={{ fontFamily: BFTC_T.font, fontSize: 10.5, color: BFTC_T.inkSoft, marginTop: 1 }}>
                Tribu <b style={{ color: BFTC_T.ink }}>[{PLAYER.tribu.tag}]</b> · <b style={{ color: BFTC_T.ink }}>{PLAYER.tribu.members}</b> chevaliers réunis
              </div>
              {/* row d'avatars */}
              <div style={{ display: "flex", marginTop: 6 }}>
                {["AL", "RB", "MR", "CT", "JN"].map((m, i) => (
                  <div key={i} style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: `hsl(${(i * 67) % 360}, 35%, 55%)`,
                    border: "2px solid #fef9f0", marginLeft: i ? -6 : 0,
                    fontFamily: BFTC_T.font, fontSize: 8, fontWeight: 800, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    textShadow: "1px 1px 1px rgba(0,0,0,.5)",
                  }}>{m}</div>
                ))}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(0,0,0,.25)",
                  border: "2px solid #fef9f0", marginLeft: -6,
                  fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800, color: "#fef9f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>+{PLAYER.tribu.members - 5}</div>
              </div>
            </div>
          </div>
        </SectionB>

        {/* Règlement */}
        <SectionB title="Règlement" sub="Préférences du seigneur">
          <div style={{
            background: "linear-gradient(to bottom, #fef9f0, #e8d4a8)",
            border: "2px solid #a67c52", borderRadius: 12, padding: "4px 12px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.5)",
          }}>
            <SettingRow icon="🔔" label="Notifications"    value="Activées"/>
            <SettingRow icon="🔊" label="Son et musique"   value="Activés"/>
            <SettingRow icon="🌐" label="Langue"           value="Français"/>
            <SettingRow icon="❓" label="Aide et support"/>
          </div>
          <button style={{
            marginTop: 10, width: "100%",
            padding: "11px 14px", border: "2px solid var(--game-red-border)",
            background: "linear-gradient(to bottom, var(--game-red-light), var(--game-red-dark))",
            color: "#fff", fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 12,
            letterSpacing: ".12em", textTransform: "uppercase",
            textShadow: "1px 1px 1px rgba(0,0,0,.5)",
            borderRadius: 10, cursor: "pointer",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 3px 0 rgba(0,0,0,.2)",
          }}>Quitter le royaume</button>
        </SectionB>

        <div style={{ height: 14 }}/>
      </div>
    </div>
  );
}

function SectionB({ title, sub, children }) {
  return (
    <div style={{ padding: "12px 16px 8px" }}>
      <div style={{
        fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700, letterSpacing: ".32em",
        color: BFTC_T.inkSoft, textTransform: "uppercase",
      }}>{title}</div>
      {sub && (
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 10.5, color: BFTC_T.inkSoft, marginTop: 2,
          fontStyle: "italic",
        }}>{sub}</div>
      )}
      <div style={{ height: 8 }}/>
      {children}
    </div>
  );
}

// =============================================================================
// VARIANTE C — Carte centrée (hybride, hero + accordéon)
// =============================================================================

function ModalC({ onClose }) {
  const [open, setOpen] = useState("villages");

  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: "rgba(0,0,0,.62)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "12px",
      animation: "fadeIn .2s ease-out",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 320, maxHeight: "92%",
        borderRadius: 16, overflow: "hidden", position: "relative",
        background: `linear-gradient(to bottom, ${BFTC_T.parch1}, ${BFTC_T.parch3})`,
        border: `4px solid ${BFTC_T.woodBark}`,
        boxShadow: `0 0 0 2px var(--game-gold-dark), 0 14px 36px rgba(0,0,0,.65), inset 0 2px 0 rgba(255,255,255,.55)`,
        display: "flex", flexDirection: "column",
        animation: "modalIn .25s cubic-bezier(.2,.7,.3,1.2)",
      }}>
        {/* Gold strip + close button */}
        <div style={{ height: 8, background: "linear-gradient(to right, var(--game-gold-light), var(--game-gold-dark))" }}/>
        <button onClick={onClose} aria-label="Fermer" style={{
          position: "absolute", top: 14, right: 12,
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(to bottom, #b6a78a, #8b7355)",
          border: "2px solid #5d4a32", color: "#fff",
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 14, lineHeight: 1, cursor: "pointer",
          textShadow: "1px 1px 1px rgba(0,0,0,.5)", zIndex: 4,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.2)",
        }}>×</button>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* HERO compact */}
          <div style={{
            padding: "14px 14px 10px",
            background: "radial-gradient(ellipse at 50% 0%, rgba(246,213,123,.35) 0%, transparent 70%)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <Medallion size={64} initials={PLAYER.initials} level={PLAYER.level}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, letterSpacing: ".3em",
                color: BFTC_T.inkSoft, textTransform: "uppercase",
              }}>Niveau {PLAYER.level} · {PLAYER.tribu.role}</div>
              <div style={{
                fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 18, color: BFTC_T.ink,
                letterSpacing: ".02em", lineHeight: 1.05, marginTop: 2,
                textShadow: "0 1px 0 rgba(255,255,255,.4)",
              }}>{PLAYER.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                <span style={{
                  fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800,
                  padding: "1px 6px", borderRadius: 999,
                  background: "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))",
                  border: "1.5px solid var(--game-gold-border)", color: "#3a2a00",
                  letterSpacing: ".12em",
                }}>{PLAYER.tribu.tag}</span>
                <span style={{ fontFamily: BFTC_T.font, fontSize: 10.5, color: BFTC_T.inkSoft, fontStyle: "italic" }}>
                  {PLAYER.tribu.name}
                </span>
              </div>
            </div>
          </div>

          {/* Stats — 3 colonnes */}
          <div style={{
            display: "flex", gap: 6, padding: "0 14px 12px",
          }}>
            <KpiC icon={I("army-power")} value={PLAYER.stats.power}  label="Puissance"/>
            <KpiC icon={C("crown")}      value={PLAYER.stats.crowns} label="Couronnes"/>
            <KpiC                        value={`#${PLAYER.stats.rank}`} label={`Rang / ${PLAYER.stats.rankTotal}`}/>
          </div>

          {/* Monde info */}
          <div style={{
            margin: "0 14px 10px",
            padding: "7px 10px",
            background: "linear-gradient(to bottom, rgba(60,38,25,.92), rgba(78,56,34,.92))",
            border: `2px solid ${BFTC_T.woodBark}`, borderRadius: 10,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.15)",
          }}>
            <img src={I("position")} alt="" style={{ width: 14, height: 14, filter: "brightness(2)" }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 700, color: "#fef9f0",
                textShadow: "1px 1px 1px rgba(0,0,0,.5)",
              }}>Monde <b>{PLAYER.world.name}</b></div>
            </div>
            <div style={{
              fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700, color: "#cdb88a",
              fontVariantNumeric: "tabular-nums",
            }}>J+{PLAYER.world.day}<span style={{ opacity: .5 }}> / {PLAYER.world.total}</span></div>
          </div>

          {/* Accordéon */}
          <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            <AccordionC
              title="Vos villages"
              count={PLAYER.villages.length}
              isOpen={open === "villages"}
              onToggle={() => setOpen(open === "villages" ? null : "villages")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "8px 10px 10px" }}>
                {PLAYER.villages.map((v) => (
                  <div key={v.id} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "4px 0",
                  }}>
                    {v.capitale ? (
                      <img src={C("crown")} alt="" style={{ width: 14, flexShrink: 0 }}/>
                    ) : (
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: BFTC_T.inkSoft, marginLeft: 4, marginRight: 4, flexShrink: 0,
                      }}/>
                    )}
                    <span style={{
                      flex: 1, fontFamily: BFTC_T.font, fontSize: 12, fontWeight: 700, color: BFTC_T.ink,
                    }}>{v.name}</span>
                    <RoleTag role={v.role} size="sm"/>
                    <span style={{
                      fontFamily: BFTC_T.font, fontSize: 10, color: BFTC_T.inkSoft, marginLeft: 4,
                      fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
                    }}>Niv. {v.level}</span>
                  </div>
                ))}
              </div>
            </AccordionC>

            <AccordionC
              title="Tribu"
              badge={PLAYER.tribu.tag}
              isOpen={open === "tribu"}
              onToggle={() => setOpen(open === "tribu" ? null : "tribu")}
            >
              <div style={{ padding: "10px 12px" }}>
                <div style={{
                  fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 12.5, color: BFTC_T.ink,
                }}>{PLAYER.tribu.name}</div>
                <div style={{
                  fontFamily: BFTC_T.font, fontSize: 10.5, color: BFTC_T.inkSoft, marginTop: 2,
                }}>{PLAYER.tribu.members}/{PLAYER.tribu.cap} membres · vous êtes <b style={{ color: BFTC_T.ink }}>{PLAYER.tribu.role}</b></div>
                <div style={{ display: "flex", marginTop: 8 }}>
                  {["AL", "RB", "MR", "CT", "JN"].map((m, i) => (
                    <div key={i} style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: `hsl(${(i * 67) % 360}, 35%, 55%)`,
                      border: "2px solid #fef9f0", marginLeft: i ? -6 : 0,
                      fontFamily: BFTC_T.font, fontSize: 8.5, fontWeight: 800, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      textShadow: "1px 1px 1px rgba(0,0,0,.5)",
                    }}>{m}</div>
                  ))}
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: BFTC_T.inkSoft, border: "2px solid #fef9f0", marginLeft: -6,
                    fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800, color: "#fef9f0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>+{PLAYER.tribu.members - 5}</div>
                </div>
              </div>
            </AccordionC>

            <AccordionC
              title="Réglages"
              isOpen={open === "reglages"}
              onToggle={() => setOpen(open === "reglages" ? null : "reglages")}
            >
              <div style={{ padding: "4px 12px" }}>
                <SettingRow icon="🔔" label="Notifications"  value="Activées"/>
                <SettingRow icon="🔊" label="Son et musique" value="Activés"/>
                <SettingRow icon="🌐" label="Langue"         value="Français"/>
                <SettingRow icon="❓" label="Aide et support"/>
              </div>
              <div style={{ padding: "0 12px 12px" }}>
                <button style={{
                  width: "100%",
                  padding: "8px 12px", border: "2px solid var(--game-red-border)",
                  background: "linear-gradient(to bottom, var(--game-red-light), var(--game-red-dark))",
                  color: "#fff", fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 11,
                  letterSpacing: ".12em", textTransform: "uppercase",
                  textShadow: "1px 1px 1px rgba(0,0,0,.5)",
                  borderRadius: 9, cursor: "pointer",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.2)",
                }}>Quitter la session</button>
              </div>
            </AccordionC>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiC({ icon, value, label }) {
  return (
    <div style={{
      flex: 1, textAlign: "center", padding: "6px 4px",
      background: "linear-gradient(to bottom, rgba(255,255,255,.5), rgba(213,182,128,.4))",
      border: "2px solid #a67c52", borderRadius: 10,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.5)",
    }}>
      {icon && <img src={icon} alt="" style={{ width: 18, height: 18, filter: "drop-shadow(0 1px 1px rgba(0,0,0,.3))" }}/>}
      <div style={{
        fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 13, color: BFTC_T.ink,
        textShadow: "0 1px 0 rgba(255,255,255,.4)", fontVariantNumeric: "tabular-nums",
        lineHeight: 1.1, marginTop: 1,
      }}>{value}</div>
      <div style={{
        fontFamily: BFTC_T.font, fontSize: 7.5, fontWeight: 700, letterSpacing: ".16em",
        color: BFTC_T.inkSoft, textTransform: "uppercase", marginTop: 1,
      }}>{label}</div>
    </div>
  );
}

function AccordionC({ title, count, badge, isOpen, onToggle, children }) {
  return (
    <div style={{
      borderRadius: 11, overflow: "hidden",
      border: `2px solid ${isOpen ? "var(--game-gold-border)" : "#a67c52"}`,
      background: isOpen
        ? "linear-gradient(to bottom, #fef3d6, #e8d4a8)"
        : "linear-gradient(to bottom, #fef9f0, #e8d4a8)",
      boxShadow: isOpen
        ? "inset 0 1px 0 rgba(255,255,255,.5), 0 0 0 2px rgba(246,213,123,.2)"
        : "inset 0 1px 0 rgba(255,255,255,.4)",
      transition: "all .15s",
    }}>
      <button onClick={onToggle} style={{
        width: "100%", padding: "9px 12px", display: "flex", alignItems: "center", gap: 8,
        background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{
          flex: 1, fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 800, letterSpacing: ".2em",
          color: BFTC_T.ink, textTransform: "uppercase",
        }}>{title}</span>
        {count != null && (
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 800, color: "#3a2a00",
            background: "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))",
            border: "1.5px solid var(--game-gold-border)",
            padding: "0px 6px", borderRadius: 999, minWidth: 18, textAlign: "center",
          }}>{count}</span>
        )}
        {badge && (
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800, color: "#3a2a00",
            background: "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))",
            border: "1.5px solid var(--game-gold-border)",
            padding: "1px 6px", borderRadius: 999, letterSpacing: ".1em",
          }}>{badge}</span>
        )}
        <span style={{
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 14, color: BFTC_T.inkSoft,
          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s",
          width: 14, textAlign: "center",
        }}>›</span>
      </button>
      {isOpen && (
        <div style={{
          borderTop: "1px dashed rgba(93,74,50,.3)",
          background: "rgba(255,255,255,.35)",
        }}>{children}</div>
      )}
    </div>
  );
}

// =============================================================================
// Phone-frame wrapper avec village A + modal openable
// =============================================================================

function PhoneWithModal({ Variant, initialOpen = true, label }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <div data-screen-label={label} style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: "#1a1a2e", fontFamily: "var(--bftc-font-body)", position: "relative",
      overflow: "hidden",
    }}>
      {/* Village A from village-views.jsx provides its own TopBar + scene + BottomNav */}
      {/* We render it then layer the modal on top */}
      <VillageA/>
      {!open && (
        <button onClick={() => setOpen(true)} style={{
          position: "absolute", top: 10, left: 10, width: 36, height: 36, zIndex: 100,
          borderRadius: "50%", border: "2px solid var(--game-gold-border)",
          background: "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))",
          color: "#3a2a00", fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 11,
          textShadow: "0 1px 0 rgba(255,255,255,.4)", cursor: "pointer",
          boxShadow: "0 3px 0 rgba(0,0,0,.25)",
        }}>{PLAYER.initials}</button>
      )}
      {open && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column" }}>
          <Variant onClose={() => setOpen(false)}/>
        </div>
      )}
    </div>
  );
}

// `VillageA` lives inside village-views.jsx but is not exported on window.
// village-views.jsx renders the full Phone (with TopBar + BottomNav). For the
// modal explorations we want the same scene framing — so we just call PhoneA
// (which exists on window) and overlay our modal on top by absolute-positioning
// the modal container inside the artboard.

function ArtboardWith({ Variant, label }) {
  // Render PhoneA (village + HUD + nav) full-bleed, then overlay modal.
  // The village scene contains elements with large internal z-indices (building
  // sprites use zIndex = top so they paint front-to-back, SceneChrome uses 1000+,
  // the patched TopBar uses 2000). We isolate the phone tree in its own stacking
  // context so none of those z-indices can punch through the modal overlay.
  return (
    <div data-screen-label={label} style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#1a1a2e",
    }}>
      <div style={{
        position: "absolute", inset: 0, isolation: "isolate", zIndex: 0,
        display: "flex", flexDirection: "column",
      }}>
        <PhoneA/>
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 50, pointerEvents: "auto" }}>
        <ModalContainer Variant={Variant}/>
      </div>
    </div>
  );
}

function ModalContainer({ Variant }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      {/* dim layer that does not catch clicks elsewhere */}
      {open && Variant !== ModalC && (
        <div onClick={() => setOpen(false)} style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,.55)",
          backdropFilter: "blur(2px)", animation: "fadeIn .2s ease-out",
        }}/>
      )}
      {open && <Variant onClose={() => setOpen(false)}/>}
      {!open && (
        <button onClick={() => setOpen(true)} style={{
          position: "absolute", top: 10, left: 10, width: 36, height: 36, zIndex: 100,
          borderRadius: 10, border: "2px solid var(--game-gold-border)",
          background: "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))",
          color: "#3a2a00", fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 11,
          textShadow: "0 1px 0 rgba(255,255,255,.4)", cursor: "pointer",
          boxShadow: "0 3px 0 rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.4)",
        }}>{PLAYER.initials}</button>
      )}
    </>
  );
}

function PlayerArtboardA() { return <ArtboardWith Variant={ModalA} label="A · Feuille basse"/>; }
function PlayerArtboardB() { return <ArtboardWith Variant={ModalB} label="B · Parchemin plein écran"/>; }
function PlayerArtboardC() { return <ArtboardWith Variant={ModalC} label="C · Carte centrée"/>; }

// Animations
if (typeof document !== 'undefined' && !document.getElementById('player-modal-anim')) {
  const s = document.createElement('style');
  s.id = 'player-modal-anim';
  s.textContent = `
    @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes modalIn {
      from { opacity: 0; transform: translateY(10px) scale(.94); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  PlayerArtboardA, PlayerArtboardB, PlayerArtboardC, PLAYER,
  // Exposed for cross-file reuse (multi-village sheet, etc.)
  VillageTierSprite, tierFromPower, RoleTag, Medallion, SettingRow,
});
