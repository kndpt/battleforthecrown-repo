/* global React, BFTC_T, PLAYER, PhoneA, VillageTierSprite, tierFromPower, RoleTag */
/* Multi-village management bottom sheet.
   Same chrome as the Fiche du Seigneur "Villages" tab, expanded with per-village
   activity vision: build queue, troop training, lord training, plus alerts.
   Two variants explored side by side. */

const { useState: useStateMV } = React;

const ASSET_MV = "assets";
const I_MV = (n) => `${ASSET_MV}/icons/${n}.png`;
const C_MV = (n) => `${ASSET_MV}/casual-icons/${n}.png`;
const B_MV = (n) => `${ASSET_MV}/buildings/${n}.png`;
const A_MV = (n) => `${ASSET_MV}/army/${n}.png`;

// =============================================================================
// Rich village data — adds queues + alerts on top of the basic PLAYER.villages.
// =============================================================================

const VILLAGES_RICH = [
  {
    id: "v1", name: "Kelvinor", role: "Capitale", capitale: true, active: true,
    level: 5, power: "2 480", coords: "(7,12)",
    resources: {
      wood:  { n: 4500, max: 8000 },
      stone: { n: 4300, max: 8000 },
      iron:  { n: 5550, max: 6000 }, // near full → gold warning bar
      pop:   { n: 174,  max: 300  },
    },
    builds: [
      { target: "stone",    name: "Camp pierre",  to: 4, eta: "1:23",  progress: 0.62 },
      { target: "barracks", name: "Caserne",      to: 3, eta: "12:40", progress: 0.04 },
    ],
    troops: [
      { unit: "militia", label: "Milicien", count: 25, eta: "0:45", progress: 0.45 },
      { unit: "archer",  label: "Archer",   count: 10, eta: "3:20", progress: 0.02 },
    ],
    lords: [],
    alert: { kind: "attack", msg: "Attaque entrante", eta: "2:15" },
  },
  {
    id: "v2", name: "Vald'Or", role: "Économique",
    level: 3, power: "980", coords: "(11,4)",
    resources: {
      wood:  { n: 2200, max: 4000 },
      stone: { n: 1850, max: 4000 },
      iron:  { n: 980,  max: 3000 },
      pop:   { n: 92,   max: 180  },
    },
    builds: [
      { target: "wood", name: "Bûcherons", to: 4, eta: "8:30", progress: 0.18 },
    ],
    troops: [],
    lords: [
      { name: "Sieur Aldred", eta: "6:12", progress: 0.55 },
    ],
    alert: null,
  },
  {
    id: "v3", name: "Pierre-Noire", role: "Offensif", role2: "Défensif",
    level: 3, power: "790", coords: "(2,18)",
    resources: {
      wood:  { n: 1100, max: 4000 },
      stone: { n: 2700, max: 4000 },
      iron:  { n: 1450, max: 3000 },
      pop:   { n: 168,  max: 180  }, // near full → gold warning bar
    },
    builds: [],
    troops: [
      { unit: "squire", label: "Écuyer", count: 6, eta: "4:50", progress: 0.72 },
    ],
    lords: [],
    alert: { kind: "attack", msg: "Attaque entrante", eta: "0:50" },
  },
];

