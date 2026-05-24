/* global React, BFTC_T, PixelBtn, Pill, Glyph */
/* Connexion / Inscription — 4 artboards, mobile 360x720.
   A) Landing héraldique          — couronne + 2 CTA + raccourcis SSO/invité
   B) Connexion                   — formulaire pseudo + mdp, SSO en bas
   C) Inscription                 — création de compte, jauge de mdp, CGU
   D) Création du seigneur        — nom + choix d'écu héraldique */

const { useState: useStateA } = React;

const ASSET_A = "assets";
const I_A = (n) => `${ASSET_A}/icons/${n}.png`;
const C_A = (n) => `${ASSET_A}/casual-icons/${n}.png`;
const U_A = (n) => `${ASSET_A}/ui/${n}.png`;
const B_A = (n) => `${ASSET_A}/buildings/${n}.png`;

// =============================================================================
// Shared chrome
// =============================================================================

// Parchment phone shell — radial parchment gradient like the existing
// LoginScreen, faint vignette, decorative castle silhouette in the corner.
function ParchmentShell({ children, withCastle = true, style }) {
  return (
    <div style={{
      width: 360, height: 720, position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse at top, #e8d5b7 0%, #f5e6d3 45%, #d4c094 100%)",
      fontFamily: BFTC_T.font, color: BFTC_T.ink,
      ...style,
    }}>
      {/* Faint horizon vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at center 110%, rgba(60,38,25,.18), transparent 55%)",
      }}/>
      {/* Faded castle silhouette */}
      {withCastle && (
        <img src={B_A("castle")} alt="" style={{
          position: "absolute", right: -22, bottom: -30, width: 180, opacity: 0.12,
          filter: "saturate(0) brightness(0.4)",
        }}/>
      )}
      {children}
    </div>
  );
}

// Subtle status bar so artboards feel like real device screens.
function StatusBar({ tone = "dark" }) {
  const c = tone === "dark" ? "rgba(60,38,25,.7)" : "#fff";
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

// =============================================================================
// Heraldic field — gold crown on a black/parchment disc
// =============================================================================
function CrownSigil({ size = 110 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "radial-gradient(circle at 35% 30%, #fff4cf, #f1c40f 40%, #9e7b0d 90%)",
      border: "5px solid #5d4a32",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 10px 22px rgba(0,0,0,.4), inset 0 4px 6px rgba(255,255,255,.45), inset 0 -6px 10px rgba(0,0,0,.25)",
      position: "relative", flexShrink: 0,
    }}>
      <img src={I_A("crown")} alt="" style={{
        width: size * 0.62, height: size * 0.62,
        filter: "drop-shadow(0 3px 3px rgba(0,0,0,.4))",
      }}/>
      {/* tiny gold pinpoints around the disc */}
      {[18, 90, 162, 234, 306].map(d => (
        <span key={d} style={{
          position: "absolute", width: 5, height: 5, borderRadius: "50%",
          background: "#f1c40f", boxShadow: "0 0 6px rgba(241,196,15,.8)",
          top: `${50 - 48 * Math.cos(d * Math.PI / 180)}%`,
          left: `${50 + 48 * Math.sin(d * Math.PI / 180)}%`,
          transform: "translate(-50%,-50%)",
        }}/>
      ))}
    </div>
  );
}

// Wordmark — uses the banner art with the title overlaid
function Wordmark({ size = "lg" }) {
  const fs = size === "lg" ? 30 : size === "md" ? 22 : 18;
  return (
    <div style={{ textAlign: "center", lineHeight: 1.05 }}>
      <div style={{
        fontFamily: BFTC_T.font, fontWeight: 900, fontSize: fs,
        color: BFTC_T.woodBark, letterSpacing: ".02em",
        textShadow: "1px 1px 0 rgba(255,255,255,.55), 0 2px 3px rgba(0,0,0,.18)",
      }}>
        Battle for<br/>the Crown
      </div>
      <div style={{
        marginTop: 6,
        fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 12,
        color: BFTC_T.inkSoft,
      }}>« Forgez votre royaume. »</div>
    </div>
  );
}

