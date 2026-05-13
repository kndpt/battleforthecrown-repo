/* global React */
/* Three village-scene variants. Phone-sized 360x720. */
/* Reuses TopBar / BottomNav / Badge / GradientButton from ui_kits/game/components.jsx */

const ASSET = "assets";  // we'll copy assets to the project root next to this file
const B = (n) => `${ASSET}/buildings/${n}.png`;
const R = (n) => `${ASSET}/resources/${n}.png`;
const I = (n) => `${ASSET}/icons/${n}.png`;

// ---------- Shared HUD data ----------
const HUD_PROPS = {
  name: "Sire Kelvin", level: 12, power: "2 480", crowns: 28,
  resources: {
    wood:       { value: "8 500", sub: "+120/h" },
    stone:      { value: "3 200", sub: "+80/h" },
    iron:       { value: "1 500", sub: "+50/h" },
    population: { value: "120/200", sub: "villageois" },
  },
};

// ---------- BuildingSprite ----------
// Renders a building image at absolute coordinates with a floating LVL badge
// and optional construction overlay. Z-index = top so further-back buildings
// are painted behind front ones.
function BuildingSprite({ src, top, left, width, level, building, timeLeft, progress, dim, glow, label }) {
  const zIndex = Math.round(top);
  return (
    <div data-name={label} style={{
      position: "absolute", top, left, width,
      filter: dim ? `brightness(${dim}) saturate(0.85)` : "none",
      zIndex,
    }}>
      {/* warm halo under building for night/twilight */}
      {glow && (
        <div style={{
          position: "absolute", left: "50%", top: "60%", transform: "translate(-50%,-50%)",
          width: width * 1.3, height: width * 0.7, borderRadius: "50%",
          background: `radial-gradient(ellipse, ${glow} 0%, rgba(0,0,0,0) 70%)`,
          pointerEvents: "none", zIndex: -1,
        }}/>
      )}
      <img src={src} style={{ width: "100%", display: "block", filter: "drop-shadow(0 6px 6px rgba(0,0,0,.35))" }} alt=""/>
      {/* LVL badge floats above */}
      {level != null && !building && (
        <div style={{
          position: "absolute", top: 0, right: width * 0.12,
          background: "linear-gradient(to bottom,#8b6f47,#5d4a32)",
          border: "2px solid #3d2f1f", borderRadius: 9999,
          fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 10,
          color: "#f6e4b8", textShadow: "1px 1px 1px rgba(0,0,0,.7)",
          padding: "1px 6px", letterSpacing: ".02em",
          boxShadow: "0 2px 0 rgba(0,0,0,.3)",
        }}>Niv. {level}</div>
      )}
      {/* construction overlay */}
      {building && (
        <div style={{
          position: "absolute", left: "50%", bottom: "8%", transform: "translateX(-50%)",
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "linear-gradient(to bottom,#f6d57b,#c59e3f)",
          border: "2px solid #9e7b0d", borderRadius: 9999,
          padding: "2px 8px", whiteSpace: "nowrap",
          fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 10, color: "#3a2a00",
          textShadow: "0 1px 0 rgba(255,255,255,.4)",
          boxShadow: "0 2px 0 rgba(0,0,0,.3)",
        }}>
          <img src={I("clock")} style={{ width: 11, height: 11 }} alt=""/>{timeLeft}
        </div>
      )}
    </div>
  );
}

// ---------- BuildPlot ----------
// Empty plot the player can tap to construct. Dashed iso outline.
function BuildPlot({ top, left, size = 70, label = "Construire" }) {
  return (
    <div style={{
      position: "absolute", top, left, width: size, height: size * 0.6,
      zIndex: Math.round(top),
    }}>
      <svg viewBox="0 0 100 60" style={{ width: "100%", height: "100%" }}>
        <polygon points="50,4 96,30 50,56 4,30"
                 fill="rgba(255,255,255,.18)"
                 stroke="#fff" strokeWidth="2" strokeDasharray="4 4"
                 style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,.3))" }}/>
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column",
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "linear-gradient(to bottom,#7cc55c,#3e7a26)",
          border: "2px solid #235814",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 0 rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.4)",
          color: "#fff", fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 18,
          textShadow: "1px 1px 1px rgba(0,0,0,.5)", lineHeight: 1,
        }}>+</div>
      </div>
    </div>
  );
}

