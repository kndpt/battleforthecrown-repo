/* global React, ArmyView, TROOPS, TroopIcon, A_R, A_I, CAT_COLOR,
   ArmyTopBar, VillageBar, ArmyBottomNav, ResChip, SmallBadge */

const { useState } = React;

// =============================================================================
// Stock model — must match the HUD values up top (4.5K / 4.4K / 4.6K, pop
// 175/220) so the resource math in the popup lines up with what the player
// sees in the chrome.
// =============================================================================
const RECRUIT_STOCK = {
  wood: 4500,
  stone: 4400,
  iron: 4600,
  population: 175,
  popMax: 220
};

// =============================================================================
// Helpers — time parsing/formatting + French number formatting.
// =============================================================================
function parseTimeSec(s) {
  if (!s) return 0;
  let t = 0;
  const h = s.match(/(\d+)h/);
  const m = s.match(/(\d+)m/);
  const sec = s.match(/(\d+)s/);
  if (h) t += +h[1] * 3600;
  if (m) t += +m[1] * 60;
  if (sec) t += +sec[1];
  return t;
}
function formatSec(t) {
  if (t <= 0) return "0s";
  const h = Math.floor(t / 3600);
  const m = Math.floor(t % 3600 / 60);
  const s = Math.floor(t % 60);
  if (h) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}
function fmt(n) {return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");}

function computeMax(troop, stock) {
  const a = troop.cost.wood ? Math.floor(stock.wood / troop.cost.wood) : Infinity;
  const b = troop.cost.stone ? Math.floor(stock.stone / troop.cost.stone) : Infinity;
  const c = troop.cost.iron ? Math.floor(stock.iron / troop.cost.iron) : Infinity;
  const d = troop.pop ? Math.floor((stock.popMax - stock.population) / troop.pop) : Infinity;
  return Math.max(0, Math.min(a, b, c, d));
}

// =============================================================================
// RecruitPopup — the bottom-sheet that opens when a troop is dropped into the
// queue. Designed for one-thumb use:
//   - Number plate flanked by ±1 / ±10 round steppers (thumb-zone)
//   - Big horizontal slider 1 → maxAffordable (single drag = any value)
//   - Quick-set chips (10/50/100/500/MAX) for common batches
//   - Live resource bars + population delta
//   - Single big green CTA "ENTRAÎNER ×N"
// =============================================================================
function RecruitPopup({ troop, initialQty = 100 }) {
  const max = computeMax(troop, RECRUIT_STOCK);
  const [qty, setQty] = useState(Math.max(1, Math.min(initialQty, max)));
  const clamp = (n) => Math.max(1, Math.min(max, Math.round(n)));

  const cat = CAT_COLOR[troop.cat] || CAT_COLOR["Infanterie"];
  const cost = {
    wood: troop.cost.wood * qty,
    stone: troop.cost.stone * qty,
    iron: troop.cost.iron * qty
  };
  const popUsed = troop.pop * qty;
  const sec = parseTimeSec(troop.time) * qty;
  const atMax = qty >= max;

  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(180deg, var(--parchment-100) 0%, var(--parchment-200) 55%, var(--parchment-400) 100%)",
      borderTop: `3px solid ${cat.border}`,
      borderTopLeftRadius: 22, borderTopRightRadius: 22,
      boxShadow: "0 -14px 36px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.55)",
      padding: "8px 14px 14px",
      display: "flex", flexDirection: "column", gap: 9
    }}>
      {/* Drag handle */}
      <div style={{ width: 44, height: 5, background: "var(--wood-deeper)", opacity: .32,
        borderRadius: 999, margin: "0 auto" }} />

      {/* Header — troop portrait + name + category + close */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(180deg, ${cat.light}, ${cat.dark})`,
          border: `2px solid ${cat.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.2)"
        }}>
          <TroopIcon troop={troop} size={40} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 15,
            color: "var(--fg-quill)", lineHeight: 1, letterSpacing: ".01em"
          }}>{troop.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
            <span style={{
              padding: "1.5px 7px", borderRadius: 999,
              background: `linear-gradient(180deg, ${cat.light}, ${cat.dark})`,
              border: `1.5px solid ${cat.border}`,
              fontFamily: "var(--bftc-font-display)", fontSize: 8.5, fontWeight: 800,
              color: cat.ink, letterSpacing: ".12em", textTransform: "uppercase",
              textShadow: cat.ink === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none"
            }}>{troop.cat}</span>
          </div>
        </div>
      </div>

      {/* Quantity plate — number flanked by stepper buttons. Thumb-friendly: every
           tap target ≥ 40 × 40, sits in the bottom half of the screen. */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.13))",
        border: "1.5px solid var(--parchment-600)",
        borderRadius: 14, padding: "8px 8px",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,.18)"
      }}>
        <Stepper label="−10" onClick={() => setQty(clamp(qty - 10))} />
        <Stepper label="−1" onClick={() => setQty(clamp(qty - 1))} size={40} />
        <div style={{ flex: 1, textAlign: "center", padding: "0 4px" }}>
          <div style={{
            fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 36,
            color: "var(--fg-quill)", textShadow: "0 1px 0 rgba(255,255,255,.5)",
            fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: ".005em"
          }}>{fmt(qty)}</div>
          <div style={{
            fontFamily: "var(--bftc-font-display)", fontSize: 9, fontWeight: 700,
            color: "var(--fg-muted-parch)", letterSpacing: ".14em", textTransform: "uppercase",
            marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>
            {troop.short} {qty > 1 ? "× " : ""}
          </div>
        </div>
        <Stepper label="+1" onClick={() => setQty(clamp(qty + 1))} size={40} />
        <Stepper label="+10" onClick={() => setQty(clamp(qty + 10))} />
      </div>

      {/* Slider — one-drag from 1 to max. Track turns gold near max, red at cap. */}
      <Slider value={qty} max={max} onChange={(n) => setQty(clamp(n))} troop={troop} />

      {/* Quick chips — common batches. Disabled if above max; "MAX" always on. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}>
        {[10, 50, 100, 500, "MAX"].map((v) => {
          const n = v === "MAX" ? max : v;
          const active = qty === n;
          const disabled = v !== "MAX" && v > max;
          return (
            <QuickChip key={v}
            label={v === "MAX" ? "MAX" : fmt(v)}
            active={active} disabled={disabled}
            tone={v === "MAX" ? "gold" : "wood"}
            onClick={() => setQty(clamp(n))} />);

        })}
      </div>

      {/* Resource bars + population delta. */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 5,
        background: "rgba(0,0,0,.05)", border: "1.5px solid var(--parchment-500)",
        borderRadius: 12, padding: "8px 10px"
      }}>
        <ResBar icon={A_R("wood")} label="Bois" used={cost.wood} have={RECRUIT_STOCK.wood} tone="#a67c52" />
        <ResBar icon={A_R("stone")} label="Pierre" used={cost.stone} have={RECRUIT_STOCK.stone} tone="#8a99a8" />
        <ResBar icon={A_R("iron")} label="Fer" used={cost.iron} have={RECRUIT_STOCK.iron} tone="#c79055" />
        <PopRow used={popUsed} />
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <button style={cancelBtn()}>Annuler</button>
        <button style={trainBtn(atMax)}>
          <span style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>Entraîner</span>
          <span style={{ fontSize: 17, marginLeft: 7, fontVariantNumeric: "tabular-nums", letterSpacing: ".01em" }}>×{fmt(qty)}</span>
        </button>
      </div>
    </div>);

}