// =============================================================================
// Inputs — chunky 4px-bordered parchment field with engraved label
// =============================================================================
function ParchField({ label, icon, placeholder, value, type = "text", secure = false, error, hint, onChange }) {
  const [reveal, setReveal] = useStateA(false);
  const showAsPassword = secure && !reveal;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{
        fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700,
        color: BFTC_T.inkSoft, letterSpacing: ".22em", textTransform: "uppercase",
      }}>{label}</label>
      <div style={{
        position: "relative",
        background: "linear-gradient(to bottom, #fef9f0, #f0dfba)",
        border: `3px solid ${error ? "#a13a2a" : "#8b7355"}`,
        borderRadius: 10,
        boxShadow: "inset 0 2px 4px rgba(60,38,25,.18), 0 1px 0 rgba(255,255,255,.5)",
        display: "flex", alignItems: "center", padding: "8px 10px", gap: 8,
      }}>
        {icon && (
          <span style={{
            width: 22, height: 22, borderRadius: 5,
            background: "linear-gradient(to bottom, #b6a78a, #8b7355)",
            border: "1.5px solid #5d4a32",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 12,
            textShadow: "1px 1px 1px rgba(0,0,0,.5)", flexShrink: 0,
          }}>{icon}</span>
        )}
        <input
          type={showAsPassword ? "password" : type}
          defaultValue={value}
          placeholder={placeholder}
          onChange={onChange}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontFamily: BFTC_T.font, fontWeight: 600, fontSize: 14, color: BFTC_T.ink,
            letterSpacing: ".02em", minWidth: 0,
          }}
        />
        {secure && (
          <button onClick={() => setReveal(!reveal)} style={{
            background: "none", border: "none", cursor: "pointer", padding: 4,
            color: BFTC_T.inkSoft, fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 700,
          }}>{reveal ? "Cacher" : "Voir"}</button>
        )}
      </div>
      {(error || hint) && (
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 10.5, fontStyle: error ? "normal" : "italic",
          color: error ? "#a13a2a" : BFTC_T.inkSoft,
          paddingLeft: 2,
        }}>{error || hint}</div>
      )}
    </div>
  );
}

// Strength meter — 4 segments, color graduates with strength.
function StrengthBar({ score = 2 }) {
  const labels = ["Faible", "Moyen", "Bon", "Robuste"];
  const colors = ["#a13a2a", "#c89b2a", "#6ebf49", "#3a6c1f"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 5, borderRadius: 3,
            background: i < score ? colors[score - 1] : "rgba(60,38,25,.18)",
            boxShadow: i < score ? "inset 0 1px 0 rgba(255,255,255,.4)" : "inset 0 1px 2px rgba(0,0,0,.15)",
          }}/>
        ))}
      </div>
      <span style={{
        fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700,
        color: colors[Math.max(0, score - 1)], letterSpacing: ".1em", textTransform: "uppercase",
      }}>Sceau {labels[Math.max(0, score - 1)]}</span>
    </div>
  );
}

// SSO chip — neutral stone button with brand glyph (no logo lifted, just a
// monogram inside a tinted bezel).
function SsoChip({ kind = "google", label }) {
  const monogram = { google: "G", apple: "", email: "✉" }[kind];
  return (
    <button style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      flex: 1, padding: "10px 8px", cursor: "pointer",
      background: "linear-gradient(to bottom, #fef9f0, #e8d4a8)",
      border: "2px solid #8b7355", borderRadius: 10,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.5), 0 2px 0 rgba(0,0,0,.18)",
      fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 11.5, color: BFTC_T.ink,
      letterSpacing: ".04em",
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "linear-gradient(to bottom, #3d2f1f, #1a1208)",
        color: "#f6e4b8", display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 900, lineHeight: 1, fontFamily: "Georgia, serif",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
      }}>{monogram}</span>
      {label}
    </button>
  );
}

// "OR" divider with seal-style ornament
function HeraldicDivider({ label = "ou" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0" }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(60,38,25,.4), rgba(60,38,25,.4))" }}/>
      <span style={{
        fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700, color: BFTC_T.inkSoft,
        letterSpacing: ".3em", textTransform: "uppercase",
      }}>· {label} ·</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(60,38,25,.4), rgba(60,38,25,.4))" }}/>
    </div>
  );
}

