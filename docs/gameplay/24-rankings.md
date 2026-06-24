# Classements

Spec gameplay des classements publics d'un monde. Les classements donnent un signal de prestige et de rivalite, sans devenir un accelerateur economique.

## Objectifs

- Separer clairement la **puissance live** d'un royaume et les **performances periodiques**.
- Valoriser les faits d'armes PvP sans encourager le farm de joueurs faibles.
- Garder les rewards structurellement non-snowballants par defaut : titres, bannieres, badges, historique de monde.
- Fournir une formule lisible, stable, et directement compatible avec les rapports de combat qui stockent deja les pertes des deux camps.

## Les trois signaux publics

| Signal | Mesure | Reset | Usage |
| --- | --- | --- | --- |
| **Puissance du Royaume** | Force globale actuelle : batiments + armee | Aucun, live | Taille du royaume, evaluation strategique, leaderboard final |
| **Gloire d'Assaut** | Valeur des unites ennemies tuees quand le joueur attaque | Cycle | Prestige offensif |
| **Gloire du Rempart** | Valeur des unites ennemies tuees quand le joueur defend | Cycle | Prestige defensif |

La puissance reste la source de verite pour la force globale. La Gloire d'Assaut et la Gloire du Rempart mesurent une performance de combat, pas la taille du compte.

## Puissance du Royaume

La Puissance du Royaume reprend le systeme existant de [`09-power-and-rankings.md`](./09-power-and-rankings.md) :

```text
Puissance Royaume = somme des puissances de tous les villages possedes
Puissance Village = puissance batiments + puissance armee d'origine
```

Ce classement est live, non reset, et peut etre snapshot a la fin du monde (`ENDED`) pour attribuer des cosmetiques permanents.

## Gloire d'Assaut

Le joueur gagne des points de Gloire d'Assaut lorsqu'il tue des unites ennemies en etant l'attaquant d'un combat PvP.

```text
points_assaut = somme(unites_defenseur_tuees x valeur_bataille_unite) x multiplicateur_adversaire
```

Regles :

- Compte uniquement les combats contre un autre joueur.
- Compte meme si l'attaque echoue : detruire une defense ennemie reste une performance offensive.
- Ne compte pas les combats contre villages barbares.
- Ne compte pas les missions de scout sans combat.
- Ne compte pas les combats entre villages du meme joueur.

## Gloire du Rempart

Le joueur gagne des points de Gloire du Rempart lorsqu'il tue des unites ennemies en etant defenseur d'un combat PvP.

```text
points_rempart = somme(unites_attaquant_tuees x valeur_bataille_unite) x multiplicateur_adversaire
```

Regles :

- Compte uniquement les combats contre un autre joueur.
- Compte meme si la defense perd : affaiblir une armee attaquante reste une performance defensive.
- Les points reviennent au proprietaire des troupes qui defendent, pas seulement au proprietaire du village attaque.
- Si plusieurs joueurs defendent plus tard le meme village via amis defensifs ou alliances, le pool de points defensifs est reparti selon leur contribution defensive effective.
- Pendant une fenetre de capture, la garnison d'occupation qui tue des assaillants marque en Rempart pour le joueur occupant ; l'assaillant qui tue la garnison d'occupation marque en Assaut.

## Valeur de bataille des unites

La valeur de bataille reutilise les poids de puissance armee comme base, avec une exception volontaire pour le Seigneur.

| Unite | Points par unite tuee | Rationale |
| --- | ---: | --- |
| Milice | 2 | Unite de base, faible cout, faible poids |
| Ecuyer | 8 | Infanterie avancee polyvalente |
| Guerrier | 12 | Unite offensive specialisee |
| Archer | 6 | Defense anti-cavalerie, poids modere |
| Templier | 12 | Tank defensif couteux |
| Cavalier | 15 | Raider mobile et cher |
| Espion | 10 | Unite d'information, scoree si elle meurt dans un combat reel |
| Belier | 30 | Siege, desactive MVP mais valeur reservee |
| Catapulte | 40 | Siege lourd, desactive MVP mais valeur reservee |
| Seigneur | 400 | Fait d'armes majeur : cout tres eleve, role de conquete, risque strategique |

Pourquoi ne pas utiliser `100` pour le Seigneur : le poids de puissance mesure la force globale d'un royaume. En prestige de combat, tuer un Seigneur doit valoir plus que son poids armee, car cela annule une tentative de conquete et detruit un investissement en couronnes et ressources.

## Multiplicateur adversaire

Pour limiter le farm de joueurs faibles et valoriser les combats asymetriques legitimes :

```text
multiplicateur_adversaire = clamp(puissance_adversaire / puissance_joueur, 0.35, 1.25)
```

Definitions :

- `puissance_joueur` = puissance royaume du joueur qui marque les points au lancement du combat.
- `puissance_adversaire` = puissance royaume de l'adversaire au lancement du combat.
- Le multiplicateur est snapshot au lancement, comme les garde-fous PvP.

