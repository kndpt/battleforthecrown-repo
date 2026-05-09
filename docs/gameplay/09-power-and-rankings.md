# Puissance et classements

Métriques de comparaison entre joueurs. La **puissance** mesure la force d'un village ou d'un royaume ; les **classements** récompensent les performances périodiques.

## Système de puissance

La **puissance** représente la force globale d'un village ou d'un royaume. Elle pilote :

- Le **revenu en couronnes** : `couronnes/h = puissance_bâtiments_cumulée × 0.05`, sommée sur tous les villages possédés. Détail et tableau de gains par phase : [`02-economy-and-progression.md` § Couronnes](./02-economy-and-progression.md#couronnes).
- L'**évaluation stratégique** : estimer la difficulté d'une cible avant attaque (cf. [`04-combat.md`](./04-combat.md)).
- Les **classements** publics (cf. ci-dessous).

### Calcul

**Puissance d'un village** = Puissance Bâtiments + Puissance Unités (armée).

```
Puissance Bâtiments = Σ (POIDS_BÂTIMENT × niveau)
Puissance Armée    = Σ (POIDS_UNITÉ × quantité)
```

**Puissance d'un royaume** = somme des puissances de tous les villages possédés.

### Visibilité

| Élément | Visibilité |
| --- | --- |
| **Puissance Village** (bâtiments) | Visible pour tous (information publique) |
| **Puissance Armée** | Cachée pour les ennemis (révélée par espion) |
| **Puissance Royaume** | Visible pour tous |

### Système de poids des bâtiments

Le poids des bâtiments reflète leur coût cumulé et leur importance stratégique :

```
Poids = (Coût_cumulé_level_10 / 500) × Multiplicateur_stratégique
```

| Bâtiment | Poids/niveau | Multiplicateur | Logique |
| --- | ---: | ---: | --- |
| Château | 40 | ×1.5 | Cœur du village |
| Wall | 38 | ×1.3 | Défense massive (coûts élevés) |
| Caserne | 35 | ×1.2 | Militaire offensif |
| Tour de guet | 30 | ×1.3 | Vision stratégique |
| Hideout | 28 | ×1.2 | Renseignement (post-MVP) |
| Salle du Conseil | 25 | ×1.0 | Choix de [style stratégique](./12-village-styles.md) — bâtiment 1 niveau, poids unique |
| Farm | 25 | ×1.0 | Population = stratégique |
| Entrepôt | 20 | ×1.0 | Support économique |
| Mines (Bois/Pierre/Fer) | 15 | ×1.0 | Production basique |

> 💡 Poids des unités : voir [`08-units.md`](./08-units.md).

### Utilisation stratégique

- **Espionnage** : les espions (Hideout) révèlent la composition exacte des troupes ennemies, et donc la puissance armée réelle d'un village cible.
- **Évaluation de cible** : la puissance bâtiments est publique, ce qui permet d'estimer la difficulté d'une attaque sans espion.
- **Villages cachés** : un village peut avoir peu de bâtiments mais une armée massive (piège) — d'où l'intérêt du scout avant un raid sérieux.

## Classements

> 🚧 **Feature post-MVP — à retravailler entièrement.** L'esquisse ci-dessous est conservée pour mémoire mais **sort du scope MVP**. Les motivations et points à reprendre sont listés juste en dessous.

### Pourquoi sortir les classements du MVP

L'esquisse actuelle crée un **snowball mécanique** non maîtrisé :

- **Pillards** : 1 500 couronnes/semaine au top 1 = ~6 000 couronnes/mois. Le top-player **s'auto-finance ses Seigneurs en boucle** (un Seigneur = 5 000 couronnes, cf. [`10-conquest.md` § Coût de recrutement](./10-conquest.md#coût-de-recrutement-du-seigneur)). Plus il pille, plus il reçoit, plus il conquiert, plus il pille — la régulation `puissance ÷ 3` ([`14-pvp-conquest.md`](./14-pvp-conquest.md#garde-fous-anti-snowball)) ne suffit pas à compenser.
- **Architectes** : +5 % production sur 7 j est cumulable cycle après cycle pour le même top-player, et avantage les comptes déjà à niveau de bâtiments élevé (qui en font le plus, donc gagnent le plus, donc en font encore plus).
- **Boucliers / Chevaliers** : cosmétique uniquement — pas de snowball, mais aussi peu d'incitation à pousser le sujet en MVP.

→ La conséquence est qu'au lieu de servir de **rétention** (mon objectif initial), les classements deviennent un **multiplicateur d'inégalité** entre les top-players et le reste du serveur.

### Points à retravailler (post-MVP)

| Sujet | Pistes |
| --- | --- |
| **Dégressivité ou cap** | Plafond de couronnes Pillards par compte/mois (ex : 5 000 couronnes max cumul mois). Ou récompense décroissante si remporté plusieurs cycles consécutifs. |
| **Récompenses structurellement non-snowballantes** | Cosmétique uniquement ? Récompenses one-shot non cumulables ? Bonus défensifs uniquement (ex : Bouclier d'or = +X % défense pendant 7 j, qui ne booste pas l'offensif) ? |
| **Cycles** | Garder l'hebdo, ou passer en mensuel ? Ou saisonnier aligné sur le [cycle de vie d'un monde](./19-world-lifecycle.md) (point structurant à trancher en parallèle) ? |
| **Qui peut concourir** | Tous les joueurs ? Top % uniquement ? Filtrer par tranche de puissance pour éviter que les nouveaux soient écrasés par les top-players ? |
| **Lien avec les alliances** | Quand les [alliances post-MVP](./21-alliances-and-tribes.md) arriveront, faut-il un classement collectif distinct des classements individuels ? |
| **Anti-farming** | Comment éviter qu'un top-player exploite le compte d'un alt pour cumuler les podiums ? |

