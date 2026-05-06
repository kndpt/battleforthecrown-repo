# 06 — Progression saisonnière absente de la boucle active

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `docs/gameplay`, `battleforthecrown-pixi`, `battleforthecrown-backend`
**Tags** : seasons, battle-pass, progression, retention

## Symptôme

La vision mentionne un calendrier saisonnier léger et des récompenses hebdomadaires/mensuelles, mais il n'existe pas de progression saisonnière visible dans les boucles de jeu inspectées. Pour un jeu mobile live moderne, l'absence d'une piste de progression transversale réduit la sensation d'avancer même quand les timers principaux sont longs.

## Localisation

- `docs/gameplay/01-overview.md:67-70` — raids, événements, classements et calendrier saisonnier léger.
- `docs/gameplay/05-events-and-retention.md:171-180` — classements hebdomadaires/mensuels.
- `battleforthecrown-pixi/src/features/game/VillageView.tsx` — écran village centré sur header, canvas, navigation, bâtiments, queue, puissance, expéditions.
- `battleforthecrown-pixi/src/features/army/ArmyScreen.tsx` — écran armée centré sur inventaire et entraînement.

## Détail

Les systèmes actuels donnent de la progression verticale par village : bâtiments, ressources, armée, puissance. Il manque une couche transversale qui récompense presque toutes les actions et maintient une cible visible même lorsque les objectifs principaux demandent plusieurs heures. Le design documenté évoque des classements et récompenses périodiques, mais pas de progression saisonnière active observée.

## Impact gameplay

- Les longs timers peuvent créer des moments sans objectif court.
- Les actions ordinaires ne nourrissent pas forcément une progression parallèle.
- Le joueur manque d'une "raison globale" de jouer cette semaine, au-delà de son village.
- La rétention D7/D14 risque de dépendre uniquement de la profondeur macro, encore limitée au MVP.

## Questions ouvertes

- Le calendrier saisonnier est-il volontairement post-MVP ?
- Les classements sont-ils censés suffire comme progression périodique ?
- Les récompenses cosmétiques/prestige existent-elles déjà dans le modèle de données ?
- Le jeu doit-il suivre une structure de saison de monde ou une saison globale cross-world ?

## Tickets liés

- [05 — Rétention moderne surtout documentée](./05-retention-systems-mostly-documented.md)
- [07 — Retour en session insuffisamment ritualisé](./07-session-return-not-ritualized.md)
