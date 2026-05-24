/* global React, PixelBtn */
/* global TROOPS, ALLIED_REINFORCEMENTS, SENT_OUT, TroopIcon, A_R, A_I */
/* global PhoneShell, OriginTag, MiniCost */

const { useState } = React;

// Category color map — tints the portrait card body and the recruit chips.
const CAT_COLOR = {
  "Infanterie": { light: "#a67c52",                  dark: "#5d4a32",                  border: "var(--wood-bark)",          ink: "#fff" },
  "Tireur":     { light: "var(--game-blue-light)",   dark: "var(--game-blue-dark)",    border: "var(--game-blue-border)",   ink: "#fff" },
  "Cavalerie":  { light: "var(--game-green-light)",  dark: "var(--game-green-dark)",   border: "var(--game-green-border)",  ink: "#fff" },
  "Spécial":    { light: "var(--game-red-light)",    dark: "var(--game-red-dark)",     border: "var(--game-red-border)",    ink: "#fff" },
  "Élite":      { light: "var(--game-gold-glow)",    dark: "var(--game-gold-dark)",    border: "var(--game-gold-border)",   ink: "#3a2a00" },
  "Siège":      { light: "var(--game-stone-light)",  dark: "var(--game-stone-dark)",   border: "var(--game-stone-border)",  ink: "#fff" },
};

// ============================================================================
// ArmyView — portraits grid + filter bar + bottom-sheet recruit/queue.
// Garrison is unified: own troops AND allied reinforcements share the same
// grid, with a small blue badge on tiles that host reinforcements.
// ============================================================================
function ArmyView() {
  return (
    <PhoneShell variantLabel="Vue Armée" villageSubtitle="Capitale">
      <div style={{ position: "absolute", inset: 0, overflowY: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* Filter bar */}
        <div style={{
          padding: "8px 10px 6px 10px",
          background: "linear-gradient(to bottom, var(--parchment-200), var(--parchment-300))",
          borderBottom: "1.5px solid var(--parchment-600)",
          display: "flex", gap: 4, alignItems: "center",
        }}>
          <PortraitFilter label="Toutes" count={89} active/>
          <PortraitFilter label="Mien"    count={89} tone="green"/>
          <PortraitFilter label="Alliés"  count={20} tone="blue"/>
          <PortraitFilter label="Envoyés" count={5}  tone="gold"/>
        </div>

        {/* Portraits grid */}
        <div style={{ flex: 1, minHeight: 0, padding: "10px 10px 6px",
          display: "flex", flexDirection: "column", gap: 8, overflowY: "auto",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {TROOPS.slice(0, 4).map(t => <PortraitTile key={t.id} troop={t}/>)}
            {TROOPS.slice(4, 8).map(t => <PortraitTile key={t.id} troop={t}/>)}
          </div>
        </div>

        {/* Bottom-sheet — caserne / training queue */}
        <RecruitSheet/>
      </div>
    </PhoneShell>
  );
}

// One of the four filter pills at the top of the army view.
function PortraitFilter({ label, count, active, tone = "wood" }) {
  const toneMap = {
    wood:  { bg: "linear-gradient(to bottom, var(--wood), var(--wood-dark))",                   bd: "var(--wood-deep)",         c: "#fff" },
    green: { bg: "linear-gradient(to bottom, var(--game-green-light), var(--game-green-dark))", bd: "var(--game-green-border)", c: "#fff" },
    blue:  { bg: "linear-gradient(to bottom, var(--game-blue-light), var(--game-blue-dark))",   bd: "var(--game-blue-border)",  c: "#fff" },
    gold:  { bg: "linear-gradient(to bottom, var(--game-gold-glow), var(--game-gold-dark))",    bd: "var(--game-gold-border)",  c: "#3a2a00" },
  }[tone];
  return (
    <button style={{
      flex: 1, padding: "4px 6px", borderRadius: 9,
      background: active ? toneMap.bg : "rgba(255,255,255,.5)",
      border: `1.5px solid ${active ? toneMap.bd : "var(--parchment-700)"}`,
      cursor: "pointer",
      boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.15)" : "none",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
      fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 10,
      color: active ? toneMap.c : "var(--fg-muted-parch)",
      textShadow: active && toneMap.c === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none",
      letterSpacing: ".06em",
    }}>
      {label}
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: 18, height: 14, padding: "0 4px",
        background: active ? "rgba(0,0,0,.25)" : "var(--parchment-200)",
        borderRadius: 999,
        fontSize: 9, fontWeight: 800,
        color: active ? "#fff" : "var(--fg-muted-parch)",
        fontVariantNumeric: "tabular-nums",
      }}>{count}</span>
    </button>
  );
}

