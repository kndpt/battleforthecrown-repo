/* global React, BFTC_T */
/* Shared chrome for the army-view variants:
 *   - TopBar (HUD with avatar + power + crowns + resources)
 *   - VillageBar (village carousel)
 *   - BottomNav (4 tabs, "army" active)
 *   - PhoneShell (360x720 frame that stacks the chrome around content)
 *   - TROOPS data + helper hooks
 *
 * Uses local "assets/" paths.
 */

const ASSET = "assets";
const A_R = (n) => `${ASSET}/resources/${n}.png`;
const A_I = (n) => `${ASSET}/icons/${n}.png`;
const A_U = (n) => `${ASSET}/army/${n}.png`;

// HUD state used by the top bar in every variant.
const ARMY_HUD = {
  name: "SK", level: 12, power: "4 642", crowns: "263 481",
  resources: {
    wood:       { value: "4.5K", sub: "+120/h" },
    stone:      { value: "4.4K", sub: "+80/h" },
    iron:       { value: "4.6K", sub: "+50/h" },
    population: { value: "175/220", sub: "villageois" },
  },
};

// Master troop catalog. inVillage = trained here. fromAllies = reinforcements
// hosted here. supportingElsewhere = sent out from here to support a friend.
// Power/cost/time match the in-game balance enough to be readable.
const TROOPS = [
  { id: "militia", name: "Milice de paysans", short: "Milice",  icon: A_U("militia"),
    cat: "Infanterie", pop: 1, atk: 6,  def: 4,  power: 3,
    cost: { wood: 50, stone: 30, iron: 10 }, time: "18s",
    inVillage: 29, fromAllies: 0,  supportingElsewhere: 0, unlocked: true },
  { id: "squire",  name: "Écuyer",            short: "Écuyer", icon: A_U("squire"),
    cat: "Infanterie", pop: 1, atk: 10, def: 12, power: 8,
    cost: { wood: 80, stone: 50, iron: 30 }, time: "45s",
    inVillage: 10, fromAllies: 12, supportingElsewhere: 0, unlocked: true },
  { id: "archer",  name: "Archer",             short: "Archer", icon: A_U("archer"),
    cat: "Tireur",    pop: 1, atk: 14, def: 4,  power: 6,
    cost: { wood: 100, stone: 20, iron: 60 }, time: "1m",
    inVillage: 1,  fromAllies: 0,  supportingElsewhere: 5, unlocked: true },
  { id: "savage",  name: "Mercenaire",         short: "Mercen.", icon: A_U("savage"),
    cat: "Spécial",   pop: 2, atk: 24, def: 8,  power: 14,
    cost: { wood: 200, stone: 50, iron: 120 }, time: "2m 30s",
    inVillage: 49, fromAllies: 0,  supportingElsewhere: 0, unlocked: true },
  { id: "templar", name: "Templier",           short: "Templier", icon: A_U("templar"),
    cat: "Élite",     pop: 3, atk: 40, def: 30, power: 32,
    cost: { wood: 300, stone: 200, iron: 300 }, time: "5m",
    inVillage: 0, fromAllies: 0, supportingElsewhere: 0,
    unlocked: false, req: "Caserne niv. 4 requis", reqLvl: 4 },
  { id: "cavalry", name: "Cavalerie",          short: "Cav.",     icon: null, emoji: "🐎",
    cat: "Cavalerie", pop: 4, atk: 56, def: 22, power: 48,
    cost: { wood: 400, stone: 150, iron: 400 }, time: "8m",
    inVillage: 0, unlocked: false, req: "Caserne niv. 5 requis", reqLvl: 5 },
  { id: "ram",     name: "Bélier",             short: "Bélier",   icon: null, emoji: "🪵",
    cat: "Siège",     pop: 5, atk: 0,  def: 0,  power: 80,
    cost: { wood: 600, stone: 0, iron: 500 }, time: "12m",
    inVillage: 0, unlocked: false, req: "Caserne niv. 8 requis", reqLvl: 8 },
  { id: "catapult", name: "Catapulte",         short: "Catap.",   icon: null, emoji: "🪨",
    cat: "Siège",     pop: 8, atk: 0,  def: 0,  power: 120,
    cost: { wood: 800, stone: 300, iron: 700 }, time: "20m",
    inVillage: 0, unlocked: false, req: "Caserne niv. 10 requis", reqLvl: 10 },
];