// Compact number formatter for the resource pills ("4.5K", "174", "12.3K").
function fmtK(n) {
  if (n >= 10000) return Math.round(n / 1000) + "K";
  if (n >= 1000)  return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// =============================================================================
// Inline SVG glyphs for queue chips (the design system has no hammer/swords
// PNGs; small SVGs match the wood + parch palette and stay crisp at 14–16px).
// =============================================================================

function HammerGlyph({ size = 14, color = "#fef9f0" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="3" width="11" height="5" rx="1.4"
            fill={color} stroke="#1f1308" strokeWidth="1"/>
      <rect x="1.5" y="5" width="11" height="1.6" fill="#1f1308" opacity=".22"/>
      <rect x="6" y="7.5" width="2.2" height="7" rx=".4"
            fill="#7a5a32" stroke="#1f1308" strokeWidth=".8"/>
    </svg>
  );
}

function SwordsGlyph({ size = 14, color = "#fef9f0" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 13.5 L11 5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M13.5 13.5 L5 5"  stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* hilts */}
      <path d="M10.2 3.5 L13 3.5 L13 6.3 Z" fill={color} stroke="#1f1308" strokeWidth=".5"/>
      <path d="M5.8 3.5 L3 3.5 L3 6.3 Z"    fill={color} stroke="#1f1308" strokeWidth=".5"/>
      {/* guards */}
      <rect x="1.5" y="13" width="3" height="1.6" rx=".4" fill="#7a5a32" stroke="#1f1308" strokeWidth=".4"/>
      <rect x="11.5" y="13" width="3" height="1.6" rx=".4" fill="#7a5a32" stroke="#1f1308" strokeWidth=".4"/>
    </svg>
  );
}

function HelmGlyph({ size = 14, color = "#f6d57b" }) {
  // Knight helmet — distinguishes "lord/seigneur" from generic troops.
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 11 C3 6 5 4 8 4 C11 4 13 6 13 11 L13 13 L3 13 Z"
            fill={color} stroke="#1f1308" strokeWidth="1"/>
      <rect x="4" y="8" width="8" height="1.4" fill="#1f1308" opacity=".55"/>
      <rect x="4" y="10.2" width="8" height=".8" fill="#1f1308" opacity=".3"/>
      <path d="M8 2 L8 4" stroke="#1f1308" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="8" cy="1.7" r="1.3" fill="#c93a2e" stroke="#1f1308" strokeWidth=".5"/>
    </svg>
  );
}

function AlertGlyph({ size = 12, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.5 L15 14 L1 14 Z" fill="#c93a2e" stroke="#1f1308" strokeWidth="1"/>
      <rect x="7" y="5.5" width="2" height="4.5" fill={color}/>
      <rect x="7" y="11"  width="2" height="1.6" fill={color}/>
    </svg>
  );
}

