# Battle for the Crown — Design System

> _« Un jeu de stratégie de conquête médiévale lisible mais profond : des choix clairs, des décisions lourdes de conséquences, et un monde vivant où chaque village a une identité. »_

**Battle for the Crown** is a mobile-first MMORTS — build a village, raise an army, conquer the crown. Inspired by Kingsage and Tribal Wars, with the loops simplified for short (2–5 min) mobile sessions. The frontend is a Vite + React 19 + PixiJS v8 single-page app; this design system captures its visual language so any new screen, slide or marketing asset stays on-brand.

## Index

- `colors_and_type.css` — design tokens (colors, type, shadows). Import in every artifact.
- `SKILL.md` — Agent-Skill manifest, cross-compatible with Claude Code.
- `assets/` — `buildings/`, `resources/`, `army/`, `icons/`, `casual-icons/`, `bg/`, `ui/` PNG game-art lifted from the live game.
- `fonts/` — Cinzel webfont fallbacks (otherwise loaded from Google Fonts).
- `preview/` — small calibrated reference cards used by the Design System tab.
- `ui_kits/game/` — React/JSX recreation of the in-game mobile UI (`index.html`, `components.jsx`, `screens.jsx`).

## Sources

This system was assembled by reading the live codebase. Paths are relative to the original mounts and require view access on the originals to follow:

| Source | Where | What's in it |
|---|---|---|
| `battleforthecrown-pixi/` | Vite/React/Pixi frontend | `src/ui/*` primitives (Button, Card, Badge, Panel, Modal, HeaderBar, ResourceDisplay…), `src/features/*` screens, Tailwind config with the full color tokens, `public/assets/` PNGs (army, buildings, resources, casual icons, banner) |
| `ui-test/` | Standalone UI demo screen | `UiTestScreen.tsx` + `components/*Section.tsx` — one demo section per primitive, useful as a Storybook substitute |

Both are mounted read-only via the Import menu. If you re-attach the project, those folders need to be re-mounted to re-read the source.

## What this system covers

- **`colors_and_type.css`** — every color and type token as CSS custom properties (`--kingdom-*`, `--game-*`, `--parchment-*`, semantic `bftc-h1` classes, shadow/radius/spacing tokens).
- **`assets/`** — every PNG used in-game: building sprites, unit portraits, resource icons, the wood/parchment banner, the favicon.
- **`preview/`** — small HTML cards (~700×Hpx) that render in the Design System tab of this project.
- **`ui_kits/game/`** — interactive React recreation of the core in-game screens (Village HUD, Army, Building modal, World Map, Landing).
- **`SKILL.md`** — Agent Skill entrypoint, so this folder can be dropped into a Claude Code project and used as a `bftc-design` skill.

## Index

```
README.md                  ← you are here
SKILL.md                   ← Agent Skill manifest
colors_and_type.css        ← all design tokens
assets/
  army/                    ← militia, squire, archer, savage, templar
  buildings/               ← castle, farm, barracks, wood, stone, iron, warehouse, watchtower
  resources/               ← wood, stone, iron, population
  casual-icons/            ← coin, crown, bell-gold, card-gold
  icons/                   ← crown, lock, clock, position, army-power, hand-{gold,red,silver}
  ui/banner.png            ← decorative wood banner
  bg/plain.png             ← world-map plains tile
  favicon.svg
preview/                   ← Design System tab cards
ui_kits/game/
  README.md
  index.html               ← clickable demo (login → village → army → world)
  *.jsx                    ← one component per primitive / screen
```

---

## Content fundamentals

**Language.** French (Québec-neutral). Tone is _seigneurial_ but never stuffy — the player is addressed as a noble (`Sire`, `Dame`, `Baron`), the narrator speaks like a herald.

**Voice.** Second person, formal. _« Construisez la caserne pour débloquer »_, _« Reprendre l'aventure »_, _« Recruter »_. Never "tu", never English fillers. Imperative for actions, indicative for state.

**Tone vocabulary.** Build / conquer / pillage / lord / crown / kingdom / forge / siege. Direct verbs (`Construire`, `Attaquer`, `Recruter`, `Annuler`), no marketing fluff, no exclamation marks.

**Casing.**
- **Display titles** in title-case: _Battle for the Crown_, _Camp de bûcherons_, _Tour de guet_.
- **Button labels** are mostly sentence-case (`Construire`, `Annuler`, `Reprendre l'aventure`) **except** classic confirmations which go ALL-CAPS for emphasis: `OK`, `ACCEPTER`, `NON`, `VICTOIRE`.
- **Level / cost numerics** use `Niv. 3`, `LVL 1 → LVL 3`, `+50 bois/h`, `10.000 G` (French thousands separator).
- **Eyebrows** above headlines: ALL CAPS with `0.3em` letter-spacing — _MMORTS MÉDIÉVAL_.