// Reinforcement entries — units that are NOT mine, hosted here in this village.
// Source is another player's village, with a friendly/allied relationship.
const ALLIED_REINFORCEMENTS = [
  { id: "r1", from: "Aldric de Vermillon", village: "Tour-sur-Sève",
    unitId: "squire", count: 12, relation: "allié" },
  { id: "r2", from: "Sire Marot",          village: "Roche-au-Loup",
    unitId: "archer", count: 8,  relation: "ami" },
];

// What I have sent out FROM this village to other villages (mine or allied).
const SENT_OUT = [
  { id: "s1", to: "Cursed Village II (à moi)", unitId: "archer", count: 5,  ownership: "mien" },
];

// Drop-in icon for a troop. Renders the PNG or, for locked units missing a
// sprite, a soft helmet placeholder with the unit's first letter.
function TroopIcon({ troop, size = 44, dim = false }) {
  if (troop.icon) {
    return <img src={troop.icon} alt="" style={{
      width: size, height: size, objectFit: "contain",
      filter: dim
        ? "drop-shadow(0 2px 3px rgba(0,0,0,.35)) saturate(.4) brightness(.85)"
        : "drop-shadow(0 2px 3px rgba(0,0,0,.35))",
    }}/>;
  }
  // SVG placeholder — chevron banner shape with letter.
  return (
    <div style={{
      width: size, height: size, position: "relative",
      filter: dim ? "saturate(.4) brightness(.85)" : "none",
    }}>
      <svg viewBox="0 0 44 44" width={size} height={size}
        style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,.35))" }}>
        <defs>
          <linearGradient id={`g-${troop.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#b8bec6"/>
            <stop offset="1" stopColor="#6a7480"/>
          </linearGradient>
        </defs>
        <path d="M6 8 L38 8 L38 28 Q22 42 6 28 Z"
          fill={`url(#g-${troop.id})`}
          stroke="#3d4a55" strokeWidth="1.5" strokeLinejoin="round"/>
        <text x="22" y="26" textAnchor="middle"
          fontFamily="var(--bftc-font-display)" fontWeight="800" fontSize="16"
          fill="#fff" stroke="#3d4a55" strokeWidth=".4"
          style={{ paintOrder: "stroke" }}>{troop.short[0]}</text>
      </svg>
    </div>
  );
}

// ---------- TopBar (dark wood, two rows: power+crowns / resources) ----------
function ArmyTopBar() {
  const r = ARMY_HUD.resources;
  return (
    <div style={{
      width: "100%", display: "flex", alignItems: "center", gap: 8,
      background: "linear-gradient(to bottom, rgba(60,38,25,.95), rgba(78,56,34,.95))",
      borderBottom: "2px solid var(--parchment-700)",
      padding: "8px 10px", position: "relative", zIndex: 50,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "linear-gradient(to bottom, var(--wood), var(--wood-dark))",
        border: "2px solid var(--wood-deeper)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 12, color: "#fff",
        textShadow: "1px 1px 1px rgba(0,0,0,.5)", position: "relative", flexShrink: 0,
      }}>
        {ARMY_HUD.name}
        <span style={{
          position: "absolute", bottom: -4, right: -4,
          background: "linear-gradient(to bottom, var(--game-gold-glow), var(--game-gold-dark))",
          border: "2px solid var(--game-gold-border)", borderRadius: "50%",
          width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, color: "#3a2a00",
        }}>{ARMY_HUD.level}</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <SmallBadge><img src={A_I("army-power")} style={{ width: 12, height: 12, marginRight: 3 }} alt=""/>{ARMY_HUD.power}</SmallBadge>
          <SmallBadge gold><img src={A_I("crown")} style={{ width: 12, height: 12, marginRight: 3 }} alt=""/>{ARMY_HUD.crowns}</SmallBadge>
        </div>
        <div style={{ display: "flex", gap: 5, width: "100%" }}>
          <ResChip icon={A_R("wood")}  {...r.wood}/>
          <ResChip icon={A_R("stone")} {...r.stone}/>
          <ResChip icon={A_R("iron")}  {...r.iron}/>
          <ResChip icon={A_R("population")} {...r.population}/>
        </div>
      </div>
    </div>
  );
}