function ClockGlyph({ size = 10, color = "#cdb88a" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="5" fill="none" stroke={color} strokeWidth="1.4"/>
      <path d="M6 3 L6 6 L8.5 7.5" stroke={color} strokeWidth="1.4"
            strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// =============================================================================
// Activity chip — one of three queues. Empty → muted parchment; active → wood.
// =============================================================================

// One-line badge per queue: icon medallion + timer. No count.
// Empty queue → faded icon, no timer.
function ActivityChip({ kind, eta }) {
  const empty = !eta;
  const palettes = {
    build:  { glyph: <HammerGlyph color="#3d2f1f" size={11}/>, label: "Chantier"  },
    troops: { glyph: <SwordsGlyph color="#3d2f1f" size={11}/>, label: "Formation" },
    lords:  { glyph: <HelmGlyph   color="#a07118" size={11}/>, label: "Seigneur"  },
  };
  const p = palettes[kind];

  return (
    <div title={empty ? `${p.label} : aucune` : `${p.label} · ${eta}`}
         style={{
      flex: 1, display: "flex", alignItems: "center", gap: 4,
      padding: "2px 7px 2px 3px", borderRadius: 999, minWidth: 0,
      height: 20,
      background: empty
        ? "linear-gradient(to bottom, rgba(255,255,255,.35), rgba(213,182,128,.25))"
        : "linear-gradient(to bottom, #fef9f0, #ebd9af)",
      border: `1.2px solid ${empty ? "rgba(166,124,82,.4)" : "#a67c52"}`,
      boxShadow: empty
        ? "none"
        : "inset 0 1px 0 rgba(255,255,255,.55), 0 1px 0 rgba(0,0,0,.08)",
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 999, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: empty
          ? "rgba(166,124,82,.18)"
          : "linear-gradient(to bottom, #fff4cf, #e1c378)",
        border: `1px solid ${empty ? "rgba(166,124,82,.3)" : "#a07118"}`,
        opacity: empty ? .55 : 1,
      }}>{p.glyph}</span>
      <span style={{
        flex: 1, minWidth: 0,
        fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 800,
        letterSpacing: ".02em",
        color: empty ? BFTC_T.inkSoft : BFTC_T.ink,
        textShadow: empty ? "none" : "0 1px 0 rgba(255,255,255,.4)",
        fontVariantNumeric: "tabular-nums", lineHeight: 1,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        textAlign: empty ? "left" : "right",
      }}>{empty ? "—" : eta}</span>
    </div>
  );
}

// =============================================================================
// Resource chip — light parchment pill, icon + compact value, thin stock bar
// underneath. Bar turns gold when ≥90% (near full). Compact variant for the
// population gauge (icon + value only, no bar — smaller footprint).
// =============================================================================

const RES_META = {
  wood:  { icon: "assets/resources/wood.png",       label: "Bois"       },
  stone: { icon: "assets/resources/stone.png",      label: "Pierre"     },
  iron:  { icon: "assets/resources/iron.png",       label: "Fer"        },
  pop:   { icon: "assets/resources/population.png", label: "Population" },
};

function ResourceChip({ kind, n, max, compact = false }) {
  const ratio = Math.max(0, Math.min(1, n / max));
  const nearFull = ratio >= 0.9;
  const meta = RES_META[kind];
  const titleStr = `${meta.label} · ${n.toLocaleString("fr-FR")} / ${max.toLocaleString("fr-FR")}`;

  if (compact) {
    return (
      <div title={titleStr} style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "3px 8px 3px 4px",
        borderRadius: 999,
        background: nearFull
          ? "linear-gradient(to bottom, #fff3cf, #e8c878)"
          : "linear-gradient(to bottom, #fef9f0, #ebd9af)",
        border: `1.5px solid ${nearFull ? "var(--game-gold-border)" : "#a67c52"}`,
        boxShadow: nearFull
          ? "inset 0 1px 0 rgba(255,255,255,.55), 0 0 6px rgba(246,213,123,.55)"
          : "inset 0 1px 0 rgba(255,255,255,.55), 0 1px 0 rgba(0,0,0,.08)",
        flexShrink: 0,
      }}>
        <img src={meta.icon} alt="" style={{
          width: 14, height: 14, flexShrink: 0,
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,.25))",
        }}/>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 800,
          color: nearFull ? "#7a4d05" : BFTC_T.ink,
          textShadow: "0 1px 0 rgba(255,255,255,.45)",
          fontVariantNumeric: "tabular-nums", lineHeight: 1,
          whiteSpace: "nowrap",
        }}>{fmtK(n)}</span>
      </div>
    );
  }

  return (
    <div title={titleStr} style={{
      flex: 1, minWidth: 0,
      padding: "2px 7px 4px 4px",
      borderRadius: 9,
      background: "linear-gradient(to bottom, #fef9f0, #ebd9af)",
      border: `1.5px solid ${nearFull ? "var(--game-gold-border)" : "#a67c52"}`,
      boxShadow: nearFull
        ? "inset 0 1px 0 rgba(255,255,255,.55), 0 0 6px rgba(246,213,123,.5)"
        : "inset 0 1px 0 rgba(255,255,255,.55), 0 1px 0 rgba(0,0,0,.08)",
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <img src={meta.icon} alt="" style={{
          width: 14, height: 14, flexShrink: 0,
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,.25))",
        }}/>
        <span style={{
          flex: 1, minWidth: 0,
          fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 800,
          color: nearFull ? "#7a4d05" : BFTC_T.ink,
          textShadow: "0 1px 0 rgba(255,255,255,.45)",
          fontVariantNumeric: "tabular-nums", lineHeight: 1,
          textAlign: "right", whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>{fmtK(n)}</span>
      </div>
      <div style={{
        height: 3, borderRadius: 2,
        background: "rgba(93,74,50,.22)", overflow: "hidden",
        boxShadow: "inset 0 1px 1px rgba(0,0,0,.22)",
      }}>
        <div style={{
          width: `${Math.max(2, Math.round(ratio * 100))}%`,
          height: "100%",
          background: nearFull
            ? "linear-gradient(to bottom, #ffcd55, #b8740d)"
            : "linear-gradient(to bottom, #c69649, #7a5a22)",
          boxShadow: nearFull ? "0 0 4px rgba(246,213,123,.7)" : "none",
        }}/>
      </div>
    </div>
  );
}

function ResourceRow({ resources }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "stretch" }}>
      <ResourceChip kind="wood"  n={resources.wood.n}  max={resources.wood.max}/>
      <ResourceChip kind="stone" n={resources.stone.n} max={resources.stone.max}/>
      <ResourceChip kind="iron"  n={resources.iron.n}  max={resources.iron.max}/>
      <ResourceChip kind="pop"   n={resources.pop.n}   max={resources.pop.max} compact/>
    </div>
  );
}

