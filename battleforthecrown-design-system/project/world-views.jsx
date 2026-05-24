/* global React, BFTC_T, PixelBtn, Pill, Glyph */
/* Choix du monde — 3 artboards, mobile 360x720.
   A) Liste compacte avec monde conseillé en majesté + filtres
   B) Cartes héraldiques empilées (scroll), bannière par monde
   C) Détail d'un monde sélectionné (carte miniature + édits + Rejoindre) */

const { useState: useStateW } = React;

const ASSET_W = "assets";
const I_W = (n) => `${ASSET_W}/icons/${n}.png`;
const C_W = (n) => `${ASSET_W}/casual-icons/${n}.png`;
const B_W = (n) => `${ASSET_W}/buildings/${n}.png`;

// =============================================================================
// Données mondes — un set unique partagé entre les 3 variations.
// =============================================================================

const WORLDS = [
  {
    id: "W214", name: "Aubeforge",      tag: "Conseillé",
    variant: "standard",
    tagline: "Où les vassaux bâtissent leur légende",
    speed: "x1", day: 5, season: "Jour 5 / 60", players: 8420, pop: "Calme",
    rules: ["Débutants", "PvP libre", "Saison 60j"],
    crest: { field: ["#5a8f3a", "#2f5b1c"], symbol: "♘" }, // sinople
    status: "open",
  },
  {
    id: "W218", name: "Bois-Doux",       tag: "Nouveau",
    variant: "standard",
    tagline: "L'aube se lève sur un royaume calme",
    speed: "x1", day: 2, season: "Jour 2 / 60", players: 3120, pop: "Naissant",
    rules: ["Débutants", "PvP libre", "Tutoriel inclus"],
    crest: { field: ["#3a8f7d", "#1c5b4d"], symbol: "⚘" },
    status: "open",
  },
  {
    id: "W215", name: "Cendre-Noire",   tag: "Vétérans",
    variant: "standard",
    tagline: "Cité brûlée, ferveur intacte",
    speed: "x1", day: 28, season: "Jour 28 / 60", players: 4210, pop: "Tendu",
    rules: ["Classé", "Coalitions", "Pillage doublé"],
    crest: { field: ["#2c2520", "#0c0a08"], symbol: "♔" }, // sable
    status: "locked",
  },
  {
    id: "W213", name: "Val-d'Azur",     tag: "Plein",
    variant: "standard",
    tagline: "Les rives bleues regorgent de seigneurs",
    speed: "x1", day: 55, season: "Jour 55 / 60", players: 12_900, pop: "Saturé",
    rules: ["Classé", "PvP libre", "Saison 60j"],
    crest: { field: ["#3a72b8", "#1f4d85"], symbol: "✦" }, // azur
    status: "full",
  },
  {
    id: "W216", name: "Mont-Vermeil",   tag: "Tardive",
    variant: "standard",
    tagline: "L'étendard vermeil flotte déjà",
    speed: "x1", day: 8, season: "Jour 8 / 60",  players: 1840, pop: "Naissant",
    rules: ["Débutants", "PvP libre", "Saison 60j"],
    crest: { field: ["#c0392b", "#7d1e15"], symbol: "♕" }, // rouge
    status: "late", lateSince: "8j",
  },
  {
    id: "W217", name: "Ombre-Pourpre",  tag: "À venir",
    variant: "standard",
    tagline: "La bannière est encore pliée",
    speed: "x1", day: -2, season: "Pré-lancement", players: 0, pop: "—",
    rules: ["Débutants", "Saison 60j", "Tutoriel inclus"],
    crest: { field: ["#7a3a7d", "#43204a"], symbol: "✠" }, // pourpre
    status: "upcoming", opensIn: "2j 14h",
  },
  {
    id: "W212", name: "Glace-d'Argent", tag: "Légende",
    variant: "standard",
    tagline: "La saison s'est tue, les chants demeurent",
    speed: "x1", day: 60, season: "Saison close", players: 6210, pop: "Finale",
    rules: ["Lecture seule", "Leaderboard figé"],
    crest: { field: ["#b5b8be", "#7c8088"], symbol: "⚜" }, // argent
    status: "ended",
  },
];

// =============================================================================
// Variantes de saison — MVP livre Standard. Speed + Hardcore en preview (grisés).
// =============================================================================

const WORLD_VARIANTS = {
  standard: {
    label: "Standard", duration: "60 j", tempo: "×1",
    color: "#6ebf49", colorDark: "#4a8c2a", border: "#3a6c1f",
    active: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M5 9h14M9 21h6"/>
        <path d="M5 9l-2 8h4L5 9zM19 9l-2 8h4L19 9z"/>
      </svg>
    ),
  },
  speed: {
    label: "Speed", duration: "30 j", tempo: "×2",
    color: "#f6d57b", colorDark: "#c59e3f", border: "#9e7b0d",
    active: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
        <path d="M13 2 4 14h7l-1 8 10-12h-7z"/>
      </svg>
    ),
  },
  hardcore: {
    label: "Hardcore", duration: "TBD", tempo: "?",
    color: "#c0392b", colorDark: "#7d1e15", border: "#4d100a",
    active: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a8 8 0 0 0-5 14v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2a8 8 0 0 0-5-14z"/>
        <circle cx="9.5" cy="13" r="1.5" fill="currentColor"/>
        <circle cx="14.5" cy="13" r="1.5" fill="currentColor"/>
        <path d="M11 17h2"/>
      </svg>
    ),
  },
};

const POP_COLORS = {
  "Naissant": "#2e75b6",
  "Calme":    "#4a8c2a",
  "Tendu":    "#9e7b0d",
  "Saturé":   "#7d1e15",
  "Finale":   "#7d3a90",
  "—":        "#7c8088",
};

const STATUS_GROUPS = {
  open:   { label: "Inscription", statuses: ["open", "late"] },
  soon:   { label: "Bientôt",     statuses: ["upcoming"] },
  locked: { label: "Verrouillés", statuses: ["locked", "full", "ended"] },
};

// Inline SVGs for the icon-stat row (lucide-style, brand-consistent)
const ICON_USERS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ICON_PULSE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const ICON_SCROLL = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
    <path d="M19 17V5a2 2 0 0 0-2-2H4"/>
    <path d="M2 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2H6"/>
  </svg>
);

// =============================================================================
// Shared chrome
// =============================================================================

function WorldShell({ children, tone = "dark" }) {
  if (tone === "light") {
    return (
      <div style={{
        width: 360, height: 720, position: "relative", overflow: "hidden",
        background: "radial-gradient(ellipse at top, #e8d5b7 0%, #f5e6d3 45%, #d4c094 100%)",
        fontFamily: BFTC_T.font, color: BFTC_T.ink,
        display: "flex", flexDirection: "column",
      }}>
        {/* Subtle parchment vignette */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at center 110%, rgba(60,38,25,.18), transparent 55%)",
        }}/>
        {children}
      </div>
    );
  }
  return (
    <div style={{
      width: 360, height: 720, position: "relative", overflow: "hidden",
      background: "linear-gradient(180deg, #1f1a2a 0%, #2a1f1a 100%)",
      fontFamily: BFTC_T.font, color: "#f0e0c0",
      display: "flex", flexDirection: "column",
    }}>
      {/* Decorative dark world-map dots */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none",
        backgroundImage:
          "radial-gradient(circle at 20% 30%, #6ebf49 1px, transparent 1.5px)," +
          "radial-gradient(circle at 60% 70%, #f6d57b 1px, transparent 1.5px)," +
          "radial-gradient(circle at 80% 20%, #3a72b8 1px, transparent 1.5px)," +
          "radial-gradient(circle at 35% 80%, #c0392b 1px, transparent 1.5px)",
        backgroundSize: "40px 40px,60px 60px,50px 50px,55px 55px",
      }}/>
      {children}
    </div>
  );
}

function StatusBar({ tone = "light" }) {
  const c = tone === "dark" ? "rgba(60,38,25,.7)" : "rgba(240,224,192,.8)";
  return (
    <div style={{
      height: 22, padding: "0 16px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 11, color: c,
      letterSpacing: ".04em",
    }}>
      <span>9:41</span>
      <span style={{ display: "inline-flex", gap: 6, fontSize: 10 }}>
        <span>5G</span><span>100%</span>
      </span>
    </div>
  );
}