// Back arrow in a small wood badge
function BackBtn({ label = "Retour" }) {
  return (
    <button style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "linear-gradient(to bottom, rgba(60,38,25,.92), rgba(78,56,34,.92))",
      border: "2px solid #3c2619", borderRadius: 8, padding: "5px 10px 5px 8px",
      color: "#f0e0c0", fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 11,
      letterSpacing: ".08em", textShadow: "1px 1px 1px rgba(0,0,0,.5)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.18), 0 2px 0 rgba(0,0,0,.2)",
      cursor: "pointer",
    }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>‹</span>{label}
    </button>
  );
}

// =============================================================================
// A — Landing — 3 variations
// =============================================================================

// A1 — Crest impérial (cleaned : couronne en disque + wordmark, sans banderole)
function AuthArtboardA1() {
  return (
    <ParchmentShell>
      <StatusBar/>

      {/* Eyebrow simple, gravé sur parchemin */}
      <div style={{
        marginTop: 18, textAlign: "center",
        fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 10.5, letterSpacing: ".4em",
        color: "rgba(60,38,25,.55)", textTransform: "uppercase",
        textShadow: "0 1px 0 rgba(255,255,255,.5)",
      }}>· Chronique du royaume ·</div>

      {/* Crest stack — crown + wordmark */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 22, padding: "44px 24px 0",
      }}>
        <CrownSigil size={134}/>
        <Wordmark size="lg"/>
      </div>

      {/* CTAs — pinned bottom */}
      <div style={{
        position: "absolute", left: 20, right: 20, bottom: 20,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <PixelBtn variant="success" size="lg" full>
          Reprendre l'aventure
        </PixelBtn>
        <PixelBtn variant="wood" size="md" full>
          Forger un nouveau royaume
        </PixelBtn>
        <div style={{
          display: "flex", justifyContent: "center", gap: 14, marginTop: 6,
          fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 700, color: BFTC_T.inkSoft,
          letterSpacing: ".06em",
        }}>
          <span style={{ borderBottom: "1.5px dotted rgba(60,38,25,.4)", paddingBottom: 1, cursor: "pointer" }}>
            Lien magique
          </span>
          <span style={{ color: "rgba(60,38,25,.3)" }}>·</span>
          <span style={{ borderBottom: "1.5px dotted rgba(60,38,25,.4)", paddingBottom: 1, cursor: "pointer" }}>
            Entrer en visiteur
          </span>
        </div>
      </div>
    </ParchmentShell>
  );
}

// A2 — Aube sur le château : horizon orangé, silhouette du château + tour de guet,
// soleil bas, wordmark gravé dans le ciel, CTAs au sol.
function AuthArtboardA2() {
  return (
    <div style={{
      width: 360, height: 720, position: "relative", overflow: "hidden",
      fontFamily: BFTC_T.font, color: BFTC_T.ink,
      background: "linear-gradient(to bottom, #1a1b2e 0%, #4a2e2a 35%, #b85d2e 60%, #f1b96f 78%, var(--parchment-500) 78%, var(--parchment-700) 100%)",
    }}>
      <StatusBar tone="light"/>

      {/* Sun disc (low on horizon) */}
      <div style={{
        position: "absolute", left: "50%", top: "55%",
        transform: "translate(-50%, -50%)",
        width: 110, height: 110, borderRadius: "50%",
        background: "radial-gradient(circle, #fff4cf 0%, #f1c40f 40%, rgba(241,196,15,0) 75%)",
        filter: "blur(0.5px)",
      }}/>
      <div style={{
        position: "absolute", left: "50%", top: "55%",
        transform: "translate(-50%, -50%)",
        width: 54, height: 54, borderRadius: "50%",
        background: "radial-gradient(circle, #fff8e0 0%, #f6d57b 60%, #c59e3f 100%)",
        boxShadow: "0 0 30px rgba(246,213,123,.6)",
      }}/>

      {/* Distant stars in the deep sky */}
      {[[60,30,1.5],[120,45,1],[180,18,2],[240,52,1.5],[290,28,1],[80,68,1],[210,80,1.5],[310,75,1]].map(([x,y,r],i) => (
        <span key={i} style={{
          position: "absolute", left: x, top: y, width: r*2, height: r*2,
          borderRadius: "50%", background: "#fff", opacity: 0.6,
          boxShadow: `0 0 ${r*3}px rgba(255,255,255,.5)`,
        }}/>
      ))}

      {/* Wordmark — engraved into the sky */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 90, textAlign: "center",
        zIndex: 2,
      }}>
        <div style={{
          fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 32, lineHeight: 1.05,
          color: "#f6e4b8", letterSpacing: ".06em",
          textShadow: "0 2px 6px rgba(0,0,0,.7), 0 0 16px rgba(246,213,123,.3)",
        }}>Battle for<br/>the Crown</div>
        <div style={{
          marginTop: 10, fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 13,
          color: "rgba(246,228,184,.78)",
          textShadow: "0 1px 3px rgba(0,0,0,.6)",
        }}>« Quand le soleil se lève, le royaume s'éveille. »</div>
      </div>

      {/* Painted sprites against the dawn — soft warm shadow on the ground */}
      <img src={B_A("castle")} alt="" style={{
        position: "absolute", left: "50%", top: "57%",
        transform: "translate(-50%, -78%)",
        width: 170,
        filter: "drop-shadow(0 6px 8px rgba(0,0,0,.45)) drop-shadow(0 0 14px rgba(241,185,111,.35))",
        zIndex: 1,
      }}/>
      <img src={B_A("watchtower")} alt="" style={{
        position: "absolute", left: 26, top: "57%",
        transform: "translate(0, -82%)",
        width: 90,
        filter: "drop-shadow(0 5px 6px rgba(0,0,0,.4)) drop-shadow(0 0 10px rgba(241,185,111,.25))",
        zIndex: 1,
      }}/>
      <img src={B_A("warehouse")} alt="" style={{
        position: "absolute", right: 24, top: "57%",
        transform: "translate(0, -68%)",
        width: 70,
        filter: "drop-shadow(0 4px 5px rgba(0,0,0,.4)) drop-shadow(0 0 8px rgba(241,185,111,.25))",
        zIndex: 1,
      }}/>

      {/* Ground texture — warm dawn light on the meadow */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: "22%",
        background: "linear-gradient(to bottom, rgba(184,93,46,.18) 0%, rgba(109,88,56,.18) 100%)",
        pointerEvents: "none", zIndex: 2,
      }}/>

      {/* CTAs */}
      <div style={{
        position: "absolute", left: 20, right: 20, bottom: 22,
        display: "flex", flexDirection: "column", gap: 10, zIndex: 3,
      }}>
        <PixelBtn variant="warning" size="lg" full>
          Reprendre l'aventure
        </PixelBtn>
        <PixelBtn variant="wood" size="md" full>
          Forger un nouveau royaume
        </PixelBtn>
      </div>
    </div>
  );
}

