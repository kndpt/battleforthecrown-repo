# Rétention mobile moderne

> Laboratoire d'idée. Cette page explore une direction produit. La source canonique actuelle pour cartes quotidiennes + Oyez est [`05-daily-cards-and-oyez.md`](../05-daily-cards-and-oyez.md).

## Point de départ

Battle for the Crown a déjà les briques de rétention :

- [cartes quotidiennes et Oyez](../05-daily-cards-and-oyez.md) ;
- [notifications push](../16-notifications.md) ;
- [inbox et rapports](../17-inbox-and-reports.md) ;
- [mondes saisonniers](../19-world-lifecycle.md).

Le risque actuel n'est pas l'absence de rétention. Le risque est d'avoir des mécaniques efficaces sur le papier mais trop lourdes, trop généreuses, ou trop "mobile game générique" pour un MMORTS dur.

L'objectif : construire une rétention mobile qui donne envie de revenir tous les jours, sans transformer le jeu en checklist ni accélérer le snowball des meilleurs joueurs.

## Signal externe : Supercell 2026

Supercell a retravaillé le Gold Pass de Clash of Clans en février 2026 autour de plusieurs principes utiles pour BFTC :

- tâches quotidiennes simples, toujours disponibles, centrées sur le gameplay normal ;
- progression plus régulière sur la saison ;
- rattrapage possible si le joueur manque une journée ;
- choix de récompenses à certains paliers ;
- récompenses scalées selon le niveau de progression ;
- interface plus claire, plus lisible, plus rapide à comprendre.

