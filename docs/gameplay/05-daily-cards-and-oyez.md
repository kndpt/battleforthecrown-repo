# Cartes quotidiennes & Oyez

Source canonique pour la rétention gameplay légère : **cartes quotidiennes** (action personnelle) et **Oyez** (contexte monde). Cette page remplace l'ancienne logique éclatée quêtes / bénédictions / raids globaux.

## Principe directeur

Le joueur revient parce qu'il a une décision claire à prendre, pas parce qu'il doit vider une checklist.

La rétention BFTC doit :

- renforcer les boucles naturelles ;
- rester lisible en 5 secondes ;
- éviter le snowball économique ;
- ne pas ajouter de mini-jeu isolé ;
- fonctionner en session mobile courte.

## Scope

| Sujet | Statut |
| --- | --- |
| Cartes quotidiennes | ✅ Source de vérité ici |
| Oyez | ✅ Source de vérité ici |
| Progression de saison / pass | ❌ Plus tard, lab uniquement |
| Bénédictions quotidiennes | ❌ Supprimées comme système séparé |
| Quêtes quotidiennes legacy | ❌ Remplacées par les cartes |
| Raids barbares globaux | ❌ Sortis de cette doc, à reprendre dans le pilier PVM barbare |
| Notifications / inbox | ❌ Docs dédiées : [`16-notifications.md`](./16-notifications.md), [`17-inbox-and-reports.md`](./17-inbox-and-reports.md) |
| Classements | ❌ Post-MVP, voir [`09-power-and-rankings.md`](./09-power-and-rankings.md) |

## Cartes quotidiennes

Chaque jour, le joueur reçoit une **carte de devoir royal** : un petit set de tâches simples liées au gameplay normal.

| Élément | Règle cible |
| --- | --- |
| Fréquence | 1 carte / jour |
| Reset | 04:00 Europe/Paris |
| Backlog | Jusqu'à 3 cartes actives |
| Taille | 4 à 6 tâches |
| Session cible | 5 à 15 min |
| Expiration | Pas d'expiration brutale tant que la carte tient dans le backlog |
| Récompense | Modérée, scalée, non-snowballante |

### Types de tâches

| Boucle | Exemples |
| --- | --- |
| Économie | Lancer un upgrade, éviter l'entrepôt plein, améliorer un producteur |
| Militaire | Recruter, raider un barbare, rappeler une armée |
| Exploration | Construire / améliorer Watchtower, scout une cible |
| Défense | Renforcer un village, lire une menace, réagir à une attaque |
| Conquête | Préparer un Seigneur, escorter, tenir une fenêtre |

À éviter : tâches artificielles, répétitives, ou qui poussent à une action sous-optimale juste pour cocher une case.

### Récompenses

Préférer :

- ressources modestes et plafonnées ;
- choix entre deux ressources ;
- boost court non cumulable ;
- confort ponctuel ;
- cosmétique léger ;
- bonus PVM / défensif plutôt qu'offensif PvP.

Éviter :

- grosses quantités de couronnes ;
- réduction de coût Seigneur ;
- bonus PvP exclusif ;
- production longue durée cumulable ;
- récompenses réservées aux joueurs déjà dominants.

## Oyez

L'Oyez est le **contexte monde** : un signal partagé qui oriente légèrement la méta pendant une courte période.

| Élément | Règle cible |
| --- | --- |
| Actif simultané | 1 seul Oyez |
| Cadence | À tester : 1 à 2 par semaine, ou plus rare |
| Début | 04:00 Europe/Paris |
| Effet | Léger, lisible, non cumulatif avec même catégorie |
| Rôle principal | Influencer les cartes quotidiennes et la priorité du moment |

### Interaction avec les cartes

Un Oyez peut :

- ajouter 1 tâche thématique à la carte du jour ;
- augmenter légèrement la probabilité de certaines tâches ;
- proposer un choix de récompense cohérent ;
- donner une direction commune au monde.

Il ne doit pas rendre les cartes obligatoires ni créer un avantage massif pour les joueurs très actifs.

### Exemples

| Oyez | Effet léger | Carte associée |
| --- | --- | --- |
| Jour des bâtisseurs | Construction légèrement favorisée | Lancer / finir des upgrades |
| Marche forcée | Expéditions légèrement favorisées | Envoyer une armée, rappeler, lire un retour |
| Oeil du Guet | Exploration favorisée | Scout, Watchtower, carte |
| Jour des barbares | PVM favorisé | Raids barbares, scout barbare, préparation PVM |

## UX attendue

Un seul écran compact :

- bannière Oyez actif ;
- carte quotidienne en cours ;
- backlog visible sans pression excessive ;
- tâches avec accès direct à l'action ;
- récompense claire ;
- état "terminé" satisfaisant, sans sur-animation.

Le joueur doit comprendre en une lecture : quoi faire, pourquoi maintenant, ce qu'il gagne.

## Questions à trancher

- Backlog exact : 2 ou 3 cartes ?
- Récompense fixe ou choix à la fin de la carte ?
- Oyez cadence hebdo ou semi-hebdo ?
- Les cartes peuvent-elles cibler des sites d'exploitation quand cette feature existe ?
- Les cartes sont-elles par monde uniquement ? Reco actuelle : oui.