// =============================================================================
// Alert pill — red banner attached to the bottom of a card.
// =============================================================================

function AlertPill({ alert, dense = false }) {
  if (!alert) return null;
  const isAttack = alert.kind === "attack";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7,
      padding: dense ? "4px 8px" : "5px 9px",
      marginTop: dense ? 4 : 6,
      borderRadius: 8,
      background: isAttack
        ? "linear-gradient(to bottom, rgba(201,58,46,.95), rgba(122,24,18,.95))"
        : "linear-gradient(to bottom, rgba(217,151,49,.95), rgba(146,84,17,.95))",
      border: `1.5px solid ${isAttack ? "var(--game-red-border)" : "var(--game-gold-border)"}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 1px 0 rgba(0,0,0,.25)",
    }}>
      <AlertGlyph size={12}/>
      <span style={{
        flex: 1, fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 800,
        color: "#fff", textShadow: "1px 1px 1px rgba(0,0,0,.55)",
        letterSpacing: ".02em",
      }}>{alert.msg}</span>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        padding: "1px 6px", borderRadius: 999,
        background: "rgba(0,0,0,.35)", border: "1px solid rgba(0,0,0,.4)",
        fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800, color: "#fff",
        fontVariantNumeric: "tabular-nums", textShadow: "1px 1px 1px rgba(0,0,0,.55)",
      }}>
        <ClockGlyph size={9} color="#fff"/>{alert.eta}
      </span>
    </div>
  );
}

// =============================================================================
// "Next event" line (variant B) — what completes soonest in this village.
// =============================================================================

function nextEvent(v) {
  const items = [
    ...v.builds.map(b => ({ kind: "build",  ...b })),
    ...v.troops.map(t => ({ kind: "troops", ...t })),
    ...v.lords.map(l  => ({ kind: "lords",  ...l })),
  ];
  if (!items.length) return null;
  // ETA is mm:ss or h:mm — convert to a comparable seconds value.
  const toSec = (eta) => {
    const parts = eta.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  };
  return items.sort((a, b) => toSec(a.eta) - toSec(b.eta))[0];
}

function NextEventRow({ v }) {
  const ev = nextEvent(v);
  if (!ev) {
    return (
      <div style={{
        padding: "5px 9px", borderRadius: 8,
        background: "linear-gradient(to bottom, rgba(0,0,0,.04), rgba(0,0,0,.08))",
        border: "1.5px dashed rgba(93,74,50,.3)",
        fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 700,
        color: BFTC_T.inkSoft, fontStyle: "italic",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ opacity: .6 }}>○</span>
        <span style={{ flex: 1 }}>Aucune activité en cours</span>
      </div>
    );
  }
  const kindMeta = {
    build:  { glyph: <HammerGlyph color="#fef9f0"/>, eyebrow: "Construction",
              name: `${ev.name} → niv. ${ev.to}` },
    troops: { glyph: <SwordsGlyph color="#fef9f0"/>, eyebrow: "Formation",
              name: `${ev.label} ×${ev.count}` },
    lords:  { glyph: <HelmGlyph   color="#f6d57b"/>, eyebrow: "Seigneur",
              name: ev.name },
  }[ev.kind];

  return (
    <div style={{
      padding: "6px 8px 7px", borderRadius: 9,
      background: "linear-gradient(to bottom, rgba(60,38,25,.95), rgba(40,24,14,.95))",
      border: "1.5px solid #1f1308",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.18), 0 1px 0 rgba(0,0,0,.2)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(to bottom, rgba(0,0,0,.45), rgba(0,0,0,.7))",
          border: "1.2px solid rgba(0,0,0,.6)",
        }}>{kindMeta.glyph}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 8, fontWeight: 700,
            letterSpacing: ".26em", color: "#cdb88a", textTransform: "uppercase",
            lineHeight: 1,
          }}>{kindMeta.eyebrow}</div>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 11.5, fontWeight: 800,
            color: "#fef9f0", textShadow: "1px 1px 1px rgba(0,0,0,.5)",
            marginTop: 2, whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis",
          }}>{kindMeta.name}</div>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          padding: "2px 7px", borderRadius: 999,
          background: "rgba(0,0,0,.4)", border: "1px solid rgba(0,0,0,.55)",
          fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 800, color: "#fef9f0",
          textShadow: "1px 1px 1px rgba(0,0,0,.55)", fontVariantNumeric: "tabular-nums",
        }}>
          <ClockGlyph size={10} color="#f6d57b"/>{ev.eta}
        </div>
      </div>
      {/* thin progress bar */}
      <div style={{
        marginTop: 5, height: 4, borderRadius: 4,
        background: "rgba(0,0,0,.45)", overflow: "hidden",
        boxShadow: "inset 0 1px 1px rgba(0,0,0,.6)",
      }}>
        <div style={{
          width: `${Math.max(2, Math.round((ev.progress ?? 0) * 100))}%`,
          height: "100%",
          background: "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 0 6px rgba(246,213,123,.5)",
        }}/>
      </div>
    </div>
  );
}

// =============================================================================
// Village identity row — sprite (with tier badge & crown) + name + meta.
// =============================================================================

function VillageIdentity({ v, dense = false }) {
  const tier = tierFromPower(v.power);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 8, flexShrink: 0,
        background: v.capitale
          ? "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))"
          : "linear-gradient(to bottom, #d9c896, #a67c52)",
        border: `2px solid ${v.capitale ? "var(--game-gold-border)" : "#5d4a32"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        boxShadow: v.capitale
          ? "inset 0 1px 0 rgba(255,255,255,.45), 0 0 8px rgba(246,213,123,.4), 0 1px 0 rgba(0,0,0,.18)"
          : "inset 0 1px 0 rgba(255,255,255,.4), 0 1px 0 rgba(0,0,0,.14)",
      }}>
        <VillageTierSprite tier={tier} size={36} capital={v.capitale}/>
        {v.capitale && (
          <img src={C_MV("crown")} alt="" style={{
            position: "absolute", top: -6, left: "50%",
            transform: "translateX(-50%) rotate(-6deg)",
            width: 14, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.45))",
            pointerEvents: "none",
          }}/>
        )}
        <span style={{
          position: "absolute", bottom: -4, right: -4,
          fontFamily: BFTC_T.font, fontSize: 8, fontWeight: 800,
          background: "linear-gradient(to bottom, #fef9f0, #d9c896)",
          color: "#3d2f1f", border: "1.4px solid #5d4a32",
          borderRadius: 999, padding: "0 4px", lineHeight: 1.25,
          letterSpacing: ".06em",
          boxShadow: "0 1px 0 rgba(0,0,0,.22)",
        }}>T{tier}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 14, color: BFTC_T.ink,
            letterSpacing: ".01em",
          }}>{v.name}</span>
          {v.active && (
            <span style={{
              fontFamily: BFTC_T.font, fontSize: 7.5, fontWeight: 800,
              letterSpacing: ".22em", padding: "1px 5px", borderRadius: 999,
              background: "linear-gradient(to bottom, var(--game-green-light), var(--game-green-dark))",
              border: "1.2px solid var(--game-green-border)", color: "#fff",
              textShadow: "1px 1px 1px rgba(0,0,0,.45)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.35)",
              textTransform: "uppercase",
            }}>Ici</span>
          )}
          <RoleTag role={v.role} size="sm"/>
          {v.role2 && <RoleTag role={v.role2} size="sm"/>}
        </div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 10.5, color: BFTC_T.inkSoft,
          display: "flex", gap: 7, marginTop: 1, alignItems: "center",
          flexWrap: "wrap",
        }}>
          <span style={{ whiteSpace: "nowrap" }}>Niv. <b style={{ color: BFTC_T.ink }}>{v.level}</b></span>
          <span style={{ opacity: .4 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
            <img src={I_MV("army-power")} alt="" style={{ width: 11 }}/>
            <b style={{ color: BFTC_T.ink, fontVariantNumeric: "tabular-nums" }}>{v.power.replace(/\s/g, "\u00a0")}</b>
          </span>
          <span style={{ opacity: .4 }}>·</span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
          }}>
            <img src={I_MV("position")} alt="" style={{ width: 10, opacity: .65 }}/>
            {v.coords}
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Village card — variant A (compact) and variant B (detailed).
// =============================================================================