// A3 — Sceau royal : grand écu héraldique au centre (azur + couronne) + tablette
// de bois où s'inscrit le titre, ornement seal sous le tout.
function AuthArtboardA3() {
  return (
    <ParchmentShell withCastle={false}>
      <StatusBar/>

      <div style={{
        position: "absolute", left: 0, right: 0, top: 38, textAlign: "center",
        fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 10, letterSpacing: ".4em",
        color: "rgba(60,38,25,.5)", textTransform: "uppercase",
      }}>· Anno regni ·</div>

      {/* Large heraldic shield */}
      <div style={{
        position: "absolute", left: "50%", top: 90, transform: "translateX(-50%)",
        width: 200, height: 235,
        filter: "drop-shadow(0 12px 16px rgba(0,0,0,.35))",
      }}>
        {/* Field */}
        <div style={{
          position: "absolute", inset: 0,
          clipPath: "polygon(50% 100%, 0% 75%, 0% 8%, 8% 0%, 92% 0%, 100% 8%, 100% 75%)",
          background: "linear-gradient(to bottom, #3a72b8, #1f4d85)",
          border: "4px solid #3c2619",
          boxShadow: "inset 0 3px 0 rgba(255,255,255,.3), inset 0 -16px 22px rgba(0,0,0,.3)",
        }}/>
        {/* Chevron — heraldic flair */}
        <div style={{
          position: "absolute", inset: 0,
          clipPath: "polygon(50% 100%, 0% 75%, 0% 8%, 8% 0%, 92% 0%, 100% 8%, 100% 75%)",
        }}>
          <svg viewBox="0 0 100 115" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none">
            <path d="M 8,80 L 50,42 L 92,80 L 92,72 L 50,30 L 8,72 Z" fill="#f6d57b" opacity="0.85"/>
          </svg>
        </div>
        {/* Crown icon */}
        <img src={I_A("crown")} alt="" style={{
          position: "absolute", left: "50%", top: 30,
          transform: "translateX(-50%)", width: 84,
          filter: "drop-shadow(0 4px 5px rgba(0,0,0,.5))",
        }}/>
        {/* Stars under chevron */}
        {[[28,90],[50,98],[72,90]].map(([x,y],i) => (
          <span key={i} style={{
            position: "absolute", left: `${x}%`, top: `${y}%`,
            transform: "translate(-50%,-50%)", color: "#f6d57b",
            fontFamily: BFTC_T.font, fontSize: 14, fontWeight: 900,
            textShadow: "0 1px 2px rgba(0,0,0,.5)",
          }}>✦</span>
        ))}
      </div>

      {/* Carved wood plank with the title */}
      <div style={{
        position: "absolute", left: 22, right: 22, top: 360,
        background: "linear-gradient(to bottom, #8b6f47 0%, #5d4a32 50%, #3d2f1f 100%)",
        border: "3px solid #2a1c10", borderRadius: 14,
        boxShadow:
          "0 8px 18px rgba(0,0,0,.35)," +
          "inset 0 2px 0 rgba(255,255,255,.18)," +
          "inset 0 -2px 0 rgba(0,0,0,.4)",
        padding: "16px 18px 18px",
        textAlign: "center",
      }}>
        {/* Wood-grain lines */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 11, pointerEvents: "none",
          background:
            "repeating-linear-gradient(90deg, rgba(0,0,0,.06) 0 1px, transparent 1px 18px)," +
            "repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 1px, transparent 1px 7px)",
          opacity: 0.55,
        }}/>
        <div style={{
          fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 26, lineHeight: 1.05,
          color: "#f6e4b8", letterSpacing: ".03em",
          textShadow: "0 2px 3px rgba(0,0,0,.7), 0 -1px 0 rgba(0,0,0,.4)",
          position: "relative",
        }}>Battle for<br/>the Crown</div>
        <div style={{
          marginTop: 8,
          fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 12, color: "#cdb88a",
          textShadow: "0 1px 1px rgba(0,0,0,.5)",
          position: "relative",
        }}>« Trois lis, une couronne, mille batailles. »</div>
        {/* Wax seal underneath */}
        <div style={{
          position: "absolute", left: "50%", bottom: -16, transform: "translateX(-50%)",
          width: 34, height: 34, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #d04830, #8a1e15)",
          border: "2px solid #4d100a",
          boxShadow: "0 4px 6px rgba(0,0,0,.4), inset 0 2px 3px rgba(255,255,255,.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 14,
          textShadow: "0 1px 1px rgba(0,0,0,.6)",
        }}>♔</div>
      </div>

      {/* CTAs */}
      <div style={{
        position: "absolute", left: 20, right: 20, bottom: 20,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <PixelBtn variant="success" size="lg" full>
          Reprendre l'aventure
        </PixelBtn>
        <PixelBtn variant="wood" size="md" full>
          Forger un nouveau royaume
        </PixelBtn>
        <div style={{
          display: "flex", justifyContent: "center", gap: 14, marginTop: 4,
          fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 700, color: BFTC_T.inkSoft,
          letterSpacing: ".06em",
        }}>
          <span style={{ borderBottom: "1.5px dotted rgba(60,38,25,.4)", paddingBottom: 1, cursor: "pointer" }}>
            Lien magique
          </span>
          <span style={{ color: "rgba(60,38,25,.3)" }}>·</span>
          <span style={{ borderBottom: "1.5px dotted rgba(60,38,25,.4)", paddingBottom: 1, cursor: "pointer" }}>
            Entrer en visiteur
          </span>
        </div>
      </div>
    </ParchmentShell>
  );
}

// =============================================================================
// B — Connexion (formulaire)
// =============================================================================
function AuthArtboardB() {
  return (
    <ParchmentShell withCastle={false}>
      <StatusBar/>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 18px 0" }}>
        <BackBtn/>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700, color: BFTC_T.inkSoft,
          letterSpacing: ".3em", textTransform: "uppercase",
        }}>Connexion · 1/1</span>
      </div>

      {/* Head */}
      <div style={{ padding: "12px 22px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <CrownSigil size={68}/>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 22, color: BFTC_T.woodBark,
            letterSpacing: ".02em", textShadow: "1px 1px 0 rgba(255,255,255,.5)",
          }}>Reprendre l'aventure</div>
          <div style={{
            marginTop: 3, fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 11.5,
            color: BFTC_T.inkSoft,
          }}>Le royaume vous attend, Sire.</div>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "12px 22px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <ParchField label="Nom de seigneur" icon="✦" placeholder="ex. SireKelvin" value="SireKelvin"/>
        <ParchField label="Sceau secret" icon="✶" placeholder="•••••••" secure value="motdepasse"/>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 700,
        }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: BFTC_T.inkSoft, cursor: "pointer" }}>
            <span style={{
              width: 16, height: 16, borderRadius: 4,
              background: "linear-gradient(to bottom, #6ebf49, #4a8c2a)",
              border: "1.5px solid #3a6c1f", display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 900, lineHeight: 1, textShadow: "1px 1px 1px rgba(0,0,0,.4)",
            }}>✓</span>
            Se souvenir
          </label>
          <span style={{
            color: BFTC_T.woodBark, borderBottom: "1.5px dotted rgba(60,38,25,.5)",
            paddingBottom: 1, cursor: "pointer", letterSpacing: ".02em",
          }}>Sceau oublié ?</span>
        </div>
      </div>

      {/* Main CTA */}
      <div style={{ padding: "16px 22px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        <PixelBtn variant="success" size="lg" full>Entrer dans le royaume</PixelBtn>

        <HeraldicDivider/>

        <div style={{ display: "flex", gap: 8 }}>
          <SsoChip kind="google" label="Google"/>
          <SsoChip kind="apple"  label="Apple"/>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 18,
        display: "flex", justifyContent: "center", alignItems: "center", gap: 8,
        fontFamily: BFTC_T.font, fontSize: 11.5, fontWeight: 700, color: BFTC_T.inkSoft,
      }}>
        Pas encore de royaume ?
        <span style={{
          color: BFTC_T.woodBark, borderBottom: "1.5px solid rgba(60,38,25,.5)", paddingBottom: 1,
          cursor: "pointer",
        }}>En forger un →</span>
      </div>
    </ParchmentShell>
  );
}