// ---------- Common layout for variants A and C ----------
// Building positions on the 360-wide scene. top is vertical; left is horizontal.
const FREE_LAYOUT = [
  { id: "wood",       name: "Camp de bûcherons", top:  20, left:  -8, w: 130, level: 3 },
  { id: "stone",      name: "Carrière",          top:  30, left: 230, w: 130, level: 2 },
  { id: "iron",       name: "Mine de fer",       top: 168, left:  -6, w: 110, level: 1 },
  { id: "castle",     name: "Château",           top:  90, left: 105, w: 160, level: 5 },
  { id: "barracks",   name: "Caserne",           top: 215, left: 215, w: 120, level: 2,
    building: true, timeLeft: "2:15", progress: 72 },
  { id: "warehouse",  name: "Entrepôt",          top: 295, left: 130, w: 120, level: 3 },
  { id: "watchtower", name: "Tour de guet",      top: 330, left: 250, w:  95, level: 1 },
  { id: "farm",       name: "Ferme",             top: 360, left:  10, w: 140, level: 4 },
];

// ---------- Decorative bits ----------
function Tree({ top, left, scale = 1 }) {
  const z = Math.round(top + 20);
  return (
    <div style={{ position: "absolute", top, left, zIndex: z, transform: `scale(${scale})`, transformOrigin: "bottom center" }}>
      <svg viewBox="0 0 50 70" width="40" height="56">
        <ellipse cx="25" cy="62" rx="14" ry="4" fill="rgba(0,0,0,.22)"/>
        <rect x="22" y="42" width="6" height="20" rx="2" fill="#5d3a1d"/>
        <circle cx="25" cy="32" r="20" fill="#3a7a2a"/>
        <circle cx="16" cy="22" r="13" fill="#4a8f33"/>
        <circle cx="33" cy="22" r="13" fill="#4a8f33"/>
        <circle cx="25" cy="14" r="11" fill="#5aa53d"/>
        <circle cx="20" cy="20" r="3" fill="#7dc560" opacity=".6"/>
      </svg>
    </div>
  );
}

function Bush({ top, left }) {
  const z = Math.round(top + 6);
  return (
    <div style={{ position: "absolute", top, left, zIndex: z }}>
      <svg viewBox="0 0 30 18" width="24" height="14">
        <ellipse cx="15" cy="16" rx="10" ry="2" fill="rgba(0,0,0,.2)"/>
        <circle cx="9"  cy="10" r="7" fill="#3a7a2a"/>
        <circle cx="20" cy="10" r="7" fill="#4a8f33"/>
        <circle cx="15" cy="6"  r="6" fill="#5aa53d"/>
      </svg>
    </div>
  );
}

function Rock({ top, left, size = 18 }) {
  const z = Math.round(top + 4);
  return (
    <div style={{ position: "absolute", top, left, width: size, height: size * 0.7, zIndex: z }}>
      <svg viewBox="0 0 30 22" style={{ width: "100%", height: "100%" }}>
        <ellipse cx="15" cy="20" rx="12" ry="2" fill="rgba(0,0,0,.2)"/>
        <path d="M5 16 L9 6 L18 4 L25 10 L24 17 Z" fill="#9aa0a8" stroke="#5d6266" strokeWidth="1"/>
        <path d="M5 16 L9 6 L14 9 L13 17 Z" fill="#b8bec6"/>
      </svg>
    </div>
  );
}

