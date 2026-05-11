# Merge worktree - design system React

## Plan

- [x] Préserver le suivi existant du run ticket 42 présent sur `main`.
- [x] Merger le worktree `codex/design-system-react-port`.
- [x] Résoudre le conflit `tasks/todo.md`.
- [x] Finaliser le merge commit.
- [x] Vérifier l'état final du repo principal.

## Run ticket 42 - Combat conquest hook

- Correctness : `CombatWorker` ouvre `PendingConquest` seulement si victoire + Seigneur survivant, retire le NOBLE du retour et le stationne en garnison cible.
- Correctness : une attaque hostile qui tue le NOBLE de garnison interrompt la fenetre; `conquest:finalize` reste no-op si statut `INTERRUPTED`.
- Correctness : branche `noble.killed` cablee, mais scenario "armee gagne + Seigneur unique mort" reste non atteignable avec l'algo actuel `floor(1 * lossRatio)` en victoire.
- Readability : pertes defenseur mutualisees via helper, durees capture explicites par tier/niveau Chateau.
- Architecture : event `noble.killed` ajoute au contrat shared + outbox + binding Pixi; docs realtime/data-model mises a jour.
- Security : notifications routees par `attackerUserId`, pas via ownership mutable du village cible.
- Performance : lectures bornees aux participants/garnisons de la cible; pas de scan global.
- Verification : smokes `combat-conquest-hook` + `conquest-finalize`, `yarn static-check` verts.

## Design system React preview

- Correctness : `/design-system` expose une preview publique sans auth.
- Architecture : composants isolés dans `features/design-system` tant qu'ils ne sont pas validés pour promotion vers `src/ui` ou `features/layout`.
- Skill : `.agents/skills/bftc-design-system-migration` ajouté pour cadrer les prochains ports.
- Preview routing : `/design-system` isolé dans `main.tsx` pour éviter le chargement de `env.ts` sans `VITE_API_BASE_URL`.
- Primitives initiales : `BftcButton`, `ResourceHud`, `BottomNavPreview`.
- Core loop : `Timer`, `DigitTimer`, `CostPill`, `CostRow`, `RequirementChip`, `ProgressBar`, `BuildQueueCard`.
- Feedback/military : `IconTile`, `PanelSurface`, `ToastPreview`, `EmptyState`, `TroopRow`, `TroopStepper`, `CombatReportCard`, `CombatReportMiniList`.
- Carte/social/messages : `Badge`, `SegmentedControl`, `NumberStepper`, `Avatar`, `CoordinateInput`, `MapMarker`, `ArmyMarchMarker`, `MapCallout`, `PlayerProfileCard`, `LeaderboardRow`, `MailInboxItem`, `ChatPanel`.
- Structure/economie/meta : `HeaderBar`, `MiniCard`, `GameInput`, `GameModal`, `IconButton`, `BannerTitle`, `Divider`, `InfoCard`.
- Gameplay/meta : `AchievementCard`, `QuestCard`, `FeaturedQuestCard`, `DailyReward`, `ShopTile`, `PremiumBundle`, `BoostPill`, `ActiveBoostList`, `PipRating`, `LevelChip`, `PowerComparison`, `ScoutReport`, `ArmyMovementRow`, `HeraldicShield`, `AllianceBanner`, `AllianceRow`.
- Composition : composants pilotés par props/interfaces, fixtures dans `DesignSystemPreview.tsx`, réutilisation des primitives (`BftcButton`, `CostPill`, `ProgressBar`, `SegmentedControl`, `Avatar`, `NumberStepper`).
- Corrections visuelles : carte alignée sur le prototype, assets barbares `world/entity/barbarian-village-tier*.png`, animations pulse attaque/défense, callouts sombres en card.
- Corrections densité : `HeaderBar` compact, `PremiumBundle` responsive, prix/valeurs non coupés, icônes dimensionnées explicitement.
- Verification : `yarn workspace battleforthecrown-pixi type-check`, `yarn workspace battleforthecrown-pixi build`, `yarn static-check` verts avant merge.
- QA preview : `/design-system` HTTP 200 ; rendu SSR Vite de `DesignSystemPreview` OK.

## Merge Review

- Conflit unique : `tasks/todo.md`.
- Résolution : conservation des notes utiles du run ticket 42 et synthèse du run design-system dans un fichier unique.
