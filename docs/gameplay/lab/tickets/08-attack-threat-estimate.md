# 08 — Menace estimée avant attaque

**Statut** : idée à approfondir  
**Ratio bénéfice / coût** : bon si l'estimation reste simple

## Opportunité

Un joueur peut envoyer une attaque absurde faute de lecture claire : cible trop loin, défense inconnue, scout absent, mauvais ratio. Le jeu peut aider sans devenir un simulateur parfait.

## Piste

Avant l'envoi, afficher une estimation :

- Inconnue : pas assez d'information.
- Faible : cible probablement prenable.
- Moyenne : pertes possibles.
- Élevée : risque fort.

Sources possibles :

- puissance bâtiment publique ;
- dernier rapport de scout ;
- distance / temps de trajet ;
- taille et composition de l'armée envoyée ;
- type de cible : barbare, joueur, site d'exploitation.

## Bénéfice joueur

Réduit les erreurs frustrantes. Rend le combat plus lisible pour mobile. Encourage le scout sans forcer.

## Garde-fous

- Ne pas afficher une prédiction exacte.
- Ne pas garantir la victoire.
- Laisser "inconnue" si la donnée manque.
- Mentionner si l'estimation dépend d'un scout obsolète.

## Points à trancher

- Estimation en texte, icône, couleur, ou les trois ?
- Doit-elle exister en PvP dès le MVP ?
- Quelle fraîcheur max pour un scout utilisé dans le calcul ?
- Même système pour raids, conquêtes et sites d'exploitation ?