// Top header — back + title + counter pill
function WorldHeader({ count, title = "Choix du royaume", subtitle = "Un monde, des règles, une saison", tone = "dark" }) {
  if (tone === "light") {
    return (
      <div style={{
        padding: "4px 14px 9px", position: "relative",
        borderBottom: "2px solid rgba(60,38,25,.5)",
        background: "linear-gradient(to bottom, rgba(232,212,168,.6), rgba(212,192,148,.85))",
        boxShadow: "0 3px 8px rgba(60,38,25,.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "linear-gradient(to bottom, rgba(60,38,25,.92), rgba(78,56,34,.92))",
            border: "1.5px solid #3c2619", borderRadius: 8, padding: "3px 10px 3px 8px",
            color: "#f0e0c0", fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 11,
            letterSpacing: ".08em", textShadow: "1px 1px 1px rgba(0,0,0,.5)",
            cursor: "pointer",
          }}><span style={{ fontSize: 14, lineHeight: 1 }}>‹</span>Retour</button>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(60,38,25,.12)", border: "1.5px solid rgba(60,38,25,.25)",
            borderRadius: 999, padding: "3px 9px",
            fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 800, color: BFTC_T.inkSoft,
            letterSpacing: ".18em", textTransform: "uppercase",
          }}>{count} royaumes</span>
        </div>
        <div style={{
          fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 20, color: BFTC_T.woodBark,
          letterSpacing: ".02em", textShadow: "0 1px 0 rgba(255,255,255,.5)",
          lineHeight: 1,
        }}>{title}</div>
        <div style={{
          marginTop: 2, fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 11,
          color: BFTC_T.inkSoft, lineHeight: 1.15,
        }}>« {subtitle} »</div>
      </div>
    );
  }
  return (
    <div style={{
      padding: "6px 14px 12px", position: "relative",
      borderBottom: "2px solid rgba(60,38,25,.8)",
      background: "linear-gradient(to bottom, rgba(60,38,25,.95), rgba(78,56,34,.92))",
      boxShadow: "0 4px 10px rgba(0,0,0,.4)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(0,0,0,.35)",
          border: "1.5px solid rgba(240,224,192,.25)", borderRadius: 8, padding: "4px 10px 4px 8px",
          color: "#f0e0c0", fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 11,
          letterSpacing: ".08em", cursor: "pointer",
        }}><span style={{ fontSize: 14, lineHeight: 1 }}>‹</span>Retour</button>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(0,0,0,.35)", border: "1.5px solid rgba(240,224,192,.18)",
          borderRadius: 999, padding: "3px 9px",
          fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 800, color: "#cdb88a",
          letterSpacing: ".18em", textTransform: "uppercase",
        }}>{count} royaumes</span>
      </div>
      <div style={{
        fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 22, color: "#f6e4b8",
        letterSpacing: ".02em", textShadow: "0 2px 4px rgba(0,0,0,.5)",
      }}>{title}</div>
      <div style={{
        marginTop: 2, fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 11.5,
        color: "rgba(240,224,192,.7)",
      }}>« {subtitle} »</div>
    </div>
  );
}

// =============================================================================
// Bits réutilisables
// =============================================================================

// Mini crest — same shield silhouette as the auth artboard, smaller.
function MiniCrest({ field, symbol, size = 36, ring = "#3c2619" }) {
  return (
    <div style={{
      width: size, height: size * 1.15, position: "relative", flexShrink: 0,
      filter: "drop-shadow(0 3px 4px rgba(0,0,0,.5))",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        clipPath: "polygon(50% 100%, 0% 75%, 0% 8%, 8% 0%, 92% 0%, 100% 8%, 100% 75%)",
        background: `linear-gradient(to bottom, ${field[0]}, ${field[1]})`,
        border: `2px solid ${ring}`,
        boxShadow: "inset 0 2px 0 rgba(255,255,255,.25), inset 0 -8px 14px rgba(0,0,0,.25)",
      }}/>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        paddingBottom: 4,
        fontFamily: BFTC_T.font, fontWeight: 900, fontSize: size * 0.5,
        color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,.6)", lineHeight: 1,
      }}>{symbol}</div>
    </div>
  );
}