Source : [Big Changes are coming to Gold Pass](https://supercell.com/en/games/clashofclans/blog/news/big-changes-are-coming-to-gold-pass/).

Ce qui compte pour nous n'est pas de copier le Gold Pass. Ce qui compte est le raisonnement : un système moderne réduit la friction, récompense le jeu normal, laisse du choix, et évite de punir trop fort les joueurs casuals.

## Traduction BFTC

BFTC ne doit pas pousser le joueur à faire des actions artificielles. Les tâches doivent renforcer les boucles naturelles :

| Boucle | Actions naturelles |
| --- | --- |
| Économie | collecter, dépenser, lancer un upgrade, éviter l'entrepôt plein |
| Militaire | recruter, raider un barbare, défendre, rappeler une armée |
| Exploration | construire Watchtower, scout, révéler une cible |
| Conquête | préparer Seigneur, escorter, tenir une fenêtre |
| Social | envoyer renfort, lire un rapport, réagir à une attaque |

Si une tâche demande une action que le joueur n'aurait jamais faite sans la tâche, elle est suspecte.

## Proposition : cartes quotidiennes empilables

Au lieu d'une seule quête quotidienne qui expire brutalement, BFTC pourrait utiliser des **cartes de devoir royal**.

Principe :

- chaque jour, le joueur reçoit une petite carte de 4 à 6 tâches ;
- les tâches sont simples et lisibles en un coup d'oeil ;
- elles ne forcent pas une heure de jeu : objectif 5 à 15 minutes ;
- une carte non terminée reste disponible quelques jours ;
- terminer une carte donne des points de saison et une récompense modérée ;
- les cartes s'empilent avec une limite, par exemple 3 cartes actives.

Effet attendu :

- le joueur quotidien a toujours quelque chose à faire ;
- le joueur qui rate un jour ne se sent pas exclu ;
- le système ne crée pas de FOMO agressif ;
- les actions restent liées au gameplay normal.

## Structure de tâches

Les tâches doivent être courtes, contextualisées, et adaptées au stade du joueur.

### Early game

| Tâche | Intention |
| --- | --- |
| Améliorer 1 producteur | Apprendre l'économie |
| Lancer 1 recrutement | Entrer dans la boucle militaire |
| Attaquer 1 barbare T1 | Premier usage de l'armée |
| Construire ou améliorer la Watchtower | Découvrir le brouillard |
| Lire 1 rapport | Installer l'inbox comme rituel |

### Mid game

| Tâche | Intention |
| --- | --- |
| Piller X ressources sur barbares | Valoriser l'activité |
| Scout une cible avant attaque | Installer le renseignement |
| Recruter X population d'unités | Faire progresser l'armée |
| Changer ou confirmer un style de village | Rappeler la spécialisation |
| Réagir à un Oyez actif | Lier quotidien et événement monde |

### Late game

| Tâche | Intention |
| --- | --- |
| Gagner un combat avec pertes limitées | Optimisation militaire |
| Renforcer un village | Défense multi-village |
| Préparer une conquête | Objectif long |
| Tenir une fenêtre de capture | Tension end-game |
| Défendre contre un raid global | PVM défensif |

## Récompenses : modérer le pouvoir, renforcer le choix

La règle centrale : les récompenses ne doivent pas financer directement le snowball.

Éviter :

- grosses quantités de couronnes ;
- bonus de production cumulables ;
- accélération massive de Seigneur ;
- récompenses réservées aux tops déjà dominants ;
- bonus offensifs PvP durables.

Préférer :

- ressources scalées mais plafonnées ;
- boosts courts non cumulables ;
- choix entre deux ressources ;
- consommables de confort ;
- cosmétiques saisonniers ;
- informations ou raccourcis UX ;
- récompenses défensives/PVM plutôt qu'offensives PvP.

## Choix de récompense

Inspiration utile : les paliers à choix. Pour BFTC, le joueur pourrait choisir entre deux récompenses selon sa situation :

| Choix | Lecture |
| --- | --- |
| Bois ou pierre | J'adapte à mon upgrade en cours |
| Ressources ou temps de construction court | Je choisis stock ou vitesse |
| Loot barbare +10 % ou défense barbare +10 % | Je choisis attaque PVM ou sécurité |
| Cosmétique de bannière ou titre temporaire | Je choisis l'expression |

Le choix crée de l'agence sans ajouter de complexité systémique.

## Pass saisonnier BFTC

Un pass peut exister, mais il doit respecter le genre.

Position saine :

- track gratuit utile et visible ;
- track premium surtout cosmétique et qualité de vie ;
- pas de puissance PvP exclusive ;
- pas de Seigneur moins cher ;
- pas de ressources telles que le payeur peut enchaîner les conquêtes ;
- bonus premium éventuellement orientés confort : slots de presets, skins de village, bannières, animations, historique de rapports et filtres avancés.

Le pass doit vendre de la satisfaction et de l'identité, pas une supériorité militaire.

## Oyez comme métagame doux

Les Oyez peuvent devenir le moteur de variation hebdomadaire :

- un Oyez actif change légèrement la priorité du jour ;
- les tâches quotidiennes peuvent inclure une tâche liée à l'Oyez ;
- les récompenses restent modestes ;
- le serveur entier partage le même signal, donc le monde paraît vivant.

Exemples :

| Oyez | Effet possible | Tâche associée |
| --- | --- | --- |
| Jour des bâtisseurs | Construction légèrement plus rapide | Lancer 2 upgrades |
| Marche forcée | Déplacement plus rapide | Envoyer 2 expéditions |
| Jour des barbares | Loot PVM augmente | Piller 3 barbares |
| Oeil du Guet | Vision temporaire | Scout une cible révélée |

## Garde-fous anti-snowball

| Risque | Garde-fou |
| --- | --- |
| Le top-player complète tout plus vite | Récompenses scalées par stade, plafonnées par jour |
| Le pass devient pay-to-win | Premium sans puissance PvP exclusive |
| Les couronnes financent trop de Seigneurs | Couronnes très limitées ou absentes des tâches quotidiennes |
| Les joueurs casuals abandonnent | Cartes empilables avec rattrapage |
| Les tâches deviennent corvée | Tâches basées sur actions normales, peu nombreuses |
| Les récompenses perturbent l'économie | Valeur cible faible : bonus de confort, pas double production permanente |

## Forme UX attendue

L'écran doit être un outil, pas une page marketing.

Structure possible :

- bandeau Oyez actif ;
- carte quotidienne en cours ;
- progression de saison ;
- choix de récompense disponible ;
- rappel des timers importants ;
- accès direct aux actions concernées.

Le joueur ne doit pas lire une explication. Il doit voir : quoi faire, pourquoi maintenant, et ce qu'il gagne.

## Questions à travailler

- Carte quotidienne unique ou 3 cartes empilables ?
- Reset à 04:00 Europe/Paris comme les quêtes actuelles ?
- Les points de saison sont-ils par monde ou compte global ?
- Les récompenses cosmétiques sont-elles monde-only ou compte global ?
- Quelle valeur max journalière en ressources pour ne pas casser le ratio production/pillage ?
- Faut-il remplacer les quêtes quotidiennes actuelles ou les transformer en cartes ?
- Le pass doit-il exister au MVP, Saison 1, ou post-MVP ?

## Direction recommandée

Pour une première version :

1. Remplacer la quête quotidienne unique par une carte quotidienne empilable.
2. Lier une tâche à l'Oyez actif quand il existe.
3. Donner des récompenses scalées, modestes, avec un choix simple.
4. Garder les couronnes rares.
5. Reporter le pass premium tant que l'économie n'est pas stable.

Cette direction donne une rétention mobile moderne, compatible avec le genre, sans casser le coeur dur de BFTC.
