/* global React, GradientButton, Badge, Card, ProgressBar, TopBar, BottomNav, Modal */
const { useState } = React;

// ---------- LoginScreen ----------
function LoginScreen({ onLogin }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", padding: "32px 24px",
      background: "radial-gradient(ellipse at top,#e8d5b7 0%,#f5e6d3 45%,#d4c094 100%)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <div style={{
          width: 130, height: 130, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%,#fff4cf,#f1c40f 40%,#9e7b0d 90%)",
          border: "6px solid #5d4a32", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 18px rgba(0,0,0,.35), inset 0 4px 6px rgba(255,255,255,.45), inset 0 -6px 10px rgba(0,0,0,.25)",
        }}>
          <img src="../../assets/icons/crown.png" style={{ width: 80, height: 80, filter: "drop-shadow(0 3px 3px rgba(0,0,0,.4))" }} alt=""/>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--bftc-font-display)", fontWeight: 800, fontSize: 36, lineHeight: 1.05, color: "#3c2619", textShadow: "1px 1px 0 rgba(255,255,255,.5)" }}>Battle for<br/>the Crown</div>
          <div style={{ fontFamily: "var(--bftc-font-display)", fontStyle: "italic", fontSize: 13, color: "#6d5838", marginTop: 8 }}>Forgez votre royaume.</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <GradientButton variant="success" size="lg" onClick={onLogin} style={{ justifyContent: "center" }}>Reprendre l'aventure</GradientButton>
        <GradientButton variant="neutral" size="md" onClick={onLogin} style={{ justifyContent: "center" }}>Nouveau royaume</GradientButton>
        <div style={{ textAlign: "center", fontFamily: "var(--bftc-font-display)", fontStyle: "italic", fontSize: 11, color: "#6d5838", marginTop: 8 }}>« À ceux qui osent, le royaume offre gloire et richesses. »</div>
      </div>
    </div>
  );
}

// ---------- VillageScreen ----------
const BUILDINGS = [
  { id: "castle",     name: "Château",            icon: "../../assets/buildings/castle.png",     level: 3, status: "idle" },
  { id: "barracks",   name: "Caserne",            icon: "../../assets/buildings/barracks.png",   level: 2, status: "building", progress: 72, timeLeft: "2:15" },
  { id: "farm",       name: "Ferme",              icon: "../../assets/buildings/farm.png",       level: 4, status: "idle" },
  { id: "warehouse",  name: "Entrepôt",           icon: "../../assets/buildings/warehouse.png",  level: 2, status: "idle" },
  { id: "watchtower", name: "Tour de guet",       icon: "../../assets/buildings/watchtower.png", level: 1, status: "idle" },
  { id: "wood",       name: "Camp de bûcherons",  icon: "../../assets/buildings/wood.png",       level: 3, status: "idle" },
  { id: "stone",      name: "Carrière",           icon: "../../assets/buildings/stone.png",      level: 2, status: "idle" },
  { id: "iron",       name: "Mine de fer",        icon: "../../assets/buildings/iron.png",       level: 1, status: "idle" },
];

