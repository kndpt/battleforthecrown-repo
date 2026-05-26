# Gameplay — Battle for the Crown

Documentation gameplay consolidée. Vision design, mécaniques, formules d'équilibrage. Source de vérité produit (les chiffres en code peuvent diverger temporairement — voir [`@battleforthecrown/shared`](../../packages/shared/) pour les valeurs runtime).

## Index

0. [`00-game-flow.md`](./00-game-flow.md) — **vue narrative end-to-end**, du lancement d'un monde au wipe. Point d'entrée pour comprendre à quoi ressemble le jeu vécu. Doc vivante, mise à jour quand une mécanique change.
1. [`01-overview.md`](./01-overview.md) — vision, boucles de gameplay, monde persistant, philosophie mobile, extensions post-MVP.
2. [`02-economy-and-progression.md`](./02-economy-and-progression.md) — ressources, population, couronnes, formules de progression, équilibrage économique (production vs pillage).
3. [`03-buildings.md`](./03-buildings.md) — catalogue des bâtiments MVP (Castle, Wood, Stone, Iron, Warehouse, Quarter, Barracks, Watchtower, Salle du Conseil) avec coûts, temps et bonus passifs par niveau. Wall et Hideout sont prévus mais **désactivés MVP**.
4. [`04-combat.md`](./04-combat.md) — résolution combat, conquête, styles stratégiques de village.
5. [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md) — cartes quotidiennes et Oyez : rétention personnelle + contexte monde, sans pass ni bénédictions séparées.
6. [`06-barbarians.md`](./06-barbarians.md) — villages barbares : tiers, génération, régénération, distribution carte, lisibilité joueur, questions ouvertes.
7. [`07-barbarian-spawning.md`](./07-barbarian-spawning.md) — algorithme de génération des villages barbares à l'arrivée d'un joueur : déclencheur, anneau et chunking, distribution T1-T5 par distance, anti-submersion par présence joueur, catchup d'arrivée différée.
8. [`08-units.md`](./08-units.md) — catalogue des troupes : stats, coûts, passifs, archétypes, contre-relations.
9. [`09-power-and-rankings.md`](./09-power-and-rankings.md) — système de puissance (calcul, poids bâtiments/unités, visibilité, usage stratégique) et classements hebdo/mensuels.
10. [`10-conquest.md`](./10-conquest.md) — hub conquête : règles communes (Seigneur, période de capture variable, garde-fous globaux). Spécificités dans 13 et 14.
11. [`11-scouting.md`](./11-scouting.md) — scout / espionnage : unité ESPION, mission, rapport, feature transversale toutes entités.
12. [`12-village-styles.md`](./12-village-styles.md) — styles stratégiques de village (Forteresse / Raiders / Économique / Équilibré) : mécanique par village, débloqué par Salle du Conseil, caché par scout.
13. [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) — spec complète de la conquête barbare : matérialisation des bâtiments, niveaux par tier, stock et population.
14. [`14-pvp-conquest.md`](./14-pvp-conquest.md) — conquête de villages joueurs en PvP : questions ouvertes (doc en chantier).
15. [`15-onboarding.md`](./15-onboarding.md) — tuto guidé MVP livré : état server-authoritative, récompense initiale unique, 5 étapes scriptées.
16. [`16-notifications.md`](./16-notifications.md) — notifications push (attaque entrante, fin de capture, fin de construction) : doc en chantier, esquisse seulement.
17. [`17-inbox-and-reports.md`](./17-inbox-and-reports.md) — inbox persistant des rapports (combat + scout au MVP) : contrat MVP livré (Phase 2 close).
18. [`18-inactivity-and-abandonment.md`](./18-inactivity-and-abandonment.md) — abandon de compte (2 semaines sans login) : **post-MVP**, doc en chantier.
19. [`19-world-lifecycle.md`](./19-world-lifecycle.md) — cycle de vie d'un monde : monde borné 60 j, fenêtre d'inscription 7 j, multi-mondes autorisés, wipe planifié à `endsAt`. **Spec MVP tranchée** (defaults paramétrables). Complète [`23`](./23-world-tempo-and-multipliers.md).
20. [`20-defensive-friends.md`](./20-defensive-friends.md) — liste d'amis défensifs (renforts mutuels uniquement, cap 5) : candidate MVP minimaliste, doc en chantier.
21. [`21-alliances-and-tribes.md`](./21-alliances-and-tribes.md) — système complet d'alliances / tribus (chat, diplomatie, guerre coordonnée) : **strictement post-MVP**, doc en chantier.
22. [`22-village-roles-and-navigation.md`](./22-village-roles-and-navigation.md) — rôles privés et favoris de villages : navigation multi-village MVP légère, sans bonus mécanique.
23. [`23-world-tempo-and-multipliers.md`](./23-world-tempo-and-multipliers.md) — **pivot compressed-async + tempo world-scoped**. Pourquoi BFTC n'est pas un slow-MMORTS, monde Standard 60 j, multipliers `WorldConfig.tempo` (global + overrides), garde-fous, impacts à recalibrer. **Pièce centrale du gameplay.**

### Laboratoire

- [`lab/`](./lab/) — idées exploratoires non canoniques : rétention mobile moderne, tribus, barbares PVM, mondes à règles spéciales.

## Lecture conseillée

- **Comprendre vite à quoi ressemble le jeu** : `00-game-flow.md` (vue narrative) puis `01-overview.md` (vision/principes).
- **Nouveau venu sur le projet** : `01-overview.md` puis `02-economy-and-progression.md`.
- **Dev qui touche un bâtiment** : `03-buildings.md`.
- **Dev qui touche une unité ou un combat** : `08-units.md` (troupes) + `04-combat.md` (résolution).
- **Dev / designer qui touche aux barbares** : `06-barbarians.md` (vision) puis `08-units.md` (compo) puis `04-combat.md` (combat appliqué).
- **Game designer** : tous les fichiers, dans l'ordre.

## Conventions

- 🇫🇷 Doc gameplay en français (terminologie joueur).
- Les chiffres affichés ici sont la **cible design**. Si le code diverge, c'est en cours d'équilibrage — voir [`packages/shared/`](../../packages/shared/) pour les valeurs effectives au runtime, et `WorldConfig` (côté backend) pour les overrides par monde.
- Les références mécaniques (formules, multiplicateurs) doivent rester en accord avec [`docs/architecture/data-model.md`](../architecture/data-model.md).