// A single troop card. Painted clay portrait with troop count below; locked
// troops swap to a stone gradient + lock icon and surface the required
// Caserne level under the silhouette.
function PortraitTile({ troop }) {
  const cat = CAT_COLOR[troop.cat];
  const total = troop.inVillage + troop.fromAllies;
  const locked = !troop.unlocked;
  return (
    <div style={{
      position: "relative", borderRadius: 14, overflow: "hidden",
      background: locked
        ? "linear-gradient(to bottom, var(--game-stone-light), var(--game-stone-dark))"
        : "linear-gradient(to bottom, var(--parchment-50), var(--parchment-300))",
      border: `2px solid ${locked ? "var(--game-stone-border)" : "var(--parchment-700)"}`,
      boxShadow: "var(--shadow-card-inner-light), 0 2px 0 rgba(0,0,0,.18)",
      display: "flex", flexDirection: "column", aspectRatio: ".82/1",
    }}>
      <div style={{
        flex: 1, position: "relative",
        background: locked
          ? "linear-gradient(to bottom, rgba(0,0,0,.05), rgba(0,0,0,.18))"
          : `linear-gradient(180deg, ${cat.light} 0%, ${cat.light} 60%, ${cat.dark} 100%)`,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        borderBottom: locked ? "2px solid var(--game-stone-border)" : `2px solid ${cat.border}`,
        overflow: "hidden",
      }}>
        <TroopIcon troop={troop} size={50} dim={locked}/>
        {locked && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <img src={A_I("lock")} alt="" style={{ width: 16, height: 16,
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,.5))", opacity: .8,
            }}/>
          </div>
        )}
        {!locked && troop.fromAllies > 0 && (
          <div style={{
            position: "absolute", top: 3, right: 3,
            display: "inline-flex", alignItems: "center", gap: 2,
            padding: "1px 4px", height: 14,
            background: "linear-gradient(to bottom, var(--game-blue-light), var(--game-blue-dark))",
            border: "1.5px solid var(--game-blue-border)", borderRadius: 999,
            fontFamily: "var(--bftc-font-display)", fontSize: 8.5, fontWeight: 800,
            color: "#fff", textShadow: "1px 1px 1px rgba(0,0,0,.4)",
            fontVariantNumeric: "tabular-nums",
          }}>+{troop.fromAllies}</div>
        )}
      </div>
      <div style={{
        padding: "4px 5px 5px", textAlign: "center",
        background: locked
          ? "linear-gradient(to bottom, rgba(0,0,0,.04), rgba(0,0,0,.16))"
          : "linear-gradient(to bottom, var(--parchment-100), var(--parchment-300))",
      }}>
        <div style={{
          fontFamily: "var(--bftc-font-display)", fontSize: 9.5, fontWeight: 700,
          color: locked ? "var(--parchment-100)" : "var(--fg-quill)",
          letterSpacing: ".06em",
          textShadow: locked ? "1px 1px 1px rgba(0,0,0,.4)" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{troop.short}</div>
        <div style={{
          fontFamily: "var(--bftc-font-display)", fontSize: 17, fontWeight: 800,
          color: locked ? "var(--parchment-50)" : "var(--fg-quill)",
          textShadow: locked ? "1px 1px 1px rgba(0,0,0,.5)" : "0 1px 0 rgba(255,255,255,.5)",
          fontVariantNumeric: "tabular-nums", lineHeight: 1,
          opacity: locked ? .6 : 1,
        }}>{locked ? `Niv. ${troop.reqLvl}` : total}</div>
      </div>
    </div>
  );
}