// -- Stepper button (round-rect, ±N). Same neutral parchment look as the
//    quick-set chips below — the slider's gold thumb is the only colored
//    accent in this control cluster.
function Stepper({ label, onClick, size = 44 }) {
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: 12, padding: 0, flexShrink: 0,
      background: "linear-gradient(180deg, rgba(255,255,255,.85), rgba(255,255,255,.55))",
      border: "2px solid var(--parchment-700)", cursor: "pointer",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 1px 0 rgba(0,0,0,.12)",
      fontFamily: "var(--bftc-font-display)", fontWeight: 800,
      fontSize: size >= 44 ? 14 : 13,
      color: "var(--fg-quill)",
      fontVariantNumeric: "tabular-nums", letterSpacing: ".02em"
    }}>{label}</button>);

}

// -- Quick-set chip ---------------------------------------------------------
function QuickChip({ label, onClick, active, disabled, tone }) {
  const toneBg = tone === "gold" ?
  "linear-gradient(180deg, var(--game-gold-glow), var(--game-gold-dark))" :
  "linear-gradient(180deg, var(--wood), var(--wood-dark))";
  const toneBd = tone === "gold" ? "var(--game-gold-border)" : "var(--wood-deep)";
  const toneC = tone === "gold" ? "#3a2a00" : "#fff";

  if (disabled) {
    return (
      <button disabled style={{
        padding: "9px 4px", borderRadius: 10,
        background: "linear-gradient(180deg, var(--parchment-300), var(--parchment-500))",
        border: "1.5px solid var(--parchment-700)",
        opacity: .5, cursor: "not-allowed",
        fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 11,
        color: "var(--fg-muted-parch)", letterSpacing: ".06em",
        fontVariantNumeric: "tabular-nums"
      }}>{label}</button>);

  }

  return (
    <button onClick={onClick} style={{
      padding: "9px 4px", borderRadius: 10,
      background: active ? toneBg :
      "linear-gradient(180deg, rgba(255,255,255,.85), rgba(255,255,255,.55))",
      border: `2px solid ${active ? toneBd : "var(--parchment-700)"}`,
      boxShadow: active ?
      "inset 0 1px 0 rgba(255,255,255,.32), 0 2px 0 rgba(0,0,0,.25)" :
      "inset 0 1px 0 rgba(255,255,255,.4), 0 1px 0 rgba(0,0,0,.1)",
      cursor: "pointer",
      fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 11,
      color: active ? toneC : "var(--fg-quill)",
      textShadow: active && toneC === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none",
      letterSpacing: ".06em",
      fontVariantNumeric: "tabular-nums"
    }}>{label}</button>);

}