// ---------- VARIANT A — Vallée verte (daylight isometric, free placement) ----------
function VillageA() {
  return (
    <div data-screen-label="A Vallée verte" style={{
      flex: 1, position: "relative", overflow: "hidden",
      background: `
        linear-gradient(180deg,#c5e7b0 0%, #98c97a 18%, #7eab57 36%, #6a9c44 60%, #5b8f3a 100%)`,
    }}>
      {/* sky band */}
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 70, background: "linear-gradient(180deg,#a3d2f5 0%, rgba(163,210,245,0) 100%)" }}/>
      {/* distant hill silhouette */}
      <svg viewBox="0 0 360 80" preserveAspectRatio="none" style={{ position: "absolute", top: 40, left: 0, width: "100%", height: 70 }}>
        <path d="M0,80 C40,40 80,55 140,40 C200,28 240,60 300,42 C340,30 360,46 360,80 Z" fill="#5e8a3f" opacity=".75"/>
        <path d="M0,80 C50,60 100,72 170,58 C230,46 280,76 360,62 L360,80 Z" fill="#4d7732" opacity=".8"/>
      </svg>

      {/* winding sand path — SVG, paints under buildings */}
      <svg viewBox="0 0 360 540" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}>
        <defs>
          <linearGradient id="pathGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#d8b97a"/>
            <stop offset="1" stopColor="#b89251"/>
          </linearGradient>
        </defs>
        <path d="M -10 130 C 60 160, 140 100, 200 180 S 320 240, 380 220
                 M 200 180 C 180 260, 90 320, 60 420
                 M 200 180 C 230 280, 290 360, 340 460"
              stroke="url(#pathGrad)" strokeWidth="22" fill="none" strokeLinecap="round" opacity=".95"/>
        <path d="M -10 130 C 60 160, 140 100, 200 180 S 320 240, 380 220
                 M 200 180 C 180 260, 90 320, 60 420
                 M 200 180 C 230 280, 290 360, 340 460"
              stroke="#e8caa0" strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray="2 8" opacity=".55"/>
      </svg>

      {/* tiny grass speckles */}
      <div style={{ position: "absolute", inset: 0, opacity: .35, zIndex: 1,
        backgroundImage: `radial-gradient(circle at 20% 30%,#9bd16a 1px,transparent 1.5px),
                          radial-gradient(circle at 60% 70%,#6ea83d 1px,transparent 1.5px),
                          radial-gradient(circle at 80% 20%,#9bd16a 1px,transparent 1.5px)`,
        backgroundSize: "40px 40px, 60px 60px, 50px 50px" }}/>

      {/* decoration */}
      <Tree top={60}  left={205}/>
      <Tree top={150} left={155} scale={0.85}/>
      <Bush top={260} left={50}/>
      <Bush top={420} left={180}/>
      <Rock top={290} left={195}/>
      <Rock top={400} left={155} size={14}/>

      {/* buildings */}
      {FREE_LAYOUT.map(b => (
        <BuildingSprite key={b.id} src={B(b.id)} top={b.top} left={b.left} width={b.w}
          level={b.level} building={b.building} timeLeft={b.timeLeft} label={b.name}/>
      ))}

      {/* empty plots */}
      <BuildPlot top={140} left={140} size={70}/>
      <BuildPlot top={415} left={100} size={70}/>

      {/* corner location chip + level badge — drawn on top */}
      <SceneChrome zone="Le Grand Nord" subzone="(7,12)"/>
    </div>
  );
}