// Population pulse — visualises live density
function PopBar({ pop }) {
  const map = {
    "Naissant": { c: "#5b9bd5", fill: 0.18, label: "Naissant" },
    "Calme":    { c: "#6ebf49", fill: 0.35, label: "Calme" },
    "Tendu":    { c: "#f6d57b", fill: 0.62, label: "Tendu" },
    "Saturé":   { c: "#c0392b", fill: 0.96, label: "Saturé" },
    "Finale":   { c: "#9b59b6", fill: 0.80, label: "Finale" },
    "—":        { c: "#7c8088", fill: 0,    label: "Bientôt" },
  };
  const x = map[pop] || map["—"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      <div style={{
        width: 36, height: 6, borderRadius: 3,
        background: "rgba(0,0,0,.4)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,.3)", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${x.fill * 100}%`,
          background: x.c, boxShadow: `0 0 6px ${x.c}`,
        }}/>
      </div>
      <span style={{
        fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 700,
        color: x.c, letterSpacing: ".1em", textTransform: "uppercase",
        textShadow: "0 1px 1px rgba(0,0,0,.4)",
      }}>{x.label}</span>
    </div>
  );
}

// Speed badge — small chip-like indicator
function SpeedBadge({ speed }) {
  const tone = speed === "x1" ? { c: "#cdb88a", bg: "rgba(0,0,0,.35)", bd: "rgba(240,224,192,.25)" }
              : speed === "x2" ? { c: "#fff", bg: "linear-gradient(to bottom,#5b9bd5,#2e75b6)", bd: "#1f5288" }
              : { c: "#fff", bg: "linear-gradient(to bottom,#c0392b,#7d1e15)", bd: "#4d100a" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "1px 6px", borderRadius: 999,
      background: tone.bg, border: `1.5px solid ${tone.bd}`, color: tone.c,
      fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 9.5, letterSpacing: ".1em",
      textShadow: "0 1px 1px rgba(0,0,0,.4)", whiteSpace: "nowrap",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.2)",
    }}>{speed === "x1" ? "VITESSE x1" : speed === "x2" ? "VITESSE x2" : "SPRINT x5"}</span>
  );
}

// Status tag for the "tag" line
function StatusTag({ status, tag }) {
  const m = {
    open:     { bg: "linear-gradient(to bottom,#6ebf49,#4a8c2a)", bd: "#3a6c1f", c: "#fff" },
    late:     { bg: "linear-gradient(to bottom,#f6d57b,#c59e3f)", bd: "#9e7b0d", c: "#3a2a00" },
    locked:   { bg: "linear-gradient(to bottom,#a67c52,#6d5838)", bd: "#3c2619", c: "#fff" },
    upcoming: { bg: "linear-gradient(to bottom,#5b9bd5,#2e75b6)", bd: "#1f5288", c: "#fff" },
    full:     { bg: "linear-gradient(to bottom,#c0392b,#7d1e15)", bd: "#4d100a", c: "#fff" },
    ended:    { bg: "linear-gradient(to bottom,#b0b8c0,#7c8088)", bd: "#5d6d6e", c: "#fff" },
    ending:   { bg: "linear-gradient(to bottom,#b0b8c0,#7c8088)", bd: "#5d6d6e", c: "#fff" },
  }[status] || { bg: "linear-gradient(to bottom,#b0b8c0,#7c8088)", bd: "#5d6d6e", c: "#fff" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 7px",
      borderRadius: 999, background: m.bg, border: `1.5px solid ${m.bd}`, color: m.c,
      fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 9.5, letterSpacing: ".14em",
      textTransform: "uppercase", textShadow: m.c === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)", whiteSpace: "nowrap", flexShrink: 0,
    }}>{tag}</span>
  );
}

// =============================================================================
// A — Liste compacte + monde conseillé en majesté
// =============================================================================

function FeaturedCard({ world }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(to bottom, #fef9f0, #e8d4a8)",
      border: "3px solid #3c2619",
      borderRadius: 14,
      boxShadow:
        "0 0 0 2px #f6d57b, 0 8px 20px rgba(0,0,0,.4)," +
        "inset 0 2px 0 rgba(255,255,255,.5), inset 0 -16px 24px rgba(0,0,0,.12)",
      padding: 12, display: "flex", flexDirection: "column", gap: 8,
      overflow: "hidden",
    }}>
      {/* Eyebrow */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "2px 8px",
          background: "linear-gradient(to bottom, #f6d57b, #c59e3f)",
          border: "1.5px solid #9e7b0d", borderRadius: 999,
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 9, color: "#3a2a00",
          letterSpacing: ".18em", textTransform: "uppercase", whiteSpace: "nowrap",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.5)",
        }}>
          <img src={C_W("crown")} alt="" style={{ width: 11, height: 11 }}/>
          Conseillé pour vous
        </span>
        <SpeedBadge speed={world.speed}/>
      </div>

      {/* Body — crest + name + sub */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
        <MiniCrest field={world.crest.field} symbol={world.crest.symbol} size={52}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 22, color: BFTC_T.woodBark,
            letterSpacing: ".02em", textShadow: "1px 1px 0 rgba(255,255,255,.5)",
            lineHeight: 1.05,
          }}>{world.name}</div>
          <div style={{
            marginTop: 2, fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 700,
            color: BFTC_T.inkSoft, letterSpacing: ".06em",
          }}>{world.id} · {world.season}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
        background: "rgba(60,38,25,.08)", borderRadius: 10, padding: 8,
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, color: BFTC_T.inkSoft,
            letterSpacing: ".22em", textTransform: "uppercase",
          }}>Vassaux</span>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 16, fontWeight: 800, color: BFTC_T.ink,
            fontVariantNumeric: "tabular-nums",
          }}>{world.players.toLocaleString("fr-FR")}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, color: BFTC_T.inkSoft,
            letterSpacing: ".22em", textTransform: "uppercase",
          }}>Densité</span>
          <PopBar pop={world.pop}/>
        </div>
      </div>

      {/* Rule chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {world.rules.map(r => (
          <span key={r} style={{
            padding: "2px 7px", borderRadius: 999,
            background: "rgba(60,38,25,.12)", border: "1.5px solid rgba(60,38,25,.2)",
            fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700,
            color: BFTC_T.inkSoft, letterSpacing: ".04em",
          }}>{r}</span>
        ))}
      </div>

      <PixelBtn variant="success" size="md" full style={{ marginTop: 2 }}>
        Rejoindre Aubeforge
      </PixelBtn>
    </div>
  );
}

function CompactRow({ world }) {
  const disabled = world.status === "full";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px",
      background: "linear-gradient(to bottom, rgba(60,38,25,.55), rgba(40,25,16,.55))",
      border: "1.5px solid rgba(240,224,192,.18)", borderRadius: 10,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
      opacity: disabled ? 0.55 : 1,
    }}>
      <MiniCrest field={world.crest.field} symbol={world.crest.symbol} size={32}/>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{
            fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 13, color: "#f6e4b8",
            letterSpacing: ".02em", textShadow: "0 1px 2px rgba(0,0,0,.5)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{world.name}</span>
          <StatusTag status={world.status} tag={world.tag}/>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SpeedBadge speed={world.speed}/>
          <span style={{
            fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700, color: "rgba(240,224,192,.7)",
            fontVariantNumeric: "tabular-nums",
          }}>{world.players ? world.players.toLocaleString("fr-FR") : "—"} vassaux</span>
        </div>
      </div>
      {world.status === "upcoming" ? (
        <div style={{
          padding: "5px 9px", borderRadius: 8,
          background: "linear-gradient(to bottom,#5b9bd5,#2e75b6)", border: "1.5px solid #1f5288",
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 10, color: "#fff",
          letterSpacing: ".06em", textShadow: "1px 1px 1px rgba(0,0,0,.4)", whiteSpace: "nowrap",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.2)",
        }}>{world.opensIn}</div>
      ) : disabled ? (
        <div style={{
          padding: "5px 9px", borderRadius: 8,
          background: "rgba(60,38,25,.6)", border: "1.5px solid rgba(60,38,25,.8)",
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 10, color: "rgba(240,224,192,.5)",
          letterSpacing: ".08em", textTransform: "uppercase",
        }}>Plein</div>
      ) : (
        <PixelBtn variant="success" size="xs">Entrer</PixelBtn>
      )}
    </div>
  );
}

function WorldArtboardA() {
  return (
    <WorldShell>
      <StatusBar/>
      <WorldHeader count={WORLDS.length}/>

      {/* Filter row */}
      <div style={{
        padding: "10px 14px 4px",
        display: "flex", gap: 6, overflow: "hidden",
        borderBottom: "1px solid rgba(60,38,25,.5)",
      }}>
        {["Tous", "Débutants", "Sprint x5", "Classés", "Nouveaux"].map((f, i) => (
          <span key={f} style={{
            padding: "5px 10px", borderRadius: 999,
            background: i === 0 ? "linear-gradient(to bottom, #f6d57b, #c59e3f)" : "rgba(0,0,0,.35)",
            border: `1.5px solid ${i === 0 ? "#9e7b0d" : "rgba(240,224,192,.18)"}`,
            color: i === 0 ? "#3a2a00" : "#cdb88a",
            fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 10, letterSpacing: ".08em",
            textShadow: i === 0 ? "none" : "0 1px 1px rgba(0,0,0,.4)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.2)",
            whiteSpace: "nowrap",
          }}>{f}</span>
        ))}
      </div>

      {/* Body */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 152, bottom: 0,
        padding: "10px 14px 14px",
        display: "flex", flexDirection: "column", gap: 10,
        overflow: "hidden",
      }}>
        <FeaturedCard world={WORLDS[0]}/>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700, color: "rgba(240,224,192,.55)",
          letterSpacing: ".24em", textTransform: "uppercase", marginTop: 2,
        }}>Autres royaumes</div>
        {WORLDS.slice(1, 5).map(w => <CompactRow key={w.id} world={w}/>)}
      </div>
    </WorldShell>
  );
}

// =============================================================================
// WorldLifecycleBar — 4 phases sur 60j : PLANNED → OPEN main (7j) →
// OPEN late (3j) → LOCKED (~50j) → ENDED. Marqueur "current day".
// =============================================================================

const LIFECYCLE_TOTAL = 60;
const LIFECYCLE_MAIN  = 7;
const LIFECYCLE_LATE  = 10;   // borne haute de late (7 + 3)
const LIFECYCLE_LOCKED = 60;  // borne haute de locked
// Phase widths in %
const PCT_MAIN   = (LIFECYCLE_MAIN  / LIFECYCLE_TOTAL) * 100;        // 11.67
const PCT_LATE   = ((LIFECYCLE_LATE - LIFECYCLE_MAIN) / LIFECYCLE_TOTAL) * 100; // 5.0
const PCT_LOCKED = ((LIFECYCLE_LOCKED - LIFECYCLE_LATE) / LIFECYCLE_TOTAL) * 100; // 83.33

function lifecyclePhase(day) {
  if (day < 0)               return "planned";
  if (day < LIFECYCLE_MAIN)  return "open";
  if (day < LIFECYCLE_LATE)  return "late";
  if (day < LIFECYCLE_LOCKED) return "locked";
  return "ended";
}

const PHASE_TONES = {
  planned: { c: "#7c8088", glow: "rgba(124,128,136,.4)", label: "Planifié",       short: "PLAN." },
  open:    { c: "#4a8c2a", glow: "rgba(110,191,73,.45)", label: "Inscription libre", short: "OUVERT" },
  late:    { c: "#c59e3f", glow: "rgba(246,213,123,.5)", label: "Inscription tardive", short: "TARDIF" },
  locked:  { c: "#6d5838", glow: "rgba(60,38,25,.4)",    label: "Inscription close", short: "VERROU." },
  ended:   { c: "#7c8088", glow: "rgba(124,128,136,.3)", label: "Saison close",    short: "ENDED" },
};

function WorldLifecycleBar({ day, opensIn, lateSince, dense = false }) {
  const phase = lifecyclePhase(day);
  const tone  = PHASE_TONES[phase];

  // Marker position (clamped). For planned, no marker; for ended, full.
  const markerPct = phase === "planned" ? 0 : phase === "ended" ? 100
                  : Math.max(0.5, Math.min(99.5, (day / LIFECYCLE_TOTAL) * 100));

  const showMarker = phase !== "planned";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dense ? 5 : 6 }}>
      {/* Eyebrow row — current phase + day */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6,
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "2px 8px", borderRadius: 999,
          background: `linear-gradient(to bottom, ${tone.c}cc, ${tone.c})`,
          border: `1.5px solid ${tone.c}`,
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 9.5, color: "#fff",
          letterSpacing: ".18em", textTransform: "uppercase", whiteSpace: "nowrap",
          textShadow: "1px 1px 1px rgba(0,0,0,.4)",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,.25), 0 0 8px ${tone.glow}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", boxShadow: "0 0 4px #fff" }}/>
          {tone.label}
        </span>
        <span style={{
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 11, color: BFTC_T.ink,
          fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
        }}>
          {phase === "planned"
            ? <>Ouvre dans <strong style={{ color: BFTC_T.woodBark }}>{opensIn}</strong></>
            : phase === "ended"
              ? <span style={{ color: BFTC_T.inkSoft, letterSpacing: ".06em" }}>Saison achevée</span>
              : <>J. <strong style={{ color: BFTC_T.woodBark }}>{day}</strong> <span style={{ color: BFTC_T.inkSoft }}>/ {LIFECYCLE_TOTAL}</span></>}
        </span>
      </div>

      {/* Bar */}
      <div style={{
        position: "relative", height: dense ? 12 : 16,
        background: "rgba(60,38,25,.18)",
        border: "2px solid rgba(60,38,25,.5)", borderRadius: 7,
        overflow: "visible",
        boxShadow: "inset 0 2px 3px rgba(0,0,0,.25)",
      }}>
        {/* Phase backgrounds (always visible, lightly tinted) */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 5, overflow: "hidden",
          display: "flex",
        }}>
          <div style={{ flex: PCT_MAIN,   background: "rgba(110,191,73,.32)" }}/>
          <div style={{ width: 1, background: "rgba(60,38,25,.55)" }}/>
          <div style={{ flex: PCT_LATE,   background: "rgba(246,213,123,.42)" }}/>
          <div style={{ width: 1, background: "rgba(60,38,25,.55)" }}/>
          <div style={{ flex: PCT_LOCKED, background: "rgba(60,38,25,.32)" }}/>
        </div>
        {/* Saturated fill clipped to current day */}
        {showMarker && (
          <div style={{
            position: "absolute", inset: 0, width: `${markerPct}%`,
            borderRadius: "5px 0 0 5px", overflow: "hidden",
          }}>
            <div style={{
              width: `${100 / (markerPct / 100)}%`, height: "100%",
              display: "flex",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.3)",
            }}>
              <div style={{
                flex: PCT_MAIN,
                background: "linear-gradient(to bottom, #6ebf49, #4a8c2a)",
              }}/>
              <div style={{
                flex: PCT_LATE,
                background: "linear-gradient(to bottom, #f6d57b, #c59e3f)",
              }}/>
              <div style={{
                flex: PCT_LOCKED,
                background: "linear-gradient(to bottom, #8b6f47, #5d4a32)",
              }}/>
            </div>
          </div>
        )}
        {/* Current-day marker */}
        {showMarker && phase !== "ended" && (
          <>
            <div style={{
              position: "absolute", left: `${markerPct}%`,
              top: -4, bottom: -4, width: 2.5,
              background: "#f6e4b8", transform: "translateX(-50%)",
              boxShadow: `0 0 6px ${tone.glow}, 0 0 2px rgba(0,0,0,.4)`,
              borderRadius: 1, zIndex: 2,
            }}/>
            <div style={{
              position: "absolute", left: `${markerPct}%`,
              top: -4, width: 7, height: 7, borderRadius: "50%",
              background: "#f6e4b8", border: "1.5px solid #5d4a32",
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 8px ${tone.glow}`, zIndex: 3,
            }}/>
          </>
        )}
        {/* Phase boundary tick marks below the bar */}
      </div>

      {/* Phase legend — only on non-dense */}
      {!dense && (
        <div style={{
          display: "flex", fontFamily: BFTC_T.font, fontSize: 8.5, fontWeight: 800,
          color: BFTC_T.inkSoft, letterSpacing: ".12em", textTransform: "uppercase",
          marginTop: -1,
        }}>
          <span style={{ flex: PCT_MAIN, textAlign: "center", color: phase === "open" ? PHASE_TONES.open.c : undefined }}>
            Ouvert <span style={{ opacity: 0.55 }}>· 7j</span>
          </span>
          <span style={{ flex: PCT_LATE, textAlign: "center", color: phase === "late" ? PHASE_TONES.late.c : undefined, whiteSpace: "nowrap" }}>
            Tardif
          </span>
          <span style={{ flex: PCT_LOCKED, textAlign: "center", color: phase === "locked" ? PHASE_TONES.locked.c : undefined }}>
            Verrouillé <span style={{ opacity: 0.55 }}>· 50j</span>
          </span>
        </div>
      )}

      {/* Late warning — slim one-liner so the card stays compact */}
      {phase === "late" && lateSince && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 8px",
          background: "linear-gradient(to bottom, rgba(246,213,123,.35), rgba(197,158,63,.4))",
          border: "1.5px solid #c59e3f", borderRadius: 7,
          fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 700,
          color: "#5a3a05", whiteSpace: "nowrap", overflow: "hidden",
        }}>
          <span style={{
            width: 13, height: 13, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(to bottom, #f6d57b, #c59e3f)",
            border: "1.5px solid #9e7b0d", display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: 9, lineHeight: 1,
            textShadow: "1px 1px 1px rgba(0,0,0,.4)",
          }}>!</span>
          Lancé il y a <strong style={{ marginLeft: 2 }}>{lateSince}</strong> — départ tardif
        </div>
      )}
    </div>
  );
}

