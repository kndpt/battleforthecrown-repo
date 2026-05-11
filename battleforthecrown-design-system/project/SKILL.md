---
name: battle-for-the-crown-design
description: Use this skill to generate well-branded interfaces and assets for Battle for the Crown — a medieval mobile-first conquest MMORTS. Contains essential design guidelines, color tokens, type system, fonts, asset icons (buildings, resources, units, UI bits) and a JSX UI kit for prototyping.
user-invocable: true
---

# Battle for the Crown — design skill

Read `README.md` first — it covers the brand voice (French, archaic, narrative), the visual foundations (parchment + wood + amber, Cinzel display, 4 strong border + drop-shadow component shell), the iconography (PNG game-art for buildings/resources, lucide-style strokes for chrome) and the index of files in this skill.

## Files you'll use most
- `colors_and_type.css` — full design tokens. **Import this in every artifact.**
- `assets/` — `buildings/*.png`, `resources/*.png`, `icons/*.png`, `army/*.png`, `casual-icons/*.png`, `bg/*` for backdrops. Copy these into your output rather than redrawing.
- `ui_kits/game/{components,screens}.jsx` — `GradientButton`, `Badge`, `Card`, `ProgressBar`, `ResourceHUD`, `TopBar`, `BottomNav`, `Modal`, `LoginScreen`, `VillageScreen`, `BuildingDetailModal`. Lift these straight in.
- `preview/*.html` — calibrated reference cards for every token and component.

## When working
- Mobile-first (~360px). Phone bezel is the default frame.
- Always design with copy in **French**, archaic / narrative register. Tu/vous: use **vous** for system voice, **tu** in player-to-player. No emoji.
- Use the 5-color "game palette" (green/blue/red/gold/stone) for any actionable surface; parchment + wood for chrome; amber kingdom palette for the brand spine.
- Every interactive surface gets the BftC shell: 2-4px solid border, vertical top-light → bottom-dark gradient, inset light rim, drop shadow `0 4px 0` + soft.
- If you need an icon and we don't have it, FLAG IT and fall back to a Lucide stroke (2px, round caps). Do not draw new game-art PNGs.

## If the user asks for…
- **A mock / slide / static design** → produce HTML + the tokens CSS + copied assets. Use the JSX components if you want React.
- **Production code** → quote tokens and component patterns from this skill, but adapt to their stack.
- **Vague brief** → ask 4-6 questions: what surface (in-game vs landing vs admin?), French or English, mobile/desktop, which variants to explore, hi-fi vs sketch.