// =============================================================================
// C — Inscription
// =============================================================================
function AuthArtboardC() {
  return (
    <ParchmentShell withCastle={false}>
      <StatusBar/>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 18px 0" }}>
        <BackBtn/>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700, color: BFTC_T.inkSoft,
          letterSpacing: ".3em", textTransform: "uppercase",
        }}>Inscription · 1/2</span>
      </div>

      {/* Head — smaller, more form-room */}
      <div style={{ padding: "8px 22px 4px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px",
          background: "linear-gradient(to bottom, #f6d57b, #c59e3f)",
          border: "1.5px solid #9e7b0d", borderRadius: 999,
          fontFamily: BFTC_T.font, fontSize: 9.5, fontWeight: 800, color: "#3a2a00",
          letterSpacing: ".18em", textTransform: "uppercase", whiteSpace: "nowrap",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.5)",
        }}>
          <img src={C_A("crown")} alt="" style={{ width: 12, height: 12 }}/>
          Fonder un royaume
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 22, color: BFTC_T.woodBark,
          letterSpacing: ".02em", textShadow: "1px 1px 0 rgba(255,255,255,.5)",
        }}>Que la couronne<br/>vous distingue</div>
      </div>

      {/* Form */}
      <div style={{ padding: "10px 22px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <ParchField label="Nom de seigneur" icon="✦" placeholder="ex. SireKelvin" hint="3 à 16 caractères, sans espace"/>
        <ParchField label="Plis royaux" icon="✉" placeholder="seigneur@royaume.fr" type="email"/>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <ParchField label="Sceau secret" icon="✶" placeholder="•••••••" secure value="forge2025"/>
          <div style={{ paddingLeft: 2, marginTop: -2 }}>
            <StrengthBar score={3}/>
          </div>
        </div>
      </div>

      {/* CGU + CTA */}
      <div style={{
        position: "absolute", left: 22, right: 22, bottom: 18,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <label style={{
          display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer",
          fontFamily: BFTC_T.font, fontSize: 10.5, fontWeight: 600, color: BFTC_T.inkSoft,
          lineHeight: 1.35,
        }}>
          <span style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
            background: "linear-gradient(to bottom, #6ebf49, #4a8c2a)",
            border: "1.5px solid #3a6c1f", display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 11, fontWeight: 900, textShadow: "1px 1px 1px rgba(0,0,0,.4)",
          }}>✓</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            Je jure allégeance aux <span style={{ color: BFTC_T.woodBark, borderBottom: "1px dotted" }}>Édits du Royaume</span> et reconnais la <span style={{ color: BFTC_T.woodBark, borderBottom: "1px dotted" }}>Charte de discrétion</span>.
          </span>
        </label>
        <PixelBtn variant="warning" size="lg" full>
          <img src={C_A("crown")} alt="" style={{ width: 16, height: 16, marginRight: 4 }}/>
          Forger mon royaume
        </PixelBtn>
        <div style={{
          textAlign: "center",
          fontFamily: BFTC_T.font, fontSize: 11, fontWeight: 700, color: BFTC_T.inkSoft,
        }}>
          Déjà un royaume ?
          <span style={{
            marginLeft: 5, color: BFTC_T.woodBark,
            borderBottom: "1.5px solid rgba(60,38,25,.5)", paddingBottom: 1, cursor: "pointer",
          }}>Reprendre →</span>
        </div>
      </div>
    </ParchmentShell>
  );
}

