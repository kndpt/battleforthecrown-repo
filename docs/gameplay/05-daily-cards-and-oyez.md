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
| Pile de cartes | Aucune pile visible : seule la carte du jour est générée comme devoir actif |
| Taille | 3 tâches |
| Session cible | 5 à 15 min |
| Expiration | La carte du jour expire au reset suivant, à 04:00 Europe/Paris |
| Grâce de réclamation | Une carte complétée mais non réclamée reste réclamable pendant le jour suivant, jusqu'au reset 04:00 ; après cette fenêtre, elle expire |
| Récompense | Modérée, scalée, non-snowballante |

Si la récompense s'applique à un village, le joueur choisit le village destinataire au moment de valider la carte. Le système propose par défaut le dernier village ayant reçu une récompense. Cette règle vient de la Phase 9 Navigation multi-village, voir [`22-village-roles-and-navigation.md`](./22-village-roles-and-navigation.md).

### Types de tâches

| Boucle | Exemples |
| --- | --- |
| Économie | Lancer un upgrade, éviter l'entrepôt plein, améliorer un producteur |
| Militaire | Recruter, raider un barbare, rappeler une armée |
| Exploration | Construire / améliorer Watchtower, scout une cible |
| Défense | Renforcer un village, lire une menace, réagir à une attaque |
| Conquête | Préparer un Seigneur, escorter, tenir une fenêtre |

À éviter : tâches artificielles, répétitives, ou qui poussent à une action sous-optimale juste pour cocher une case.

### Validation par events métier

Les tâches doivent se valider sur des faits gameplay émis par le runtime, pas sur des signaux d'UI. Pour le MVP, une carte contient exactement 3 tâches naturelles :

| Tâche | Event métier candidat |
| --- | --- |
| Recruter | `unit.trained` |
| Lancer / finir un upgrade | `building.completed` pour la fin ; l'action de lancement reste côté mutation construction. |
| Raider un barbare | `battle.resolved` avec cible barbare |

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

### Déclencheur

- **Icône permanente HUD top** (sceau royal / parchemin), badge visible si ≥1 quête réclamable, ouvre la sheet quotidienne en modale plein écran.
- **Pas de bâtiment dédié** : le devoir royal est inhérent au statut du joueur, pas un déblocage. Évite le gating artificiel proscrit en [Phase 10](../../tasks/00-mvp-roadmap.md#phase-10--rétention-quotidienne-mvp).
- **Pas d'onglet bottom nav, pas d'entrée via Inbox** : les rapports passifs ([`17-inbox-and-reports.md`](./17-inbox-and-reports.md)) et les devoirs actifs ne se mélangent pas.

### Écran

Un seul écran compact :

- bannière Oyez actif ;
- carte quotidienne en cours ;
- tâches avec accès direct à l'action ;
- récompense claire ;
- état "terminé" satisfaisant, sans sur-animation.

Si le joueur a terminé la carte précédente sans réclamer la récompense, la sheet peut prioriser cette récompense pendant sa fenêtre de grâce, sans afficher de pile de cartes ni de promesse de rattrapage.

Le joueur doit comprendre en une lecture : quoi faire, pourquoi maintenant, ce qu'il gagne.

## Questions à trancher

- Faut-il réintroduire plus tard une grâce payante ou sociale pour les très longues absences ? Hors scope MVP.
- Récompense fixe ou choix à la fin de la carte ?
- Oyez cadence hebdo ou semi-hebdo ?
- Les cartes peuvent-elles cibler des sites d'exploitation quand cette feature existe ?
- Les cartes sont-elles par monde uniquement ? Reco actuelle : oui.