// ---------- VARIANT B — Donjon fortifié (walled stronghold) ----------
function VillageB() {
  return (
    <div data-screen-label="B Donjon fortifié" style={{
      flex: 1, position: "relative", overflow: "hidden",
      background: `
        radial-gradient(ellipse at 50% 110%, #4d7732 0%, #355823 50%, #243f17 100%)`,
    }}>
      {/* moat / river along bottom-left */}
      <svg viewBox="0 0 360 540" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}>
        <defs>
          <linearGradient id="water" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#5fb6d6"/>
            <stop offset=".5" stopColor="#3a8db0"/>
            <stop offset="1" stopColor="#22617e"/>
          </linearGradient>
        </defs>
        {/* outer grass border tone */}
        <path d="M0 60 L360 60 L360 470 L0 470 Z" fill="#5e8a3f" opacity=".55"/>
        {/* moat */}
        <path d="M-10 380 Q 80 360 130 410 T 280 470 L 380 500 L 380 560 L -20 560 Z" fill="url(#water)"/>
        <path d="M-10 380 Q 80 360 130 410 T 280 470" stroke="#9bd0e8" strokeWidth="2" fill="none" opacity=".7"/>
        {/* bridge */}
        <g transform="translate(120,420)">
          <rect x="-4" y="-12" width="50" height="28" fill="#8b6f47" stroke="#5d3a1d" strokeWidth="1.5" rx="3"/>
          <line x1="2" y1="-12" x2="2" y2="16" stroke="#5d3a1d" strokeWidth="1.2"/>
          <line x1="12" y1="-12" x2="12" y2="16" stroke="#5d3a1d" strokeWidth="1.2"/>
          <line x1="22" y1="-12" x2="22" y2="16" stroke="#5d3a1d" strokeWidth="1.2"/>
          <line x1="32" y1="-12" x2="32" y2="16" stroke="#5d3a1d" strokeWidth="1.2"/>
          <line x1="42" y1="-12" x2="42" y2="16" stroke="#5d3a1d" strokeWidth="1.2"/>
        </g>
      </svg>

      {/* paved interior — diamond stone tile pattern */}
      <div style={{
        position: "absolute", left: 16, right: 16, top: 70, bottom: 90, zIndex: 1,
        background: `
          linear-gradient(135deg, rgba(0,0,0,.06) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.06) 75%),
          linear-gradient(45deg, rgba(0,0,0,.06) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.06) 75%),
          linear-gradient(180deg,#c7b78e,#a99572)`,
        backgroundSize: "22px 22px",
        borderRadius: 10,
        boxShadow: "inset 0 0 30px rgba(0,0,0,.35)",
      }}/>

      {/* stone perimeter wall — top edge */}
      <Wall side="top"/>
      <Wall side="left"/>
      <Wall side="right"/>
      <Wall side="bottom"/>

      {/* corner towers */}
      <CornerTower top={45}  left={-12}/>
      <CornerTower top={45}  left={310}/>
      <CornerTower top={395} left={-12}/>
      <CornerTower top={395} left={310}/>

      {/* organized layout */}
      <BuildingSprite src={B("castle")}     top={75}  left={110} width={150} level={5} label="Château"/>
      <BuildingSprite src={B("wood")}       top={195} left={10}  width={115} level={3} label="Bûcherons"/>
      <BuildingSprite src={B("stone")}      top={195} left={235} width={115} level={2} label="Carrière"/>
      <BuildingSprite src={B("iron")}       top={290} left={20}  width={110} level={1} label="Mine"/>
      <BuildingSprite src={B("warehouse")}  top={250} left={130} width={110} level={3} label="Entrepôt"/>
      <BuildingSprite src={B("barracks")}   top={290} left={235} width={110} level={2}
        building timeLeft="2:15" label="Caserne"/>
      <BuildingSprite src={B("farm")}       top={345} left={95}  width={130} level={4} label="Ferme"/>

      {/* gate banners on top wall */}
      <div style={{ position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", gap: 4 }}>
        <Pennant/>
        <Pennant/>
      </div>

      <SceneChrome zone="Forteresse de Kelvinor" subzone="(7,12)"/>
    </div>
  );
}

function Wall({ side }) {
  const merlonsRow = (
    <div style={{ display: "flex", gap: 2, height: 8 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{ width: 12, height: 8, background: "linear-gradient(to bottom,#b0b8c0,#8b939c)", borderRadius: "2px 2px 0 0", border: "1px solid #5d6266", borderBottom: "none" }}/>
      ))}
    </div>
  );
  const baseStyle = {
    position: "absolute", zIndex: 40,
    background: "linear-gradient(to bottom,#a8b0b8,#7d8a92 60%,#5d6266)",
    border: "2px solid #4a4f54",
    boxShadow: "inset 0 2px 0 rgba(255,255,255,.18), 0 4px 6px rgba(0,0,0,.35)",
    backgroundImage: `linear-gradient(to bottom,#a8b0b8,#7d8a92 60%,#5d6266),
                      repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 1px, transparent 1px 22px),
                      repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 1px, transparent 1px 12px)`,
  };
  if (side === "top")    return <><div style={{ ...baseStyle, top: 50, left: 0, right: 0, height: 22 }}/><div style={{ position: "absolute", top: 38, left: 8, right: 8, zIndex: 41 }}>{merlonsRow}</div></>;
  if (side === "bottom") return <div style={{ ...baseStyle, bottom: 86, left: 0, right: 0, height: 22 }}/>;
  if (side === "left")   return <div style={{ ...baseStyle, top: 50, bottom: 86, left: 0, width: 16 }}/>;
  if (side === "right")  return <div style={{ ...baseStyle, top: 50, bottom: 86, right: 0, width: 16 }}/>;
  return null;
}