// =============================================================================
// B — Cartes héraldiques + tabs intelligents + bande des variantes
// =============================================================================

// Variant chip — shows the season type (Standard/Speed/Classic/Hardcore)
function VariantChip({ variant, compact = false }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: compact ? "2px 7px 2px 4px" : "3px 8px 3px 5px",
      borderRadius: 999,
      background: `linear-gradient(to bottom, ${variant.color}, ${variant.colorDark})`,
      border: `1.5px solid ${variant.border}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 1px 2px rgba(0,0,0,.25)",
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      <span style={{
        width: compact ? 12 : 14, height: compact ? 12 : 14,
        color: "#fff", display: "inline-flex",
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,.35))",
      }}>{variant.icon}</span>
      <span style={{
        fontFamily: BFTC_T.font, fontWeight: 800, fontSize: compact ? 9 : 9.5, color: "#fff",
        letterSpacing: ".12em", textTransform: "uppercase",
        textShadow: "1px 1px 1px rgba(0,0,0,.4)",
      }}>{variant.label}</span>
    </span>
  );
}

// Variants strip — 3 chips. Speed/Hardcore are dimmed (« Bientôt » in MVP).
function VariantsStrip() {
  return (
    <div style={{
      padding: "7px 12px 8px",
      borderBottom: "1px solid rgba(60,38,25,.25)",
      background: "linear-gradient(to bottom, rgba(232,212,168,.55), rgba(212,192,148,.7))",
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 5,
      }}>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 8.5, fontWeight: 800,
          letterSpacing: ".22em", color: BFTC_T.inkSoft, textTransform: "uppercase",
        }}>Variantes de saison</span>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 8.5, fontWeight: 700, fontStyle: "italic",
          color: BFTC_T.inkSoft,
        }}>tempo = rythme global</span>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6,
      }}>
        {Object.entries(WORLD_VARIANTS).map(([k, v]) => {
          const off = !v.active;
          return (
            <div key={k} style={{
              position: "relative",
              display: "flex", flexDirection: "row", alignItems: "center",
              gap: 7, padding: "5px 8px 5px 5px",
              background: off ? "rgba(232,212,168,.45)" : "rgba(254,249,240,.7)",
              border: `1.5px solid ${off ? "rgba(60,38,25,.25)" : v.color + "88"}`,
              borderRadius: 9,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.45)",
              opacity: off ? 0.55 : 1,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: off
                  ? "linear-gradient(to bottom, #b8a888, #8c7a5e)"
                  : `linear-gradient(to bottom, ${v.color}, ${v.colorDark})`,
                border: `1.5px solid ${off ? "#6d5838" : v.border}`, color: "#fff",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.3)", flexShrink: 0,
                filter: off ? "saturate(0.4)" : "none",
              }}>
                <span style={{ width: 14, height: 14 }}>{v.icon}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.05 }}>
                <span style={{
                  fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 11,
                  color: BFTC_T.woodBark,
                }}>{v.label}</span>
                <span style={{
                  fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 8.5,
                  color: BFTC_T.inkSoft, letterSpacing: ".04em",
                  fontVariantNumeric: "tabular-nums",
                }}>{v.duration} · {v.tempo}</span>
              </div>
              {off && (
                <span style={{
                  position: "absolute", top: -6, right: -4,
                  padding: "1px 5px", borderRadius: 999,
                  background: "linear-gradient(to bottom, #cdb88a, #8b7355)",
                  border: "1px solid #5d4a32",
                  fontFamily: BFTC_T.font, fontSize: 7.5, fontWeight: 800, color: "#fff",
                  letterSpacing: ".1em", textTransform: "uppercase",
                  textShadow: "1px 1px 1px rgba(0,0,0,.4)",
                  boxShadow: "0 1px 2px rgba(0,0,0,.2)",
                }}>Bientôt</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Tabs — status filter with count badges. Default = open.
function WorldTabs({ active, counts, onChange }) {
  return (
    <div style={{
      display: "flex", padding: "4px 10px 0", gap: 4,
      background: "linear-gradient(to bottom, rgba(212,192,148,.5), rgba(232,212,168,.3))",
      borderBottom: "1.5px solid rgba(60,38,25,.45)",
    }}>
      {Object.entries(STATUS_GROUPS).map(([k, g]) => {
        const isActive = active === k;
        const n = counts[k];
        const empty = n === 0;
        return (
          <button key={k} onClick={() => !empty && onChange(k)} disabled={empty} style={{
            flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "7px 4px 8px",
            background: isActive
              ? "linear-gradient(to bottom, #fef9f0, #e8d4a8)"
              : empty ? "transparent" : "rgba(60,38,25,.06)",
            border: isActive ? "1.5px solid #8b7355" : "1.5px solid transparent",
            borderBottom: isActive ? "1.5px solid #e8d4a8" : "1.5px solid transparent",
            borderRadius: "8px 8px 0 0",
            marginBottom: isActive ? -1.5 : 0,
            color: isActive ? BFTC_T.woodBark : empty ? "rgba(60,38,25,.35)" : BFTC_T.inkSoft,
            fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 10.5,
            letterSpacing: ".08em", textTransform: "uppercase",
            cursor: empty ? "not-allowed" : "pointer", whiteSpace: "nowrap",
            textShadow: isActive ? "0 1px 0 rgba(255,255,255,.5)" : "none",
            transition: "background .15s ease, color .15s ease",
          }}>
            {g.label}
            <span style={{
              minWidth: 17, height: 17, padding: "0 5px",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: isActive
                ? "linear-gradient(to bottom, #f6d57b, #c59e3f)"
                : empty ? "rgba(60,38,25,.1)" : "rgba(60,38,25,.2)",
              border: `1.5px solid ${isActive ? "#9e7b0d" : empty ? "rgba(60,38,25,.18)" : "rgba(60,38,25,.32)"}`,
              borderRadius: 999,
              color: isActive ? "#3a2a00" : empty ? "rgba(60,38,25,.4)" : BFTC_T.inkSoft,
              fontSize: 9.5, fontWeight: 900,
              fontVariantNumeric: "tabular-nums",
            }}>{n}</span>
          </button>
        );
      })}
    </div>
  );
}

// Single icon stat — reused in the card body row
function StatIcon({ icon, value, color = BFTC_T.ink, label }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0 }}>
      <span style={{
        width: 13, height: 13, color: BFTC_T.inkSoft,
        display: "inline-flex", flexShrink: 0,
      }}>{icon}</span>
      <span style={{
        fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 800, color,
        fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
      }}>{value}</span>
      {label && (
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, color: BFTC_T.inkSoft,
          letterSpacing: ".08em", textTransform: "uppercase", whiteSpace: "nowrap",
        }}>{label}</span>
      )}
    </div>
  );
}

function WorldCTA({ status }) {
  if (status === "upcoming") return <PixelBtn variant="info"    size="sm" full>Me prévenir à l'ouverture</PixelBtn>;
  if (status === "full")     return <PixelBtn variant="neutral" size="sm" full disabled>Royaume complet</PixelBtn>;
  if (status === "ended")    return <PixelBtn variant="neutral" size="sm" full>Voir les classements</PixelBtn>;
  if (status === "late")     return <PixelBtn variant="warning" size="sm" full>Rejoindre quand même</PixelBtn>;
  if (status === "locked")   return <PixelBtn variant="neutral" size="sm" full disabled>Inscription close</PixelBtn>;
  return <PixelBtn variant="success" size="sm" full>Rejoindre le royaume</PixelBtn>;
}

function HeraldicWorldCard({ world, onOpen }) {
  const variant = WORLD_VARIANTS[world.variant] || WORLD_VARIANTS.standard;
  const disabled = world.status === "full" || world.status === "ended";
  return (
    <div
      onClick={() => onOpen && onOpen(world)}
      style={{
      position: "relative", opacity: disabled ? 0.8 : 1,
      borderRadius: 14, overflow: "hidden",
      background: "linear-gradient(to bottom, #fef9f0, #f5e6d3)",
      border: "2.5px solid #8b7355",
      boxShadow:
        "0 4px 10px rgba(60,38,25,.18)," +
        "inset 0 2px 0 rgba(255,255,255,.5), inset 0 -10px 16px rgba(60,38,25,.06)",
      flexShrink: 0, cursor: "pointer",
    }}>
      {/* Banner head — crest + name + variant chip */}
      <div style={{
        position: "relative",
        background: `linear-gradient(to right, ${world.crest.field[0]}, ${world.crest.field[1]}cc 60%, rgba(245,230,211,0) 100%), linear-gradient(to bottom, #fef9f0, #f5e6d3)`,
        padding: "7px 10px 7px 56px", minHeight: 46,
        borderBottom: "1.5px solid rgba(60,38,25,.35)",
      }}>
        <div style={{ position: "absolute", left: 9, top: 5 }}>
          <MiniCrest field={world.crest.field} symbol={world.crest.symbol} size={38} ring="#f6d57b"/>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 17, color: "#fff",
              letterSpacing: ".02em", textShadow: "0 2px 3px rgba(0,0,0,.55)",
              lineHeight: 1.05, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{world.name}</div>
            <div style={{
              marginTop: 1, fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 9.5,
              color: "rgba(255,255,255,.78)", textShadow: "0 1px 1px rgba(0,0,0,.4)",
              lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>« {world.tagline} »</div>
          </div>
          <VariantChip variant={variant}/>
        </div>
      </div>

      {/* Body — lifecycle + icon stats + CTA */}
      <div style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 7 }}>
        <WorldLifecycleBar day={world.day} opensIn={world.opensIn} lateSince={world.lateSince} dense/>

        {/* Icon stat row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 6, padding: "4px 8px", borderRadius: 7,
          background: "rgba(60,38,25,.07)",
          border: "1px solid rgba(60,38,25,.12)",
        }}>
          <StatIcon
            icon={ICON_USERS}
            value={world.players ? world.players.toLocaleString("fr-FR") : "—"}
          />
          <span style={{ width: 1, height: 14, background: "rgba(60,38,25,.18)" }}/>
          <StatIcon
            icon={ICON_PULSE}
            value={world.pop}
            color={POP_COLORS[world.pop] || BFTC_T.ink}
          />
          <span style={{ width: 1, height: 14, background: "rgba(60,38,25,.18)" }}/>
          <StatIcon
            icon={ICON_SCROLL}
            value={world.rules[0]}
            color={BFTC_T.ink}
          />
        </div>

        <WorldCTA status={world.status}/>
      </div>
    </div>
  );
}

function WorldArtboardB() {
  const [tab, setTab] = useStateW("open");
  const [selected, setSelected] = useStateW(null);

  const counts = {
    open:   WORLDS.filter(w => STATUS_GROUPS.open.statuses.includes(w.status)).length,
    soon:   WORLDS.filter(w => STATUS_GROUPS.soon.statuses.includes(w.status)).length,
    locked: WORLDS.filter(w => STATUS_GROUPS.locked.statuses.includes(w.status)).length,
  };
  const filtered = WORLDS.filter(w => STATUS_GROUPS[tab].statuses.includes(w.status));

  if (selected) {
    return <WorldDetailLight world={selected} onBack={() => setSelected(null)}/>;
  }

  return (
    <WorldShell tone="light">
      <StatusBar tone="dark"/>
      <WorldHeader
        tone="light"
        count={WORLDS.length}
        title="Royaumes"
        subtitle="Choisissez votre saison — chaque royaume, son tempo"
      />
      <VariantsStrip/>
      <WorldTabs active={tab} counts={counts} onChange={setTab}/>

      {/* Body — natural flex flow so tabs aren't covered */}
      <div style={{
        flex: 1, minHeight: 0,
        padding: "10px 12px",
        display: "flex", flexDirection: "column", gap: 8,
        overflowY: "auto", overflowX: "hidden",
      }}>
        {filtered.map(w => <HeraldicWorldCard key={w.id} world={w} onOpen={setSelected}/>)}
        {filtered.length === 0 && (
          <div style={{
            margin: "20px auto", padding: "16px 20px", textAlign: "center",
            maxWidth: 240,
            fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 12,
            color: BFTC_T.inkSoft,
          }}>« Aucun royaume ne répond à l'appel. »</div>
        )}
        {/* fade-out hint */}
        <div style={{
          position: "sticky", bottom: -10, left: 0, right: 0, height: 30,
          marginTop: -10, flexShrink: 0,
          background: "linear-gradient(to bottom, transparent, #d4c094)",
          pointerEvents: "none",
        }}/>
      </div>
    </WorldShell>
  );
}