// -- Slider -----------------------------------------------------------------
function Slider({ value, max, onChange, troop }) {
  const pct = max > 0 ? value / max * 100 : 0;
  const fillBg = pct >= 99 ?
  "linear-gradient(180deg, var(--game-red-light), var(--game-red-dark))" :
  pct > 80 ?
  "linear-gradient(180deg, var(--game-gold-glow), var(--game-gold-dark))" :
  "linear-gradient(180deg, var(--game-green-light), var(--game-green-dark))";
  // Native input for actual draggability — invisible but covers the track.
  return (
    <div style={{ position: "relative", padding: "10px 0 2px" }}>
      <div style={{ position: "relative", height: 12, borderRadius: 999,
        background: "linear-gradient(180deg, var(--parchment-500), var(--parchment-700))",
        border: "1.5px solid var(--wood-deep)",
        boxShadow: "inset 0 2px 3px rgba(0,0,0,.32)"
      }}>
        {/* Filled portion */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${pct}%`, background: fillBg, borderRadius: 999,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), inset 0 -1px 0 rgba(0,0,0,.2)"
        }} />
        {/* Tick marks at quartiles */}
        {[25, 50, 75].map((t) =>
        <div key={t} style={{ position: "absolute", left: `${t}%`, top: 1, bottom: 1, width: 1,
          background: "rgba(0,0,0,.2)" }} />
        )}
        {/* Thumb */}
        <div style={{ position: "absolute", left: `${pct}%`, top: "50%",
          transform: "translate(-50%, -50%)",
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(180deg, var(--game-gold-glow), var(--game-gold-dark))",
          border: "2px solid var(--game-gold-border)",
          boxShadow: "0 3px 6px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.55)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%",
            background: "rgba(60,40,0,.45)",
            boxShadow: "inset 0 1px 1px rgba(0,0,0,.5)" }} />
        </div>
        {/* Invisible native input layered on top for real drag-ability */}
        <input type="range" min={1} max={max} value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
          opacity: 0, cursor: "pointer", margin: 0, padding: 0 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5,
        fontFamily: "var(--bftc-font-display)", fontSize: 9.5, fontWeight: 800,
        color: "var(--fg-muted-parch)", letterSpacing: ".1em", textTransform: "uppercase",
        fontVariantNumeric: "tabular-nums"
      }}>
        <span>1</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          Max <span style={{
            padding: "1px 6px", borderRadius: 999,
            background: "var(--parchment-200)", border: "1px solid var(--parchment-700)",
            color: "var(--fg-quill)"
          }}>{fmt(max)}</span>
        </span>
      </div>
    </div>);

}

// -- Single resource bar ----------------------------------------------------
function ResBar({ icon, label, used, have, tone }) {
  const pct = Math.min(100, used / have * 100);
  const tight = pct > 85;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img src={icon} alt="" style={{ width: 20, height: 20, flexShrink: 0,
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,.3))" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2,
          fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 10,
          color: "var(--fg-on-parchment)", fontVariantNumeric: "tabular-nums",
          lineHeight: 1
        }}>
          <span style={{ color: "var(--fg-muted-parch)", letterSpacing: ".08em", textTransform: "uppercase" }}>
            {label}
          </span>
          <span>
            <span style={{ color: tight ? "var(--game-red-dark)" : "var(--fg-quill)", fontWeight: 800 }}>{fmt(used)}</span>
            <span style={{ color: "var(--fg-muted-parch)" }}> / {fmt(have)}</span>
          </span>
        </div>
        <div style={{ height: 7, background: "var(--parchment-400)",
          borderRadius: 999, border: "1px solid var(--parchment-700)",
          overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,.22)"
        }}>
          <div style={{ height: "100%", width: `${pct}%`,
            background: `linear-gradient(180deg, ${tone}, ${tone}c0)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)"
          }} />
        </div>
      </div>
    </div>);

}