// =============================================================================
// D — Création du seigneur (nom + écu héraldique)
// =============================================================================

// Heraldic shield — gradient field with a symbol on top.
function HeraldShield({ field, accent, symbol, selected, onSelect, label }) {
  return (
    <button onClick={onSelect} style={{
      width: "100%", aspectRatio: "1 / 1.15",
      position: "relative", padding: 0, cursor: "pointer",
      border: "none", background: "transparent",
      filter: selected ? "drop-shadow(0 0 8px rgba(241,196,15,.7))" : "drop-shadow(0 4px 6px rgba(0,0,0,.3))",
      transition: "transform .15s",
    }}>
      {/* Shield silhouette (path approximation via clip-path) */}
      <div style={{
        position: "absolute", inset: 0,
        clipPath: "polygon(50% 100%, 0% 75%, 0% 8%, 8% 0%, 92% 0%, 100% 8%, 100% 75%)",
        background: `linear-gradient(to bottom, ${field[0]}, ${field[1]})`,
        border: `3px solid ${selected ? "#f1c40f" : "#3c2619"}`,
        boxShadow: "inset 0 2px 0 rgba(255,255,255,.25), inset 0 -10px 18px rgba(0,0,0,.25)",
      }}/>
      {/* Bend (diagonal band) — heraldic flair */}
      <div style={{
        position: "absolute", inset: 0,
        clipPath: "polygon(50% 100%, 0% 75%, 0% 8%, 8% 0%, 92% 0%, 100% 8%, 100% 75%)",
        background: `linear-gradient(135deg, transparent 38%, ${accent} 38%, ${accent} 52%, transparent 52%)`,
        opacity: 0.6,
        mixBlendMode: "overlay",
      }}/>
      {/* Symbol */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        paddingBottom: 8,
      }}>
        <span style={{
          fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 36,
          color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,.6)",
          lineHeight: 1,
        }}>{symbol}</span>
      </div>
      {/* Selected ribbon */}
      {selected && (
        <div style={{
          position: "absolute", top: 4, right: 4,
          background: "linear-gradient(to bottom, #f6d57b, #c59e3f)",
          border: "1.5px solid #9e7b0d", borderRadius: 999,
          padding: "1px 6px",
          fontFamily: BFTC_T.font, fontWeight: 800, fontSize: 8, color: "#3a2a00",
          letterSpacing: ".18em", textTransform: "uppercase",
        }}>Choisi</div>
      )}
      {label && (
        <div style={{
          position: "absolute", bottom: -16, left: 0, right: 0, textAlign: "center",
          fontFamily: BFTC_T.font, fontWeight: 700, fontSize: 10, color: BFTC_T.inkSoft,
          letterSpacing: ".08em",
        }}>{label}</div>
      )}
    </button>
  );
}