Effets attendus :

- Farmer un joueur beaucoup plus faible rapporte peu.
- Tuer des troupes d'un joueur comparable rapporte normalement.
- Tenir ou attaquer contre plus gros rapporte davantage, mais reste plafonne.

Le multiplicateur complete le garde-fou PvP `puissance_defenseur >= puissance_attaquant / 3` documente dans [`14-pvp-conquest.md`](./14-pvp-conquest.md#garde-fous-anti-snowball). Il ne le remplace pas.

## Cycles

Deux lectures coexistent :

| Vue | Duree | Role |
| --- | --- | --- |
| Cycle court | Hebdomadaire par defaut | Rivalite reguliere, comeback possible, cosmetiques temporaires |
| Monde entier | Jusqu'a `ENDED` | Hall of fame du monde, cosmetiques permanents |

La vue hebdomadaire cree de l'animation pendant le monde. La vue monde entier donne du poids a la fin de monde sans imposer une meta-progression entre mondes.

## Rewards

Par defaut, les classements ne donnent pas de couronnes, ressources, reduction de temps, bonus de production, bonus d'attaque, ou bonus de conquete.

Rewards autorises :

- titre temporaire sur le cycle suivant ;
- banniere ou cadre de profil ;
- badge public sur la fiche joueur ;
- entree dans l'historique du monde ;
- cosmetique permanent au `ENDED` pour les meilleurs du monde.

Cosmetique permanent `ENDED` livre (run 067) : un titre par signal au top 1, libelles FR centralises dans `@battleforthecrown/shared/cosmetic` — `Vainqueur de <monde>` (POWER), `Conquerant de <monde>` (Assaut), `Sentinelle de <monde>` (Rempart). Mecanique d'attribution + persistance : [`19-world-lifecycle.md` § Wipe et recompenses](./19-world-lifecycle.md#wipe-et-récompenses-fin-de-monde).

Un bonus defensif temporaire peut etre reouvert plus tard, mais il doit rester separe de l'offensif et ne jamais financer directement les Seigneurs ou l'expansion.

## Anti-farm

Regles minimales :

- PvP uniquement : les barbares ne donnent pas de Gloire d'Assaut ou de Rempart.
- Aucun point contre soi-meme.
- Multiplicateur adversaire base sur les puissances royaume snapshot au lancement.
- Rendement decroissant par paire de joueurs si les memes deux comptes s'echangent trop de points sur une courte periode.
- Exclusion ou review manuelle possible pour les combats detectes comme abandons volontaires ou exploit multi-compte.

Proposition de rendement decroissant :

```text
points_effectifs_paire = points_bruts x facteur_paire_24h

facteur_paire_24h:
- 100 % jusqu'a 2 000 points bruts entre les deux joueurs sur 24 h
- 50 % entre 2 000 et 5 000
- 20 % au-dela de 5 000
```

Les seuils sont des valeurs de depart. Ils doivent etre recalibres apres observation des volumes reels de combat.

## Donnees sources

Le scoring se derive des rapports de combat :

- `lossesDefender` alimente la Gloire d'Assaut de l'attaquant.
- `lossesAttacker` alimente la Gloire du Rempart du ou des defenseurs.
- `totalUnitsAttacker` et `totalUnitsDefender` permettent d'auditer les ratios et de reconstruire le contexte.

Pour les renforts multi-proprietaires futurs, le rapport ou l'evenement de resolution devra conserver la repartition des defenseurs par proprietaire afin de distribuer la Gloire du Rempart proprement.

**Vue monde entier** : a la transition `LOCKED → ENDED`, les 3 classements sont figes dans `WorldFinalRankingSnapshot` (table Prisma — cf. [`data-model.md` § Classements finaux](../architecture/data-model.md#classements-finaux)). Cette table est la source de verite pour les runs UI et awards aval ; les formules live ci-dessus ne sont pas recalculees a la lecture.

## Noms UI

Noms retenus pour la spec :

- **Puissance du Royaume**
- **Gloire d'Assaut**
- **Gloire du Rempart**

Ces noms sont des libelles gameplay. Les noms backend peuvent rester techniques (`POWER`, `OFFENSE_GLORY`, `DEFENSE_GLORY`, etc.) tant que les libelles joueur restent coherents.

## Liens connexes

- [`09-power-and-rankings.md`](./09-power-and-rankings.md) — calcul de puissance.
- [`04-combat.md`](./04-combat.md) — resolution des combats et pertes.
- [`08-units.md`](./08-units.md) — catalogue des unites et poids de puissance.
- [`14-pvp-conquest.md`](./14-pvp-conquest.md) — garde-fous PvP et capture.
- [`19-world-lifecycle.md`](./19-world-lifecycle.md) — snapshot final et rewards cosmetiques de fin de monde.
