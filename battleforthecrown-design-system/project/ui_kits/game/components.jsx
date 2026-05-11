/* global React */
const { useState } = React;

// ---------- GradientButton ----------
function GradientButton({ variant = "success", size = "md", disabled, children, onClick, style }) {
  const v = {
    success: { bg: "linear-gradient(to bottom, var(--game-green-light), var(--game-green-dark))", bd: "var(--game-green-border)", c: "#fff" },
    info:    { bg: "linear-gradient(to bottom, var(--game-blue-light),  var(--game-blue-dark))",  bd: "var(--game-blue-border)",  c: "#fff" },
    danger:  { bg: "linear-gradient(to bottom, var(--game-red-light),   var(--game-red-dark))",   bd: "var(--game-red-border)",   c: "#fff" },
    warning: { bg: "linear-gradient(to bottom, var(--game-gold-light),  var(--game-gold-dark))",  bd: "var(--game-gold-border)",  c: "#3a2a00" },
    neutral: { bg: "linear-gradient(to bottom, var(--game-stone-light), var(--game-stone-dark))", bd: "var(--game-stone-border)", c: "#fff" },
  }[variant];
  const s = { xs: { fs: 11, pad: "4px 8px" }, sm: { fs: 12, pad: "6px 12px" }, md: { fs: 14, pad: "8px 16px" }, lg: { fs: 16, pad: "10px 22px" } }[size];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: s.fs, letterSpacing: ".02em",
      color: v.c, textShadow: v.c === "#fff" ? "1px 1px 2px rgba(0,0,0,.6)" : "none",
      padding: s.pad, border: `2px solid ${v.bd}`, borderRadius: 10, background: v.bg,
      boxShadow: "0 2px 0 rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.25)",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style,
    }}>{children}</button>
  );
}

// ---------- Badge ----------
function Badge({ variant = "default", children, size = "md", style }) {
  const v = {
    default: { bg: "linear-gradient(to bottom,#8b6f47,#5d4a32)", bd: "#3d2f1f", c: "#fff" },
    success: { bg: "linear-gradient(to bottom,var(--game-green-light),var(--game-green-dark))", bd: "var(--game-green-border)", c: "#fff" },
    info:    { bg: "linear-gradient(to bottom,var(--game-blue-light),var(--game-blue-dark))",   bd: "var(--game-blue-border)",  c: "#fff" },
    warning: { bg: "linear-gradient(to bottom,var(--game-gold-light),var(--game-gold-dark))",   bd: "var(--game-gold-border)",  c: "#3a2a00" },
    danger:  { bg: "linear-gradient(to bottom,var(--game-red-light),var(--game-red-dark))",     bd: "var(--game-red-border)",   c: "#fff" },
    neutral: { bg: "linear-gradient(to bottom,var(--game-stone-light),var(--game-stone-dark))", bd: "var(--game-stone-border)", c: "#fff" },
  }[variant];
  const s = { sm: { fs: 10, h: 18, pad: "0 5px" }, md: { fs: 11.5, h: 23, pad: "0 7px" }, lg: { fs: 14, h: 28, pad: "0 9px" } }[size];
  return <span style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minWidth: s.h, height: s.h, padding: s.pad,
    fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: s.fs,
    color: v.c, textShadow: v.c === "#fff" ? "1px 1px 1.5px rgba(0,0,0,.4)" : "none",
    border: `2px solid ${v.bd}`, borderRadius: 9999, background: v.bg,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 1px 1px rgba(0,0,0,.25)",
    ...style,
  }}>{children}</span>;
}

// ---------- Card ----------
function Card({ variant = "parchment", children, style, onClick }) {
  const v = {
    parchment: { bg: "linear-gradient(to bottom,#fef9f0,#f5e6d3)", bd: "#8b7355", c: "var(--fg-on-parchment)" },
    wood:      { bg: "linear-gradient(to bottom,#a67c52,#7d5a3a)", bd: "#3d2f1f", c: "var(--fg-on-dark)" },
    stone:     { bg: "linear-gradient(to bottom,#b0b8c0,#7d8a92)", bd: "#5d6d6e", c: "var(--fg-on-dark)" },
    default:   { bg: "linear-gradient(to bottom,#d4c094,#c9a882)", bd: "#8b7355", c: "var(--fg-on-parchment)" },
  }[variant];
  return <div onClick={onClick} style={{
    background: v.bg, color: v.c, border: `4px solid ${v.bd}`, borderRadius: 14, overflow: "hidden",
    boxShadow: "0 4px 0 rgba(0,0,0,.22), 0 6px 14px rgba(0,0,0,.28), inset 0 2px 0 rgba(255,255,255,.25)",
    position: "relative", ...style,
  }}>{children}</div>;
}

// ---------- ProgressBar ----------
function ProgressBar({ value = 0, variant = "success", label, suffix }) {
  const c = {
    success: "linear-gradient(to bottom,var(--game-green-light),var(--game-green-dark))",
    warning: "linear-gradient(to bottom,var(--game-gold-light),var(--game-gold-dark))",
    danger:  "linear-gradient(to bottom,var(--game-red-light),var(--game-red-dark))",
    info:    "linear-gradient(to bottom,var(--game-blue-light),var(--game-blue-dark))",
  }[variant];
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
      {(label || suffix) && (
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--bftc-font-display)", fontSize: 11, fontWeight: 600, color: "var(--parchment-950)" }}>
          <span>{label}</span><span style={{ fontVariantNumeric: "tabular-nums", color: "var(--fg-on-parchment)", fontWeight: 700 }}>{suffix}</span>
        </div>
      )}
      <div style={{ position: "relative", height: 14, background: "rgba(0,0,0,.18)", borderRadius: 8, overflow: "hidden", border: "2px solid rgba(0,0,0,.18)", boxShadow: "inset 0 2px 3px rgba(0,0,0,.25)" }}>
        <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: "100%", background: c }}/>
      </div>
    </div>
  );
}