function BuildingTile({ b, onClick }) {
  const isBuilding = b.status === "building";
  return (
    <Card variant={isBuilding ? "wood" : "parchment"} onClick={onClick} style={{ cursor: "pointer", padding: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: 78, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "2px solid rgba(0,0,0,.18)", background: isBuilding ? "linear-gradient(to bottom,rgba(255,255,255,.15),rgba(0,0,0,.1))" : "transparent" }}>
        <img src={b.icon} style={{ width: 64, height: 64, objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(0,0,0,.35))" }} alt=""/>
        <span style={{ position: "absolute", top: 4, right: 4 }}><Badge size="sm" variant={isBuilding ? "warning" : "default"}>Niv. {b.level}</Badge></span>
        {isBuilding && <span style={{ position: "absolute", bottom: 3, left: 4, display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(0,0,0,.55)", borderRadius: 6, padding: "1px 5px", fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 9, color: "#f1c40f" }}><img src="../../assets/icons/clock.png" style={{ width: 10, height: 10 }} alt=""/>{b.timeLeft}</span>}
      </div>
      <div style={{ padding: "6px 8px 8px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 11, lineHeight: 1.15 }}>{b.name}</div>
        {isBuilding && <div style={{ marginTop: 4 }}><ProgressBar value={b.progress} variant="warning"/></div>}
      </div>
    </Card>
  );
}

function VillageScreen({ onSelect }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#7eab57 0%,#5b8f3a 60%,#3d6e1f 100%)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "radial-gradient(circle at 20% 30%,#fff 1px,transparent 1px), radial-gradient(circle at 60% 70%,#fff 1px,transparent 1px), radial-gradient(circle at 80% 20%,#fff 1px,transparent 1px)", backgroundSize: "40px 40px,60px 60px,50px 50px" }}/>
      <div style={{ position: "relative", padding: "10px 10px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,.4)", border: "2px solid rgba(255,255,255,.18)", borderRadius: 9999, padding: "3px 10px", fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 12, color: "#fff", textShadow: "1px 1px 1px rgba(0,0,0,.5)" }}>
          <img src="../../assets/icons/position.png" style={{ width: 14, height: 14 }} alt=""/>Le Grand Nord
        </div>
        <Badge variant="info">Niv. 12</Badge>
      </div>
      <div style={{ flex: 1, padding: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignContent: "start", position: "relative" }}>
        {BUILDINGS.map(b => <BuildingTile key={b.id} b={b} onClick={() => onSelect(b)}/>)}
      </div>
    </div>
  );
}

// ---------- BuildingDetailModal ----------
function BuildingDetailModal({ building, onClose }) {
  if (!building) return null;
  return (
    <Modal open onClose={onClose}>
      <Card variant="parchment" style={{ padding: 0 }}>
        <div style={{ padding: "14px 16px", borderBottom: "3px solid #8b7355", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(to bottom,#d4c094,#c9a882)" }}>
          <img src={building.icon} style={{ width: 56, height: 56, filter: "drop-shadow(0 2px 3px rgba(0,0,0,.3))" }} alt=""/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--bftc-font-display)", fontWeight: 700, fontSize: 18, color: "#3c2619" }}>{building.name}</div>
            <div style={{ marginTop: 4 }}><Badge variant="warning">Niveau {building.level}</Badge></div>
          </div>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontFamily: "var(--bftc-font-display)", fontSize: 13, fontStyle: "italic", color: "#4b5563" }}>« Le {building.name.toLowerCase()} produit, jour et nuit, pour la gloire du royaume. »</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontFamily: "var(--bftc-font-display)" }}>
            <div style={{ background: "#fef9f0", border: "2px solid #d4c094", borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 10, color: "#6d5838", letterSpacing: ".04em" }}>PRODUCTION</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#3c2619" }}>+120/h</div>
            </div>
            <div style={{ background: "#fef9f0", border: "2px solid #d4c094", borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 10, color: "#6d5838", letterSpacing: ".04em" }}>STOCK</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#3c2619" }}>8.500 / 10.000</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,.55)", border: "2px solid #d4c094", borderRadius: 10, padding: 10 }}>
            <div style={{ fontFamily: "var(--bftc-font-display)", fontWeight: 600, fontSize: 12, color: "#3c2619", marginBottom: 6 }}>Amélioration → Niveau {building.level + 1}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <Badge variant="default"><img src="../../assets/resources/wood.png" style={{ width: 12, height: 12, marginRight: 3 }}/>1.200</Badge>
              <Badge variant="default"><img src="../../assets/resources/stone.png" style={{ width: 12, height: 12, marginRight: 3 }}/>800</Badge>
              <Badge variant="warning"><img src="../../assets/icons/clock.png" style={{ width: 12, height: 12, marginRight: 3 }}/>1h 30m</Badge>
            </div>
            <GradientButton variant="success" style={{ width: "100%", justifyContent: "center" }}>Construire</GradientButton>
          </div>
          <GradientButton variant="neutral" onClick={onClose} style={{ justifyContent: "center" }}>Fermer</GradientButton>
        </div>
      </Card>
    </Modal>
  );
}

Object.assign(window, { LoginScreen, VillageScreen, BuildingDetailModal });
