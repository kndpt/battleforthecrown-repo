# Design system React

Portage React/Tailwind du bundle `battleforthecrown-design-system/project`.

## Objectif

- Reproduire visuellement les prototypes HTML, pas leur structure interne.
- Valider les composants ici avant de remplacer le legacy `features/ui-test`.
- Garder les composants sans logique métier tant qu'ils ne sont pas intégrés à un écran réel.

## Preview

Route locale : `/design-system`

Composants portés pour le premier batch :

- `BftcButton` depuis `preview/components-buttons.html`
- `ResourceHud` depuis `preview/components-resource-hud.html`
- `BottomNavPreview` depuis `preview/components-bottom-nav.html`

Batch core loop :

- `Timer` / `DigitTimer` depuis `preview/components-timer.html`
- `CostRow` / `CostPill` depuis `preview/components-cost-row.html`
- `RequirementChip` depuis `preview/components-requirement-chip.html`
- `ProgressBar` depuis `preview/components-progress.html`
- `BuildQueueCard` depuis `preview/components-build-queue.html`, composé avec `Timer`, `ProgressBar` et `BftcButton`

Batch feedback / militaire :

- `IconTile` et `PanelSurface` comme briques de surface partagées
- `ToastPreview` depuis `preview/components-toast.html`
- `EmptyState` depuis `preview/components-empty-state.html`
- `TroopRow` depuis `preview/components-troop-row.html`
- `TroopStepper` depuis `preview/components-troop-stepper.html`, composé avec `CostPill` et `BftcButton`
- `CombatReportCard` / `CombatReportMiniList` depuis `preview/components-combat-report.html`

Batch carte / social / messages :

- `Badge` depuis `preview/components-badges.html`
- `SegmentedControl` depuis `preview/components-segmented.html`
- `NumberStepper` depuis `preview/components-stepper.html`, réutilisé par `TroopStepper`
- `CoordinateInput` depuis `preview/components-coordinate-input.html`
- `Avatar` depuis `preview/components-avatar.html`
- `MapMarker`, `MapDot`, `ArmyMarchMarker`, `MapCallout` depuis `preview/components-map-marker.html`
- `PlayerProfileCard` depuis `preview/components-player-profile.html`
- `LeaderboardRow` depuis `preview/components-leaderboard.html`
- `MailInboxItem` depuis `preview/components-mail-inbox.html`
- `ChatPanel` depuis `preview/components-chat-bubble.html`

Batch structure / économie / meta :

- `HeaderBar` depuis `preview/components-header.html`
- `MiniCard` depuis `preview/components-cards.html`
- `GameInput` depuis `preview/components-inputs.html`
- `GameModal` depuis `preview/components-modals.html`
- `IconButton` depuis `preview/components-icon-buttons.html`
- `BannerTitle` depuis `preview/components-banner-title.html`
- `Divider` depuis `preview/components-divider.html`
- `InfoCard` depuis `preview/components-tooltip.html`, adapté en card réutilisable
- `AchievementCard` depuis `preview/components-achievement.html`
- `QuestCard` / `FeaturedQuestCard` depuis `preview/components-quest-card.html`
- `DailyReward` depuis `preview/components-daily-reward.html`
- `ShopTile` depuis `preview/components-shop-tile.html`
- `PremiumBundle` depuis `preview/components-premium-bundle.html`
- `BoostPill` / `ActiveBoostList` depuis `preview/components-boost-pill.html`
- `PipRating` / `LevelChip` depuis `preview/components-pip-rating.html`
- `PowerComparison` depuis `preview/components-power-comparison.html`
- `ScoutReport` depuis `preview/components-scout-report.html`
- `ArmyMovementRow` depuis `preview/components-army-movement.html`
- `HeraldicShield`, `AllianceBanner`, `AllianceRow` depuis `preview/components-alliance-banner.html`

## Workflow de migration

1. Lire le prototype HTML + `_card.css` + `colors_and_type.css`.
2. Porter en React/Tailwind avec dimensions, couleurs, ombres et textes identiques.
3. Ajouter le composant à `DesignSystemPreview.tsx`.
4. Quand validé, promouvoir vers `src/ui/` ou `src/features/layout/` selon le scope.
5. Remplacer les usages legacy par petits lots vérifiables.

## Contrat composant

- Tout composant expose une interface `Props` nommée.
- Les données d'exemple restent dans `DesignSystemPreview.tsx`.
- Un composant réutilisable ne hardcode pas de noms, quantités, rapports, tabs, coûts ou actions.
- Les composants composés réutilisent les primitives existantes (`BftcButton`, `CostPill`, `Timer`, `PanelSurface`, etc.).
- Les composants interactifs utilisent de vrais contrôles sémantiques et des props contrôlées (`value/onChange`, `active/onChange`, `open/onClose`).
- La preview doit démontrer l'interaction avec du state React, pas seulement afficher une maquette statique.