function CornerTower({ top, left }) {
  return (
    <div style={{ position: "absolute", top, left, width: 44, zIndex: 60 }}>
      {/* shaft */}
      <div style={{
        width: 36, height: 56, margin: "0 auto",
        background: "linear-gradient(to bottom,#b0b8c0,#7d8a92,#5d6266)",
        border: "2px solid #4a4f54", borderRadius: 4,
        boxShadow: "inset 0 2px 0 rgba(255,255,255,.2), 0 4px 6px rgba(0,0,0,.4)",
        backgroundImage: `linear-gradient(to bottom,#b0b8c0,#7d8a92,#5d6266),
                          repeating-linear-gradient(0deg, rgba(0,0,0,.2) 0 1px, transparent 1px 10px)`,
      }}/>
      {/* roof */}
      <div style={{
        width: 0, height: 0,
        borderLeft: "22px solid transparent", borderRight: "22px solid transparent",
        borderBottom: "22px solid #b1361f",
        margin: "-58px auto 0", position: "relative", zIndex: 1,
        filter: "drop-shadow(0 2px 2px rgba(0,0,0,.4))",
      }}/>
      {/* flag */}
      <div style={{ position: "absolute", left: "50%", top: -22, width: 2, height: 18, background: "#3d2f1f", transform: "translateX(-50%)" }}/>
      <div style={{ position: "absolute", left: "50%", top: -22, marginLeft: 1, width: 10, height: 7, background: "linear-gradient(to bottom,#e7423a,#a51a14)", clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)" }}/>
    </div>
  );
}

function Pennant() {
  return (
    <div style={{ width: 16, height: 30, position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 6, width: 2, height: 30, background: "#3d2f1f" }}/>
      <div style={{ position: "absolute", top: 2, left: 8, width: 12, height: 16, background: "linear-gradient(to bottom,#e7423a,#a51a14)", border: "1px solid #6e120c", clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 70%, 0 100%)", boxShadow: "1px 1px 0 rgba(0,0,0,.3)" }}/>
    </div>
  );
}

// ---------- VARIANT C — Crépuscule (twilight + lit windows) ----------
function VillageC() {
  return (
    <div data-screen-label="C Crépuscule" style={{
      flex: 1, position: "relative", overflow: "hidden",
      background: `
        linear-gradient(180deg, #2a2347 0%, #4a3563 15%, #8a4f5e 30%, #c97c5a 45%, #6e6b48 65%, #2e3a26 100%)`,
    }}>
      {/* stars */}
      <div style={{ position: "absolute", inset: "0 0 65% 0", opacity: .8, zIndex: 0,
        backgroundImage: `radial-gradient(circle at 10% 20%, #fff 0.7px, transparent 1.2px),
                          radial-gradient(circle at 40% 10%, #fff 0.7px, transparent 1.2px),
                          radial-gradient(circle at 70% 25%, #fff 0.7px, transparent 1.2px),
                          radial-gradient(circle at 88% 8%, #f1c40f 0.9px, transparent 1.5px),
                          radial-gradient(circle at 25% 6%, #fff 0.5px, transparent 1px)`,
        backgroundSize: "120px 80px, 90px 60px, 100px 70px, 150px 100px, 80px 50px" }}/>

      {/* moon */}
      <div style={{ position: "absolute", top: 12, right: 28, width: 36, height: 36, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 30%,#fff8d8,#e8d27a 60%,#b89942)",
        boxShadow: "0 0 30px rgba(255, 230, 140, .55), inset -4px -4px 8px rgba(0,0,0,.18)",
        zIndex: 1 }}/>

      {/* distant hill silhouette */}
      <svg viewBox="0 0 360 80" preserveAspectRatio="none" style={{ position: "absolute", top: 95, left: 0, width: "100%", height: 70, zIndex: 1 }}>
        <path d="M0,80 C40,40 80,55 140,40 C200,28 240,60 300,42 C340,30 360,46 360,80 Z" fill="#1d2a16" opacity=".9"/>
        <path d="M0,80 C50,60 100,72 170,58 C230,46 280,76 360,62 L360,80 Z" fill="#101a0c"/>
      </svg>

      {/* path */}
      <svg viewBox="0 0 360 540" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}>
        <defs>
          <linearGradient id="pathGradN" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#6c5a3a"/>
            <stop offset="1" stopColor="#3f3422"/>
          </linearGradient>
        </defs>
        <path d="M -10 130 C 60 160, 140 100, 200 180 S 320 240, 380 220
                 M 200 180 C 180 260, 90 320, 60 420
                 M 200 180 C 230 280, 290 360, 340 460"
              stroke="url(#pathGradN)" strokeWidth="22" fill="none" strokeLinecap="round" opacity=".85"/>
      </svg>

      {/* night ground veil */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 70%, rgba(20,12,32,0) 0%, rgba(15,8,28,0.45) 80%)" }}/>

      {/* mist near horizon */}
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, height: 60, zIndex: 2,
        background: "linear-gradient(to bottom, rgba(180,180,210,0) 0%, rgba(190,200,225,.3) 50%, rgba(180,180,210,0) 100%)",
        filter: "blur(4px)", pointerEvents: "none" }}/>

      {/* decoration */}
      <Tree top={60}  left={205}/>
      <Tree top={150} left={155} scale={0.85}/>
      <Bush top={260} left={50}/>
      <Bush top={420} left={180}/>

      {/* torch lights along path */}
      <Torch top={195} left={88}/>
      <Torch top={300} left={102}/>
      <Torch top={250} left={285}/>
      <Torch top={390} left={70}/>

      {/* buildings — dim slightly + warm glow */}
      {FREE_LAYOUT.map(b => (
        <BuildingSprite key={b.id} src={B(b.id)} top={b.top} left={b.left} width={b.w}
          level={b.level} building={b.building} timeLeft={b.timeLeft} label={b.name}
          dim={0.78} glow="rgba(255,180,90,.55)"/>
      ))}

      {/* warm window dots overlay — fake-lit windows */}
      <WindowGlow top={150} left={175} size={5}/>
      <WindowGlow top={165} left={205} size={6}/>
      <WindowGlow top={120} left={155} size={4}/>
      <WindowGlow top={250} left={262} size={4}/>
      <WindowGlow top={350} left={155} size={4}/>
      <WindowGlow top={342} left={75} size={4}/>
      <WindowGlow top={360} left={285} size={4}/>

      <SceneChrome zone="Le Grand Nord — Crépuscule" subzone="22:14"/>
    </div>
  );
}