function AuthArtboardD() {
  const [selectedShield, setSelectedShield] = useStateA(1);

  const shields = [
    { id: 0, label: "Or & Sang",   field: ["#c0392b", "#7d1e15"], accent: "#f6d57b", symbol: "♕" },
    { id: 1, label: "Azur Royal",  field: ["#3a72b8", "#1f4d85"], accent: "#f6d57b", symbol: "✦" },
    { id: 2, label: "Sinople",     field: ["#5a8f3a", "#2f5b1c"], accent: "#f6d57b", symbol: "♘" },
    { id: 3, label: "Sable & Or",  field: ["#2c2520", "#0c0a08"], accent: "#f6d57b", symbol: "♔" },
    { id: 4, label: "Pourpre",     field: ["#7a3a7d", "#43204a"], accent: "#f6d57b", symbol: "✠" },
    { id: 5, label: "Argent",      field: ["#b5b8be", "#7c8088"], accent: "#3c2619", symbol: "⚜" },
  ];

  return (
    <ParchmentShell withCastle={false}>
      <StatusBar/>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 18px 0" }}>
        <BackBtn/>
        <span style={{
          fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700, color: BFTC_T.inkSoft,
          letterSpacing: ".3em", textTransform: "uppercase",
        }}>Inscription · 2/2</span>
      </div>

      {/* Head */}
      <div style={{ padding: "10px 22px 8px", textAlign: "center" }}>
        <div style={{
          fontFamily: BFTC_T.font, fontWeight: 900, fontSize: 20, color: BFTC_T.woodBark,
          letterSpacing: ".02em", textShadow: "1px 1px 0 rgba(255,255,255,.5)",
        }}>Forgez votre étendard</div>
        <div style={{
          marginTop: 3, fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 11.5,
          color: BFTC_T.inkSoft,
        }}>« Que vos couleurs guident vos vassaux. »</div>
      </div>

      {/* Seigneur name */}
      <div style={{ padding: "0 22px 8px" }}>
        <ParchField label="Nom du seigneur" icon="✦" value="Sire Kelvin"/>
      </div>

      {/* Shields */}
      <div style={{ padding: "4px 22px 0" }}>
        <div style={{
          fontFamily: BFTC_T.font, fontSize: 10, fontWeight: 700, color: BFTC_T.inkSoft,
          letterSpacing: ".22em", textTransform: "uppercase", marginBottom: 8,
        }}>Blason</div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px 14px",
          paddingBottom: 22, // room for the selected ribbon
        }}>
          {shields.map(s => (
            <HeraldShield
              key={s.id}
              field={s.field}
              accent={s.accent}
              symbol={s.symbol}
              label={s.label}
              selected={selectedShield === s.id}
              onSelect={() => setSelectedShield(s.id)}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: "absolute", left: 22, right: 22, bottom: 18,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <PixelBtn variant="warning" size="lg" full>
          Lever l'étendard
        </PixelBtn>
        <div style={{
          textAlign: "center",
          fontFamily: BFTC_T.font, fontStyle: "italic", fontSize: 10.5,
          color: BFTC_T.inkSoft,
        }}>« On reconnaît le seigneur à ses couleurs, pas à ses paroles. »</div>
      </div>
    </ParchmentShell>
  );
}

Object.assign(window, {
  AuthArtboardA1, AuthArtboardA2, AuthArtboardA3,
  AuthArtboardB, AuthArtboardC, AuthArtboardD,
});