function SmallBadge({ children, gold }) {
  const bg = gold ? "linear-gradient(to bottom, var(--game-gold-glow), var(--game-gold-dark))"
                  : "linear-gradient(to bottom, var(--wood), var(--wood-dark))";
  const bd = gold ? "var(--game-gold-border)" : "var(--wood-deep)";
  const c  = gold ? "#3a2a00" : "#fff";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "1px 7px", height: 20,
      background: bg, border: `2px solid ${bd}`, borderRadius: 9999,
      fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 11, color: c,
      textShadow: c === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)",
      fontVariantNumeric: "tabular-nums",
    }}>{children}</span>
  );
}

function ResChip({ icon, value, sub }) {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", gap: 5,
      background: "rgba(0,0,0,.4)", border: "2px solid rgba(255,255,255,.12)",
      borderRadius: 8, padding: "2px 6px", minWidth: 0,
    }}>
      <img src={icon} style={{ width: 18, height: 18, flexShrink: 0,
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,.5))" }} alt=""/>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 11,
          color: "#fff", textShadow: "1px 1px 1px rgba(0,0,0,.5)",
          fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
    </div>
  );
}

// ---------- Village carousel header (rebuilt in DA style) ----------
function VillageBar({ name = "Cursed Village", subtitle }) {
  return (
    <div style={{
      width: "100%", display: "flex", alignItems: "center", gap: 8,
      background: "linear-gradient(to bottom, var(--wood-deep), var(--wood-bark))",
      borderBottom: "1px solid rgba(0,0,0,.4)",
      padding: "8px 10px", position: "relative", zIndex: 40,
    }}>
      <CarouselArrow direction="left"/>
      <div style={{ flex: 1, textAlign: "center", lineHeight: 1.1 }}>
        <div style={{
          fontFamily: "var(--bftc-font-display)", fontWeight: 700,
          fontSize: 10, color: "var(--parchment-400)",
          letterSpacing: ".22em", textTransform: "uppercase",
        }}>Village</div>
        <div style={{
          fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 14,
          color: "var(--parchment-50)", letterSpacing: ".04em",
          textShadow: "1px 1px 1px rgba(0,0,0,.55)",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>{name}
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: .8 }}>
            <path d="M2 4 L5 7 L8 4" stroke="var(--parchment-300)"
              strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {subtitle && <div style={{
          fontFamily: "var(--bftc-font-display)", fontStyle: "italic",
          fontSize: 9.5, color: "var(--parchment-400)", marginTop: 1,
        }}>{subtitle}</div>}
      </div>
      <CarouselArrow direction="right"/>
    </div>
  );
}

function CarouselArrow({ direction }) {
  return (
    <button aria-label={direction === "left" ? "Village précédent" : "Village suivant"} style={{
      width: 30, height: 30, borderRadius: 9,
      background: "linear-gradient(to bottom, var(--game-blue-light), var(--game-blue-dark))",
      border: "2px solid var(--game-blue-border)",
      cursor: "pointer", padding: 0, flexShrink: 0,
      boxShadow: "0 2px 0 rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.28)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d={direction === "left" ? "M8 2 L4 6 L8 10" : "M4 2 L8 6 L4 10"}
          stroke="#fff" strokeWidth="2.2" fill="none"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.4))" }}/>
      </svg>
    </button>
  );
}