function Torch({ top, left }) {
  const z = Math.round(top + 5);
  return (
    <div style={{ position: "absolute", top, left, zIndex: z }}>
      {/* glow */}
      <div style={{ position: "absolute", left: -22, top: -22, width: 60, height: 60, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,180,80,.55) 0%, rgba(255,140,40,0) 70%)", pointerEvents: "none" }}/>
      {/* post */}
      <div style={{ position: "relative", width: 3, height: 18, background: "#3d2f1f", marginLeft: 6 }}/>
      {/* flame */}
      <div style={{ position: "absolute", top: -6, left: 3, width: 9, height: 12, borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%",
        background: "radial-gradient(circle at 50% 70%, #fff7c8, #f6b73a 50%, #d56020)",
        boxShadow: "0 0 8px rgba(255,170,60,.9)" }}/>
    </div>
  );
}

function WindowGlow({ top, left, size = 4 }) {
  return (
    <div style={{ position: "absolute", top, left, width: size, height: size, zIndex: 600,
      background: "#fff2a0", borderRadius: 1.5,
      boxShadow: `0 0 ${size * 3}px ${size}px rgba(255, 200, 80, .8)` }}/>
  );
}

// ---------- SceneChrome (location chip + action buttons) ----------
function SceneChrome({ zone, subzone }) {
  return (
    <>
      <div style={{ position: "absolute", top: 8, left: 8, zIndex: 1000,
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "linear-gradient(to bottom,rgba(0,0,0,.55),rgba(0,0,0,.7))",
        border: "2px solid rgba(255,255,255,.18)", borderRadius: 9999, padding: "4px 10px",
        fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 11, color: "#fff",
        textShadow: "1px 1px 1px rgba(0,0,0,.6)", boxShadow: "0 2px 4px rgba(0,0,0,.4)" }}>
        <img src={I("position")} style={{ width: 12, height: 12 }} alt=""/>{zone}
        <span style={{ opacity: .65, fontWeight: 500, marginLeft: 2 }}>· {subzone}</span>
      </div>

      {/* right column: zoom + quest */}
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1000,
        display: "flex", flexDirection: "column", gap: 6 }}>
        <ChromeIconBtn>＋</ChromeIconBtn>
        <ChromeIconBtn>−</ChromeIconBtn>
      </div>

      {/* bottom-left floating quest pin */}
      <div style={{ position: "absolute", bottom: 14, left: 10, zIndex: 1000,
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "linear-gradient(to bottom,#f6d57b,#c59e3f)",
        border: "2px solid #9e7b0d", borderRadius: 12, padding: "5px 10px 5px 6px",
        boxShadow: "0 2px 0 rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.4)" }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%",
          background: "linear-gradient(to bottom,#fff,#e0c87a)", border: "2px solid #9e7b0d",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 13, color: "#3a2a00" }}>!</span>
        <span style={{ fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 11, color: "#3a2a00", textShadow: "0 1px 0 rgba(255,255,255,.4)" }}>
          Quête : améliorer la caserne
        </span>
      </div>
    </>
  );
}

