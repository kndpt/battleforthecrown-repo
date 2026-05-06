# 09 — Cibles de carte peu informatives avant attaque

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-pixi`, `battleforthecrown-backend`, `docs/gameplay`
**Tags** : world-map, targeting, combat, UX

## Symptôme

Sur la carte, une entité sélectionnée expose surtout son type, son nom et un bouton d'attaque. La modal d'attaque donne la distance, la puissance envoyée, la capacité de transport et le temps de trajet, mais pas assez d'information sur le risque, la récompense probable ou la nature de la cible. La décision d'attaque peut donc manquer de lisibilité.

## Localisation

- `battleforthecrown-pixi/src/features/world/SelectedEntityPanel.tsx:17-24` — libellé de type très court.
- `battleforthecrown-pixi/src/features/world/SelectedEntityPanel.tsx:49-69` — panneau avec nom et bouton attaquer.
- `battleforthecrown-pixi/src/features/combat/AttackDetailModal.tsx:145-154` — header attaque avec nom, coordonnées, distance.
- `battleforthecrown-pixi/src/features/combat/AttackDetailModal.tsx:226-243` — résumé : puissance estimée, capacité de transport, temps de trajet.
- `docs/gameplay/04-combat-and-army.md:75-84` — puissance village/armée et espionnage prévus comme éléments d'évaluation.

## Détail

La décision "attaquer" devrait être l'un des moments les plus importants du jeu. Actuellement, l'interface inspectée aide surtout à sélectionner les unités et connaître le temps de trajet. Elle expose peu la difficulté attendue, le potentiel de loot, la confiance de l'information ou la raison de choisir cette cible plutôt qu'une autre.

## Impact gameplay

- Le joueur peut attaquer à l'aveugle ou sur des critères faibles.
- Les tiers barbares et la puissance publique peuvent être sous-exploités.
- Le scouting et la préparation risquent d'être perçus comme secondaires.
- Les attaques peuvent générer de la frustration si l'issue semblait imprévisible.
- À l'inverse, si les barbares restent sans risque, l'absence d'information renforce le farming mécanique.

## Questions ouvertes

- Le backend expose-t-il une puissance publique fiable pour les cibles visibles ?
- Les ressources potentielles d'un barbare sont-elles censées être connues, estimées ou cachées ?
- Le niveau de Watchtower doit-il améliorer la précision des informations de cible ?
- Les espions ont-ils un rôle déjà utilisable dans le flow d'attaque ?

## Tickets liés

- [01 — Raids barbares sans risque réel](./01-barbarian-raids-no-risk.md)
- [02 — Combat PvP trop binaire](./02-pvp-combat-too-binary.md)
- [08 — Fog of war partiellement neutralisé côté frontend](./08-fog-of-war-frontend-filtering-risk.md)