// ---------- BottomNav (army active) ----------
function ArmyBottomNav({ active = "army" }) {
  const tabs = [
    { id: "army",     label: "Armée",     icon: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6m-3 9 5-5m-4.5-1.5 5 5" },
    { id: "build",    label: "Village",   icon: "m15 12-7-7-5 5 7 7M12.5 6.5 17 11l4.5-4.5L17 2M2 22l8-8" },
    { id: "messages", label: "Messages",  icon: "M22 6 12 13 2 6m20 0v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6m20 0a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2", badge: 3 },
    { id: "world",    label: "Monde",     icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
  ];
  return (
    <div style={{
      width: "100%",
      background: "linear-gradient(to top, rgba(60,38,25,.95), rgba(78,56,34,.9), rgba(107,75,43,.85))",
      borderTop: "2px solid var(--parchment-700)", boxShadow: "var(--shadow-nav-up)",
      padding: "6px 4px 8px", display: "flex", justifyContent: "space-around",
    }}>
      {tabs.map(t => {
        const a = t.id === active;
        return (
          <button key={t.id} style={{
            background: "none", border: "none", padding: 2,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            cursor: "pointer",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              border: `2px solid ${a ? "var(--game-gold-glow)" : "var(--wood-deeper)"}`,
              background: a
                ? "linear-gradient(to bottom, var(--game-gold-glow), var(--game-gold-dark))"
                : "linear-gradient(to bottom, var(--wood), var(--wood-dark))",
              boxShadow: a ? "0 0 14px rgba(250,224,120,.55)" : "0 2px 0 rgba(0,0,0,.2)",
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16"
                stroke={a ? "#3c2619" : "#fff"} strokeWidth="2"
                fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.icon}/>
              </svg>
              {t.badge && <span style={{
                position: "absolute", top: -3, right: -3, background: "var(--game-red-dark)",
                color: "#fff", fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 9,
                border: "1.5px solid #fff", borderRadius: 8, minWidth: 14, height: 14,
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
              }}>{t.badge}</span>}
            </div>
            <span style={{
              fontFamily: "var(--bftc-font-display)", fontWeight: 600, fontSize: 9.5,
              color: a ? "var(--game-gold-glow)" : "var(--parchment-300)",
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- PhoneShell — wraps the variant content with the standard chrome ----------
function PhoneShell({ children, variantLabel, villageSubtitle }) {
  return (
    <div data-screen-label={variantLabel} style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: "#1a1a2e", fontFamily: "var(--bftc-font-body)",
      color: "var(--fg-on-parchment)",
    }}>
      <ArmyTopBar/>
      <VillageBar name="Cursed Village" subtitle={villageSubtitle}/>
      <div style={{ flex: 1, minHeight: 0, position: "relative",
        background: "linear-gradient(180deg, var(--parchment-200), var(--parchment-400))",
        overflow: "hidden",
      }}>
        {children}
      </div>
      <ArmyBottomNav active="army"/>
    </div>
  );
}

// Section header used inside the variant content area.
function SectionHeader({ eyebrow, title, count, variant = "wood", right, style }) {
  const v = {
    wood:  { bg: "linear-gradient(to bottom, var(--wood), var(--wood-deeper))", bd: "var(--wood-bark)" },
    blue:  { bg: "linear-gradient(to bottom, var(--game-blue-light), var(--game-blue-dark))", bd: "var(--game-blue-border)" },
    gold:  { bg: "linear-gradient(to bottom, var(--game-gold-glow), var(--game-gold-dark))", bd: "var(--game-gold-border)" },
    stone: { bg: "linear-gradient(to bottom, var(--game-stone-light), var(--game-stone-dark))", bd: "var(--game-stone-border)" },
  }[variant];
  const onGold = variant === "gold";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 10px", borderRadius: 10,
      background: v.bg, border: `2px solid ${v.bd}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.28), 0 2px 0 rgba(0,0,0,.18)",
      ...style,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && <div style={{
          fontFamily: "var(--bftc-font-display)", fontSize: 8.5, fontWeight: 700,
          color: onGold ? "rgba(60,40,0,.7)" : "rgba(255,255,255,.7)",
          letterSpacing: ".22em", textTransform: "uppercase", lineHeight: 1,
        }}>{eyebrow}</div>}
        <div style={{
          fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 14,
          color: onGold ? "#3a2a00" : "#fff",
          textShadow: onGold ? "0 1px 0 rgba(255,255,255,.3)" : "1px 1px 1px rgba(0,0,0,.5)",
          letterSpacing: ".02em", marginTop: eyebrow ? 2 : 0,
        }}>{title}</div>
      </div>
      {right}
      {count != null && <CountPill value={count} tone={variant}/>}
    </div>
  );
}

function CountPill({ value, tone = "wood" }) {
  const t = {
    wood:  { bg: "rgba(0,0,0,.35)", bd: "rgba(255,255,255,.22)", c: "#fff" },
    blue:  { bg: "rgba(0,0,0,.3)",  bd: "rgba(255,255,255,.25)", c: "#fff" },
    gold:  { bg: "rgba(60,40,0,.25)", bd: "rgba(60,40,0,.5)", c: "#3a2a00" },
    stone: { bg: "rgba(0,0,0,.3)",  bd: "rgba(255,255,255,.22)", c: "#fff" },
  }[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 24, height: 22, padding: "0 7px",
      background: t.bg, border: `1.5px solid ${t.bd}`, borderRadius: 9999,
      fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 11,
      color: t.c, textShadow: t.c === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none",
      fontVariantNumeric: "tabular-nums",
    }}>{value}</span>
  );
}

// Tiny info pill used to attribute a stack of troops to a source village.
// kind = "mine" (own village reinforcement), "ally" (friendly player),
// "sent" (away-from-village), "training" (in queue).
function OriginTag({ kind, label, dense = false }) {
  const variants = {
    mine:     { bg: "linear-gradient(to bottom, var(--game-green-light), var(--game-green-dark))",
                bd: "var(--game-green-border)",  c: "#fff", icon: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" },
    ally:     { bg: "linear-gradient(to bottom, var(--game-blue-light), var(--game-blue-dark))",
                bd: "var(--game-blue-border)",   c: "#fff", icon: "M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 7a7 7 0 0 1 14 0" },
    sent:     { bg: "linear-gradient(to bottom, var(--game-gold-glow), var(--game-gold-dark))",
                bd: "var(--game-gold-border)",   c: "#3a2a00", icon: "M5 12h14M13 5l7 7-7 7" },
    training: { bg: "linear-gradient(to bottom, var(--game-blue-light), var(--game-blue-dark))",
                bd: "var(--game-blue-border)",   c: "#fff", icon: "M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0" },
    village:  { bg: "linear-gradient(to bottom, var(--parchment-500), var(--parchment-700))",
                bd: "var(--wood-deep)",           c: "#fff", icon: "M3 9l9-7 9 7v11H3z" },
  }[kind];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: dense ? "1px 6px 1px 4px" : "2px 7px 2px 5px",
      height: dense ? 16 : 18,
      background: variants.bg, border: `1.5px solid ${variants.bd}`,
      borderRadius: 9999,
      fontFamily: "var(--bftc-font-display)", fontWeight: 700,
      fontSize: dense ? 9 : 9.5,
      letterSpacing: ".05em", textTransform: "uppercase",
      color: variants.c,
      textShadow: variants.c === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)",
    }}>
      <svg width={dense ? 8 : 9} height={dense ? 8 : 9} viewBox="0 0 24 24"
        stroke={variants.c} strokeWidth="2.4" fill="none"
        strokeLinecap="round" strokeLinejoin="round">
        <path d={variants.icon}/>
      </svg>
      {label}
    </span>
  );
}

// Compact cost row — wood/stone/iron/pop icons + value.
function MiniCost({ cost, dense = false }) {
  const size = dense ? 11 : 13;
  const fs = dense ? 10 : 11;
  const items = [
    { k: "wood",  v: cost.wood,  icon: A_R("wood") },
    { k: "stone", v: cost.stone, icon: A_R("stone") },
    { k: "iron",  v: cost.iron,  icon: A_R("iron") },
  ];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: dense ? 6 : 7,
      fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: fs,
      color: "var(--fg-on-parchment)", fontVariantNumeric: "tabular-nums",
    }}>
      {items.map(it => (
        <span key={it.k} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
          <img src={it.icon} alt="" style={{ width: size, height: size,
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,.3))" }}/>{it.v}
        </span>
      ))}
    </div>
  );
}

// Compute total army power for a list of troops (uses inVillage + fromAllies).
function totalPower(list = TROOPS) {
  return list.reduce((sum, t) => sum + (t.inVillage + t.fromAllies) * t.power, 0);
}

// Group active (in-village + ally) units by category for bar breakdowns.
function categoryBreakdown(list = TROOPS) {
  const groups = {};
  list.forEach(t => {
    const n = t.inVillage + t.fromAllies;
    if (!n) return;
    if (!groups[t.cat]) groups[t.cat] = { cat: t.cat, count: 0, power: 0 };
    groups[t.cat].count += n;
    groups[t.cat].power += n * t.power;
  });
  return Object.values(groups);
}

Object.assign(window, {
  ASSET, A_R, A_I, A_U, ARMY_HUD, TROOPS, ALLIED_REINFORCEMENTS, SENT_OUT,
  TroopIcon, ArmyTopBar, VillageBar, ArmyBottomNav, PhoneShell,
  SectionHeader, CountPill, OriginTag, MiniCost,
  totalPower, categoryBreakdown,
});
