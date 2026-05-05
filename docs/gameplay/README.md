# Gameplay — Battle for the Crown

Documentation gameplay consolidée. Vision design, mécaniques, formules d'équilibrage. Source de vérité produit (les chiffres en code peuvent diverger temporairement — voir [`@battleforthecrown/shared`](../../packages/shared/) pour les valeurs runtime).

## Index

1. [`01-overview.md`](./01-overview.md) — vision, boucles de gameplay, monde persistant, philosophie mobile, classements et extensions post-MVP.
2. [`02-economy-and-progression.md`](./02-economy-and-progression.md) — ressources, population, couronnes, formules de progression, équilibrage économique (production vs pillage).
3. [`03-buildings.md`](./03-buildings.md) — catalogue des 10 bâtiments (Castle, Wood, Stone, Iron, Warehouse, Farm, Barracks, Watchtower, Wall, Hideout) avec coûts, temps et bonus passifs par niveau.
4. [`04-combat-and-army.md`](./04-combat-and-army.md) — unités, combat, calcul de puissance, styles stratégiques de village.
5. [`05-events-and-retention.md`](./05-events-and-retention.md) — raids barbares, événements Oyez, bénédictions quotidiennes, quêtes.

## Lecture conseillée

- **Nouveau venu sur le projet** : `01-overview.md` puis `02-economy-and-progression.md`.
- **Dev qui touche un bâtiment / une unité** : `03-buildings.md` ou `04-combat-and-army.md`.
- **Game designer** : tous les fichiers, dans l'ordre.

## Conventions

- 🇫🇷 Doc gameplay en français (terminologie joueur).
- Les chiffres affichés ici sont la **cible design**. Si le code diverge, c'est en cours d'équilibrage — voir [`packages/shared/`](../../packages/shared/) pour les valeurs effectives au runtime, et `WorldConfig` (côté backend) pour les overrides par monde.
- Les références mécaniques (formules, multiplicateurs) doivent rester en accord avec [`docs/architecture/data-model.md`](../architecture/data-model.md).