function ChromeIconBtn({ children }) {
  return (
    <button style={{
      width: 32, height: 32, borderRadius: 10,
      background: "linear-gradient(to bottom,rgba(60,38,25,.92),rgba(40,24,14,.92))",
      border: "2px solid rgba(255,255,255,.2)",
      color: "#fff", fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 16,
      textShadow: "1px 1px 1px rgba(0,0,0,.6)",
      cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.2)",
    }}>{children}</button>
  );
}

// ---------- Phone wrapper (HUD + scene + nav) ----------
function PhoneVariant({ children, tab = "build" }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: "#1a1a2e", fontFamily: "var(--bftc-font-body)" }}>
      <TopBarPatched {...HUD_PROPS}/>
      {children}
      <BottomNav active={tab}/>
    </div>
  );
}

// TopBar from components.jsx points its asset paths at ../../assets — patch by overriding image srcs via a wrapper that rewrites the prefix isn't trivial. Instead, re-implement a lightweight TopBar here using the local "assets/" prefix.
function TopBarPatched({ name, level, power, crowns, resources }) {
  return (
    <div style={{
      width: "100%", display: "flex", alignItems: "center", gap: 8,
      background: "linear-gradient(to bottom,rgba(60,38,25,.95),rgba(78,56,34,.95))",
      borderBottom: "2px solid #8b7355", padding: "8px 10px", position: "relative", zIndex: 2000,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "linear-gradient(to bottom,#8b6f47,#6d5838)", border: "2px solid #5d4a32",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 12, color: "#fff",
        textShadow: "1px 1px 1px rgba(0,0,0,.5)", position: "relative", flexShrink: 0,
      }}>
        SK
        <span style={{ position: "absolute", bottom: -4, right: -4,
          background: "linear-gradient(to bottom,#f6d57b,#c59e3f)",
          border: "2px solid #9e7b0d", borderRadius: "50%", width: 18, height: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, color: "#3a2a00" }}>{level}</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <SmallBadge dark><img src={I("army-power")} style={{ width: 12, height: 12, marginRight: 3 }}/>{power}</SmallBadge>
          <SmallBadge gold><img src={I("crown")} style={{ width: 12, height: 12, marginRight: 3 }}/>{crowns}</SmallBadge>
        </div>
        <div style={{ display: "flex", gap: 5, width: "100%" }}>
          <ResChip icon={R("wood")}  {...resources.wood}/>
          <ResChip icon={R("stone")} {...resources.stone}/>
          <ResChip icon={R("iron")}  {...resources.iron}/>
          <ResChip icon={R("population")} {...resources.population}/>
        </div>
      </div>
    </div>
  );
}