// =============================================================================
// B-bis — Détail d'un monde (vue light, alignée sur la doc tempo & lifecycle)
// =============================================================================

// Per-world data overrides for the detail. Lets us show realistic edicts / lord
// names / coalitions without bloating the WORLDS array.
const WORLD_DETAIL = {
  W214: { region: "Marches du Levant", coord: "(247, 312)", lord: "Sire Aldric de Vauclair", coalitions: 12, pvpFrom: "Niv. 5", pillage: "Standard" },
  W218: { region: "Vallée des Saules",  coord: "(108, 094)", lord: "—",                         coalitions: 12, pvpFrom: "Niv. 5", pillage: "Standard" },
  W215: { region: "Plaines Cendrées",   coord: "(412, 058)", lord: "Baron Magnar le Noir",      coalitions: 8,  pvpFrom: "Niv. 3", pillage: "Doublé" },
  W213: { region: "Rivage d'Azur",      coord: "(078, 401)", lord: "Dame Iselle d'Aubrac",      coalitions: 12, pvpFrom: "Niv. 5", pillage: "Standard" },
  W216: { region: "Mont-Vermeil",       coord: "(285, 470)", lord: "Sire Tancrède le Vermeil",  coalitions: 12, pvpFrom: "Niv. 5", pillage: "Standard" },
  W217: { region: "Marais Pourpres",    coord: "(—)",        lord: "—",                         coalitions: 12, pvpFrom: "Niv. 5", pillage: "Standard" },
  W212: { region: "Hauts d'Argent",     coord: "(196, 224)", lord: "Roi Casimir IV — vainqueur", coalitions: 0,  pvpFrom: "—",      pillage: "Lecture seule" },
};

