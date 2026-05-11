# Battle for the Crown — Game UI Kit

High-fidelity re-creation of the in-game mobile interface. Pixel-perfect components
lifted from `battleforthecrown-pixi/frontend/src/components/ui/*`. These are
cosmetic re-implementations (no real game logic) intended for prototypes & mocks.

## Files
- `index.html` — playable click-thru: Login → Village → Building details
- `components.jsx` — `GradientButton`, `Badge`, `Card`, `ResourceHUD`, `BottomNav`, `Modal`, `ProgressBar`, `TopBar`
- `screens.jsx` — `LoginScreen`, `VillageScreen`, `BuildingDetailModal`, `WorldMapScreen`

## How to read
Open `index.html`. The phone frame uses the iOS starter component. Buttons
navigate between fake screens via React state — there is no backend.