→ Le rework devra repartir d'**objectifs design clairs** (rétention ? rivalité saine ? récompense d'effort ?) avant de chiffrer les rewards. L'erreur de l'esquisse actuelle a été de chiffrer avant de cadrer.

### Esquisse historique (à archiver lors du rework)

> Le texte qui suit décrit l'esquisse actuelle, conservée pour traçabilité. **Ne pas l'utiliser comme spec implémentable** — voir « Points à retravailler » ci-dessus.

4 classements thématiques publiés par monde, **reset hebdomadaire** (chaque lundi 00:00 UTC). Récompenses sur **podium top 3** (Or / Argent / Bronze). Le 4ᵉ et au-delà ne reçoivent rien — la fréquence hebdo garantit qu'un nouveau cycle s'ouvre vite et qu'un comeback est toujours à portée.

### Critères et récompenses

| Type | Critère (cumul de la semaine) | 🥇 Or (Top 1) | 🥈 Argent (Top 2) | 🥉 Bronze (Top 3) |
| --- | --- | --- | --- | --- |
| **Pillards de la semaine** | Ressources pillées (raids barbares + PvP) | **+1 500 couronnes** (~1 jour de revenu mid-game) | +1 000 couronnes | +500 couronnes |
| **Architectes** | Niveaux de bâtiments gagnés | **+5 % production** (bois/pierre/fer) pendant 7 j | +3 % production / 7 j | +2 % production / 7 j |
| **Boucliers d'acier** | Attaques défensives repoussées | Bannière dorée prestige | Bannière argentée | Bannière bronze |
| **Chevaliers du peuple** | Population totale (snapshot fin de cycle) | Couronne dorée sur le pseudo | Couronne argentée | Couronne bronze |

**Calage Pillards** : 1 jour de revenu pour un Château 6 mid-game (~1 680 cour/jour, cf. [`02-economy-and-progression.md` § Couronnes](./02-economy-and-progression.md#couronnes)). Bonus lisible mais non snowballant — un Seigneur (5 000) requiert ~3 cycles consécutifs en Top 1 cumulés.

**Calage Architectes** : +5 % pendant 7 j sur un mid-game qui produit ~800 ressources/h × 6 mines = **+240 ressources/h × 168 h ≈ 40 000 ressources** (équivalent ~1 upgrade fin de mid-game). Significatif sans dominer.

**Boucliers / Chevaliers** : récompenses **purement cosmétiques** (visibles dans la fiche joueur publique + le HUD). Pas de bonus chiffré — les défenseurs gagnent déjà du loot et de l'XP à chaque attaque repoussée, et la pop est récompensée mécaniquement (production de couronnes via puissance bâtiments).

### Cycle reset

- **Reset** : chaque **lundi 00:00 UTC**, tous les compteurs et bonus actifs sont réinitialisés.
- **Bonus Architectes (+X % production)** : appliqué dès le calcul du podium, dure jusqu'au reset suivant (7 j max).
- **Couronnes Pillards** : créditées immédiatement au reset, balance permanente comme tout autre gain.
- **Cosmétiques** : portés pendant le cycle suivant uniquement (1 semaine), puis remplacés par ceux du nouveau podium.

> 💡 Pas de cycle mensuel au MVP — la simplicité prime. Si la rétention long-terme se révèle insuffisante en playtest, un classement saisonnier (mensuel ou trimestriel) pourra être ajouté en post-MVP avec ses propres récompenses (ex : titre permanent « Pillard de la saison »).

## Liens connexes

- [`02-economy-and-progression.md` § Couronnes](./02-economy-and-progression.md#couronnes) — la puissance bâtiments pilote le rendement en couronnes.
- [`03-buildings.md`](./03-buildings.md) — détail par bâtiment, dont le Château (poids le plus élevé).
- [`04-combat.md`](./04-combat.md) — combat et conquête (consommateur principal de l'évaluation stratégique).
- [`05-events-and-retention.md`](./05-events-and-retention.md) — événements et rétention, dont les classements font partie.
- [`08-units.md`](./08-units.md) — catalogue des unités, dont les poids alimentent la puissance armée.
- Backend : [`docs/architecture/backend-modules.md` § power](../architecture/backend-modules.md) — endpoint `GET /power/village/:id`.