function VillageCard({ v, variant, onSelect }) {
  const buildEta = v.builds[0]?.eta;
  const troopEta = v.troops[0]?.eta;
  const lordEta  = v.lords[0]?.eta;

  const accent = v.active;
  return (
    <button onClick={onSelect} style={{
      textAlign: "left", cursor: "pointer", width: "100%",
      padding: "7px 9px 8px",
      background: v.capitale
        ? "linear-gradient(to right, #fff3d6 0%, #fef9f0 45%, #ebd9af 100%)"
        : "linear-gradient(to bottom, #fef9f0, #ebd9af)",
      border: `2px solid ${v.capitale ? "var(--game-gold-border)" : "#a67c52"}`,
      borderRadius: 12,
      boxShadow: accent
        ? "inset 0 1px 0 rgba(255,255,255,.5), 0 0 0 2px rgba(63,123,55,.45), 0 2px 0 rgba(0,0,0,.12)"
        : "inset 0 1px 0 rgba(255,255,255,.5), 0 2px 0 rgba(0,0,0,.12)",
      position: "relative",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <VillageIdentity v={v}/>
        </div>
        <span style={{
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 20,
          color: BFTC_T.inkSoft, lineHeight: 1, marginLeft: 2, alignSelf: "center",
          opacity: .6,
        }}>›</span>
      </div>

      {/* Resources stock / max */}
      <ResourceRow resources={v.resources}/>

      {/* Activity chips — icon + timer only, 1 line */}
      <div style={{ display: "flex", gap: 4 }}>
        <ActivityChip kind="build"  eta={buildEta}/>
        <ActivityChip kind="troops" eta={troopEta}/>
        <ActivityChip kind="lords"  eta={lordEta}/>
      </div>

      {variant === "B" && <NextEventRow v={v}/>}
      {v.alert && <AlertPill alert={v.alert} dense={variant === "A"}/>}
    </button>
  );
}

// =============================================================================
// Header — title + global summary chips.
// =============================================================================

function SummaryChip({ glyph, value, label }) {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", gap: 6,
      padding: "5px 8px", borderRadius: 8,
      background: "linear-gradient(to bottom, rgba(60,38,25,.94), rgba(40,24,14,.94))",
      border: "1.5px solid #1f1308",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.16), 0 1px 0 rgba(0,0,0,.2)",
      minWidth: 0,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: 5,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(to bottom, rgba(0,0,0,.4), rgba(0,0,0,.65))",
        border: "1px solid rgba(0,0,0,.55)", flexShrink: 0,
      }}>{glyph}</span>
      <div style={{ lineHeight: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 13, fontWeight: 800, color: "#fef9f0",
          textShadow: "1px 1px 1px rgba(0,0,0,.5)", fontVariantNumeric: "tabular-nums",
        }}>{value}</div>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 7.5, fontWeight: 700,
          letterSpacing: ".22em", color: "#cdb88a", textTransform: "uppercase", marginTop: 2,
        }}>{label}</div>
      </div>
    </div>
  );
}

