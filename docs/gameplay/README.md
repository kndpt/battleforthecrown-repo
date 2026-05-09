# Gameplay — Battle for the Crown

Documentation gameplay consolidée. Vision design, mécaniques, formules d'équilibrage. Source de vérité produit (les chiffres en code peuvent diverger temporairement — voir [`@battleforthecrown/shared`](../../packages/shared/) pour les valeurs runtime).

## Index

1. [`01-overview.md`](./01-overview.md) — vision, boucles de gameplay, monde persistant, philosophie mobile, extensions post-MVP.
2. [`02-economy-and-progression.md`](./02-economy-and-progression.md) — ressources, population, couronnes, formules de progression, équilibrage économique (production vs pillage).
3. [`03-buildings.md`](./03-buildings.md) — catalogue des bâtiments MVP (Castle, Wood, Stone, Iron, Warehouse, Farm, Barracks, Watchtower, Salle du Conseil) avec coûts, temps et bonus passifs par niveau. Wall et Hideout sont prévus mais **désactivés MVP**.
4. [`04-combat.md`](./04-combat.md) — résolution combat, conquête, styles stratégiques de village.
5. [`05-events-and-retention.md`](./05-events-and-retention.md) — raid barbare global, événements Oyez, bénédictions quotidiennes, quêtes.
6. [`06-barbarians.md`](./06-barbarians.md) — villages barbares : tiers, génération, régénération, distribution carte, lisibilité joueur, questions ouvertes.
7. [`07-barbarian-spawning.md`](./07-barbarian-spawning.md) — algorithme de génération adaptatif des villages barbares à l'arrivée d'un joueur (doc en chantier).
8. [`08-units.md`](./08-units.md) — catalogue des troupes : stats, coûts, passifs, archétypes, contre-relations.
9. [`09-power-and-rankings.md`](./09-power-and-rankings.md) — système de puissance (calcul, poids bâtiments/unités, visibilité, usage stratégique) et classements hebdo/mensuels.
10. [`10-conquest.md`](./10-conquest.md) — hub conquête : règles communes (Seigneur, période de capture variable, garde-fous globaux). Spécificités dans 13 et 14.
11. [`11-scouting.md`](./11-scouting.md) — scout / espionnage : unité ESPION, mission, rapport, feature transversale toutes entités.
12. [`12-village-styles.md`](./12-village-styles.md) — styles stratégiques de village (Forteresse / Raiders / Économique / Équilibré) : mécanique par village, débloqué par Salle du Conseil, caché par scout.
13. [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) — spec complète de la conquête barbare : matérialisation des bâtiments, niveaux par tier, stock et population.
14. [`14-pvp-conquest.md`](./14-pvp-conquest.md) — conquête de villages joueurs en PvP : questions ouvertes (doc en chantier).

## Lecture conseillée

- **Nouveau venu sur le projet** : `01-overview.md` puis `02-economy-and-progression.md`.
- **Dev qui touche un bâtiment** : `03-buildings.md`.
- **Dev qui touche une unité ou un combat** : `08-units.md` (troupes) + `04-combat.md` (résolution).
- **Dev / designer qui touche aux barbares** : `06-barbarians.md` (vision) puis `08-units.md` (compo) puis `04-combat.md` (combat appliqué).
- **Game designer** : tous les fichiers, dans l'ordre.

## Conventions

- 🇫🇷 Doc gameplay en français (terminologie joueur).
- Les chiffres affichés ici sont la **cible design**. Si le code diverge, c'est en cours d'équilibrage — voir [`packages/shared/`](../../packages/shared/) pour les valeurs effectives au runtime, et `WorldConfig` (côté backend) pour les overrides par monde.
- Les références mécaniques (formules, multiplicateurs) doivent rester en accord avec [`docs/architecture/data-model.md`](../architecture/data-model.md).