// ---------- ResourceHUD ----------
function ResourceChip({ icon, value, sub, lowStock }) {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", gap: 6,
      background: lowStock ? "linear-gradient(to bottom,rgba(231,76,60,.25),rgba(0,0,0,.4))" : "rgba(0,0,0,.35)",
      border: `2px solid ${lowStock ? "var(--game-red-border)" : "rgba(255,255,255,.12)"}`,
      borderRadius: 8, padding: "4px 8px", minWidth: 0,
    }}>
      <img src={icon} style={{ width: 22, height: 22, flexShrink: 0, filter: "drop-shadow(0 1px 1px rgba(0,0,0,.5))" }} alt=""/>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 12, color: "#fff", textShadow: "1px 1px 1px rgba(0,0,0,.5)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
        {sub && <span style={{ fontFamily: "var(--bftc-font-display)", fontSize: 9.5, color: "#cdb88a" }}>{sub}</span>}
      </div>
    </div>
  );
}
function ResourceHUD({ wood, stone, iron, population }) {
  return (
    <div style={{ display: "flex", gap: 6, width: "100%" }}>
      <ResourceChip icon="../../assets/resources/wood.png"  value={wood.value}  sub={wood.sub}  lowStock={wood.low}/>
      <ResourceChip icon="../../assets/resources/stone.png" value={stone.value} sub={stone.sub} lowStock={stone.low}/>
      <ResourceChip icon="../../assets/resources/iron.png"  value={iron.value}  sub={iron.sub}  lowStock={iron.low}/>
      <ResourceChip icon="../../assets/resources/population.png" value={population.value} sub={population.sub}/>
    </div>
  );
}

// ---------- TopBar ----------
function TopBar({ name, level, power, crowns, resources }) {
  return (
    <div style={{
      width: "100%", display: "flex", alignItems: "center", gap: 8,
      background: "linear-gradient(to bottom,rgba(60,38,25,.92),rgba(78,56,34,.92))",
      borderBottom: "2px solid #8b7355", padding: "8px 10px",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "linear-gradient(to bottom,#8b6f47,#6d5838)", border: "2px solid #5d4a32",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 12, color: "#fff", textShadow: "1px 1px 1px rgba(0,0,0,.5)", position: "relative", flexShrink: 0,
      }}>
        {name.split(" ").map(w => w[0]).slice(0, 2).join("")}
        <span style={{ position: "absolute", bottom: -4, right: -4, background: "linear-gradient(to bottom,#f6d57b,#c59e3f)", border: "2px solid #9e7b0d", borderRadius: "50%", width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#3a2a00" }}>{level}</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <Badge size="sm" variant="default"><img src="../../assets/icons/army-power.png" style={{ width: 12, height: 12, marginRight: 3 }}/>{power}</Badge>
          <Badge size="sm" variant="warning"><img src="../../assets/icons/crown.png" style={{ width: 12, height: 12, marginRight: 3 }}/>{crowns}</Badge>
        </div>
        <ResourceHUD {...resources}/>
      </div>
    </div>
  );
}

// ---------- BottomNav ----------
function BottomNav({ active, onChange }) {
  const tabs = [
    { id: "army",      label: "Armée",     icon: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6m-3 9 5-5m-4.5-1.5 5 5" },
    { id: "build",     label: "Bâtiments", icon: "m15 12-7-7-5 5 7 7M12.5 6.5 17 11l4.5-4.5L17 2M2 22l8-8" },
    { id: "messages",  label: "Messages",  icon: "M22 6 12 13 2 6m20 0v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6m20 0a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2", badge: 3 },
    { id: "world",     label: "Monde",     icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
  ];
  return (
    <div style={{
      width: "100%",
      background: "linear-gradient(to top,rgba(60,38,25,.95),rgba(78,56,34,.9),rgba(107,75,43,.85))",
      borderTop: "2px solid #8b7355", boxShadow: "0 -6px 18px rgba(0,0,0,.45)",
      padding: "8px 4px 12px", display: "flex", justifyContent: "space-around",
    }}>
      {tabs.map(t => {
        const a = t.id === active;
        return (
          <button key={t.id} onClick={() => onChange?.(t.id)} style={{ background: "none", border: "none", padding: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", border: `2px solid ${a ? "#f4d88d" : "#6a5033"}`,
              background: a ? "linear-gradient(to bottom,#f6d57b,#c59e3f)" : "linear-gradient(to bottom,#8b6f47,#5d4a32)",
              boxShadow: a ? "0 0 16px rgba(250,224,120,.55)" : "0 2px 0 rgba(0,0,0,.2)",
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
            }}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke={a ? "#3c2619" : "#fff"} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon}/></svg>
              {t.badge && <span style={{ position: "absolute", top: -3, right: -3, background: "#c0392b", color: "#fff", fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 9, border: "1.5px solid #fff", borderRadius: 8, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{t.badge}</span>}
            </div>
            <span style={{ fontFamily: "var(--bftc-font-display)", fontWeight: 600, fontSize: 10, color: "#f0e0c0" }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Modal ----------
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(2px)", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 320 }}>{children}</div>
    </div>
  );
}

Object.assign(window, { GradientButton, Badge, Card, ProgressBar, ResourceHUD, TopBar, BottomNav, Modal });