**Numbers.** French formatting (`8.500`, `10.000 G`). Always show units (`bois/h`, `G`, `Niv.`). Resource production is signed (`+120/h`). Times use compact form: `2:15`, `1h 30m`, `45s`.

**Microcopy patterns.**
- Locks: _« Construisez la caserne pour débloquer »_, _« Château niv. 5 requis »_.
- Empty states: a flavor quote, not "no data". e.g. _« À ceux qui osent, le royaume offre gloire et richesses. »_
- Errors as toasts (`Entraînement impossible`, `Ressources insuffisantes`) — short title + body sentence.
- Confirmations are always two-button: neutral `Annuler` + colored action verb.

**Emoji.** Used sparingly as a **fallback** when a sprite is missing (`🏰`, `🪓`, `⛏️`, `⚒️`, `🌾`, `🏛️`, `🗼`, `🧱`, `🕳️`, `🏆`, `👥`) — never decoratively. Replace with the matching PNG from `assets/buildings/` or `assets/resources/` whenever you can.

---

## Visual foundations

**Aesthetic.** Mobile clay-strategy — fat rounded cards, gradient fills, thick borders, drop-shadowed buttons that "press down" on tap. Think Clash of Clans / Rise of Kingdoms re-skinned for a Tribal-Wars-style web client. Not photoreal, not pixel-art — illustrated isometric PNG sprites on parchment/wood/stone surfaces.

**Palette.**
- **Spine** — warm browns: parchment (`#f4e4c1 → #d4c094`), wood (`#8b6f47 → #5d4a32`), kingdom amber (`#f59e0b → #92400e`). Used for cards, panels, headers.
- **Five action colors** — green (success / build), blue (info / training / accept), gold (warning / in-progress / premium), red (danger / attack / cancel), stone (neutral / locked). Each has `light / dark / border` triplet; every actionable surface uses a vertical gradient between light and dark with the border drawn in the matching darker tone.
- **Backdrop** — the app shell sits on `#1a1a2e` (deep navy), almost never seen — every screen fills it with a parchment-gradient or a Pixi canvas.

**Type.** **Cinzel** is the only font in the system (`font-cinzel`, alias `font-game`). It carries everything: titles, body, buttons, numerics. Georgia is the platform fallback. There is _no_ sans-serif anywhere — even tabular numbers ride Cinzel with `font-variant-numeric: tabular-nums`.

**Backgrounds.** Soft radial / vertical gradients on parchment tones. The landing uses `from-[#e8d5b7] via-[#f5e6d3] to-[#d4c094]`. In-game screens get the `bg-parchment` (`#d2b48c`) flat fill. The Pixi world-map uses a tiled plains PNG (`assets/bg/plain.png`). **No** photography. **No** abstract gradients. **No** hand-drawn SVG illustrations — all imagery is the PNG sprite set.

**Animation.** Snappy and discrete. Hover = `brightness(1.1)`. Press = `translateY(2px)` + inner-shadow swap (the button "sinks"). Cards = `scale(1.02)` hover / `scale(0.98) translateY(0.5px)` press. Tab change = `scale(1.05)` + gold-glow box-shadow on active icon. Transitions all sit in 100–300ms. One named keyframe: `shimmer` (2s infinite) for loading bars.

**Hover & press states.**
- **Buttons**: hover → brightness up; active → `translate-y-0.5` + `inset 0 2px 4px rgba(0,0,0,0.5)`.
- **Cards**: hover → `scale(1.02)` + lift shadow; active → `scale(0.98) translateY(0.5px)`.
- **Nav tabs**: inactive → wood gradient; active → gold gradient + `0 0 16px rgba(250,224,120,0.45)` glow + scale up.
- **Locked controls**: `opacity: 0.4`, cursor `not-allowed`, icon swapped to `<Lock />`, gray-stone gradient.

**Borders.** Always **2px** (cards, panels, badges, avatars, buttons) — **4px** for inputs (chunky pen-stroke feel) and modals (double-ringed). The border color is always one step _darker_ than the fill's dark stop, never neutral gray.

**Outlines vs borders.** Cards stack three contours: a 2px inner border (`border-[#d4c094]`) + a 4px white-ish outline (`outline outline-[4px] outline-white`) + the clay shadow. The outline is what gives the "carved" / sticker look.

**Shadows.**
- **Inner highlight (top)** — `inset 0 1px 0 rgba(255,255,255,0.4)` — on every button and badge.
- **Inner shadow (bottom)** — `inset 0 -18px 28px rgba(0,0,0,0.18)` — on every Card to give "depth into the parchment".
- **Drop "clay" shadow** — `0 18px 38px rgba(23,26,33,0.24), 0 6px 10px rgba(23,26,33,0.18)` — the "molded" feel.
- **Pressed shadow** — `inset 0 2px 4px rgba(0,0,0,0.5)` — swapped in on `:active`.
- **Bottom nav up-shadow** — `0 -6px 18px rgba(0,0,0,0.45)`.
- **Modal halo** — `0 0 0 2px <darker border>, 0 8px 32px <tint>` — the modal wears a 2px ring of its variant color plus a colored glow.