function FilterSeg({ value, onChange }) {
  const opts = [
    { id: "all",     label: "Tous" },
    { id: "active",  label: "Actifs" },
    { id: "alerts",  label: "Alertes" },
  ];
  return (
    <div style={{
      display: "flex", gap: 2, padding: 3, borderRadius: 9,
      background: "linear-gradient(to bottom, rgba(60,38,25,.92), rgba(78,56,34,.92))",
      border: `2px solid ${BFTC_T.woodBark}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.15)",
      flex: 1,
    }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          flex: 1, padding: "5px 0", border: "none", cursor: "pointer", borderRadius: 6,
          fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 800, letterSpacing: ".12em",
          textTransform: "uppercase",
          background: value === o.id
            ? "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))"
            : "transparent",
          color: value === o.id ? "#3a2a00" : "#e6cf95",
          textShadow: value === o.id ? "0 1px 0 rgba(255,255,255,.35)" : "1px 1px 1px rgba(0,0,0,.4)",
          boxShadow: value === o.id ? "inset 0 1px 0 rgba(255,255,255,.4)" : "none",
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// =============================================================================
// Multi-village bottom sheet — main shell, shared between variants.
// =============================================================================

function MultiVillageSheet({ variant, onClose }) {
  const [filter, setFilter] = useStateMV("all");
  const visible = VILLAGES_RICH.filter(v => {
    if (filter === "active") return v.builds.length + v.troops.length + v.lords.length > 0;
    if (filter === "alerts") return !!v.alert;
    return true;
  });

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0,
      maxHeight: "86%",
      background: `linear-gradient(to bottom, ${BFTC_T.parch1}, ${BFTC_T.parch3})`,
      borderTop: `4px solid ${BFTC_T.woodBark}`,
      borderRadius: "20px 20px 0 0",
      boxShadow: "0 -10px 30px rgba(0,0,0,.5), inset 0 2px 0 rgba(255,255,255,.55)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Gold strip + drag handle */}
      <div style={{ height: 6, background: "linear-gradient(to right, var(--game-gold-light), var(--game-gold-dark))" }}/>
      <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 0" }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: "rgba(93,74,50,.35)" }}/>
      </div>

      {/* Title row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "8px 14px 6px",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 9, fontWeight: 700, letterSpacing: ".3em",
            color: BFTC_T.inkSoft, textTransform: "uppercase", lineHeight: 1,
          }}>Domaines du royaume</div>
          <div style={{
            fontFamily: BFTC_T.font, fontSize: 18, fontWeight: 800, color: BFTC_T.ink,
            letterSpacing: ".02em", textShadow: "0 1px 0 rgba(255,255,255,.5)",
            marginTop: 2,
          }}>Mes villages
            <span style={{
              fontFamily: BFTC_T.font, fontSize: 12, fontWeight: 700,
              color: BFTC_T.inkSoft, marginLeft: 7, letterSpacing: 0,
            }}>{VILLAGES_RICH.length}/7</span>
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

      {/* Filter row */}
      <div style={{
        margin: "8px 14px 10px", display: "flex", gap: 6, alignItems: "stretch",
      }}>
        <FilterSeg value={filter} onChange={setFilter}/>
        <button title="Trier" style={{
          width: 34, padding: 0, borderRadius: 8,
          background: "linear-gradient(to bottom, #fef9f0, #d9c896)",
          border: "2px solid #5d4a32", color: BFTC_T.ink,
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 13, cursor: "pointer",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.45), 0 2px 0 rgba(0,0,0,.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 4 H13 M4 8 H12 M5 12 H11" stroke={BFTC_T.ink} strokeWidth="1.6"
                  strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Village list (scrollable) */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "0 14px 12px",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {visible.map(v => (
          <VillageCard key={v.id} v={v} variant={variant}/>
        ))}
        {visible.length === 0 && (
          <div style={{
            padding: "30px 16px", textAlign: "center",
            fontFamily: BFTC_T.font, fontSize: 12, color: BFTC_T.inkSoft,
            fontStyle: "italic",
          }}>Aucun domaine ne correspond à ce filtre.</div>
        )}

        {/* Footer CTA — passage rapide entre villages / ajout */}
        <div style={{
          display: "flex", gap: 6, marginTop: 4,
        }}>
          <button style={{
            flex: 1, padding: "9px 12px",
            background: "linear-gradient(to bottom, #fef9f0, #d9c896)",
            border: "2px solid #5d4a32",
            borderRadius: 10, cursor: "pointer",
            fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 800,
            letterSpacing: ".12em", textTransform: "uppercase", color: BFTC_T.ink,
            textShadow: "0 1px 0 rgba(255,255,255,.45)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.45), 0 2px 0 rgba(0,0,0,.18)",
          }}>Carte du royaume</button>
          <button style={{
            flex: 1, padding: "9px 12px",
            background: "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))",
            border: "2px solid var(--game-gold-border)",
            borderRadius: 10, cursor: "pointer",
            fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 800,
            letterSpacing: ".12em", textTransform: "uppercase", color: "#3a2a00",
            textShadow: "0 1px 0 rgba(255,255,255,.4)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 2px 0 rgba(0,0,0,.2)",
          }}>Coloniser</button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Artboard wrappers — reuse PhoneA scene + modal overlay pattern.
// =============================================================================

function MvArtboardInner({ variant, label }) {
  return (
    <div data-screen-label={label} style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "#1a1a2e",
    }}>
      <div style={{
        position: "absolute", inset: 0, isolation: "isolate", zIndex: 0,
        display: "flex", flexDirection: "column",
      }}>
        <PhoneA/>
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
        <MvModalContainer variant={variant}/>
      </div>
    </div>
  );
}

function MvModalContainer({ variant }) {
  const [open, setOpen] = useStateMV(true);
  return (
    <React.Fragment>
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,.55)",
          backdropFilter: "blur(2px)", animation: "fadeIn .2s ease-out",
        }}/>
      )}
      {open && <MultiVillageSheet variant={variant} onClose={() => setOpen(false)}/>}
      {!open && (
        <button onClick={() => setOpen(true)} style={{
          position: "absolute", bottom: 76, right: 12, zIndex: 100,
          padding: "8px 12px", borderRadius: 999,
          background: "linear-gradient(to bottom, var(--game-gold-light), var(--game-gold-dark))",
          border: "2px solid var(--game-gold-border)", color: "#3a2a00",
          fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 800,
          letterSpacing: ".12em", textTransform: "uppercase",
          textShadow: "0 1px 0 rgba(255,255,255,.4)", cursor: "pointer",
          boxShadow: "0 3px 0 rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.4)",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <HammerGlyph size={12} color="#3a2a00"/>
          Mes villages
        </button>
      )}
    </React.Fragment>
  );
}

function MultiVillageArtboardA() { return <MvArtboardInner variant="A" label="A · Aperçu compact"/>; }
function MultiVillageArtboardB() { return <MvArtboardInner variant="B" label="B · Vision détaillée"/>; }

Object.assign(window, { MultiVillageArtboardA, MultiVillageArtboardB });