// -- Population delta row ---------------------------------------------------
function PopRow({ used }) {
  const cur = RECRUIT_STOCK.population;
  const max = RECRUIT_STOCK.popMax;
  const after = cur + used;
  const tight = after > max * 0.92;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8,
      paddingTop: 5, borderTop: "1px dashed var(--parchment-600)"
    }}>
      <img src={A_R("population")} alt="" style={{ width: 20, height: 20,
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,.3))" }} />
      <span style={{ flex: 1, fontFamily: "var(--bftc-font-display)", fontSize: 10,
        fontWeight: 700, color: "var(--fg-muted-parch)", letterSpacing: ".08em",
        textTransform: "uppercase"
      }}>Population</span>
      <span style={{ fontFamily: "var(--bftc-font-display)", fontSize: 10,
        fontWeight: 700, fontVariantNumeric: "tabular-nums"
      }}>
        <span style={{ color: "var(--fg-quill)" }}>{cur}</span>
        <span style={{ color: tight ? "var(--game-red-dark)" : "var(--game-green-dark)" }}> → {after}</span>
        <span style={{ color: "var(--fg-muted-parch)" }}> / {max}</span>
      </span>
    </div>);

}

// -- Inline icons -----------------------------------------------------------
function ClockSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" stroke="var(--fg-on-parchment)"
    strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>);

}
function QueueSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" stroke="var(--fg-muted-parch)"
    strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h12M3 12h9M3 18h6" /><path d="M18 9l3 3-3 3" />
    </svg>);

}

// -- Button factories -------------------------------------------------------
function closeBtn() {
  return {
    width: 30, height: 30, borderRadius: 10, padding: 0, flexShrink: 0,
    background: "linear-gradient(180deg, var(--game-stone-light), var(--game-stone-dark))",
    border: "2px solid var(--game-stone-border)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 2px 0 rgba(0,0,0,.22)"
  };
}
function cancelBtn() {
  return {
    width: 96, padding: "13px 10px", borderRadius: 12,
    background: "linear-gradient(180deg, var(--game-stone-light), var(--game-stone-dark))",
    border: "2px solid var(--game-stone-border)",
    fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 12,
    color: "#fff", textShadow: "1px 1px 1px rgba(0,0,0,.5)",
    letterSpacing: ".14em", textTransform: "uppercase",
    cursor: "pointer", flexShrink: 0,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 2px 0 rgba(0,0,0,.22)"
  };
}
function trainBtn(atMax) {
  const bg = atMax ?
  "linear-gradient(180deg, var(--game-gold-glow), var(--game-gold-dark))" :
  "linear-gradient(180deg, var(--game-green-light), var(--game-green-dark))";
  const bd = atMax ? "var(--game-gold-border)" : "var(--game-green-border)";
  const c = atMax ? "#3a2a00" : "#fff";
  return {
    flex: 1, padding: "13px 12px", borderRadius: 12,
    background: bg, border: `2px solid ${bd}`,
    fontFamily: "var(--bftc-font-display)", fontWeight: 800,
    color: c, textShadow: c === "#fff" ? "1px 1px 1px rgba(0,0,0,.5)" : "none",
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.32), 0 3px 0 rgba(0,0,0,.26)",
    display: "inline-flex", alignItems: "center", justifyContent: "center"
  };
}

// =============================================================================
// Wrapper that re-uses the regular ArmyView as a dimmed backdrop, then floats
// the recruit popup on top. The HUD stays visible on purpose — players want
// to see live resource totals while choosing a batch size.
// =============================================================================
function ArmyViewWithRecruitPopup({ troopId, initialQty, label }) {
  const troop = TROOPS.find((t) => t.id === troopId);
  return (
    <div data-screen-label={label} style={{ position: "relative", width: "100%", height: "100%",
      overflow: "hidden"
    }}>
      <ArmyView />
      {/* Dim layer — sits above the army view but below the popup. The HUD bar
           remains tinted but still readable so the player can sanity-check
           their stockpiles while sizing the batch. */}
      <div style={{ position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(15,8,2,.18) 0%, rgba(15,8,2,.18) 88px, rgba(15,8,2,.55) 88px, rgba(15,8,2,.6) 100%)",
        pointerEvents: "none", zIndex: 40
      }} />
      {/* Popup anchored to the bottom — extends OVER the bottom nav. */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 50 }}>
        <RecruitPopup troop={troop} initialQty={initialQty} />
      </div>
    </div>);

}