**Text shadow.** Every button label, every card title, every white-on-color heading carries `1px 1px 2px rgba(0,0,0,0.7)`. It's load-bearing — without it the buttons read flat and the Cinzel loses its medieval weight.

**Transparency & blur.** Used twice and twice only:
- Modal overlay: `bg-black/60 + backdrop-blur-sm`.
- Bottom nav: `bg-gradient … /85–/95 + backdrop-blur-md` (the wood gradient is translucent so the village canvas peeks through).
Otherwise surfaces are fully opaque — this isn't a glassmorphism brand.

**Corner radii.** Buttons `rounded-md` (6px). Inputs `rounded-xl` (12px). Cards `rounded-2xl` (16px). Badges and avatars `rounded-full`. Panels `rounded-lg` (8px). Modal `rounded-lg`. No mixed-radius corners — every shape commits.

**Cards.** The signature element. A `<Card>` carries: 2px inner border, 4px outline ring, gradient fill (parchment / wood / stone / default-silver), absolute-positioned inner light layer (white-to-transparent), absolute-positioned inner deep-shadow layer, then the content. There is no flat "card on white" — every card sits on its own gradient slab.

**Layout rules.**
- **Mobile-first**. `min-h-screen` containers, `max-w-screen-lg mx-auto`, fluid `w-full` cards.
- **Header is fixed-feel at top** (two-row: profile + power+crowns row, then resources+population row), bottom nav is `fixed bottom-0` with safe-area padding.
- **Modals always 90% width with `max-w-md/2xl/4xl/6xl`** + a 4px header strip on the modal's gradient.
- **Cards laid out in a 2-col grid on mobile**, 3–4 on tablet+; gap `space-3` (12px).

**Imagery tone.** Warm. PNG sprites are isometric, painterly, mid-saturation — they read as plasticine more than wood/stone. No grain, no filters. Background plain tiles are airy daylight green.

---

## Iconography

The codebase mixes **two** icon systems on purpose:

1. **Lucide React** (`lucide-react` 1.14.0) — line icons for UI chrome: `Crown`, `Shield`, `Swords`, `Hammer`, `Home`, `Mail`, `Globe`, `Lock`, `Settings`, `Plus`, `Trash2`, `X`, `XCircle`, `Clock`, `Users`. Standard stroke. Drawn at 12–28px, typically `text-white drop-shadow-md` inside a colored gradient circle (the "icon-button" pattern).
2. **In-house PNG sprite set** — fully-painted illustrated icons for game content: every building, every unit, every resource, plus a "casual" set (`crown`, `coin`, `bell-gold`, `card-gold`) used on header badges and toast adornments. Always rendered ≥40px so the painting shows; never tinted. There's also a Pixi spritesheet at `assets/strategy-icons/spritesheet.{png,json}` that the world map uses, kept out of this design system (it's Pixi-only).

**Substitution rule.** If a UI metaphor exists in Lucide, use Lucide. If it's a game noun (building, unit, resource, crown, coin), use the PNG. The two should not be mixed for the same noun.

**Emoji.** Used **only** as last-resort fallback in `BUILDING_META` when a PNG is missing (`🧱` for Wall, `🕳️` for Hideout). The asset bar in `assets/buildings/` is the source of truth; emoji is the failure mode.

**Unicode.** Used for quotes (« » em-spaced French style), ellipses (…), middle-dots (·). No other unicode-as-icon usage.

**CDN.** Lucide is available at `https://unpkg.com/lucide-static@latest/icons/<name>.svg` if you need it outside React. In this design system the React kits import `lucide-react` from `https://esm.sh/lucide-react@1.14.0`.

---

## Caveats / things to confirm

- **Cinzel** is loaded from Google Fonts (not from the codebase — there are no font files in `public/`). If you have a different file or want a tighter cut (e.g. Cinzel Decorative for display only), drop it in `fonts/` and update `colors_and_type.css`.
- The `strategy-icons` Pixi spritesheet was not unpacked here — it's referenced from PixiJS code paths and the JSON atlas is large. Leave it as a binary import.
- The legacy Next.js front (referenced as `../battleforthecrown/`) is not mounted; this system only reflects the Pixi rewrite.
- A few UI primitives (`Tooltip`, `ProgressBar`, `Slider`, `Spinner`, `Toast`, `NumericKeypadSheet`) are recreated visually in the UI kit but with simplified behavior — they're not 1:1 ports of the codebase's logic.