function SmallBadge({ children, gold, dark }) {
  const bg = gold ? "linear-gradient(to bottom,#f6d57b,#c59e3f)" : "linear-gradient(to bottom,#8b6f47,#5d4a32)";
  const bd = gold ? "#9e7b0d" : "#3d2f1f";
  const c  = gold ? "#3a2a00" : "#fff";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 0, padding: "1px 7px", height: 20,
      background: bg, border: `2px solid ${bd}`, borderRadius: 9999,
      fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 11, color: c,
      textShadow: c === "#fff" ? "1px 1px 1px rgba(0,0,0,.4)" : "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)",
    }}>{children}</span>
  );
}

function ResChip({ icon, value, sub }) {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", gap: 5,
      background: "rgba(0,0,0,.4)", border: "2px solid rgba(255,255,255,.12)",
      borderRadius: 8, padding: "3px 6px", minWidth: 0,
    }}>
      <img src={icon} style={{ width: 20, height: 20, flexShrink: 0, filter: "drop-shadow(0 1px 1px rgba(0,0,0,.5))" }} alt=""/>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 11, color: "#fff",
          textShadow: "1px 1px 1px rgba(0,0,0,.5)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
        <span style={{ fontFamily: "var(--bftc-font-display)", fontSize: 9, color: "#cdb88a" }}>{sub}</span>
      </div>
    </div>
  );
}

// ---------- Public wrappers used by the artboards ----------
function PhoneA() { return <PhoneVariant><VillageA/></PhoneVariant>; }
function PhoneB() { return <PhoneVariant><VillageB/></PhoneVariant>; }
function PhoneC() { return <PhoneVariant><VillageC/></PhoneVariant>; }

Object.assign(window, { PhoneA, PhoneB, PhoneC });