// Tempo axes — each axis has a "speed" (0..1) showing how zippy it feels.
// Standard MVP : compressed-async, so action loops feel fast, structural
// timers (regen) stay slow on purpose.
const TEMPO_AXES = [
  { key: "construction", label: "Construction",  speed: 0.65,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg> },
  { key: "training",     label: "Entraînement",  speed: 0.85,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 6-9 9M9 11l4 4M19 5v4h-4M5 19h4v-4"/><path d="m14.5 14.5 5 5M5 5l14 14"/></svg> },
  { key: "travel",       label: "Voyage",        speed: 0.62,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/></svg> },
  { key: "capture",      label: "Fenêtre capture", speed: 0.42,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> },
  { key: "barbarianRegen", label: "Régen barbare", speed: 0.15,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2 8 5 5 6l3 1 1 3 1-3 3-1-3-1zM18 2l-1 3-3 1 3 1 1 3 1-3 3-1-3-1zM6 12c0 4 3 8 6 9 3-1 6-5 6-9-2 1-4 1-6-1-2 2-4 2-6 1z"/></svg> },
  { key: "production",   label: "Production",     speed: 0.85,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M14 7h7v7"/></svg> },
];

// Speed buckets — 4 thresholds, 4 labels, 4 hues.
function speedBucket(speed) {
  if (speed < 0.25) return { label: "Très lent", color: "#c0392b" };
  if (speed < 0.50) return { label: "Normal",    color: "#a67c52" };
  if (speed < 0.75) return { label: "Rapide",    color: "#9e7b0d" };
  return                  { label: "Très rapide", color: "#4a8c2a" };
}

// One axis row — icon + label + qualitative speed label + segmented bar (4 zones).
function TempoAxisRow({ axis }) {
  const bucket = speedBucket(axis.speed);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "26px 1fr auto", alignItems: "center",
      columnGap: 8, rowGap: 4,
      padding: "8px 4px 9px",
      borderBottom: "1px dashed rgba(60,38,25,.22)",
    }}>
      {/* Icon spans both rows */}
      <span style={{
        gridRow: "1 / span 2",
        width: 26, height: 26, borderRadius: 7,
        background: "linear-gradient(to bottom, #cdb88a, #8b7355)",
        border: "1.5px solid #5d4a32",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "#fff", boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 1px 2px rgba(60,38,25,.25)",
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,.3))",
      }}>
        <span style={{ width: 15, height: 15, display: "inline-flex" }}>{axis.icon}</span>
      </span>
      {/* Label */}
      <span style={{
        fontFamily: BFTC_T.font, fontSize: 12, fontWeight: 800, color: BFTC_T.ink,
      }}>{axis.label}</span>
      {/* Qualitative pill on the right */}
      <span style={{
        justifySelf: "end",
        display: "inline-flex", alignItems: "center",
        padding: "2px 8px", borderRadius: 999,
        background: `linear-gradient(to bottom, ${bucket.color}, ${bucket.color}dd)`,
        border: `1.5px solid ${bucket.color}`,
        fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 9.5, color: "#fff",
        letterSpacing: ".08em", textTransform: "uppercase",
        textShadow: "1px 1px 1px rgba(0,0,0,.4)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 1px 2px rgba(0,0,0,.15)",
        whiteSpace: "nowrap",
      }}>{bucket.label}</span>
      {/* Segmented bar full-width on row 2 */}
      <div style={{
        gridColumn: "2 / span 2",
        position: "relative", height: 8,
        display: "flex", gap: 2,
      }}>
        {[0, 1, 2, 3].map(i => {
          const segMin = i * 0.25;
          const segMax = (i + 1) * 0.25;
          // How filled is this segment (0..1)
          const fillPct = Math.max(0, Math.min(1, (axis.speed - segMin) / 0.25));
          return (
            <div key={i} style={{
              flex: 1, position: "relative",
              background: "rgba(60,38,25,.18)",
              border: "1.5px solid rgba(60,38,25,.45)",
              borderRadius: 4, overflow: "hidden",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,.22)",
            }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${fillPct * 100}%`,
                background: `linear-gradient(to bottom, ${bucket.color}, ${bucket.color}cc)`,
                boxShadow: fillPct > 0 ? `inset 0 1px 0 rgba(255,255,255,.35), 0 0 4px ${bucket.color}66` : "none",
              }}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle({ children, subtitle }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(60,38,25,.45), transparent)" }}/>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 900,
          color: BFTC_T.woodBark, letterSpacing: ".24em", textTransform: "uppercase",
          textShadow: "0 1px 0 rgba(255,255,255,.45)", whiteSpace: "nowrap",
        }}>{children}</span>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(to left, rgba(60,38,25,.45), transparent)" }}/>
      </div>
      {subtitle && (
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 9.5, fontStyle: "italic", color: BFTC_T.inkSoft,
          textAlign: "center", letterSpacing: ".02em",
        }}>{subtitle}</div>
      )}
    </div>
  );
}

function ParchmentCard({ children, style }) {
  return (
    <div style={{
      background: "linear-gradient(to bottom, #fef9f0, #f3e3c2)",
      border: "2px solid #8b7355", borderRadius: 12,
      boxShadow: "0 2px 6px rgba(60,38,25,.18), inset 0 1px 0 rgba(255,255,255,.5), inset 0 -8px 14px rgba(60,38,25,.05)",
      padding: 10, ...style,
    }}>{children}</div>
  );
}

function EdictRow({ k, v, tone }) {
  const tones = {
    danger:  { c: "#7d1e15", bg: "rgba(192,57,43,.1)",  bd: "rgba(192,57,43,.3)" },
    info:    { c: "#1f5288", bg: "rgba(91,155,213,.1)", bd: "rgba(91,155,213,.3)" },
    success: { c: "#4a8c2a", bg: "rgba(110,191,73,.12)", bd: "rgba(110,191,73,.32)" },
    warn:    { c: "#9e7b0d", bg: "rgba(246,213,123,.18)", bd: "rgba(158,123,13,.32)" },
    plain:   { c: BFTC_T.ink, bg: "transparent", bd: "transparent" },
  };
  const t = tones[tone || "plain"];
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "5px 4px",
      borderBottom: "1px dashed rgba(60,38,25,.22)",
      fontFamily: BFTC_T.font,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: BFTC_T.inkSoft,
        letterSpacing: ".1em", textTransform: "uppercase",
      }}>{k}</span>
      <span style={{
        fontSize: 11, fontWeight: 800, color: t.c,
        padding: tone && tone !== "plain" ? "2px 8px" : "0",
        background: t.bg, border: tone && tone !== "plain" ? `1px solid ${t.bd}` : "none",
        borderRadius: 999, whiteSpace: "nowrap",
      }}>{v}</span>
    </div>
  );
}

function LifecycleHero({ world }) {
  return (
    <ParchmentCard>
      <SectionTitle subtitle="Ce monde dure 60 jours.">Cycle de saison</SectionTitle>
      <WorldLifecycleBar day={world.day} opensIn={world.opensIn} lateSince={world.lateSince}/>
    </ParchmentCard>
  );
}

function WorldDetailLight({ world, onBack }) {
  const variant = WORLD_VARIANTS[world.variant] || WORLD_VARIANTS.standard;
  const detail = WORLD_DETAIL[world.id] || {};

  return (
    <WorldShell tone="light">
      <StatusBar tone="dark"/>

      {/* Hero header — dyed banner with crest color */}
      <div style={{
        position: "relative",
        background: `linear-gradient(135deg, ${world.crest.field[0]} 0%, ${world.crest.field[1]} 100%)`,
        padding: "4px 14px 12px",
        borderBottom: "3px solid #3c2619",
        boxShadow: "0 4px 12px rgba(60,38,25,.35), inset 0 -10px 22px rgba(0,0,0,.25)",
        flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle at 30% 50%, #fff 1px, transparent 1.5px)",
          backgroundSize: "26px 26px",
        }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, position: "relative" }}>
          <button onClick={onBack} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(0,0,0,.32)", border: "1.5px solid rgba(255,255,255,.28)",
            borderRadius: 8, padding: "3px 10px 3px 7px",
            color: "#fff", fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 11,
            letterSpacing: ".08em", cursor: "pointer", textShadow: "0 1px 1px rgba(0,0,0,.5)",
          }}><span style={{ fontSize: 14, lineHeight: 1 }}>‹</span>Royaumes</button>
          <div style={{ display: "inline-flex", gap: 6 }}>
            {world.status !== "open" && <StatusTag status={world.status} tag={world.tag}/>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          <MiniCrest field={world.crest.field} symbol={world.crest.symbol} size={50} ring="#f6d57b"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 22, color: "#fff",
              letterSpacing: ".02em", textShadow: "0 2px 4px rgba(0,0,0,.55)",
              lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{world.name}</div>
            <div style={{
              marginTop: 4, display: "flex", gap: 8, alignItems: "center",
              fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 800,
              color: "rgba(255,255,255,.9)", letterSpacing: ".1em", textTransform: "uppercase",
              textShadow: "0 1px 1px rgba(0,0,0,.5)",
            }}>
              <span>{world.id}</span>
              <span style={{ opacity: 0.6 }}>·</span>
              <span style={{ fontStyle: "italic", textTransform: "none", letterSpacing: ".02em", fontWeight: 700 }}>{detail.region || ""}</span>
            </div>
            <div style={{
              marginTop: 3, fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 10.5,
              color: "rgba(255,255,255,.85)", textShadow: "0 1px 1px rgba(0,0,0,.45)",
              lineHeight: 1.2,
            }}>« {world.tagline} »</div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{
        flex: 1, minHeight: 0, padding: "10px 12px 80px",
        display: "flex", flexDirection: "column", gap: 9,
        overflowY: "auto", overflowX: "hidden",
      }}>
        {/* 1. Lifecycle */}
        <LifecycleHero world={world}/>

        {/* 2. Tempo — icon + qualitative pill + segmented bar per axis */}
        <ParchmentCard>
          <SectionTitle>Rythme du monde</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {TEMPO_AXES.map(a => <TempoAxisRow key={a.key} axis={a}/>)}
          </div>
        </ParchmentCard>

        {/* 3. Édits du royaume */}
        <ParchmentCard>
          <SectionTitle subtitle="Règles propres à ce monde (ajustables par le héraut).">Édits du royaume</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <EdictRow k="Seigneur fondateur" v={detail.lord || "—"}/>
            <EdictRow k="PvP libre dès" v={detail.pvpFrom || "Niv. 5"} tone="danger"/>
            <EdictRow k="Coalitions" v={detail.coalitions ? `${detail.coalitions} max` : "—"} tone="info"/>
            <EdictRow k="Pillage" v={detail.pillage || "Standard"} tone={detail.pillage === "Doublé" ? "warn" : "plain"}/>
            <EdictRow k="Multi-monde" v="Autorisé" tone="success"/>
            <EdictRow k="Carte" v="500 × 500"/>
          </div>
        </ParchmentCard>

        {/* 4. Garde-fous absolus */}
        <ParchmentCard style={{ background: "linear-gradient(to bottom, #f5e6d3, #e8d4a8)" }}>
          <SectionTitle subtitle="Le tempo ne touche jamais à ces règles structurelles.">Garde-fous absolus</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { ico: "⚓", k: "Bouclier débutant", v: "48 h temps réel" },
              { ico: "⚔", k: "Ratios attaque / défense", v: "Fixes" },
              { ico: "♟", k: "Coûts en population", v: "Fixes" },
              { ico: "÷", k: "Règle puissance ÷ 3", v: "Anti-snowball" },
              { ico: "✥", k: "Bonus/malus de style", v: "Identiques" },
            ].map(g => (
              <div key={g.k} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "3px 7px", borderRadius: 6,
                background: "rgba(60,38,25,.05)",
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(to bottom, #cdb88a, #8b7355)",
                  border: "1.5px solid #5d4a32", color: "#fff",
                  fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 11,
                  textShadow: "1px 1px 1px rgba(0,0,0,.4)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.35)",
                }}>{g.ico}</span>
                <span style={{
                  flex: 1, fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 700,
                  color: BFTC_T.ink,
                }}>{g.k}</span>
                <span style={{
                  fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 800,
                  color: BFTC_T.inkSoft, fontStyle: "italic",
                }}>{g.v}</span>
              </div>
            ))}
          </div>
        </ParchmentCard>

        {/* 5. Fin de saison */}
        <ParchmentCard>
          <SectionTitle subtitle="Reset complet du royaume, hors cosmétiques.">Fin de saison · J+60</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 5 }}>
            {[
              { ico: <img src={C_W("crown")} alt="" style={{ width: 22, height: 22 }}/>, k: "Titre", v: `Vainqueur de ${world.name}` },
              { ico: <span style={{ fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 18, color: "#fff", textShadow: "0 1px 1px rgba(0,0,0,.45)" }}>{world.crest.symbol}</span>, k: "Bannière", v: "Héraldique" },
              { ico: <span style={{ fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 16, color: "#fff", textShadow: "0 1px 1px rgba(0,0,0,.45)" }}>★</span>, k: "Badge", v: "Permanent" },
            ].map((r, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 4, padding: "7px 4px 6px", borderRadius: 9,
                background: "rgba(60,38,25,.06)",
                border: "1px solid rgba(60,38,25,.2)",
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(to bottom, ${world.crest.field[0]}, ${world.crest.field[1]})`,
                  border: "1.5px solid #3c2619",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.3)",
                }}>{r.ico}</div>
                <span style={{
                  fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 800,
                  color: BFTC_T.inkSoft, letterSpacing: ".14em", textTransform: "uppercase",
                }}>{r.k}</span>
                <span style={{
                  fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 700,
                  color: BFTC_T.ink, textAlign: "center", lineHeight: 1.15,
                  fontStyle: "italic",
                }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 3, fontFamily: BFTC_T.font, fontSize: 9.5, fontStyle: "italic",
            color: BFTC_T.inkSoft, lineHeight: 1.3, textAlign: "center",
          }}>
            Pas de carry-over de ressources, couronnes ou progression — chaque saison est une page blanche.
          </div>
        </ParchmentCard>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "10px 12px 14px",
        background: "linear-gradient(to top, rgba(212,192,148,1) 60%, rgba(212,192,148,0))",
      }}>
        <WorldCTA status={world.status}/>
      </div>
    </WorldShell>
  );
}