// =============================================================================
// Drag-in-progress view — shows the moment just before the popup opens. A
// finger touchpoint with a "ghost" troop chip following it, plus a glowing
// drop zone where the queue's empty slot is.
// =============================================================================
function ArmyViewDragging({ troopId }) {
  const troop = TROOPS.find((t) => t.id === troopId);
  const cat = CAT_COLOR[troop.cat] || CAT_COLOR["Infanterie"];
  return (
    <div data-screen-label="Vue Armée · drag actif" style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden"
    }}>
      <ArmyView />

      {/* Drop-zone glow + label swap — styled directly on the in-page
           .bftc-drop-zone container so the gold dashed ring always traces its
           real bounds, no manual positioning. Scoped to this artboard's root
           so it never leaks into the stable view. */}
      <style>{`
        [data-screen-label="Vue Armée · drag actif"] .bftc-drop-zone {
          border: 2px dashed var(--game-gold-glow) !important;
          border-radius: 9px !important;
          background: rgba(250, 224, 120, .22) !important;
          color: var(--game-gold-glow) !important;
          font-style: normal !important;
          font-weight: 800 !important;
          letter-spacing: .18em !important;
          text-transform: uppercase !important;
          text-shadow: 0 1px 1px rgba(0,0,0,.5) !important;
          animation: bftcDropPulse 1.4s ease-in-out infinite;
        }
        [data-screen-label="Vue Armée · drag actif"] .bftc-drop-zone__idle   { display: none !important; }
        [data-screen-label="Vue Armée · drag actif"] .bftc-drop-zone__active { display: inline !important; }
        @keyframes bftcDropPulse {
          0%, 100% { box-shadow: 0 0 14px rgba(250,224,120,.5), inset 0 0 12px rgba(250,224,120,.3); }
          50%      { box-shadow: 0 0 24px rgba(250,224,120,.85), inset 0 0 18px rgba(250,224,120,.5); }
        }
      `}</style>

      {/* Ghost chip — the troop being dragged, lifted from the squire portrait
           tile near the top of the grid. Trails the finger as it moves toward
           the queue. */}
      <div style={{ position: "absolute", left: 142, top: 360,
        transform: "rotate(-7deg) scale(1.18)",
        filter: "drop-shadow(0 10px 16px rgba(0,0,0,.45))",
        pointerEvents: "none", zIndex: 35
      }}>
        <GhostChip troop={troop} cat={cat} />
      </div>

      {/* Touch indicator — finger contact halo, slightly below the ghost */}
      <div style={{ position: "absolute", left: 180, top: 390,
        width: 54, height: 54, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,.55) 0%, rgba(255,255,255,.18) 45%, rgba(255,255,255,0) 75%)",
        border: "2px solid rgba(255,255,255,.65)",
        boxShadow: "0 0 24px rgba(255,255,255,.45)",
        pointerEvents: "none", zIndex: 36
      }} />

      {/* Lift-off highlight on the source portrait tile (2nd column, 1st row —
           the squire). Mirrors the standard "selected" state. */}
      <div style={{ position: "absolute",
        left: 96, top: 218, width: 78, height: 96,
        borderRadius: 14,
        border: "2px solid var(--game-gold-glow)",
        boxShadow: "0 0 14px rgba(250,224,120,.6), inset 0 0 10px rgba(250,224,120,.3)",
        pointerEvents: "none", zIndex: 28,
      }} />

    </div>);

}

// Ghost chip — lifted copy of a recruit chip, used during drag.
function GhostChip({ troop, cat }) {
  return (
    <div style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center",
      padding: "5px 9px", borderRadius: 11,
      background: `linear-gradient(180deg, ${cat.light}, ${cat.dark})`,
      border: `2px solid ${cat.border}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 3px 0 rgba(0,0,0,.25)"
    }}>
      <TroopIcon troop={troop} size={32} />
      <span style={{
        fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 10,
        color: cat.ink, letterSpacing: ".06em", marginTop: 2,
        textShadow: cat.ink === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none"
      }}>{troop.short}</span>
    </div>);

}

Object.assign(window, {
  RecruitPopup, ArmyViewWithRecruitPopup, ArmyViewDragging,
  RECRUIT_STOCK, computeMax, parseTimeSec, formatSec, fmt
});