// Bottom sheet "Caserne" — training queue only. Drag-and-drop happens directly
// from the portrait tiles at the top of the view (locked tiles are non-draggable),
// so we no longer duplicate the troop roster down here.
function RecruitSheet() {
  return (
    <div style={{
      background: "linear-gradient(to bottom, var(--wood-deep), var(--wood-bark))",
      borderTop: "3px solid var(--game-gold-border)",
      boxShadow: "0 -6px 18px rgba(0,0,0,.4)",
      padding: "10px 10px 12px",
      display: "flex", flexDirection: "column", gap: 9,
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)",
        width: 36, height: 4, background: "rgba(255,255,255,.35)", borderRadius: 999,
      }}/>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" stroke="var(--game-gold-glow)"
          strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6m-3 9 5-5m-4.5-1.5 5 5"/>
        </svg>
        <span style={{
          fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 12,
          color: "var(--game-gold-glow)", letterSpacing: ".22em", textTransform: "uppercase",
          textShadow: "1px 1px 1px rgba(0,0,0,.5)",
        }}>Caserne · file d'attente</span>
        <span style={{ flex: 1 }}/>
        <span style={{
          fontFamily: "var(--bftc-font-display)", fontSize: 10, fontWeight: 700,
          color: "var(--parchment-300)",
        }}>3 en formation · 1m 20s restant</span>
      </div>

      <div style={{ display: "flex", gap: 5, padding: "6px 8px", borderRadius: 10,
        background: "rgba(0,0,0,.3)", border: "1.5px solid rgba(0,0,0,.5)",
        boxShadow: "inset 0 2px 3px rgba(0,0,0,.25)",
        alignItems: "center",
      }}>
        <QueueChip troop={TROOPS[0]} qty={2} progress={0.7} active/>
        <QueueChip troop={TROOPS[1]} qty={1}/>
        <div className="bftc-drop-zone" style={{
          flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontFamily: "var(--bftc-font-display)", fontSize: 10, color: "var(--parchment-400)",
          fontStyle: "italic",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2" fill="none"
            strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .7 }}>
            <path d="M5 9 L12 2 L19 9 M12 2 v14"/>
          </svg>
          <span className="bftc-drop-zone__idle">Glissez une troupe ici</span>
          <span className="bftc-drop-zone__active" style={{ display: "none" }}>Lâcher ici</span>
        </div>
      </div>
    </div>
  );
}

// A pill in the active training queue. `active` = currently being trained,
// `progress` = 0..1 fill drawn as a thin bar across the bottom.
function QueueChip({ troop, qty, progress, active }) {
  return (
    <div style={{ position: "relative",
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 7px 3px 4px", borderRadius: 999,
      background: active
        ? "linear-gradient(to bottom, var(--game-gold-glow), var(--game-gold-dark))"
        : "linear-gradient(to bottom, var(--wood), var(--wood-dark))",
      border: `1.5px solid ${active ? "var(--game-gold-border)" : "var(--wood-deep)"}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)",
      overflow: "hidden",
    }}>
      <TroopIcon troop={troop} size={18}/>
      <span style={{
        fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 11,
        color: active ? "#3a2a00" : "#fff",
        textShadow: active ? "none" : "1px 1px 1px rgba(0,0,0,.4)",
        fontVariantNumeric: "tabular-nums",
      }}>×{qty}</span>
      {progress != null && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2,
          background: "rgba(0,0,0,.3)" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%",
            background: "#fff", boxShadow: "0 0 4px rgba(255,255,255,.7)" }}/>
        </div>
      )}
    </div>
  );
}

// A horizontally-scrolling tappable troop chip — tap to queue one of this unit.
function RecruitChip({ troop }) {
  const cat = CAT_COLOR[troop.cat];
  return (
    <button style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center",
      padding: "4px 6px", borderRadius: 9,
      background: `linear-gradient(to bottom, ${cat.light}, ${cat.dark})`,
      border: `1.5px solid ${cat.border}`,
      cursor: "pointer", flexShrink: 0,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 2px 0 rgba(0,0,0,.2)",
    }}>
      <TroopIcon troop={troop} size={26}/>
      <span style={{
        fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 9,
        color: cat.ink, letterSpacing: ".06em",
        textShadow: cat.ink === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none",
        marginTop: 1,
      }}>{troop.short}</span>
    </button>
  );
}

function chipBtn() {
  return {
    padding: "2px 8px", height: 22, borderRadius: 999,
    background: "linear-gradient(to bottom, var(--game-gold-glow), var(--game-gold-dark))",
    border: "1.5px solid var(--game-gold-border)",
    fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 10,
    color: "#3a2a00", textShadow: "0 1px 0 rgba(255,255,255,.4)",
    cursor: "pointer", letterSpacing: ".05em",
    boxShadow: "0 1px 0 rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.4)",
  };
}

Object.assign(window, { ArmyView, CAT_COLOR });