// =============================================================================
// C — Détail d'un monde (focus, dark — exploration alternative)
// =============================================================================

// Miniature world map rendered with SVG — abstracted plains + dots for villages
function MiniMap({ field, accent = "#f6d57b" }) {
  // Build a deterministic dot field
  const dots = [];
  for (let i = 0; i < 26; i++) {
    const x = 8 + ((i * 37) % 84);
    const y = 8 + ((i * 53) % 84);
    const sz = (i % 5 === 0) ? 4 : (i % 3 === 0 ? 3 : 2);
    const c = (i % 7 === 0) ? accent : (i % 4 === 0 ? "#6ebf49" : "rgba(255,255,255,.4)");
    dots.push({ x, y, sz, c });
  }
  return (
    <div style={{
      position: "relative", width: "100%", aspectRatio: "1 / 1",
      borderRadius: 10, overflow: "hidden",
      background: `radial-gradient(ellipse at 40% 40%, ${field[0]}, ${field[1]})`,
      border: "2.5px solid #3c2619",
      boxShadow: "inset 0 2px 0 rgba(255,255,255,.2), inset 0 -10px 18px rgba(0,0,0,.25)",
    }}>
      {/* Topographic rings */}
      <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25 }}>
        <circle cx="40" cy="55" r="22" stroke="#fff" strokeWidth="0.5" fill="none"/>
        <circle cx="40" cy="55" r="14" stroke="#fff" strokeWidth="0.5" fill="none"/>
        <circle cx="70" cy="30" r="10" stroke="#fff" strokeWidth="0.5" fill="none"/>
        <circle cx="70" cy="30" r="5"  stroke="#fff" strokeWidth="0.5" fill="none"/>
        <path d="M 0,70 Q 30,60 50,68 T 100,72" stroke="#fff" strokeWidth="0.5" fill="none"/>
      </svg>
      {/* Village dots */}
      {dots.map((d, i) => (
        <span key={i} style={{
          position: "absolute", left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%,-50%)",
          width: d.sz, height: d.sz, borderRadius: "50%",
          background: d.c, boxShadow: `0 0 5px ${d.c}`,
        }}/>
      ))}
      {/* Crown marker = my capital */}
      <div style={{
        position: "absolute", left: "42%", top: "52%", transform: "translate(-50%,-50%)",
        width: 18, height: 18, borderRadius: "50%",
        background: "linear-gradient(to bottom,#f6d57b,#c59e3f)",
        border: "2px solid #9e7b0d",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 12px rgba(241,196,15,.7)",
        fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 10, color: "#3a2a00",
      }}>♔</div>
    </div>
  );
}

function StatPair({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{
        fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, color: BFTC_T.inkSoft,
        letterSpacing: ".22em", textTransform: "uppercase",
      }}>{label}</span>
      <span style={{
        fontFamily: BFTC_T.font, fontSize: 15, fontWeight: 800,
        color: valueColor || BFTC_T.ink, fontVariantNumeric: "tabular-nums",
      }}>{value}</span>
    </div>
  );
}

function WorldArtboardC() {
  const world = WORLDS[0]; // Aubeforge featured
  return (
    <WorldShell>
      <StatusBar/>

      {/* Header — banner-style, dyed with crest colors */}
      <div style={{
        position: "relative",
        background: `linear-gradient(135deg, ${world.crest.field[0]} 0%, ${world.crest.field[1]} 100%)`,
        padding: "10px 14px 14px", paddingTop: 6,
        borderBottom: "3px solid #3c2619",
        boxShadow: "0 6px 16px rgba(0,0,0,.45), inset 0 -10px 22px rgba(0,0,0,.3)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(0,0,0,.35)", border: "1.5px solid rgba(255,255,255,.25)",
            borderRadius: 8, padding: "4px 10px 4px 8px",
            color: "#fff", fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 11,
            letterSpacing: ".08em", cursor: "pointer", textShadow: "0 1px 1px rgba(0,0,0,.4)",
          }}><span style={{ fontSize: 14, lineHeight: 1 }}>‹</span>Royaumes</button>
          <StatusTag status={world.status} tag={world.tag}/>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <MiniCrest field={world.crest.field} symbol={world.crest.symbol} size={54} ring="#f6d57b"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 24, color: "#fff",
              letterSpacing: ".02em", textShadow: "0 2px 4px rgba(0,0,0,.55)",
              lineHeight: 1,
            }}>{world.name}</div>
            <div style={{
              marginTop: 3, fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 11.5,
              color: "rgba(255,255,255,.85)", textShadow: "0 1px 2px rgba(0,0,0,.4)",
            }}>« Là où les vassaux fidèles bâtissent leur légende. »</div>
          </div>
        </div>
      </div>

      {/* Map + key stats card */}
      <div style={{
        margin: "12px 14px 0", padding: 12,
        background: "linear-gradient(to bottom, #fef9f0, #e8d4a8)",
        border: "3px solid #3c2619", borderRadius: 14,
        boxShadow: "0 6px 16px rgba(0,0,0,.3), inset 0 2px 0 rgba(255,255,255,.4)",
        display: "flex", gap: 12,
      }}>
        <div style={{ width: 130 }}>
          <MiniMap field={world.crest.field}/>
          <div style={{
            marginTop: 5, textAlign: "center",
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, color: BFTC_T.inkSoft,
            letterSpacing: ".18em", textTransform: "uppercase",
          }}>Carte (7, 12)</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}>
          <StatPair label="Vassaux"  value={world.players.toLocaleString("fr-FR")}/>
          <StatPair label="Densité"  value={<PopBar pop={world.pop}/>}/>
          <StatPair label="Saison"   value={world.season}/>
          <StatPair label="Vitesse"  value={<SpeedBadge speed={world.speed}/>}/>
        </div>
      </div>

      {/* Rules — pergamint list */}
      <div style={{
        margin: "10px 14px 0", padding: "10px 12px",
        background: "rgba(60,38,25,.4)", border: "1.5px solid rgba(240,224,192,.18)",
        borderRadius: 10, boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
      }}>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, color: "rgba(240,224,192,.55)",
          letterSpacing: ".24em", textTransform: "uppercase", marginBottom: 6,
        }}>Édits du royaume</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            { k: "Premier seigneur", v: "Sire Aldric" },
            { k: "Coalitions",       v: "Autorisées · 12 max" },
            { k: "PvP",              v: "Libre à partir de Niv. 5" },
            { k: "Pillage",          v: "Standard" },
          ].map(r => (
            <div key={r.k} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 700, color: "#f0e0c0",
              padding: "3px 0",
              borderBottom: "1px dashed rgba(240,224,192,.18)",
            }}>
              <span style={{ color: "rgba(240,224,192,.6)" }}>{r.k}</span>
              <span style={{ textShadow: "0 1px 1px rgba(0,0,0,.4)" }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: "absolute", left: 14, right: 14, bottom: 16,
        display: "flex", gap: 8,
      }}>
        <PixelBtn variant="neutral" size="lg" style={{ flex: "0 0 auto" }}>
          ★
        </PixelBtn>
        <PixelBtn variant="success" size="lg" style={{ flex: 1 }}>
          Rejoindre le royaume
        </PixelBtn>
      </div>
    </WorldShell>
  );
}

Object.assign(window, {
  WorldArtboardA, WorldArtboardB, WorldArtboardC,
});
